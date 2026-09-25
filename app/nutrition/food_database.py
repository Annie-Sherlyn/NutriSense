import pandas as pd

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
