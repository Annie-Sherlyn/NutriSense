"""
ocr/line_reconstruction.py
Geometry-based visual line reconstruction from OCR tokens.

DESIGN:
- Two tokens belong to the same visual line when their vertical centers
  are within LINE_OVERLAP_RATIO × median_token_height.
- We do NOT rely solely on Tesseract line_num (it can be wrong).
- We sort tokens left-to-right within each reconstructed line.
- Lines are sorted top-to-bottom.

This is mandatory: Tesseract may split "MASALA DOSA" across tokens,
and we must reunite them on the same visual line.
"""

from __future__ import annotations
import statistics
from typing import List, Dict, Tuple

from config.settings import LINE_OVERLAP_RATIO, MIN_TOKENS_FOR_RECONSTRUCTION
from models.schemas import OCRToken, VisualLine
from utils.logging_utils import get_logger

log = get_logger("ocr.line_reconstruction")


def _median_token_height(tokens: List[OCRToken]) -> float:
    """Compute median height of all valid tokens."""
    heights = [t.height for t in tokens if t.height > 0]
    if not heights:
        return 20.0  # fallback
    return statistics.median(heights)


def reconstruct_lines(tokens: List[OCRToken]) -> List[VisualLine]:
    """
    Group OCR tokens into visual lines based on vertical geometry.
    Tokens whose vertical centers are within a threshold are grouped into the same row.
    """
    if not tokens:
        return []

    if len(tokens) < MIN_TOKENS_FOR_RECONSTRUCTION:
        # Fallback if too few tokens to compute a reliable median height
        return [VisualLine(tokens=[t], line_index=i) for i, t in enumerate(tokens)]

    median_h = _median_token_height(tokens)
    threshold = LINE_OVERLAP_RATIO * median_h

    sorted_tokens = sorted(tokens, key=lambda t: t.center_y)

    geo_groups: list = []
    for tok in sorted_tokens:
        placed = False
        for grp in geo_groups:
            if abs(tok.center_y - grp["center_y"]) <= threshold:
                grp["tokens"].append(tok)
                # update running average of center_y
                grp["center_y"] = sum(t.center_y for t in grp["tokens"]) / len(grp["tokens"])
                placed = True
                break
        if not placed:
            geo_groups.append({"center_y": tok.center_y, "tokens": [tok]})

    geo_groups.sort(key=lambda g: g["center_y"])

    lines = []
    for i, grp in enumerate(geo_groups):
        line_tokens = sorted(grp["tokens"], key=lambda t: t.x)
        lines.append(VisualLine(tokens=line_tokens, line_index=i))

    log.debug(
        f"Line reconstruction: {len(tokens)} tokens → {len(lines)} lines "
        f"(geometry-based, median_h={median_h:.1f}px, threshold={threshold:.1f}px)"
    )
    return lines



def get_image_column_ranges(
    lines: List[VisualLine], n_columns: int = 2
) -> List[Tuple[int, int]]:
    """
    Heuristically detect visual column boundaries by looking at token x-distribution.
    Returns a list of (left_x, right_x) tuples for each detected column.
    Used to avoid pairing left-column dishes with right-column prices.
    """
    if not lines:
        return []

    all_left_x = []
    for line in lines:
        for tok in line.tokens:
            all_left_x.append(tok.x)

    if not all_left_x:
        return []

    max_x = max(t.right() for line in lines for t in line.tokens)
    min_x = min(all_left_x)
    width = max_x - min_x

    if n_columns == 1 or width < 100:
        return [(min_x, max_x)]

    # Simple midpoint split for two-column detection
    # A more sophisticated approach would use x-coordinate histogram clustering
    mid = min_x + width // 2
    return [(min_x, mid), (mid, max_x)]

