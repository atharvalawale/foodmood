from groq import Groq
import json
import os

client = Groq(api_key=os.environ.get("GROQ_API_KEY", "your-groq-key-here"))

def extract_food_items(text: str) -> list:
    """
    Extracts food items, quantities, and units from any natural language text.
    Uses Groq API (free tier: 14,400 req/day) — works for any food, any language, any phrasing.
    """
    if not text or not text.strip():
        return []

    prompt = (
        f"Extract all food items from this text: '{text}'\n"
        "For each food item:\n"
        "- Use lowercase underscored names (e.g. chicken_grilled, egg_boiled, white_rice, dal)\n"
        "- Estimate quantity (number) and unit (piece/bowl/cup/grams/plate)\n"
        "- Estimate grams as best you can\n"
        "- Set confidence 0-100\n"
        "Respond ONLY with valid JSON, no markdown, no extra text:\n"
        '[{"food": "egg_boiled", "quantity": 2, "unit": "piece", "grams": 110, "confidence": 95}]'
    )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # or "llama3-8b-8192" for faster/lighter
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,  # low temp = more consistent JSON output
            max_tokens=1000,
        )

        raw = response.choices[0].message.content.strip().strip("```json").strip("```").strip()

        try:
            items = json.loads(raw)
        except json.JSONDecodeError:
            return []

        for item in items:
            item.setdefault("quantity", 1)
            item.setdefault("unit", "unit")
            item.setdefault("grams", 100)
            item.setdefault("confidence", 80)

        return items

    except Exception as e:
        print(f"Groq API error: {e}")
        return []