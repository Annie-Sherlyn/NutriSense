"""
Nutrition Data Repository Abstraction.
Allows switching from local MockNutritionRepository to SupabaseNutritionRepository
without changing the recommendation algorithm.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Optional
import json
from pathlib import Path

from ..models import FoodNutritionData
from ..config import DEFAULT_NUTRITION_PATH

class NutritionRepository(ABC):
    """Abstract interface for accessing food nutritional profiles."""

    @abstractmethod
    def get_food(self, food_id: str) -> Optional[FoodNutritionData]:
        pass

    @abstractmethod
    def get_all_foods(self) -> List[FoodNutritionData]:
        pass

class MockNutritionRepository(NutritionRepository):
    """
    Local JSON-based Nutrition Repository.
    Loads and caches mock nutrition profiles for local execution and unit tests.
    """

    def __init__(self, json_path: Path = DEFAULT_NUTRITION_PATH):
        self.json_path = json_path
        self._foods: Dict[str, FoodNutritionData] = {}
        self._load()

    def _load(self):
        if not self.json_path.exists():
            raise FileNotFoundError(f"Mock nutrition data file not found at: {self.json_path}")

        with open(self.json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        raw_list = data.get("foods", [])
        self._foods = {}
        for item in raw_list:
            food_obj = FoodNutritionData(**item)
            self._foods[food_obj.food_id] = food_obj

    def get_food(self, food_id: str) -> Optional[FoodNutritionData]:
        # Support alias matching e.g. "food-idli" -> "idly"
        clean_id = food_id.lower().replace("-", "_")
        if clean_id.startswith("food_"):
            clean_id = clean_id[5:]
        return self._foods.get(clean_id) or self._foods.get(food_id)

    def get_all_foods(self) -> List[FoodNutritionData]:
        return list(self._foods.values())

class SupabaseNutritionRepository(NutritionRepository):
    """
    Production Supabase Nutrition Repository.
    Reads from the remote Supabase PostgreSQL nutrition table.
    """

    def __init__(self, supabase_client=None, table_name: str = "foods_nutrition"):
        self.client = supabase_client
        self.table_name = table_name

    def get_food(self, food_id: str) -> Optional[FoodNutritionData]:
        if not self.client:
            raise NotImplementedError("Supabase client not initialized. Use MockNutritionRepository for local execution.")
        response = self.client.table(self.table_name).select("*").eq("food_id", food_id).single().execute()
        if response.data:
            return FoodNutritionData(**response.data)
        return None

    def get_all_foods(self) -> List[FoodNutritionData]:
        if not self.client:
            raise NotImplementedError("Supabase client not initialized. Use MockNutritionRepository for local execution.")
        response = self.client.table(self.table_name).select("*").execute()
        return [FoodNutritionData(**row) for row in response.data]
