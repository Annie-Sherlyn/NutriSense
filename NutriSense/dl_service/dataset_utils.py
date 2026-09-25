import os
import json
from pathlib import Path
from typing import List, Tuple, Dict, Any
import numpy as np
from PIL import Image

DATASET_ROOT = Path("d:/NutriSense/Dataset")
CLASSES_JSON_PATH = Path("d:/NutriSense/dl_service/classes.json")
IMG_SIZE = (224, 224)

def load_class_metadata() -> Dict[str, Any]:
    with open(CLASSES_JSON_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def get_active_classes() -> List[str]:
    data = load_class_metadata()
    return [item["folderName"] for item in data["classes"]]

def scan_dataset(dataset_dir: Path = DATASET_ROOT) -> Tuple[List[str], List[int], List[str]]:
    """
    Scans the Dataset directory for all valid image files belonging to the 28 active classes.
    Returns:
        image_paths: List of absolute paths to valid images
        labels: Integer label index corresponding to classes.json
        class_names: List of class names
    """
    active_classes = get_active_classes()
    class_to_idx = {name: idx for idx, name in enumerate(active_classes)}
    
    image_paths: List[str] = []
    labels: List[int] = []

    valid_extensions = {".jpg", ".jpeg", ".png", ".webp"}

    for meal_type in dataset_dir.iterdir():
        if not meal_type.is_dir():
            continue
        for dish_dir in meal_type.iterdir():
            if not dish_dir.is_dir():
                continue
            dish_name = dish_dir.name
            if dish_name not in class_to_idx:
                continue

            class_idx = class_to_idx[dish_name]
            for img_file in dish_dir.iterdir():
                if img_file.is_file() and img_file.suffix.lower() in valid_extensions:
                    image_paths.append(str(img_file))
                    labels.append(class_idx)

    return image_paths, labels, active_classes

def compute_class_weights(labels: List[int], num_classes: int) -> Dict[int, float]:
    """
    Computes balanced class weights inversely proportional to class frequencies.
    Prevents dominant classes (e.g. Idli 752 images) from overwhelming minority classes (e.g. Mysore Pak 50 images).
    """
    counts = np.bincount(labels, minlength=num_classes)
    total_samples = len(labels)
    weights = {}
    for i in range(num_classes):
        if counts[i] > 0:
            weights[i] = float(total_samples / (num_classes * counts[i]))
        else:
            weights[i] = 1.0
    return weights

def load_and_preprocess_image(path: str, target_size: Tuple[int, int] = IMG_SIZE) -> np.ndarray:
    """
    Loads an image from disk, converts to RGB, resizes to target_size,
    and normalizes pixel values to [-1, 1] suitable for MobileNetV2.
    """
    with Image.open(path) as img:
        img = img.convert("RGB")
        img = img.resize(target_size, Image.Resampling.BILINEAR)
        arr = np.array(img, dtype=np.float32)
        # MobileNetV2 expects values in [-1, 1]
        arr = (arr / 127.5) - 1.0
        return arr

if __name__ == "__main__":
    paths, labels, classes = scan_dataset()
    print(f"Scanned {len(paths)} valid images across {len(classes)} active classes.")
    weights = compute_class_weights(labels, len(classes))
    print(f"Class weights computed for {len(weights)} classes.")
    sample = load_and_preprocess_image(paths[0])
    print(f"Sample image preprocessed successfully with shape {sample.shape}, min={sample.min():.2f}, max={sample.max():.2f}")
