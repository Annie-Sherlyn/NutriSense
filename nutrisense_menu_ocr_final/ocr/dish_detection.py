"""
ocr/dish_detection.py
Dish candidate detection from OCR visual lines.

DESIGN:
- NO hardcoded food list — works on ANY dish name
- Detects multi-word dish phrases from adjacent tokens in a visual line
- Excludes section headings, headers, phone numbers, addresses
- Excludes pure numeric tokens (those become price candidates)
- Does NOT include price tokens in the dish text
"""

from __future__ import annotations
import re
from typing import List, Optional, Set

from config.settings import (
    SECTION_HEADINGS,
    HEADER_FOOTER_KEYWORDS,
    DISH_MIN_ALPHA_CHARS,
)
from models.schemas import OCRToken, VisualLine, DishCandidate, PriceCandidate, BBox
from utils.logging_utils import get_logger

log = get_logger("ocr.dish_detection")

# Phone number pattern: 7+ consecutive digits
_RE_PHONE = re.compile(r'\d{7,}')

# Postcode: 5-6 digit number at word boundary
_RE_POSTCODE = re.compile(r'\b\d{5,6}\b')

# Pure numeric token
_RE_PURE_NUMERIC = re.compile(r'^[\d.,]+$')

# Price suffix token (e.g. "/-")
_RE_PRICE_SUFFIX = re.compile(r'^/[-—]?$')

# Hyphen-only or dash-only (not part of compound words)
_RE_PUNCTUATION_ONLY = re.compile(r'^[^\w₹]+$')


def _is_pure_numeric(text: str) -> bool:
    return bool(_RE_PURE_NUMERIC.match(text.strip()))


def _has_enough_alpha(text: str) -> bool:
    """Token must have at least DISH_MIN_ALPHA_CHARS alphabetic characters."""
    return sum(c.isalpha() for c in text) >= DISH_MIN_ALPHA_CHARS


def _looks_like_phone_or_address(text: str) -> bool:
    if _RE_PHONE.search(text):
        return True
    if _RE_POSTCODE.search(text):
        return True
    return False


def _is_section_heading(text: str) -> bool:
    """Check if a single token matches a known section heading."""
    lower = text.lower().strip().rstrip(":")
    return lower in SECTION_HEADINGS


def _is_header_footer_word(text: str) -> bool:
    lower = text.lower().strip().rstrip(":")
    return lower in HEADER_FOOTER_KEYWORDS


def _collect_dish_tokens_from_line(
    line: VisualLine,
    price_token_ids: Set[int],
) -> List[List[OCRToken]]:
    """
    Collect dish phrase groups from a visual line.
    Skips tokens that are price candidates or numeric.
    Returns list of groups — a line may have multiple dish phrases
    (e.g., in a two-column menu, each side may have a dish).
    """
    sorted_toks = line.sorted_tokens()
    groups: List[List[OCRToken]] = []
    current_group: List[OCRToken] = []

    for tok in sorted_toks:
        t = tok.normalized_text.strip()

        # Skip tokens already claimed by price detection
        if id(tok) in price_token_ids:
            if current_group:
                groups.append(current_group)
                current_group = []
            continue

        # Skip price-suffix tokens
        if _RE_PRICE_SUFFIX.match(t):
            if current_group:
                groups.append(current_group)
                current_group = []
            continue

        # Skip pure numeric tokens (potential prices)
        if _is_pure_numeric(t):
            if current_group:
                groups.append(current_group)
                current_group = []
            continue

        # Skip punctuation-only tokens
        if _RE_PUNCTUATION_ONLY.match(t):
            # Do NOT break the group — leader dots/dashes between dish and price
            # are already filtered out; isolated punctuation is noise
            continue

        # Skip clearly non-dish tokens
        if _looks_like_phone_or_address(t):
            if current_group:
                groups.append(current_group)
                current_group = []
            continue

        # Token passes — add to current group
        current_group.append(tok)

    if current_group:
        groups.append(current_group)

    # Filter groups that have no alphabetic content
    filtered = []
    for grp in groups:
        combined = " ".join(t.normalized_text for t in grp)
        if _has_enough_alpha(combined):
            filtered.append(grp)

    return filtered


