"""
Voice parser: text → list of {raw_label, quantity, unit|None}.

Pipeline:
  1. Strip meal-time filler phrases
  2. Normalize word-numbers to digits
  3. Apply ASR/spelling normalization (NOT a food database)
  4. Split on sentence boundaries + coordinating conjunctions
  5. Extract quantity + explicit unit per segment
  6. Clean up food label (strip punctuation, normalize plurals)

Unit is left as None when not spoken — the resolver fills it from the CSV
serving_unit for the matched food.
"""
import re

# ---------------------------------------------------------------------------
# STEP 3 — ASR / spelling normalization dict
#   Keys are regex word-boundary patterns; values are canonical spellings.
#   This is a *spelling* fix layer only — it does NOT map to food_ids.
# ---------------------------------------------------------------------------
_ASR_NORM: list[tuple[re.Pattern, str]] = [
    (re.compile(r'\bkipli\b', re.I), 'idli'),
    (re.compile(r'\bidly\b', re.I), 'idli'),
    (re.compile(r'\bidlies\b', re.I), 'idli'),
    (re.compile(r'\bidlie\b', re.I), 'idli'),
    (re.compile(r'\bboori\b', re.I), 'poori'),
    (re.compile(r'\bpuri\b', re.I), 'poori'),
    # "poori" and "puri" → same lexical form; matching to FD016 is resolver's job
    (re.compile(r'\bbiriyani\b', re.I), 'biryani'),
    (re.compile(r'\bberiani\b', re.I), 'biryani'),
    (re.compile(r'\bbiriani\b', re.I), 'biryani'),
    (re.compile(r'\bsambhar\b', re.I), 'sambar'),
    (re.compile(r'\bdosai\b', re.I), 'dosa'),
    (re.compile(r'\bchapathi\b', re.I), 'chappathi'),
    (re.compile(r'\bchappati\b', re.I), 'chappathi'),
    (re.compile(r'\bchapati\b', re.I), 'chappathi'),
    (re.compile(r'\bparupu vadai\b', re.I), 'paruppu vadai'),
    (re.compile(r'\bmanjurian\b', re.I), 'manchurian'),
    (re.compile(r'\bmanjurion\b', re.I), 'manchurian'),
    (re.compile(r'\bgarlic cloves\b', re.I), 'garlic naan'),
    (re.compile(r'\bgarlic clove\b', re.I), 'garlic naan'),
]

_UNITS = [
    'pieces', 'piece',
    'servings', 'serving',
    'bowls', 'bowl',
    'cups', 'cup',
    'plates', 'plate',
    'glasses', 'glass',
]

# Singular forms for unit normalisation
_UNIT_SINGULAR = {u: u.rstrip('s') if u.endswith('s') and u != 'pieces' else u for u in _UNITS}
_UNIT_SINGULAR['pieces'] = 'piece'
_UNIT_SINGULAR_PAT = re.compile(
    r'^(' + '|'.join(re.escape(u) for u in sorted(_UNITS, key=len, reverse=True)) + r')(?:\s+of)?\s+(.*)',
    re.I
)

# Word-number map applied BEFORE splitting so "one" doesn't become a separator
_NUM_MAP: list[tuple[re.Pattern, str]] = [
    (re.compile(r'\bone\s+and\s+a\s+half\b', re.I), '1.5'),
    (re.compile(r'\bhalf\b', re.I), '0.5'),
    (re.compile(r'\bone\b', re.I), '1'),
    (re.compile(r'\btwo\b', re.I), '2'),
    (re.compile(r'\bthree\b', re.I), '3'),
    (re.compile(r'\bfour\b', re.I), '4'),
    (re.compile(r'\bfive\b', re.I), '5'),
    (re.compile(r'\bsix\b', re.I), '6'),
    (re.compile(r'\bseven\b', re.I), '7'),
    (re.compile(r'\beight\b', re.I), '8'),
    (re.compile(r'\bnine\b', re.I), '9'),
    (re.compile(r'\bten\b', re.I), '10'),
    (re.compile(r'\ban?\b', re.I), '1'),
    (re.compile(r'\bsome\b', re.I), '1'),
]

# Filler phrases to strip before processing
_FILLER_PAT = re.compile(
    r'\b(?:for\s+(?:breakfast|lunch|dinner|snack|brunch)\s+)?i\s+(?:ate|had)\s+',
    re.I
)
_MEAL_SUFFIX_PAT = re.compile(
    r'\s+for\s+(?:breakfast|lunch|dinner|snack|brunch)\b',
    re.I
)


def _apply_asr_norm(text: str) -> str:
    """Apply ASR/spelling normalization. Must run BEFORE matching."""
    for pat, replacement in _ASR_NORM:
        text = pat.sub(replacement, text)
    return text


