# db.py — All database operations for FoodMood

from modules.supabase_client import supabase
from datetime import date, datetime
from modules.personalization import DIET_RESTRICTIONS


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

        # The Supabase "allergies" column is an array type — it must be sent
        # as a real list, not a joined string (a plain "" string caused
        # Postgres error 22P02: malformed array literal).
        allergies_in = profile.get("allergies", [])
        if isinstance(allergies_in, str):
            allergies = [a.strip() for a in allergies_in.split(",") if a.strip()]
        else:
            allergies = [a.strip() for a in allergies_in if a and str(a).strip()]

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
            "allergies":      row.get("allergies") or [],
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


# ─────────────────────────────────────────────────────────────────────────────
# PROVIDERS & MENU ITEMS
# ─────────────────────────────────────────────────────────────────────────────

def get_or_create_provider_db(owner_id: str, name: str = "My Restaurant", cuisine: str = "indian"):
    """
    Each provider account has exactly one providers row, found by owner_id.
    Creates one on first use.
    """
    try:
        existing = supabase.table("providers") \
            .select("*") \
            .eq("owner_id", owner_id) \
            .execute()

        if existing.data:
            return existing.data[0]

        created = supabase.table("providers").insert({
            "owner_id": owner_id,
            "name":     name,
            "cuisine":  cuisine,
        }).execute()
        return created.data[0]

    except Exception as e:
        print(f"❌ Provider get/create error: {e}")
        return None


def add_menu_item_db(provider_id: str, item: dict):
    try:
        data = {
            "provider_id":   provider_id,
            "name":          item.get("name", ""),
            "description":   item.get("description", ""),
            "price":         float(item.get("price", 0) or 0),
            "calories":      float(item.get("calories", 0) or 0),
            "protein":       float(item.get("protein", 0) or 0),
            "carbs":         float(item.get("carbs", 0) or 0),
            "fat":           float(item.get("fat", 0) or 0),
            "fiber":         float(item.get("fiber", 0) or 0),
            "sugar":         float(item.get("sugar", 0) or 0),
            "sodium":        float(item.get("sodium", 0) or 0),
            "serving_grams": float(item.get("serving_grams", 100) or 100),
            "veg":           bool(item.get("veg", False)),
            "tags":          item.get("tags", []) or [],
            # New items always start unverified/self-reported — bumping to
            # 'verified'/'premium' is a separate reviewer-only action.
            "status":        "unverified",
        }
        result = supabase.table("menu_items").insert(data).execute()
        return {"message": "Menu item added!", "data": result.data[0]}

    except Exception as e:
        print(f"❌ Menu item add error: {e}")
        return {"message": "Menu item add failed", "error": str(e)}


def update_menu_item_db(item_id: str, provider_id: str, updates: dict):
    """
    Providers can edit their own items' details, but never their own
    verification status — that field is dropped here on purpose.
    """
    try:
        updates = dict(updates)
        updates.pop("status", None)
        updates.pop("provider_id", None)

        result = supabase.table("menu_items") \
            .update(updates) \
            .eq("id", item_id) \
            .eq("provider_id", provider_id) \
            .execute()

        if not result.data:
            return {"message": "Menu item not found or not yours", "error": "not_found"}
        return {"message": "Menu item updated!", "data": result.data[0]}

    except Exception as e:
        print(f"❌ Menu item update error: {e}")
        return {"message": "Menu item update failed", "error": str(e)}


def delete_menu_item_db(item_id: str, provider_id: str):
    try:
        supabase.table("menu_items") \
            .delete() \
            .eq("id", item_id) \
            .eq("provider_id", provider_id) \
            .execute()
        return {"message": "Menu item deleted!"}
    except Exception as e:
        print(f"❌ Menu item delete error: {e}")
        return {"message": "Menu item delete failed", "error": str(e)}


def get_provider_menu_db(provider_id: str):
    try:
        result = supabase.table("menu_items") \
            .select("*") \
            .eq("provider_id", provider_id) \
            .order("created_at", desc=True) \
            .execute()
        return result.data or []
    except Exception as e:
        print(f"❌ Provider menu get error: {e}")
        return []


