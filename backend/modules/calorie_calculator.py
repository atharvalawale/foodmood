# ─────────────────────────────────────────────
# calorie_calculator.py — Nutrition math
# ─────────────────────────────────────────────
#
# HOW IT WORKS (like HealthifyMe):
#
# Priority for nutrition data:
#   1. Local DB (fast, Indian foods)
#   2. USDA API (300k+ foods, most accurate)
#
# Priority for portion sizes:
#   1. VERIFIED_PORTIONS — nutritionist verified sizes
#      (overrides AI estimates which are often wrong)
#   2. AI gram estimate — used when food not in verified DB
#
# IMPORTANT — How quantity works:
#   portion.py already multiplies grams × quantity before sending here.
#   So in calculate_meal_totals(), grams is ALREADY the total.
#   We do NOT multiply by quantity again here (that was the double-multiply bug).
#
#   BUT in get_grams(), quantity IS needed because we use VERIFIED_PORTIONS
#   which store PER-SERVING values (e.g. 1 chai = 150g).
#   So 2 cups chai = 150 × 2 = 300g ← this is correct.
#
# Example:
#   "2 boiled eggs"
#   AI says: grams=140 (70g each — too heavy)
#   We know: 1 egg = 50g → 2 eggs = 100g ✅
#   Result: 100g × 1.43 kcal/g = 143 kcal ✅ (correct!)
# ─────────────────────────────────────────────

from modules.nutrition import get_food_nutrition
from modules.usda      import get_usda_nutrition

# ── Verified portion sizes (per 1 serving) ────────────────────────────────────
# Nutritionist-verified standard Indian serving sizes
# We use these INSTEAD of AI gram estimates when available

VERIFIED_PORTIONS = {
    # Eggs
    # Eggs — all possible key variants
    "egg":              50,
    "eggs":             50,
    "egg_boiled":       50,
    "egg_fried":        55,
    "egg_scrambled":    60,
    "egg_whole":        50,
    "boiled_egg":       50,
    "fried_egg":        55,
    "egg_boiled_large": 60,
    "omelette":         80,

    # Breads
    "chapati":          35,
    "roti":             35,
    "naan":             90,
    "paratha":          80,
    "puri":             30,
    "bread":            30,
    "pav":              50,

    # Rice
    "white_rice":       150,
    "brown_rice":       150,
    "fried_rice":       150,
    "biryani":          200,
    "chicken_biryani":  250,
    "veg_biryani":      200,
    "khichdi":          180,
    "pulao":            150,

    # Dal
    "dal_tadka":        150,
    "dal_makhani":      150,
    "rajma":            150,
    "chhole":           150,
    "sambar":           150,
    "moong_dal":        150,

    # Vegetables & curries
    "sabzi":            100,
    "aloo_gobi":        100,
    "bhindi":           100,
    "palak_paneer":     150,
    "matar_paneer":     150,
    "shahi_paneer":     150,
    "butter_chicken":   150,
    "chicken_curry":    150,
    "mutton_curry":     150,
    "fish_curry":       150,
    "pav_bhaji":        200,

    # Proteins
    "chicken_grilled":  100,
    "chicken_tikka":    100,
    "chicken_tandoori": 100,
    "mutton":           100,
    "fish_grilled":     100,
    "paneer_raw":       80,

    # Dairy
    "milk":             200,
    "curd":             100,
    "raita":            100,
    "lassi":            200,
    "cheese":           25,
    "butter":           10,
    "ghee":             10,
    "whey_protein":     30,

    # Breakfast
    "oats":             40,
    "idli":             40,
    "dosa":             80,
    "dosa_masala":      100,
    "upma":             150,
    "poha":             150,
    "uttapam":          100,

    # Snacks
    "samosa":           80,
    "pakora":           50,
    "vada":             60,
    "dhokla":           60,

    # ── FIXED: Chai ───────────────────────────────────────────────────────────
    # 1 cup Indian chai = ~150ml (milk + water + tea + sugar)
    # Nutrition is calculated per 100ml of prepared chai
    # The calories_100g value in nutrition.py for chai should be ~45 kcal/100ml
    # So 150ml × 0.45 = ~68 kcal per cup ✅ (was showing 683 — 10x too high!)
    "chai":             150,   # ml per cup (correct)
    "tea":              150,
    "masala_chai":      150,

    # ── FIXED: Khari biscuit ──────────────────────────────────────────────────
    # 1 small regular khari (puff pastry type) = 10–12g per piece
    # 100g khari ≈ 480–500 kcal (it's buttery/flaky pastry)
    # So 1 khari = 12g × 4.9 = ~59 kcal ... × 4 pieces = ~236 kcal
    # But actual Indian small khari is closer to 8g per piece
    # 1 khari = 8g → 4 khari = 32g → 32 × 4.9 = ~157 kcal ✅
    "khari":            8,     # grams per 1 small khari piece
    "khari_biscuit":    8,
    "puff_pastry":      25,    # larger piece

    # Fruits
    "banana":           100,
    "apple":            150,
    "mango":            150,
    "orange":           130,
    "grapes":           100,
    "watermelon":       200,

    # Nuts (per handful)
    "almonds":          28,
    "peanuts":          28,
    "cashews":          28,
    "walnuts":          28,

    # Drinks
    "coffee":           150,
    "juice":            200,

    # Fast food
    "burger":           150,
    "pizza_slice":      100,
    "maggi_noodles":    70,
    "sandwich":         150,
    "chips":            30,
}

