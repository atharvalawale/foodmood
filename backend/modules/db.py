# db.py — All database operations for FoodMood

from modules.supabase_client import supabase
from datetime import date, datetime


# ─────────────────────────────────────────────────────────────────────────────
# PROFILE
# ─────────────────────────────────────────────────────────────────────────────

def save_profile_db(user_id: str, profile: dict):
    """
    Saves user profile to Supabase users table.
    Uses consistent field names that match frontend + ProfileInput model.
    """
    try:
        existing = supabase.table("users") \
            .select("id") \
            .eq("id", user_id) \
            .execute()

        # Normalise allergies — always store as plain string
        allergies = profile.get("allergies", "")
        if isinstance(allergies, list):
            allergies = ", ".join(allergies)

        data = {
            "name":           profile.get("name", ""),
            "age":            int(profile.get("age", 25)),
            "weight_kg":      float(profile.get("weight_kg", 70)),
            "height_cm":      float(profile.get("height_cm", 170)),
            "gender":         profile.get("gender", "Male"),
            "goal":           profile.get("goal", "maintenance"),
            "activity_level": profile.get("activity_level", ""),
            "diet_type":      profile.get("diet_type", "No restriction"),
            "allergies":      allergies,
            "calGoal":        int(profile.get("calGoal", 2000)),
            "tdee":           int(profile.get("tdee", 2000)),
            "bmi":            float(profile.get("bmi", 22.0)),
        }

        if existing.data:
            supabase.table("users") \
                .update(data) \
                .eq("id", user_id) \
                .execute()
        else:
            data["id"]    = user_id
            data["email"] = profile.get("email", "")
            supabase.table("users").insert(data).execute()

        print(f"✅ Profile saved for user {user_id}")
        return {"message": "Profile saved!", "data": data}

    except Exception as e:
        print(f"❌ Profile save error: {e}")
        return {"message": "Profile save failed", "error": str(e)}


def get_profile_db(user_id: str):
    """
    Gets user profile from Supabase.
    Returns fields with exact names frontend + backend expect.
    """
    try:
        result = supabase.table("users") \
            .select("*") \
            .eq("id", user_id) \
            .execute()

        if not result.data:
            return {}

        row = result.data[0]

        return {
            "name":           row.get("name", ""),
            "gender":         row.get("gender", "Male"),
            "age":            int(row.get("age") or 25),
            "weight_kg":      float(row.get("weight_kg") or 70),
            "height_cm":      float(row.get("height_cm") or 170),
            "activity_level": row.get("activity_level", "Moderately Active (exercise 3-5 days)"),
            "goal":           row.get("goal", "maintenance"),
            "diet_type":      row.get("diet_type", "No restriction"),
            "allergies":      row.get("allergies", ""),
            "calGoal":        int(row.get("calGoal") or 2000),
            "tdee":           int(row.get("tdee") or 2000),
            "bmi":            float(row.get("bmi") or 22.0),
        }

    except Exception as e:
        print(f"❌ Profile get error: {e}")
        return {}


# ─────────────────────────────────────────────────────────────────────────────
# MEAL LOGS
# ─────────────────────────────────────────────────────────────────────────────

def add_meal_db(user_id: str, meal: dict):
    try:
        data = {
            "user_id":   user_id,
            "food_name": meal.get("food_name", "Unknown"),
            "calories":  float(meal.get("calories", 0)),
            "protein":   float(meal.get("protein", 0)),
            "carbs":     float(meal.get("carbs", 0)),
            "fat":       float(meal.get("fat", 0)),
            "fiber":     float(meal.get("fiber", 0)),
            "sugar":     float(meal.get("sugar", 0)),
            "sodium":    float(meal.get("sodium", 0)),
            "quantity":  float(meal.get("quantity", 1)),
            "unit":      meal.get("unit", "serving"),
            "meal_type": meal.get("meal_type") or meal.get("meal_time", "lunch"),
            "date":      str(date.today()),
        }

        result = supabase.table("meal_logs").insert(data).execute()

        if result.data:
            return _format_meal(result.data[0])
        return meal

    except Exception as e:
        print(f"❌ Meal save error: {e}")
        return meal


def get_meals_today_db(user_id: str):
    try:
        today = str(date.today())
        result = supabase.table("meal_logs") \
            .select("*") \
            .eq("user_id", user_id) \
            .eq("date", today) \
            .order("logged_at", desc=False) \
            .execute()
        return [_format_meal(m) for m in (result.data or [])]
    except Exception as e:
        print(f"❌ Meal get error: {e}")
        return []


