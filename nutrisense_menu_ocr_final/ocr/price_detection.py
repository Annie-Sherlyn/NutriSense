"""
ocr/price_detection.py
Independent price candidate detection from OCR tokens.

DESIGN:
- Detect multiple price formats: ₹80, Rs 80, 80/-, 80
- Classify each candidate by type (CURRENCY, RS, SUFFIX, STANDALONE)
- Mark quantity conflicts (e.g., "6 PCS" should not become a price)
- Detect price column from repeated x-coordinates
- NEVER invent or "fix" prices — preserve raw OCR values
- A standalone number is not automatically a price; it requires context
"""

from __future__ import annotations
import re
import statistics
from typing import List, Optional, Tuple

from config.settings import (
    PRICE_MIN,
    PRICE_MAX,
    PRICE_MIN_DIGITS,
    PRICE_MAX_DIGITS,
    PRICE_TYPE_CURRENCY,
    PRICE_TYPE_RS,
    PRICE_TYPE_SUFFIX,
    PRICE_TYPE_STANDALONE,
    PRICE_COLUMN_MIN_COUNT,
    PRICE_COLUMN_X_TOLERANCE_FRAC,
    QUANTITY_UNITS,
)
from models.schemas import OCRToken, VisualLine, PriceCandidate, BBox
from utils.logging_utils import get_logger

log = get_logger("ocr.price_detection")

# Lazy import to avoid circular at module level — imported inside function
_digit_ocr_available = True
try:
    from ocr.price_ocr import digit_only_ocr_on_bbox
except ImportError:
    _digit_ocr_available = False
    log.warning("price_ocr module not available — digit-only re-pass disabled")


# ─────────────────────────────────────────────
# REGEX PATTERNS
# ─────────────────────────────────────────────

# ₹80  |  ₹ 80  |  ₹80.00
_RE_CURRENCY = re.compile(
    r'^₹\s*(\d{1,4}(?:\.\d{1,2})?)$'
)

# Rs 80  |  Rs. 80  |  RS 80  |  rs 80
_RE_RS = re.compile(
    r'^(?:Rs\.?|RS|rs\.?)\s*(\d{1,4}(?:\.\d{1,2})?)$',
    re.IGNORECASE,
)

# 80/-  |  80 /-  |  80/-
_RE_SUFFIX = re.compile(
    r'^(\d{1,4}(?:\.\d{1,2})?)\s*/[-—]?$'
)

# Pure number: 40, 120, 999
_RE_STANDALONE = re.compile(
    r'^(\d{1,4}(?:\.\d{1,2})?)$'
)

# Composite: a token that starts with ₹ but has extra spaces — handled by multi-token logic
_RE_CURRENCY_LOOSE = re.compile(
    r'(?:₹|Rs\.?|RS)\s*(\d{1,4}(?:\.\d{1,2})?)', re.IGNORECASE
)


def _count_digits(s: str) -> int:
    return sum(c.isdigit() for c in s)


