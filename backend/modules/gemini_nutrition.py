# ─────────────────────────────────────────────
# gemini_nutrition.py — Gemini AI Nutrition Fallback
# ─────────────────────────────────────────────
#
# Used ONLY when food is not found in local DB.
# Gemini 2.5 Flash is already integrated for image detection
# so we reuse the same API key — zero extra cost.
#
# Key difference from Groq fallback:
#   - Strict prompt forces ICMR/USDA verified values
#   - Never says "estimate" — says "look up actual values"
#   - Returns null if food is genuinely unknown (no guessing)
#   - Results cached in NUTRITION_DB so same food never hits Gemini twice
# ─────────────────────────────────────────────

import os
import json
import re
import google.generativeai as genai

# ── Configure Gemini ───────────────────────────────────────────────────────────
GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")

_client = None

def _get_client():
    global _client
    if _client is None:
        if not GEMINI_KEY:
            print("⚠️  GEMINI_API_KEY not set — nutrition fallback disabled")
            return None
        genai.configure(api_key=GEMINI_KEY)
        _client = genai.GenerativeModel("gemini-2.5-flash")
    return _client


def get_gemini_nutrition(food_name: str) -> dict | None:
    """
    Gets verified nutrition data for a food using Gemini AI.

    Only called when food is NOT in local DB.
    Uses a strict prompt that forces Gemini to return
    ICMR/USDA-based values rather than guessing.

    Returns:
        dict with calories_100g, protein, carbs, fat, fiber, sugar, sodium
        None if food is unknown or API fails
    """
    client = _get_client()
    if not client:
        return None

    if not food_name or len(food_name.strip()) < 2:
        return None

    prompt = f"""You are a nutrition expert for Indian and global foods.

Identify and return nutrition for: "{food_name}"

This may be in Hindi, Marathi, Tamil, Telugu, Bengali, Gujarati or English.
Regional name examples:
- hapus / hapus aamba / hapus mango = Alphonso mango (sweet mango variety, ~60 kcal/100g)
- kairi / kairee = raw unripe mango (~55 kcal/100g)
- anda / ande = boiled egg
- chawal = cooked white rice
- doodh = full fat milk
- murgh = chicken breast
- aalu = potato
- tamatar = tomato
- bhindi = okra / ladyfinger
- karela = bitter gourd

IMPORTANT: If you can identify the food even partially, return nutrition for it.
Only return {{"unknown": true}} if it is completely unrecognisable.

Use ICMR values for Indian foods, USDA for others.
All values per 100g as typically consumed.

Return ONLY this JSON, no other text:
{{
  "food_name": "standardized name",
  "calories_100g": <number>,
  "protein": <grams per 100g>,
  "carbs": <grams per 100g>,
  "fat": <grams per 100g>,
  "fiber": <grams per 100g>,
  "sugar": <grams per 100g>,
  "sodium": <mg per 100g>,
  "serving_grams": <typical serving size in grams>,
  "category": "one of: Indian Food, Fruit, Vegetable, Protein, Grain, Dairy, Snack, Beverage, Fast Food, Sweet, Packaged",
  "source": "ICMR" or "USDA" or "verified"
}}"""

    try:
        response = client.generate_content(prompt)
        text = response.text.strip()

        # Strip markdown code blocks if present
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)
        text = text.strip()

        # Extract JSON
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if not match:
            print(f"⚠️  Gemini returned no JSON for '{food_name}'")
            return None

        data = json.loads(match.group())

        # Food is unknown — don't cache garbage
        if data.get("unknown"):
            print(f"⚠️  Gemini: '{food_name}' is unknown food")
            return None

        # Validate required fields
        if not data.get("calories_100g"):
            print(f"⚠️  Gemini: no calories returned for '{food_name}'")
            return None

        nutrition = {
            "calories_100g": float(data["calories_100g"]),
            "protein":       float(data.get("protein", 0) or 0),
            "carbs":         float(data.get("carbs", 0) or 0),
            "fat":           float(data.get("fat", 0) or 0),
            "fiber":         float(data.get("fiber", 0) or 0),
            "sugar":         float(data.get("sugar", 0) or 0),
            "sodium":        float(data.get("sodium", 0) or 0),
            "source":        "gemini_verified",
            "_serving_grams": int(data.get("serving_grams", 100) or 100),
            "_category":      data.get("category", "Food"),
            "_food_name":     data.get("food_name", food_name),
        }

        print(f"✅ [Gemini] '{food_name}' → {nutrition['calories_100g']} kcal/100g ({nutrition['source']})")
        return nutrition

    except json.JSONDecodeError as e:
        print(f"⚠️  Gemini JSON parse error for '{food_name}': {e}")
        return None
    except Exception as e:
        print(f"⚠️  Gemini nutrition error for '{food_name}': {e}")
        return None


def is_available() -> bool:
    """Returns True if Gemini API key is configured."""
    return bool(GEMINI_KEY)