def browse_menu_items_db(status: str = None, tag: str = None, veg: bool = None):
    """
    Public browse endpoint backing — filter by verification tier,
    a single diet tag, and/or vegetarian-only.
    """
    try:
        query = supabase.table("menu_items").select("*")
        if status:
            query = query.eq("status", status)
        if veg is not None:
            query = query.eq("veg", veg)
        result = query.order("created_at", desc=True).execute()
        items = result.data or []

        if tag:
            items = [i for i in items if tag.lower() in [t.lower() for t in (i.get("tags") or [])]]

        return items
    except Exception as e:
        print(f"❌ Menu browse error: {e}")
        return []


def set_menu_item_status_db(item_id: str, status: str):
    """
    Admin-only action (checked in main.py before this is called) — bumps
    or resets a menu item's verification tier. Unlike update_menu_item_db,
    this is NOT restricted to the item's own provider on purpose.
    """
    try:
        result = supabase.table("menu_items") \
            .update({"status": status}) \
            .eq("id", item_id) \
            .execute()
        if not result.data:
            return {"message": "Menu item not found", "error": "not_found"}
        return {"message": f"Status updated to {status}", "data": result.data[0]}
    except Exception as e:
        print(f"❌ Menu status update error: {e}")
        return {"message": "Status update failed", "error": str(e)}


# ─────────────────────────────────────────────────────────────────────────────
# SUBSCRIPTION MEAL PLANS
# ─────────────────────────────────────────────────────────────────────────────

def create_plan_db(provider_id: str, plan: dict):
    try:
        data = {
            "provider_id":    provider_id,
            "name":           plan.get("name", ""),
            "description":    plan.get("description", ""),
            "meals_per_week": int(plan.get("meals_per_week", 7) or 7),
            "price_per_week": float(plan.get("price_per_week", 0) or 0),
            "currency":       plan.get("currency", "INR"),
            "target_goal":    plan.get("target_goal", "maintain"),
            "diet_type":      plan.get("diet_type", "No restriction"),
        }
        result = supabase.table("subscription_plans").insert(data).execute()
        return {"message": "Plan created!", "data": result.data[0]}
    except Exception as e:
        print(f"❌ Plan create error: {e}")
        return {"message": "Plan create failed", "error": str(e)}


def update_plan_db(plan_id: str, provider_id: str, plan: dict):
    """
    Only updates a plan that belongs to this provider — same ownership
    guard as update_menu_item_db.
    """
    try:
        data = {
            "name":           plan.get("name", ""),
            "description":    plan.get("description", ""),
            "meals_per_week": int(plan.get("meals_per_week", 7) or 7),
            "price_per_week": float(plan.get("price_per_week", 0) or 0),
            "currency":       plan.get("currency", "INR"),
            "target_goal":    plan.get("target_goal", "maintain"),
            "diet_type":      plan.get("diet_type", "No restriction"),
        }
        result = supabase.table("subscription_plans") \
            .update(data) \
            .eq("id", plan_id) \
            .eq("provider_id", provider_id) \
            .execute()
        if not result.data:
            return {"message": "Plan not found or not yours", "error": "not_found"}
        return {"message": "Plan updated!", "data": result.data[0]}
    except Exception as e:
        print(f"❌ Plan update error: {e}")
        return {"message": "Plan update failed", "error": str(e)}


def delete_plan_db(plan_id: str, provider_id: str):
    try:
        supabase.table("subscription_plans") \
            .delete() \
            .eq("id", plan_id) \
            .eq("provider_id", provider_id) \
            .execute()
        return {"message": "Plan deleted!"}
    except Exception as e:
        print(f"❌ Plan delete error: {e}")
        return {"message": "Plan delete failed", "error": str(e)}


def get_provider_plans_db(provider_id: str):
    try:
        result = supabase.table("subscription_plans") \
            .select("*") \
            .eq("provider_id", provider_id) \
            .order("created_at", desc=True) \
            .execute()
        return result.data or []
    except Exception as e:
        print(f"❌ Provider plans get error: {e}")
        return []


def plan_belongs_to_provider_db(plan_id: str, provider_id: str) -> bool:
    try:
        rows = supabase.table("subscription_plans").select("provider_id").eq("id", plan_id).execute().data
        return bool(rows) and rows[0]["provider_id"] == provider_id
    except Exception as e:
        print(f"❌ Plan ownership check error: {e}")
        return False


