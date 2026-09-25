import os
import sys
import json
import random
from pathlib import Path
from PIL import Image
import numpy as np

sys.path.insert(0, str(Path("dl_service").resolve()))
from dataset_utils import scan_dataset, CLASSES_JSON_PATH

EVAL_DIR = Path("scratch/eval_suite")
EVAL_DIR.mkdir(parents=True, exist_ok=True)

with open(CLASSES_JSON_PATH, "r", encoding="utf-8") as f:
    classes_meta = json.load(f)["classes"]

class_to_folder = {c["id"]: c["folderName"] for c in classes_meta}
folder_to_meta = {c["folderName"]: c for c in classes_meta}

image_paths, labels, class_names = scan_dataset()
folder_to_images = {}
for p, l in zip(image_paths, labels):
    c_name = class_names[l]
    folder_to_images.setdefault(c_name, []).append(p)

# Background creators
def create_plate_bg(width=640, height=640, bg_type="steel"):
    if bg_type == "steel":
        bg = Image.new("RGB", (width, height), (210, 214, 218))
        np_bg = np.array(bg, dtype=np.float32)
        y, x = np.ogrid[:height, :width]
        dist = np.sqrt((x - width / 2.0) ** 2 + (y - height / 2.0) ** 2)
        max_r = np.sqrt((width / 2.0) ** 2 + (height / 2.0) ** 2)
        radial = 1.0 - 0.28 * (dist / max_r)
        np_bg = np.clip(np_bg * radial[..., np.newaxis], 0, 255).astype(np.uint8)
        return Image.fromarray(np_bg)
    elif bg_type == "banana_leaf":
        bg = Image.new("RGB", (width, height), (38, 118, 45))
        np_bg = np.array(bg, dtype=np.float32)
        noise = np.random.normal(0, 10, np_bg.shape)
        return Image.fromarray(np.clip(np_bg + noise, 0, 255).astype(np.uint8))
    elif bg_type == "wood":
        bg = Image.new("RGB", (width, height), (78, 52, 36))
        np_bg = np.array(bg, dtype=np.float32)
        grain = np.sin(np.linspace(0, 20, height)) * 14
        np_bg += grain[:, np.newaxis, np.newaxis]
        return Image.fromarray(np.clip(np_bg, 0, 255).astype(np.uint8))
    else:  # ceramic
        return Image.new("RGB", (width, height), (246, 244, 240))

# 7 test cases specified in prompt:
# 1. two-item combo
# 2. four-item combo
# 3. three-item combo including a liquid/gravy item
# 4. combo including a discrete-countable item (e.g. 3 of the same item)
# 5. combo with a rice/grain base plus sides
# 6. two-item combo with a flatbread
# 7. combo with a fried/snack item plus a condiment

