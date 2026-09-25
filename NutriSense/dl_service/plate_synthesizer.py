import os
import sys
import json
import random
from pathlib import Path
from typing import List, Tuple, Dict, Any
import numpy as np
from PIL import Image, ImageEnhance, ImageOps

from dataset_utils import scan_dataset, get_active_classes, DATASET_ROOT

PLATE_SIZE = (300, 300)

def create_background_textures() -> List[Image.Image]:
    """
    Generates diverse realistic background textures (steel thali, ceramic plate, banana leaf, wood table).
    """
    w, h = PLATE_SIZE
    textures = []

    # 1. Stainless Steel Thali (Silver / Metallic Radial Gradient)
    thali = Image.new("RGB", (w, h), (210, 212, 215))
    np_thali = np.array(thali, dtype=np.float32)
    y, x = np.ogrid[:h, :w]
    center_y, center_x = h / 2.0, w / 2.0
    dist_from_center = np.sqrt((x - center_x) ** 2 + (y - center_y) ** 2)
    max_radius = np.sqrt(center_x ** 2 + center_y ** 2)
    radial = 1.0 - 0.25 * (dist_from_center / max_radius)
    np_thali = np.clip(np_thali * radial[..., np.newaxis], 0, 255).astype(np.uint8)
    textures.append(Image.fromarray(np_thali))

    # 2. Banana Leaf (Lush Organic Green with subtle veins)
    leaf = Image.new("RGB", (w, h), (42, 128, 48))
    np_leaf = np.array(leaf, dtype=np.float32)
    noise = np.random.normal(0, 8, np_leaf.shape)
    np_leaf = np.clip(np_leaf + noise, 0, 255).astype(np.uint8)
    textures.append(Image.fromarray(np_leaf))

    # 3. Dark Dining Wood Table
    wood = Image.new("RGB", (w, h), (72, 48, 32))
    np_wood = np.array(wood, dtype=np.float32)
    grain = np.sin(np.linspace(0, 15, h)) * 12
    np_wood += grain[:, np.newaxis, np.newaxis]
    np_wood = np.clip(np_wood, 0, 255).astype(np.uint8)
    textures.append(Image.fromarray(np_wood))

    # 4. Ceramic White / Cream Plate
    ceramic = Image.new("RGB", (w, h), (245, 243, 238))
    textures.append(ceramic)

    return textures

class PlateSynthesizer:
    def __init__(self):
        self.image_paths, self.labels, self.classes = scan_dataset()
        self.class_to_paths = {}
        for p, l in zip(self.image_paths, self.labels):
            self.class_to_paths.setdefault(l, []).append(p)
        self.textures = create_background_textures()
        print(f"[Synthesizer] Loaded {len(self.image_paths)} source images across {len(self.classes)} classes.")

    def generate_sample(
        self,
        num_items: int = None
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Synthesizes a meal plate scene with 1 to 4 distinct items.
        Returns:
            image: np.ndarray (300, 300, 3) float32 normalized [-1, 1]
            boxes: np.ndarray (N, 4) [ymin, xmin, ymax, xmax] in 0..1
            classes: np.ndarray (N,) int32 class IDs (1..28)
        """
        if num_items is None:
            # 50% single-item, 35% 2-item, 15% 3-item
            r = random.random()
            if r < 0.50:
                num_items = 1
            elif r < 0.85:
                num_items = 2
            else:
                num_items = 3

        bg = random.choice(self.textures).copy()
        w, h = PLATE_SIZE

        chosen_classes = random.sample(range(len(self.classes)), num_items)
        boxes = []
        labels = []

        # Position grids for non-overlapping placement
        if num_items == 1:
            # Centered or slightly offset
            slots = [(0.15, 0.15, 0.85, 0.85)]
        elif num_items == 2:
            # Side-by-side or stacked
            if random.random() < 0.5:
                slots = [
                    (0.12, 0.06, 0.88, 0.48),
                    (0.12, 0.52, 0.88, 0.94)
                ]
            else:
                slots = [
                    (0.06, 0.12, 0.48, 0.88),
                    (0.52, 0.12, 0.94, 0.88)
                ]
        else:
            # Thali arrangement (3 dishes)
            slots = [
                (0.08, 0.08, 0.48, 0.48),
                (0.08, 0.52, 0.48, 0.92),
                (0.52, 0.20, 0.92, 0.80)
            ]

        for cls_idx, (ymin, xmin, ymax, xmax) in zip(chosen_classes, slots):
            img_path = random.choice(self.class_to_paths[cls_idx])
            try:
                item_img = Image.open(img_path).convert("RGB")
            except Exception:
                continue

            # Random slight scale and jitter within slot
            target_w = int((xmax - xmin) * w)
            target_h = int((ymax - ymin) * h)

            # Keep aspect ratio
            item_img.thumbnail((target_w, target_h), Image.Resampling.BILINEAR)
            iw, ih = item_img.size

            # Random shift inside the slot boundary
            max_dx = max(0, target_w - iw)
            max_dy = max(0, target_h - ih)
            offset_x = int(xmin * w) + (random.randint(0, max_dx) if max_dx > 0 else 0)
            offset_y = int(ymin * h) + (random.randint(0, max_dy) if max_dy > 0 else 0)

            # Paste onto background plate
            bg.paste(item_img, (offset_x, offset_y))

            # Record exact ground truth bounding box [ymin, xmin, ymax, xmax]
            b_ymin = offset_y / h
            b_xmin = offset_x / w
            b_ymax = (offset_y + ih) / h
            b_xmax = (offset_x + iw) / w

            boxes.append([b_ymin, b_xmin, b_ymax, b_xmax])
            # 1-indexed for SSD (0 is reserved for background)
            labels.append(cls_idx + 1)

        # Convert to numpy array & scale [-1, 1]
        arr = np.array(bg, dtype=np.float32)
        arr = (arr / 127.5) - 1.0

        return arr, np.array(boxes, dtype=np.float32), np.array(labels, dtype=np.int32)

if __name__ == "__main__":
    synthesizer = PlateSynthesizer()
    img, boxes, labels = synthesizer.generate_sample(num_items=2)
    print(f"Synthesized scene shape: {img.shape}")
    print(f"Ground-truth boxes ({len(boxes)}): {boxes}")
    print(f"Ground-truth classes: {labels} -> {[synthesizer.classes[idx - 1] for idx in labels]}")
