import sys
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path("dl_service").resolve()))
from inference import FoodClassifier
from test_proposals import propose_regions_opencv, compute_iou_xyxy

classifier = FoodClassifier()
eval_json = Path("scratch/eval_suite/eval_suite.json")
with open(eval_json, "r", encoding="utf-8") as f:
    suite = json.load(f)

for case in suite:
    img_bgr = cv2.imread(case["image_path"])
    H, W = img_bgr.shape[:2]
    raw_b, keep_b = propose_regions_opencv(img_bgr)

    tensors = []
    for x1, y1, x2, y2 in keep_b:
        crop_bgr = img_bgr[int(y1*H):int(y2*H), int(x1*W):int(x2*W)]
        crop_rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
        crop_pil = Image.fromarray(crop_rgb).resize((224, 224), Image.Resampling.BILINEAR)
        arr = np.array(crop_pil, dtype=np.float32)
        arr = (arr / 127.5) - 1.0
        tensors.append(arr)

    preds = classifier.model.predict(np.array(tensors), verbose=0)
    top_indices = np.argmax(preds, axis=1)
    top_confs = np.max(preds, axis=1)

    print(f"\nCase: {case['id']}")
    for i, (box, idx, conf) in enumerate(zip(keep_b, top_indices, top_confs)):
        cls_name = classifier.classes[idx]
        print(f"  Crop {i}: [{box[0]:.2f}, {box[1]:.2f}, {box[2]:.2f}, {box[3]:.2f}] -> {cls_name} (conf={conf:.2f})")
