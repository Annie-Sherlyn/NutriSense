import os
import sys
import json
import argparse
from pathlib import Path
import numpy as np
import tensorflow as tf
import keras
from keras import layers
from keras.applications import MobileNetV2

from dataset_utils import scan_dataset, compute_class_weights, get_active_classes, IMG_SIZE

CHECKPOINT_DIR = Path("d:/NutriSense/dl_service/checkpoints")
CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
BEST_MODEL_PATH = CHECKPOINT_DIR / "best_food_model.keras"
HISTORY_PATH = CHECKPOINT_DIR / "training_history.json"

def build_model(num_classes: int = 28, input_shape: tuple = (224, 224, 3)) -> keras.Model:
    """
    Builds a transfer learning model with MobileNetV2 backbone.
    """
    inputs = keras.Input(shape=input_shape)
    
    # Real-time data augmentation
    x = layers.RandomFlip("horizontal")(inputs)
    x = layers.RandomRotation(0.1)(x)
    x = layers.RandomZoom(0.1)(x)
    x = layers.RandomContrast(0.1)(x)

    # Pretrained MobileNetV2 backbone (feature extractor)
    # Using imagenet weights if available, else standard architecture
    try:
        base_model = MobileNetV2(
            input_shape=input_shape,
            include_top=False,
            weights="imagenet"
        )
        base_model.trainable = False  # Freeze backbone for initial training
    except Exception as e:
        print(f"Notice: Loading MobileNetV2 without remote weights: {e}")
        base_model = MobileNetV2(
            input_shape=input_shape,
            include_top=False,
            weights=None
        )

    features = base_model(x)
    pooled = layers.GlobalAveragePooling2D()(features)
    dropped = layers.Dropout(0.35)(pooled)
    outputs = layers.Dense(num_classes, activation="softmax", dtype="float32", name="predictions")(dropped)

    model = keras.Model(inputs=inputs, outputs=outputs, name="nutrisense_food_classifier")
    return model

def create_tf_dataset(
    paths: list,
    labels: list,
    batch_size: int = 32,
    is_training: bool = True
) -> tf.data.Dataset:
    paths_tensor = tf.constant(paths)
    labels_tensor = tf.constant(labels, dtype=tf.int32)

    ds = tf.data.Dataset.from_tensor_slices((paths_tensor, labels_tensor))

    if is_training:
        ds = ds.shuffle(buffer_size=min(len(paths), 2000), seed=42)

    def _parse_image(path, label):
        img_bytes = tf.io.read_file(path)
        img = tf.io.decode_image(img_bytes, channels=3, expand_animations=False)
        img = tf.image.resize(img, IMG_SIZE)
        img.set_shape((*IMG_SIZE, 3))
        # Scale to [-1, 1] for MobileNetV2
        img = (tf.cast(img, tf.float32) / 127.5) - 1.0
        return img, label

    ds = ds.map(_parse_image, num_parallel_calls=tf.data.AUTOTUNE)
    ds = ds.batch(batch_size)
    ds = ds.prefetch(tf.data.AUTOTUNE)
    return ds

