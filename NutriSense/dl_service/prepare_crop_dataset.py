import os
import sys
import json
import random
from pathlib import Path
from PIL import Image
import numpy as np

sys.path.insert(0, str(Path("dl_service").resolve()))
from config import DATASET_ROOT, NON_FOOD_CLASS_NAME
from labels import labels_registry
from region_proposal import default_proposer
from dataset_utils import scan_dataset

CROPS_OUTPUT_DIR = Path("scratch/crop_dataset")
CROPS_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def harvest_dataset_crops(
    max_images_per_class: int = 35,
    num_pos_per_image: int = 2,
    num_bg_per_image: int = 1
):
    print("=" * 70)
    print("NutriSense OpenCV Training Crop & Background Harvester")
    print("=" * 70)

    image_paths, labels, class_names = scan_dataset()
    folder_to_images = {}
    for p, l in zip(image_paths, labels):
        c_name = class_names[l]
        folder_to_images.setdefault(c_name, []).append(p)

    non_food_dir = CROPS_OUTPUT_DIR / NON_FOOD_CLASS_NAME
    non_food_dir.mkdir(parents=True, exist_ok=True)

    total_pos_crops = 0
    total_bg_crops = 0

    class_crop_counts = {}

    for cls_name in class_names:
        cls_out_dir = CROPS_OUTPUT_DIR / cls_name
        cls_out_dir.mkdir(parents=True, exist_ok=True)

        images = folder_to_images.get(cls_name, [])
        sample_images = images if len(images) <= max_images_per_class else random.sample(images, max_images_per_class)

        pos_count = 0
        bg_count = 0

        for img_idx, img_path in enumerate(sample_images):
            pos_crops, bg_crops = default_proposer.harvest_training_crops(
                img_path,
                num_positive=num_pos_per_image,
                num_background=num_bg_per_image
            )

            for c_i, crop in enumerate(pos_crops):
                crop_name = f"{cls_name}_{img_idx}_{c_i}.jpg"
                crop.save(cls_out_dir / crop_name, quality=90)
                pos_count += 1
                total_pos_crops += 1

            for b_i, bg_crop in enumerate(bg_crops):
                bg_name = f"bg_{cls_name}_{img_idx}_{b_i}.jpg"
                bg_crop.save(non_food_dir / bg_name, quality=90)
                bg_count += 1
                total_bg_crops += 1

        class_crop_counts[cls_name] = pos_count
        print(f"Class '{cls_name}': Harvested {pos_count} positive crops and {bg_count} background crops.")

    print("=" * 70)
    print(f"Total Positive Crops Harvested: {total_pos_crops} across {len(class_names)} classes")
    print(f"Total Background Crops Harvested: {total_bg_crops} in '{NON_FOOD_CLASS_NAME}'")
    print("=" * 70)

    summary = {
        "total_positive_crops": total_pos_crops,
        "total_background_crops": total_bg_crops,
        "num_classes": len(class_names) + 1,
        "class_crop_counts": class_crop_counts
    }
    with open(CROPS_OUTPUT_DIR / "harvest_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    return summary

if __name__ == "__main__":
    harvest_dataset_crops()