def _format_meal(m: dict) -> dict:
    return {
        "id":        m.get("id"),
        "food_name": m.get("food_name", "Meal"),
        "quantity":  float(m.get("quantity") or 1),
        "unit":      m.get("unit", "serving"),
        "meal_time": m.get("meal_type", "lunch"),
        "calories":  float(m.get("calories") or 0),
        "protein":   float(m.get("protein")  or 0),
        "carbs":     float(m.get("carbs")    or 0),
        "fat":       float(m.get("fat")      or 0),
        "fiber":     float(m.get("fiber")    or 0),
        "sugar":     float(m.get("sugar")    or 0),
        "sodium":    float(m.get("sodium")   or 0),
        "logged_at": m.get("logged_at", ""),
        "date":      m.get("date", str(date.today())),
    }


def delete_meal_db(user_id: str, meal_id: str):
    try:
        supabase.table("meal_logs") \
            .delete() \
            .eq("id", meal_id) \
            .eq("user_id", user_id) \
            .execute()
        return {"message": "Deleted!"}
    except Exception as e:
        print(f"❌ Meal delete error: {e}")
        return {"message": "Delete failed"}


def clear_meals_today_db(user_id: str):
    try:
        today = str(date.today())
        supabase.table("meal_logs") \
            .delete() \
            .eq("user_id", user_id) \
            .eq("date", today) \
            .execute()
        return {"message": "Log cleared!"}
    except Exception as e:
        print(f"❌ Clear meals error: {e}")
        return {"message": "Clear failed"}


def get_meals_week_db(user_id: str):
    try:
        from datetime import timedelta
        week_ago = str(date.today() - timedelta(days=7))
        result = supabase.table("meal_logs") \
            .select("*") \
            .eq("user_id", user_id) \
            .gte("date", week_ago) \
            .order("date", desc=False) \
            .execute()
        return [_format_meal(m) for m in (result.data or [])]
    except Exception as e:
        print(f"❌ Weekly meals error: {e}")
        return []


# ─────────────────────────────────────────────────────────────────────────────
# ORDERS
# ─────────────────────────────────────────────────────────────────────────────

def save_order_db(user_id: str, order: dict):
    try:
        data = {
            "user_id":         user_id,
            "restaurant_name": order.get("restaurant", ""),
            "items":           order.get("items", []),
            "total_price":     float(order.get("total_price", 0)),
            "total_calories":  float(order.get("total_calories", 0)),
            "status":          order.get("status", "confirmed"),
        }
        result = supabase.table("orders").insert(data).execute()
        return result.data[0] if result.data else order
    except Exception as e:
        print(f"❌ Order save error: {e}")
        return order


def get_orders_db(user_id: str):
    try:
        result = supabase.table("orders") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .execute()
        return result.data or []
    except Exception as e:
        print(f"❌ Orders get error: {e}")
        return []


# ─────────────────────────────────────────────────────────────────────────────
# STREAKS
# ─────────────────────────────────────────────────────────────────────────────

def get_streak_db(user_id: str):
    try:
        result = supabase.table("streaks") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()
        if result.data:
            return result.data[0].get("current_streak", 0)
        return 0
    except Exception as e:
        print(f"❌ Streak get error: {e}")
        return 0


def update_streak_db(user_id: str):
    try:
        today     = date.today()
        today_str = str(today)

        result = supabase.table("streaks") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()

        if not result.data:
            supabase.table("streaks").insert({
                "user_id":          user_id,
                "current_streak":   1,
                "longest_streak":   1,
                "last_logged_date": today_str,
            }).execute()
            return 1

        streak_row = result.data[0]
        current    = streak_row.get("current_streak", 0)
        longest    = streak_row.get("longest_streak", 0)
        last_date  = streak_row.get("last_logged_date")

        if last_date == today_str:
            return current

        from datetime import timedelta
        yesterday  = str(today - timedelta(days=1))
        new_streak = current + 1 if last_date == yesterday else 1
        new_longest = max(longest, new_streak)

        supabase.table("streaks") \
            .update({
                "current_streak":   new_streak,
                "longest_streak":   new_longest,
                "last_logged_date": today_str,
            }) \
            .eq("user_id", user_id) \
            .execute()

        return new_streak

    except Exception as e:
        print(f"❌ Streak update error: {e}")
        return 0