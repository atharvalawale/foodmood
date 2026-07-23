from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import tempfile
import os
import uuid
from datetime import date, datetime
from dotenv import load_dotenv

load_dotenv()

# ── Import all modules ─────────────────────────────────────────────────────────
from modules.image_detector     import predict_food
from modules.portion            import estimate_portion
from modules.calorie_calculator import calculate_meal_totals, VERIFIED_PORTIONS, FALLBACK_NUTRITION
from modules.nutrition          import load_nutrition_data, NUTRITION_DB, get_food_nutrition
from modules.text_parser        import extract_food_items
from modules.health_score       import compute_meal_health_score
from modules.personalization    import apply_personalization
from modules.barcode            import fetch_product
from modules.places             import search_nearby_restaurants, search_restaurants_by_city, geocode_city
from modules.menu               import get_menu_for_restaurant
from modules.cart               import create_cart, add_to_cart, get_cart_meal_dict
from modules.order              import process_order
from modules.tracking           import (
    calculate_daily_totals,
    get_goal_targets,
    generate_recommendation,
    calculate_streak,
    calculate_weekly_summary,
)

# ── Supabase auth + database ───────────────────────────────────────────────────
from modules.auth import register_user, login_user, get_current_user, refresh_user_token
from modules.db   import (
    save_profile_db, get_profile_db,
    add_meal_db, get_meals_today_db, delete_meal_db,
    clear_meals_today_db, get_meals_week_db,
    save_order_db, get_orders_db,
    get_streak_db, update_streak_db,
    get_or_create_provider_db, add_menu_item_db, update_menu_item_db,
    delete_menu_item_db, get_provider_menu_db, browse_menu_items_db,
    set_menu_item_status_db,
    create_plan_db, get_provider_plans_db, add_plan_meal_db, get_plan_meals_db,
    browse_plans_db, subscribe_to_plan_db, get_my_subscription_db,
    advance_subscription_day_db, update_subscription_status_db,
    update_plan_db, delete_plan_db, plan_belongs_to_provider_db,
    get_my_week_meals_db, get_swap_options_db, swap_meal_db,
    set_provider_location_db, get_nearby_providers_db,
)

# ── Load nutrition DB on startup ───────────────────────────────────────────────
load_nutrition_data()

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title="FoodMood API", version="2.0.0")

# ── Security ───────────────────────────────────────────────────────────────────
security = HTTPBearer(auto_error=False)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://foodmood-iota.vercel.app",
        "https://foodmood-git-main-atharva-lawales-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex="https://.*\.vercel\.app",
)

# ─────────────────────────────────────────────────────────────────────────────
# UNIT → GRAM CONVERSION
# ─────────────────────────────────────────────────────────────────────────────
UNIT_TO_GRAMS = {
    "serving":  None,
    "piece":    None,
    "g":        1.0,
    "ml":       1.0,
    "cup":      240.0,
    "bowl":     250.0,
    "tbsp":     15.0,
    "tsp":      5.0,
}


# ─────────────────────────────────────────────────────────────────────────────
# HELPER — get user_id from token
# ─────────────────────────────────────────────────────────────────────────────
def get_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[str]:
    if not credentials:
        print("⚠️  No token — demo mode")
        return None
    try:
        print(f"🔑 Token received: {credentials.credentials[:30]}...")
        user = get_current_user(credentials.credentials)
        print(f"✅ User verified: {user.id}")
        return user.id
    except Exception as e:
        print(f"❌ Token failed: {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN — verification review
# Set ADMIN_USER_IDS in your environment (comma-separated Supabase user ids)
# to whichever account(s) should be able to bump a menu item's tier.
# ─────────────────────────────────────────────────────────────────────────────
ADMIN_USER_IDS = [u.strip() for u in os.getenv("ADMIN_USER_IDS", "").split(",") if u.strip()]

def is_admin(user_id: Optional[str]) -> bool:
    return bool(user_id) and user_id in ADMIN_USER_IDS


# ─────────────────────────────────────────────────────────────────────────────
# IN-MEMORY FALLBACK — demo users only
# ─────────────────────────────────────────────────────────────────────────────
demo_log     = []
demo_orders  = []
demo_profile = {}
demo_streak  = 0


# ─────────────────────────────────────────────────────────────────────────────
# PYDANTIC MODELS
# ─────────────────────────────────────────────────────────────────────────────
class TextInput(BaseModel):
    text: str

class LogEntry(BaseModel):
    food_name: str
    quantity:  float
    unit:      str   = "g"
    meal_type: str   = "lunch"
    meal_time: str   = "lunch"
    calories:  float = 0
    protein:   float = 0
    carbs:     float = 0
    fat:       float = 0
    sugar:     float = 0
    sodium:    float = 0
    fiber:     float = 0

class ProfileInput(BaseModel):
    name:           str   = ""
    gender:         str   = "Male"
    age:            int   = 25
    weight_kg:      float = 70
    height_cm:      float = 170
    activity_level: str   = "Moderately Active (exercise 3-5 days)"
    goal:           str   = "maintenance"
    diet_type:      str   = "No restriction"
    allergies:      str   = ""
    calGoal:        int   = 2000
    tdee:           int   = 2000
    bmi:            float = 22.0

class MenuItemInput(BaseModel):
    name:          str
    description:   str          = ""
    price:         float        = 0
    calories:      float
    protein:       float        = 0
    carbs:         float        = 0
    fat:           float        = 0
    fiber:         float        = 0
    sugar:         float        = 0
    sodium:        float        = 0
    serving_grams: float        = 100
    veg:           bool         = False
    tags:          list[str]    = []

class PlanInput(BaseModel):
    name:           str
    description:    str   = ""
    meals_per_week: int   = 7
    price_per_week: float = 0
    currency:       str   = "INR"
    target_goal:    str   = "maintain"
    diet_type:      str   = "No restriction"

class PlanMealInput(BaseModel):
    menu_item_id: str
    day_number:   int
    meal_slot:    str

class OrderInput(BaseModel):
    restaurant_id:    Optional[str] = None
    restaurant_name:  str
    items:            list
    total:            float
    user_name:        str  = ""
    phone:            str  = ""
    delivery_address: str  = ""
    use_stripe:       bool = False

class RegisterInput(BaseModel):
    email:    str
    password: str
    name:     Optional[str] = ""

class LoginInput(BaseModel):
    email:    str
    password: str

class RefreshInput(BaseModel):
    refresh_token: str

class FoodCalculateInput(BaseModel):
    food_key: str
    quantity: float = 1.0
    unit:     str   = "serving"


# ─────────────────────────────────────────────────────────────────────────────
# HELPER — food category label
# ─────────────────────────────────────────────────────────────────────────────
def _get_food_category(food_key: str) -> str:
    categories = {
        "rice|biryani|pulao|khichdi|poha":              "Rice & Grains",
        "chapati|roti|naan|paratha|puri|bread|pav":     "Indian Bread",
        "dal|rajma|chhole|sambar|moong":                "Dal & Legumes",
        "egg":                                           "Eggs",
        "chicken|mutton|fish":                           "Meat & Fish",
        "paneer|tofu":                                   "Protein",
        "milk|curd|lassi|raita|cheese|butter|ghee":     "Dairy",
        "idli|dosa|upma|uttapam":                        "South Indian",
        "samosa|pakora|vada|dhokla|chips":              "Snacks",
        "banana|apple|mango|orange|grapes|watermelon":  "Fruits",
        "almonds|peanuts|cashews|walnuts":              "Nuts",
        "chai|coffee|juice":                             "Drinks",
        "burger|pizza|maggi|sandwich":                  "Fast Food",
        "gulab|rasgulla|kheer|ladoo|halwa|chocolate":   "Sweets",
        "oats|cornflakes":                               "Breakfast",
        "salad|cucumber|tomato|spinach|broccoli":       "Vegetables",
    }
    for pattern, category in categories.items():
        for keyword in pattern.split("|"):
            if keyword in food_key:
                return category
    return "Food"


# ─────────────────────────────────────────────────────────────────────────────
# ROOT
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "🍱 FoodMood API v2.0 is running!", "version": "2.0.0"}


