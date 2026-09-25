import os
import sys
import json
import time
from pathlib import Path
from PIL import Image
import numpy as np
import cv2

def compute_iou_xyxy(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    interW = max(0.0, xB - xA)
    interH = max(0.0, yB - yA)
    interArea = interW * interH

    boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
    boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
    unionArea = boxAArea + boxBArea - interArea
    if unionArea <= 0:
        return 0.0
    return interArea / unionArea

def nms_boxes(boxes, scores, iou_thresh=0.4):
    if len(boxes) == 0:
        return []
    boxes = np.array(boxes, dtype=np.float32)
    scores = np.array(scores, dtype=np.float32)
    x1 = boxes[:, 0]
    y1 = boxes[:, 1]
    x2 = boxes[:, 2]
    y2 = boxes[:, 3]
    areas = (x2 - x1) * (y2 - y1)
    order = scores.argsort()[::-1]
    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(i)
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        w = np.maximum(0.0, xx2 - xx1)
        h = np.maximum(0.0, yy2 - yy1)
        inter = w * h
        ovr = inter / (areas[i] + areas[order[1:]] - inter)
        inds = np.where(ovr <= iou_thresh)[0]
        order = order[inds + 1]
    return [boxes[k].tolist() for k in keep]

def propose_regions_opencv(
    image: np.ndarray,
    min_area_frac: float = 0.02,
    max_area_frac: float = 0.75,
    min_aspect: float = 0.35,
    max_aspect: float = 2.8,
    use_watershed: bool = True
):
    """
    Class-agnostic region proposal using multi-scale edge & chromatic saliency + watershed.
    image: BGR numpy array (H, W, 3)
    Returns: List of [xmin, ymin, xmax, ymax] in normalized coordinates [0..1]
    """
    H, W = image.shape[:2]
    total_area = float(H * W)
    raw_boxes = []
    box_scores = []

    # 1. Color saliency in LAB space (separates luminance from chromaticity)
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_chan, a_chan, b_chan = cv2.split(lab)

    # Estimate plate / background color from 4 borders
    border_mask = np.zeros((H, W), dtype=bool)
    b_margin_y = max(2, int(H * 0.04))
    b_margin_x = max(2, int(W * 0.04))
    border_mask[:b_margin_y, :] = True
    border_mask[-b_margin_y:, :] = True
    border_mask[:, :b_margin_x] = True
    border_mask[:, -b_margin_x:] = True

    med_a = np.median(a_chan[border_mask])
    med_b = np.median(b_chan[border_mask])
    chroma_diff = np.sqrt((a_chan - med_a) ** 2 + (b_chan - med_b) ** 2)
    chroma_norm = cv2.normalize(chroma_diff, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

    # 2. Gradient / Edge saliency
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (7, 7), 0)
    edges = cv2.Canny(blurred, 30, 100)

    # Combined saliency map
    saliency = cv2.addWeighted(chroma_norm, 0.65, edges, 0.35, 0)

    # Multi-threshold binarization to capture both subtle gravies and sharp discrete items
    thresholds = [
        ("otsu", cv2.threshold(saliency, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]),
        ("adaptive", cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 4)),
        ("chroma_mid", cv2.threshold(chroma_norm, 40, 255, cv2.THRESH_BINARY)[1])
    ]

    for name, bin_mask in thresholds:
        # Morphological close to join contiguous food textures
        for k_size in [15, 25]:
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k_size, k_size))
            closed = cv2.morphologyEx(bin_mask, cv2.MORPH_CLOSE, kernel, iterations=1)
            opened = cv2.morphologyEx(closed, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)), iterations=1)

            contours, _ = cv2.findContours(opened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for cnt in contours:
                area = cv2.contourArea(cnt)
                frac = area / total_area
                if min_area_frac <= frac <= max_area_frac:
                    x, y, w, h = cv2.boundingRect(cnt)
                    aspect = w / max(float(h), 1.0)
                    if min_aspect <= aspect <= max_aspect:
                        # Slight padding for context
                        pad_x = int(w * 0.06)
                        pad_y = int(h * 0.06)
                        x1 = max(0, x - pad_x) / W
                        y1 = max(0, y - pad_y) / H
                        x2 = min(W, x + w + pad_x) / W
                        y2 = min(H, y + h + pad_y) / H
                        raw_boxes.append([x1, y1, x2, y2])
                        box_scores.append(float(frac))

    # 3. Watershed segmentation for touching / overlapping items
    if use_watershed:
        try:
            # Use distance transform on the OTSU binary mask
            bin_base = thresholds[0][1]
            dist_trans = cv2.distanceTransform(bin_base, cv2.DIST_L2, 5)
            _, sure_fg = cv2.threshold(dist_trans, 0.35 * dist_trans.max(), 255, 0)
            sure_fg = np.uint8(sure_fg)

            unknown = cv2.subtract(bin_base, sure_fg)
            _, markers = cv2.connectedComponents(sure_fg)
            markers = markers + 1
            markers[unknown == 255] = 0

            cv_img_copy = image.copy()
            cv2.watershed(cv_img_copy, markers)

            for marker_id in np.unique(markers):
                if marker_id <= 1:  # 0: unknown boundary, 1: background
                    continue
                mask_id = np.uint8(markers == marker_id)
                cnts, _ = cv2.findContours(mask_id, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                for cnt in cnts:
                    area = cv2.contourArea(cnt)
                    frac = area / total_area
                    if min_area_frac <= frac <= max_area_frac:
                        x, y, w, h = cv2.boundingRect(cnt)
                        aspect = w / max(float(h), 1.0)
                        if min_aspect <= aspect <= max_aspect:
                            pad_x = int(w * 0.05)
                            pad_y = int(h * 0.05)
                            x1 = max(0, x - pad_x) / W
                            y1 = max(0, y - pad_y) / H
                            x2 = min(W, x + w + pad_x) / W
                            y2 = min(H, y + h + pad_y) / H
                            raw_boxes.append([x1, y1, x2, y2])
                            box_scores.append(float(frac) * 1.2)  # slightly higher weight for watershed
        except Exception:
            pass

    # 4. Multi-scale sliding window fallback / grid prior to guarantee small & edge items
    # Scales: 0.35, 0.50 with 50% stride
    for s_w, s_h in [(0.40, 0.40), (0.50, 0.50)]:
        for gx in np.linspace(0.04, 1.0 - s_w - 0.04, 3):
            for gy in np.linspace(0.04, 1.0 - s_h - 0.04, 3):
                # Check if region has high internal variance (food texture vs plain plate)
                rx1, ry1 = int(gx * W), int(gy * H)
                rx2, ry2 = int((gx + s_w) * W), int((gy + s_h) * H)
                crop_gray = gray[ry1:ry2, rx1:rx2]
                if crop_gray.size > 0:
                    std = np.std(crop_gray)
                    # If high variance / not flat background, include candidate
                    if std > 28.0:
                        raw_boxes.append([gx, gy, gx + s_w, gy + s_h])
                        box_scores.append(0.35)

    # 5. Filter & Non-maximum suppression over candidate boxes
    keep_boxes = nms_boxes(raw_boxes, box_scores, iou_thresh=0.55)
    return raw_boxes, keep_boxes

if __name__ == "__main__":
    eval_json = Path("scratch/eval_suite/eval_suite.json")
    with open(eval_json, "r", encoding="utf-8") as f:
        suite = json.load(f)

    total_gt = 0
    recalled_gt = 0

    print("Evaluating Proposed OpenCV Region Proposal on Test Suite:")
    print("=" * 65)

    for case in suite:
        img_bgr = cv2.imread(case["image_path"])
        ground_truth = case["ground_truth"]
        total_gt += len(ground_truth)

        t0 = time.perf_counter()
        raw_b, keep_b = propose_regions_opencv(img_bgr)
        dt = (time.perf_counter() - t0) * 1000.0

        # Check proposal recall (is there a proposal with IoU >= 0.40 for each ground truth box?)
        case_recalled = 0
        for gt in ground_truth:
            gt_box = gt["bbox_norm"]
            max_iou = max([compute_iou_xyxy(p, gt_box) for p in keep_b]) if keep_b else 0.0
            if max_iou >= 0.40:
                case_recalled += 1

        recalled_gt += case_recalled
        print(f"Case: {case['id']} | Raw: {len(raw_b)} -> Filtered: {len(keep_b)} | GT Recalled: {case_recalled}/{len(ground_truth)} | Time: {dt:.1f}ms")

    recall_rate = recalled_gt / total_gt
    print("=" * 65)
    print(f"Proposal Recall on Ground Truth Food Regions: {recall_rate*100:.1f}% ({recalled_gt}/{total_gt})")
