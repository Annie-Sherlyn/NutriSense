import io
import time
import base64
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Union, Tuple, Optional
import numpy as np
from PIL import Image
import cv2

from config import (
    CONFIDENCE_HIGH,
    CONFIDENCE_MEDIUM,
    CONFIDENCE_LOW,
    MIN_CROP_PIXELS
)
from labels import labels_registry, LabelRegistry
from region_proposal import RegionProposer, default_proposer
from classifier import CropClassifier
from postprocessor import DetectionPostprocessor

logger = logging.getLogger("NutriSense.Vision.Detector")

DISH_PALETTE = [
    {"name": "emerald", "bgr": (46, 204, 113),  "hex": "#2ECC71", "bg_bgr": (30, 160, 85)},
    {"name": "amber",   "bgr": (20, 180, 245),  "hex": "#F59E0B", "bg_bgr": (15, 140, 200)},
    {"name": "cyan",    "bgr": (240, 160, 50),  "hex": "#06B6D4", "bg_bgr": (190, 120, 30)},
    {"name": "coral",   "bgr": (68, 70, 245),   "hex": "#EF4444", "bg_bgr": (50, 50, 195)},
    {"name": "purple",  "bgr": (210, 80, 160),  "hex": "#8B5CF6", "bg_bgr": (160, 60, 120)},
    {"name": "teal",    "bgr": (150, 200, 20),  "hex": "#14B8A6", "bg_bgr": (110, 150, 15)},
    {"name": "pink",    "bgr": (180, 50, 240),  "hex": "#EC4899", "bg_bgr": (140, 35, 190)},
]

