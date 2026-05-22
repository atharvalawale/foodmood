# ─────────────────────────────────────────────
# fatsecret.py — FatSecret API Integration
# ─────────────────────────────────────────────

import os
import requests

FATSECRET_KEY    = os.getenv("FATSECRET_KEY",    "")
FATSECRET_SECRET = os.getenv("FATSECRET_SECRET", "")

# ── Token + auth state cache ──────────────────────────────────────────────────
# _auth_ok = None  → untested yet
# _auth_ok = True  → auth works, use normally
# _auth_ok = False → auth failed, skip ALL future calls (no latency)
_auth_ok    = None
_token_cache = {"token": None, "expires_at": 0}


def get_access_token() -> str | None:
    """
    Gets OAuth 2.0 access token from FatSecret.
    Caches for 24h. If auth fails once, marks FatSecret as disabled
    so it never retries — avoiding 1-2s delay on every search.
    """
    global _auth_ok
    import time

    if not FATSECRET_KEY or not FATSECRET_SECRET:
        _auth_ok = False
        return None

    # Already know it's broken — don't retry
    if _auth_ok is False:
        return None

    # Return cached token if still valid
    if _token_cache["token"] and time.time() < _token_cache["expires_at"]:
        return _token_cache["token"]

    try:
        response = requests.post(
            "https://oauth.fatsecret.com/connect/token",
            data={"grant_type": "client_credentials", "scope": "basic"},
            auth=(FATSECRET_KEY, FATSECRET_SECRET),
            timeout=10,
        )
        response.raise_for_status()
        data       = response.json()
        token      = data.get("access_token")
        expires_in = data.get("expires_in", 86400)

        _token_cache["token"]      = token
        _token_cache["expires_at"] = time.time() + expires_in - 60
        _auth_ok = True
        print("✅ FatSecret auth OK")
        return token

    except Exception as e:
        # Mark as permanently broken for this server session
        # Will retry on next server restart (in case of temp network issue)
        _auth_ok = False
        print(f"⚠️  FatSecret disabled — auth failed: {e}")
        print("    Check FATSECRET_KEY and FATSECRET_SECRET in your .env")
        return None


def is_available() -> bool:
    """
    Returns True only if FatSecret is configured AND auth works.
    After first failure, returns False instantly (no HTTP call) — 
    so bad credentials don't add latency to every search.
    """
    global _auth_ok

    # Keys not set at all
    if not FATSECRET_KEY or not FATSECRET_SECRET:
        return False

    # Already tested — return cached result
    if _auth_ok is True:
        return True
    if _auth_ok is False:
        return False

    # First call — test auth now
    token = get_access_token()
    return _auth_ok is True


def search_fatsecret(query: str, max_results: int = 5) -> list:
    """
    Searches FatSecret for foods matching the query.
    Returns [] immediately if auth is broken (no HTTP call).
    """
    if not query or len(query) < 3:
        return []

    if not is_available():
        return []

    token = get_access_token()
    if not token:
        return []

    try:
        response = requests.get(
            "https://platform.fatsecret.com/rest/server.api",
            headers={"Authorization": f"Bearer {token}"},
            params={
                "method":            "foods.search",
                "search_expression": query,
                "format":            "json",
                "max_results":       max_results,
                "page_number":       0,
            },
            timeout=8,
        )
        response.raise_for_status()
        data = response.json()

        foods_data = data.get("foods", {}).get("food", [])
        if isinstance(foods_data, dict):
            foods_data = [foods_data]

        results = []
        for food in foods_data:
            parsed = _parse_fatsecret_food(food)
            if parsed:
                results.append(parsed)

        return results

    except Exception as e:
        print(f"⚠️  FatSecret search error: {e}")
        return []


def get_fatsecret_food(food_id: str) -> dict | None:
    """Gets detailed nutrition for a specific food by ID."""
    if not is_available():
        return None

    token = get_access_token()
    if not token:
        return None

    try:
        response = requests.get(
            "https://platform.fatsecret.com/rest/server.api",
            headers={"Authorization": f"Bearer {token}"},
            params={
                "method":  "food.get.v2",
                "food_id": food_id,
                "format":  "json",
            },
            timeout=8,
        )
        response.raise_for_status()
        data = response.json()
        return _parse_fatsecret_food_detail(data.get("food", {}))

    except Exception as e:
        print(f"⚠️  FatSecret food detail failed: {e}")
        return None


def _parse_fatsecret_food(food: dict) -> dict | None:
    """
    Parses a FatSecret food search result.
    Description format: "Per 100g - Calories: 165kcal | Fat: 3.60g | Carbs: 0g | Protein: 31g"
    """
    try:
        name        = food.get("food_name", "")
        food_id     = food.get("food_id",   "")
        description = food.get("food_description", "")

        if not name or not description:
            return None

        nutrition = _parse_description(description)
        if not nutrition:
            return None

        food_key     = name.lower().strip().replace(" ", "_").replace(",", "").replace("'", "")
        brand        = food.get("brand_name", "")
        display_name = f"{name} ({brand})" if brand else name

        return {
            "key":               food_key,
            "name":              display_name,
            "calories_per_100g": nutrition.get("calories", 0),
            "protein":           nutrition.get("protein",  0),
            "carbs":             nutrition.get("carbs",    0),
            "fat":               nutrition.get("fat",      0),
            "fiber":             nutrition.get("fiber",    0),
            "fatsecret_id":      food_id,
            "source":            "fatsecret",
        }
    except Exception:
        return None


def _parse_description(description: str) -> dict | None:
    """Parses FatSecret nutrition description string into a dict."""
    import re
    if not description:
        return None
    try:
        result = {}
        for label, key in [
            (r'Calories:\s*([\d.]+)', "calories"),
            (r'Protein:\s*([\d.]+)',  "protein"),
            (r'Carbs?:\s*([\d.]+)',   "carbs"),
            (r'Fat:\s*([\d.]+)',      "fat"),
            (r'Fiber:\s*([\d.]+)',    "fiber"),
        ]:
            m = re.search(label, description, re.IGNORECASE)
            if m:
                result[key] = float(m.group(1))
        return result if result else None
    except Exception:
        return None


def _parse_fatsecret_food_detail(food: dict) -> dict | None:
    """Parses detailed food data from food.get.v2 API."""
    try:
        servings = food.get("servings", {}).get("serving", [])
        if isinstance(servings, dict):
            servings = [servings]

        serving_100g = None
        for s in servings:
            if "100g" in s.get("serving_description", "").lower():
                serving_100g = s
                break
        if not serving_100g and servings:
            serving_100g = servings[0]
        if not serving_100g:
            return None

        return {
            "calories_100g": float(serving_100g.get("calories",      0)),
            "protein":       float(serving_100g.get("protein",       0)),
            "carbs":         float(serving_100g.get("carbohydrate",  0)),
            "fat":           float(serving_100g.get("fat",           0)),
            "fiber":         float(serving_100g.get("fiber",         0)),
            "sugar":         float(serving_100g.get("sugar",         0)),
            "sodium":        float(serving_100g.get("sodium",        0)),
            "source":        "fatsecret",
        }
    except Exception:
        return None