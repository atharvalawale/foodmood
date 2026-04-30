import csv
from pathlib import Path

BASE_DIR    = Path(__file__).parent.parent
DEFAULT_CSV = BASE_DIR / "data" / "nutrition.csv"

NUTRITION_DB = {}

# ── Alias map — common name variants ──────────────────────────────────────────
FOOD_ALIAS_MAP = {
    # Eggs
    "egg":              "egg_boiled",
    "eggs":             "egg_boiled",
    "boiled egg":       "egg_boiled",
    "fried egg":        "egg_fried",
    # Chicken
    "chicken":          "chicken_grilled",
    "grilled chicken":  "chicken_grilled",
    # Rice
    "rice":             "white_rice",
    "cooked rice":      "white_rice",
    "steamed rice":     "white_rice",
    # Bread
    "roti":             "chapati",
    "phulka":           "chapati",
    # Dal
    "dal":              "dal_tadka",
    "daal":             "dal_tadka",
    "lentils":          "dal_tadka",
    # Paneer
    "paneer":           "paneer_raw",
    "cottage cheese":   "paneer_raw",
    # Oats
    "oatmeal":          "oats",
    "oat":              "oats",
    # Milk
    "whole milk":       "milk",
    "cow milk":         "milk",
    # Banana
    "banana":           "banana",
    "kela":             "banana",
    # Pav bhaji
    "pav bhaji":        "pav_bhaji",
    "pavbhaji":         "pav_bhaji",
    # Biryani
    "chicken biryani":  "chicken_biryani",
    "veg biryani":      "veg_biryani",
    # Dosa
    "masala dosa":      "dosa_masala",
    # Samosa
    "samosa":           "samosa",
    # Burger
    "burger":           "burger",
    "veg burger":       "veg_burger",
    # Pizza
    "pizza":            "pizza_slice",
    # Maggi
    "maggi":            "maggi_noodles",
    "noodles":          "maggi_noodles",
    # Curd
    "yogurt":           "curd",
    "dahi":             "curd",
    # Whey
    "whey":             "whey_protein",
    "protein shake":    "whey_protein",
    "protein powder":   "whey_protein",
}


# ── Built-in Indian + common foods database ────────────────────────────────────
# This is a fallback when food is not found in CSV
# All values are per 100g
# Format: calories_100g, protein, carbs, fat, sugar, sodium