def add_plan_meal_db(plan_id: str, provider_id: str, menu_item_id: str, day_number: int, meal_slot: str):
    try:
        # The plan must belong to this provider...
        if not plan_belongs_to_provider_db(plan_id, provider_id):
            return {"message": "Plan not found or not yours", "error": "not_found"}

        # ...and so must the menu item being scheduled into it — otherwise
        # any provider could add someone else's dish to their own plan.
        item_rows = supabase.table("menu_items").select("provider_id").eq("id", menu_item_id).execute().data
        if not item_rows or item_rows[0]["provider_id"] != provider_id:
            return {"message": "Menu item not found or not yours", "error": "not_found"}

        data = {
            "plan_id":      plan_id,
            "menu_item_id": menu_item_id,
            "day_number":   day_number,
            "meal_slot":    meal_slot,
        }
        result = supabase.table("subscription_plan_meals").insert(data).execute()
        return {"message": "Meal added to plan!", "data": result.data[0]}
    except Exception as e:
        print(f"❌ Plan meal add error: {e}")
        return {"message": "Plan meal add failed", "error": str(e)}


def get_plan_meals_db(plan_id: str):
    """
    Returns the plan's weekly schedule with the actual menu_item nutrition
    data joined in, not just the raw links.
    """
    try:
        links = supabase.table("subscription_plan_meals") \
            .select("*") \
            .eq("plan_id", plan_id) \
            .order("day_number") \
            .execute().data or []

        if not links:
            return []

        item_ids = list({l["menu_item_id"] for l in links})
        items = supabase.table("menu_items").select("*").in_("id", item_ids).execute().data or []
        items_by_id = {i["id"]: i for i in items}

        return [
            {**link, "menu_item": items_by_id.get(link["menu_item_id"])}
            for link in links
        ]
    except Exception as e:
        print(f"❌ Plan meals get error: {e}")
        return []


def browse_plans_db(target_goal: str = None, diet_type: str = None):
    try:
        query = supabase.table("subscription_plans").select("*").eq("is_active", True)
        if target_goal:
            query = query.eq("target_goal", target_goal)
        if diet_type:
            query = query.eq("diet_type", diet_type)
        result = query.order("created_at", desc=True).execute()
        return result.data or []
    except Exception as e:
        print(f"❌ Plan browse error: {e}")
        return []


def subscribe_to_plan_db(user_id: str, plan_id: str):
    try:
        # Cancel any existing active OR paused subscription first — one at a time.
        supabase.table("user_subscriptions") \
            .update({"status": "cancelled"}) \
            .eq("user_id", user_id) \
            .in_("status", ["active", "paused"]) \
            .execute()

        data = {"user_id": user_id, "plan_id": plan_id, "status": "active", "current_day_number": 1}
        result = supabase.table("user_subscriptions").insert(data).execute()
        return {"message": "Subscribed!", "data": result.data[0]}
    except Exception as e:
        print(f"❌ Subscribe error: {e}")
        return {"message": "Subscribe failed", "error": str(e)}


def get_my_subscription_db(user_id: str):
    """
    Returns the user's current subscription (active OR paused — cancelled
    ones are excluded) plus today's scheduled meals (today = current_day_number
    in the plan's weekly cycle).
    """
    try:
        sub_result = supabase.table("user_subscriptions") \
            .select("*") \
            .eq("user_id", user_id) \
            .in_("status", ["active", "paused"]) \
            .execute()

        if not sub_result.data:
            return None

        sub = sub_result.data[0]
        today_links = supabase.table("subscription_plan_meals") \
            .select("*") \
            .eq("plan_id", sub["plan_id"]) \
            .eq("day_number", sub["current_day_number"]) \
            .execute().data or []

        item_ids = list({l["menu_item_id"] for l in today_links})
        items = {}
        if item_ids:
            rows = supabase.table("menu_items").select("*").in_("id", item_ids).execute().data or []
            items = {r["id"]: r for r in rows}

        today_meals = [
            {**link, "menu_item": items.get(link["menu_item_id"])}
            for link in today_links
        ]

        plan = supabase.table("subscription_plans").select("*").eq("id", sub["plan_id"]).execute().data
        sub["plan"] = plan[0] if plan else None
        sub["today_meals"] = today_meals
        return sub

    except Exception as e:
        print(f"❌ Get subscription error: {e}")
        return None


