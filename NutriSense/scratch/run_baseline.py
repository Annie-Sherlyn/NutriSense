import os
import sys
import json
import time
from pathlib import Path
from typing import List, Dict, Any, Tuple
import numpy as np

sys.path.insert(0, str(Path("dl_service").resolve()))
from detector import FoodPlateDetector, compute_iou

def compute_iou_xyxy(boxA, boxB):
    # box: [xmin, ymin, xmax, ymax]
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

def run_baseline_evaluation():
    eval_json = Path("scratch/eval_suite/eval_suite.json")
    if not eval_json.exists():
        print("Error: eval_suite.json not found")
        return

    with open(eval_json, "r", encoding="utf-8") as f:
        suite = json.load(f)

    print("Initializing Unmodified Baseline FoodPlateDetector...")
    detector = FoodPlateDetector()

    results = []
    total_expected = 0
    total_detected = 0
    total_true_positives = 0
    total_correct_class = 0
    total_false_positives = 0
    total_duplicates = 0
    latencies = []

    per_class_stats = {}

    print("\n" + "=" * 75)
    print("RUNNING BASELINE EVALUATION ON MULTI-FOOD PLATES")
    print("=" * 75)

    for case in suite:
        img_path = case["image_path"]
        ground_truth = case["ground_truth"]
        n_expected = len(ground_truth)
        total_expected += n_expected

        for gt in ground_truth:
            c = gt["folder"]
            per_class_stats.setdefault(c, {"expected": 0, "detected": 0, "correct_class": 0})
            per_class_stats[c]["expected"] += 1

        t0 = time.perf_counter()
        det_result = detector.detect(img_path)
        dt = (time.perf_counter() - t0) * 1000.0
        latencies.append(dt)

        detected_items = det_result.get("detectedItems", [])
        total_detected += len(detected_items)

        # Match detected items to ground truth boxes using IoU >= 0.25
        matched_gt = set()
        matched_preds = set()
        tp_case = 0
        correct_class_case = 0
        dup_case = 0

        # Convert detected box [x, y, w, h] to [xmin, ymin, xmax, ymax]
        for pred_idx, pred in enumerate(detected_items):
            nb = pred.get("box", [0, 0, 1, 1])
            pred_box = [nb[0], nb[1], nb[0] + nb[2], nb[1] + nb[3]]
            pred_class = pred.get("datasetFolder", "").lower().strip()

            best_iou = 0.0
            best_gt_idx = -1
            for gt_idx, gt in enumerate(ground_truth):
                iou = compute_iou_xyxy(pred_box, gt["bbox_norm"])
                if iou > best_iou:
                    best_iou = iou
                    best_gt_idx = gt_idx

            if best_iou >= 0.25 and best_gt_idx >= 0:
                if best_gt_idx in matched_gt:
                    dup_case += 1
                else:
                    matched_gt.add(best_gt_idx)
                    matched_preds.add(pred_idx)
                    tp_case += 1
                    gt_class = ground_truth[best_gt_idx]["folder"].lower().strip()
                    per_class_stats[gt_class]["detected"] += 1
                    if pred_class == gt_class:
                        correct_class_case += 1
                        per_class_stats[gt_class]["correct_class"] += 1

        fp_case = len(detected_items) - tp_case - dup_case
        total_true_positives += tp_case
        total_correct_class += correct_class_case
        total_false_positives += fp_case
        total_duplicates += dup_case

        recall = tp_case / n_expected if n_expected > 0 else 0
        precision = tp_case / len(detected_items) if len(detected_items) > 0 else 0
        acc = correct_class_case / tp_case if tp_case > 0 else 0

        print(f"\nCase: {case['title']} ({case['id']})")
        print(f"  Expected: {n_expected} items {[gt['folder'] for gt in ground_truth]}")
        print(f"  Detected: {len(detected_items)} items {[d.get('datasetFolder') for d in detected_items]}")
        print(f"  Mode: {det_result.get('mode')} | isMultiItem: {det_result.get('isMultiItem')}")
        print(f"  TP: {tp_case}, FP: {fp_case}, Dup: {dup_case} | Latency: {dt:.1f}ms")
        for d in detected_items:
            print(f"    - {d.get('name')} (conf={d.get('confidence', 0):.2f}) at {d.get('box')}")

    overall_recall = total_true_positives / total_expected if total_expected > 0 else 0
    overall_precision = total_true_positives / total_detected if total_detected > 0 else 0
    overall_acc = total_correct_class / total_true_positives if total_true_positives > 0 else 0
    avg_latency = np.mean(latencies)

    print("\n" + "=" * 75)
    print("BASELINE OVERALL SUMMARY METRICS")
    print("=" * 75)
    print(f"Total Expected Items:    {total_expected}")
    print(f"Total Detected Items:    {total_detected}")
    print(f"True Positives:          {total_true_positives}")
    print(f"False Positives:         {total_false_positives}")
    print(f"Duplicates:              {total_duplicates}")
    print(f"Food Recall:             {overall_recall:.3f} ({overall_recall*100:.1f}%)")
    print(f"Food Precision:          {overall_precision:.3f} ({overall_precision*100:.1f}%)")
    print(f"Classification Accuracy: {overall_acc:.3f} ({overall_acc*100:.1f}%)")
    print(f"Avg Inference Latency:   {avg_latency:.1f} ms")
    print("=" * 75)

    baseline_record = {
        "total_expected": total_expected,
        "total_detected": total_detected,
        "true_positives": total_true_positives,
        "false_positives": total_false_positives,
        "duplicates": total_duplicates,
        "food_recall": round(overall_recall, 4),
        "food_precision": round(overall_precision, 4),
        "classification_accuracy": round(overall_acc, 4),
        "avg_latency_ms": round(avg_latency, 1),
        "per_class": per_class_stats
    }

    with open("scratch/baseline_results.json", "w", encoding="utf-8") as f:
        json.dump(baseline_record, f, indent=2)

if __name__ == "__main__":
    run_baseline_evaluation()
