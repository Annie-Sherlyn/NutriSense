import os
import sys
import json
import argparse
from pathlib import Path
from typing import List, Tuple, Dict, Any
import numpy as np
import tensorflow as tf
import keras
from keras import layers
from PIL import Image

sys.path.insert(0, str(Path("dl_service").resolve()))
from config import (
    DATASET_ROOT,
    CHECKPOINT_DIR,
    MODEL_CHECKPOINT_PATH,
    FINE_TUNED_MODEL_PATH,
    INPUT_IMAGE_SIZE,
    NON_FOOD_CLASS_NAME
)
from labels import LabelRegistry

CROPS_DIR = Path("scratch/crop_dataset")

def build_augmented_finetune_model(base_model_path: Path, num_classes: int = 29) -> keras.Model:
    """
    Builds fine-tuning model preserving existing MobileNetV2 backbone.
    Adds tight crop data augmentation:
    - Random translation/crop
    - Small rotation (0.08)
    - Random zoom (0.10)
    - Brightness / contrast jitter
    """
    inputs = keras.Input(shape=(*INPUT_IMAGE_SIZE, 3), name="crop_input")

    # Gentle real-time augmentation for crop robustness
    x = layers.RandomFlip("horizontal")(inputs)
    x = layers.RandomRotation(0.08)(x)
    x = layers.RandomZoom(0.08)(x)
    x = layers.RandomContrast(0.12)(x)
    x = layers.RandomTranslation(0.05, 0.05)(x)

    # Load pretrained model
    base_model = keras.models.load_model(str(base_model_path))

    # Find the feature extractor layer (GlobalAveragePooling2D output)
    feature_layer = None
    for l in base_model.layers:
        if isinstance(l, layers.GlobalAveragePooling2D) or l.name == "global_average_pooling2d":
            feature_layer = l
            break

    if feature_layer is not None:
        extractor = keras.Model(inputs=base_model.input, outputs=feature_layer.output)
    else:
        # Fallback to layer before final Dense
        extractor = keras.Model(inputs=base_model.input, outputs=base_model.layers[-2].output)

    extractor.trainable = False  # Keep backbone frozen for fast fine-tuning on CPU

    features = extractor(x)
    dropped = layers.Dropout(0.30)(features)
    outputs = layers.Dense(num_classes, activation="softmax", dtype="float32", name="predictions")(dropped)

    finetune_model = keras.Model(inputs=inputs, outputs=outputs, name="finetuned_crop_classifier")

    # Warm-start weights of original 28 classes from base model Dense layer
    try:
        old_dense = base_model.get_layer("predictions")
        old_w, old_b = old_dense.get_weights()
        new_dense = finetune_model.get_layer("predictions")

        # Initialize weights: copy 28 classes, randomize 29th (non_food)
        new_w = np.random.normal(0, 0.05, (old_w.shape[0], num_classes)).astype(np.float32)
        new_b = np.zeros(num_classes, dtype=np.float32)

        new_w[:, :28] = old_w
        new_b[:28] = old_b

        new_dense.set_weights([new_w, new_b])
        print("[Fine-Tune] Successfully transfer-initialized 28 existing class weights.")
    except Exception as e:
        print(f"[Fine-Tune] Notice: Could not directly transfer dense weights: {e}")

    return finetune_model

def collect_training_samples(registry: LabelRegistry) -> Tuple[List[str], List[int]]:
    """Collects paths and integer labels for all positive crops and background non-food crops."""
    paths: List[str] = []
    labels: List[int] = []

    # 1. Harvested crops
    for cls_dir in CROPS_DIR.iterdir():
        if not cls_dir.is_dir():
            continue
        c_name = cls_dir.name
        if c_name not in registry.folder_to_index:
            continue
        label_idx = registry.folder_to_index[c_name]
        for img_file in cls_dir.glob("*.jpg"):
            paths.append(str(img_file))
            labels.append(label_idx)

    # 2. Sample of original full dataset images for anchor stability (up to 20 per class)
    for c_name in registry.classes:
        if c_name == NON_FOOD_CLASS_NAME:
            continue
        label_idx = registry.folder_to_index[c_name]
        c_matches = list(DATASET_ROOT.rglob(f"{c_name}/*.jpg")) + list(DATASET_ROOT.rglob(f"{c_name}/*.png"))
        if c_matches:
            import random
            sub = c_matches if len(c_matches) <= 20 else random.sample(c_matches, 20)
            for f in sub:
                paths.append(str(f))
                labels.append(label_idx)

    return paths, labels

def create_dataset(paths: List[str], labels: List[int], batch_size: int = 64) -> tf.data.Dataset:
    paths_t = tf.constant(paths)
    labels_t = tf.constant(labels, dtype=tf.int32)

    ds = tf.data.Dataset.from_tensor_slices((paths_t, labels_t))
    ds = ds.shuffle(buffer_size=min(len(paths), 3000), seed=42)

    def _parse(path, label):
        bytes_ = tf.io.read_file(path)
        img = tf.io.decode_image(bytes_, channels=3, expand_animations=False)
        img = tf.image.resize(img, INPUT_IMAGE_SIZE)
        img.set_shape((*INPUT_IMAGE_SIZE, 3))
        # Normalize to [-1, 1]
        img = (tf.cast(img, tf.float32) / 127.5) - 1.0
        return img, label

    ds = ds.map(_parse, num_parallel_calls=tf.data.AUTOTUNE)
    ds = ds.batch(batch_size)
    ds = ds.prefetch(tf.data.AUTOTUNE)
    return ds

def run_finetuning(epochs: int = 5, batch_size: int = 64):
    print("=" * 70)
    print("NutriSense Classifier Fine-Tuning with OpenCV Crops & Non-Food Class")
    print("=" * 70)

    # Create registry with non_food included
    registry = LabelRegistry(include_non_food=True)
    num_classes = registry.num_classes
    print(f"Total Classes for Fine-Tuning: {num_classes} (28 food classes + 1 non_food)")

    paths, labels = collect_training_samples(registry)
    print(f"Loaded {len(paths)} training crop samples.")

    # Compute class weights to balance food vs non-food
    counts = np.bincount(labels, minlength=num_classes)
    total = len(labels)
    class_weights = {i: float(total / (num_classes * max(c, 1))) for i, c in enumerate(counts)}

    # Build model
    model = build_augmented_finetune_model(MODEL_CHECKPOINT_PATH, num_classes=num_classes)
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )

    train_ds = create_dataset(paths, labels, batch_size=batch_size)

    # Train for specified epochs
    history = model.fit(
        train_ds,
        epochs=epochs,
        class_weight=class_weights,
        verbose=1
    )

    # Save fine-tuned model checkpoint
    model.save(str(FINE_TUNED_MODEL_PATH))
    print(f"\n[Fine-Tune Complete] Saved fine-tuned model to: {FINE_TUNED_MODEL_PATH}")

    # Record training history
    hist_record = {
        "epochs": epochs,
        "total_samples": len(paths),
        "num_classes": num_classes,
        "final_accuracy": float(history.history["accuracy"][-1]),
        "final_loss": float(history.history["loss"][-1]),
        "history": {k: [float(v) for v in vals] for k, vals in history.history.items()}
    }
    with open(CHECKPOINT_DIR / "finetune_history.json", "w", encoding="utf-8") as f:
        json.dump(hist_record, f, indent=2)

    return hist_record

if __name__ == "__main__":
    run_finetuning(epochs=5, batch_size=64)
