"""
Price Band Data Repository Abstraction.
Reads local seed price bands for the 28 demo classes and provides future Supabase mapping.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Optional
import json
from pathlib import Path

from ..models import FoodPriceBandData
from ..config import DEFAULT_PRICE_BANDS_PATH

class PriceBandRepository(ABC):
    """Abstract interface for accessing food price bands and user historical scanned prices."""

    @abstractmethod
    def get_price_band(self, food_id: str) -> Optional[FoodPriceBandData]:
        pass

    @abstractmethod
    def get_all_price_bands(self) -> List[FoodPriceBandData]:
        pass

    @abstractmethod
    def get_user_historical_average_price(self, user_id: str, food_id: str) -> Optional[float]:
        """Calculates average price from past scanned menu/order screenshot records in the database."""
        pass

class LocalPriceBandRepository(PriceBandRepository):
    """
    JSON-based Local Price Band Repository.
    Loads and caches seed price bands (min, typical, max) and user order history for local execution.
    """

    def __init__(self, json_path: Path = DEFAULT_PRICE_BANDS_PATH):
        self.json_path = json_path
        self.history_path = json_path.parent / "user_order_history.json"
        self._bands: Dict[str, FoodPriceBandData] = {}
        self._user_history: Dict[str, Dict[str, List[float]]] = {}
        self._load()

    def _load(self):
        if not self.json_path.exists():
            raise FileNotFoundError(f"Food price bands file not found at: {self.json_path}")

        with open(self.json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        raw_list = data.get("price_bands", [])
        self._bands = {}
        for item in raw_list:
            band_obj = FoodPriceBandData(**item)
            self._bands[band_obj.food_id] = band_obj

        # Load user order history if present
        if self.history_path.exists():
            try:
                with open(self.history_path, "r", encoding="utf-8") as hf:
                    hdata = json.load(hf)
                users_map = hdata.get("users", {})
                for uid, orders in users_map.items():
                    self._user_history[uid] = {}
                    for ord_item in orders:
                        fid = ord_item.get("food_id")
                        price = ord_item.get("price")
                        if fid and price is not None:
                            self._user_history[uid].setdefault(fid, []).append(float(price))
            except Exception:
                self._user_history = {}

    def get_price_band(self, food_id: str) -> Optional[FoodPriceBandData]:
        clean_id = food_id.lower().replace("-", "_")
        if clean_id.startswith("food_"):
            clean_id = clean_id[5:]
        return self._bands.get(clean_id) or self._bands.get(food_id)

    def get_all_price_bands(self) -> List[FoodPriceBandData]:
        return list(self._bands.values())

    def get_user_historical_average_price(self, user_id: str, food_id: str) -> Optional[float]:
        if not user_id or user_id not in self._user_history:
            return None
        clean_id = food_id.lower().replace("-", "_")
        if clean_id.startswith("food_"):
            clean_id = clean_id[5:]
        prices = self._user_history[user_id].get(clean_id) or self._user_history[user_id].get(food_id)
        if prices and len(prices) > 0:
            return round(sum(prices) / len(prices), 2)
        return None

class SupabasePriceBandRepository(PriceBandRepository):
    """
    Production Supabase Price Band Repository.
    Reads from the remote Supabase PostgreSQL food_price_bands table.
    """

    def __init__(self, supabase_client=None, table_name: str = "food_price_bands"):
        self.client = supabase_client
        self.table_name = table_name

    def get_price_band(self, food_id: str) -> Optional[FoodPriceBandData]:
        if not self.client:
            raise NotImplementedError("Supabase client not initialized. Use LocalPriceBandRepository for local execution.")
        response = self.client.table(self.table_name).select("*").eq("food_id", food_id).single().execute()
        if response.data:
            return FoodPriceBandData(**response.data)
        return None

    def get_all_price_bands(self) -> List[FoodPriceBandData]:
        if not self.client:
            raise NotImplementedError("Supabase client not initialized. Use LocalPriceBandRepository for local execution.")
        response = self.client.table(self.table_name).select("*").execute()
        return [FoodPriceBandData(**row) for row in response.data]

    def get_user_historical_average_price(self, user_id: str, food_id: str) -> Optional[float]:
        if not self.client:
            raise NotImplementedError("Supabase client not initialized. Use LocalPriceBandRepository for local execution.")
        # Queries past OCR scanned orders for this user from user_order_history table
        response = self.client.table("user_order_history").select("price").eq("user_id", user_id).eq("food_id", food_id).execute()
        if response.data and len(response.data) > 0:
            prices = [float(r["price"]) for r in response.data if r.get("price") is not None]
            if prices:
                return round(sum(prices) / len(prices), 2)
        return None
