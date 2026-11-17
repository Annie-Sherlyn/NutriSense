"""
ocr/postprocessing.py
Post-processing of paired dish-price results.

Responsibilities:
- Convert pairs to MenuItem objects
- Normalize price display (₹ prefix)
- Compute pair confidence
- Deduplicate overlapping results
- Separate high/medium confidence from low confidence (needs review)
- Detect category from surrounding section headings
- NEVER invent or correct prices
"""

from __future__ import annotations
import re
import statistics
from typing import List, Tuple, Optional, Dict

from config.settings import MEDIUM_CONFIDENCE, SECTION_HEADINGS
from models.schemas import (
    DishCandidate,
    PriceCandidate,
    MenuItem,
    BBox,
)
from ocr.price_detection import (
    validate_price_candidate,
    normalize_price_display,
)
from utils.logging_utils import get_logger

log = get_logger("ocr.postprocessing")

# Bounding box overlap threshold for deduplication
_OVERLAP_IOU_THRESHOLD = 0.5


def _compute_pair_confidence(
    dish: DishCandidate,
    price: PriceCandidate,
    pair_score: float,
    all_prices: List[PriceCandidate],
) -> float:
    """
    Compute a final pair confidence combining:
    - OCR confidence of dish and price tokens
    - Price confidence score
    - Normalised pair score
    """
    price.price_confidence = validate_price_candidate(price, all_prices)

    ocr_conf = (dish.ocr_confidence + price.ocr_confidence) / 2
    ocr_frac = min(1.0, ocr_conf / 100.0)

    # Normalise pair score to 0-1 (max possible score ≈ 15)
    score_frac = min(1.0, pair_score / 15.0)

    confidence = (
        0.35 * ocr_frac
        + 0.35 * price.price_confidence
        + 0.30 * score_frac
    )
    return round(min(1.0, max(0.0, confidence)), 4)


def _bbox_iou(a: BBox, b: BBox) -> float:
    """Intersection over Union for two bounding boxes."""
    ax1, ay1, ax2, ay2 = a.x, a.y, a.right(), a.bottom()
    bx1, by1, bx2, by2 = b.x, b.y, b.right(), b.bottom()

    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)

    if inter_x2 <= inter_x1 or inter_y2 <= inter_y1:
        return 0.0

    inter_area = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
    a_area = (ax2 - ax1) * (ay2 - ay1)
    b_area = (bx2 - bx1) * (by2 - by1)
    union_area = a_area + b_area - inter_area
    if union_area <= 0:
        return 0.0
    return inter_area / union_area


def _deduplicate(items: List[MenuItem]) -> List[MenuItem]:
    """
    Remove duplicate menu items.

    Two items are duplicates if their dish bounding boxes have IoU >= threshold
    AND their prices are the same. Keep the one with higher confidence.

    EXCEPTION: same price for different dishes (IDLI ₹40, VADA ₹40) must NOT be merged.
    """
    kept: List[MenuItem] = []
    for item in items:
        is_dup = False
        for existing in kept:
            if existing.price == item.price:
                iou = _bbox_iou(existing.dish_bbox, item.dish_bbox)
                if iou >= _OVERLAP_IOU_THRESHOLD:
                    # It's a duplicate — keep the higher confidence one
                    if item.confidence > existing.confidence:
                        kept.remove(existing)
                        kept.append(item)
                    is_dup = True
                    break
        if not is_dup:
            kept.append(item)

    if len(items) != len(kept):
        log.info(f"Deduplication: {len(items)} → {len(kept)} items")
    return kept


def _detect_category(
    dish: DishCandidate,
    all_dishes: List[DishCandidate],
) -> Optional[str]:
    """
    Detect the category for a dish by looking for section headings
    that appear above it in the sorted dish list and in the same column.
    """
    def same_col(h: DishCandidate, d: DishCandidate) -> bool:
        # Check if they share vertical column alignment
        # Headings might be centered, so their center_x or left_x should be somewhat aligned
        h_center = h.bbox.x + h.bbox.width / 2
        d_center = d.bbox.x + d.bbox.width / 2
        return abs(h_center - d_center) < max(200, h.bbox.width)

    # Find section headings above this dish in the same column
    candidate_headings = [
        d for d in all_dishes
        if d.is_section_heading
        and d.bbox.y < dish.bbox.y
        and (dish.bbox.y - (d.bbox.y + d.bbox.height)) < 800  # generous vertical distance
        and same_col(d, dish)
    ]
    if not candidate_headings:
        return None

    # Take the closest heading above
    candidate_headings.sort(key=lambda d: dish.bbox.y - d.bbox.y)
    return candidate_headings[0].normalized_text.title()


