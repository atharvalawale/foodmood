# ─────────────────────────────────────────────
# tracking.py — Daily nutrition tracking + AI recommendations
# ─────────────────────────────────────────────

import os
import json
from datetime import datetime, timedelta
from groq import Groq   # Using Groq instead of Gemini (free, 14400 req/day, works in India!)

# Configure Groq
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))

# ── GOAL TARGETS ───────────────────────────────────────────────────────────────
GOAL_TARGETS = {
    "weight_loss": {
        "calories": 1600,
        "protein":  120,
        "carbs":    150,
        "fat":       50,
        "fiber":     25,
        "sugar":     25,
        "sodium":  2000,
    },
    "muscle_gain": {
        "calories": 2800,
        "protein":  180,
        "carbs":    350,
        "fat":       80,
        "fiber":     30,
        "sugar":     40,
        "sodium":  2300,
    },
    "maintenance": {
        "calories": 2000,
        "protein":  100,
        "carbs":    250,
        "fat":       65,
        "fiber":     25,
        "sugar":     30,
        "sodium":  2300,
    }
}


# ── FUNCTION 1: Calculate Daily Totals ─────────────────────────────────────────

def calculate_daily_totals(daily_log: list) -> dict:
    """
    Adds up all nutrition from all meals logged today.

    IMPORTANT FIX:
    Meals from Supabase DB use keys: "calories", "protein", "carbs", "fat"
    Meals from old in-memory use keys: "total_calories", "total_protein" etc.
    This function handles BOTH formats so nothing breaks.
    """
    totals = {
        "calories": 0,
        "protein":  0,
        "carbs":    0,
        "fat":      0,
        "fiber":    0,
        "sugar":    0,
        "sodium":   0,
    }

    for meal in daily_log:
        # Try both key formats — DB format first, then old format as fallback
        # DB format:  "calories", "protein", "carbs", "fat"
        # Old format: "total_calories", "total_protein", "total_carbs", "total_fat"
        totals["calories"] += meal.get("calories", 0) or meal.get("total_calories", 0)
        totals["protein"]  += meal.get("protein",  0) or meal.get("total_protein",  0)
        totals["carbs"]    += meal.get("carbs",    0) or meal.get("total_carbs",    0)
        totals["fat"]      += meal.get("fat",      0) or meal.get("total_fat",      0)
        totals["fiber"]    += meal.get("fiber",    0) or meal.get("total_fiber",    0)
        totals["sugar"]    += meal.get("sugar",    0) or meal.get("total_sugar",    0)
        totals["sodium"]   += meal.get("sodium",   0) or meal.get("total_sodium",   0)

    return {k: round(v, 1) for k, v in totals.items()}


# ── FUNCTION 2: Get Goal Targets ───────────────────────────────────────────────

def get_goal_targets(goal: str) -> dict:
    """Returns daily nutrition targets for a given goal."""
    return GOAL_TARGETS.get(goal, GOAL_TARGETS["maintenance"])


# ── FUNCTION 3: Calculate Progress ─────────────────────────────────────────────

def calculate_progress(daily_totals: dict, goal: str) -> dict:
    """Compares daily totals against targets and calculates progress %."""
    targets  = get_goal_targets(goal)
    progress = {}

    for nutrient, target in targets.items():
        actual = daily_totals.get(nutrient, 0)
        if target > 0:
            percentage = round((actual / target) * 100, 1)
        else:
            percentage = 0

        progress[nutrient] = {
            "actual":     actual,
            "target":     target,
            "percentage": min(percentage, 100),
            "remaining":  max(round(target - actual, 1), 0),
            "exceeded":   actual > target
        }

    return progress


# ── FUNCTION 4: AI Recommendation (Groq) ──────────────────────────────────────

