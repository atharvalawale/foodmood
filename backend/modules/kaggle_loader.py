# ─────────────────────────────────────────────
# kaggle_loader.py — Loads Kaggle food nutrition dataset
# ─────────────────────────────────────────────
#
# Loads all 5 FOOD-DATA-GROUP CSV files into the nutrition DB
# These have 1600+ foods with detailed nutrition data
# ─────────────────────────────────────────────

import csv
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"

# All 5 Kaggle CSV files
KAGGLE_FILES = [
    DATA_DIR / "FOOD-DATA-GROUP1.csv",
    DATA_DIR / "FOOD-DATA-GROUP2.csv",
    DATA_DIR / "FOOD-DATA-GROUP3.csv",
    DATA_DIR / "FOOD-DATA-GROUP4.csv",
    DATA_DIR / "FOOD-DATA-GROUP5.csv",
]

def normalize(name: str) -> str:
    """Convert food name to our standard format."""
    return name.strip().lower().replace(" ", "_").replace("-", "_").replace(",", "")

def load_kaggle_foods() -> dict:
    """
    Loads all Kaggle food CSV files.
    Returns dict of {food_name: nutrition_dict}
    
    Column mapping:
    - food              → food name
    - Caloric Value     → calories_100g
    - Fat               → fat
    - Carbohydrates     → carbs
    - Protein           → protein
    - Dietary Fiber     → fiber
    - Sugars            → sugar
    - Sodium            → sodium (in mg)
    """
    foods = {}
    total_loaded = 0

    for csv_file in KAGGLE_FILES:
        if not csv_file.exists():
            print(f"⚠️  File not found: {csv_file.name}")
            continue

        try:
            with open(csv_file, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                count = 0

                for row in reader:
                    # Get food name
                    food_name = row.get("food", "").strip()
                    if not food_name:
                        continue

                    # Normalize name
                    key = normalize(food_name)

                    # Safe float conversion
                    def safe_float(val, default=0):
                        try:
                            return float(val or 0)
                        except:
                            return default

                    # Extract nutrition values
                    nutrition = {
                        "calories_100g": safe_float(row.get("Caloric Value", 0)),
                        "protein":       safe_float(row.get("Protein", 0)),
                        "carbs":         safe_float(row.get("Carbohydrates", 0)),
                        "fat":           safe_float(row.get("Fat", 0)),
                        "fiber":         safe_float(row.get("Dietary Fiber", 0)),
                        "sugar":         safe_float(row.get("Sugars", 0)),
                        "sodium":        safe_float(row.get("Sodium", 0)),
                        # Extra nutrients from Kaggle dataset
                        "cholesterol":   safe_float(row.get("Cholesterol", 0)),
                        "calcium":       safe_float(row.get("Calcium", 0)),
                        "iron":          safe_float(row.get("Iron", 0)),
                        "potassium":     safe_float(row.get("Potassium", 0)),
                        "vitamin_c":     safe_float(row.get("Vitamin C", 0)),
                        "source":        "kaggle",
                        "original_name": food_name,
                    }

                    # Only add if has calories
                    if nutrition["calories_100g"] > 0:
                        foods[key] = nutrition
                        count += 1

                print(f"✅ Loaded {count} foods from {csv_file.name}")
                total_loaded += count

        except Exception as e:
            print(f"❌ Error loading {csv_file.name}: {e}")

    print(f"📦 Total Kaggle foods loaded: {total_loaded}")
    return foods