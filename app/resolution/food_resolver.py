"""
Shared food-resolution engine for ALL input modalities (voice, photo, menu OCR).

Architecture:
  - CSV is loaded ONCE at startup into a lookup keyed by food_id.
  - resolve_items() is the single entry point for all modalities.
  - Matching priority: exact name → exact alternate_name → normalized → fuzzy.
  - Ambiguity detection is separate from (and additional to) confidence gating.
  - One unresolved item NEVER discards other successfully resolved items.

Token-aware fuzzy matching via rapidfuzz.token_set_ratio prevents cross-dish
false positives (e.g., "butter chicken" must not match "butter naan").

Dosa / canonical-base rule
--------------------------
"dosa" resolves to FD002 (Plain Dosa) because Plain Dosa IS the base/generic
form — its alternate_names include "Dosai", meaning the plain form is canonical.
Only explicitly modified dosas (masala dosa, rava dosa, ragi dosa) are distinct.
By contrast, "biryani" is ambiguous because EVERY biryani row in the CSV is a
specific variant — there is no "Plain Biryani" row.

Poori rule
----------
"poori" / "puri" needs_verification because the only Poori row in the CSV is
"Poori with Aloo Bhaji" (FD016), which is a specific dish. A plain standalone
Poori does not exist as a separate CSV row.

Pongal rule
-----------
"pongal" is ambiguous: Ven Pongal (FD012) and Sweet Pongal (FD013) are equally
valid interpretations.
"""
from __future__ import annotations

import os
import re
import unicodedata
import pandas as pd
from typing import Optional
from rapidfuzz import fuzz

from app.schemas.resolved_input import (
    ResolvedItem,
    MATCH_CONFIDENCE_THRESHOLD,
    classify_match,
)

# ---------------------------------------------------------------------------
# CSV startup loader (loads once, keyed by food_id)
# ---------------------------------------------------------------------------
_CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'foods.csv')

_FOOD_DB: dict[str, dict] = {}
_NAME_INDEX: list[tuple[str, str, str]] = []  # (norm_name, food_id, original_name)
_LOADED: bool = False


