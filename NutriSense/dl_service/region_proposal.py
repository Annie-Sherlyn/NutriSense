import os
import random
from pathlib import Path
from typing import List, Tuple, Dict, Any, Union
import numpy as np
import cv2
from PIL import Image

from config import (
    MIN_PROPOSAL_AREA_FRAC,
    MAX_PROPOSAL_AREA_FRAC,
    MIN_ASPECT_RATIO,
    MAX_ASPECT_RATIO,
    PROPOSAL_NMS_IOU,
    MAX_PROPOSALS,
    MIN_CROP_PIXELS
)

def compute_iou_xyxy(boxA: List[float], boxB: List[float]) -> float:
    """Computes Intersection-over-Union between two normalized [x1, y1, x2, y2] boxes."""
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    interW = max(0.0, xB - xA)
    interH = max(0.0, yB - yA)
    interArea = interW * interH

    boxAArea = max(0.0, boxA[2] - boxA[0]) * max(0.0, boxA[3] - boxA[1])
    boxBArea = max(0.0, boxB[2] - boxB[0]) * max(0.0, boxB[3] - boxB[1])
    unionArea = boxAArea + boxBArea - interArea

    if unionArea <= 0:
        return 0.0
    return interArea / unionArea

def nms_normalized_boxes(
    boxes: List[List[float]],
    scores: List[float],
    iou_thresh: float = PROPOSAL_NMS_IOU,
    max_keep: int = MAX_PROPOSALS
) -> List[List[float]]:
    """Applies Non-Maximum Suppression to consolidate overlapping candidate boxes."""
    if not boxes:
        return []
    np_boxes = np.array(boxes, dtype=np.float32)
    np_scores = np.array(scores, dtype=np.float32)

    x1 = np_boxes[:, 0]
    y1 = np_boxes[:, 1]
    x2 = np_boxes[:, 2]
    y2 = np_boxes[:, 3]
    areas = (x2 - x1) * (y2 - y1)

    order = np_scores.argsort()[::-1]
    keep = []

    while order.size > 0 and len(keep) < max_keep:
        i = order[0]
        keep.append(i)

        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])

        w = np.maximum(0.0, xx2 - xx1)
        h = np.maximum(0.0, yy2 - yy1)
        inter = w * h
        ovr = inter / (areas[i] + areas[order[1:]] - inter + 1e-6)

        inds = np.where(ovr <= iou_thresh)[0]
        order = order[inds + 1]

    return [boxes[k] for k in keep]

