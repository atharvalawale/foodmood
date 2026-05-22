# ─────────────────────────────────────────────
# calorie_calculator.py — Nutrition math
# ─────────────────────────────────────────────

from modules.nutrition import get_food_nutrition
from modules.usda      import get_usda_nutrition

# ── Verified portion sizes (per 1 serving) ────────────────────────────────────
VERIFIED_PORTIONS = {

    # ── Eggs ──────────────────────────────────────────────────────────────────
    "egg":                   50,
    "eggs":                  50,
    "egg_boiled":            50,
    "egg_fried":             55,
    "egg_scrambled":         60,
    "egg_whole":             50,
    "boiled_egg":            50,
    "fried_egg":             55,
    "egg_boiled_large":      60,
    "omelette":              80,
    "egg_bhurji":            120,
    "egg_white":             33,   # 1 egg white ≈ 33g
    "egg_yolk":              17,   # 1 egg yolk ≈ 17g
    "egg_roll":              180,

    # ── Chicken — ALL variants (100g = standard serving for tracking) ─────────
    # Raw weights noted separately; cooked = what you actually eat
    "chicken_breast_cooked": 100,
    "chicken_breast_raw":    120,  # 120g raw → ~100g cooked
    "chicken_breast":        100,
    "chicken_boneless":      100,
    "chicken_grilled":       100,
    "chicken_boiled":        100,
    "chicken_roasted":       100,
    "chicken_fried":         100,
    "chicken_tikka":         100,
    "chicken_tandoori":      100,
    "chicken_curry":         150,  # curry = served with gravy
    "butter_chicken":        150,
    "chicken_65":            100,
    "chicken_shawarma":      200,  # full wrap
    "chicken_kebab":         100,
    "seekh_kebab":           100,
    "chicken_leg":           130,  # 1 drumstick ≈ 130g
    "chicken_thigh":         120,  # 1 thigh ≈ 120g
    "chicken_wings":         90,   # 2 wings ≈ 90g
    "chicken_biryani":       250,
    "chicken_momos":         100,

    # ── Mutton / Fish ─────────────────────────────────────────────────────────
    "mutton":                100,
    "mutton_curry":          150,
    "mutton_biryani":        250,
    "keema":                 100,
    "keema_matar":           150,
    "fish_grilled":          100,
    "fish_curry":            150,
    "fish_fry":              100,
    "rohu":                  100,
    "pomfret":               100,
    "tuna":                  100,
    "tuna_canned":           85,   # 1 small can
    "prawn":                 100,
    "prawn_curry":           150,

    # ── Breads ────────────────────────────────────────────────────────────────
    "chapati":               35,
    "roti":                  35,
    "naan":                  90,
    "garlic_naan":           90,
    "paratha":               80,
    "aloo_paratha":          100,
    "gobi_paratha":          100,
    "methi_paratha":         90,
    "puri":                  30,
    "bhatura":               90,
    "bread":                 30,
    "bread_white":           30,
    "bread_brown":           30,
    "whole_wheat_bread":     30,
    "pav":                   50,
    "thepla":                40,
    "khakhra":               15,   # 1 khakhra ≈ 15g
    "missi_roti":            40,

    # ── Rice & Grains ─────────────────────────────────────────────────────────
    "white_rice":            150,
    "brown_rice":            150,
    "basmati_rice":          150,
    "fried_rice":            150,
    "biryani":               200,
    "chicken_biryani":       250,
    "veg_biryani":           200,
    "mutton_biryani":        250,
    "khichdi":               180,
    "pulao":                 150,
    "jeera_rice":            150,
    "curd_rice":             150,

    # ── Oats ──────────────────────────────────────────────────────────────────
    "oats_cooked":           150,  # 1 bowl cooked oats
    "oats_raw":              40,   # 40g dry oats (makes 1 bowl)
    "oats":                  40,   # default = raw/dry weight
    "masala_oats":           35,   # 1 packet
    "oats_upma":             150,

    # ── Dal & Legumes ─────────────────────────────────────────────────────────
    "dal_tadka":             150,
    "dal_makhani":           150,
    "toor_dal":              150,
    "moong_dal":             150,
    "masoor_dal":            150,
    "urad_dal":              150,
    "chana_dal":             150,
    "rajma":                 150,
    "chhole":                150,
    "black_chana":           150,
    "sambar":                150,
    "lobia":                 150,
    "green_peas":            80,

    # ── Paneer & Soy ──────────────────────────────────────────────────────────
    "paneer_raw":            80,
    "paneer_low_fat":        80,
    "paneer_curry":          150,
    "palak_paneer":          150,
    "matar_paneer":          150,
    "shahi_paneer":          150,
    "kadai_paneer":          150,
    "paneer_bhurji":         150,
    "tofu":                  100,
    "soya_chunks":           30,   # 30g dry = ~90g cooked
    "soya_chunks_cooked":    90,
    "soya_granules":         30,

    # ── Dairy ─────────────────────────────────────────────────────────────────
    "milk_full_fat":         200,
    "milk_toned":            200,
    "milk_double_toned":     200,
    "milk_skimmed":          200,
    "milk":                  200,
    "curd":                  100,
    "curd_low_fat":          100,
    "greek_yogurt":          100,
    "raita":                 100,
    "lassi":                 200,
    "lassi_sweet":           200,
    "mango_lassi":           200,
    "buttermilk":            200,
    "cheese":                25,
    "cheese_slice":          20,   # 1 slice ≈ 20g
    "butter":                10,
    "ghee":                  10,
    "whey_protein":          30,   # 1 scoop

    # ── Breakfast / South Indian ──────────────────────────────────────────────
    "idli":                  40,   # 1 idli ≈ 40g
    "dosa":                  80,
    "dosa_masala":           150,
    "rava_dosa":             80,
    "uttapam":               100,
    "medu_vada":             60,
    "upma":                  150,
    "poha":                  150,
    "pesarattu":             100,
    "appam":                 60,
    "pongal":                150,
    "ven_pongal":            150,
    "sabudana_khichdi":      150,
    "rava_idli":             50,

    # ── Vegetables & Curries ──────────────────────────────────────────────────
    "sabzi":                 100,
    "aloo_gobi":             100,
    "bhindi":                100,
    "bhindi_masala":         100,
    "baingan_bharta":        100,
    "aloo_matar":            100,
    "mix_veg":               100,
    "jeera_aloo":            100,
    "aloo_curry":            100,
    "mutton_curry":          150,
    "fish_curry":            150,
    "pav_bhaji":             200,
    "kaddu_sabzi":           100,
    "lauki_sabzi":           100,

    # ── Street Food & Snacks ──────────────────────────────────────────────────
    "samosa":                80,
    "pakora":                50,
    "vada":                  60,
    "dhokla":                60,
    "khandvi":               60,
    "vada_pav":              150,
    "chole_bhature":         300,
    "pani_puri":             100,   # 4–5 pieces
    "bhel_puri":             150,
    "sev_puri":              100,
    "dahi_puri":             100,
    "dahi_vada":             100,
    "aloo_tikki":            100,
    "dabeli":                120,
    "misal_pav":             250,
    "misal":                 150,
    "usal":                  150,
    "momos":                 100,   # 4–5 pieces
    "veg_momos":             100,
    "chicken_momos":         100,
    "frankie":               200,
    "kati_roll":             200,

    # ── Chai & Khari (verified) ───────────────────────────────────────────────
    "chai":                  150,   # 1 cup = 150ml
    "tea":                   150,
    "masala_chai":           150,
    "khari":                 8,     # 1 small khari piece ≈ 8g
    "khari_biscuit":         8,
    "puff_pastry":           25,

    # ── Fast Food ─────────────────────────────────────────────────────────────
    "burger":                150,
    "veg_burger":            150,
    "chicken_burger":        160,
    "pizza_slice":           100,
    "maggi_noodles":         70,    # 1 packet dry
    "sandwich":              150,
    "chips":                 30,
    "pasta":                 150,   # cooked

    # ── Packaged / Biscuits ───────────────────────────────────────────────────
    "parle_g":               11,    # 1 biscuit ≈ 11g
    "marie_biscuit":         7,     # 1 biscuit ≈ 7g
    "digestive_biscuit":     14,    # 1 biscuit ≈ 14g
    "good_day_biscuit":      8,

    # ── Fruits ────────────────────────────────────────────────────────────────
    "banana":                100,
    "apple":                 150,
    "mango":                 150,
    "orange":                130,
    "grapes":                100,
    "watermelon":            200,
    "papaya":                150,
    "pomegranate":           100,
    "guava":                 100,
    "chikoo":                100,
    "pear":                  150,
    "strawberries":          100,
    "kiwi":                  75,
    "pineapple":             100,

    # ── Nuts & Seeds (per handful) ────────────────────────────────────────────
    "almonds":               28,
    "peanuts":               28,
    "cashews":               28,
    "walnuts":               28,
    "pistachios":            28,
    "flaxseeds":             10,
    "chia_seeds":            10,
    "sunflower_seeds":       28,
    "pumpkin_seeds":         28,
    "peanut_butter":         32,   # 2 tbsp

    # ── Drinks ────────────────────────────────────────────────────────────────
    "coffee":                150,
    "cold_coffee":           250,
    "juice":                 200,
    "nimbu_pani":            200,
    "coconut_water":         240,
    "buttermilk":            200,

    # ── Sweets ────────────────────────────────────────────────────────────────
    "gulab_jamun":           50,    # 1 piece ≈ 50g
    "rasgulla":              60,    # 1 piece ≈ 60g
    "kheer":                 150,
    "ladoo":                 40,    # 1 ladoo ≈ 40g
    "halwa":                 100,
    "jalebi":                60,
    "barfi":                 40,
    "chocolate":             40,
    "ice_cream":             100,
    "rasmalai":              80,
    "kulfi":                 60,

    # ── Sprouts ───────────────────────────────────────────────────────────────
    "moong_sprouts":         100,
    "mixed_sprouts":         100,
    "chana_sprouts":         100,
}

