"""
ocr/annotation.py
Annotated image generation.

DESIGN:
- Draw SEPARATE bounding boxes for dish and price (NOT one giant row box)
- Draw optional connector line between dish and price
- Map all coordinates back to ORIGINAL image dimensions
- Use ImageWrapper.scale_x / scale_y for accurate remapping
- Save debug visualisation images for each pipeline stage
"""

from __future__ import annotations
from pathlib import Path
from typing import List, Optional, Dict
import cv2
import numpy as np

from config.settings import (
    ANNOTATION_DISH_COLOR,
    ANNOTATION_PRICE_COLOR,
    ANNOTATION_LINE_COLOR,
    ANNOTATION_THICKNESS,
    ANNOTATION_FONT_SCALE,
    DEBUG_DIR,
)
from models.schemas import MenuItem, OCRToken, PriceCandidate, DishCandidate, VisualLine, BBox
from utils.image import ImageWrapper
from utils.logging_utils import get_logger

log = get_logger("ocr.annotation")

_FONT = cv2.FONT_HERSHEY_SIMPLEX


def _draw_bbox(img: np.ndarray, bbox: BBox, color: tuple, thickness: int) -> None:
    cv2.rectangle(img, (bbox.x, bbox.y), (bbox.right(), bbox.bottom()), color, thickness)


def _remap_bbox(bbox: BBox, wrapper: ImageWrapper) -> BBox:
    """Map bounding box from processed image coords to original image coords."""
    x, y, w, h = wrapper.to_original_coords(bbox.x, bbox.y, bbox.width, bbox.height)
    return BBox(x=x, y=y, width=w, height=h)


def annotate_final(
    original_wrapper: ImageWrapper,
    items: List[MenuItem],
    needs_review: List[MenuItem],
    processed_wrapper: Optional[ImageWrapper] = None,
) -> np.ndarray:
    """
    Draw dish and price bounding boxes on the ORIGINAL image.

    If processed_wrapper is provided, coordinate remapping is applied.
    Otherwise assumes coordinates are already in original image space.

    Returns annotated BGR numpy array.
    """
    img = original_wrapper.array.copy()

    all_items = items + needs_review
    for item in all_items:
        # Remap if necessary
        if processed_wrapper is not None:
            d_bbox = _remap_bbox(item.dish_bbox, processed_wrapper)
            p_bbox = _remap_bbox(item.price_bbox, processed_wrapper)
        else:
            d_bbox = item.dish_bbox
            p_bbox = item.price_bbox

        color = ANNOTATION_DISH_COLOR if item in items else (180, 180, 50)
        price_color = ANNOTATION_PRICE_COLOR if item in items else (100, 100, 200)

        # ── Draw dish bounding box ────────────────────────────────────────
        _draw_bbox(img, d_bbox, color, ANNOTATION_THICKNESS)

        # ── Draw price bounding box ───────────────────────────────────────
        _draw_bbox(img, p_bbox, price_color, ANNOTATION_THICKNESS)

        # ── Draw connector line (midpoints) ──────────────────────────────
        dish_right = (d_bbox.right(), int(d_bbox.center_y()))
        price_left = (p_bbox.x, int(p_bbox.center_y()))
        cv2.line(img, dish_right, price_left, ANNOTATION_LINE_COLOR, 1, cv2.LINE_AA)

        # ── Label dish name (small text above box) ────────────────────────
        label = f"{item.dish_name[:25]}  {int(item.confidence * 100)}%"
        label_y = max(d_bbox.y - 4, 12)
        cv2.putText(
            img, label,
            (d_bbox.x, label_y),
            _FONT, ANNOTATION_FONT_SCALE,
            color, 1, cv2.LINE_AA,
        )

        # ── Label price ───────────────────────────────────────────────────
        price_label_y = max(p_bbox.y - 4, 12)
        cv2.putText(
            img, item.price,
            (p_bbox.x, price_label_y),
            _FONT, ANNOTATION_FONT_SCALE,
            price_color, 1, cv2.LINE_AA,
        )

    return img


def annotate_ocr_tokens(
    original_wrapper: ImageWrapper,
    tokens: List[OCRToken],
    processed_wrapper: Optional[ImageWrapper] = None,
) -> np.ndarray:
    """Draw all OCR token bounding boxes for debug visualisation."""
    img = original_wrapper.array.copy()
    for tok in tokens:
        bbox = BBox(tok.x, tok.y, tok.width, tok.height)
        if processed_wrapper:
            bbox = _remap_bbox(bbox, processed_wrapper)
        _draw_bbox(img, bbox, (255, 140, 0), 1)
        cv2.putText(
            img, tok.normalized_text[:8],
            (bbox.x, max(bbox.y - 2, 8)),
            _FONT, 0.35, (255, 140, 0), 1, cv2.LINE_AA,
        )
    return img


def annotate_price_candidates(
    original_wrapper: ImageWrapper,
    candidates: List[PriceCandidate],
    processed_wrapper: Optional[ImageWrapper] = None,
) -> np.ndarray:
    """Draw price candidate bounding boxes in red for debug visualisation."""
    img = original_wrapper.array.copy()
    for pc in candidates:
        bbox = pc.bbox
        if processed_wrapper:
            bbox = _remap_bbox(bbox, processed_wrapper)
        _draw_bbox(img, bbox, ANNOTATION_PRICE_COLOR, 2)
        label = f"{pc.raw_text} [{pc.price_type[:3]}]"
        cv2.putText(
            img, label,
            (bbox.x, max(bbox.y - 4, 10)),
            _FONT, 0.38, ANNOTATION_PRICE_COLOR, 1, cv2.LINE_AA,
        )
    return img


def annotate_dish_candidates(
    original_wrapper: ImageWrapper,
    candidates: List[DishCandidate],
    processed_wrapper: Optional[ImageWrapper] = None,
) -> np.ndarray:
    """Draw dish candidate bounding boxes in green for debug visualisation."""
    img = original_wrapper.array.copy()
    for dc in candidates:
        bbox = dc.bbox
        if processed_wrapper:
            bbox = _remap_bbox(bbox, processed_wrapper)
        color = (0, 200, 50) if not dc.is_section_heading else (0, 180, 200)
        _draw_bbox(img, bbox, color, 2)
        cv2.putText(
            img, dc.normalized_text[:20],
            (bbox.x, max(bbox.y - 4, 10)),
            _FONT, 0.38, color, 1, cv2.LINE_AA,
        )
    return img


def save_debug_image(img: np.ndarray, name: str, debug_dir: Path = DEBUG_DIR) -> Path:
    """Save a debug image to the debug directory."""
    debug_dir.mkdir(parents=True, exist_ok=True)
    path = debug_dir / f"{name}.png"
    cv2.imwrite(str(path), img)
    log.debug(f"Debug image saved: {path}")
    return path