test_configs = [
    {
        "id": "case_1_two_item_combo",
        "title": "Two-item combo (Apple + Banana)",
        "bg": "ceramic",
        "items": [
            {"folder": "apple", "box_norm": [0.08, 0.15, 0.45, 0.85]},
            {"folder": "banana", "box_norm": [0.52, 0.15, 0.90, 0.85]}
        ]
    },
    {
        "id": "case_2_four_item_combo",
        "title": "Four-item combo (Biriyani, Beetroot Poriyal, Boiled Egg, Puthina Chutney)",
        "bg": "steel",
        "items": [
            {"folder": "biriyani", "box_norm": [0.06, 0.06, 0.48, 0.48]},
            {"folder": "beetroot poriyal", "box_norm": [0.52, 0.06, 0.94, 0.48]},
            {"folder": "boiled egg", "box_norm": [0.06, 0.52, 0.48, 0.94]},
            {"folder": "puthina chutney", "box_norm": [0.52, 0.52, 0.94, 0.94]}
        ]
    },
    {
        "id": "case_3_three_item_gravy",
        "title": "Three-item combo with gravy (Ven Pongal, Sambar, Medu Vada)",
        "bg": "banana_leaf",
        "items": [
            {"folder": "ven pongal", "box_norm": [0.08, 0.10, 0.50, 0.55]},
            {"folder": "sambar", "box_norm": [0.55, 0.10, 0.92, 0.55]},
            {"folder": "medu vada", "box_norm": [0.22, 0.58, 0.78, 0.92]}
        ]
    },
    {
        "id": "case_4_discrete_countable",
        "title": "Discrete-countable combo (3 Idly + Sambar)",
        "bg": "steel",
        "items": [
            {"folder": "idly", "box_norm": [0.08, 0.08, 0.45, 0.48]},
            {"folder": "idly", "box_norm": [0.08, 0.52, 0.45, 0.92]},
            {"folder": "idly", "box_norm": [0.52, 0.08, 0.90, 0.48]},
            {"folder": "sambar", "box_norm": [0.52, 0.52, 0.90, 0.92]}
        ]
    },
    {
        "id": "case_5_rice_sides",
        "title": "Rice base with sides (Sadham, Sambar Sadham, Carrot Poriyal, Parupu Vadai)",
        "bg": "banana_leaf",
        "items": [
            {"folder": "sadham", "box_norm": [0.10, 0.10, 0.55, 0.55]},
            {"folder": "carrot poriyal", "box_norm": [0.60, 0.08, 0.92, 0.45]},
            {"folder": "sambar sadham", "box_norm": [0.58, 0.52, 0.92, 0.92]},
            {"folder": "parupu vadai", "box_norm": [0.12, 0.60, 0.50, 0.92]}
        ]
    },
    {
        "id": "case_6_flatbread_combo",
        "title": "Two-item flatbread combo (Chappathi + Panneer Masal)",
        "bg": "wood",
        "items": [
            {"folder": "chappathi", "box_norm": [0.08, 0.10, 0.52, 0.90]},
            {"folder": "panneer masal", "box_norm": [0.55, 0.15, 0.92, 0.85]}
        ]
    },
    {
        "id": "case_7_snack_condiment",
        "title": "Fried snack plus condiment (Samosa, Murukku, Puthina Chutney)",
        "bg": "ceramic",
        "items": [
            {"folder": "samosa", "box_norm": [0.08, 0.10, 0.50, 0.60]},
            {"folder": "murukku", "box_norm": [0.52, 0.10, 0.92, 0.60]},
            {"folder": "puthina chutney", "box_norm": [0.28, 0.62, 0.72, 0.92]}
        ]
    }
]

eval_suite_meta = []
W, H = 640, 640

for cfg in test_configs:
    bg_img = create_plate_bg(W, H, cfg["bg"])
    ground_truth = []

    for item in cfg["items"]:
        folder = item["folder"]
        img_list = folder_to_images.get(folder, [])
        if not img_list:
            print(f"Warning: No images found for {folder}")
            continue
        src_path = random.choice(img_list)
        src_img = Image.open(src_path).convert("RGB")

        ymin_n, xmin_n, ymax_n, xmax_n = item["box_norm"]
        bx = int(xmin_n * W)
        by = int(ymin_n * H)
        bw = int((xmax_n - xmin_n) * W)
        bh = int((ymax_n - ymin_n) * H)

        # Resize food image to slot
        src_img = src_img.resize((bw, bh), Image.Resampling.BILINEAR)
        bg_img.paste(src_img, (bx, by))

        meta = folder_to_meta[folder]
        ground_truth.append({
            "folder": folder,
            "dish_name": folder,
            "canonical_id": meta["id"],
            "name": meta["name"],
            "bbox_norm": [round(xmin_n, 4), round(ymin_n, 4), round(xmax_n, 4), round(ymax_n, 4)],
            "bbox_xywh": [bx, by, bw, bh]
        })

    img_path = EVAL_DIR / f"{cfg['id']}.jpg"
    bg_img.save(img_path, quality=95)

    eval_suite_meta.append({
        "id": cfg["id"],
        "title": cfg["title"],
        "bg": cfg["bg"],
        "image_path": str(img_path.as_posix()),
        "ground_truth": ground_truth
    })

meta_path = EVAL_DIR / "eval_suite.json"
with open(meta_path, "w", encoding="utf-8") as f:
    json.dump(eval_suite_meta, f, indent=2)

print(f"Generated {len(eval_suite_meta)} evaluation test plates in {EVAL_DIR}")