# ── Fallback nutrition — verified values for commonly mis-looked-up foods ──────
# These WIN over any DB lookup — used for foods where DB data is often wrong

FALLBACK_NUTRITION = {

    # ── Chai (per 100ml prepared) ─────────────────────────────────────────────
    "chai": {
        "calories_100g": 45,
        "protein": 1.7, "carbs": 6.5, "fat": 1.5,
        "fiber": 0.0, "sugar": 5.0, "sodium": 20.0,
        "source": "verified_indian",
    },
    "tea": {
        "calories_100g": 45,
        "protein": 1.7, "carbs": 6.5, "fat": 1.5,
        "fiber": 0.0, "sugar": 5.0, "sodium": 20.0,
        "source": "verified_indian",
    },
    "masala_chai": {
        "calories_100g": 50,
        "protein": 1.8, "carbs": 7.0, "fat": 1.8,
        "fiber": 0.1, "sugar": 5.5, "sodium": 22.0,
        "source": "verified_indian",
    },

    # ── Khari (per 100g) ──────────────────────────────────────────────────────
    "khari": {
        "calories_100g": 490,
        "protein": 8.0, "carbs": 58.0, "fat": 25.0,
        "fiber": 1.5, "sugar": 3.0, "sodium": 400.0,
        "source": "verified_indian",
    },
    "khari_biscuit": {
        "calories_100g": 490,
        "protein": 8.0, "carbs": 58.0, "fat": 25.0,
        "fiber": 1.5, "sugar": 3.0, "sodium": 400.0,
        "source": "verified_indian",
    },

    # ── Chicken breast — verified ICMR values ─────────────────────────────────
    # These prevent any DB lookup confusion between breast/thigh/leg
    "chicken_breast_cooked": {
        "calories_100g": 165,
        "protein": 31.0, "carbs": 0.0, "fat": 3.6,
        "fiber": 0.0, "sugar": 0.0, "sodium": 74.0,
        "source": "verified_icmr",
    },
    "chicken_breast_raw": {
        "calories_100g": 120,
        "protein": 22.5, "carbs": 0.0, "fat": 2.6,
        "fiber": 0.0, "sugar": 0.0, "sodium": 60.0,
        "source": "verified_icmr",
    },
    "chicken_breast": {
        "calories_100g": 165,
        "protein": 31.0, "carbs": 0.0, "fat": 3.6,
        "fiber": 0.0, "sugar": 0.0, "sodium": 74.0,
        "source": "verified_icmr",
    },
    "chicken_boneless": {
        "calories_100g": 165,
        "protein": 31.0, "carbs": 0.0, "fat": 3.6,
        "fiber": 0.0, "sugar": 0.0, "sodium": 74.0,
        "source": "verified_icmr",
    },
    "chicken_grilled": {
        "calories_100g": 165,
        "protein": 31.0, "carbs": 0.0, "fat": 3.6,
        "fiber": 0.0, "sugar": 0.0, "sodium": 74.0,
        "source": "verified_icmr",
    },
    "chicken_boiled": {
        "calories_100g": 185,
        "protein": 30.0, "carbs": 0.0, "fat": 7.0,
        "fiber": 0.0, "sugar": 0.0, "sodium": 80.0,
        "source": "verified_icmr",
    },
    "chicken_thigh": {
        "calories_100g": 209,
        "protein": 26.0, "carbs": 0.0, "fat": 11.0,
        "fiber": 0.0, "sugar": 0.0, "sodium": 88.0,
        "source": "verified_icmr",
    },
    "chicken_leg": {
        "calories_100g": 184,
        "protein": 26.0, "carbs": 0.0, "fat": 8.5,
        "fiber": 0.0, "sugar": 0.0, "sodium": 84.0,
        "source": "verified_icmr",
    },
    "chicken_wings": {
        "calories_100g": 203,
        "protein": 30.0, "carbs": 0.0, "fat": 8.1,
        "fiber": 0.0, "sugar": 0.0, "sodium": 96.0,
        "source": "verified_icmr",
    },

    # ── Egg white / yolk ──────────────────────────────────────────────────────
    "egg_white": {
        "calories_100g": 52,
        "protein": 11.0, "carbs": 0.7, "fat": 0.2,
        "fiber": 0.0, "sugar": 0.7, "sodium": 166.0,
        "source": "verified_icmr",
    },
    "egg_yolk": {
        "calories_100g": 322,
        "protein": 16.0, "carbs": 3.6, "fat": 27.0,
        "fiber": 0.0, "sugar": 0.6, "sodium": 48.0,
        "source": "verified_icmr",
    },

    # ── Paneer ────────────────────────────────────────────────────────────────
    "paneer_raw": {
        "calories_100g": 296,
        "protein": 18.0, "carbs": 3.0, "fat": 23.0,
        "fiber": 0.0, "sugar": 3.0, "sodium": 28.0,
        "source": "verified_icmr",
    },
    "paneer_low_fat": {
        "calories_100g": 180,
        "protein": 18.0, "carbs": 3.5, "fat": 10.0,
        "fiber": 0.0, "sugar": 3.0, "sodium": 28.0,
        "source": "verified_icmr",
    },

    # ── Soya chunks ───────────────────────────────────────────────────────────
    "soya_chunks": {
        "calories_100g": 345,
        "protein": 52.0, "carbs": 33.0, "fat": 0.5,
        "fiber": 13.0, "sugar": 2.0, "sodium": 10.0,
        "source": "verified_icmr",
    },
    "soya_chunks_cooked": {
        "calories_100g": 149,
        "protein": 15.0, "carbs": 8.0, "fat": 0.5,
        "fiber": 5.0, "sugar": 1.0, "sodium": 100.0,
        "source": "verified_icmr",
    },

    # ── Oats ──────────────────────────────────────────────────────────────────
    "oats_raw": {
        "calories_100g": 379,
        "protein": 13.0, "carbs": 68.0, "fat": 7.0,
        "fiber": 10.0, "sugar": 1.0, "sodium": 6.0,
        "source": "verified_icmr",
    },
    "oats_cooked": {
        "calories_100g": 71,
        "protein": 2.5, "carbs": 12.0, "fat": 1.5,
        "fiber": 1.7, "sugar": 0.3, "sodium": 49.0,
        "source": "verified_icmr",
    },
}


