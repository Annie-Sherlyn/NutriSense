import logging
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

from config import (
    CONFIDENCE_HIGH,
    CONFIDENCE_MEDIUM,
    CONFIDENCE_LOW,
    IOU_NMS_THRESHOLD,
    CONTAINMENT_THRESHOLD,
    is_discrete_class,
    NON_FOOD_CLASS_NAME
)
from labels import labels_registry, LabelRegistry
from region_proposal import compute_iou_xyxy

logger = logging.getLogger("NutriSense.Vision.Postprocessor")

def compute_containment(boxA: List[float], boxB: List[float]) -> float:
    """Computes intersection relative to smaller box area (detects nested boxes)."""
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    interW = max(0.0, xB - xA)
    interH = max(0.0, yB - yA)
    interArea = interW * interH

    boxAArea = max(0.0, boxA[2] - boxA[0]) * max(0.0, boxA[3] - boxA[1])
    boxBArea = max(0.0, boxB[2] - boxB[0]) * max(0.0, boxB[3] - boxB[1])
    minArea = min(boxAArea, boxBArea)

    if minArea <= 0:
        return 0.0
    return interArea / minArea

class DetectionPostprocessor:
    """
    Postprocessor for candidate food region detections:
    - Filters out low confidence (< 0.50) and non-food background crops
    - Consolidates spatial duplicates via IoU NMS and nested containment
    - Groups multiple instances of discrete food items (quantity counting)
    - Sets quantity: null for non-discrete food items
    - Normalizes dish names to canonical identifiers
    - Produces the confirmation-payload JSON
    """
    def __init__(self, registry: LabelRegistry = labels_registry):
        self.registry = registry

    def process(
        self,
        raw_detections: List[Dict[str, Any]],
        img_w: int,
        img_h: int
    ) -> Dict[str, Any]:
        """
        raw_detections format:
        [
          {
             "box": [x1, y1, x2, y2],  # normalized 0..1
             "raw_class": str,
             "dish_name": str,
             "confidence": float,
             "is_non_food": bool,
             "candidates": list,
             "meta": dict
          }
        ]
        """
        # 1. Confidence & non-food filtering
        valid_items = []
        for det in raw_detections:
            conf = det["confidence"]
            raw_cls = det.get("raw_class", "")

            # Filter out explicit non-food class or sub-threshold noise
            if det.get("is_non_food") or raw_cls == NON_FOOD_CLASS_NAME:
                continue
            if conf < CONFIDENCE_LOW:
                continue

            valid_items.append(det)

        # Sort descending by confidence
        valid_items.sort(key=lambda x: x["confidence"], reverse=True)

        # 2. IoU NMS Duplicate Removal and Containment Suppression
        retained_items: List[Dict[str, Any]] = []
        for item in valid_items:
            item_box = item["box"]
            item_class = item["dish_name"]

            duplicate = False
            for chosen in retained_items:
                chosen_box = chosen["box"]
                chosen_class = chosen["dish_name"]
                iou = compute_iou_xyxy(item_box, chosen_box)
                containment = compute_containment(item_box, chosen_box)

                # Same class overlap -> duplicate
                if item_class == chosen_class:
                    if iou > IOU_NMS_THRESHOLD or containment > CONTAINMENT_THRESHOLD:
                        duplicate = True
                        break
                else:
                    # Different class but heavy overlap (likely bounding same physical food)
                    if iou > 0.40 or containment > 0.65:
                        duplicate = True
                        break

            if not duplicate:
                retained_items.append(item)

        # 3. Same-Food Grouping & Counting
        # Group by canonical dish_name
        grouped_by_dish: Dict[str, List[Dict[str, Any]]] = {}
        for item in retained_items:
            dish = item["dish_name"]
            grouped_by_dish.setdefault(dish, []).append(item)

        final_items = []
        any_needs_confirmation = False

        for dish, group in grouped_by_dish.items():
            raw_folder = group[0].get("raw_class", dish)
            discrete = is_discrete_class(raw_folder)

            # Determine instance count
            if discrete:
                quantity = len(group)
            else:
                quantity = None  # Non-discrete foods return portion/serving with user confirmation

            # Aggregate confidence (max or mean)
            best_det = max(group, key=lambda x: x["confidence"])
            conf = best_det["confidence"]

            # Target bbox [x1, y1, x2, y2]
            # If multiple discrete items, use the union bounding box or primary item box
            min_x = min(d["box"][0] for d in group)
            min_y = min(d["box"][1] for d in group)
            max_x = max(d["box"][2] for d in group)
            max_y = max(d["box"][3] for d in group)
            bbox = [round(min_x, 4), round(min_y, 4), round(max_x, 4), round(max_y, 4)]

            # Confidence states
            needs_confirm = (conf < CONFIDENCE_HIGH) or (quantity is None)
            if needs_confirm:
                any_needs_confirmation = True

            meta = group[0].get("meta") or self.registry.get_meta(raw_folder)
            display_name = meta.get("name", dish) if meta else dish

            final_items.append({
                "dish_name": dish,
                "confidence": round(conf, 4),
                "quantity": quantity,
                "bbox": bbox,
                "needs_confirmation": needs_confirm,
                # Extended metadata for UI & existing client compatibility
                "raw_class": raw_folder,
                "name": display_name,
                "regionalName": meta.get("regionalName", "") if meta else "",
                "estimatedKcal": meta.get("estimatedKcal", "") if meta else "",
                "image": meta.get("image", "/images/food/curry.svg") if meta else "/images/food/curry.svg",
                "id": meta.get("id", f"food-{dish}") if meta else f"food-{dish}",
                "instances_count": len(group)
            })

        # 4. Fallback Handling if nothing survived confidence filtering
        if not final_items:
            any_needs_confirmation = True
            # Attempt to pick the highest confidence valid food candidate (excluding non_food)
            food_candidates = [
                d for d in raw_detections
                if d.get("raw_class") != NON_FOOD_CLASS_NAME and not d.get("is_non_food", False)
            ]

            if food_candidates:
                best_raw = max(food_candidates, key=lambda x: x.get("confidence", 0))
                raw_folder = best_raw.get("raw_class", "unknown")
                meta = self.registry.get_meta(raw_folder)
                canonical_slug = self.registry.get_canonical_name(raw_folder)
                fallback_conf = best_raw.get("confidence", 0.35)

                final_items.append({
                    "dish_name": canonical_slug,
                    "confidence": round(fallback_conf, 4),
                    "quantity": None,
                    "bbox": [0.1, 0.1, 0.9, 0.9],
                    "needs_confirmation": True,
                    "raw_class": raw_folder,
                    "name": meta.get("name", "Uncertain Dish") if meta else "Uncertain Dish",
                    "regionalName": meta.get("regionalName", "") if meta else "",
                    "estimatedKcal": meta.get("estimatedKcal", "Variable") if meta else "Variable",
                    "image": meta.get("image", "/images/food/curry.svg") if meta else "/images/food/curry.svg",
                    "id": meta.get("id", "food-unknown") if meta else "food-unknown",
                    "instances_count": 1
                })
            else:
                # Entire scene was classified as background / non-food
                final_items.append({
                    "dish_name": "unknown_dish",
                    "confidence": 0.0,
                    "quantity": None,
                    "bbox": [0.1, 0.1, 0.9, 0.9],
                    "needs_confirmation": True,
                    "raw_class": "unknown",
                    "name": "No Food Detected",
                    "regionalName": "உணவு கண்டறியப்படவில்லை",
                    "estimatedKcal": "0 kcal",
                    "image": "/images/food/curry.svg",
                    "id": "food-unknown",
                    "instances_count": 0
                })

        # 5. Format confirmation-payload JSON matching required schema
        output = {
            "success": True,
            "source": "dish_photo",
            "items": [
                {
                    "dish_name": itm["dish_name"],
                    "confidence": itm["confidence"],
                    "quantity": itm["quantity"],
                    "bbox": itm["bbox"],
                    "needs_confirmation": itm["needs_confirmation"]
                }
                for itm in final_items
            ],
            "needs_confirmation": any_needs_confirmation,

            # Extended fields preserving backward compatibility with NutriSense UI
            "isMultiItem": len(final_items) > 1,
            "mode": "multi" if len(final_items) > 1 else "single",
            "plateMessage": (
                f"{len(final_items)} dishes detected on plate ({', '.join([d['name'].split(' (')[0] for d in final_items[:4]])})"
                if len(final_items) > 1 else
                f"Single dish detected: {final_items[0]['name'] if final_items else 'Food dish'}"
            ),
            "detectedItems": [
                {
                    "id": itm["id"],
                    "name": itm["name"],
                    "regionalName": itm["regionalName"],
                    "confidence": itm["confidence"],
                    "quantity": itm["quantity"],
                    "image": itm["image"],
                    "estimatedKcal": itm["estimatedKcal"],
                    "datasetFolder": itm["raw_class"],
                    "platePosition": "Center",
                    "box": [
                        itm["bbox"][0],
                        itm["bbox"][1],
                        round(itm["bbox"][2] - itm["bbox"][0], 4),
                        round(itm["bbox"][3] - itm["bbox"][1], 4)
                    ]
                }
                for itm in final_items
            ],
            "candidates": [
                {
                    "id": itm["id"],
                    "name": itm["name"],
                    "confidence": itm["confidence"],
                    "estimatedKcal": itm["estimatedKcal"]
                }
                for itm in final_items
            ]
        }

        return output
