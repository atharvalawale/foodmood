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
from modules.places             import search_nearby_restaurants, search_restaurants_by_city
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
)

# ── Load nutrition DB on startup ───────────────────────────────────────────────
load_nutrition_data()

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title="FoodMood API", version="2.0.0")

# ── Security ───────────────────────────────────────────────────────────────────
# auto_error=False → if no token, don't crash, just return None
# This lets demo users (no token) still use the app
security = HTTPBearer(auto_error=False)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# UNIT → GRAM CONVERSION
# When user picks "1 cup" or "2 tbsp", this converts to grams
# Used in the new /foods/calculate endpoint
# ─────────────────────────────────────────────────────────────────────────────
UNIT_TO_GRAMS = {
    "serving":  None,    # use VERIFIED_PORTIONS (food-specific)
    "piece":    None,    # use VERIFIED_PORTIONS (food-specific)
    "g":        1.0,     # 1g = 1g (direct)
    "ml":       1.0,     # treat ml same as g for nutrition
    "cup":      240.0,   # 1 cup = 240ml
    "bowl":     250.0,   # 1 bowl = 250g
    "tbsp":     15.0,    # 1 tablespoon = 15g
    "tsp":      5.0,     # 1 teaspoon = 5g
}


# ─────────────────────────────────────────────────────────────────────────────
# HELPER — get user_id from token
# ─────────────────────────────────────────────────────────────────────────────

def get_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[str]:
    """
    Reads user_id from the Bearer token.
    Returns None if no token or bad token (demo user fallback).
    Returns real user_id if token is valid (saves to Supabase).
    """
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
# IN-MEMORY FALLBACK — demo users only
# Real users  → Supabase DB (persists forever)
# Demo users  → these lists (resets on server restart, fine for demo)
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
    meal_type: str   = "lunch"   # breakfast / lunch / dinner / snack
    meal_time: str   = "lunch"   # kept for backwards compatibility
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
# Used in /foods/search results to show subtitle like "Indian Bread"
# ─────────────────────────────────────────────────────────────────────────────

def _get_food_category(food_key: str) -> str:
    """Returns a human-readable category name for a food key."""
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
    """Creates a real account in Supabase Auth."""
    return register_user(
        email=data.email,
        password=data.password,
        name=data.name or data.email.split("@")[0]
    )


@app.post("/auth/login")
def login(data: LoginInput):
    """
    Logs in and returns access_token + refresh_token.
    Frontend saves both — access_token for requests, refresh_token to auto-renew.
    """
    return login_user(email=data.email, password=data.password)


@app.post("/auth/refresh")
def refresh_token(data: RefreshInput):
    """
    Called by client.js when access_token expires (401 error).
    Returns a new access_token without making user log in again.
    Supabase tokens expire every 1 hour — this keeps the session alive silently.
    """
    return refresh_user_token(data.refresh_token)


@app.get("/auth/me")
def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Returns current user info. Requires valid token."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Please login first.")
    user = get_current_user(credentials.credentials)
    return {"user_id": user.id, "email": user.email}