class RegionProposer:
    """
    OpenCV-based Class-Agnostic Candidate Region Generator.
    Used identically in BOTH:
      1. Training data preparation (harvesting positive crops & background crops)
      2. Inference (generating candidate RoIs on unseen multi-food images)
    Never references any specific food class names.
    """
    def __init__(
        self,
        min_area_frac: float = MIN_PROPOSAL_AREA_FRAC,
        max_area_frac: float = MAX_PROPOSAL_AREA_FRAC,
        min_aspect: float = MIN_ASPECT_RATIO,
        max_aspect: float = MAX_ASPECT_RATIO,
        use_watershed: bool = True
    ):
        self.min_area_frac = min_area_frac
        self.max_area_frac = max_area_frac
        self.min_aspect = min_aspect
        self.max_aspect = max_aspect
        self.use_watershed = use_watershed

    def propose(self, image: Union[np.ndarray, Image.Image, str]) -> Tuple[List[List[float]], List[List[float]]]:
        """
        Extracts candidate bounding boxes for food items in the image.
        Returns:
            raw_candidates: All detected candidate boxes before NMS [x1, y1, x2, y2]
            filtered_candidates: Deduped, consolidated candidate boxes [x1, y1, x2, y2] (0..1)
        """
        # Convert input to BGR numpy array
        if isinstance(image, str):
            cv_img = cv2.imread(image)
            if cv_img is None:
                raise ValueError(f"Could not load image from: {image}")
        elif isinstance(image, Image.Image):
            rgb = np.array(image.convert("RGB"))
            cv_img = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
        elif isinstance(image, np.ndarray):
            cv_img = image.copy()
            # If RGB or float
            if cv_img.dtype != np.uint8:
                if cv_img.min() < 0:  # [-1, 1]
                    cv_img = ((cv_img + 1.0) * 127.5).clip(0, 255).astype(np.uint8)
                else:  # [0, 1]
                    cv_img = (cv_img * 255.0).clip(0, 255).astype(np.uint8)
        else:
            raise TypeError("Unsupported image format for RegionProposer")

        H, W = cv_img.shape[:2]
        total_area = float(H * W)
        raw_boxes: List[List[float]] = []
        box_scores: List[float] = []

        # 1. Chromatic contrast in LAB space
        lab = cv2.cvtColor(cv_img, cv2.COLOR_BGR2LAB)
        l_chan, a_chan, b_chan = cv2.split(lab)

        # Background estimation from outer border margin
        border_mask = np.zeros((H, W), dtype=bool)
        m_y = max(2, int(H * 0.04))
        m_x = max(2, int(W * 0.04))
        border_mask[:m_y, :] = True
        border_mask[-m_y:, :] = True
        border_mask[:, :m_x] = True
        border_mask[:, -m_x:] = True

        med_a = np.median(a_chan[border_mask])
        med_b = np.median(b_chan[border_mask])
        chroma_dist = np.sqrt((a_chan - med_a) ** 2 + (b_chan - med_b) ** 2)
        chroma_norm = cv2.normalize(chroma_dist, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

        # 2. Gradient / Edge saliency
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (7, 7), 0)
        edges = cv2.Canny(blurred, 30, 100)

        # Weighted combination
        saliency = cv2.addWeighted(chroma_norm, 0.65, edges, 0.35, 0)

        # Multi-threshold binarization to capture soft textures, deep gravies, and discrete solids
        threshold_masks = [
            cv2.threshold(saliency, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1],
            cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 4),
            cv2.threshold(chroma_norm, 40, 255, cv2.THRESH_BINARY)[1]
        ]

        for bin_mask in threshold_masks:
            for k_size in [15, 25]:
                kernel_c = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k_size, k_size))
                closed = cv2.morphologyEx(bin_mask, cv2.MORPH_CLOSE, kernel_c, iterations=1)
                opened = cv2.morphologyEx(closed, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)), iterations=1)

                contours, _ = cv2.findContours(opened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                for cnt in contours:
                    area = cv2.contourArea(cnt)
                    frac = area / total_area
                    if self.min_area_frac <= frac <= self.max_area_frac:
                        x, y, w, h = cv2.boundingRect(cnt)
                        aspect = w / max(float(h), 1.0)
                        if self.min_aspect <= aspect <= self.max_aspect:
                            pad_x = int(w * 0.06)
                            pad_y = int(h * 0.06)
                            x1 = max(0, x - pad_x) / W
                            y1 = max(0, y - pad_y) / H
                            x2 = min(W, x + w + pad_x) / W
                            y2 = min(H, y + h + pad_y) / H
                            raw_boxes.append([x1, y1, x2, y2])
                            box_scores.append(float(frac))

        # 3. Distance Transform & Watershed for touching/overlapping items
        if self.use_watershed:
            try:
                base_mask = threshold_masks[0]
                dist_trans = cv2.distanceTransform(base_mask, cv2.DIST_L2, 5)
                _, sure_fg = cv2.threshold(dist_trans, 0.35 * dist_trans.max(), 255, 0)
                sure_fg = np.uint8(sure_fg)

                unknown = cv2.subtract(base_mask, sure_fg)
                _, markers = cv2.connectedComponents(sure_fg)
                markers = markers + 1
                markers[unknown == 255] = 0

                watershed_img = cv_img.copy()
                cv2.watershed(watershed_img, markers)

                for marker_id in np.unique(markers):
                    if marker_id <= 1:
                        continue
                    m_mask = np.uint8(markers == marker_id)
                    w_cnts, _ = cv2.findContours(m_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    for cnt in w_cnts:
                        area = cv2.contourArea(cnt)
                        frac = area / total_area
                        if self.min_area_frac <= frac <= self.max_area_frac:
                            x, y, w, h = cv2.boundingRect(cnt)
                            aspect = w / max(float(h), 1.0)
                            if self.min_aspect <= aspect <= self.max_aspect:
                                pad_x = int(w * 0.05)
                                pad_y = int(h * 0.05)
                                x1 = max(0, x - pad_x) / W
                                y1 = max(0, y - pad_y) / H
                                x2 = min(W, x + w + pad_x) / W
                                y2 = min(H, y + h + pad_y) / H
                                raw_boxes.append([x1, y1, x2, y2])
                                box_scores.append(float(frac) * 1.25)
            except Exception:
                pass

        # 4. Multi-scale sliding window fallback / grid prior to guarantee small & edge items
        for s_w, s_h in [(0.40, 0.40), (0.50, 0.50)]:
            for gx in np.linspace(0.04, 1.0 - s_w - 0.04, 3):
                for gy in np.linspace(0.04, 1.0 - s_h - 0.04, 3):
                    rx1, ry1 = int(gx * W), int(gy * H)
                    rx2, ry2 = int((gx + s_w) * W), int((gy + s_h) * H)
                    crop_gray = gray[ry1:ry2, rx1:rx2]
                    if crop_gray.size > 0:
                        std = float(np.std(crop_gray))
                        # Texture threshold: food regions have rich edges/variations
                        if std > 28.0:
                            raw_boxes.append([gx, gy, gx + s_w, gy + s_h])
                            box_scores.append(0.35)

        # 5. Deduplicate candidates using IoU NMS
        filtered_boxes = nms_normalized_boxes(
            raw_boxes,
            box_scores,
            iou_thresh=PROPOSAL_NMS_IOU,
            max_keep=MAX_PROPOSALS
        )

        return raw_boxes, filtered_boxes

    def harvest_training_crops(
        self,
        image_path: str,
        num_positive: int = 2,
        num_background: int = 1
    ) -> Tuple[List[Image.Image], List[Image.Image]]:
        """
        Used during training data prep:
        - Extracts tight positive food crops from single-food images
        - Extracts background / non-food crops (empty plate, table, border)
        """
        try:
            pil_img = Image.open(image_path).convert("RGB")
        except Exception:
            return [], []

        W, H = pil_img.size
        cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        _, proposals = self.propose(cv_img)

        positive_crops = []
        background_crops = []

        # 1. Harvest positive crops (center & highest scoring food regions)
        for x1, y1, x2, y2 in proposals:
            bx1, by1 = int(x1 * W), int(y1 * H)
            bx2, by2 = int(x2 * W), int(y2 * H)
            if (bx2 - bx1) >= MIN_CROP_PIXELS and (by2 - by1) >= MIN_CROP_PIXELS:
                crop = pil_img.crop((bx1, by1, bx2, by2))
                positive_crops.append(crop)
                if len(positive_crops) >= num_positive:
                    break

        # 2. Harvest background crops (outer corners, margins, or low-texture slices)
        corner_slots = [
            (0, 0, int(W * 0.25), int(H * 0.25)),
            (int(W * 0.75), 0, W, int(H * 0.25)),
            (0, int(H * 0.75), int(W * 0.25), H),
            (int(W * 0.75), int(H * 0.75), W, H)
        ]
        random.shuffle(corner_slots)
        for x1, y1, x2, y2 in corner_slots:
            if (x2 - x1) >= MIN_CROP_PIXELS and (y2 - y1) >= MIN_CROP_PIXELS:
                bg_crop = pil_img.crop((x1, y1, x2, y2))
                background_crops.append(bg_crop)
                if len(background_crops) >= num_background:
                    break

        return positive_crops, background_crops

# Global default proposer instance
default_proposer = RegionProposer()