INDIAN_FOODS_DB = {
    # ── Rice dishes ──────────────────────────────────────────────────────────
    "white_rice":        {"calories_100g": 130, "protein": 2.7, "carbs": 28,  "fat": 0.3, "sugar": 0,   "sodium": 1},
    "brown_rice":        {"calories_100g": 112, "protein": 2.6, "carbs": 23,  "fat": 0.9, "sugar": 0,   "sodium": 5},
    "fried_rice":        {"calories_100g": 163, "protein": 3.5, "carbs": 27,  "fat": 4.8, "sugar": 0.5, "sodium": 320},
    "biryani":           {"calories_100g": 160, "protein": 8,   "carbs": 24,  "fat": 4,   "sugar": 1,   "sodium": 280},
    "chicken_biryani":   {"calories_100g": 185, "protein": 12,  "carbs": 22,  "fat": 5,   "sugar": 1,   "sodium": 350},
    "veg_biryani":       {"calories_100g": 145, "protein": 4,   "carbs": 26,  "fat": 3,   "sugar": 1,   "sodium": 280},
    "khichdi":           {"calories_100g": 124, "protein": 4.5, "carbs": 22,  "fat": 2.5, "sugar": 0.5, "sodium": 180},
    "pulao":             {"calories_100g": 150, "protein": 3,   "carbs": 28,  "fat": 3,   "sugar": 0.5, "sodium": 220},

    # ── Breads ───────────────────────────────────────────────────────────────
    "chapati":           {"calories_100g": 297, "protein": 9,   "carbs": 52,  "fat": 5,   "sugar": 1,   "sodium": 370},
    "roti":              {"calories_100g": 297, "protein": 9,   "carbs": 52,  "fat": 5,   "sugar": 1,   "sodium": 370},
    "naan":              {"calories_100g": 310, "protein": 9,   "carbs": 54,  "fat": 6,   "sugar": 3,   "sodium": 420},
    "paratha":           {"calories_100g": 326, "protein": 7,   "carbs": 48,  "fat": 11,  "sugar": 1,   "sodium": 380},
    "puri":              {"calories_100g": 340, "protein": 6,   "carbs": 44,  "fat": 15,  "sugar": 1,   "sodium": 300},
    "bread_white":       {"calories_100g": 265, "protein": 9,   "carbs": 49,  "fat": 3.2, "sugar": 5,   "sodium": 490},
    "pav":               {"calories_100g": 280, "protein": 8,   "carbs": 52,  "fat": 4,   "sugar": 4,   "sodium": 450},

    # ── Dal & legumes ─────────────────────────────────────────────────────────
    "dal_tadka":         {"calories_100g": 100, "protein": 6,   "carbs": 14,  "fat": 2.5, "sugar": 1,   "sodium": 280},
    "dal_makhani":       {"calories_100g": 130, "protein": 6,   "carbs": 16,  "fat": 5,   "sugar": 1.5, "sodium": 320},
    "rajma":             {"calories_100g": 115, "protein": 7,   "carbs": 18,  "fat": 1.5, "sugar": 0.5, "sodium": 250},
    "chhole":            {"calories_100g": 120, "protein": 6.5, "carbs": 18,  "fat": 2.5, "sugar": 1,   "sodium": 300},
    "sambar":            {"calories_100g": 55,  "protein": 3,   "carbs": 8,   "fat": 1.5, "sugar": 2,   "sodium": 350},
    "moong_dal":         {"calories_100g": 97,  "protein": 7,   "carbs": 13,  "fat": 1,   "sugar": 0.5, "sodium": 200},

    # ── Vegetables & curries ──────────────────────────────────────────────────
    "pav_bhaji":         {"calories_100g": 110, "protein": 3.5, "carbs": 16,  "fat": 4,   "sugar": 3,   "sodium": 380},
    "bhaji":             {"calories_100g": 95,  "protein": 3,   "carbs": 14,  "fat": 3.5, "sugar": 3,   "sodium": 350},
    "aloo_gobi":         {"calories_100g": 85,  "protein": 2.5, "carbs": 13,  "fat": 2.5, "sugar": 2,   "sodium": 250},
    "palak_paneer":      {"calories_100g": 140, "protein": 7,   "carbs": 8,   "fat": 9,   "sugar": 2,   "sodium": 300},
    "matar_paneer":      {"calories_100g": 150, "protein": 7.5, "carbs": 12,  "fat": 9,   "sugar": 2,   "sodium": 320},
    "shahi_paneer":      {"calories_100g": 180, "protein": 8,   "carbs": 10,  "fat": 13,  "sugar": 3,   "sodium": 340},
    "butter_chicken":    {"calories_100g": 150, "protein": 12,  "carbs": 8,   "fat": 8,   "sugar": 3,   "sodium": 380},
    "chicken_curry":     {"calories_100g": 145, "protein": 14,  "carbs": 5,   "fat": 8,   "sugar": 1.5, "sodium": 350},
    "mutton_curry":      {"calories_100g": 165, "protein": 15,  "carbs": 4,   "fat": 10,  "sugar": 1,   "sodium": 380},
    "fish_curry":        {"calories_100g": 120, "protein": 14,  "carbs": 5,   "fat": 5,   "sugar": 1,   "sodium": 350},
    "sabzi":             {"calories_100g": 70,  "protein": 2,   "carbs": 10,  "fat": 2.5, "sugar": 2,   "sodium": 200},
    "bhindi":            {"calories_100g": 38,  "protein": 2,   "carbs": 7,   "fat": 0.2, "sugar": 1.5, "sodium": 8},
    "baingan_bharta":    {"calories_100g": 70,  "protein": 2,   "carbs": 10,  "fat": 3,   "sugar": 4,   "sodium": 220},

    # ── Eggs ─────────────────────────────────────────────────────────────────
    "egg_boiled":        {"calories_100g": 155, "protein": 13,  "carbs": 1.1, "fat": 11,  "sugar": 1,   "sodium": 124},
    "egg_fried":         {"calories_100g": 196, "protein": 14,  "carbs": 0.4, "fat": 15,  "sugar": 0.4, "sodium": 207},
    "egg_scrambled":     {"calories_100g": 149, "protein": 10,  "carbs": 1.6, "fat": 11,  "sugar": 1.2, "sodium": 257},
    "omelette":          {"calories_100g": 154, "protein": 11,  "carbs": 1,   "fat": 12,  "sugar": 0.5, "sodium": 230},

    # ── Chicken & meat ────────────────────────────────────────────────────────
    "chicken_grilled":   {"calories_100g": 165, "protein": 31,  "carbs": 0,   "fat": 3.6, "sugar": 0,   "sodium": 74},
    "chicken_tikka":     {"calories_100g": 160, "protein": 25,  "carbs": 4,   "fat": 5,   "sugar": 1,   "sodium": 320},
    "chicken_tandoori":  {"calories_100g": 155, "protein": 24,  "carbs": 3,   "fat": 5,   "sugar": 1,   "sodium": 350},
    "mutton":            {"calories_100g": 250, "protein": 25,  "carbs": 0,   "fat": 17,  "sugar": 0,   "sodium": 72},
    "fish_grilled":      {"calories_100g": 136, "protein": 26,  "carbs": 0,   "fat": 3,   "sugar": 0,   "sodium": 76},

    # ── Paneer & dairy ────────────────────────────────────────────────────────
    "paneer_raw":        {"calories_100g": 296, "protein": 18,  "carbs": 3,   "fat": 23,  "sugar": 3,   "sodium": 28},
    "paneer_curry":      {"calories_100g": 180, "protein": 10,  "carbs": 8,   "fat": 12,  "sugar": 2,   "sodium": 290},
    "milk":              {"calories_100g": 61,  "protein": 3.2, "carbs": 4.8, "fat": 3.3, "sugar": 5,   "sodium": 43},
    "curd":              {"calories_100g": 98,  "protein": 3.5, "carbs": 3.4, "fat": 4.3, "sugar": 3.4, "sodium": 36},
    "raita":             {"calories_100g": 60,  "protein": 2.5, "carbs": 5,   "fat": 3,   "sugar": 4,   "sodium": 150},
    "lassi":             {"calories_100g": 70,  "protein": 3,   "carbs": 8,   "fat": 3,   "sugar": 7,   "sodium": 50},
    "whey_protein":      {"calories_100g": 370, "protein": 75,  "carbs": 10,  "fat": 5,   "sugar": 5,   "sodium": 200},
    "cheese":            {"calories_100g": 402, "protein": 25,  "carbs": 1.3, "fat": 33,  "sugar": 0.5, "sodium": 621},
    "butter":            {"calories_100g": 717, "protein": 0.9, "carbs": 0.1, "fat": 81,  "sugar": 0.1, "sodium": 576},
    "ghee":              {"calories_100g": 900, "protein": 0,   "carbs": 0,   "fat": 100, "sugar": 0,   "sodium": 1},

    # ── Breakfast & snacks ────────────────────────────────────────────────────
    "oats":              {"calories_100g": 68,  "protein": 2.4, "carbs": 12,  "fat": 1.4, "sugar": 0.5, "sodium": 49},
    "idli":              {"calories_100g": 58,  "protein": 2,   "carbs": 12,  "fat": 0.4, "sugar": 0.5, "sodium": 250},
    "dosa":              {"calories_100g": 168, "protein": 3.9, "carbs": 30,  "fat": 3.7, "sugar": 0.5, "sodium": 390},
    "dosa_masala":       {"calories_100g": 185, "protein": 4,   "carbs": 32,  "fat": 5,   "sugar": 1,   "sodium": 420},
    "upma":              {"calories_100g": 120, "protein": 3,   "carbs": 20,  "fat": 3,   "sugar": 0.5, "sodium": 300},
    "poha":              {"calories_100g": 130, "protein": 2.5, "carbs": 26,  "fat": 2,   "sugar": 1,   "sodium": 280},
    "uttapam":           {"calories_100g": 140, "protein": 4,   "carbs": 25,  "fat": 3,   "sugar": 1,   "sodium": 350},
    "samosa":            {"calories_100g": 308, "protein": 6,   "carbs": 35,  "fat": 16,  "sugar": 1,   "sodium": 430},
    "pakora":            {"calories_100g": 285, "protein": 6,   "carbs": 32,  "fat": 15,  "sugar": 1,   "sodium": 380},
    "vada":              {"calories_100g": 290, "protein": 7,   "carbs": 33,  "fat": 14,  "sugar": 0.5, "sodium": 350},
    "dhokla":            {"calories_100g": 160, "protein": 5,   "carbs": 28,  "fat": 4,   "sugar": 3,   "sodium": 380},

    # ── Fast food ─────────────────────────────────────────────────────────────
    "burger":            {"calories_100g": 250, "protein": 12,  "carbs": 28,  "fat": 10,  "sugar": 5,   "sodium": 480},
    "veg_burger":        {"calories_100g": 220, "protein": 7,   "carbs": 32,  "fat": 8,   "sugar": 5,   "sodium": 420},
    "pizza_slice":       {"calories_100g": 266, "protein": 11,  "carbs": 33,  "fat": 10,  "sugar": 3.6, "sodium": 598},
    "maggi_noodles":     {"calories_100g": 450, "protein": 10,  "carbs": 63,  "fat": 17,  "sugar": 2,   "sodium": 900},
    "sandwich":          {"calories_100g": 210, "protein": 8,   "carbs": 28,  "fat": 7,   "sugar": 3,   "sodium": 440},
    "chips":             {"calories_100g": 536, "protein": 7,   "carbs": 53,  "fat": 35,  "sugar": 0.4, "sodium": 524},

    # ── Fruits ───────────────────────────────────────────────────────────────
    "banana":            {"calories_100g": 89,  "protein": 1.1, "carbs": 23,  "fat": 0.3, "sugar": 12,  "sodium": 1},
    "apple":             {"calories_100g": 52,  "protein": 0.3, "carbs": 14,  "fat": 0.2, "sugar": 10,  "sodium": 1},
    "mango":             {"calories_100g": 60,  "protein": 0.8, "carbs": 15,  "fat": 0.4, "sugar": 14,  "sodium": 1},
    "orange":            {"calories_100g": 47,  "protein": 0.9, "carbs": 12,  "fat": 0.1, "sugar": 9,   "sodium": 0},
    "grapes":            {"calories_100g": 69,  "protein": 0.7, "carbs": 18,  "fat": 0.2, "sugar": 15,  "sodium": 2},
    "watermelon":        {"calories_100g": 30,  "protein": 0.6, "carbs": 8,   "fat": 0.2, "sugar": 6,   "sodium": 1},
    "papaya":            {"calories_100g": 43,  "protein": 0.5, "carbs": 11,  "fat": 0.3, "sugar": 8,   "sodium": 8},
    "pomegranate":       {"calories_100g": 83,  "protein": 1.7, "carbs": 19,  "fat": 1.2, "sugar": 14,  "sodium": 3},

    # ── Nuts & seeds ─────────────────────────────────────────────────────────
    "almonds":           {"calories_100g": 579, "protein": 21,  "carbs": 22,  "fat": 50,  "sugar": 4,   "sodium": 1},
    "peanuts":           {"calories_100g": 567, "protein": 26,  "carbs": 16,  "fat": 49,  "sugar": 4,   "sodium": 18},
    "cashews":           {"calories_100g": 553, "protein": 18,  "carbs": 30,  "fat": 44,  "sugar": 6,   "sodium": 12},
    "walnuts":           {"calories_100g": 654, "protein": 15,  "carbs": 14,  "fat": 65,  "sugar": 2.6, "sodium": 2},

    # ── Drinks ───────────────────────────────────────────────────────────────
    "chai":              {"calories_100g": 35,  "protein": 1.5, "carbs": 5,   "fat": 1.2, "sugar": 4,   "sodium": 10},
    "coffee":            {"calories_100g": 5,   "protein": 0.3, "carbs": 1,   "fat": 0,   "sugar": 0,   "sodium": 2},
    "juice":             {"calories_100g": 45,  "protein": 0.5, "carbs": 11,  "fat": 0.1, "sugar": 9,   "sodium": 5},

    # ── Grains ───────────────────────────────────────────────────────────────
    "pasta":             {"calories_100g": 158, "protein": 5.8, "carbs": 31,  "fat": 0.9, "sugar": 0.6, "sodium": 1},
    "bread":             {"calories_100g": 265, "protein": 9,   "carbs": 49,  "fat": 3.2, "sugar": 5,   "sodium": 490},
    "cornflakes":        {"calories_100g": 357, "protein": 7,   "carbs": 84,  "fat": 0.9, "sugar": 8,   "sodium": 752},

    # ── Salads & light foods ──────────────────────────────────────────────────
    "salad":             {"calories_100g": 20,  "protein": 1.5, "carbs": 3.5, "fat": 0.2, "sugar": 2,   "sodium": 15},
    "cucumber":          {"calories_100g": 16,  "protein": 0.7, "carbs": 3.6, "fat": 0.1, "sugar": 1.7, "sodium": 2},
    "tomato":            {"calories_100g": 18,  "protein": 0.9, "carbs": 3.9, "fat": 0.2, "sugar": 2.6, "sodium": 5},
    "onion":             {"calories_100g": 40,  "protein": 1.1, "carbs": 9,   "fat": 0.1, "sugar": 4,   "sodium": 4},
    "spinach":           {"calories_100g": 23,  "protein": 2.9, "carbs": 3.6, "fat": 0.4, "sugar": 0.4, "sodium": 79},
    "broccoli":          {"calories_100g": 34,  "protein": 2.8, "carbs": 7,   "fat": 0.4, "sugar": 1.7, "sodium": 33},
    "potato":            {"calories_100g": 77,  "protein": 2,   "carbs": 17,  "fat": 0.1, "sugar": 0.8, "sodium": 6},
    "sweet_potato":      {"calories_100g": 86,  "protein": 1.6, "carbs": 20,  "fat": 0.1, "sugar": 4.2, "sodium": 55},

    # ── Sweets ───────────────────────────────────────────────────────────────
    "gulab_jamun":       {"calories_100g": 380, "protein": 6,   "carbs": 60,  "fat": 13,  "sugar": 45,  "sodium": 120},
    "rasgulla":          {"calories_100g": 186, "protein": 4,   "carbs": 40,  "fat": 2,   "sugar": 35,  "sodium": 50},
    "kheer":             {"calories_100g": 140, "protein": 4,   "carbs": 22,  "fat": 4,   "sugar": 18,  "sodium": 60},
    "ladoo":             {"calories_100g": 420, "protein": 7,   "carbs": 58,  "fat": 18,  "sugar": 35,  "sodium": 80},
    "halwa":             {"calories_100g": 270, "protein": 3,   "carbs": 40,  "fat": 11,  "sugar": 28,  "sodium": 90},
    "chocolate":         {"calories_100g": 535, "protein": 8,   "carbs": 60,  "fat": 30,  "sugar": 48,  "sodium": 79},
}


