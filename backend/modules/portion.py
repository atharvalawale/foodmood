# ─────────────────────────────────────────────
# portion.py — Converts detected foods into grams
# ─────────────────────────────────────────────
#
# HOW IT WORKS:
# 1. Gemini returns foods with quantity, unit, and sometimes grams
# 2. If Gemini gives grams → use that directly (it's already the total)
# 3. If no grams → look up base portion from PORTION_DB × unit multiplier × quantity
# 4. Output is always a list of {food, grams} dicts
#
# COMMON BUG (now fixed):
# Gemini returns grams for the WHOLE quantity already.
# So "6 eggs, grams=360" means 360g total — NOT 60g per egg.
# We must NOT multiply by quantity again when Gemini gives grams.
# ─────────────────────────────────────────────


# ── Portion database ──────────────────────────────────────────────────────────
# These are PER SERVING grams (1 roti, 1 bowl rice, 1 egg, etc.)
# Used only when Gemini doesn't provide grams

PORTION_DB = {
    # ── Grains & breads ──
    "rice":              200,   # 1 bowl cooked rice
    "white_rice":        200,
    "brown_rice":        185,
    "fried_rice":        200,
    "biryani":           250,
    "roti":               50,   # 1 roti
    "chapati":            50,   # 1 chapati
    "naan":               90,
    "paratha":           100,
    "bread":              60,   # 2 slices
    "toast":              60,
    "pasta":             220,   # 1 bowl cooked
    "noodles":           200,
    "pizza":             150,   # 1 medium slice
    "burger":            200,
    "sandwich":          180,
    "idli":               80,   # 2 idlis
    "dosa":              100,
    "upma":              180,
    "poha":              150,
    "oats":              150,   # 1 bowl cooked

    # ── Lentils & legumes ──
    "dal":               180,
    "dal_tadka":         180,
    "dal_makhani":       200,
    "rajma":             180,
    "chhole":            180,
    "sambar":            180,
    "lentil_soup":       200,

    # ── Eggs ──
    "egg":                60,   # 1 large egg
    "eggs":               60,   # per egg
    "egg_boiled":         60,
    "egg_fried":          70,   # slightly heavier (oil absorbed)
    "egg_scrambled":      90,   # cooked with butter/milk
    "egg_curry":         150,   # curry with 2 eggs

    # ── Meat & fish ──
    "chicken":           200,
    "chicken_grilled":   200,
    "chicken_curry":     250,
    "chicken_tikka":     150,
    "mutton":            200,
    "fish":              150,
    "fish_curry":        200,

    # ── Vegetarian proteins ──
    "paneer":            120,
    "paneer_curry":      200,
    "paneer_raw":        100,
    "tofu":              120,

    # ── Vegetables ──
    "salad":             100,
    "vegetable_curry":   150,
    "sabzi":             150,
    "mixed_vegetables":  150,
    "palak":             150,
    "aloo":              150,
    "aloo_gobi":         150,
    "bhindi":            150,
    "broccoli":          100,
    "spinach":           100,

    # ── Dairy ──
    "milk":              240,   # 1 glass
    "curd":              150,
    "yogurt":            150,
    "raita":             120,
    "cheese":             30,   # 1 slice
    "butter":             10,   # 1 tsp
    "ghee":               10,

    # ── Snacks ──
    "samosa":             80,
    "pakora":             80,
    "chips":              30,
    "biscuit":            20,
    "banana_chips":       30,

    # ── Fruits ──
    "banana":            120,
    "apple":             150,
    "mango":             200,
    "orange":            130,
    "grapes":            100,
    "watermelon":        200,

    # ── Drinks ──
    "chai":              150,
    "tea":               150,
    "coffee":            150,
    "juice":             240,
    "lassi":             250,
    "water":             250,
    "protein_shake":     300,
    "whey":              300,

    # ── Nuts & seeds ──
    "almonds":            28,   # small handful
    "peanuts":            28,
    "cashews":            28,
    "walnuts":            28,
}


# ── Unit multipliers ──────────────────────────────────────────────────────────
# These adjust the base portion size based on the unit described
# Example: "half bowl" of rice = 200g * 0.50 = 100g

UNIT_MULTIPLIERS = {
    # Small units
    "teaspoon":   0.10,
    "tsp":        0.10,
    "tablespoon": 0.20,
    "tbsp":       0.20,

    # Medium units
    "slice":      0.60,
    "piece":      1.00,
    "cup":        0.75,
    "half":       0.50,
    "quarter":    0.25,

    # Standard (no adjustment)
    "unit":       1.00,
    "serving":    1.00,
    "bowl":       1.00,
    "katori":     1.00,   # Indian standard bowl
    "glass":      1.00,
    "plate":      1.00,

    # Large units
    "large":      1.50,
    "big":        1.50,
    "full":       2.00,
    "double":     2.00,
}

# Gram-based units — when user says "100g", "200ml" etc.
# We use the quantity directly as grams
GRAM_UNITS = {"g", "gram", "grams", "ml", "milliliter", "milliliters"}

DEFAULT_GRAMS       = 100   # fallback if food not in PORTION_DB
DEFAULT_MULTIPLIER  = 1.0   # fallback if unit not in UNIT_MULTIPLIERS


def estimate_portion(detected_foods: list) -> list:
    """
    Converts detected food items into gram-based portions.

    Input example (from Gemini):
        [
            {"food": "egg_fried",  "quantity": 6,  "unit": "piece", "grams": 360},
            {"food": "chapati",    "quantity": 1,  "unit": "piece", "grams": 60},
            {"food": "white_rice", "quantity": 1,  "unit": "bowl",  "grams": 150},
        ]

    Output example:
        [
            {"food": "egg_fried",  "grams": 360},
            {"food": "chapati",    "grams": 60},
            {"food": "white_rice", "grams": 150},
        ]

    IMPORTANT:
    - When Gemini gives grams → use directly (already total, don't multiply by qty)
    - When no grams → use PORTION_DB base × unit multiplier × quantity
    - When unit is grams/ml → use quantity directly as grams
    """
    portions = []

    for item in detected_foods:
        food          = item.get("food", "unknown")
        qty           = float(item.get("quantity", 1))
        unit          = item.get("unit", "unit").lower().strip()
        gemini_grams  = item.get("grams", 0)

        # ── Priority 1: User specified gram unit (e.g. "100g oats") ──────────
        if unit in GRAM_UNITS:
            # qty IS the grams — e.g. quantity=100, unit="g" → 100g
            total = qty

        # ── Priority 2: Gemini gave us grams ─────────────────────────────────
        elif gemini_grams and gemini_grams > 0:
            # IMPORTANT FIX: Gemini already returns TOTAL grams for the whole
            # quantity. So "6 eggs, grams=360" means 360g total.
            # We must NOT multiply by qty again here!
            total = float(gemini_grams)

        # ── Priority 3: Look up portion DB + unit multiplier ──────────────────
        else:
            # Get base grams for 1 serving of this food
            base = PORTION_DB.get(food, DEFAULT_GRAMS)

            # Adjust for unit (e.g. "half bowl" = 0.50)
            multiplier = UNIT_MULTIPLIERS.get(unit, DEFAULT_MULTIPLIER)

            # Multiply by quantity (e.g. 2 rotis = 2 × 50g = 100g)
            total = base * multiplier * qty

        # Safety: never go below 1g
        total = max(total, 1)

        portions.append({
            "food":  food,
            "grams": round(total)
        })

    return portions