def get_nutrition(food: str) -> dict | None:
    """
    Gets nutrition data for a food.
    Priority:
    1. FALLBACK_NUTRITION (verified values — always wins)
    2. Local Indian DB
    3. USDA API
    """
    food_key = food.lower().replace(" ", "_")

    if food_key in FALLBACK_NUTRITION:
        return FALLBACK_NUTRITION[food_key]

    nutrition = get_food_nutrition(food)
    if nutrition:
        return nutrition

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
    1. VERIFIED_PORTIONS (per serving × quantity)
    2. AI gram estimate
    3. 100g fallback
    """
    food_key = food.lower().replace(" ", "_")

    if food_key in VERIFIED_PORTIONS:
        return VERIFIED_PORTIONS[food_key] * quantity

    if ai_grams and ai_grams > 0:
        return float(ai_grams)

    return 100.0


def calculate_calories(food: str, grams: float, quantity: float = 1) -> dict | None:
    if not food:
        return None

    actual_grams = get_grams(food, grams, quantity)
    if actual_grams <= 0:
        return None

    nutrition = get_nutrition(food)
    if nutrition is None:
        return None

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
    meal_items = []
    skipped    = []

    totals = {
        "calories": 0, "protein": 0, "carbs": 0,
        "fat": 0, "sugar": 0, "sodium": 0, "fiber": 0,
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