import requests


def fetch_product(barcode: str) -> dict:
    """
    Fetches product nutrition from OpenFoodFacts by barcode.

    Strategy:
    1. Try India endpoint first (500k+ Indian products — Amul, Britannia, Haldiram's etc.)
    2. Fall back to world endpoint (global products)
    3. Return {"error": "..."} if not found anywhere

    Indian endpoint covers:
    - All major Indian brands (Amul, Britannia, Nestle India, ITC, Haldiram's)
    - Regional products
    - Much better coverage than world endpoint for Indian barcodes
    """

    # Try India first, then world
    urls = [
        f"https://in.openfoodfacts.org/api/v0/product/{barcode}.json",   # India endpoint ← NEW
        f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json", # World fallback
    ]

    for url in urls:
        try:
            response = requests.get(url, timeout=8)
            response.raise_for_status()
            data = response.json()

            # Product found!
            if data.get("status") == 1:
                product    = data["product"]
                nutriments = product.get("nutriments", {})

                return {
                    "name":             product.get("product_name", "Unknown"),
                    "brand":            product.get("brands", ""),
                    "serving_size":     product.get("serving_size", "100g"),
                    "calories_per_100g":nutriments.get("energy-kcal_100g", 0),
                    "protein_g":        nutriments.get("proteins_100g", 0),
                    "carbs_g":          nutriments.get("carbohydrates_100g", 0),
                    "fat_g":            nutriments.get("fat_100g", 0),
                    "sugar_g":          nutriments.get("sugars_100g", 0),
                    "sodium_mg":        nutriments.get("sodium_100g", 0) * 1000,  # g → mg
                    "fiber_g":          nutriments.get("fiber_100g", 0),
                    "ingredients":      product.get("ingredients_text", ""),
                    "allergens":        product.get("allergens_tags", []),
                    "nutriscore":       product.get("nutriscore_grade", "?").upper(),
                    "labels":           product.get("labels_tags", []),
                    "source":           "in.openfoodfacts" if "in." in url else "world.openfoodfacts",
                }

        except requests.exceptions.Timeout:
            continue  # try next URL
        except requests.exceptions.RequestException:
            continue  # try next URL

    return {"error": f"Product {barcode} not found in Indian or world database"}