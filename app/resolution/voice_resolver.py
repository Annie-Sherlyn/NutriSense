"""
Voice resolver: RawInput → PostMealInput | dict (needs_verification).

All input modalities (voice, photo, menu OCR) call the SAME shared resolver
function `resolve_items()` from app.resolution.food_resolver. This module is
the voice-specific entry point that:
  1. Extracts text from raw_payload
  2. Runs it through the voice parser (STT transcript → item list)
  3. Delegates to resolve_items() for matching

Response shape matches the documented API contract:

  Confirmed:
    PostMealInput with resolved items in `.items`

  Mixed / needs_verification:
    {
      "status": "needs_verification",
      "resolved_items": [...confirmed items...],
      "unresolved_items": [{"item": ..., "candidates": [...]}]
    }
"""
from datetime import datetime

from app.schemas.raw_input import RawInput
from app.schemas.resolved_input import PreMealInput, PostMealInput, ResolvedItem
from app.voice.voice_parser import parse_voice_transcript
from app.resolution.food_resolver import resolve_items


def resolve(raw_input: RawInput) -> PostMealInput | PreMealInput | dict:
    """
    Resolve a voice RawInput through the full pipeline.

    Args:
        raw_input: RawInput with source='voice', raw_payload={'text': '<transcript>'}

    Returns:
        PostMealInput  — when all items resolve confidently
        dict           — when any item needs user verification (schema in module docstring)
    """
    text_content = raw_input.raw_payload.get('text', '')

    # Parse transcript → items
    parsed = parse_voice_transcript(text_content)

    # Shared resolver (same function as photo/menu OCR)
    result = resolve_items(
        items=parsed['items'],
        source='voice',
        input_id=raw_input.input_id,
    )

    resolved_objs: list[ResolvedItem] = result['_resolved_item_objects']
    unresolved: list[dict] = result['unresolved_items']

    if unresolved:
        # Return partial result preserving successfully resolved items.
        # The first unresolved item is also surfaced at top level for
        # backward-compatibility with existing API consumers.
        first = unresolved[0]
        return {
            'status': 'needs_verification',
            'item': first['item'],
            'quantity': first['quantity'],
            'unit': first['unit'],
            'candidates': first['candidates'],
            'unresolved_items': unresolved,
            'resolved_items': result['resolved_items'],
        }

    return PostMealInput(
        input_id=raw_input.input_id,
        timestamp=raw_input.timestamp,
        items=resolved_objs,
        meal_type=parsed['meal_type'],
    )