def _normalize_numbers(text: str) -> str:
    for pat, val in _NUM_MAP:
        text = pat.sub(val, text)
    return text


def _split_items(text: str) -> list[str]:
    """
    Split transcript into per-item segments.

    Rules (applied in order):
      • Always split on  . , ; ! ? &
      • Split on 'and' / 'with' when:
          - the text has a comma (it's a list context), OR
          - 'and'/'with' is immediately followed by a digit (new quantity starts)
    """
    # Normalise whitespace
    text = text.strip()

    # Split on unambiguous punctuation first
    # Replace . , ; ! ? & with a sentinel
    text = re.sub(r'[.;!?]', ',', text)  # treat as list separators
    text = re.sub(r'&', ',', text)

    has_comma = ',' in text

    if has_comma:
        # Comma-list context: treat 'and' / 'with' as separators unconditionally
        parts = re.split(r'\s*(?:,|\band\b|\bwith\b)\s*', text, flags=re.I)
    else:
        # Non-list context: only split 'and'/'with' before a digit
        parts = re.split(
            r'\s*(?:,|\band\b\s+(?=\d)|\bwith\b\s+(?=\d))\s*',
            text,
            flags=re.I
        )

    return [p.strip() for p in parts if p.strip()]


def _parse_segment(segment: str) -> dict:
    """
    Parse a single item segment into {raw_label, quantity, unit}.

    quantity: float (default 1.0)
    unit:     str | None  — None means "not spoken, fill from CSV"
    """
    qty = 1.0
    unit = None  # deliberately None — resolver fills from CSV
    food_name = segment

    # Try to extract leading number
    m = re.match(r'^(\d+(?:\.\d+)?)\s+(.*)', segment)
    if m:
        qty = float(m.group(1))
        rest = m.group(2).strip()

        # Try to consume an explicit unit
        um = _UNIT_SINGULAR_PAT.match(rest)
        if um:
            raw_unit = um.group(1).lower()
            unit = _UNIT_SINGULAR.get(raw_unit, raw_unit.rstrip('s'))
            food_name = um.group(2).strip()
        else:
            food_name = rest
    else:
        food_name = segment

    # Strip trailing/leading punctuation from food label
    food_name = re.sub(r'^[^\w]+|[^\w]+$', '', food_name).strip()
    # Collapse internal whitespace
    food_name = re.sub(r'\s+', ' ', food_name)

    # Plural normalization for common foods (after ASR norm, so kipli→idli already done)
    food_name = _normalize_plural(food_name)

    return {
        'raw_label': food_name.lower(),
        'quantity': qty,
        'unit': unit,  # None → resolver will use CSV serving_unit
    }


def _normalize_plural(label: str) -> str:
    """
    Remove simple English plurals only for known food words.
    Avoids blanket -s stripping which corrupts words like 'sambar', 'naan'.
    """
    # Specific known plural forms
    plural_map = {
        'idlis': 'idli',
        'idlies': 'idli',
        'idlie': 'idli',
        'dosas': 'dosa',
        'chapatis': 'chappathi',
        'chapathis': 'chappathi',
        'chappatis': 'chappathi',
        'pooris': 'poori',
        'pooris': 'poori',
        'naans': 'naan',
        'vadas': 'vada',
        'vadais': 'vadai',
    }
    lower = label.lower()
    if lower in plural_map:
        return plural_map[lower]
    return label


def parse_voice_transcript(text: str) -> dict:
    """
    Parse a voice transcript into meal_type + list of item dicts.

    Returns:
        {
            'meal_type': str | None,
            'items': [{'raw_label': str, 'quantity': float, 'unit': str|None}, ...]
        }
    """
    # Detect meal type before stripping
    meal_type = None
    for m in ['breakfast', 'brunch', 'lunch', 'snack', 'dinner']:
        if re.search(rf'\b{m}\b', text, re.I):
            meal_type = m
            break

    # Strip filler phrases
    text = _FILLER_PAT.sub('', text)
    text = _MEAL_SUFFIX_PAT.sub('', text)

    # Normalize word-numbers BEFORE ASR norm so "one bowl of sambar" → "1 bowl of sambar"
    text = _normalize_numbers(text)

    # Apply ASR/spelling normalization BEFORE splitting
    text = _apply_asr_norm(text)

    # Split into per-item segments
    segments = _split_items(text)

    items = []
    for seg in segments:
        if not seg.strip():
            continue
        parsed = _parse_segment(seg)
        if parsed['raw_label']:
            items.append(parsed)

    return {
        'meal_type': meal_type,
        'items': items,
    }
