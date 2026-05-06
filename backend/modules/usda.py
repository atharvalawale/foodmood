# ─────────────────────────────────────────────
# usda.py — USDA FoodData Central API integration
# ─────────────────────────────────────────────
#
# USDA FoodData Central has 300,000+ foods including:
# - Raw ingredients (rice, chicken, eggs)
# - Branded products (MuscleBlaze, Amul, etc.)
# - Restaurant foods
# - Indian foods
#
# API docs: https://fdc.nal.usda.gov/api-guide.html
# Free: unlimited requests with API key
# ─────────────────────────────────────────────

import os
import requests
from dotenv import load_dotenv

load_dotenv()

USDA_API_KEY  = os.getenv("USDA_API_KEY", "")
USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1"

# ── Cache — avoid calling API twice for same food ─────────────────────────────
# When user searches "chicken" → we save result in memory
# Next time user searches "chicken" → return from cache instantly
_cache = {}


def search_usda(food_name: str, max_results: int = 5) -> list:
    """
    Searches USDA database for a food item.
    Returns list of matching foods with nutrition data.

    Input:  "pav bhaji" or "oats" or "muscleblaze whey"
    Output: [{"name": "...", "calories": 130, "protein": 3, ...}]
    """
    if not USDA_API_KEY:
        print("⚠️  USDA_API_KEY not set in .env")
        return []

    # Check cache first
    cache_key = food_name.lower().strip()
    if cache_key in _cache:
        print(f"📦 USDA cache hit: {food_name}")
        return _cache[cache_key]

    try:
        # Search USDA API
        url    = f"{USDA_BASE_URL}/foods/search"
        params = {
            "api_key":  USDA_API_KEY,
            "query":    food_name,
            "pageSize": max_results,
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        foods  = data.get("foods", [])
        result = []

        for food in foods:
            nutrition = _extract_nutrition(food)
            if nutrition:
                result.append({
                    "fdc_id":      food.get("fdcId"),
                    "name":        food.get("description", "Unknown"),
                    "brand":       food.get("brandOwner", ""),
                    "calories":    nutrition.get("calories", 0),
                    "protein":     nutrition.get("protein",  0),
                    "carbs":       nutrition.get("carbs",    0),
                    "fat":         nutrition.get("fat",      0),
                    "fiber":       nutrition.get("fiber",    0),
                    "sugar":       nutrition.get("sugar",    0),
                    "sodium":      nutrition.get("sodium",   0),
                    "source":      "USDA",
                })

        # Save to cache
        _cache[cache_key] = result
        print(f"✅ USDA found {len(result)} results for '{food_name}'")
        return result

    except requests.exceptions.Timeout:
        print(f"⚠️  USDA timeout for '{food_name}'")
        return []
    except Exception as e:
        print(f"⚠️  USDA error for '{food_name}': {e}")
        return []


def get_usda_nutrition(food_name: str) -> dict | None:
    """
    Gets nutrition for a food from USDA.
    Returns the BEST match as a nutrition dict (per 100g).
    Returns None if not found.

    This is what calorie_calculator.py calls as fallback.
    """
    results = search_usda(food_name, max_results=3)

    if not results:
        return None

    # Return best match (first result)
    best = results[0]

    return {
        "calories_100g": best["calories"],
        "protein":       best["protein"],
        "carbs":         best["carbs"],
        "fat":           best["fat"],
        "fiber":         best["fiber"],
        "sugar":         best["sugar"],
        "sodium":        best["sodium"],
        "source":        "USDA",
        "name":          best["name"],
    }


def _extract_nutrition(food: dict) -> dict:
    """
    Extracts nutrition values from USDA food object.
    USDA stores nutrients as a list — we find each one by nutrient ID.

    USDA Nutrient IDs:
    1008 = Energy (kcal)
    1003 = Protein (g)
    1005 = Carbohydrates (g)
    1004 = Total Fat (g)
    1079 = Fiber (g)
    2000 = Total Sugars (g)
    1093 = Sodium (mg)
    """
    NUTRIENT_IDS = {
        1008: "calories",
        1003: "protein",
        1005: "carbs",
        1004: "fat",
        1079: "fiber",
        2000: "sugar",
        1093: "sodium",
    }

    nutrition = {
        "calories": 0,
        "protein":  0,
        "carbs":    0,
        "fat":      0,
        "fiber":    0,
        "sugar":    0,
        "sodium":   0,
    }

    # USDA returns nutrients as a list of objects
    # Each object has nutrientId and value
    for nutrient in food.get("foodNutrients", []):
        nutrient_id = nutrient.get("nutrientId") or nutrient.get("nutrient", {}).get("id")
        value       = nutrient.get("value") or nutrient.get("amount", 0)

        if nutrient_id in NUTRIENT_IDS:
            key            = NUTRIENT_IDS[nutrient_id]
            nutrition[key] = round(float(value or 0), 2)

    # Only return if we got at least calories
    if nutrition["calories"] > 0:
        return nutrition
    return None


def search_food_usda(query: str) -> list:
    """
    Public function for searching foods from frontend.
    Used by Scanner page to show food suggestions.
    """
    return search_usda(query, max_results=10)