def advance_subscription_day_db(user_id: str):
    try:
        sub = supabase.table("user_subscriptions") \
            .select("*").eq("user_id", user_id).eq("status", "active").execute().data
        if not sub:
            return {"message": "No active subscription", "error": "not_found"}

        sub = sub[0]
        plan = supabase.table("subscription_plans").select("meals_per_week").eq("id", sub["plan_id"]).execute().data[0]
        cycle_len = plan.get("meals_per_week", 7) or 7

        next_day = (sub["current_day_number"] % cycle_len) + 1
        result = supabase.table("user_subscriptions") \
            .update({"current_day_number": next_day}) \
            .eq("id", sub["id"]) \
            .execute()
        return {"message": "Advanced to next day!", "data": result.data[0]}
    except Exception as e:
        print(f"❌ Advance day error: {e}")
        return {"message": "Advance failed", "error": str(e)}


def update_subscription_status_db(user_id: str, status: str, from_status: str = "active"):
    """
    from_status is the status the row must currently have to be updated —
    e.g. pause/cancel look for 'active', resume looks for 'paused'.
    """
    try:
        result = supabase.table("user_subscriptions") \
            .update({"status": status}) \
            .eq("user_id", user_id) \
            .eq("status", from_status) \
            .execute()
        if not result.data:
            return {"message": f"No {from_status} subscription found", "error": "not_found"}
        return {"message": f"Subscription {status}!", "data": result.data[0]}
    except Exception as e:
        print(f"❌ Subscription status update error: {e}")
        return {"message": "Update failed", "error": str(e)}

# ─────────────────────────────────────────────────────────────────────────────
# MEAL SWAPS
# Swaps are per-user overrides layered on top of a plan's shared template —
# they never modify subscription_plan_meals itself, so one person's swap
# never affects anyone else subscribed to the same plan.
# ─────────────────────────────────────────────────────────────────────────────

def _violates_diet(item: dict, diet_type: str) -> bool:
    """Same keyword-matching approach as personalization.py's meal check."""
    if not diet_type:
        return False
    restricted = DIET_RESTRICTIONS.get(diet_type.strip().lower())
    if not restricted:
        return False
    text = f"{item.get('name','')} {item.get('description','')}".lower()
    return any(keyword in text for keyword in restricted)


def _violates_allergy(item: dict, allergies) -> bool:
    if not allergies:
        return False
    text = f"{item.get('name','')} {item.get('description','')}".lower()
    for a in allergies:
        if not a:
            continue
        a = a.lower().strip()
        # Handle simple singular/plural mismatches (e.g. "peanuts" vs "peanut sauce")
        a_variants = {a, a.rstrip("s"), a + "s"}
        if any(v in text for v in a_variants if v):
            return True
    return False


def get_my_week_meals_db(user_id: str):
    """
    Returns the user's full 7-day schedule for their active/paused plan,
    WITH any personal swaps applied on top of the shared template.
    Each entry is tagged is_swapped so the UI can show that clearly.
    """
    try:
        sub_result = supabase.table("user_subscriptions") \
            .select("*").eq("user_id", user_id).in_("status", ["active", "paused"]).execute()
        if not sub_result.data:
            return None
        sub = sub_result.data[0]

        links = supabase.table("subscription_plan_meals") \
            .select("*").eq("plan_id", sub["plan_id"]).order("day_number").execute().data or []

        overrides = supabase.table("subscription_meal_overrides") \
            .select("*").eq("user_subscription_id", sub["id"]).execute().data or []
        override_map = {(o["day_number"], o["meal_slot"]): o["menu_item_id"] for o in overrides}

        item_ids = {l["menu_item_id"] for l in links} | set(override_map.values())
        items = {}
        if item_ids:
            rows = supabase.table("menu_items").select("*").in_("id", list(item_ids)).execute().data or []
            items = {r["id"]: r for r in rows}

        result = []
        for link in links:
            key = (link["day_number"], link["meal_slot"])
            swapped_item_id = override_map.get(key)
            actual_item_id = swapped_item_id or link["menu_item_id"]
            result.append({
                "day_number":  link["day_number"],
                "meal_slot":   link["meal_slot"],
                "menu_item":   items.get(actual_item_id),
                "is_swapped":  swapped_item_id is not None,
            })
        return result
    except Exception as e:
        print(f"❌ Week meals get error: {e}")
        return None


