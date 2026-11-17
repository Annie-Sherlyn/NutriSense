"""
ocr/price_ocr.py
Digit-only OCR re-pass for price region isolation.

PURPOSE
-------
When Tesseract reads a price like ₹169, it frequently misidentifies the ₹
symbol as a digit (7) or other character, producing tokens like 7169, 2275,
%279, etc.

This module provides a targeted re-pass that:
  1. Crops the bounding box of a candidate price token from the source image
  2. Masks / removes any leading non-digit character(s) based on spatial width
  3. Runs Tesseract with tessedit_char_whitelist=0123456789 (PSM 7 = single word)
  4. Returns the clean integer value

DESIGN RULES
------------
- NEVER use global string replacement ("strip all 7s").
- ONLY strip a leading character when its spatial position coincides with
  where a ₹ symbol would appear (leftmost ~25% of the token bbox).
- All corrections are traceable via debug_info on the candidate.
- If digit-only OCR fails or returns an implausible value, fall back to the
  original token value — do NOT invent a price.
"""

from __future__ import annotations
import re
from typing import Optional, Tuple

import cv2
import numpy as np
import pytesseract
from PIL import Image

from utils.logging_utils import get_logger

log = get_logger("ocr.price_ocr")

# Tesseract config: single-word mode, digits only
_DIGIT_ONLY_CONFIG = "--oem 3 --psm 7 -c tessedit_char_whitelist=0123456789."

# Minimum reasonable price (rupees) — below this the re-OCR result is suspect
_PRICE_FLOOR = 1
# Maximum reasonable single-item price
_PRICE_CEILING = 9999

# Padding (pixels) to add around the crop so Tesseract sees context
_CROP_PAD = 4

# Currency-symbol width as a fraction of the token bbox width.
# If the leftmost character of the raw token looks like a symbol, we crop
# this fraction off the left before re-OCRing.
_CURRENCY_SYMBOL_WIDTH_FRAC = 0.28


