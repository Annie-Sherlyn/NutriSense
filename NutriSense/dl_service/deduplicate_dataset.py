import os
import hashlib
from pathlib import Path
from collections import defaultdict

DATASET_ROOT = Path("d:/NutriSense/Dataset")

def deduplicate():
    print("=" * 60)
    print("NutriSense Dataset Deduplication")
    print(f"Scanning: {DATASET_ROOT.resolve()}")
    print("=" * 60)

    hash_map = defaultdict(list)
    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    total_scanned = 0

    for cat_dir in sorted(DATASET_ROOT.iterdir()):
        if not cat_dir.is_dir():
            continue
        for dish_dir in sorted(cat_dir.iterdir()):
            if not dish_dir.is_dir():
                continue
            for img_path in sorted(dish_dir.iterdir()):
                if img_path.is_file() and img_path.suffix.lower() in valid_exts:
                    total_scanned += 1
                    with open(img_path, "rb") as f:
                        file_hash = hashlib.sha256(f.read()).hexdigest()
                    hash_map[file_hash].append(img_path)

    deleted_count = 0
    dish_deletions = defaultdict(int)

    for file_hash, paths in hash_map.items():
        if len(paths) > 1:
            # Keep the first path as canonical
            canonical = paths[0]
            duplicates = paths[1:]
            for dup in duplicates:
                dish_name = dup.parent.name
                try:
                    dup.unlink()
                    deleted_count += 1
                    dish_deletions[dish_name] += 1
                except Exception as e:
                    print(f"Failed to remove {dup}: {e}")

    print(f"\nScan completed:")
    print(f"  Total images scanned: {total_scanned}")
    print(f"  Unique images preserved: {total_scanned - deleted_count}")
    print(f"  Exact duplicates removed: {deleted_count}")
    print("\nDeletions per dish folder:")
    for dish, count in sorted(dish_deletions.items()):
        print(f"  - {dish}: {count} duplicates removed")

    print("\nDataset deduplication finished successfully!")

if __name__ == "__main__":
    deduplicate()