def build_menu_items(
    pairs: List[Tuple[DishCandidate, PriceCandidate, float]],
    all_prices: List[PriceCandidate],
    all_dishes: List[DishCandidate],
) -> Tuple[List[MenuItem], List[MenuItem]]:
    """
    Convert (dish, price, score) pairs into MenuItem objects.
    Returns (high_confidence_items, needs_review_items).
    """
    items: List[MenuItem] = []

    for dish, price, pair_score in pairs:
        conf = _compute_pair_confidence(dish, price, pair_score, all_prices)
        display_price = normalize_price_display(price)

        category = _detect_category(dish, all_dishes)
        # ── VALIDATION & SAFETY GATES ─────────────────────────────────────
        # Final Safety Gate: Row-based validation
        row_alignment_score = (
            1.0 if dish.line_index == price.line_index else 0.0
        )
        if row_alignment_score == 0.0:
            # Did not pass row-based validation -> needs review
            conf = min(conf, 0.4)
            decision_reason = "failed_row_validation"
        else:
            decision_reason = "passed_row_validation"
            
        # Unverified Artifact Validation
        # If the price was suspected to have an artifact prefix but lacked geometric evidence,
        # it was kept as the original value. Send to needs_review.
        if not price.digit_ocr_applied and price.artifact_alternative is not None:
            conf = min(conf, 0.4)
            decision_reason = "unverified_artifact_prefix"
            
        # Very Low Price Validation (e.g. ₹2, ₹5)
        # Require stronger evidence to accept suspiciously low prices
        num_val = price.effective_numeric_value()
        if num_val is not None and num_val < 10:
            strong_evidence = (
                dish.line_index == price.line_index
                and price.in_price_column
                and price.price_confidence >= 0.8
                and price.artifact_alternative is None
                and not price.digit_ocr_applied
            )
            if not strong_evidence:
                conf = min(conf, 0.4)
                decision_reason = "low_price_weak_evidence"
                
        # ── DEBUG INFO ────────────────────────────────────────────────────
        debug_info = {
            "dish_line": dish.line_index,
            "price_line": price.line_index,
            "dish_bbox": {"x": dish.bbox.x, "y": dish.bbox.y, "w": dish.bbox.width, "h": dish.bbox.height},
            "price_bbox": {"x": price.bbox.x, "y": price.bbox.y, "w": price.bbox.width, "h": price.bbox.height},
            "vertical_distance": abs(dish.bbox.y + dish.bbox.height / 2 - (price.bbox.y + price.bbox.height / 2)),
            "horizontal_distance": max(0, price.bbox.x - (dish.bbox.x + dish.bbox.width)),
            "row_alignment_score": row_alignment_score,
            "price_column_score": 1.0 if price.in_price_column else 0.0,
            "artifact_score": price.currency_artifact_score,
            "final_confidence": conf,
            "decision_reason": decision_reason,
            "digit_ocr_applied": price.digit_ocr_applied,
        }

        item = MenuItem(
            dish_name=dish.normalized_text,
            price=display_price,
            raw_dish_name=dish.raw_text,
            raw_price=price.raw_text,
            price_type=price.price_type,
            dish_bbox=dish.bbox,
            price_bbox=price.bbox,
            confidence=conf,
            category=category,
            price_numeric=num_val,
            price_currency=price.price_currency,
        )
        # Assuming we can attach debug info dynamically
        item.debug_info = debug_info

        items.append(item)
        log.debug(
            f"  MenuItem: '{item.dish_name}' -- {item.price}  "
            f"conf={conf:.3f}  cat={category}"
        )

    # Deduplicate
    items = _deduplicate(items)

    # Split by confidence level
    high_conf = [i for i in items if i.confidence >= MEDIUM_CONFIDENCE]
    needs_review = [i for i in items if i.confidence < MEDIUM_CONFIDENCE]

    # Sort by vertical position (top to bottom)
    high_conf.sort(key=lambda i: i.dish_bbox.y)
    needs_review.sort(key=lambda i: i.dish_bbox.y)

    log.info(
        f"Post-processing: {len(high_conf)} accepted, "
        f"{len(needs_review)} needs review"
    )
    return high_conf, needs_review
