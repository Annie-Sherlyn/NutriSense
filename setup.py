import os
import shutil

base = "c:/Users/annie/nutrisense"
app_dir = os.path.join(base, "app")

dirs = [
    "data",
    "schemas",
    "resolution",
    "nutrition",
    "recommendation",
    "voice"
]

for d in dirs:
    os.makedirs(os.path.join(app_dir, d), exist_ok=True)
    if d != "data":
        open(os.path.join(app_dir, d, "__init__.py"), "w").close()

open(os.path.join(app_dir, "__init__.py"), "w").close()

# Copy CSV
src_csv = "C:/Users/annie/Downloads/NutriSense_Food_Database_v7_schema (3).csv"
dst_csv = os.path.join(app_dir, "data", "foods.csv")
if os.path.exists(src_csv):
    shutil.copy2(src_csv, dst_csv)
else:
    print(f"Warning: Source CSV not found at {src_csv}")

# schemas/raw_input.py
with open(os.path.join(app_dir, "schemas", "raw_input.py"), "w", encoding="utf-8") as f:
    f.write('''from pydantic import BaseModel
from typing import Literal
from datetime import datetime

class RawInput(BaseModel):
    input_id: str
    source: Literal["menu", "voice", "photo", "manual"]
    stage: Literal["pre_meal", "post_meal"]
    timestamp: datetime
    raw_payload: dict  # source-specific, shape varies by `source`
''')

# schemas/resolved_input.py
with open(os.path.join(app_dir, "schemas", "resolved_input.py"), "w", encoding="utf-8") as f:
    f.write('''"""
Pre_meal inputs may carry 2+ candidates with no quantity (comparison mode);
post_meal inputs carry 1+ candidates each with quantity/unit set (logging mode).
"""
from pydantic import BaseModel
from typing import Literal
from datetime import datetime

class ResolvedCandidate(BaseModel):
    food_id: str
    label: str
    confidence: float
    quantity: float | None = None   # set for post_meal items, optional for pre_meal
    unit: str | None = None

class Constraints(BaseModel):
    budget_inr: float | None = None

class ResolvedInput(BaseModel):
    input_id: str
    stage: Literal["pre_meal", "post_meal"]
    timestamp: datetime
    resolved_candidates: list[ResolvedCandidate]
    constraints: Constraints | None = None
''')

# schemas/recommendation.py
with open(os.path.join(app_dir, "schemas", "recommendation.py"), "w", encoding="utf-8") as f:
    f.write('''from pydantic import BaseModel

class ComparisonResult(BaseModel):
    winner_food_id: str
    reason: str
    ranked: list[dict]  # food_id, score, notes

class GapRecommendation(BaseModel):
    nutrient: str
    gap_amount: float
    suggested_food_ids: list[str]
    timing_note: str | None = None
''')

# resolution/menu_resolver.py
with open(os.path.join(app_dir, "resolution", "menu_resolver.py"), "w", encoding="utf-8") as f:
    f.write('''from app.schemas.raw_input import RawInput
from app.schemas.resolved_input import ResolvedInput

def resolve(raw_input: RawInput) -> ResolvedInput:
    """
    TODO: Match menu text against food_id via fuzzy match/embedding lookup against foods.csv.
    """
    pass
''')

# resolution/voice_resolver.py
with open(os.path.join(app_dir, "resolution", "voice_resolver.py"), "w", encoding="utf-8") as f:
    f.write('''from app.schemas.raw_input import RawInput
from app.schemas.resolved_input import ResolvedInput

def resolve(raw_input: RawInput) -> ResolvedInput:
    """
    TODO: STT -> NLP food/quantity extraction.
    """
    pass
''')

# resolution/photo_resolver.py
with open(os.path.join(app_dir, "resolution", "photo_resolver.py"), "w", encoding="utf-8") as f:
    f.write('''from app.schemas.raw_input import RawInput
from app.schemas.resolved_input import ResolvedInput

def resolve(raw_input: RawInput) -> ResolvedInput:
    """
    TODO: DL classifier -> food_id with confidence.
    """
    pass
''')

# resolution/manual_resolver.py
with open(os.path.join(app_dir, "resolution", "manual_resolver.py"), "w", encoding="utf-8") as f:
    f.write('''from app.schemas.raw_input import RawInput
from app.schemas.resolved_input import ResolvedInput, ResolvedCandidate

def resolve(raw_input: RawInput) -> ResolvedInput:
    """
    Manually resolves a raw input by directly mapping it to a food_id.
    No ML needed, just wraps a user-picked food_id + quantity.
    """
    payload = raw_input.raw_payload
    candidate = ResolvedCandidate(
        food_id=payload.get("food_id", ""),
        label=payload.get("label", "Manual Entry"),
        confidence=1.0,
        quantity=payload.get("quantity"),
        unit=payload.get("unit")
    )
    
    return ResolvedInput(
        input_id=raw_input.input_id,
        stage=raw_input.stage,
        timestamp=raw_input.timestamp,
        resolved_candidates=[candidate],
        constraints=None  # Can be extracted from payload if needed
    )
''')