def generate_recommendation(daily_totals: dict, goal: str) -> str:
    """
    Uses Groq AI to generate personalized nutrition recommendations.
    Groq is free, 14400 req/day, works in India — much better than Gemini!
    """
    targets  = get_goal_targets(goal)

    prompt = f"""You are a professional nutritionist AI assistant.

User's goal: {goal.replace('_', ' ')}

Today's nutrition so far:
- Calories: {daily_totals.get('calories', 0)} / {targets['calories']} kcal
- Protein:  {daily_totals.get('protein',  0)}g / {targets['protein']}g
- Carbs:    {daily_totals.get('carbs',    0)}g / {targets['carbs']}g
- Fat:      {daily_totals.get('fat',      0)}g / {targets['fat']}g
- Fiber:    {daily_totals.get('fiber',    0)}g / {targets['fiber']}g
- Sugar:    {daily_totals.get('sugar',    0)}g / {targets['sugar']}g
- Sodium:   {daily_totals.get('sodium',   0)}mg / {targets['sodium']}mg

Give a SHORT and SPECIFIC recommendation (2-3 sentences max).
Focus on what the user should eat NEXT to meet their goals.
Be encouraging and practical.
Suggest specific Indian foods where possible.
Do NOT repeat the numbers back — just give actionable advice."""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"Groq recommendation error: {e}")
        return generate_basic_recommendation(daily_totals, targets)


# ── FUNCTION 5: Basic Recommendation (Fallback) ────────────────────────────────

def generate_basic_recommendation(daily_totals: dict, targets: dict) -> str:
    """Simple rule-based recommendation — used as fallback if Groq fails."""
    calories_remaining = targets["calories"] - daily_totals.get("calories", 0)
    protein_remaining  = targets["protein"]  - daily_totals.get("protein",  0)

    if calories_remaining > 500:
        return f"You still have {round(calories_remaining)} calories remaining today. Consider a balanced meal with protein and vegetables."
    elif calories_remaining > 200:
        return f"You're close to your calorie goal! Just {round(calories_remaining)} calories remaining. A light snack would be perfect."
    elif calories_remaining < 0:
        return f"You've exceeded your calorie target by {round(abs(calories_remaining))} calories. Focus on light, protein-rich foods for the rest of the day."
    elif protein_remaining > 20:
        return f"You've hit your calorie goal but still need {round(protein_remaining)}g more protein. Try eggs, dal, or paneer."
    else:
        return "Great job! You're on track with your nutrition goals today. Keep it up!"


# ── FUNCTION 6: Streak Tracker ─────────────────────────────────────────────────

def calculate_streak(streak_log: list) -> dict:
    """Calculates how many days in a row user hit their calorie goal."""
    if not streak_log:
        return {"current_streak": 0, "longest_streak": 0}

    current_streak = 0
    for day in reversed(streak_log):
        if day:
            current_streak += 1
        else:
            break

    longest_streak = 0
    current_count  = 0
    for day in streak_log:
        if day:
            current_count += 1
            longest_streak = max(longest_streak, current_count)
        else:
            current_count = 0

    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "streak_emoji":   "🔥" * min(current_streak, 5)
    }


# ── FUNCTION 7: Weekly Summary ─────────────────────────────────────────────────

def calculate_weekly_summary(weekly_logs: list, goal: str) -> dict:
    """Calculates average daily nutrition over the past 7 days."""
    if not weekly_logs:
        return {}

    targets = get_goal_targets(goal)
    totals  = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
    days_goal_hit = 0

    for day in weekly_logs:
        for nutrient in totals:
            totals[nutrient] += day.get(nutrient, 0)

        calorie_target = targets["calories"]
        calorie_actual = day.get("calories", 0)
        tolerance      = calorie_target * 0.10

        if abs(calorie_actual - calorie_target) <= tolerance:
            days_goal_hit += 1

    days     = len(weekly_logs)
    averages = {k: round(v / days, 1) for k, v in totals.items()}

    return {
        "averages":      averages,
        "days_goal_hit": days_goal_hit,
        "days_total":    days,
        "consistency":   f"{round((days_goal_hit / days) * 100)}%"
    }