def _norm(s: str) -> str:
    """Normalize to lowercase ASCII, collapse whitespace, strip punctuation."""
    s = s.lower().strip()
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    s = re.sub(r'[^\w\s]', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def reset_food_db() -> None:
    """Reset the in-memory food DB. Use only in tests when the CSV has changed."""
    global _FOOD_DB, _NAME_INDEX, _LOADED, _AMBIGUOUS_TERMS
    _FOOD_DB = {}
    _NAME_INDEX = []
    _LOADED = False
    _AMBIGUOUS_TERMS = set()


def _ensure_loaded(csv_path: str | None = None) -> None:
    """Load the CSV once at startup. Subsequent calls are no-ops."""
    global _FOOD_DB, _NAME_INDEX, _LOADED

    if _LOADED:
        return

    path = csv_path or _CSV_PATH
    df = pd.read_csv(path)
    if 'food_id' not in df.columns:
        raise ValueError("foods.csv must have a 'food_id' column")

    for _, row in df.iterrows():
        fid = str(row['food_id']).strip()
        row_dict = row.to_dict()
        _FOOD_DB[fid] = row_dict

        # Index all searchable name fields (canonical name + alternate_names)
        names_to_index: list[str] = []
        canonical = str(row.get('name', '')).strip()
        if canonical and canonical.lower() != 'nan':
            names_to_index.append(canonical)

        alt = row.get('alternate_names', '')
        if pd.notna(alt) and str(alt).strip() and str(alt).strip().lower() != 'nan':
            for a in str(alt).split(','):
                a = a.strip()
                if a:
                    names_to_index.append(a)

        # Variants are NOT indexed — they are sub-types, matching them would
        # incorrectly route to the parent food.

        for n in names_to_index:
            _NAME_INDEX.append((_norm(n), fid, n))

    _LOADED = True


def get_food_db_dict() -> dict[str, dict]:
    """Return the food DB dict (loading CSV if necessary)."""
    _ensure_loaded()
    return _FOOD_DB


def get_serving_for_food(food_id: str) -> tuple[float, str]:
    """Return (serving_amount, serving_unit) from CSV for a food_id."""
    _ensure_loaded()
    row = _FOOD_DB.get(food_id)
    if row is None:
        return 1.0, 'serving'
    amt = row.get('serving_amount', 1)
    unit = row.get('serving_unit', 'serving')
    try:
        amt = float(amt)
    except (TypeError, ValueError):
        amt = 1.0
    unit = str(unit).strip() if pd.notna(unit) else 'serving'
    return amt, unit


# ---------------------------------------------------------------------------
# Ambiguity set
# ---------------------------------------------------------------------------

_AMBIGUOUS_TERMS: set[str] = set()


def _build_ambiguity_set() -> None:
    """
    Build the set of normalized query terms that must trigger verification.

    Rule: a generic term is ambiguous when:
      (a) Multiple meaningfully different CSV foods match it, AND
      (b) There is NO single canonical/base row for that term.

    Specific decisions:
      - biryani: 9 variants (Veg, Chicken, Mutton, …), no plain row → ambiguous
      - pongal:  2 variants (Ven, Sweet), no plain row → ambiguous
      - poori:   only FD016 "Poori with Aloo Bhaji" (specific dish) → ambiguous
      - vada:    Medu Vada, Masala Vada → ambiguous

    NOT ambiguous:
      - dosa:    FD002 "Plain Dosa" IS the canonical generic row (alternate_names
                 include "Dosai"). Masala Dosa / Rava Dosa etc. are clearly
                 differentiated with their modifier. Plain Dosa is the base form.
      - sambar:  FD088 "Sambar" is the single canonical row.
      - idli:    FD001 "Idli" is the single canonical row.
      - naan:    FD199 "Naan" is the single canonical row.
    """
    global _AMBIGUOUS_TERMS
    _AMBIGUOUS_TERMS = {
        _norm('pongal'),
        _norm('biryani'),
        _norm('poori'),    # no standalone plain poori row; FD016 is "with Aloo Bhaji"
        _norm('puri'),     # lexical equivalent of poori; same rule
        _norm('vada'),     # medu vada (FD009) vs masala vada (FD010)
        _norm('vadai'),
        _norm('dosa'),
        _norm('dosai'),
        # Note: 'rice' is NOT here because Steamed Rice (FD045) is the canonical base
        # Note: 'sadham' is NOT here; it resolves to FD273 (the demo canonical)
    }


def _is_ambiguous_query(query_norm: str) -> bool:
    """Return True if the normalized query is a known ambiguous generic term."""
    if not _AMBIGUOUS_TERMS:
        _build_ambiguity_set()
    return query_norm in _AMBIGUOUS_TERMS


def _get_candidates_for_query(query_norm: str, top_n: int = 5) -> list[dict]:
    """
    Return top-n candidates from the index for a query string.
    Scored by rapidfuzz.token_set_ratio, deduplicated by food_id.
    """
    scored = []
    for norm_name, fid, original_name in _NAME_INDEX:
        score = fuzz.token_set_ratio(query_norm, norm_name) / 100.0
        scored.append((score, fid, original_name))
    scored.sort(key=lambda x: x[0], reverse=True)
    seen: set[str] = set()
    result: list[dict] = []
    for score, fid, orig in scored:
        if fid not in seen:
            seen.add(fid)
            result.append({
                'food_id': fid,
                'label': _FOOD_DB[fid].get('name', orig),
                'score': score,
            })
            if len(result) >= top_n:
                break
    return result


# ---------------------------------------------------------------------------
# Core matching function
# ---------------------------------------------------------------------------

def _match_food(raw_label: str) -> tuple[Optional[str], float, bool]:
    """
    Match raw_label against the food DB.

    Returns:
        (food_id | None, confidence: float, needs_verification: bool)

    Matching priority:
      1. Exact canonical name (case-insensitive, normalized)
      2. Exact alternate_name match (normalized)
      3. rapidfuzz token_set_ratio fuzzy (token-aware, prevents cross-dish FP)

    needs_verification is True when:
      - confidence < MATCH_CONFIDENCE_THRESHOLD (low-confidence path), OR
      - the query is in _AMBIGUOUS_TERMS regardless of confidence (ambiguity path)

    Exception: if the query is in _AMBIGUOUS_TERMS but Phase 1 or 2 produces
    an EXACT canonical or alternate_name match (confidence == 1.0), the ambiguity
    flag still fires because the query is genuinely ambiguous (the fact that it
    also matches exactly just means the first candidate is an exact hit, but
    other candidates exist too).
    """
    _ensure_loaded()
    if not _AMBIGUOUS_TERMS:
        _build_ambiguity_set()

    label_norm = _norm(raw_label)

    # ── Phase 1: Exact canonical name match ───────────────────────────────────
    for norm_name, fid, original_name in _NAME_INDEX:
        canonical_norm = _norm(str(_FOOD_DB[fid].get('name', '')))
        if label_norm == canonical_norm:
            if _is_ambiguous_query(label_norm):
                return fid, 1.0, True
            return fid, 1.0, False

    # ── Phase 2: Exact alternate_name match ───────────────────────────────────
    for norm_name, fid, original_name in _NAME_INDEX:
        if label_norm == norm_name:
            if _is_ambiguous_query(label_norm):
                return fid, 1.0, True
            return fid, 1.0, False

    # ── Phase 3: Token-aware fuzzy matching ───────────────────────────────────
    best_score = 0.0
    best_fid: Optional[str] = None

    for norm_name, fid, original_name in _NAME_INDEX:
        # token_set_ratio: immune to word-order differences but still
        # penalises cross-dish matches that merely share one token.
        score = fuzz.token_set_ratio(label_norm, norm_name) / 100.0
        if score > best_score:
            best_score = score
            best_fid = fid

    if _is_ambiguous_query(label_norm):
        return best_fid, best_score, True

    needs_v = best_score < MATCH_CONFIDENCE_THRESHOLD
    return best_fid, best_score, needs_v


# ---------------------------------------------------------------------------
# Shared public API — called by voice_resolver, photo_resolver, menu_resolver
# ---------------------------------------------------------------------------

def resolve_items(
    items: list[dict],
    source: str,
    input_id: str,
) -> dict:
    """
    Resolve a list of parsed item dicts into a resolution result.

    Args:
        items:    [{'raw_label': str, 'quantity': float, 'unit': str|None}, ...]
        source:   'voice' | 'photo_dish' | 'menu_ocr' | 'manual'
        input_id: tracing identifier

    Returns:
        {
            'status': 'confirmed' | 'needs_verification',
            'resolved_items': [dict, ...],   # successfully resolved
            'unresolved_items': [dict, ...], # need user confirmation
            '_resolved_item_objects': [ResolvedItem, ...],  # for downstream use
        }

    INVARIANT: one unresolved item NEVER discards other resolved items.
    """
    _ensure_loaded()

    resolved_items: list[ResolvedItem] = []
    unresolved_items: list[dict] = []

    for item in items:
        raw_label = item['raw_label']
        quantity = item.get('quantity', 1.0)
        unit = item.get('unit')  # None when not explicitly spoken

        food_id, confidence, needs_v = _match_food(raw_label)

        # Fill unit from CSV when no explicit unit was spoken
        if unit is None:
            if food_id:
                _, csv_unit = get_serving_for_food(food_id)
                unit = csv_unit
            else:
                unit = 'serving'  # last-resort only when no match at all

        if needs_v:
            candidates = _get_candidates_for_query(_norm(raw_label), top_n=5)
            unresolved_items.append({
                'item': raw_label,
                'quantity': quantity,
                'unit': unit,
                'candidates': [
                    {'food_id': c['food_id'], 'label': c['label']}
                    for c in candidates
                ],
            })
        else:
            match_status = classify_match(confidence)
            resolved_items.append(
                ResolvedItem(
                    raw_label=raw_label,
                    source=source,
                    resolved_food_id=food_id,
                    match_confidence=confidence,
                    match_status=match_status,
                    quantity=quantity,
                    unit=unit,
                )
            )

    status = 'needs_verification' if unresolved_items else 'confirmed'

    return {
        'status': status,
        'resolved_items': [
            {
                'raw_label': r.raw_label,
                'resolved_food_id': r.resolved_food_id,
                'quantity': r.quantity,
                'unit': r.unit,
                'match_confidence': r.match_confidence,
                'match_status': r.match_status,
            }
            for r in resolved_items
        ],
        'unresolved_items': unresolved_items,
        '_resolved_item_objects': resolved_items,
    }
