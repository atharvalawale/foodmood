# ─────────────────────────────────────────────
# ifct_loader.py — Indian Food Nutrition Dataset Loader
# ─────────────────────────────────────────────
#
# Loads: Indian_Food_Nutrition_Processed.csv
# Columns: Dish Name, Calories (kcal), Carbohydrates (g),
#          Protein (g), Fats (g), Free Sugar (g), Fibre (g),
#          Sodium (mg), Calcium (mg), Iron (mg), etc.
#
# This is called by nutrition.py at startup
# Adds Indian foods to NUTRITION_DB automatically
# ─────────────────────────────────────────────

import csv
from pathlib import Path

BASE_DIR  = Path(__file__).parent.parent
DATA_FILE = BASE_DIR / "data" / "Indian_Food_Nutrition_Processed.csv"


def normalize_name(name: str) -> str:
    """
    Converts dish name to a DB key.
    Examples:
      "Dal Tadka"      → "dal_tadka"
      "Egg Bhurji"     → "egg_bhurji"
      "Pav Bhaji"      → "pav_bhaji"
      "Chicken Curry"  → "chicken_curry"
    """
    return name.strip().lower().replace(" ", "_").replace("-", "_").replace("/", "_")


def safe_float(value, default=0.0) -> float:
    """Safely convert a value to float, return default if it fails."""
    try:
        if value is None or str(value).strip() == "":
            return default
        return float(str(value).strip())
    except (ValueError, TypeError):
        return default


def load_indian_foods() -> dict:
    """
    Loads Indian food nutrition data from CSV.

    Returns a dict like:
    {
        "dal_tadka": {
            "calories_100g": 100,
            "protein": 6.0,
            "carbs": 14.0,
            "fat": 2.5,
            "fiber": 3.0,
            "sugar": 1.0,
            "sodium": 280.0,
            "source": "indian_food_2025"
        },
        ...
    }
    """
    if not DATA_FILE.exists():
        print(f"⚠️  Indian food dataset not found at: {DATA_FILE}")
        print(f"    Please put Indian_Food_Nutrition_Processed.csv in backend/data/")
        return {}

    foods = {}
    skipped = 0

    try:
        # Try UTF-8 first, fall back to latin-1 (handles special chars like µg)
        try:
            f = open(DATA_FILE, newline="", encoding="utf-8")
        except UnicodeDecodeError:
            f = open(DATA_FILE, newline="", encoding="latin-1")

        reader = csv.DictReader(f)

        for row in reader:
            # Get dish name — skip if empty
            dish_name = row.get("Dish Name", "").strip()
            if not dish_name:
                skipped += 1
                continue

            # Skip if calories is missing or zero
            calories = safe_float(row.get("Calories (kcal)", 0))
            if calories <= 0:
                skipped += 1
                continue

            # Create normalized key
            food_key = normalize_name(dish_name)

            # Build nutrition entry
            foods[food_key] = {
                "calories_100g": calories,
                "protein":       safe_float(row.get("Protein (g)", 0)),
                "carbs":         safe_float(row.get("Carbohydrates (g)", 0)),
                "fat":           safe_float(row.get("Fats (g)", 0)),
                "fiber":         safe_float(row.get("Fibre (g)", 0)),
                "sugar":         safe_float(row.get("Free Sugar (g)", 0)),
                "sodium":        safe_float(row.get("Sodium (mg)", 0)),
                # Extra micronutrients — stored for future use
                "calcium":       safe_float(row.get("Calcium (mg)", 0)),
                "iron":          safe_float(row.get("Iron (mg)", 0)),
                "vitamin_c":     safe_float(row.get("Vitamin C (mg)", 0)),
                "source":        "indian_food_2025",
                # Keep original name for display
                "display_name":  dish_name,
            }

        f.close()

    except Exception as e:
        print(f"❌ Error loading Indian food dataset: {e}")
        return {}

    print(f"✅ Indian Food 2025 dataset: {len(foods)} foods loaded ({skipped} skipped)")
    return foods