# ─────────────────────────────────────────────────────────────────────────────
# FOOD SEARCH  ← NEW (powers HealthifyMe-style search in Scanner)
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/foods/search")
def search_foods(q: str):
    """
    Searches the nutrition database for foods matching the query.

    Example: GET /foods/search?q=chap
    Returns: chapati, chicken_tikka, etc. with calories per serving

    How it works:
    1. Normalize query ("Pav Bhaji" → "pav bhaji")
    2. Scan all foods in NUTRITION_DB for matches
    3. Also search USDA if local results < 5
    4. Return top 20 matches sorted by relevance
    """
    query = q.strip().lower()

    if len(query) < 2:
        return {"results": []}

    results = []

    # Search through the entire loaded nutrition DB
    for food_key, nutrition in NUTRITION_DB.items():
        # "egg_boiled" → "egg boiled" so "egg" matches both
        food_display = food_key.replace("_", " ")

        if query in food_display or query in food_key:
            # Per-serving calories using verified portion size
            # e.g. chapati = 35g per serving → 297 kcal/100g × 0.35 = 104 kcal
            serving_grams   = VERIFIED_PORTIONS.get(food_key, 100)
            cal_per_serving = round(nutrition["calories_100g"] * serving_grams / 100)

            results.append({
                "key":                  food_key,
                "name":                 food_display.title(),   # "egg boiled" → "Egg Boiled"
                "calories_per_serving": cal_per_serving,
                "calories_per_100g":    nutrition["calories_100g"],
                "protein_per_100g":     nutrition.get("protein", 0),
                "carbs_per_100g":       nutrition.get("carbs",   0),
                "fat_per_100g":         nutrition.get("fat",     0),
                "category":             _get_food_category(food_key),
            })

    # If fewer than 5 local results, also try USDA API
    # This catches foods not in our Indian DB (e.g. exotic items)
    if len(results) < 5:
        try:
            from modules.usda import get_usda_nutrition
            usda_result = get_usda_nutrition(query)
            if usda_result:
                usda_key = query.replace(" ", "_")
                # Only add if not already found locally
                if not any(r["key"] == usda_key for r in results):
                    results.append({
                        "key":                  usda_key,
                        "name":                 query.title(),
                        "calories_per_serving": usda_result["calories_100g"],
                        "calories_per_100g":    usda_result["calories_100g"],
                        "protein_per_100g":     usda_result.get("protein", 0),
                        "carbs_per_100g":       usda_result.get("carbs",   0),
                        "fat_per_100g":         usda_result.get("fat",     0),
                        "category":             "USDA",
                    })
        except Exception as e:
            print(f"⚠️  USDA search failed: {e}")

    # Sort by relevance:
    # 1st — exact match (user typed "chapati", food_key = "chapati")
    # 2nd — starts with query ("chap" → "chapati")
    # 3rd — everything else (contains query somewhere)
    query_key = query.replace(" ", "_")
    results.sort(key=lambda x: (
        0 if x["key"] == query_key else
        1 if x["key"].startswith(query_key) else
        2
    ))

    # Return top 20 — don't overwhelm the user
    return {"results": results[:20]}


@app.post("/foods/calculate")
def calculate_food_nutrition(data: FoodCalculateInput):
    """
    Calculates exact nutrition for a food + quantity + unit.
    Called every time user changes the quantity slider in Scanner.

    Example input:
      { "food_key": "chapati", "quantity": 2, "unit": "serving" }

    Example output:
      { "calories": 208, "protein": 6.3, "carbs": 20.8, "fat": 2.1, ... }

    How grams are calculated:
    - unit = "serving" or "piece" → use VERIFIED_PORTIONS (e.g. chapati = 35g)
    - unit = "g" or "ml"          → quantity IS the grams directly
    - unit = "cup"                 → 240g × quantity
    - unit = "bowl"                → 250g × quantity
    - unit = "tbsp"                → 15g × quantity
    - unit = "tsp"                 → 5g × quantity
    """
    food_key = data.food_key.lower().strip().replace(" ", "_")
    quantity = float(data.quantity) if data.quantity > 0 else 1.0
    unit     = data.unit.lower().strip()

    print(f"🔍 calculate: food_key='{food_key}' quantity={quantity} unit='{unit}'")

    # Step 1: Get nutrition per 100g
    # Check FALLBACK_NUTRITION first (verified values for chai, khari etc.)
    nutrition = FALLBACK_NUTRITION.get(food_key) or get_food_nutrition(food_key)

    if not nutrition:
        # Try USDA as last resort
        try:
            from modules.usda import get_usda_nutrition
            nutrition = get_usda_nutrition(food_key.replace("_", " "))
        except:
            pass

    if not nutrition:
        raise HTTPException(
            status_code=404,
            detail=f"Food '{food_key}' not found. Try searching for a different name."
        )

    # Step 2: Convert unit to grams
    if unit in ("serving", "piece"):
        # Try exact key first, then try common aliases
        # This fixes the bug where "egg_boiled" might come in as "egg boiled" etc.
        grams_per_unit = VERIFIED_PORTIONS.get(food_key, None)

        # If not found directly, try stripping suffix variants
        # e.g. "egg_boiled" not found → try "egg"
        if grams_per_unit is None:
            # Try all keys that START with the food_key base
            base = food_key.split("_")[0]  # "egg_boiled" → "egg"
            for k, v in VERIFIED_PORTIONS.items():
                if k == food_key or k.startswith(base + "_") or k == base:
                    grams_per_unit = v
                    print(f"✅ Matched VERIFIED_PORTIONS: '{food_key}' → '{k}' = {v}g")
                    break

        # Final fallback — use 100g but warn
        if grams_per_unit is None:
            print(f"⚠️  '{food_key}' not in VERIFIED_PORTIONS — using 100g fallback")
            grams_per_unit = 100

    elif unit in ("g", "ml"):
        # Direct: quantity IS the grams
        # e.g. quantity=150, unit="g" → 150g exactly
        grams_per_unit = 1.0
    else:
        # Cup, bowl, tbsp, tsp — use fixed conversion
        grams_per_unit = UNIT_TO_GRAMS.get(unit, 100)

    # Total grams = grams per unit × how many units
    # e.g. 2 servings of chapati = 35 × 2 = 70g
    total_grams = grams_per_unit * quantity

    # factor = how many "100g portions" we have
    # e.g. 70g → factor = 0.7 → multiply all nutrition by 0.7
    factor = total_grams / 100

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
    """Saves profile to Supabase (real users) or memory (demo users)."""
    global demo_profile
    profile_dict = profile.dict()

    if user_id:
        return save_profile_db(user_id, profile_dict)
    else:
        demo_profile = profile_dict
        return {"message": "Profile saved! (demo mode)"}