# ─────────────────────────────────────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/auth/register")
def register(data: RegisterInput):
    return register_user(
        email=data.email,
        password=data.password,
        name=data.name or data.email.split("@")[0]
    )

@app.post("/auth/login")
def login(data: LoginInput):
    return login_user(email=data.email, password=data.password)

@app.post("/auth/refresh")
def refresh_token(data: RefreshInput):
    return refresh_user_token(data.refresh_token)

@app.get("/auth/me")
def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Please login first.")
    user = get_current_user(credentials.credentials)
    return {"user_id": user.id, "email": user.email}


# ─────────────────────────────────────────────────────────────────────────────
# FOOD SEARCH
# Layer order — next layer only fires if previous returns 0 results:
#   1. Local DB  (alias + exact + contains + fuzzy) — instant, free
#   2. USDA      — only for Western foods, only if local = 0
#   3. FatSecret — only if local + USDA = 0
#   4. Groq AI   — absolute last resort, only if everything above = 0
#                  result cached so same food never hits Groq twice
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/foods/search")
def search_foods(q: str):
    query     = q.strip().lower()
    query_key = query.replace(" ", "_")

    if len(query) < 3:
        return {"results": []}

    results   = []
    seen_keys = set()

    def make_result(food_key, nutrition, name_override=None, category_override=None):
        if food_key in seen_keys:
            return None
        seen_keys.add(food_key)
        food_display    = name_override or food_key.replace("_", " ").title()
        serving_grams   = VERIFIED_PORTIONS.get(food_key, 100)
        cal_per_serving = round(nutrition["calories_100g"] * serving_grams / 100)
        return {
            "key":                  food_key,
            "name":                 food_display,
            "calories_per_serving": cal_per_serving,
            "calories_per_100g":    nutrition["calories_100g"],
            "protein_per_100g":     nutrition.get("protein", 0),
            "carbs_per_100g":       nutrition.get("carbs",   0),
            "fat_per_100g":         nutrition.get("fat",     0),
            "category":             category_override or _get_food_category(food_key),
        }

    # ── LAYER 1: Local DB ─────────────────────────────────────────────────────
    from modules.nutrition import FOOD_ALIAS_MAP

    # 1a: Alias map — exact alias ("anda" → "egg_boiled")
    alias_key = FOOD_ALIAS_MAP.get(query)
    if alias_key and alias_key in NUTRITION_DB:
        r = make_result(alias_key, NUTRITION_DB[alias_key])
        if r:
            results.append(r)
            print(f"✅ [L1/alias] '{query}' → '{alias_key}'")

    # 1b: Partial alias matches ("chicken breast" matches "boneless chicken breast")
    for alias, target in FOOD_ALIAS_MAP.items():
        if query in alias or alias in query:
            if target in NUTRITION_DB and target not in seen_keys:
                r = make_result(target, NUTRITION_DB[target])
                if r:
                    results.append(r)

    # 1c: Exact key match
    for candidate in [query, query_key]:
        if candidate in NUTRITION_DB and candidate not in seen_keys:
            r = make_result(candidate, NUTRITION_DB[candidate])
            if r:
                results.append(r)
                print(f"✅ [L1/exact] '{candidate}'")

    # 1d: Contains match — all query words must appear in food name
    query_words = query.split()
    for food_key, nutrition in NUTRITION_DB.items():
        if food_key in seen_keys:
            continue
        food_display = food_key.replace("_", " ")
        if all(w in food_display for w in query_words):
            r = make_result(food_key, nutrition)
            if r:
                results.append(r)

    # 1e: Reverse contains — food name words all appear in query
    if len(results) < 5:
        for food_key, nutrition in NUTRITION_DB.items():
            if food_key in seen_keys:
                continue
            food_words = food_key.replace("_", " ").split()
            if len(food_words) >= 2 and all(w in query for w in food_words):
                r = make_result(food_key, nutrition)
                if r:
                    results.append(r)

    # 1f: Fuzzy match — only if < 3 results, 80% char similarity
    if len(results) < 3:
        for food_key, nutrition in NUTRITION_DB.items():
            if food_key in seen_keys:
                continue
            food_display = food_key.replace("_", " ")
            matched = False
            for qword in query_words:
                if len(qword) < 4:
                    continue
                for fword in food_display.split():
                    if len(fword) < 4:
                        continue
                    min_len = min(len(qword), len(fword))
                    matches = sum(1 for a, b in zip(qword[:min_len], fword[:min_len]) if a == b)
                    if matches / max(len(qword), len(fword)) >= 0.80:
                        matched = True
                        break
                if matched:
                    break
            if matched:
                r = make_result(food_key, nutrition)
                if r:
                    results.append(r)

    if results:
        print(f"✅ [L1/local] '{query}' → {len(results)} results — skipping all APIs")

    # ── LAYER 2: USDA — only if local = 0 AND Western food ───────────────────
    USDA_OK_KEYWORDS = [
        "pasta", "bread", "cheese", "milk", "yogurt", "cream",
        "chicken", "beef", "pork", "turkey", "salmon", "tuna", "cod", "shrimp",
        "apple", "orange", "banana", "grape", "strawberry", "blueberry",
        "oat", "cereal", "cornflake", "waffle", "pancake", "bagel",
        "pizza", "burger", "hotdog", "sandwich", "fries",
        "chocolate", "cookie", "cake", "ice cream", "donut",
        "coffee", "juice", "soda", "beer", "wine",
        "almond", "walnut", "cashew", "peanut",
    ]

    if len(results) == 0 and any(k in query for k in USDA_OK_KEYWORDS):
        try:
            from modules.usda import get_usda_nutrition
            usda_result = get_usda_nutrition(query)
            if usda_result and query_key not in seen_keys:
                seen_keys.add(query_key)
                serving_grams   = VERIFIED_PORTIONS.get(query_key, 100)
                cal_per_serving = round(usda_result["calories_100g"] * serving_grams / 100)
                results.append({
                    "key":                  query_key,
                    "name":                 query.title(),
                    "calories_per_serving": cal_per_serving,
                    "calories_per_100g":    usda_result["calories_100g"],
                    "protein_per_100g":     usda_result.get("protein", 0),
                    "carbs_per_100g":       usda_result.get("carbs",   0),
                    "fat_per_100g":         usda_result.get("fat",     0),
                    "category":             "USDA",
                })
                print(f"✅ [L2/USDA] '{query}' → 1 result")
        except Exception as e:
            print(f"⚠️  USDA failed: {e}")

    # ── LAYER 3: Open Food Facts — packaged/branded foods ────────────────────
    # Covers: MuscleBlaze, Amul, Britannia, MTR, Haldirams, ON, MyProtein etc.
    # Free, no API key, no rate limits, strong India coverage
    # Only called if local DB + USDA found nothing
    if len(results) == 0:
        try:
            from modules.openfoodfacts import search_openfoodfacts, is_available as off_ok
            if off_ok():
                off_results = search_openfoodfacts(query, max_results=5)
                for off in off_results:
                    off_key = off["key"]
                    if off_key not in seen_keys:
                        seen_keys.add(off_key)
                        serving_grams = off.get("serving_grams", 100)

                        # Cache in NUTRITION_DB — next search is instant (Layer 1)
                        if off_key not in NUTRITION_DB:
                            NUTRITION_DB[off_key] = {
                                "calories_100g": off["calories_100g"],
                                "protein":       off.get("protein", 0),
                                "carbs":         off.get("carbs",   0),
                                "fat":           off.get("fat",     0),
                                "fiber":         off.get("fiber",   0),
                                "sugar":         off.get("sugar",   0),
                                "sodium":        off.get("sodium",  0),
                                "source":        "openfoodfacts",
                            }
                        # Cache serving size
                        from modules.calorie_calculator import VERIFIED_PORTIONS
                        if off_key not in VERIFIED_PORTIONS:
                            VERIFIED_PORTIONS[off_key] = serving_grams

                        cal_per_serving = round(off["calories_100g"] * serving_grams / 100)
                        results.append({
                            "key":                  off_key,
                            "name":                 off["name"],
                            "calories_per_serving": cal_per_serving,
                            "calories_per_100g":    off["calories_100g"],
                            "protein_per_100g":     off.get("protein", 0),
                            "carbs_per_100g":       off.get("carbs",   0),
                            "fat_per_100g":         off.get("fat",     0),
                            "category":             "Packaged",
                        })
                if off_results:
                    print(f"✅ [L3/OpenFoodFacts] '{query}' → {len(off_results)} results (cached)")
        except Exception as e:
            print(f"⚠️  OpenFoodFacts search error: {e}")

    # ── LAYER 4: Gemini AI — only if everything above = 0 ────────────────────
    # Gemini is already integrated for image detection — reuse same key
    # Uses strict ICMR/USDA prompt — no guessing, verified values only
    # Result cached in NUTRITION_DB so same food never hits Gemini twice
    if len(results) == 0:
        # Translate regional/Hindi name before sending to Gemini
        # e.g. "kairi" → "raw mango", "anda" → "egg boiled"
        from modules.nutrition import FOOD_ALIAS_MAP
        gemini_query = query
        alias = FOOD_ALIAS_MAP.get(query)
        if alias:
            gemini_query = alias.replace("_", " ")
        print(f"🔮 [L4/Gemini] '{query}' not in DB — asking Gemini (as '{gemini_query}')")
        try:
            from modules.gemini_nutrition import get_gemini_nutrition, is_available as gemini_ok
            if gemini_ok():
                nutrition = get_gemini_nutrition(gemini_query)
                if nutrition:
                    serving_grams = nutrition.pop("_serving_grams", 100)
                    category      = nutrition.pop("_category", "Food")
                    food_name     = nutrition.pop("_food_name", query.title())

                    # Cache under BOTH the query key and normalised food name key
                    # so /foods/calculate can always find it
                    # NEVER overwrite existing local DB entries — local always wins
                    food_name_key = food_name.lower().replace(" ", "_")
                    if query_key not in NUTRITION_DB:
                        NUTRITION_DB[query_key] = nutrition
                    if food_name_key not in NUTRITION_DB:
                        NUTRITION_DB[food_name_key] = nutrition
                    # Also add to VERIFIED_PORTIONS so serving size is correct
                    from modules.calorie_calculator import VERIFIED_PORTIONS
                    VERIFIED_PORTIONS[query_key]     = serving_grams
                    VERIFIED_PORTIONS[food_name_key] = serving_grams

                    cal_per_serving = round(nutrition["calories_100g"] * serving_grams / 100)
                    results.append({
                        "key":                  query_key,
                        "name":                 food_name,
                        "calories_per_serving": cal_per_serving,
                        "calories_per_100g":    nutrition["calories_100g"],
                        "protein_per_100g":     nutrition.get("protein", 0),
                        "carbs_per_100g":       nutrition.get("carbs",   0),
                        "fat_per_100g":         nutrition.get("fat",     0),
                        "category":             category + " ✨",
                    })
                    print(f"✅ [L4/Gemini] '{query}' → {nutrition['calories_100g']} kcal — cached as '{query_key}' + '{food_name_key}'")
                else:
                    print(f"⚠️  [L4/Gemini] '{query}' unknown food — no result")
        except Exception as e:
            print(f"⚠️  Gemini nutrition fallback failed: {e}")

    # ── Sort by relevance ─────────────────────────────────────────────────────
    results.sort(key=lambda x: (
        0 if x["key"] == query_key else
        1 if x["key"].startswith(query_key) else
        2 if query_key in x["key"] else
        3 if any(w in x["key"] for w in query.split()) else
        4
    ))

    return {"results": results[:20]}


