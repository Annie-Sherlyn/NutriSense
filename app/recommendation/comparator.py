from app.schemas.resolved_input import ResolvedCandidate, Constraints
from app.schemas.recommendation import ComparisonResult

def compare_candidates(candidates: list[ResolvedCandidate], gaps: dict, constraints: Constraints | None) -> ComparisonResult:
    """
    TODO: Pre-meal "which is better" engine.
    Compares candidates and determines the best choice based on nutritional gaps and constraints.
    """
    pass
