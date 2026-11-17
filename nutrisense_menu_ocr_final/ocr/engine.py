"""
ocr/engine.py
Tesseract OCR engine wrapper.

Rules:
- Always use pytesseract.image_to_data() — never image_to_string() alone.
- Never hardcode a machine-specific path.
- Support TESSERACT_CMD environment variable.
- Every OCR run returns a full list of OCRToken objects.
"""

from __future__ import annotations
import os
import subprocess
from pathlib import Path
from typing import List, Optional, Tuple
import re
import cv2
import numpy as np
import pandas as pd
import pytesseract
from PIL import Image

from config.settings import (
    TESSERACT_CMD,
    PSM_MODES,
    OEM_MODE,
    MIN_TOKEN_CONFIDENCE,
)
from models.schemas import OCRToken, OCRRunMetadata
from utils.image import ImageWrapper
from utils.logging_utils import get_logger

log = get_logger("ocr.engine")


def configure_tesseract() -> bool:
    """
    Configure pytesseract with the correct executable path.
    Priority:
      1. TESSERACT_CMD environment variable
      2. Already on PATH (pytesseract default behaviour)
    Returns True if Tesseract appears usable.
    """
    cmd = TESSERACT_CMD or os.environ.get("TESSERACT_CMD")
    if cmd:
        pytesseract.pytesseract.tesseract_cmd = cmd
        log.info(f"Tesseract path set from env: {cmd}")
    else:
        import shutil
        if not shutil.which("tesseract"):
            fallbacks = [r"C:\Program Files\Tesseract-OCR\tesseract.exe", r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"]
            for fb in fallbacks:
                if os.path.exists(fb):
                    pytesseract.pytesseract.tesseract_cmd = fb
                    log.info(f"Using Tesseract fallback: {fb}")
                    break
        else:
            log.info("Using Tesseract from system PATH")

    try:
        version = pytesseract.get_tesseract_version()
        log.info(f"Tesseract version: {version}")
        return True
    except Exception as e:
        log.error(f"Tesseract not found: {e}")
        return False


def get_tesseract_version() -> str:
    """Return Tesseract version string."""
    try:
        return str(pytesseract.get_tesseract_version())
    except Exception:
        return "Unknown"


def _normalize_token_text(raw: str) -> str:
    """
    Lightweight normalization of a single OCR token.
    Strips surrounding whitespace.
    Does NOT modify the actual characters (that preserves traceability).
    """
    return raw.strip()


def run_ocr_on_image(
    wrapper: ImageWrapper,
    psm: int,
) -> Tuple[List[OCRToken], OCRRunMetadata]:
    """
    Run Tesseract image_to_data on a single preprocessed image variant
    with a specific PSM mode.

    Returns:
        tokens         - list of OCRToken (filtered, confidence >= MIN_TOKEN_CONFIDENCE)
        run_metadata   - scoring metadata for this run
    """
    config = f"--oem {OEM_MODE} --psm {psm}"

    # Convert BGR numpy array to PIL Image (pytesseract expects PIL or path)
    arr = wrapper.array
    if len(arr.shape) == 3:
        pil_img = Image.fromarray(cv2.cvtColor(arr, cv2.COLOR_BGR2RGB))
    else:
        pil_img = Image.fromarray(arr)

    try:
        from ocr.win_ocr import image_to_data_win
        df: pd.DataFrame = image_to_data_win(pil_img)
    except Exception as e:
        log.error(f"Tesseract failed (PSM={psm}, variant={wrapper.name}): {e}")
        meta = OCRRunMetadata(
            preprocessing_variant=wrapper.name,
            psm_mode=psm,
            token_count=0,
            avg_confidence=0.0,
            valid_price_count=0,
            valid_text_density=0.0,
            duplicate_rate=0.0,
        )
        return [], meta

    tokens: List[OCRToken] = []
    all_conf: List[float] = []

    for _, row in df.iterrows():
        raw_text = str(row.get("text", "")).strip()
        conf = float(row.get("conf", -1))

        # Skip empty tokens and Tesseract internal markers
        if not raw_text or raw_text == "-1" or conf < 0:
            continue

        # Keep tokens at or above minimum confidence
        if conf < MIN_TOKEN_CONFIDENCE:
            all_conf.append(conf)  # still track for metadata
            continue

        all_conf.append(conf)

        token = OCRToken(
            raw_text=raw_text,
            normalized_text=_normalize_token_text(raw_text),
            confidence=conf,
            x=int(row.get("left", 0)),
            y=int(row.get("top", 0)),
            width=int(row.get("width", 0)),
            height=int(row.get("height", 0)),
            block_num=int(row.get("block_num", 0)),
            par_num=int(row.get("par_num", 0)),
            line_num=int(row.get("line_num", 0)),
            word_num=int(row.get("word_num", 0)),
        )
        tokens.append(token)

    # ── Compute run metadata for quality scoring ──────────────────────────
    n = len(tokens)
    avg_conf = float(np.mean([t.confidence for t in tokens])) if tokens else 0.0

    # Valid text density: fraction with conf > MIN_TOKEN_CONFIDENCE (already filtered)
    total_seen = len(all_conf)
    valid_density = n / max(total_seen, 1)

    # Duplicate rate
    texts = [t.normalized_text.lower() for t in tokens]
    unique = len(set(texts))
    dup_rate = 1.0 - (unique / max(n, 1))

    # Count price-like tokens (quick heuristic for run scoring)
    price_re = re.compile(
        r"(₹\s*\d+|Rs\.?\s*\d+|RS\s*\d+|\d+/-|\b\d{2,4}\b)", re.IGNORECASE
    )
    price_count = sum(1 for t in tokens if price_re.search(t.normalized_text))

    meta = OCRRunMetadata(
        preprocessing_variant=wrapper.name,
        psm_mode=psm,
        token_count=n,
        avg_confidence=avg_conf,
        valid_price_count=price_count,
        valid_text_density=valid_density,
        duplicate_rate=dup_rate,
    )

    log.debug(
        f"OCR run PSM={psm} variant={wrapper.name}: "
        f"{n} tokens, avg_conf={avg_conf:.1f}, "
        f"prices={price_count}, dup={dup_rate:.2f}"
    )
    return tokens, meta


def score_ocr_run(meta: OCRRunMetadata) -> float:
    """
    Score an OCR run to decide which result to use.

    IMPORTANT: Do NOT simply choose the run with the most tokens.
    Quality indicators:
      + High average confidence
      + High valid text density
      + More price candidates
      - High duplicate rate (lots of garbage)
      - Very low token count (missed most of the menu)
    """
    score = 0.0
    score += meta.avg_confidence * 0.4           # confidence matters most
    score += meta.valid_text_density * 20.0      # high density is good
    score += meta.valid_price_count * 3.0        # finding prices is important
    score -= meta.duplicate_rate * 15.0          # duplicates indicate garbage
    # Penalise suspiciously low token counts
    if meta.token_count < 3:
        score -= 20.0
    return score


def select_best_ocr_run(
    runs: List[Tuple[List[OCRToken], OCRRunMetadata]]
) -> Tuple[List[OCRToken], OCRRunMetadata]:
    """Select the best OCR run from multiple (preprocessing × PSM) runs."""
    if not runs:
        raise ValueError("No OCR runs to select from")

    scored = []
    for tokens, meta in runs:
        meta.score = score_ocr_run(meta)
        scored.append((tokens, meta))
        log.debug(f"  score={meta.score:.2f}  PSM={meta.psm_mode}  variant={meta.preprocessing_variant}")

    scored.sort(key=lambda r: r[1].score, reverse=True)
    best_tokens, best_meta = scored[0]
    log.info(
        f"Best OCR run: PSM={best_meta.psm_mode} "
        f"variant={best_meta.preprocessing_variant} "
        f"score={best_meta.score:.2f} "
        f"tokens={best_meta.token_count}"
    )
    return best_tokens, best_meta