def get_swap_options_db(user_id: str, day_number: int, meal_slot: str):
    """
    Ranked swap candidates for one slot: same provider as the plan, diet/
    allergy-safe for this user, sorted with verified items and closer
    calorie match to the original first.
    """
    try:
        sub_result = supabase.table("user_subscriptions") \
            .select("*").eq("user_id", user_id).in_("status", ["active", "paused"]).execute()
        if not sub_result.data:
            return {"error": "not_found", "message": "No active subscription."}
        sub = sub_result.data[0]

        plan_rows = supabase.table("subscription_plans").select("*").eq("id", sub["plan_id"]).execute().data
        if not plan_rows:
            return {"error": "not_found", "message": "Plan not found."}
        plan = plan_rows[0]

        # Find what's currently scheduled in this slot (for calorie-closeness ranking)
        current_link = supabase.table("subscription_plan_meals") \
            .select("*").eq("plan_id", sub["plan_id"]) \
            .eq("day_number", day_number).eq("meal_slot", meal_slot).execute().data
        current_calories = 0
        current_item_id = None
        if current_link:
            current_item_id = current_link[0]["menu_item_id"]
            item_rows = supabase.table("menu_items").select("calories").eq("id", current_item_id).execute().data
            if item_rows:
                current_calories = item_rows[0]["calories"] or 0

        profile = get_profile_db(user_id) or {}
        diet_type = profile.get("diet_type", "No restriction")
        allergies = profile.get("allergies", [])
        if isinstance(allergies, str):
            allergies = [a.strip() for a in allergies.split(",") if a.strip()]

        candidates = supabase.table("menu_items") \
            .select("*").eq("provider_id", plan["provider_id"]).execute().data or []

        options = []
        for item in candidates:
            if item["id"] == current_item_id:
                continue
            if _violates_diet(item, diet_type) or _violates_allergy(item, allergies):
                continue  # never suggest something that conflicts with their diet/allergies
            options.append(item)

        # Rank: verified/premium first, then closest calorie match to what it's replacing
        def rank_key(item):
            tier_rank = {"premium": 0, "verified": 1, "calculated": 2, "unverified": 3}.get(item.get("status"), 4)
            calorie_gap = abs((item.get("calories") or 0) - current_calories)
            return (tier_rank, calorie_gap)

        options.sort(key=rank_key)
        return options[:10]
    except Exception as e:
        print(f"❌ Swap options error: {e}")
        return {"error": "failed", "message": str(e)}


def swap_meal_db(user_id: str, day_number: int, meal_slot: str, menu_item_id: str):
    try:
        sub_result = supabase.table("user_subscriptions") \
            .select("*").eq("user_id", user_id).in_("status", ["active", "paused"]).execute()
        if not sub_result.data:
            return {"message": "No active subscription", "error": "not_found"}
        sub = sub_result.data[0]

        # Refuse anything that violates diet/allergy — a manual override
        # shouldn't be able to bypass the same safety check swap-options uses.
        item_rows = supabase.table("menu_items").select("*").eq("id", menu_item_id).execute().data
        if not item_rows:
            return {"message": "Menu item not found", "error": "not_found"}
        item = item_rows[0]

        profile = get_profile_db(user_id) or {}
        diet_type = profile.get("diet_type", "No restriction")
        allergies = profile.get("allergies", [])
        if isinstance(allergies, str):
            allergies = [a.strip() for a in allergies.split(",") if a.strip()]
        if _violates_diet(item, diet_type) or _violates_allergy(item, allergies):
            return {"message": "That item conflicts with your diet/allergy settings", "error": "conflict"}

        # Upsert — one override per (subscription, day, slot)
        existing = supabase.table("subscription_meal_overrides") \
            .select("id") \
            .eq("user_subscription_id", sub["id"]) \
            .eq("day_number", day_number).eq("meal_slot", meal_slot).execute().data

        if existing:
            result = supabase.table("subscription_meal_overrides") \
                .update({"menu_item_id": menu_item_id}) \
                .eq("id", existing[0]["id"]).execute()
        else:
            result = supabase.table("subscription_meal_overrides").insert({
                "user_subscription_id": sub["id"],
                "day_number": day_number,
                "meal_slot": meal_slot,
                "menu_item_id": menu_item_id,
            }).execute()

        return {"message": "Meal swapped!", "data": result.data[0] if result.data else None}
    except Exception as e:
        print(f"❌ Swap meal error: {e}")
        return {"message": "Swap failed", "error": str(e)}