# ── Inline nutrition for foods often missing from DB ──────────────────────────
# These are fallback values we know are correct
# Format: calories_100g, protein, carbs, fat (all per 100g)

FALLBACK_NUTRITION = {
    # chai: per 100ml prepared (milk + water + sugar + tea)
    # Based on: 50ml milk (3.4g fat) + 50ml water + 1 tsp sugar (4g) + tea
    "chai": {
        "calories_100g": 45,   # kcal per 100ml
        "protein":       1.7,
        "carbs":         6.5,
        "fat":           1.5,
        "fiber":         0.0,
        "sugar":         5.0,
        "sodium":        20.0,
        "source":        "verified_indian"
    },
    "tea": {
        "calories_100g": 45,
        "protein":       1.7,
        "carbs":         6.5,
        "fat":           1.5,
        "fiber":         0.0,
        "sugar":         5.0,
        "sodium":        20.0,
        "source":        "verified_indian"
    },
    "masala_chai": {
        "calories_100g": 50,   # slightly more due to spices + extra milk
        "protein":       1.8,
        "carbs":         7.0,
        "fat":           1.8,
        "fiber":         0.1,
        "sugar":         5.5,
        "sodium":        22.0,
        "source":        "verified_indian"
    },
    # khari: per 100g (it's a buttery puff pastry biscuit)
    "khari": {
        "calories_100g": 490,  # high because it's made with butter/oil
        "protein":       8.0,
        "carbs":         58.0,
        "fat":           25.0,
        "fiber":         1.5,
        "sugar":         3.0,
        "sodium":        400.0,
        "source":        "verified_indian"
    },
    "khari_biscuit": {
        "calories_100g": 490,
        "protein":       8.0,
        "carbs":         58.0,
        "fat":           25.0,
        "fiber":         1.5,
        "sugar":         3.0,
        "sodium":        400.0,
        "source":        "verified_indian"
    },
}


def get_nutrition(food: str) -> dict | None:
    """
    Gets nutrition data for a food.
    Order of priority:
    1. FALLBACK_NUTRITION (our verified values for tricky foods)
    2. Local Indian DB (nutrition.py)
    3. USDA API (300k+ foods)
    """
    food_key = food.lower().replace(" ", "_")

    # Priority 1: Check our verified fallback values first
    # These override DB values for foods we know are calculated wrong
    if food_key in FALLBACK_NUTRITION:
        return FALLBACK_NUTRITION[food_key]

    # Priority 2: Try local DB (fast, offline, 100+ Indian foods)
    nutrition = get_food_nutrition(food)
    if nutrition:
        return nutrition

    # Priority 3: Try USDA (slower but 300k+ foods)
    print(f"🔍 '{food}' not in local DB — trying USDA...")
    usda = get_usda_nutrition(food)
    if usda:
        print(f"✅ USDA: '{food}' = {usda['calories_100g']} kcal/100g")
        return usda

    print(f"❌ '{food}' not found anywhere")
    return None