# ─────────────────────────────────────────────────────────────────────────────
# FOOD CALCULATE
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/foods/calculate")
def calculate_food_nutrition(data: FoodCalculateInput):
    food_key = data.food_key.lower().strip().replace(" ", "_")
    quantity = float(data.quantity) if data.quantity > 0 else 1.0
    unit     = data.unit.lower().strip()

    print(f"🔍 calculate: food_key='{food_key}' quantity={quantity} unit='{unit}'")

    # Check in order: FALLBACK → local DB → in-memory NUTRITION_DB (Gemini cache) → USDA
    # Local DB always wins — never let Gemini cache overwrite verified data
    nutrition = FALLBACK_NUTRITION.get(food_key) or get_food_nutrition(food_key)

    if not nutrition:
        # Check NUTRITION_DB — but only for Gemini-cached foods (source=gemini_verified)
        # Skip if it looks like wrong data (e.g. high protein for a fruit)
        cached = NUTRITION_DB.get(food_key)
        if cached and cached.get("source") == "gemini_verified":
            nutrition = cached
            print(f"✅ Found '{food_key}' in Gemini cache")
        elif cached and cached.get("source") not in ("groq_ai", "gemini_verified"):
            # It's from local DB layers — safe to use
            nutrition = cached
            print(f"✅ Found '{food_key}' in NUTRITION_DB (local)")

    if not nutrition:
        try:
            from modules.usda import get_usda_nutrition
            nutrition = get_usda_nutrition(food_key.replace("_", " "))
        except:
            pass

    if not nutrition:
        # Last resort — try Gemini directly from calculate endpoint
        try:
            from modules.gemini_nutrition import get_gemini_nutrition, is_available as gemini_ok
            if gemini_ok():
                nutrition = get_gemini_nutrition(food_key.replace("_", " "))
                if nutrition:
                    # Strip internal fields
                    nutrition.pop("_serving_grams", None)
                    nutrition.pop("_category", None)
                    nutrition.pop("_food_name", None)
                    NUTRITION_DB[food_key] = nutrition
                    print(f"✅ Gemini fetched nutrition for '{food_key}' from calculate endpoint")
        except Exception as e:
            print(f"⚠️  Gemini fallback in calculate failed: {e}")

    if not nutrition:
        raise HTTPException(
            status_code=404,
            detail=f"Food '{food_key}' not found. Try searching for a different name."
        )

    if unit in ("serving", "piece"):
        grams_per_unit = VERIFIED_PORTIONS.get(food_key, None)
        if grams_per_unit is None:
            base = food_key.split("_")[0]
            for k, v in VERIFIED_PORTIONS.items():
                if k == food_key or k.startswith(base + "_") or k == base:
                    grams_per_unit = v
                    print(f"✅ Matched VERIFIED_PORTIONS: '{food_key}' → '{k}' = {v}g")
                    break
        if grams_per_unit is None:
            print(f"⚠️  '{food_key}' not in VERIFIED_PORTIONS — using 100g fallback")
            grams_per_unit = 100
    elif unit in ("g", "ml"):
        grams_per_unit = 1.0
    else:
        grams_per_unit = UNIT_TO_GRAMS.get(unit, 100)

    total_grams = grams_per_unit * quantity
    factor      = total_grams / 100

    return {
        "food_key": food_key,
        "grams":    round(total_grams, 1),
        "quantity": quantity,
        "unit":     unit,
        "calories": round(nutrition["calories_100g"]  * factor, 1),
        "protein":  round(nutrition.get("protein", 0) * factor, 1),
        "carbs":    round(nutrition.get("carbs",   0) * factor, 1),
        "fat":      round(nutrition.get("fat",     0) * factor, 1),
        "fiber":    round(nutrition.get("fiber",   0) * factor, 1),
        "sugar":    round(nutrition.get("sugar",   0) * factor, 1),
        "sodium":   round(nutrition.get("sodium",  0) * factor, 1),
    }


