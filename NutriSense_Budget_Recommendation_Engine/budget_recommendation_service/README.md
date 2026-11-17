# NutriSense — Cost-Wise Nutrient Recommendation Engine (BANS)

The **Budget-Aware Nutrient Recommendation Engine (BANS)** is a standalone backend service for NutriSense. It calculates which foods or synergistic food combinations best cover a user's remaining macro/micronutrient gaps within a given budget, meal type, diet, and allergen constraints.

---

## 1. Architecture & Design Principles

```
  [User Profile & Nutrition Tracker]
                  │
                  ▼
         RecommendationRequest
                  │
                  ▼
        Candidate Selection
    (General Mode vs Menu Mode)
                  │
                  ▼
          Price Resolution
  (Menu OCR Price overrides Local Seed Band)
                  │
                  ▼
             Hard Filters
  (Budget, Diet Tags, Allergen Intersection, Data Validity)
                  │
                  ▼
          Scoring Pipeline
  ├── Nutrient Coverage (capped at 100%)
  ├── GapScore (1.0x Normal, 2.0x Priority Nutrients)
  ├── AffordabilityScore: 1 - (Price / Budget)
  ├── ValueScore: GapScore * AffordabilityScore
  ├── MealSuitability: 1.0 (Exact) | 0.5 (Acceptable) | 0.0 (Inappropriate)
  └── BANS = 0.60*Gap + 0.25*Value + 0.15*Meal
                  │
                  ├── Single Candidate Scoring
                  └── Pair Optimizer (C(N,2) combinations + Compatibility Matrix)
                  │
                  ▼
          Combined Ranking
                  │
                  ▼
           Diversity Filter
                  │
                  ▼
         Top 3 Recommendations
                  │
                  ▼
      Deterministic Explanations
                  │
                  ▼
        RecommendationResponse (JSON)
```

---

## 2. Directory Structure

```
budget_recommendation_service/
├── __init__.py
├── config.py                          # Scoring weights (0.60, 0.25, 0.15) & constants
├── models.py                          # Pydantic schemas (Request, Response, Item, Scores)
├── engine.py                          # Core orchestration pipeline
├── scoring.py                         # Pure mathematical formulas (Coverage, BANS, etc.)
├── filters.py                         # Hard filters (Budget, Diet, Allergens)
├── price_resolver.py                  # Effective price resolution & provenance
├── combinations.py                    # Pair synergy optimizer & diversity filter
├── explanations.py                    # Deterministic reason generator
├── api.py                             # FastAPI endpoint POST /recommendations/budget
├── cli.py                             # Terminal CLI interface
├── repositories/
│   ├── nutrition_repository.py       # NutritionRepository ABC + Mock & Supabase stubs
│   └── price_repository.py           # PriceBandRepository ABC + Local & Supabase stubs
├── providers/
│   └── menu_price_provider.py         # MenuPriceProvider ABC + OCR adapter & name resolver
├── data/
│   ├── mock_nutrition.json           # Complete nutrition for 28 demo classes
│   ├── food_price_bands.json         # Min, typical, max price bands for 28 classes
│   ├── mock_menu.json                # Mock OCR restaurant menu
│   └── scenarios/                    # 8 predefined demo scenario test cases
└── tests/                             # 33 unit tests across all modules
```

---

## 3. How to Run Locally

### Run Unit Tests
```bash
python -m pytest budget_recommendation_service/tests -v
```

### Run CLI Demos
Run any scenario with pretty terminal display and structured JSON:
```bash
# Scenario 1: General recommendation with ₹100 budget
python run_budget_recommender.py budget_recommendation_service/data/scenarios/scenario_1_general.json

# Scenario 2: Low budget (₹50)
python run_budget_recommender.py budget_recommendation_service/data/scenarios/scenario_2_low_budget.json

# Scenario 3: Scanned Menu mode (Candidate universe restricted to menu)
python run_budget_recommender.py budget_recommendation_service/data/scenarios/scenario_3_menu_mode.json

# Scenario 4: Menu Price Override proof (Seed ₹110 -> Menu ₹75)
python run_budget_recommender.py budget_recommendation_service/data/scenarios/scenario_4_menu_override.json

# Scenario 5: Allergy filtering exclusion proof
python run_budget_recommender.py budget_recommendation_service/data/scenarios/scenario_5_allergy_filtering.json

# Scenario 8: Synergistic pair optimization
python run_budget_recommender.py budget_recommendation_service/data/scenarios/scenario_8_combination_beats_single.json
```

To output raw JSON only:
```bash
python run_budget_recommender.py budget_recommendation_service/data/scenarios/scenario_1_general.json --json
```

### Run FastAPI Microservice
```bash
uvicorn budget_recommendation_service.api:app --reload --port 8002
```
Test with curl or docs at: `http://127.0.0.1:8002/docs`

---

## 4. Future Integration Contracts

### A. Menu OCR Integration (`providers/menu_price_provider.py`)
When the Menu OCR team finishes, simply feed their raw JSON into `OCRMenuPriceAdapter`:
```python
from budget_recommendation_service.providers.menu_price_provider import OCRMenuPriceAdapter

ocr_raw_output = {
    "restaurant": "Sri Krishna Tiffin",
    "items": [
        {"dish_name": "Plain Dosa", "price": 75, "confidence": 0.96},
        {"dish_name": "Idly", "price": 55, "confidence": 0.94}
    ]
}

provider = OCRMenuPriceAdapter()
menu_items = provider.get_menu_items(ocr_raw_output)
# Passed into engine without touching recommendation algorithms!
```

### B. Supabase Integration (`repositories/`)
When the Supabase tables (`foods` and `food_price_bands`) are active in production, pass the Supabase repositories into `BudgetRecommendationEngine`:
```python
from budget_recommendation_service.repositories.nutrition_repository import SupabaseNutritionRepository
from budget_recommendation_service.repositories.price_repository import SupabasePriceBandRepository
from budget_recommendation_service.engine import BudgetRecommendationEngine

engine = BudgetRecommendationEngine(
    nutrition_repo=SupabaseNutritionRepository(supabase_client),
    price_repo=SupabasePriceBandRepository(supabase_client)
)
```
The recommendation logic, scoring, and pair optimization remain 100% untouched.