# nutrition/food_database.py
with open(os.path.join(app_dir, "nutrition", "food_database.py"), "w", encoding="utf-8") as f:
    f.write('''import pandas as pd

_food_db = None

def load_food_db(csv_path: str) -> pd.DataFrame:
    """
    Reads foods.csv into a pandas DataFrame indexed by food_id.
    """
    global _food_db
    _food_db = pd.read_csv(csv_path)
    # Ensure 'food_id' exists in the CSV or create a proper index
    if 'food_id' in _food_db.columns:
        _food_db = _food_db.set_index('food_id')
    return _food_db

def get_food(food_id: str) -> dict | None:
    """
    Lookup function for a specific food_id.
    """
    global _food_db
    if _food_db is None:
        raise ValueError("Database not loaded. Call load_food_db first.")
    
    try:
        return _food_db.loc[food_id].to_dict()
    except KeyError:
        return None
''')

# nutrition/meal_calculator.py
with open(os.path.join(app_dir, "nutrition", "meal_calculator.py"), "w", encoding="utf-8") as f:
    f.write('''from app.schemas.resolved_input import ResolvedInput

def calculate_meal_nutrition(resolved_input: ResolvedInput) -> dict:
    """
    TODO: Sum nutrition across resolved_candidates × quantity.
    """
    pass
''')

# nutrition/daily_tracker.py
with open(os.path.join(app_dir, "nutrition", "daily_tracker.py"), "w", encoding="utf-8") as f:
    f.write('''def aggregate_daily(meals: list[dict]) -> dict:
    """
    TODO: Aggregate daily nutritional intake based on a list of meals.
    """
    pass
''')

# recommendation/nutrient_gap.py
with open(os.path.join(app_dir, "recommendation", "nutrient_gap.py"), "w", encoding="utf-8") as f:
    f.write('''def calculate_gaps(targets: dict, consumed: dict) -> dict:
    """
    TODO: Calculate nutrient gaps by comparing targets and consumed.
    """
    pass
''')

# recommendation/comparator.py
with open(os.path.join(app_dir, "recommendation", "comparator.py"), "w", encoding="utf-8") as f:
    f.write('''from app.schemas.resolved_input import ResolvedCandidate, Constraints
from app.schemas.recommendation import ComparisonResult

def compare_candidates(candidates: list[ResolvedCandidate], gaps: dict, constraints: Constraints | None) -> ComparisonResult:
    """
    TODO: Pre-meal "which is better" engine.
    Compares candidates and determines the best choice based on nutritional gaps and constraints.
    """
    pass
''')

# recommendation/candidate_filter.py
with open(os.path.join(app_dir, "recommendation", "candidate_filter.py"), "w", encoding="utf-8") as f:
    f.write('''from app.schemas.resolved_input import ResolvedCandidate

def filter_candidates(candidates: list[ResolvedCandidate], user_profile: dict) -> list[ResolvedCandidate]:
    """
    TODO: Allergen/diet filtering.
    """
    pass
''')

# recommendation/scorer.py
with open(os.path.join(app_dir, "recommendation", "scorer.py"), "w", encoding="utf-8") as f:
    f.write('''from app.schemas.resolved_input import ResolvedCandidate

def score_candidates(candidates: list[ResolvedCandidate], gaps: dict) -> dict:
    """
    TODO: Nutrient-gap scoring shared by comparator and recommender.
    """
    pass
''')

# recommendation/time_pacing.py
with open(os.path.join(app_dir, "recommendation", "time_pacing.py"), "w", encoding="utf-8") as f:
    f.write('''def apply_time_pacing(scores: dict, current_time: str) -> dict:
    """
    TODO: Time-of-day pacing adjustments.
    """
    pass
''')

# recommendation/recommender.py
with open(os.path.join(app_dir, "recommendation", "recommender.py"), "w", encoding="utf-8") as f:
    f.write('''from app.schemas.recommendation import GapRecommendation

def recommend_next_meal(gaps: dict, constraints: dict) -> list[GapRecommendation]:
    """
    TODO: Final post_meal "what to eat next" engine.
    """
    pass
''')

# voice/speech_to_text.py
with open(os.path.join(app_dir, "voice", "speech_to_text.py"), "w", encoding="utf-8") as f:
    f.write('''def transcribe_audio(audio_payload: bytes) -> str:
    """
    TODO: Convert speech to text.
    """
    pass
''')

# voice/food_parser.py
with open(os.path.join(app_dir, "voice", "food_parser.py"), "w", encoding="utf-8") as f:
    f.write('''def extract_food_and_quantity(text: str) -> dict:
    """
    TODO: NLP food/quantity extraction.
    """
    pass
''')

# app/main.py
with open(os.path.join(app_dir, "main.py"), "w", encoding="utf-8") as f:
    f.write('''from fastapi import FastAPI

app = FastAPI(title="NutriSense API", description="Nutrition-recommendation backend")

# TODO: Add routers
# from app.resolution import manual_resolver, menu_resolver, photo_resolver, voice_resolver
# app.include_router(manual_resolver.router)
# app.include_router(menu_resolver.router)
# app.include_router(photo_resolver.router)
# app.include_router(voice_resolver.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to NutriSense API"}
''')

# requirements.txt
with open(os.path.join(base, "requirements.txt"), "w", encoding="utf-8") as f:
    f.write('''fastapi
pydantic
uvicorn
pandas
python-multipart
''')

print("Setup completed successfully.")