def _preprocess_for_digit_ocr(bgr: np.ndarray) -> np.ndarray:
    """
    Convert a crop to a high-contrast grayscale image for digit-only OCR.
    Upscale to at least 32px tall for Tesseract reliability.
    """
    if len(bgr.shape) == 3:
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    else:
        gray = bgr.copy()

    # Upscale if very small
    h, w = gray.shape[:2]
    if h < 32:
        scale = max(2, 32 // max(h, 1))
        gray = cv2.resize(gray, (w * scale, h * scale), interpolation=cv2.INTER_CUBIC)

    # Otsu threshold for clean black-on-white
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Add a white border so Tesseract does not clip edge characters
    border = max(8, thresh.shape[0] // 4)
    bordered = cv2.copyMakeBorder(
        thresh, border, border, border, border,
        cv2.BORDER_CONSTANT, value=255
    )
    return bordered


def _is_currency_artifact_char(ch: str) -> bool:
    """
    Return True if a character is a known OCR mis-read of the ₹ symbol.
    These characters appear at the LEFTMOST position of a price token.
    """
    # Direct ₹ reads
    if ch == "₹":
        return True
    # Known Tesseract mis-reads of ₹
    if ch in {"7", "2", "%", "R", "r", "F", "f", "?", "€", "£", "¥", "E"}:
        return True
    return False


def digit_only_ocr_on_bbox(
    image_array: np.ndarray,
    token_x: int,
    token_y: int,
    token_w: int,
    token_h: int,
    raw_token_text: str,
    scale_x: float = 1.0,
    scale_y: float = 1.0,
) -> Optional[Tuple[float, str]]:
    """
    Run a digit-only OCR re-pass on the bounding box region of a price token.

    The function:
      1. Maps token coordinates back to original image space
      2. Crops the region (with padding)
      3. Detects whether the leftmost pixel-column is dominated by a non-digit
         (currency symbol) and masks it out
      4. Runs Tesseract PSM-7 with digit whitelist
      5. Returns (numeric_value, debug_str) or None if re-OCR fails

    Parameters
    ----------
    image_array  : BGR numpy array of the full source image
    token_x/y/w/h: Bounding box in image-array coordinates (NOT original coords)
    raw_token_text: The raw OCR text (used to detect leading artifact character)
    scale_x/y    : Scale factors if image was preprocessed (upscaled etc.)
    """
    if image_array is None or image_array.size == 0:
        return None

    img_h, img_w = image_array.shape[:2]

    # Clamp coordinates to image bounds
    x1 = max(0, token_x - _CROP_PAD)
    y1 = max(0, token_y - _CROP_PAD)
    x2 = min(img_w, token_x + token_w + _CROP_PAD)
    y2 = min(img_h, token_y + token_h + _CROP_PAD)

    if x2 <= x1 or y2 <= y1:
        log.debug(f"price_ocr: invalid crop bbox ({x1},{y1})-({x2},{y2})")
        return None

    crop = image_array[y1:y2, x1:x2]

    # ── Detect and mask the currency symbol ──────────────────────────────
    # If the raw token starts with a known artifact character, mask the
    # leftmost fraction of the crop.
    masked_crop = crop.copy()
    mask_applied = False
    strip_reason = ""

    if raw_token_text and _is_currency_artifact_char(raw_token_text[0]):
        # Require STRONG GEOMETRIC EVIDENCE before masking.
        # Check if there is a vertical gap separating the first character from the rest.
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        proj = np.sum(thresh, axis=0)
        
        n_chars = max(1, len(raw_token_text))
        expected_char_w = (x2 - x1) // n_chars
        
        search_start = max(0, int(expected_char_w * 0.4))
        search_end = min(len(proj) - 1, int(expected_char_w * 1.6))
        
        gap_col = -1
        if search_start < search_end:
            window = proj[search_start:search_end]
            min_val = np.min(window)
            # Gap if at most 3 pixels are black in the column
            if min_val <= 3 * 255:
                gap_col = search_start + np.argmin(window)
                
        if gap_col > 0:
            mask_end = gap_col
            masked_crop[:, :mask_end] = 255  # white out currency symbol region
            mask_applied = True
            strip_reason = f"gap_at_{mask_end}px(artifact='{raw_token_text[0]}')"
            log.debug(f"price_ocr: masking left {mask_end}px due to geometric gap")
        else:
            # NO geometric evidence. We must NOT mask.
            log.debug(f"price_ocr: NO GEOMETRIC GAP found for '{raw_token_text}'")
            return None

    # ── Preprocess and OCR ────────────────────────────────────────────────
    proc = _preprocess_for_digit_ocr(masked_crop)
    pil_img = Image.fromarray(proc)

    try:
        from ocr.win_ocr import image_to_string_win
        raw_result = image_to_string_win(
            pil_img,
            config=_DIGIT_ONLY_CONFIG,
        ).strip()
    except Exception as e:
        log.debug(f"price_ocr: Tesseract digit-pass failed: {e}")
        return None

    # Strip any stray dots or spaces
    digits_only = re.sub(r"[^\d.]", "", raw_result)

    if not digits_only:
        log.debug(f"price_ocr: digit-pass returned no digits for '{raw_token_text}'")
        return None

    try:
        value = float(digits_only)
    except ValueError:
        log.debug(f"price_ocr: could not parse '{digits_only}' as float")
        return None

    if value < _PRICE_FLOOR or value > _PRICE_CEILING:
        log.debug(
            f"price_ocr: digit-pass value {value} out of range "
            f"[{_PRICE_FLOOR},{_PRICE_CEILING}] for '{raw_token_text}'"
        )
        return None

    debug_str = (
        f"digit_only_ocr: raw='{raw_token_text}' "
        f"ocr_result='{raw_result}' "
        f"value={value} "
        f"mask={strip_reason or 'none'}"
    )
    log.debug(f"price_ocr: {debug_str}")
    return (value, debug_str)


def normalize_price_to_structured(
    numeric_value: float,
    raw_ocr_text: str,
    currency: str = "INR",
) -> dict:
    """
    Convert a validated numeric price value to the target structured format:

        {
            "price": 169,
            "currency": "INR",
            "raw_price_text": "₹169",
        }

    This is the canonical internal representation.
    The display layer prepends the ₹ symbol.
    """
    int_val = int(numeric_value) if numeric_value == int(numeric_value) else numeric_value
    return {
        "price": int_val,
        "currency": currency,
        "raw_price_text": raw_ocr_text,
    }
