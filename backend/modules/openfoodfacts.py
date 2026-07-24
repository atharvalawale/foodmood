# ─────────────────────────────────────────────
# openfoodfacts.py — OpenFoodFacts NAME search (not barcode)
# ─────────────────────────────────────────────
#
# This module was referenced from main.py's /foods/search (Layer 3) but
# never actually existed — that tier has been silently failing on every
# single request. This fills that gap: searching by product NAME, so
# branded/packaged foods (MuscleBlaze, Amul, Britannia, Haldiram's, etc.)
# can be found by typing their name, not just by scanning a barcode.
#
# Barcode lookups already work fine via modules/barcode.py — this module
# does not duplicate that.
# ─────────────────────────────────────────────

import requests

TIMEOUT = 8

# Same India-first, world-fallback pattern as barcode.py, for the same reason:
# much stronger Indian brand coverage on the India-specific endpoint.
SEARCH_URLS = [
    "https://in.openfoodfacts.org/cgi/search.pl",
    "https://world.openfoodfacts.org/cgi/search.pl",
]


def is_available() -> bool:
    """OpenFoodFacts is a free public API with no key required."""
    return True


def _extract(product: dict) -> dict | None:
    nutriments = product.get("nutriments", {})
    calories = nutriments.get("energy-kcal_100g", 0)
    if not calories:
        return None  # skip entries with no usable calorie data

    name = product.get("product_name", "").strip()
    if not name:
        return None

    return {
        "key":            name.lower().replace(" ", "_"),
        "name":           name,
        "calories_100g":  round(float(calories), 1),
        "protein":        round(float(nutriments.get("proteins_100g", 0) or 0), 1),
        "carbs":          round(float(nutriments.get("carbohydrates_100g", 0) or 0), 1),
        "fat":            round(float(nutriments.get("fat_100g", 0) or 0), 1),
        "fiber":          round(float(nutriments.get("fiber_100g", 0) or 0), 1),
        "sugar":          round(float(nutriments.get("sugars_100g", 0) or 0), 1),
        "sodium":         round(float(nutriments.get("sodium_100g", 0) or 0) * 1000, 1),  # g -> mg
        "serving_grams":  100,  # OFF's numbers are per-100g; serving size varies too much to trust blindly
        "brand":          product.get("brands", ""),
    }


def search_openfoodfacts(query: str, max_results: int = 5) -> list:
    """
    Searches OpenFoodFacts by product NAME.
    Returns a list of dicts in the shape main.py's L3 tier expects.
    """
    for url in SEARCH_URLS:
        try:
            response = requests.get(
                url,
                params={
                    "search_terms": query,
                    "search_simple": 1,
                    "action": "process",
                    "json": 1,
                    "page_size": max_results,
                },
                timeout=TIMEOUT,
                headers={"User-Agent": "FoodMood/1.0"},  # OFF asks API consumers to identify themselves
            )
            response.raise_for_status()
            data = response.json()
            products = data.get("products", [])

            results = []
            for p in products:
                extracted = _extract(p)
                if extracted:
                    results.append(extracted)

            if results:
                return results[:max_results]
            # Empty results from India endpoint isn't an error — just try world next.

        except requests.exceptions.Timeout:
            continue
        except Exception as e:
            print(f"⚠️  OpenFoodFacts name search error ({url}): {e}")
            continue

    return []