def normalize_food_name(food_name: str) -> str:
    return food_name.strip().lower().replace(" ", "_")


def load_nutrition_data(csv_path=DEFAULT_CSV) -> dict:
    """
    Loads nutrition data from CSV into memory.
    Also loads built-in Indian foods database.
    CSV data takes priority over built-in data.
    Call once at app startup.
    """
    global NUTRITION_DB

    # Start with built-in Indian foods
    NUTRITION_DB = dict(INDIAN_FOODS_DB)

    # Try to load CSV — if it exists, it adds/overrides entries
    csv_path = Path(csv_path)
    if csv_path.exists():
        try:
            with open(csv_path, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    food = normalize_food_name(row["food"])
                    NUTRITION_DB[food] = {
                        "calories_100g": float(row["calories_100g"]),
                        "protein":       float(row["protein"]),
                        "carbs":         float(row["carbs"]),
                        "fat":           float(row["fat"]),
                        "sugar":         float(row.get("sugar", 0) or 0),
                        "sodium":        float(row.get("sodium", 0) or 0),
                    }
            print(f"✅ Loaded {len(NUTRITION_DB)} foods (CSV + built-in)")
        except Exception as e:
            print(f"⚠️  CSV load error: {e} — using built-in database only")
    else:
        print(f"⚠️  CSV not found — using built-in Indian foods database ({len(NUTRITION_DB)} foods)")

    return NUTRITION_DB


def get_food_nutrition(food_name: str) -> dict | None:
    """
    Returns nutrition data for a food name.
    1. Check alias map first (egg → egg_boiled)
    2. Check exact match in DB
    3. Check with underscores (pav bhaji → pav_bhaji)
    4. Check partial match (chicken tikka masala → chicken_tikka)
    5. Return None if not found
    """
    if not NUTRITION_DB:
        raise RuntimeError("Nutrition DB not loaded. Call load_nutrition_data() first.")

    # Normalize input
    food_name = food_name.strip().lower()

    # Step 1: Check alias map
    alias_key = FOOD_ALIAS_MAP.get(food_name)
    if alias_key and alias_key in NUTRITION_DB:
        return NUTRITION_DB[alias_key]

    # Step 2: Check exact match
    if food_name in NUTRITION_DB:
        return NUTRITION_DB[food_name]

    # Step 3: Check with underscores (handles "pav bhaji" → "pav_bhaji")
    underscored = food_name.replace(" ", "_")
    if underscored in NUTRITION_DB:
        return NUTRITION_DB[underscored]

    # Step 4: Partial match — check if any DB key starts with the food name
    # Handles "chicken tikka masala" → finds "chicken_tikka"
    for key in NUTRITION_DB:
        if food_name.replace("_", " ") in key.replace("_", " "):
            return NUTRITION_DB[key]
        if key.replace("_", " ") in food_name.replace("_", " "):
            return NUTRITION_DB[key]

    # Not found
    return None