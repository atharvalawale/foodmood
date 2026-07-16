GOAL_CALORIE_LIMITS = {
    "weight_loss": 600,
    "maintenance": 800,
    "muscle_gain": 1000,
}

GOAL_PROTEIN_TARGETS = {
    "muscle_gain": 30,  # minimum grams of protein per meal
}

# ── Diet-type keyword restrictions ────────────────────────────────────────────
# Matched the same way as allergens: substring match against the food name.
# Not exhaustive — extend as false negatives/positives turn up in real logs.
MEAT_SEAFOOD_KEYWORDS = [
    "chicken", "mutton", "beef", "pork", "bacon", "turkey", "lamb",
    "fish", "prawn", "shrimp", "crab", "seafood", "salmon", "tuna",
    "meat", "keema", "kebab", "shawarma",
]
DAIRY_KEYWORDS = [
    "milk", "curd", "yogurt", "cheese", "butter", "ghee", "paneer",
    "cream", "malai", "khoya", "lassi", "shrikhand",
]
GLUTEN_KEYWORDS = [
    "roti", "chapati", "naan", "paratha", "bread", "pasta", "noodles",
    "biscuit", "cake", "pav", "wheat", "maida", "samosa", "pakora",
]

DIET_RESTRICTIONS = {
    "vegetarian": MEAT_SEAFOOD_KEYWORDS,
    "vegan":      MEAT_SEAFOOD_KEYWORDS + DAIRY_KEYWORDS + ["egg", "honey"],
    "eggetarian": [k for k in MEAT_SEAFOOD_KEYWORDS if k != "egg"],
    "halal":      ["pork", "bacon", "alcohol", "wine", "beer"],
    "gluten-free": GLUTEN_KEYWORDS,
}

# Diet types that constrain macros rather than specific ingredients
DIET_SUGAR_LIMITS = {
    "diabetic-friendly": 10,  # grams of sugar per meal
}


def apply_personalization(meal, goal=None, allergies=None, diet_type=None):
    """
    Checks a meal against user goal, allergies, and diet type.
    Returns (warning_string, score_modifier).
    """
    warnings = []
    modifier = 0

    if goal and goal in GOAL_CALORIE_LIMITS:
        limit = GOAL_CALORIE_LIMITS[goal]
        if meal["total_calories"] > limit:
            warnings.append(f"High calorie meal for {goal.replace('_', ' ')} goal (>{limit} kcal)")
            modifier -= 15

    if goal == "muscle_gain":
        if meal.get("total_protein", 0) < GOAL_PROTEIN_TARGETS["muscle_gain"]:
            warnings.append("Low protein for muscle gain goal (<30g per meal)")
            modifier -= 10

    if meal.get("total_sodium", 0) > 800:
        warnings.append("High sodium meal (>800mg)")
        modifier -= 5

    if meal.get("total_sugar", 0) > 20:
        warnings.append("High sugar content (>20g)")
        modifier -= 5

    if allergies:
        for item in meal.get("items", []):
            food_text = (
                item.get("food", "") + " " +
                item.get("ingredients", "")
            ).lower()
            for allergen in allergies:
                if allergen.lower() in food_text:
                    warnings.append(f"⚠️ Allergen detected: {allergen} in {item['food']}")
                    modifier -= 30

    if diet_type:
        diet_key = diet_type.strip().lower()

        restricted_keywords = DIET_RESTRICTIONS.get(diet_key)
        if restricted_keywords:
            for item in meal.get("items", []):
                food_text = (
                    item.get("food", "") + " " +
                    item.get("ingredients", "")
                ).lower()
                for keyword in restricted_keywords:
                    if keyword in food_text:
                        warnings.append(
                            f"⚠️ {item['food']} conflicts with your {diet_type} preference"
                        )
                        modifier -= 25
                        break  # one flag per item is enough

        sugar_limit = DIET_SUGAR_LIMITS.get(diet_key)
        if sugar_limit is not None and meal.get("total_sugar", 0) > sugar_limit:
            warnings.append(
                f"High sugar for a {diet_type} diet (>{sugar_limit}g per meal)"
            )
            modifier -= 10

    warning_str = " | ".join(warnings) if warnings else ""
    return warning_str, modifier