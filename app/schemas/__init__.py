from .raw_input import RawInput
from .resolved_input import (
    ResolvedItem, Constraints, PreMealInput, PostMealInput,
    MATCH_CONFIDENCE_THRESHOLD, classify_match, MealType
)
from .recommendation import ComparisonResult, GapRecommendation

__all__ = [
    "RawInput",
    "ResolvedItem",
    "Constraints",
    "PreMealInput",
    "PostMealInput",
    "MATCH_CONFIDENCE_THRESHOLD",
    "classify_match",
    "MealType",
    "ComparisonResult",
    "GapRecommendation",
]