class FoodPlateDetector:
    """
    Modular Computer Vision Multi-Food Plate Detector and Classifier Orchestrator.
    Pipeline:
      1. Preprocess input image
      2. OpenCV-based candidate region generation (class-agnostic)
      3. Candidate filtering (area, aspect ratio, border bounds)
      4. Crop extraction for all surviving proposals
      5. Per-crop deep learning classification across all dataset classes
      6. Confidence gating & background suppression
      7. IoU-based NMS / duplicate merge
      8. Config-driven same-food grouping & discrete instance counting
      9. Canonical dish name normalization
      10. Output confirmation-payload JSON + optional annotated visualization
    """
    def __init__(
        self,
        classifier: Optional[CropClassifier] = None,
        proposer: Optional[RegionProposer] = None,
        postprocessor: Optional[DetectionPostprocessor] = None,
        registry: LabelRegistry = labels_registry
    ):
        self.registry = registry
        self.classifier = classifier or CropClassifier(registry=self.registry)
        self.proposer = proposer or default_proposer
        self.postprocessor = postprocessor or DetectionPostprocessor(registry=self.registry)

    def detect(
        self,
        image: Union[str, bytes, Image.Image, np.ndarray],
        return_annotated: bool = True
    ) -> Dict[str, Any]:
        """
        Runs the full end-to-end food vision detection pipeline on a dish image.
        Returns the structured confirmation payload JSON.
        """
        t_start = time.perf_counter()

        # 1. Load and parse image
        if isinstance(image, str):
            pil_img = Image.open(image).convert("RGB")
        elif isinstance(image, bytes):
            pil_img = Image.open(io.BytesIO(image)).convert("RGB")
        elif isinstance(image, Image.Image):
            pil_img = image.convert("RGB")
        elif isinstance(image, np.ndarray):
            if image.dtype != np.uint8:
                image = (image * 255).astype(np.uint8)
            pil_img = Image.fromarray(image).convert("RGB")
        else:
            raise TypeError("Unsupported image input type for detector")

        W, H = pil_img.size
        cv_img_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        # 2. Region Proposal (Class-agnostic OpenCV)
        t_prop_start = time.perf_counter()
        raw_candidates, filtered_candidates = self.proposer.propose(cv_img_bgr)
        t_prop = (time.perf_counter() - t_prop_start) * 1000.0

        # Also always include a full-plate or large central region candidate
        # to ensure large single-dish plates are reliably evaluated
        has_central = False
        for c in filtered_candidates:
            if c[0] < 0.15 and c[1] < 0.15 and c[2] > 0.85 and c[3] > 0.85:
                has_central = True
                break
        if not has_central:
            filtered_candidates.append([0.05, 0.05, 0.95, 0.95])

        # 3. Crop Extraction
        crops = []
        valid_boxes = []
        for x1, y1, x2, y2 in filtered_candidates:
            px1 = int(round(x1 * W))
            py1 = int(round(y1 * H))
            px2 = int(round(x2 * W))
            py2 = int(round(y2 * H))

            cw = px2 - px1
            ch = py2 - py1
            if cw >= MIN_CROP_PIXELS and ch >= MIN_CROP_PIXELS:
                crop = pil_img.crop((px1, py1, px2, py2))
                crops.append(crop)
                valid_boxes.append([round(x1, 4), round(y1, 4), round(x2, 4), round(y2, 4)])

        # 4. Crop Classification (Batch inference)
        t_cls_start = time.perf_counter()
        if crops and self.classifier.model is not None:
            crop_predictions = self.classifier.predict_crops(crops, top_k=3)
        else:
            crop_predictions = []
        t_cls = (time.perf_counter() - t_cls_start) * 1000.0

        # 5. Assemble raw detections
        raw_detections = []
        for box, pred in zip(valid_boxes, crop_predictions):
            raw_detections.append({
                "box": box,
                "dish_name": pred["dish_name"],
                "raw_class": pred["raw_class"],
                "confidence": pred["confidence"],
                "is_non_food": pred["is_non_food"],
                "candidates": pred.get("candidates", []),
                "meta": pred.get("meta")
            })

        # 6. Postprocessing (NMS, confidence filtering, grouping, counting, JSON schema)
        t_post_start = time.perf_counter()
        result = self.postprocessor.process(raw_detections, W, H)
        t_post = (time.perf_counter() - t_post_start) * 1000.0

        total_latency = (time.perf_counter() - t_start) * 1000.0

        # Performance profiling diagnostics
        result["profiling"] = {
            "proposal_time_ms": round(t_prop, 2),
            "classifier_time_ms": round(t_cls, 2),
            "postprocess_time_ms": round(t_post, 2),
            "total_latency_ms": round(total_latency, 2),
            "raw_candidate_count": len(raw_candidates),
            "filtered_candidate_count": len(filtered_candidates),
            "evaluated_crops_count": len(crops)
        }

        # 7. Generate CV Annotated Visualization
        if return_annotated:
            try:
                annotated_b64 = self._draw_annotations(pil_img, result["items"])
                result["annotatedImage"] = annotated_b64
            except Exception as e:
                logger.warning(f"Could not generate annotated image: {e}")
                result["annotatedImage"] = None
        else:
            result["annotatedImage"] = None

        return result

    def _draw_annotations(self, pil_img: Image.Image, items: List[Dict[str, Any]]) -> str:
        """Renders bounding boxes and label banners on the image."""
        W, H = pil_img.size
        cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        for idx, item in enumerate(items):
            palette = DISH_PALETTE[idx % len(DISH_PALETTE)]
            box_color = palette["bgr"]
            bg_color = palette["bg_bgr"]

            b = item["bbox"]
            px1 = max(0, min(int(b[0] * W), W - 5))
            py1 = max(0, min(int(b[1] * H), H - 5))
            px2 = max(px1 + 10, min(int(b[2] * W), W))
            py2 = max(py1 + 10, min(int(b[3] * H), H))

            pw = px2 - px1
            ph = py2 - py1

            # Outer rectangle
            cv2.rectangle(cv_img, (px1, py1), (px2, py2), box_color, 3, cv2.LINE_AA)

            # Modern corner brackets
            corner = min(18, pw // 4, ph // 4)
            if corner > 4:
                cv2.line(cv_img, (px1, py1), (px1 + corner, py1), (255, 255, 255), 3, cv2.LINE_AA)
                cv2.line(cv_img, (px1, py1), (px1, py1 + corner), (255, 255, 255), 3, cv2.LINE_AA)
                cv2.line(cv_img, (px2, py1), (px2 - corner, py1), (255, 255, 255), 3, cv2.LINE_AA)
                cv2.line(cv_img, (px2, py1), (px2, py1 + corner), (255, 255, 255), 3, cv2.LINE_AA)

            # Label text
            dish_display = item["dish_name"].replace("_", " ").title()
            conf_pct = int(item["confidence"] * 100)
            qty_text = f" x{item['quantity']}" if item.get("quantity") is not None else ""
            label = f"{dish_display}{qty_text} ({conf_pct}%)"

            font_scale = 0.52 if W > 400 else 0.42
            thickness = 2
            (lbl_w, lbl_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)

            tag_y2 = max(py1, lbl_h + 10)
            tag_y1 = tag_y2 - lbl_h - 8
            tag_x1 = px1
            tag_x2 = min(W, px1 + lbl_w + 14)

            cv2.rectangle(cv_img, (tag_x1, tag_y1), (tag_x2, tag_y2), bg_color, -1)
            cv2.rectangle(cv_img, (tag_x1, tag_y1), (tag_x2, tag_y2), box_color, 1, cv2.LINE_AA)
            cv2.putText(
                cv_img,
                label,
                (tag_x1 + 6, tag_y2 - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                font_scale,
                (255, 255, 255),
                thickness,
                cv2.LINE_AA
            )

        _, buf = cv2.imencode(".jpg", cv_img, [cv2.IMWRITE_JPEG_QUALITY, 88])
        return "data:image/jpeg;base64," + base64.b64encode(buf).decode("utf-8")
