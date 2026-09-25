def calculate_gaps(targets: dict, consumed: dict) -> dict:
    """
    Calculate nutrient gaps by comparing targets and consumed.
    """
    gaps = {}
    for nutrient, target in targets.items():
        cons = consumed.get(nutrient, 0.0)
        gap = target - cons
        if gap > 0:
            gaps[nutrient] = gap
    return gaps

def rank_gaps(gaps: dict[str, float], priority_nutrients: list[str] | None = None) -> list[tuple[str, float]]:
    """
    Rank gaps by size descending, prioritizing priority_nutrients first.
    """
    priority_nutrients = priority_nutrients or []
    
    priority_gaps = []
    other_gaps = []
    
    for nutrient, gap in gaps.items():
        if nutrient in priority_nutrients:
            priority_gaps.append((nutrient, gap))
        else:
            other_gaps.append((nutrient, gap))
            
    priority_gaps.sort(key=lambda x: x[1], reverse=True)
    other_gaps.sort(key=lambda x: x[1], reverse=True)
    
    return priority_gaps + other_gaps