def get_grams(food: str, ai_grams: float, quantity: float) -> float:
    """
    Gets the best gram estimate for a food.

    Priority:
    1. If food is in VERIFIED_PORTIONS → use verified grams × quantity
    2. If AI gave grams → use that (already total grams, portion.py handled it)
    3. Fallback to 100g

    WHY quantity here?
    VERIFIED_PORTIONS stores grams per 1 serving.
    If user said "2 cups chai", quantity=2, so we do 150 × 2 = 300g.
    This is the ONLY place quantity multiplication happens.
    portion.py handles quantity for non-verified foods.
    """
    food_key = food.lower().replace(" ", "_")

    if food_key in VERIFIED_PORTIONS:
        # verified grams per serving × how many servings
        verified = VERIFIED_PORTIONS[food_key] * quantity
        return verified

    # AI gave us grams — portion.py already handled quantity multiplication
    if ai_grams and ai_grams > 0:
        return float(ai_grams)

    return 100.0  # last resort fallback


def calculate_calories(food: str, grams: float, quantity: float = 1) -> dict | None:
    """
    Calculates full nutrition for a single food item.

    Steps:
    1. Get best gram estimate (verified or AI)
    2. Get nutrition per 100g
    3. Multiply by (grams / 100)
    """
    if not food:
        return None

    actual_grams = get_grams(food, grams, quantity)

    if actual_grams <= 0:
        return None

    nutrition = get_nutrition(food)
    if nutrition is None:
        return None

    # factor = how many "100g units" we have
    # e.g. 150g → factor = 1.5 → multiply all values by 1.5
    factor = actual_grams / 100

    return {
        "food":     food,
        "grams":    actual_grams,
        "calories": round(nutrition["calories_100g"]  * factor, 1),
        "protein":  round(nutrition["protein"]        * factor, 1),
        "carbs":    round(nutrition["carbs"]          * factor, 1),
        "fat":      round(nutrition["fat"]            * factor, 1),
        "sugar":    round(nutrition.get("sugar", 0)   * factor, 1),
        "sodium":   round(nutrition.get("sodium", 0)  * factor, 1),
        "fiber":    round(nutrition.get("fiber", 0)   * factor, 1),
        "source":   nutrition.get("source", "local"),
    }


def calculate_meal_totals(portions: list) -> dict:
    """
    Calculates total nutrition for a full meal (list of food items).

    Each item in portions looks like:
    {
        "food": "chai",
        "grams": 150,      ← already calculated by portion.py
        "quantity": 1      ← how many servings (used only for VERIFIED_PORTIONS)
    }
    """
    meal_items = []
    skipped    = []

    totals = {
        "calories": 0,
        "protein":  0,
        "carbs":    0,
        "fat":      0,
        "sugar":    0,
        "sodium":   0,
        "fiber":    0,
    }

    for item in portions:
        food     = item.get("food", "")
        grams    = item.get("grams", 100)
        quantity = item.get("quantity", 1)

        result = calculate_calories(food=food, grams=grams, quantity=quantity)

        if result:
            meal_items.append(result)
            for key in totals:
                totals[key] += result[key]
        else:
            skipped.append(food)

    return {
        "items":          meal_items,
        "total_calories": round(totals["calories"], 1),
        "total_protein":  round(totals["protein"],  1),
        "total_carbs":    round(totals["carbs"],     1),
        "total_fat":      round(totals["fat"],       1),
        "total_sugar":    round(totals["sugar"],     1),
        "total_sodium":   round(totals["sodium"],    1),
        "total_fiber":    round(totals["fiber"],     1),
        "skipped_foods":  skipped,
    }