def _tokens_to_candidate(
    tokens: List[OCRToken],
    line_index: int,
) -> Optional[DishCandidate]:
    """Build a DishCandidate from a group of OCR tokens."""
    if not tokens:
        return None

    raw_parts = [t.raw_text for t in tokens]
    norm_parts = [t.normalized_text for t in tokens]

    raw_text = " ".join(raw_parts)
    normalized = " ".join(norm_parts)

    # Compute bounding box spanning all tokens
    xs = [t.x for t in tokens]
    ys = [t.y for t in tokens]
    rights = [t.right() for t in tokens]
    bottoms = [t.bottom() for t in tokens]
    bbox = BBox(
        x=min(xs),
        y=min(ys),
        width=max(rights) - min(xs),
        height=max(bottoms) - min(ys),
    )

    avg_conf = sum(t.confidence for t in tokens) / len(tokens)

    # Title-case for display
    display = normalized.title()

    is_heading = _is_section_heading(normalized) or all(
        _is_section_heading(t.normalized_text) or _is_header_footer_word(t.normalized_text)
        for t in tokens
    )

    return DishCandidate(
        raw_text=raw_text,
        normalized_text=display,
        bbox=bbox,
        ocr_confidence=avg_conf,
        source_tokens=tokens,
        line_index=line_index,
        is_section_heading=is_heading,
    )


def _classify_headers(dishes: List[DishCandidate], price_candidates: List[PriceCandidate]) -> None:
    """
    Classify whether a dish candidate is actually a section heading using structural signals.
    """
    for dish in dishes:
        text = dish.normalized_text.strip()
        if not text:
            continue
            
        if dish.is_section_heading:
            continue
            
        prices_on_line = [p for p in price_candidates if p.line_index == dish.line_index and p.in_price_column]
        dishes_on_line = [d for d in dishes if d.line_index == dish.line_index and d is not dish]
        
        raw = dish.raw_text.strip()
        alpha_chars = [c for c in raw if c.isalpha()]
        upper_chars = [c for c in alpha_chars if c.isupper()]
        upper_ratio = len(upper_chars) / max(1, len(alpha_chars)) if alpha_chars else 0
        word_count = len(text.split())
        
        if prices_on_line:
            continue
            
        if dishes_on_line:
            continue
            
        if word_count <= 3 and upper_ratio > 0.8:
            # Only classify as heading if:
            # 1. There are no in-column price candidates anywhere (single-column headings)
            # 2. AND the text is not a common dish name word
            any_price_column = any(p.in_price_column for p in price_candidates)
            if not any_price_column:
                dish.is_section_heading = True

def detect_dish_candidates(
    lines: List[VisualLine],
    price_candidates: List[PriceCandidate],
) -> List[DishCandidate]:
    """
    Detect dish candidates from visual lines.

    For each line:
      1. Collect all token IDs that belong to price candidates (to exclude them).
      2. Collect remaining alphabetic token groups.
      3. Build DishCandidate objects from groups.

    Multi-word dishes are automatically handled because we group adjacent tokens.
    """
    # Build a set of OCRToken ids that are price tokens
    price_token_ids: Set[int] = set()
    for pc in price_candidates:
        for tok in pc.source_tokens:
            price_token_ids.add(id(tok))

    dishes: List[DishCandidate] = []

    for line in lines:
        groups = _collect_dish_tokens_from_line(line, price_token_ids)
        for grp in groups:
            cand = _tokens_to_candidate(grp, line.line_index)
            if cand:
                dishes.append(cand)
                
    _classify_headers(dishes, price_candidates)

    log.info(
        f"Dish detection: {len(dishes)} dish candidates "
        f"({sum(1 for d in dishes if d.is_section_heading)} headings)"
    )
    for d in dishes:
        flag = " [HEADING]" if d.is_section_heading else ""
        log.debug(
            f"  Line {d.line_index} | raw='{d.raw_text}' | "
            f"display='{d.normalized_text}'{flag}"
        )

    return dishes
