import google.generativeai as genai
import base64
import json
from pathlib import Path
import os

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "your-gemini-key-here"))

# ── IMPORTANT: gemini-2.0-flash is BLOCKED in India (limit: 0) ────────────────
# gemini-2.5-flash works in India on free tier
model = genai.GenerativeModel("gemini-2.5-flash")

MEDIA_TYPE_MAP = {
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png":  "image/png",
    ".webp": "image/webp",
}


def predict_food(image_path: str) -> list:
    """
    Analyzes a food image using Gemini Vision.
    Returns a list of detected food items with quantities and confidence.

    Uses gemini-2.5-flash — the only model that works in India free tier.
    """
    path        = Path(image_path)
    image_bytes = path.read_bytes()
    b64         = base64.standard_b64encode(image_bytes).decode("utf-8")
    media_type  = MEDIA_TYPE_MAP.get(path.suffix.lower(), "image/jpeg")

    prompt = (
        "Identify every food item visible in this image. "
        "For each item estimate the portion size in grams. "
        "Use lowercase underscored names (e.g. chicken_grilled, egg_boiled, white_rice). "
        "Respond ONLY with valid JSON, no markdown, no extra text:\n"
        '[{"food": "rice", "quantity": 1, "unit": "bowl", "grams": 150, "confidence": 90, "low_confidence": false}]'
    )

    try:
        response = model.generate_content([
            {"mime_type": media_type, "data": b64},
            prompt
        ])

        raw = response.text.strip().strip("```json").strip("```").strip()

        items = json.loads(raw)

    except json.JSONDecodeError:
        return []

    except Exception as e:
        print(f"Gemini image error: {e}")
        return []

    for item in items:
        item.setdefault("quantity",       1)
        item.setdefault("unit",           "unit")
        item.setdefault("grams",          100)
        item.setdefault("confidence",     80)
        item["low_confidence"] = item.get("confidence", 80) < 60

    return items