def aggregate_daily(meals: list[dict]) -> dict:
    """
    Aggregate daily nutritional intake based on a list of meals.
    """
    daily = {}
    for meal in meals:
        for nutrient, amount in meal.items():
            daily[nutrient] = daily.get(nutrient, 0.0) + amount
    return daily
