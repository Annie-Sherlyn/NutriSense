"""
ocr/preprocessing.py
Controlled image preprocessing for Tesseract.

DESIGN PRINCIPLES (from specification):
- Only a small, named set of variants.
- Always try original/upscaled first.
- Thresholded variants are ALTERNATIVES, not defaults.
- Each variant is independently inspectable and named.
- Never destroy the original image data.
"""

from __future__ import annotations
from typing import Dict
import cv2
import numpy as np

from config.settings import (
    UPSCALE_FACTOR,
    ADAPTIVE_BLOCK_SIZE,
    ADAPTIVE_C,
    PREPROCESSING_VARIANTS,
)
from utils.image import ImageWrapper
from utils.logging_utils import get_logger

log = get_logger("ocr.preprocessing")


def create_preprocessing_variants(wrapper: ImageWrapper) -> Dict[str, ImageWrapper]:
    """
    Create the controlled set of preprocessing variants.
    Each variant retains original_width / original_height for coordinate mapping.

    Returns a dict keyed by variant name.
    """
    orig_w = wrapper.original_width
    orig_h = wrapper.original_height
    bgr = wrapper.array
    results: Dict[str, ImageWrapper] = {}

    # ── Variant 1: original ──────────────────────────────────────────────
    results["original"] = ImageWrapper(bgr.copy(), orig_w, orig_h, name="original")

    # ── Variant 2: upscaled ──────────────────────────────────────────────
    scale = UPSCALE_FACTOR
    upscaled = cv2.resize(
        bgr,
        (int(bgr.shape[1] * scale), int(bgr.shape[0] * scale)),
        interpolation=cv2.INTER_CUBIC,
    )
    results["upscaled"] = ImageWrapper(upscaled, orig_w, orig_h, name="upscaled")

    # ── Variant 3: grayscale ─────────────────────────────────────────────
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    gray_bgr = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)  # keep 3-channel for consistency
    results["gray"] = ImageWrapper(gray_bgr, orig_w, orig_h, name="gray")

    # ── Variant 4: grayscale + adaptive threshold ─────────────────────────
    # Adaptive threshold can help with uneven lighting.
    # NOTE: may destroy thin fonts or ₹ symbols — only use as fallback.
    block = ADAPTIVE_BLOCK_SIZE
    if block % 2 == 0:
        block += 1
    adaptive = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        block,
        ADAPTIVE_C,
    )
    adaptive_bgr = cv2.cvtColor(adaptive, cv2.COLOR_GRAY2BGR)
    results["adaptive"] = ImageWrapper(adaptive_bgr, orig_w, orig_h, name="adaptive")

    # ── Variant 5: grayscale + Otsu threshold ────────────────────────────
    _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    otsu_bgr = cv2.cvtColor(otsu, cv2.COLOR_GRAY2BGR)
    results["otsu"] = ImageWrapper(otsu_bgr, orig_w, orig_h, name="otsu")

    log.debug(f"Created {len(results)} preprocessing variants: {list(results.keys())}")
    return results