@app.get("/profile")
def get_profile(user_id: Optional[str] = Depends(get_user_id)):
    """Gets profile from Supabase (real) or memory (demo)."""
    if user_id:
        return get_profile_db(user_id)
    return demo_profile or {}


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
        allergies = profile.get("allergies", [])
        if isinstance(allergies, str):
            allergies = [a.strip() for a in allergies.split(",") if a.strip()]

        warnings, modifier = apply_personalization(meal, goal=goal, allergies=allergies)
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
    allergies = profile.get("allergies", [])
    if isinstance(allergies, str):
        allergies = [a.strip() for a in allergies.split(",") if a.strip()]

    warnings, modifier = apply_personalization(meal, goal=goal, allergies=allergies)
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
async def analyze_video(file: UploadFile = File(...)):
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

        return {
            "food_name":      "Video meal",
            "foods_detected": foods_all,
            "total_calories": meal.get("total_calories", 0),
            "total_protein":  meal.get("total_protein",  0),
            "total_carbs":    meal.get("total_carbs",    0),
            "total_fat":      meal.get("total_fat",      0),
            "health_score":   round(score, 1),
            "skipped_foods":  meal.get("skipped_foods", []),
        }
    finally:
        os.remove(video_path)


# ─────────────────────────────────────────────────────────────────────────────
# BARCODE
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/barcode/{barcode}")
def barcode_lookup(barcode: str):
    product = fetch_product(barcode)
    if "error" in product:
        raise HTTPException(status_code=404, detail=product["error"])

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
    """
    Saves meal to Supabase (real users) or memory (demo users).
    Accepts meal_type (new) or meal_time (old) — both work.
    """
    global demo_log, demo_streak

    meal = entry.dict()
    # Support both meal_type (new Scanner) and meal_time (old Scanner)
    # Always store as meal_type in DB
    meal["meal_type"] = entry.meal_type or entry.meal_time or "lunch"
    meal["logged_at"] = datetime.now().isoformat()
    meal["date"]      = str(date.today())

    if user_id:
        print(f"💾 Saving meal to Supabase for user {user_id}")
        saved = add_meal_db(user_id, meal)
        update_streak_db(user_id)
        return {"message": "Logged!", "meal": saved}
    else:
        print("💾 Saving meal to memory (demo mode)")
        meal["id"] = len(demo_log) + 1
        demo_log.append(meal)
        demo_streak = min(demo_streak + 1, 99)
        return {"message": "Logged! (demo mode)", "meal": meal}


@app.get("/daily-log")
def get_daily_log(user_id: Optional[str] = Depends(get_user_id)):
    """
    Returns today's meals + totals + streak + AI recommendation.
    Real user → reads from Supabase (persists across restarts!)
    Demo user → reads from memory
    """
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
    """Deletes a single meal from Supabase (real) or memory (demo)."""
    global demo_log

    if user_id:
        return delete_meal_db(user_id, meal_id)
    else:
        demo_log = [m for m in demo_log if str(m.get("id")) != str(meal_id)]
        return {"message": "Deleted!"}


@app.delete("/daily-log")
def clear_daily_log(user_id: Optional[str] = Depends(get_user_id)):
    """Clears today's meals from Supabase (real) or memory (demo)."""
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
    """Places order and auto-logs meal to Supabase (real) or memory (demo)."""
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
    """Gets order history from Supabase (real) or memory (demo)."""
    if user_id:
        return {"orders": get_orders_db(user_id)}
    return {"orders": demo_orders}


# ─────────────────────────────────────────────────────────────────────────────
# RUN
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)