# ─────────────────────────────────────────────────────────────────────────────
# PROFILE
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/profile")
def save_profile(
    profile: ProfileInput,
    user_id: Optional[str] = Depends(get_user_id)
):
    global demo_profile
    profile_dict = profile.dict()
    if user_id:
        result = save_profile_db(user_id, profile_dict)
        if result.get("error"):
            # Previously this was returned as a normal 200 response, so the
            # frontend had no way to know the save actually failed.
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    else:
        demo_profile = profile_dict
        return {"message": "Profile saved! (demo mode)"}

@app.get("/profile")
def get_profile(user_id: Optional[str] = Depends(get_user_id)):
    if user_id:
        return get_profile_db(user_id)
    return demo_profile or {}


# ─────────────────────────────────────────────────────────────────────────────
# PROVIDER MENU (backs ProviderDashboard.jsx)
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/provider/menu")
def get_my_menu(user_id: Optional[str] = Depends(get_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    provider = get_or_create_provider_db(user_id)
    if not provider:
        raise HTTPException(status_code=500, detail="Could not load provider account.")
    return get_provider_menu_db(provider["id"])


@app.post("/provider/menu")
def add_my_menu_item(item: MenuItemInput, user_id: Optional[str] = Depends(get_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    provider = get_or_create_provider_db(user_id)
    if not provider:
        raise HTTPException(status_code=500, detail="Could not load provider account.")

    result = add_menu_item_db(provider["id"], item.dict())
    if result.get("error"):
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@app.put("/provider/menu/{item_id}")
def update_my_menu_item(item_id: str, item: MenuItemInput, user_id: Optional[str] = Depends(get_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    provider = get_or_create_provider_db(user_id)
    if not provider:
        raise HTTPException(status_code=500, detail="Could not load provider account.")

    result = update_menu_item_db(item_id, provider["id"], item.dict())
    if result.get("error"):
        status_code = 404 if result["error"] == "not_found" else 500
        raise HTTPException(status_code=status_code, detail=result["message"])
    return result


@app.delete("/provider/menu/{item_id}")
def delete_my_menu_item(item_id: str, user_id: Optional[str] = Depends(get_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    provider = get_or_create_provider_db(user_id)
    if not provider:
        raise HTTPException(status_code=500, detail="Could not load provider account.")

    return delete_menu_item_db(item_id, provider["id"])


class ProviderLocationInput(BaseModel):
    address: str

@app.put("/provider/location")
def set_provider_location(body: ProviderLocationInput, user_id: Optional[str] = Depends(get_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    provider = get_or_create_provider_db(user_id)
    if not provider:
        raise HTTPException(status_code=500, detail="Could not load provider account.")

    lat, lng = geocode_city(body.address)
    if lat is None or lng is None:
        raise HTTPException(status_code=400, detail="Couldn't find that address. Try being more specific (include city).")

    result = set_provider_location_db(provider["id"], body.address, lat, lng)
    if result.get("error"):
        raise HTTPException(status_code=500, detail=result["message"])
    return result


@app.get("/providers/nearby")
def providers_nearby(lat: float, lng: float, radius_km: float = 10):
    """
    Public — real, verified FoodMood providers near a location, each with
    their actual menu items. This is what bridges restaurant search with
    the provider marketplace, instead of TomTom results only ever showing
    a generic placeholder menu.
    """
    return get_nearby_providers_db(lat, lng, radius_km)


@app.get("/menu/browse")
def browse_menu(status: Optional[str] = None, tag: Optional[str] = None, veg: Optional[bool] = None):
    """
    Public — lets the app show 'healthy near me' / verified-only / diet-tag
    filtered menu items across all providers.
    """
    return browse_menu_items_db(status=status, tag=tag, veg=veg)


VALID_STATUSES = {"unverified", "calculated", "verified", "premium"}

class StatusUpdate(BaseModel):
    status: str

@app.get("/admin/check")
def admin_check(user_id: Optional[str] = Depends(get_user_id)):
    return {"is_admin": is_admin(user_id)}


@app.put("/admin/menu/{item_id}/status")
def admin_set_menu_status(item_id: str, body: StatusUpdate, user_id: Optional[str] = Depends(get_user_id)):
    if not is_admin(user_id):
        raise HTTPException(status_code=403, detail="Admin access required.")
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"status must be one of {sorted(VALID_STATUSES)}")

    result = set_menu_item_status_db(item_id, body.status)
    if result.get("error"):
        status_code = 404 if result["error"] == "not_found" else 500
        raise HTTPException(status_code=status_code, detail=result["message"])
    return result


# ─────────────────────────────────────────────────────────────────────────────
# SUBSCRIPTION PLANS — provider side
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/provider/plans")
def create_plan(plan: PlanInput, user_id: Optional[str] = Depends(get_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    provider = get_or_create_provider_db(user_id)
    if not provider:
        raise HTTPException(status_code=500, detail="Could not load provider account.")

    result = create_plan_db(provider["id"], plan.dict())
    if result.get("error"):
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@app.get("/provider/plans")
def get_my_plans(user_id: Optional[str] = Depends(get_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    provider = get_or_create_provider_db(user_id)
    if not provider:
        raise HTTPException(status_code=500, detail="Could not load provider account.")
    return get_provider_plans_db(provider["id"])


@app.put("/provider/plans/{plan_id}")
def edit_my_plan(plan_id: str, plan: PlanInput, user_id: Optional[str] = Depends(get_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    provider = get_or_create_provider_db(user_id)
    if not provider:
        raise HTTPException(status_code=500, detail="Could not load provider account.")

    result = update_plan_db(plan_id, provider["id"], plan.dict())
    if result.get("error"):
        status_code = 404 if result["error"] == "not_found" else 500
        raise HTTPException(status_code=status_code, detail=result["message"])
    return result


@app.delete("/provider/plans/{plan_id}")
def remove_my_plan(plan_id: str, user_id: Optional[str] = Depends(get_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    provider = get_or_create_provider_db(user_id)
    if not provider:
        raise HTTPException(status_code=500, detail="Could not load provider account.")
    return delete_plan_db(plan_id, provider["id"])


@app.post("/provider/plans/{plan_id}/meals")
def add_plan_meal(plan_id: str, meal: PlanMealInput, user_id: Optional[str] = Depends(get_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    provider = get_or_create_provider_db(user_id)
    if not provider:
        raise HTTPException(status_code=500, detail="Could not load provider account.")

    result = add_plan_meal_db(plan_id, provider["id"], meal.menu_item_id, meal.day_number, meal.meal_slot)
    if result.get("error"):
        status_code = 404 if result["error"] == "not_found" else 500
        raise HTTPException(status_code=status_code, detail=result["message"])
    return result


@app.get("/provider/plans/{plan_id}/meals")
def get_plan_schedule(plan_id: str, user_id: Optional[str] = Depends(get_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    provider = get_or_create_provider_db(user_id)
    if not provider:
        raise HTTPException(status_code=500, detail="Could not load provider account.")
    if not plan_belongs_to_provider_db(plan_id, provider["id"]):
        raise HTTPException(status_code=404, detail="Plan not found or not yours.")
    return get_plan_meals_db(plan_id)


# ─────────────────────────────────────────────────────────────────────────────
# SUBSCRIPTION PLANS — user side
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/plans/browse")
def browse_plans(target_goal: Optional[str] = None, diet_type: Optional[str] = None):
    return browse_plans_db(target_goal=target_goal, diet_type=diet_type)


@app.get("/plans/{plan_id}/meals")
def get_plan_schedule_public(plan_id: str):
    """Public — lets a user preview a plan's weekly menu before subscribing."""
    return get_plan_meals_db(plan_id)


@app.post("/plans/{plan_id}/subscribe")
def subscribe_to_plan(plan_id: str, user_id: Optional[str] = Depends(get_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    result = subscribe_to_plan_db(user_id, plan_id)
    if result.get("error"):
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@app.get("/my-subscription")
def my_subscription(user_id: Optional[str] = Depends(get_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    sub = get_my_subscription_db(user_id)
    if not sub:
        return {"active": False}
    return {"active": True, **sub}


@app.post("/my-subscription/advance-day")
def advance_subscription(user_id: Optional[str] = Depends(get_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    result = advance_subscription_day_db(user_id)
    if result.get("error"):
        status_code = 404 if result["error"] == "not_found" else 500
        raise HTTPException(status_code=status_code, detail=result["message"])
    return result


@app.post("/my-subscription/pause")
def pause_subscription(user_id: Optional[str] = Depends(get_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    return update_subscription_status_db(user_id, "paused")


@app.post("/my-subscription/resume")
def resume_subscription(user_id: Optional[str] = Depends(get_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    return update_subscription_status_db(user_id, "active", from_status="paused")


class SwapInput(BaseModel):
    day_number: int
    meal_slot: str
    menu_item_id: str

@app.get("/my-subscription/week")
def my_week_meals(user_id: Optional[str] = Depends(get_user_id)):
    """Full 7-day schedule with this user's personal swaps applied."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    result = get_my_week_meals_db(user_id)
    if result is None:
        raise HTTPException(status_code=404, detail="No active subscription.")
    return result


@app.get("/my-subscription/swap-options")
def swap_options(day_number: int, meal_slot: str, user_id: Optional[str] = Depends(get_user_id)):
    """AI-ranked alternatives for one scheduled slot — same provider, diet/allergy-safe, closest calorie match first."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    result = get_swap_options_db(user_id, day_number, meal_slot)
    if isinstance(result, dict) and result.get("error"):
        raise HTTPException(status_code=404, detail=result["message"])
    return result


@app.post("/my-subscription/swap")
def swap_meal(body: SwapInput, user_id: Optional[str] = Depends(get_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    result = swap_meal_db(user_id, body.day_number, body.meal_slot, body.menu_item_id)
    if result.get("error"):
        status_code = 409 if result["error"] == "conflict" else 404 if result["error"] == "not_found" else 500
        raise HTTPException(status_code=status_code, detail=result["message"])
    return result


@app.post("/my-subscription/cancel")
def cancel_subscription(user_id: Optional[str] = Depends(get_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required.")
    return update_subscription_status_db(user_id, "cancelled")


# ─────────────────────────────────────────────────────────────────────────────
# IMAGE ANALYSIS
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/analyze-image")
async def analyze_image(
    file: UploadFile = File(...),
    user_id: Optional[str] = Depends(get_user_id)
):
    suffix = os.path.splitext(file.filename)[1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        foods = predict_food(tmp_path)
        if not foods:
            raise HTTPException(status_code=422, detail="No food detected in image.")

        portions = estimate_portion(foods)
        meal     = calculate_meal_totals(portions)
        score, category, breakdown = compute_meal_health_score(meal)

        profile   = get_profile_db(user_id) if user_id else demo_profile
        goal      = profile.get("goal", "maintenance")
        diet_type = profile.get("diet_type", "No restriction")
        allergies = profile.get("allergies", [])
        if isinstance(allergies, str):
            allergies = [a.strip() for a in allergies.split(",") if a.strip()]

        warnings, modifier = apply_personalization(meal, goal=goal, allergies=allergies, diet_type=diet_type)
        final_score = min(max(round(score + modifier, 1), 0), 100)

        return {
            "food_name":           foods[0]["food"] if foods else "Mixed meal",
            "foods_detected":      foods,
            "total_calories":      meal.get("total_calories", 0),
            "total_protein":       meal.get("total_protein",  0),
            "total_carbs":         meal.get("total_carbs",    0),
            "total_fat":           meal.get("total_fat",      0),
            "total_sugar":         meal.get("total_sugar",    0),
            "total_sodium":        meal.get("total_sodium",   0),
            "total_fiber":         meal.get("total_fiber",    0),
            "health_score":        final_score,
            "score_category":      category,
            "warnings":            warnings,
            "skipped_foods":       meal.get("skipped_foods", []),
            "verification_status": "calculated",
        }
    finally:
        os.remove(tmp_path)


# ─────────────────────────────────────────────────────────────────────────────
# TEXT ANALYSIS
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/analyze-text")
def analyze_text(
    data: TextInput,
    user_id: Optional[str] = Depends(get_user_id)
):
    if not data.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    foods = extract_food_items(data.text)
    if not foods:
        raise HTTPException(status_code=422, detail="No food items detected.")

    portions = estimate_portion(foods)
    meal     = calculate_meal_totals(portions)
    score, category, breakdown = compute_meal_health_score(meal)

    profile   = get_profile_db(user_id) if user_id else demo_profile
    goal      = profile.get("goal", "maintenance")
    diet_type = profile.get("diet_type", "No restriction")
    allergies = profile.get("allergies", [])
    if isinstance(allergies, str):
        allergies = [a.strip() for a in allergies.split(",") if a.strip()]

    warnings, modifier = apply_personalization(meal, goal=goal, allergies=allergies, diet_type=diet_type)
    final_score = min(max(round(score + modifier, 1), 0), 100)

    return {
        "food_name":           data.text[:50],
        "foods_detected":      foods,
        "total_calories":      meal.get("total_calories", 0),
        "total_protein":       meal.get("total_protein",  0),
        "total_carbs":         meal.get("total_carbs",    0),
        "total_fat":           meal.get("total_fat",      0),
        "total_sugar":         meal.get("total_sugar",    0),
        "total_sodium":        meal.get("total_sodium",   0),
        "total_fiber":         meal.get("total_fiber",    0),
        "health_score":        final_score,
        "score_category":      category,
        "warnings":            warnings,
        "skipped_foods":       meal.get("skipped_foods", []),
        "verification_status": "calculated",
    }


# ─────────────────────────────────────────────────────────────────────────────
# VIDEO ANALYSIS
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/analyze-video")
async def analyze_video(
    file: UploadFile = File(...),
    user_id: Optional[str] = Depends(get_user_id)
):
    try:
        import cv2
    except ImportError:
        raise HTTPException(status_code=500, detail="opencv-python not installed.")

    suffix = os.path.splitext(file.filename)[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        video_path = tmp.name

    try:
        cap         = cv2.VideoCapture(video_path)
        foods_all   = []
        frame_count = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            if frame_count % 60 == 0:
                with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as ffile:
                    frame_path = ffile.name
                cv2.imwrite(frame_path, frame)
                foods = predict_food(frame_path)
                os.remove(frame_path)
                if foods:
                    name = foods[0]["food"]
                    if not any(e["food"] == name for e in foods_all):
                        foods_all.append(foods[0])
            frame_count += 1

        cap.release()

        if not foods_all:
            raise HTTPException(status_code=422, detail="No food detected in video.")

        portions = estimate_portion(foods_all)
        meal     = calculate_meal_totals(portions)
        score, category, _ = compute_meal_health_score(meal)

        profile   = get_profile_db(user_id) if user_id else demo_profile
        goal      = profile.get("goal", "maintenance")
        diet_type = profile.get("diet_type", "No restriction")
        allergies = profile.get("allergies", [])
        if isinstance(allergies, str):
            allergies = [a.strip() for a in allergies.split(",") if a.strip()]

        warnings, modifier = apply_personalization(meal, goal=goal, allergies=allergies, diet_type=diet_type)
        final_score = min(max(round(score + modifier, 1), 0), 100)

        return {
            "food_name":      "Video meal",
            "foods_detected": foods_all,
            "total_calories": meal.get("total_calories", 0),
            "total_protein":  meal.get("total_protein",  0),
            "total_carbs":    meal.get("total_carbs",    0),
            "total_fat":      meal.get("total_fat",      0),
            "health_score":   final_score,
            "score_category": category,
            "warnings":       warnings,
            "skipped_foods":  meal.get("skipped_foods", []),
        }
    finally:
        os.remove(video_path)


# ─────────────────────────────────────────────────────────────────────────────
# BARCODE
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/barcode/{barcode}")
def barcode_lookup(barcode: str):
    """
    Barcode lookup — tries Open Food Facts first (best for Indian products),
    then falls back to existing barcode module.
    Open Food Facts has 3M+ products including all major Indian brands.
    """
    # ── Try Open Food Facts first ─────────────────────────────────────────────
    try:
        from modules.openfoodfacts import get_by_barcode
        off_product = get_by_barcode(barcode)
        if off_product:
            food_key = off_product["key"]
            # Cache in NUTRITION_DB for future searches
            if food_key not in NUTRITION_DB:
                NUTRITION_DB[food_key] = {
                    "calories_100g": off_product["calories_100g"],
                    "protein":       off_product.get("protein", 0),
                    "carbs":         off_product.get("carbs",   0),
                    "fat":           off_product.get("fat",     0),
                    "fiber":         off_product.get("fiber",   0),
                    "sugar":         off_product.get("sugar",   0),
                    "sodium":        off_product.get("sodium",  0),
                    "source":        "openfoodfacts",
                }
            return {
                "food_name":           off_product["name"],
                "food_key":            food_key,
                "total_calories":      off_product["calories_100g"],
                "total_protein":       off_product.get("protein", 0),
                "total_carbs":         off_product.get("carbs",   0),
                "total_fat":           off_product.get("fat",     0),
                "total_sugar":         off_product.get("sugar",   0),
                "total_sodium":        off_product.get("sodium",  0),
                "total_fiber":         off_product.get("fiber",   0),
                "image_url":           off_product.get("image_url", ""),
                "nutriscore":          off_product.get("nutriscore", ""),
                "verification_status": "verified",
                "source":              "Open Food Facts",
            }
    except Exception as e:
        print(f"⚠️  OpenFoodFacts barcode failed: {e}")

    # ── Fallback to existing barcode module ───────────────────────────────────
    product = fetch_product(barcode)
    if "error" in product:
        raise HTTPException(status_code=404, detail=f"Product {barcode} not found. Try scanning an Indian packaged product.")
    return {
        "food_name":           product.get("name",              "Unknown product"),
        "total_calories":      product.get("calories_per_100g",  0),
        "total_protein":       product.get("protein_g",          0),
        "total_carbs":         product.get("carbs_g",            0),
        "total_fat":           product.get("fat_g",              0),
        "total_sugar":         product.get("sugar_g",            0),
        "total_sodium":        product.get("sodium_mg",          0),
        "ingredients":         product.get("ingredients",        ""),
        "allergens":           product.get("allergens",          []),
        "verification_status": "verified",
    }


# ─────────────────────────────────────────────────────────────────────────────
# DAILY LOG
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/log")
def add_log(
    entry: LogEntry,
    user_id: Optional[str] = Depends(get_user_id)
):
    global demo_log, demo_streak

    meal = entry.dict()
    meal["meal_type"] = entry.meal_type or entry.meal_time or "lunch"
    meal["logged_at"] = datetime.now().isoformat()
    meal["date"]      = str(date.today())

    # ── Diet/allergy/goal check — runs no matter how the food was added ──────
    profile   = get_profile_db(user_id) if user_id else demo_profile
    goal      = profile.get("goal", "maintenance")
    diet_type = profile.get("diet_type", "No restriction")
    allergies = profile.get("allergies", [])
    if isinstance(allergies, str):
        allergies = [a.strip() for a in allergies.split(",") if a.strip()]

    meal_for_check = {
        "total_calories": meal.get("calories", 0),
        "total_protein":  meal.get("protein",  0),
        "total_sodium":   meal.get("sodium",   0),
        "total_sugar":    meal.get("sugar",    0),
        "items": [{"food": meal.get("food_name", ""), "ingredients": ""}],
    }
    warnings, _ = apply_personalization(meal_for_check, goal=goal, allergies=allergies, diet_type=diet_type)

    if user_id:
        print(f"💾 Saving meal to Supabase for user {user_id}")
        saved = add_meal_db(user_id, meal)
        update_streak_db(user_id)
        return {"message": "Logged!", "meal": saved, "warnings": warnings}
    else:
        print("💾 Saving meal to memory (demo mode)")
        meal["id"] = len(demo_log) + 1
        demo_log.append(meal)
        demo_streak = min(demo_streak + 1, 99)
        return {"message": "Logged! (demo mode)", "meal": meal, "warnings": warnings}


@app.get("/daily-log")
def get_daily_log(user_id: Optional[str] = Depends(get_user_id)):
    if user_id:
        todays_meals = get_meals_today_db(user_id)
        streak       = get_streak_db(user_id)
        profile      = get_profile_db(user_id)
        goal         = profile.get("goal", "maintenance")
        print(f"📊 Loaded {len(todays_meals)} meals from Supabase")
    else:
        today        = str(date.today())
        todays_meals = [m for m in demo_log if m.get("date") == today]
        streak       = demo_streak
        goal         = demo_profile.get("goal", "maintenance")
        print(f"📊 Loaded {len(todays_meals)} meals from memory (demo)")

    totals = calculate_daily_totals(todays_meals) if todays_meals else {
        "calories": 0, "protein": 0, "carbs": 0,
        "fat": 0, "fiber": 0, "sugar": 0, "sodium": 0,
    }

    recommendation = generate_recommendation(totals, goal) if todays_meals else ""

    health_score = None
    if todays_meals:
        score, _, _ = compute_meal_health_score({
            "total_calories": totals.get("calories", 0),
            "total_protein":  totals.get("protein",  0),
            "total_carbs":    totals.get("carbs",    0),
            "total_fat":      totals.get("fat",      0),
            "total_sugar":    totals.get("sugar",    0),
            "total_sodium":   totals.get("sodium",   0),
            "total_fiber":    totals.get("fiber",    0),
        })
        health_score = round(score, 1)

    weekly = None
    if user_id:
        week_meals = get_meals_week_db(user_id)
        if week_meals:
            from collections import defaultdict
            by_day = defaultdict(list)
            for m in week_meals:
                by_day[m["date"]].append(m)
            weekly_totals = [calculate_daily_totals(meals) for meals in by_day.values()]
            if weekly_totals:
                weekly = calculate_weekly_summary(weekly_totals, goal)

    return {
        "meals":          todays_meals,
        "totals":         totals,
        "streak":         streak,
        "recommendation": recommendation,
        "health_score":   health_score,
        "weekly":         weekly,
    }


@app.delete("/log/{meal_id}")
def delete_log(
    meal_id: str,
    user_id: Optional[str] = Depends(get_user_id)
):
    global demo_log
    if user_id:
        return delete_meal_db(user_id, meal_id)
    else:
        demo_log = [m for m in demo_log if str(m.get("id")) != str(meal_id)]
        return {"message": "Deleted!"}


@app.delete("/daily-log")
def clear_daily_log(user_id: Optional[str] = Depends(get_user_id)):
    global demo_log
    if user_id:
        return clear_meals_today_db(user_id)
    else:
        today    = str(date.today())
        demo_log = [m for m in demo_log if m.get("date") != today]
        return {"message": "Log cleared!"}


# ─────────────────────────────────────────────────────────────────────────────
# RESTAURANTS
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/restaurants")
def get_restaurants(
    city:  Optional[str]   = None,
    lat:   Optional[float] = None,
    lon:   Optional[float] = None,
    limit: int             = 20,
):
    try:
        if city:
            restaurants = search_restaurants_by_city(city, limit=limit)
        elif lat and lon:
            restaurants = search_nearby_restaurants(lat, lon, limit=limit)
        else:
            raise HTTPException(status_code=400, detail="Provide city or lat/lon.")
        return {"restaurants": restaurants}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# MENU
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/menu/{restaurant_id}")
def get_menu(restaurant_id: str, cuisine: str = "Indian"):
    items = get_menu_for_restaurant(cuisine)
    return {"restaurant_id": restaurant_id, "items": items}


# ─────────────────────────────────────────────────────────────────────────────
# ORDER
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/order")
def place_order(
    data: OrderInput,
    user_id: Optional[str] = Depends(get_user_id)
):
    global demo_log, demo_orders

    cart = create_cart()
    cart["restaurant_name"] = data.restaurant_name
    for item in data.items:
        cart = add_to_cart(cart, item)

    order = process_order(
        cart, data.user_name,
        data.delivery_address, data.phone,
        use_stripe=data.use_stripe,
    )

    if "error" in order:
        raise HTTPException(status_code=400, detail=order["error"])

    order_response = {
        "order_id":         order.get("order_id", str(uuid.uuid4())),
        "restaurant":       data.restaurant_name,
        "total_price":      data.total,
        "total_calories":   cart.get("total_calories", 0),
        "delivery_address": data.delivery_address,
        "status":           "confirmed",
        "items":            data.items,
        "message":          "Order placed! Meal logged to diary.",
    }

    meal_entry = get_cart_meal_dict(cart)
    meal_entry["food_name"] = f"Order from {data.restaurant_name}"
    meal_entry["meal_type"] = "order"
    meal_entry["meal_time"] = "order"
    meal_entry["date"]      = str(date.today())
    meal_entry["logged_at"] = datetime.now().isoformat()

    if user_id:
        save_order_db(user_id, order_response)
        add_meal_db(user_id, meal_entry)
        update_streak_db(user_id)
    else:
        demo_orders.append(order_response)
        meal_entry["id"] = len(demo_log) + 1
        demo_log.append(meal_entry)

    return order_response


@app.get("/orders")
def get_orders(user_id: Optional[str] = Depends(get_user_id)):
    if user_id:
        return {"orders": get_orders_db(user_id)}
    return {"orders": demo_orders}


# ─────────────────────────────────────────────────────────────────────────────
# CUSTOM FOODS
# ─────────────────────────────────────────────────────────────────────────────
class CustomFoodInput(BaseModel):
    food_name:     str
    calories_100g: float
    protein:       float = 0
    carbs:         float = 0
    fat:           float = 0
    fiber:         float = 0
    sugar:         float = 0
    sodium:        float = 0
    serving_grams: float = 100
    brand:         str   = ""
    barcode:       str   = ""


@app.post("/foods/custom")
def create_custom_food(
    data: CustomFoodInput,
    user_id: Optional[str] = Depends(get_user_id)
):
    food_key = data.food_name.strip().lower().replace(" ", "_").replace("-", "_")

    NUTRITION_DB[food_key] = {
        "calories_100g": data.calories_100g,
        "protein":       data.protein,
        "carbs":         data.carbs,
        "fat":           data.fat,
        "fiber":         data.fiber,
        "sugar":         data.sugar,
        "sodium":        data.sodium,
        "source":        "user_created",
    }

    from modules.calorie_calculator import VERIFIED_PORTIONS
    VERIFIED_PORTIONS[food_key] = data.serving_grams

    if user_id:
        try:
            from modules.supabase_client import supabase
            supabase.table("custom_foods").insert({
                "user_id":       user_id,
                "food_name":     data.food_name,
                "food_key":      food_key,
                "calories_100g": data.calories_100g,
                "protein":       data.protein,
                "carbs":         data.carbs,
                "fat":           data.fat,
                "fiber":         data.fiber,
                "sugar":         data.sugar,
                "sodium":        data.sodium,
                "serving_grams": data.serving_grams,
                "brand":         data.brand,
                "barcode":       data.barcode,
                "source":        "user_created",
            }).execute()
            print(f"✅ Custom food saved to DB: {data.food_name}")
        except Exception as e:
            print(f"⚠️  Could not save to DB: {e}")

    return {
        "message":              f"'{data.food_name}' added successfully!",
        "food_key":             food_key,
        "food_name":            data.food_name,
        "calories_per_serving": round(data.calories_100g * data.serving_grams / 100),
    }


@app.get("/foods/custom")
def get_custom_foods(user_id: Optional[str] = Depends(get_user_id)):
    if not user_id:
        return {"foods": []}
    try:
        from modules.supabase_client import supabase
        result = supabase.table("custom_foods").select("*").eq("user_id", user_id).execute()
        return {"foods": result.data or []}
    except Exception as e:
        return {"foods": [], "error": str(e)}


@app.on_event("startup")
async def load_custom_foods_on_startup():
    try:
        from modules.supabase_client import supabase
        from modules.calorie_calculator import VERIFIED_PORTIONS
        result = supabase.table("custom_foods").select("*").execute()
        foods  = result.data or []
        for food in foods:
            key = food["food_key"]
            NUTRITION_DB[key] = {
                "calories_100g": food["calories_100g"],
                "protein":       food.get("protein", 0),
                "carbs":         food.get("carbs",   0),
                "fat":           food.get("fat",     0),
                "fiber":         food.get("fiber",   0),
                "sugar":         food.get("sugar",   0),
                "sodium":        food.get("sodium",  0),
                "source":        "user_created",
            }
            VERIFIED_PORTIONS[key] = food.get("serving_grams", 100)
        print(f"✅ Loaded {len(foods)} custom foods from DB")
    except Exception as e:
        print(f"⚠️  Could not load custom foods: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# RUN
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)