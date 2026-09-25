from app.schemas.raw_input import RawInput
from app.schemas.resolved_input import PreMealInput, PostMealInput, ResolvedItem

def resolve(raw_input: RawInput) -> PreMealInput | PostMealInput:
    """
    Manually resolves a raw input by directly mapping it to a food_id.
    No ML needed, just wraps a user-picked food_id + quantity.
    """
    payload = raw_input.raw_payload
    item = ResolvedItem(
        raw_label=payload.get("label", "Manual Entry"),
        source="manual",
        resolved_food_id=payload.get("food_id"),
        match_confidence=None,
        match_status="confirmed",  # manual pick is definitely user-confirmed
        price_inr=payload.get("price_inr"),
        nutrient_override=payload.get("nutrient_override"),
        quantity=payload.get("quantity"),
        unit=payload.get("unit"),
        assumed_quantity=1.0
    )
    
    if raw_input.stage == "pre_meal":
        return PreMealInput(
            input_id=raw_input.input_id,
            timestamp=raw_input.timestamp,
            candidates=[item],
            constraints=None
        )
    else:
        return PostMealInput(
            input_id=raw_input.input_id,
            timestamp=raw_input.timestamp,
            items=[item]
        )
