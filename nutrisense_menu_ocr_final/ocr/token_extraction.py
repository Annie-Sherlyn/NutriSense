"""
ocr/token_extraction.py
Post-processing of raw OCR tokens before line reconstruction.

Responsibilities:
- Filter obviously invalid tokens
- Normalise Unicode (₹ symbol variants)
- Tag tokens as numeric / alphabetic / mixed
- Preserve raw_text unchanged
"""

from __future__ import annotations
import re
import unicodedata
from typing import List, Tuple

from models.schemas import OCRToken
from utils.logging_utils import get_logger

log = get_logger("ocr.token_extraction")

# ₹ variants that may appear from different encodings
RUPEE_VARIANTS = ["₹", "\u20b9", "Rs", "RS", "rs"]

# Pattern for obvious noise tokens (only symbols, no alphanumerics)
NOISE_PATTERN = re.compile(r'^[^a-zA-Z0-9₹]+$')

# Leader pattern: dots, dashes, underscores only
LEADER_PATTERN = re.compile(r'^[.\-_\s]{2,}$')


def is_leader_token(text: str) -> bool:
    """True if this token is a dotted/dashed leader."""
    return bool(LEADER_PATTERN.match(text.strip()))


def is_noise_token(text: str) -> bool:
    """True if the token contains no alphanumeric characters."""
    return bool(NOISE_PATTERN.match(text.strip()))


def normalize_rupee(text: str) -> str:
    """Normalize various rupee symbol encodings to a single ₹."""
    text = unicodedata.normalize("NFC", text)
    return text


def filter_and_tag_tokens(tokens: List[OCRToken]) -> Tuple[List[OCRToken], List[OCRToken]]:
    """
    Filter token list into:
      valid_tokens   — tokens useful for analysis
      noise_tokens   — filtered out (for debug inspection)

    Returns (valid_tokens, noise_tokens).
    IMPORTANT: raw_text is NEVER modified.
    """
    valid: List[OCRToken] = []
    noise: List[OCRToken] = []

    for tok in tokens:
        raw = tok.raw_text

        # Skip zero-length
        if not raw or not raw.strip():
            noise.append(tok)
            continue

        # Skip pure noise
        if is_noise_token(raw):
            noise.append(tok)
            continue

        # Leaders are noise for analysis (but we keep them tagged so layout engine
        # can still infer positions between dish and price)
        if is_leader_token(raw):
            noise.append(tok)
            continue

        # Normalise the normalized_text field only (never raw_text)
        tok.normalized_text = normalize_rupee(tok.normalized_text)

        valid.append(tok)

    log.debug(f"Token filtering: {len(tokens)} total → {len(valid)} valid, {len(noise)} noise")
    return valid, noise