def _parse_price_token(
    tok: OCRToken, next_tok: Optional[OCRToken] = None
) -> Optional[PriceCandidate]:
    """
    Try to parse a single token (or a two-token pair) as a price.
    Returns a PriceCandidate or None.

    Two-token case: "₹" followed by "80" as separate tokens.
    """
    text = tok.normalized_text.strip()

    # ── Single-token ─────────────────────────────────────────
    m = _RE_CURRENCY.match(text)
    if m:
        val = float(m.group(1))
        return _make_candidate(
            tok, [tok], tok.raw_text, m.group(1), PRICE_TYPE_CURRENCY, val, 0.9
        )

    m = _RE_RS.match(text)
    if m:
        val = float(m.group(1))
        return _make_candidate(
            tok, [tok], tok.raw_text, m.group(1), PRICE_TYPE_RS, val, 0.85
        )

    m = _RE_SUFFIX.match(text)
    if m:
        val = float(m.group(1))
        return _make_candidate(
            tok, [tok], tok.raw_text, m.group(1), PRICE_TYPE_SUFFIX, val, 0.88
        )

    m = _RE_STANDALONE.match(text)
    if m:
        val = float(m.group(1))
        ndig = _count_digits(text)
        if PRICE_MIN_DIGITS <= ndig <= PRICE_MAX_DIGITS:
            cand = _make_candidate(
                tok, [tok], tok.raw_text, m.group(1), PRICE_TYPE_STANDALONE, val, 0.5
            )
            # GATE 2: Generate alternative candidate
            if ndig in (3, 4) and text[0] in ("7", "2", "?", "R", "F", "f", "r"):
                try:
                    alt_val = float(text[1:])
                    if alt_val > 0:
                        cand.artifact_alternative = alt_val
                except ValueError:
                    pass
            return cand

    # ── Two-token: "₹" + "80" ────────────────────────────────
    if next_tok and text in ("₹", "Rs", "RS", "Rs.", "rs"):
        next_text = next_tok.normalized_text.strip()
        m2 = _RE_STANDALONE.match(next_text)
        if m2:
            val = float(m2.group(1))
            combined_raw = f"{tok.raw_text} {next_tok.raw_text}"
            ptype = PRICE_TYPE_CURRENCY if text == "₹" else PRICE_TYPE_RS
            conf = 0.9 if ptype == PRICE_TYPE_CURRENCY else 0.85
            # Merge bounding boxes
            merged_bbox = BBox(
                x=min(tok.x, next_tok.x),
                y=min(tok.y, next_tok.y),
                width=max(tok.right(), next_tok.right()) - min(tok.x, next_tok.x),
                height=max(tok.bottom(), next_tok.bottom()) - min(tok.y, next_tok.y),
            )
            avg_conf = (tok.confidence + next_tok.confidence) / 2
            return PriceCandidate(
                raw_text=combined_raw,
                normalized_text=next_text,
                price_type=ptype,
                numeric_value=val,
                bbox=merged_bbox,
                ocr_confidence=avg_conf,
                price_confidence=conf,
                source_tokens=[tok, next_tok],
            )

    return None


def _make_candidate(
    tok: OCRToken,
    source_tokens: List[OCRToken],
    raw_text: str,
    normalized_text: str,
    price_type: str,
    numeric_value: float,
    price_confidence: float,
) -> PriceCandidate:
    bbox = BBox(x=tok.x, y=tok.y, width=tok.width, height=tok.height)
    return PriceCandidate(
        raw_text=raw_text,
        normalized_text=normalized_text,
        price_type=price_type,
        numeric_value=numeric_value,
        bbox=bbox,
        ocr_confidence=tok.confidence,
        price_confidence=price_confidence,
        source_tokens=source_tokens,
    )


def _is_quantity_conflict(
    candidate: PriceCandidate, line: VisualLine
) -> bool:
    """
    Return True if a standalone number appears directly adjacent to a unit keyword.
    Example: "6 PCS" — the 6 is a quantity, not a price.
    """
    if candidate.price_type != PRICE_TYPE_STANDALONE:
        return False  # explicit price markers override unit check

    tokens = line.sorted_tokens()
    # Find position of price token in the line
    for i, tok in enumerate(tokens):
        if tok is candidate.source_tokens[0]:
            # Check the next token
            if i + 1 < len(tokens):
                next_text = tokens[i + 1].normalized_text.lower().strip(".")
                if next_text in QUANTITY_UNITS:
                    return True
            # Check the previous token
            if i > 0:
                prev_text = tokens[i - 1].normalized_text.lower().strip(".")
                if prev_text in QUANTITY_UNITS:
                    return True
    return False


DATE_TIME_INDICATORS = {
    "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec",
    "am", "pm", "a.m.", "p.m."
}