def train(
    epochs: int = 8,
    batch_size: int = 64,
    resume_path: str = None,
    from_scratch: bool = False,
    fine_tune_epochs: int = 0
):
    print("=" * 70)
    print("NutriSense Deep Learning Vision Training Pipeline")
    print("=" * 70)

    # 1. Scan dataset
    paths, labels, classes = scan_dataset()
    num_classes = len(classes)
    print(f"Loaded {len(paths)} images across {num_classes} classes.")

    # 2. Stratified 80/20 train/val split
    np.random.seed(42)
    indices = np.arange(len(paths))
    np.random.shuffle(indices)

    split_idx = int(0.8 * len(paths))
    train_indices = indices[:split_idx]
    val_indices = indices[split_idx:]

    train_paths = [paths[i] for i in train_indices]
    train_labels = [labels[i] for i in train_indices]
    val_paths = [paths[i] for i in val_indices]
    val_labels = [labels[i] for i in val_indices]

    print(f"Train samples: {len(train_paths)}, Validation samples: {len(val_paths)}")

    # 3. Compute balanced class weights
    class_weights = compute_class_weights(train_labels, num_classes)

    # 4. Prepare tf.data datasets
    train_ds = create_tf_dataset(train_paths, train_labels, batch_size=batch_size, is_training=True)
    val_ds = create_tf_dataset(val_paths, val_labels, batch_size=batch_size, is_training=False)

    # 5. Build or Resume model & Load Prior History
    prior_epochs = 0
    prior_history = {}
    if not from_scratch and HISTORY_PATH.exists():
        try:
            with open(HISTORY_PATH, "r", encoding="utf-8") as f:
                prev_data = json.load(f)
                prior_history = prev_data.get("history", {})
                prior_epochs = len(prior_history.get("accuracy", []))
                print(f"Prior training history loaded: {prior_epochs} epochs recorded.")
        except Exception as e:
            print(f"Notice: Could not read prior history: {e}")

    if from_scratch:
        print("\n[Mode] Building fresh MobileNetV2 architecture from scratch (no prior checkpoint)...")
        model = build_model(num_classes=num_classes)
        prior_epochs = 0
        prior_history = {}
    elif resume_path and os.path.isfile(resume_path):
        print(f"\nResuming training from checkpoint: {resume_path}")
        model = keras.models.load_model(resume_path)
        print("Successfully loaded existing model weights & optimizer state!")
    elif BEST_MODEL_PATH.exists():
        print(f"\nExisting best checkpoint found at {BEST_MODEL_PATH}. Loading to resume...")
        try:
            model = keras.models.load_model(str(BEST_MODEL_PATH))
            print("Loaded checkpoint successfully!")
        except Exception as err:
            print(f"Could not load checkpoint ({err}), building fresh model.")
            model = build_model(num_classes=num_classes)
            prior_epochs = 0
            prior_history = {}
    else:
        print("\nBuilding fresh MobileNetV2 architecture...")
        model = build_model(num_classes=num_classes)

    initial_learning_rate = 5e-4 if prior_epochs > 0 else 1e-3
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=initial_learning_rate),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )

    callbacks = [
        keras.callbacks.ModelCheckpoint(
            filepath=str(BEST_MODEL_PATH),
            monitor="val_accuracy",
            save_best_only=True,
            mode="max",
            verbose=1
        ),
        keras.callbacks.EarlyStopping(
            monitor="val_accuracy",
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=2,
            min_lr=1e-6,
            verbose=1
        )
    ]

    target_epochs = prior_epochs + epochs
    print(f"\nStarting training: Running {epochs} additional epochs (Epoch {prior_epochs + 1} to {target_epochs}) | Batch size: {batch_size}...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        initial_epoch=prior_epochs,
        epochs=target_epochs,
        class_weight=class_weights,
        callbacks=callbacks
    )

    # Merge prior and new training history
    combined_history = {}
    all_keys = set(list(prior_history.keys()) + list(history.history.keys()))
    for k in all_keys:
        prior_vals = [float(v) for v in prior_history.get(k, [])]
        new_vals = [float(v) for v in history.history.get(k, [])]
        combined_history[k] = prior_vals + new_vals

    final_train_acc = float(combined_history.get("accuracy", [0])[-1])
    final_val_acc = float(combined_history.get("val_accuracy", [0])[-1])
    best_val_acc = float(max(combined_history.get("val_accuracy", [0])))
    total_eps = len(combined_history.get("accuracy", []))

    history_record = {
        "final_train_accuracy": final_train_acc,
        "final_val_accuracy": final_val_acc,
        "best_val_accuracy": best_val_acc,
        "total_epochs": total_eps,
        "history": combined_history,
        "active_classes": classes,
        "num_classes": num_classes,
    }

    with open(HISTORY_PATH, "w", encoding="utf-8") as f:
        json.dump(history_record, f, indent=2)

    print("\n" + "=" * 70)
    print("NutriSense Deep Learning Vision Training - Full Epoch Summary")
    print("=" * 70)
    print(f"{'Epoch':<8}{'Train Loss':<14}{'Train Acc':<14}{'Val Loss':<14}{'Val Acc':<14}{'Notes'}")
    print("-" * 70)
    for ep in range(total_eps):
        t_loss = combined_history.get("loss", [0])[ep]
        t_acc = combined_history.get("accuracy", [0])[ep] * 100
        v_loss = combined_history.get("val_loss", [0])[ep]
        v_acc = combined_history.get("val_accuracy", [0])[ep] * 100
        note = "Prior (Yesterday)" if ep < prior_epochs else "Today"
        if abs(v_acc - best_val_acc * 100) < 1e-4:
            note += " [Best Val]"
        print(f"{ep + 1:<8}{t_loss:<14.4f}{t_acc:<13.2f}%{v_loss:<14.4f}{v_acc:<13.2f}%{note}")
    print("=" * 70)
    print(f"Total Epochs Completed : {total_eps}")
    print(f"Final Train Accuracy   : {final_train_acc * 100:.2f}%")
    print(f"Final Val Accuracy     : {final_val_acc * 100:.2f}%")
    print(f"Best Val Accuracy      : {best_val_acc * 100:.2f}%")
    print(f"Best checkpoint model  : {BEST_MODEL_PATH}")
    print(f"Full history saved to  : {HISTORY_PATH}")
    print("=" * 70)

    return model, history_record

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="NutriSense Food Classifier Trainer")
    parser.add_argument("--epochs", type=int, default=8, help="Number of additional epochs to train (default: 8)")
    parser.add_argument("--batch_size", type=int, default=64, help="Batch size")
    parser.add_argument("--resume", type=str, default=None, help="Path to checkpoint model to resume from")
    parser.add_argument("--scratch", action="store_true", help="Train from scratch with fresh MobileNetV2 weights")
    args = parser.parse_args()

    train(epochs=args.epochs, batch_size=args.batch_size, resume_path=args.resume, from_scratch=args.scratch)