def _is_date_or_time_context(candidate: PriceCandidate, line: VisualLine) -> bool:
    """
    Return True if the candidate is on a line that strongly indicates a date/timestamp.
    E.g. "Nov 25, 2025" or "10:11 pm".
    """
    if candidate.price_type != PRICE_TYPE_STANDALONE:
        return False
        
    tokens = line.sorted_tokens()
    line_text = " ".join(t.raw_text.lower() for t in tokens)
    
    # Check for month names or am/pm
    for tok in tokens:
        t_clean = tok.normalized_text.lower().strip(",.")
        if t_clean in DATE_TIME_INDICATORS:
            return True
            
    # Check for HH:MM time pattern (e.g. 10:11)
    import re
    if re.search(r'\b\d{1,2}:\d{2}\b', line_text):
        return True
        
    # Check for date slash patterns (DD/MM/YYYY)
    if re.search(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b', line_text):
        return True
        
    return False

def _filter_dish_numbers(candidates: List[PriceCandidate], lines: List[VisualLine]) -> List[PriceCandidate]:
    """
    Remove standalone numbers that are likely part of a dish name (e.g. 'Paneer 65').
    """
    from config.settings import PRICE_TYPE_STANDALONE
    valid = []
    line_prices = {}
    for c in candidates:
        line_prices.setdefault(c.line_index, []).append(c)
        
    for c in candidates:
        if c.price_type != PRICE_TYPE_STANDALONE:
            valid.append(c)
            continue
            
        others_on_line = [o for o in line_prices.get(c.line_index, []) if o is not c]
        
        # Rule 1: If there is another price candidate strictly to the right,
        # and this is a short number (e.g. "65"), it's likely a dish number.
        is_left_of_another = any(o.bbox.x > c.bbox.x for o in others_on_line)
        
        # Rule 2: It is not in the price column, AND there's a stronger price on the line
        strong_other = any(o.in_price_column or o.price_type != PRICE_TYPE_STANDALONE for o in others_on_line)
        
        line = next((l for l in lines if l.line_index == c.line_index), None)
        is_adjacent_to_text = False
        if line and len(c.raw_text.strip()) <= 2:
            alpha_tokens = [t for t in line.tokens if any(ch.isalpha() for ch in t.normalized_text)]
            if alpha_tokens:
                min_dist = min(
                    min(abs(c.bbox.x - (t.x + t.width)), abs(t.x - (c.bbox.x + c.bbox.width)))
                    for t in alpha_tokens
                )
                if min_dist < max(30, c.bbox.width * 2.5):
                    is_adjacent_to_text = True
                    
        if is_adjacent_to_text and (is_left_of_another or (not c.in_price_column and strong_other)):
            continue
            
        valid.append(c)
    return valid

def _run_digit_only_repass(
    candidates: List[PriceCandidate],
    source_image: "np.ndarray",  # noqa: F821 — numpy imported at call site
) -> None:
    """
    For each candidate that has an artifact_alternative (suspicious leading
    character) or is a CURRENCY_ATTACHED type, run a digit-only OCR re-pass
    on its source bounding box.

    This cleanly separates the ₹ symbol from the numeric value without
    any global string replacement.

    Mutates candidates in-place:
      - Sets candidate.price_numeric to the digit-only result
      - Sets candidate.digit_ocr_applied = True
      - Sets candidate.digit_ocr_debug with a traceable string
      - Does NOT change candidate.numeric_value (original preserved)
    """
    if not _digit_ocr_available:
        return
    if source_image is None or source_image.size == 0:
        return

    from config.settings import PRICE_TYPE_CURRENCY, PRICE_TYPE_RS

    for cand in candidates:
        # Skip if already has a strong explicit currency parse (e.g. "₹ 80" two-token)
        # — these are already correct by construction
        if cand.price_type in (PRICE_TYPE_CURRENCY, PRICE_TYPE_RS):
            # Still set the structured fields from the already-correct numeric_value
            cand.price_numeric = cand.numeric_value
            cand.digit_ocr_applied = False
            cand.digit_ocr_debug = f"explicit_currency_token: value={cand.numeric_value}"
            continue

        # Run the re-pass on:
        #  a) tokens with artifact_alternative (leading artifact char detected)
        #  b) tokens where raw text starts with a known artifact char AND is >= 3 digits
        raw = cand.raw_text.strip()
        has_artifact_prefix = (
            cand.artifact_alternative is not None
            or (
                len(raw) >= 3
                and raw[0] in {"7", "2", "%", "R", "r", "F", "f", "?", "₹", "€", "£"}
                and raw[1:].isdigit()
            )
        )

        if not has_artifact_prefix:
            # No artifact suspicion — trust the original parse
            cand.price_numeric = cand.numeric_value
            cand.digit_ocr_debug = f"no_artifact: value={cand.numeric_value}"
            continue

        tok = cand.source_tokens[0] if cand.source_tokens else None
        if tok is None:
            cand.price_numeric = cand.numeric_value
            continue

        result = digit_only_ocr_on_bbox(
            image_array=source_image,
            token_x=tok.x,
            token_y=tok.y,
            token_w=tok.width,
            token_h=tok.height,
            raw_token_text=raw,
        )

        if result is not None:
            digit_value, debug_str = result
            cand.price_numeric = digit_value
            cand.digit_ocr_applied = True
            cand.digit_ocr_debug = debug_str
            log.info(
                f"[DIGIT RE-PASS] '{raw}' → {digit_value}  "
                f"(raw_ocr={raw})"
            )
        else:
            # Re-pass failed or NO geometric evidence was found.
            # We MUST NOT use the artifact alternative. Preserve the original OCR value.
            import re
            original_digits = re.sub(r"[^\d.]", "", raw)
            try:
                original_val = float(original_digits) if original_digits else cand.numeric_value
            except ValueError:
                original_val = cand.numeric_value
                
            cand.price_numeric = original_val
            cand.numeric_value = original_val
            cand.digit_ocr_applied = False
            cand.digit_ocr_debug = f"no_geom_evidence: keeping_original={original_val}"
            cand.price_confidence = max(0.1, cand.price_confidence - 0.4)
            if cand.price_type == "POSSIBLE_ARTIFACT":
                cand.price_type = "STANDALONE_PRICE"
            log.debug(f"[DIGIT RE-PASS] '{raw}' no geometric evidence, reverting to {original_val}")


def detect_price_candidates(
    lines: List[VisualLine],
    image_width: int,
    source_image: "Optional[np.ndarray]" = None,  # noqa: F821
) -> List[PriceCandidate]:
    """
    Scan all visual lines for price candidates.

    For each line, scan tokens left-to-right.
    A two-token window is used to catch "₹" + "80" split tokens.

    Returns all candidates with line_index set.
    """
    candidates: List[PriceCandidate] = []
    consumed_token_ids: set = set()  # track two-token merges

    for line in lines:
        tokens = line.sorted_tokens()
        i = 0
        while i < len(tokens):
            tok = tokens[i]
            if id(tok) in consumed_token_ids:
                i += 1
                continue

            next_tok = tokens[i + 1] if i + 1 < len(tokens) else None
            cand = _parse_price_token(tok, next_tok)

            if cand is not None:
                cand.line_index = line.line_index

                # GATE 6: Check for date/time semantic conflict
                if _is_date_or_time_context(cand, line):
                    # Skip appending and advance
                    if len(cand.source_tokens) == 2:
                        consumed_token_ids.add(id(tokens[i + 1]))
                        i += 2
                    else:
                        i += 1
                    continue

                # Check quantity conflict
                cand.quantity_conflict = _is_quantity_conflict(cand, line)
                if cand.quantity_conflict:
                    cand.price_confidence *= 0.1  # heavily penalise
                    log.debug(
                        f"  Quantity conflict: '{cand.raw_text}' on line {line.line_index}"
                    )

                candidates.append(cand)

                # If two-token merge occurred, skip next token
                if len(cand.source_tokens) == 2:
                    consumed_token_ids.add(id(tokens[i + 1]))
                    i += 2
                    continue

            i += 1

    # ── Detect price column ───────────────────────────────────────────────
    _detect_price_column(candidates, image_width)

    # ── Contextual penalties (Footer, Phone) ──────────────────────────────
    for cand in candidates:
        _apply_contextual_penalties(cand, lines)

    # ── Currency Artifact Detection ───────────────────────────────────────
    _detect_currency_artifacts(candidates, lines)
    
    # ── Digit-Only OCR Re-pass ────────────────────────────────────────────
    # For any candidate with a suspicious artifact prefix (e.g. 7169 → 169),
    # re-OCR the bounding box with a digit-only whitelist to cleanly strip
    # the ₹ symbol without global string replacement.
    if source_image is not None:
        _run_digit_only_repass(candidates, source_image)
    else:
        # No source image available — populate price_numeric from existing logic
        for cand in candidates:
            cand.price_numeric = cand.effective_numeric_value() if hasattr(cand, 'effective_numeric_value') else cand.numeric_value

    candidates = _filter_dish_numbers(candidates, lines)

    log.info(
        f"Price detection: {len(candidates)} candidates found across {len(lines)} lines"
    )
    for c in candidates:
        flag = " [QTY CONFLICT]" if c.quantity_conflict else ""
        col = " [IN COLUMN]" if c.in_price_column else ""
        art = f" [ARTIFACT={c.currency_artifact_score:.2f}]" if c.currency_artifact_score > 0 else ""
        pen = f" [PEN={c.footer_penalty:.1f}]" if c.footer_penalty > 0 else ""
        log.debug(
            f"  Line {c.line_index} | {c.price_type:22s} | "
            f"raw='{c.raw_text}' norm='{c.normalized_text}' "
            f"val={c.numeric_value} conf={c.price_confidence:.2f}{flag}{col}{art}{pen}"
        )

    return candidates

def _apply_contextual_penalties(cand: PriceCandidate, lines: List[VisualLine]) -> None:
    """Apply footer/address and phone number penalties."""
    # Find the line
    line = next((l for l in lines if l.line_index == cand.line_index), None)
    if not line:
        return

    text_lower = line.full_text().lower()
    from config.settings import HEADER_FOOTER_KEYWORDS
    
    # Check for footer keywords
    if any(kw in text_lower for kw in HEADER_FOOTER_KEYWORDS):
        cand.footer_penalty = 0.5
        
    # Check for zip codes / phone numbers (starts with 0 and no decimal, or 6 digits)
    if cand.price_type == PRICE_TYPE_STANDALONE:
        # Pincodes (6 digits) - already filtered by regex but just in case
        if len(cand.raw_text) >= 6:
            cand.address_penalty = 0.8
        # Phone area codes (starts with 0, length >= 3)
        if cand.raw_text.startswith("0") and "." not in cand.raw_text and len(cand.raw_text) >= 3:
            cand.address_penalty = 0.8

def _detect_currency_artifacts(candidates: List[PriceCandidate], lines: List[VisualLine]) -> None:
    """
    Identifies if a STANDALONE_NUMBER like '780' is actually '₹80'.
    Updates the candidate's numeric_value and price_type if the artifact score
    beats the raw score by a configurable margin.
    """
    from config.settings import PRICE_TYPE_POSSIBLE_ARTIFACT, PRICE_TYPE_STANDALONE
    
    MIN_CORRECTION_MARGIN = 0.3
    
    for cand in candidates:
        if cand.price_type != PRICE_TYPE_STANDALONE or cand.artifact_alternative is None:
            continue
            
        alt_val = cand.artifact_alternative
        raw_val = cand.numeric_value
        
        cand.raw_score = 0.5  # Base score for the raw token
        cand.currency_artifact_score = 0.0  # Base score for the artifact token
        
        # 1. Gather neighbors for contextual statistics
        # Priority 1: Same price column (spatial alignment)
        tolerance = max(25, int(cand.bbox.width * 1.5))
        my_right = cand.bbox.x + cand.bbox.width
        
        column_neighbors = [
            c for c in candidates
            if c is not cand and abs((c.bbox.x + c.bbox.width) - my_right) <= tolerance
        ]
        
        if len(column_neighbors) >= 3:
            neighboring = column_neighbors
        else:
            # Priority 2: Local row neighborhood
            neighboring = [
                c for c in candidates
                if c is not cand and abs(c.line_index - cand.line_index) <= 5
            ]
            
        # If still very few, fallback to global menu context
        if len(neighboring) < 3:
            neighboring = [c for c in candidates if c is not cand]
        
        trusted_vocab = set()
        med = 0.0
        mad = 0.0
        
        if neighboring:
            # Trusted vocabulary is prices that are explicitly currency or very confident
            trusted_vocab = {c.numeric_value for c in neighboring if c.numeric_value > 0}
            
            # 2. Local Median and MAD
            # Use the artifact alternative for neighbors if it exists, to prevent a corrupted column
            # from shifting the median so high that it masks the corruption itself.
            vals = [
                c.artifact_alternative if (c.price_type == PRICE_TYPE_STANDALONE and c.artifact_alternative) else c.numeric_value
                for c in neighboring if c.numeric_value > 0
            ]
            if vals:
                med = statistics.median(vals)
                mad = statistics.median([abs(v - med) for v in vals])
        
        # SCORE THE RAW CANDIDATE
        if cand.in_price_column:
            cand.raw_score += 0.2
        if raw_val in trusted_vocab:
            cand.raw_score += 0.3
            
        # SCORE THE ALTERNATIVE CANDIDATE
        # Evidence 1: Price Column
        if cand.in_price_column:
            cand.currency_artifact_score += 0.3
            
        # Evidence 2: Same row has dish text
        line = next((l for l in lines if l.line_index == cand.line_index), None)
        if line:
            has_dish_text = any(
                t.x < cand.bbox.x and any(c.isalpha() for c in t.normalized_text)
                for t in line.tokens
            )
            if has_dish_text:
                cand.currency_artifact_score += 0.2
                
        # Evidence 3: Local Price Distribution (Median/MAD)
        if med > 0:
            # If the raw value is a massive outlier (e.g. > 3.5x the median)
            if raw_val > med * 3.5:
                cand.currency_artifact_score += 0.3
                cand.raw_score -= 0.3  # Penalize raw
                
            # Check how the alternative fits the MAD
            # A robust check: if alternative is much closer to the median
            diff_raw = abs(raw_val - med)
            diff_alt = abs(alt_val - med)
            
            if diff_alt < diff_raw:
                cand.currency_artifact_score += 0.2
                if mad > 0 and diff_alt <= mad * 2:
                    # Fits tightly within the expected deviation
                    cand.currency_artifact_score += 0.2
        
        # Evidence 4: Trusted Vocabulary
        if alt_val in trusted_vocab:
            cand.currency_artifact_score += 0.2
            
        # Evidence 5: Bounding Box Width Signal
        # A standalone '780' usually has 3 characters.
        # If the width is very small for 3 digits, it might be '₹80'.
        # We can't be too strict, but width per character can be a weak signal.
        if cand.bbox.width > 0:
            char_width = cand.bbox.width / max(1, len(cand.raw_text))
            # Typical char width might be 10-25 pixels. If it's very squished, it might be an artifact.
            if char_width < 15:
                cand.currency_artifact_score += 0.1
                
        # GATE 3: Decide based on Margin
        cand.debug_info = f"med={med} mad={mad} n={len(neighboring)}"
        
        if cand.currency_artifact_score >= cand.raw_score + MIN_CORRECTION_MARGIN:
            cand.price_type = PRICE_TYPE_POSSIBLE_ARTIFACT
            cand.numeric_value = alt_val
            # Enhance base confidence slightly because we found strong context
            cand.price_confidence = min(0.9, cand.price_confidence + 0.2)
            log.info(f"[PRICE CORRECTION] OCR: {cand.raw_text} -> Candidate: {alt_val} | "
                     f"Reason: currency-prefix confusion | Score: {cand.currency_artifact_score:.2f} "
                     f"(Raw: {cand.raw_score:.2f})")


def _detect_price_column(
    candidates: List[PriceCandidate], image_width: int
) -> None:
    """
    Mark candidates as in_price_column=True when multiple candidates
    share a similar right-edge x-coordinate (right-aligned price column).

    We compare right edges (x + width) because right-aligned prices are common.
    """
    if not candidates:
        return

    tolerance = max(10, int(image_width * PRICE_COLUMN_X_TOLERANCE_FRAC))

    # Group by right-edge proximity
    right_edges = [c.bbox.x + c.bbox.width for c in candidates]

    # For each candidate, count how many others have a similar right-edge
    for i, cand_i in enumerate(candidates):
        re_i = right_edges[i]
        cluster = [
            j for j, re_j in enumerate(right_edges)
            if abs(re_i - re_j) <= tolerance
        ]
        if len(cluster) >= PRICE_COLUMN_MIN_COUNT:
            cand_i.in_price_column = True

    column_count = sum(1 for c in candidates if c.in_price_column)
    if column_count > 0:
        log.info(f"Price column detected: {column_count} candidates in column")


def validate_price_candidate(
    cand: PriceCandidate,
    all_candidates: List[PriceCandidate],
) -> float:
    """
    Compute a final price_confidence score for a candidate
    based on multiple signals.
    """
    from config.settings import PRICE_TYPE_POSSIBLE_ARTIFACT, PRICE_TYPE_STANDALONE

    conf = cand.price_confidence

    # Hard filter: quantity conflict
    if cand.quantity_conflict:
        return conf  # already penalized in detect_price_candidates

    # Apply penalties
    conf = max(0.0, conf - cand.footer_penalty - cand.address_penalty)

    # Reward price column membership
    if cand.in_price_column:
        conf = min(1.0, conf + 0.15)

    # Standalone numbers (that aren't artifacts) need more evidence
    if cand.price_type == PRICE_TYPE_STANDALONE:
        # If it's just a number, but not in a column and no other evidence, penalize it
        if not cand.in_price_column:
            conf -= 0.2

    # Reward OCR confidence
    if cand.ocr_confidence > 80:
        conf = min(1.0, conf + 0.05)
    elif cand.ocr_confidence < 40:
        conf = max(0.0, conf - 0.15)

    # Reward reasonable value range (soft)
    if PRICE_MIN <= cand.numeric_value <= PRICE_MAX:
        conf = min(1.0, conf + 0.05)
    else:
        conf = max(0.0, conf - 0.20)

    # Reward consistency with neighbours
    neighboring = [
        c for c in all_candidates
        if c is not cand
        and abs(c.line_index - cand.line_index) <= 3
        and not c.quantity_conflict
    ]
    if neighboring:
        values = [c.numeric_value for c in neighboring]
        med = statistics.median(values)
        if med > 0 and (cand.numeric_value / med > 10 or cand.numeric_value / med < 0.1):
            conf = max(0.0, conf - 0.10)

    # Update the candidate's price confidence
    cand.price_confidence = min(1.0, max(0.0, conf))
    return cand.price_confidence


def normalize_price_display(cand: PriceCandidate) -> str:
    """
    Convert a validated price candidate to a display string.

    Rules:
    - Use effective_numeric_value() which returns the digit-only re-pass result
      if available, otherwise falls back to numeric_value.
    - Add ₹ prefix for the display string.
    - Preserve integer display (no trailing .00).
    - NEVER modify raw_text or normalized_text.
    """
    val = cand.effective_numeric_value()
    if val == int(val):
        val_str = str(int(val))
    else:
        val_str = f"{val:.2f}"
    return f"₹{val_str}"
