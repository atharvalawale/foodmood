import csv
from pathlib import Path

BASE_DIR    = Path(__file__).parent.parent
DEFAULT_CSV = BASE_DIR / "data" / "nutrition.csv"

NUTRITION_DB = {}

# ── Alias map — common name variants + Hindi names ────────────────────────────
# Format: "what user types" → "key in INDIAN_FOODS_DB"
FOOD_ALIAS_MAP = {
    # ── Eggs ──────────────────────────────────────────────────────────────────
    "egg":                      "egg_boiled",
    "eggs":                     "egg_boiled",
    "boiled egg":               "egg_boiled",
    "boiled eggs":              "egg_boiled",
    "anda":                     "egg_boiled",
    "ande":                     "egg_boiled",
    "ubla anda":                "egg_boiled",
    "fried egg":                "egg_fried",
    "egg bhurji":               "egg_bhurji",
    "bhurji":                   "egg_bhurji",
    "anda bhurji":              "egg_bhurji",
    "scrambled eggs":           "egg_scrambled",
    "egg white":                "egg_white",
    "egg whites":               "egg_white",
    "egg yolk":                 "egg_yolk",

    # ── Pav variants ──────────────────────────────────────────────────────────
    "butter pav":             "pav",
    "pav with butter":        "pav",
    "ladi pav":               "pav",
    "dinner roll":            "pav",

    # ── Chicken ───────────────────────────────────────────────────────────────
    "chicken":                  "chicken_breast_cooked",
    "grilled chicken":          "chicken_grilled",
    "chicken boneless":         "chicken_breast_cooked",
    "boneless chicken breast":  "chicken_breast_cooked",
    "chicken breast boneless":  "chicken_breast_cooked",
    "boneless chicken":         "chicken_breast_cooked",
    "chicken breast raw":       "chicken_breast_raw",
    "raw chicken breast":       "chicken_breast_raw",
    "chicken breast cooked":    "chicken_breast_cooked",
    "cooked chicken breast":    "chicken_breast_cooked",
    "chicken breast":           "chicken_breast_cooked",
    "breast chicken":           "chicken_breast_cooked",
    "murgh":                    "chicken_breast_cooked",
    "murgi":                    "chicken_breast_cooked",
    "chicken leg":              "chicken_leg",
    "chicken thigh":            "chicken_thigh",
    "chicken wings":            "chicken_wings",
    "chicken wing":             "chicken_wings",
    "chicken boiled":           "chicken_boiled",
    "boiled chicken":           "chicken_boiled",
    "chicken roasted":          "chicken_roasted",
    "roasted chicken":          "chicken_roasted",
    "chicken fried":            "chicken_fried",
    "fried chicken":            "chicken_fried",
    "chicken 65":               "chicken_65",
    "chicken65":                "chicken_65",
    "shawarma":                 "chicken_shawarma",
    "chicken shawarma":         "chicken_shawarma",
    "kebab":                    "chicken_kebab",
    "chicken kebab":            "chicken_kebab",
    "seekh kebab":              "seekh_kebab",
    "mutton seekh kebab":       "seekh_kebab",

    # ── Rice ──────────────────────────────────────────────────────────────────
    "rice":                     "white_rice",
    "cooked rice":              "white_rice",
    "steamed rice":             "white_rice",
    "chawal":                   "white_rice",
    "plain rice":               "white_rice",
    "white rice":               "white_rice",
    "rice raw":                 "white_rice_raw",
    "raw rice":                 "white_rice_raw",
    "uncooked rice":            "white_rice_raw",
    "basmati":                  "basmati_rice",
    "basmati rice":             "basmati_rice",

    # ── Roti / Bread ──────────────────────────────────────────────────────────
    "roti":                     "chapati",
    "phulka":                   "chapati",
    "chapatti":                 "chapati",
    "gehun roti":               "chapati",
    "wheat roti":               "chapati",
    "aloo paratha":             "aloo_paratha",
    "gobi paratha":             "gobi_paratha",
    "methi paratha":            "methi_paratha",
    "plain paratha":            "paratha",
    "paratha":                  "paratha",

    # ── Dal ───────────────────────────────────────────────────────────────────
    "dal":                      "dal_tadka",
    "daal":                     "dal_tadka",
    "lentils":                  "dal_tadka",
    "toor dal":                 "toor_dal",
    "arhar dal":                "toor_dal",
    "arhar":                    "toor_dal",
    "moong":                    "moong_dal",
    "moong dal":                "moong_dal",
    "yellow moong":             "moong_dal",
    "sabut moong":              "moong_whole",
    "whole moong":              "moong_whole",
    "green moong":              "moong_whole",
    "masoor":                   "masoor_dal",
    "masoor dal":               "masoor_dal",
    "red lentils":              "masoor_dal",
    "urad dal":                 "urad_dal",
    "chana dal":                "chana_dal",

    # ── Paneer ────────────────────────────────────────────────────────────────
    "paneer":                   "paneer_raw",
    "cottage cheese":           "paneer_raw",
    "low fat paneer":           "paneer_low_fat",

    # ── Oats ──────────────────────────────────────────────────────────────────
    "oats":                     "oats_cooked",
    "oatmeal":                  "oats_cooked",
    "oat":                      "oats_cooked",
    "porridge":                 "oats_cooked",
    "oats raw":                 "oats_raw",
    "raw oats":                 "oats_raw",
    "dry oats":                 "oats_raw",
    "rolled oats":              "oats_raw",
    "quaker oats":              "quaker_oats",
    "muscleblaze oats":         "muscleblaze_oats",
    "mb oats":                  "muscleblaze_oats",
    "saffola oats":             "saffola_oats",
    "kelloggs oats":            "kelloggs_oats",
    "kellogs oats":             "kelloggs_oats",

    # ── Milk & Dairy ──────────────────────────────────────────────────────────
    "whole milk":               "milk_full_fat",
    "cow milk":                 "milk_full_fat",
    "milk":                     "milk_full_fat",
    "doodh":                    "milk_full_fat",
    "toned milk":               "milk_toned",
    "double toned milk":        "milk_double_toned",
    "skimmed milk":             "milk_skimmed",
    "yogurt":                   "curd",
    "dahi":                     "curd",
    "greek yogurt":             "greek_yogurt",
    "whey":                     "whey_protein",
    "protein shake":            "whey_protein",
    "protein powder":           "whey_protein",

    # ── Common dishes ─────────────────────────────────────────────────────────
    "pav bhaji":                "pav_bhaji",
    "pavbhaji":                 "pav_bhaji",
    "chicken biryani":          "chicken_biryani",
    "veg biryani":              "veg_biryani",
    "masala dosa":              "dosa_masala",
    "samosa":                   "samosa",
    "burger":                   "burger",
    "veg burger":               "veg_burger",
    "pizza":                    "pizza_slice",
    "maggi":                    "maggi_noodles",
    "noodles":                  "maggi_noodles",
    "instant noodles":          "maggi_noodles",
    "chai":                     "chai",
    "tea":                      "chai",
    "indian tea":               "chai",
    "masala chai":              "chai",
    "khari":                    "khari",
    "khari biscuit":            "khari",
    "puff pastry":              "khari",
    "moong":                    "moong_dal",
    "chana":                    "chhole",
    "chole":                    "chhole",
    "matar":                    "green_peas",
    "palak":                    "spinach",
    "saag":                     "spinach",
    "aloo":                     "potato",
    "alu":                      "potato",
    "misal pav":                "misal_pav",
    "misalpav":                 "misal_pav",
    "misal":                    "misal",
    "usal":                     "usal",
    "pohe":                     "poha",
    "kande pohe":               "poha",
    "sabudana":                 "sabudana_khichdi",
    "vada pav":                 "vada_pav",
    "chole bhature":            "chole_bhature",
    "thepla":                   "thepla",
    "khakhra":                  "khakhra",
    "rasam":                    "rasam",
    "dahi vada":                "dahi_vada",
    "dahi bhalla":              "dahi_vada",
    "aloo tikki":               "aloo_tikki",
    "pongal":                   "pongal",
    "frankie":                  "frankie",
    "kati roll":                "kati_roll",
    "egg roll":                 "egg_roll",

    # ── Soya ──────────────────────────────────────────────────────────────────
    "soya":                     "soya_chunks",
    "soy":                      "soya_chunks",
    "soya chunks":              "soya_chunks",
    "soya nuggets":             "soya_chunks",
    "meal maker":               "soya_chunks",
    "nutri nuggets":            "soya_chunks",
    "soya granules":            "soya_granules",

    # ── Sprouts ───────────────────────────────────────────────────────────────
    "sprouts":                  "mixed_sprouts",
    "moong sprouts":            "moong_sprouts",
    "bean sprouts":             "mixed_sprouts",

    # ── Hindi vegetable names ─────────────────────────────────────────────────
    "bhindi":                   "bhindi",
    "okra":                     "bhindi",
    "ladies finger":            "bhindi",
    "baingan":                  "brinjal",
    "brinjal":                  "brinjal",
    "eggplant":                 "brinjal",
    "shimla mirch":             "capsicum",
    "gajar":                    "carrot",
    "muli":                     "radish",
    "mooli":                    "radish",
    "gobhi":                    "cauliflower",
    "phool gobhi":              "cauliflower",
    "band gobhi":               "cabbage",
    "lauki":                    "bottle_gourd",
    "dudhi":                    "bottle_gourd",
    "karela":                   "bitter_gourd",
    "tinda":                    "tinda",
    "tori":                     "ridge_gourd",
    "torai":                    "ridge_gourd",
    "arbi":                     "taro",

    # ── Fruits (Hindi + regional) ────────────────────────────────────────────────
    # Raw/unripe mango
    "kairi":                    "raw_mango",
    "kairee":                   "raw_mango",
    "kaccha aam":               "raw_mango",
    "kachha aam":               "raw_mango",
    "ambat aam":                "raw_mango",
    "green mango":              "raw_mango",
    "raw mango":                "raw_mango",
    "raw mango slice":          "raw_mango",
    # Mango variants
    "aam":                      "mango",
    "amba":                     "mango",
    "ripe mango":               "mango",
    "alphonso":                 "mango",
    "hapus":                    "mango",
    "aambyach":                 "mango",
    "aamba":                    "mango",
    "aamba":                    "mango",
    "ambyache":                 "mango",
    "kairiche":                 "raw_mango",
    "aamras":                   "aamras",
    "mango pulp":               "aamras",
    "mango puree":              "aamras",
    "aamras":                   "aamras",
    "aambras":                  "aamras",
    "mango juice":              "mango",
    "hapus aamba":              "mango",
    "hapus mango":              "mango",
    "alphonso mango":           "mango",
    "kesar":                    "mango",
    "totapuri":                 "mango",
    "langra":                   "mango",
    "chausa":                   "mango",
    "kesar mango":              "mango",
    "dasheri":                  "mango",
    "mango slice":              "mango",
    "mango chunks":             "mango",
    # Other fruits
    "kela":                     "banana",
    "seb":                      "apple",
    "safarchand":               "apple",
    "santra":                   "orange",
    "narangi":                  "orange",
    "malta":                    "orange",
    "angur":                    "grapes",
    "angoor":                   "grapes",
    "draksh":                   "grapes",
    "tarbooz":                  "watermelon",
    "papita":                   "papaya",
    "anar":                     "pomegranate",
    "amrud":                    "guava",
    "amrood":                   "guava",
    "chiku":                    "chikoo",
    "nashpati":                 "pear",
    "strawberry":               "strawberries",
    "kiwi":                     "kiwi",
    "pineapple":                "pineapple",
    "ananas":                   "pineapple",
    "nimbu":                    "lemon",
    "lemon":                    "lemon",
    "mosambi":                  "sweet_lime",
    "sweet lime":               "sweet_lime",
    "kharbuja":                 "muskmelon",
    "muskmelon":                "muskmelon",
    "cantaloupe":               "muskmelon",
    "leechi":                   "lychee",
    "litchi":                   "lychee",
    "jamun":                    "jamun",
    "sitaphal":                 "sitaphal",
    "chikoo":                   "chikoo",
    "anjeer":                   "fig",
    "khajur":                   "dates",

    # ── Grains / flours ───────────────────────────────────────────────────────
    "besan":                    "chickpea_flour",
    "gram flour":               "chickpea_flour",
    "atta":                     "whole_wheat_flour",
    "wheat flour":              "whole_wheat_flour",
    "maida":                    "maida",
    "all purpose flour":        "maida",
    "suji":                     "semolina",
    "rava":                     "semolina",
    "semolina":                 "semolina",
    "poha":                     "poha",
    "flattened rice":           "poha",
    "beaten rice":              "poha",
    "quinoa":                   "quinoa_cooked",
    "makka":                    "corn",
    "makai":                    "corn",
    "corn":                     "corn",
    "sweet corn":               "sweet_corn",
    "bhutta":                   "corn_on_cob",

    # ── Drinks ────────────────────────────────────────────────────────────────
    "nimbu pani":               "nimbu_pani",
    "lemon water":              "nimbu_pani",
    "shikanji":                 "nimbu_pani",
    "chaas":                    "buttermilk",
    "mattha":                   "buttermilk",
    "lassi sweet":              "lassi_sweet",
    "mango lassi":              "mango_lassi",
    "cold coffee":              "cold_coffee",
    "protein shake":            "whey_protein",

    # ── Packaged / branded ────────────────────────────────────────────────────
    "parle g":                  "parle_g",
    "parle-g":                  "parle_g",
    "marie biscuit":            "marie_biscuit",
    "digestive biscuit":        "digestive_biscuit",
    "good day":                 "good_day_biscuit",
    "britannia bread":          "bread_white",
    "amul butter":              "butter",
    "amul cheese":              "cheese_slice",
    "cheese slice":             "cheese_slice",
    "processed cheese":         "cheese_slice",
}

INDIAN_FOODS_DB = {

    # ════════════════════════════════════════════════════════════════════════════
    # RICE & GRAINS
    # All rice values = cooked weight (what you eat)
    # ════════════════════════════════════════════════════════════════════════════
    "white_rice":            {"calories_100g": 130, "protein": 2.7, "carbs": 28.0, "fat": 0.3, "fiber": 0.4, "sugar": 0.0, "sodium": 1},
    "white_rice_raw":        {"calories_100g": 365, "protein": 7.1, "carbs": 80.0, "fat": 0.7, "fiber": 1.3, "sugar": 0.0, "sodium": 5},
    "brown_rice":            {"calories_100g": 112, "protein": 2.6, "carbs": 23.0, "fat": 0.9, "fiber": 1.8, "sugar": 0.0, "sodium": 5},
    "brown_rice_raw":        {"calories_100g": 370, "protein": 7.9, "carbs": 77.0, "fat": 2.9, "fiber": 3.5, "sugar": 0.0, "sodium": 7},
    "basmati_rice":          {"calories_100g": 121, "protein": 2.8, "carbs": 26.0, "fat": 0.2, "fiber": 0.5, "sugar": 0.0, "sodium": 1},
    "basmati_rice_raw":      {"calories_100g": 349, "protein": 8.5, "carbs": 77.0, "fat": 0.5, "fiber": 1.0, "sugar": 0.0, "sodium": 5},
    "fried_rice":            {"calories_100g": 163, "protein": 3.5, "carbs": 27.0, "fat": 4.8, "fiber": 0.5, "sugar": 0.5, "sodium": 320},
    "chicken_biryani":       {"calories_100g": 185, "protein": 12.0,"carbs": 22.0, "fat": 5.0, "fiber": 1.0, "sugar": 1.0, "sodium": 350},
    "veg_biryani":           {"calories_100g": 145, "protein": 4.0, "carbs": 26.0, "fat": 3.0, "fiber": 1.5, "sugar": 1.0, "sodium": 280},
    "mutton_biryani":        {"calories_100g": 200, "protein": 13.0,"carbs": 22.0, "fat": 7.0, "fiber": 1.0, "sugar": 1.0, "sodium": 380},
    "khichdi":               {"calories_100g": 124, "protein": 4.5, "carbs": 22.0, "fat": 2.5, "fiber": 1.5, "sugar": 0.5, "sodium": 180},
    "pulao":                 {"calories_100g": 150, "protein": 3.0, "carbs": 28.0, "fat": 3.0, "fiber": 0.8, "sugar": 0.5, "sodium": 220},
    "jeera_rice":            {"calories_100g": 140, "protein": 2.8, "carbs": 27.0, "fat": 2.5, "fiber": 0.5, "sugar": 0.0, "sodium": 180},
    "curd_rice":             {"calories_100g": 110, "protein": 3.5, "carbs": 18.0, "fat": 2.5, "fiber": 0.3, "sugar": 1.5, "sodium": 120},

    # ════════════════════════════════════════════════════════════════════════════
    # OATS
    # ════════════════════════════════════════════════════════════════════════════
    # ── Packaged oats brands ─────────────────────────────────────────────────
    "muscleblaze_oats":      {"calories_100g": 382, "protein": 13.0,"carbs": 67.0, "fat": 7.0, "fiber": 10.0,"sugar": 1.0, "sodium": 6},
    "quaker_oats":           {"calories_100g": 379, "protein": 13.0,"carbs": 68.0, "fat": 7.0, "fiber": 10.0,"sugar": 1.0, "sodium": 6},
    "saffola_oats":          {"calories_100g": 374, "protein": 11.0,"carbs": 68.0, "fat": 6.5, "fiber": 9.0, "sugar": 1.5, "sodium": 290},
    "kelloggs_oats":         {"calories_100g": 375, "protein": 12.0,"carbs": 68.0, "fat": 7.0, "fiber": 10.0,"sugar": 1.0, "sodium": 10},
    "oats_cooked":           {"calories_100g": 71,  "protein": 2.5, "carbs": 12.0, "fat": 1.5, "fiber": 1.7, "sugar": 0.3, "sodium": 49},
    "oats_raw":              {"calories_100g": 379, "protein": 13.0,"carbs": 68.0, "fat": 7.0, "fiber": 10.0,"sugar": 1.0, "sodium": 6},
    "masala_oats":           {"calories_100g": 380, "protein": 11.0,"carbs": 65.0, "fat": 8.0, "fiber": 8.0, "sugar": 2.0, "sodium": 600},
    "oats_upma":             {"calories_100g": 130, "protein": 4.0, "carbs": 20.0, "fat": 3.5, "fiber": 2.0, "sugar": 0.5, "sodium": 280},

    # ════════════════════════════════════════════════════════════════════════════
    # BREADS & ROTIS
    # Values per 100g; typical serving sizes noted in comments
    # 1 medium roti/chapati ≈ 30–35g
    # 1 paratha ≈ 60–80g
    # ════════════════════════════════════════════════════════════════════════════
    "chapati":               {"calories_100g": 297, "protein": 9.0, "carbs": 52.0, "fat": 5.0, "fiber": 3.5, "sugar": 1.0, "sodium": 370},
    "naan":                  {"calories_100g": 310, "protein": 9.0, "carbs": 54.0, "fat": 6.0, "fiber": 2.0, "sugar": 3.0, "sodium": 420},
    "garlic_naan":           {"calories_100g": 330, "protein": 8.5, "carbs": 55.0, "fat": 8.0, "fiber": 2.0, "sugar": 3.0, "sodium": 460},
    "paratha":               {"calories_100g": 326, "protein": 7.0, "carbs": 48.0, "fat": 11.0,"fiber": 2.5, "sugar": 1.0, "sodium": 380},
    "aloo_paratha":          {"calories_100g": 300, "protein": 6.5, "carbs": 47.0, "fat": 9.0, "fiber": 2.5, "sugar": 1.0, "sodium": 350},
    "gobi_paratha":          {"calories_100g": 285, "protein": 6.5, "carbs": 46.0, "fat": 8.5, "fiber": 2.5, "sugar": 1.0, "sodium": 340},
    "methi_paratha":         {"calories_100g": 275, "protein": 7.0, "carbs": 44.0, "fat": 8.0, "fiber": 3.0, "sugar": 1.0, "sodium": 320},
    "puri":                  {"calories_100g": 340, "protein": 6.0, "carbs": 44.0, "fat": 15.0,"fiber": 1.5, "sugar": 1.0, "sodium": 300},
    "bhatura":               {"calories_100g": 350, "protein": 7.0, "carbs": 48.0, "fat": 14.0,"fiber": 1.5, "sugar": 1.5, "sodium": 320},
    "bread_white":           {"calories_100g": 265, "protein": 9.0, "carbs": 49.0, "fat": 3.2, "fiber": 2.7, "sugar": 5.0, "sodium": 490},
    "bread_brown":           {"calories_100g": 247, "protein": 8.9, "carbs": 46.0, "fat": 3.4, "fiber": 4.5, "sugar": 4.0, "sodium": 450},
    "pav":                   {"calories_100g": 280, "protein": 8.0, "carbs": 52.0, "fat": 4.0, "fiber": 2.0, "sugar": 4.0, "sodium": 450},
    "whole_wheat_bread":     {"calories_100g": 247, "protein": 13.0,"carbs": 41.0, "fat": 4.2, "fiber": 7.0, "sugar": 4.0, "sodium": 400},
    "thepla":                {"calories_100g": 280, "protein": 8.0, "carbs": 43.0, "fat": 8.0, "fiber": 3.5, "sugar": 1.0, "sodium": 350},
    "khakhra":               {"calories_100g": 411, "protein": 12.0,"carbs": 63.0, "fat": 11.0,"fiber": 5.0, "sugar": 2.0, "sodium": 450},
    "missi_roti":            {"calories_100g": 280, "protein": 11.0,"carbs": 44.0, "fat": 5.5, "fiber": 5.0, "sugar": 1.0, "sodium": 320},

    # ════════════════════════════════════════════════════════════════════════════
    # DAL & LEGUMES (cooked unless noted)
    # ════════════════════════════════════════════════════════════════════════════
    "dal_tadka":             {"calories_100g": 100, "protein": 6.0, "carbs": 14.0, "fat": 2.5, "fiber": 3.0, "sugar": 1.0, "sodium": 280},
    "dal_makhani":           {"calories_100g": 130, "protein": 6.0, "carbs": 16.0, "fat": 5.0, "fiber": 3.5, "sugar": 1.5, "sodium": 320},
    "toor_dal":              {"calories_100g": 102, "protein": 6.8, "carbs": 15.0, "fat": 2.0, "fiber": 3.5, "sugar": 1.0, "sodium": 250},
    "toor_dal_raw":          {"calories_100g": 343, "protein": 22.0,"carbs": 63.0, "fat": 1.5, "fiber": 15.0,"sugar": 2.0, "sodium": 30},
    "moong_dal":             {"calories_100g": 97,  "protein": 7.0, "carbs": 13.0, "fat": 1.0, "fiber": 3.0, "sugar": 0.5, "sodium": 200},
    "moong_dal_raw":         {"calories_100g": 347, "protein": 24.0,"carbs": 63.0, "fat": 1.2, "fiber": 16.3,"sugar": 5.0, "sodium": 15},
    "moong_whole":           {"calories_100g": 105, "protein": 7.5, "carbs": 16.0, "fat": 0.6, "fiber": 4.5, "sugar": 1.5, "sodium": 10},
    "masoor_dal":            {"calories_100g": 116, "protein": 9.0, "carbs": 20.0, "fat": 0.4, "fiber": 8.0, "sugar": 1.5, "sodium": 200},
    "masoor_dal_raw":        {"calories_100g": 352, "protein": 25.8,"carbs": 60.0, "fat": 1.1, "fiber": 30.5,"sugar": 3.0, "sodium": 6},
    "urad_dal":              {"calories_100g": 105, "protein": 7.0, "carbs": 16.0, "fat": 1.0, "fiber": 3.5, "sugar": 0.5, "sodium": 180},
    "chana_dal":             {"calories_100g": 164, "protein": 9.0, "carbs": 27.0, "fat": 2.5, "fiber": 8.0, "sugar": 5.0, "sodium": 280},
    "rajma":                 {"calories_100g": 115, "protein": 7.0, "carbs": 18.0, "fat": 1.5, "fiber": 4.0, "sugar": 0.5, "sodium": 250},
    "rajma_raw":             {"calories_100g": 333, "protein": 24.0,"carbs": 60.0, "fat": 0.8, "fiber": 24.9,"sugar": 2.0, "sodium": 5},
    "chhole":                {"calories_100g": 120, "protein": 6.5, "carbs": 18.0, "fat": 2.5, "fiber": 5.0, "sugar": 1.0, "sodium": 300},
    "black_chana":           {"calories_100g": 164, "protein": 8.9, "carbs": 27.0, "fat": 2.6, "fiber": 7.6, "sugar": 4.8, "sodium": 24},
    "sambar":                {"calories_100g": 55,  "protein": 3.0, "carbs": 8.0,  "fat": 1.5, "fiber": 2.0, "sugar": 2.0, "sodium": 350},
    "green_peas":            {"calories_100g": 81,  "protein": 5.0, "carbs": 14.0, "fat": 0.4, "fiber": 5.5, "sugar": 6.0, "sodium": 5},
    "lobia":                 {"calories_100g": 116, "protein": 8.0, "carbs": 21.0, "fat": 0.4, "fiber": 11.0,"sugar": 3.0, "sodium": 240},

    # ════════════════════════════════════════════════════════════════════════════
    # EGGS
    # ════════════════════════════════════════════════════════════════════════════
    "egg_boiled":            {"calories_100g": 155, "protein": 13.0,"carbs": 1.1,  "fat": 11.0,"fiber": 0.0, "sugar": 1.1, "sodium": 124},
    "egg_fried":             {"calories_100g": 196, "protein": 14.0,"carbs": 0.4,  "fat": 15.0,"fiber": 0.0, "sugar": 0.4, "sodium": 207},
    "egg_scrambled":         {"calories_100g": 149, "protein": 10.0,"carbs": 1.6,  "fat": 11.0,"fiber": 0.0, "sugar": 1.2, "sodium": 257},
    "omelette":              {"calories_100g": 154, "protein": 11.0,"carbs": 1.0,  "fat": 12.0,"fiber": 0.0, "sugar": 0.5, "sodium": 230},
    "egg_bhurji":            {"calories_100g": 173, "protein": 11.0,"carbs": 4.0,  "fat": 13.0,"fiber": 0.8, "sugar": 2.0, "sodium": 280},
    "egg_white":             {"calories_100g": 52,  "protein": 11.0,"carbs": 0.7,  "fat": 0.2, "fiber": 0.0, "sugar": 0.7, "sodium": 166},
    "egg_yolk":              {"calories_100g": 322, "protein": 16.0,"carbs": 3.6,  "fat": 27.0,"fiber": 0.0, "sugar": 0.6, "sodium": 48},
    "egg_roll":              {"calories_100g": 220, "protein": 10.0,"carbs": 24.0, "fat": 9.0, "fiber": 1.0, "sugar": 2.0, "sodium": 380},

    # ════════════════════════════════════════════════════════════════════════════
    # CHICKEN (all values per 100g)
    # ════════════════════════════════════════════════════════════════════════════
    "chicken_breast_cooked": {"calories_100g": 165, "protein": 31.0,"carbs": 0.0,  "fat": 3.6, "fiber": 0.0, "sugar": 0.0, "sodium": 74},
    "chicken_breast":        {"calories_100g": 165, "protein": 31.0,"carbs": 0.0,  "fat": 3.6, "fiber": 0.0, "sugar": 0.0, "sodium": 74},
    "chicken_boneless":      {"calories_100g": 165, "protein": 31.0,"carbs": 0.0,  "fat": 3.6, "fiber": 0.0, "sugar": 0.0, "sodium": 74},
    "boneless_chicken":      {"calories_100g": 165, "protein": 31.0,"carbs": 0.0,  "fat": 3.6, "fiber": 0.0, "sugar": 0.0, "sodium": 74},
    "chicken_breast_raw":    {"calories_100g": 120, "protein": 22.5,"carbs": 0.0,  "fat": 2.6, "fiber": 0.0, "sugar": 0.0, "sodium": 60},
    "chicken_grilled":       {"calories_100g": 165, "protein": 31.0,"carbs": 0.0,  "fat": 3.6, "fiber": 0.0, "sugar": 0.0, "sodium": 74},
    "chicken_boiled":        {"calories_100g": 185, "protein": 30.0,"carbs": 0.0,  "fat": 7.0, "fiber": 0.0, "sugar": 0.0, "sodium": 80},
    "chicken_roasted":       {"calories_100g": 190, "protein": 29.0,"carbs": 0.0,  "fat": 8.0, "fiber": 0.0, "sugar": 0.0, "sodium": 82},
    "chicken_leg":           {"calories_100g": 184, "protein": 26.0,"carbs": 0.0,  "fat": 8.5, "fiber": 0.0, "sugar": 0.0, "sodium": 84},
    "chicken_thigh":         {"calories_100g": 209, "protein": 26.0,"carbs": 0.0,  "fat": 11.0,"fiber": 0.0, "sugar": 0.0, "sodium": 88},
    "chicken_wings":         {"calories_100g": 203, "protein": 30.0,"carbs": 0.0,  "fat": 8.1, "fiber": 0.0, "sugar": 0.0, "sodium": 96},
    "chicken_fried":         {"calories_100g": 245, "protein": 26.0,"carbs": 8.0,  "fat": 12.0,"fiber": 0.3, "sugar": 0.0, "sodium": 320},
    "chicken_tikka":         {"calories_100g": 160, "protein": 25.0,"carbs": 4.0,  "fat": 5.0, "fiber": 0.5, "sugar": 1.0, "sodium": 320},
    "chicken_tandoori":      {"calories_100g": 155, "protein": 24.0,"carbs": 3.0,  "fat": 5.0, "fiber": 0.5, "sugar": 1.0, "sodium": 350},
    "chicken_curry":         {"calories_100g": 145, "protein": 14.0,"carbs": 5.0,  "fat": 8.0, "fiber": 0.5, "sugar": 1.5, "sodium": 350},
    "butter_chicken":        {"calories_100g": 150, "protein": 12.0,"carbs": 8.0,  "fat": 8.0, "fiber": 1.0, "sugar": 3.0, "sodium": 380},
    "chicken_65":            {"calories_100g": 220, "protein": 22.0,"carbs": 10.0, "fat": 10.0,"fiber": 0.5, "sugar": 1.0, "sodium": 380},
    "chicken_shawarma":      {"calories_100g": 180, "protein": 20.0,"carbs": 8.0,  "fat": 7.0, "fiber": 0.5, "sugar": 1.0, "sodium": 420},
    "chicken_kebab":         {"calories_100g": 195, "protein": 24.0,"carbs": 4.0,  "fat": 9.0, "fiber": 0.5, "sugar": 1.0, "sodium": 350},
    "seekh_kebab":           {"calories_100g": 210, "protein": 22.0,"carbs": 5.0,  "fat": 11.0,"fiber": 0.5, "sugar": 1.0, "sodium": 380},
    "chicken_biryani":       {"calories_100g": 185, "protein": 12.0,"carbs": 22.0, "fat": 5.0, "fiber": 1.0, "sugar": 1.0, "sodium": 350},

    # ════════════════════════════════════════════════════════════════════════════
    # MUTTON, FISH & SEAFOOD
    # ════════════════════════════════════════════════════════════════════════════
    "mutton":                {"calories_100g": 250, "protein": 25.0,"carbs": 0.0,  "fat": 17.0,"fiber": 0.0, "sugar": 0.0, "sodium": 72},
    "mutton_curry":          {"calories_100g": 165, "protein": 15.0,"carbs": 4.0,  "fat": 10.0,"fiber": 0.5, "sugar": 1.0, "sodium": 380},
    "keema":                 {"calories_100g": 225, "protein": 20.0,"carbs": 4.0,  "fat": 14.0,"fiber": 0.5, "sugar": 1.0, "sodium": 350},
    "keema_matar":           {"calories_100g": 180, "protein": 15.0,"carbs": 8.0,  "fat": 10.0,"fiber": 2.0, "sugar": 1.5, "sodium": 320},
    "fish_grilled":          {"calories_100g": 136, "protein": 26.0,"carbs": 0.0,  "fat": 3.0, "fiber": 0.0, "sugar": 0.0, "sodium": 76},
    "fish_curry":            {"calories_100g": 120, "protein": 14.0,"carbs": 5.0,  "fat": 5.0, "fiber": 0.5, "sugar": 1.0, "sodium": 350},
    "fish_fry":              {"calories_100g": 200, "protein": 20.0,"carbs": 8.0,  "fat": 10.0,"fiber": 0.5, "sugar": 0.5, "sodium": 320},
    "rohu":                  {"calories_100g": 97,  "protein": 16.6,"carbs": 0.0,  "fat": 3.4, "fiber": 0.0, "sugar": 0.0, "sodium": 60},
    "pomfret":               {"calories_100g": 96,  "protein": 18.0,"carbs": 0.0,  "fat": 2.0, "fiber": 0.0, "sugar": 0.0, "sodium": 95},
    "tuna":                  {"calories_100g": 116, "protein": 26.0,"carbs": 0.0,  "fat": 1.0, "fiber": 0.0, "sugar": 0.0, "sodium": 50},
    "tuna_canned":           {"calories_100g": 128, "protein": 29.0,"carbs": 0.0,  "fat": 1.0, "fiber": 0.0, "sugar": 0.0, "sodium": 320},
    "prawn_curry":           {"calories_100g": 100, "protein": 16.0,"carbs": 4.0,  "fat": 2.5, "fiber": 0.5, "sugar": 1.0, "sodium": 350},
    "prawn":                 {"calories_100g": 85,  "protein": 18.0,"carbs": 0.9,  "fat": 0.9, "fiber": 0.0, "sugar": 0.0, "sodium": 119},

    # ════════════════════════════════════════════════════════════════════════════
    # PANEER & SOY PROTEIN
    # ════════════════════════════════════════════════════════════════════════════
    "paneer_raw":            {"calories_100g": 296, "protein": 18.0,"carbs": 3.0,  "fat": 23.0,"fiber": 0.0, "sugar": 3.0, "sodium": 28},
    "paneer_low_fat":        {"calories_100g": 180, "protein": 18.0,"carbs": 3.5,  "fat": 10.0,"fiber": 0.0, "sugar": 3.0, "sodium": 28},
    "paneer_curry":          {"calories_100g": 180, "protein": 10.0,"carbs": 8.0,  "fat": 12.0,"fiber": 0.5, "sugar": 2.0, "sodium": 290},
    "palak_paneer":          {"calories_100g": 140, "protein": 7.0, "carbs": 8.0,  "fat": 9.0, "fiber": 2.0, "sugar": 2.0, "sodium": 300},
    "matar_paneer":          {"calories_100g": 150, "protein": 7.5, "carbs": 12.0, "fat": 9.0, "fiber": 2.5, "sugar": 2.0, "sodium": 320},
    "shahi_paneer":          {"calories_100g": 180, "protein": 8.0, "carbs": 10.0, "fat": 13.0,"fiber": 1.0, "sugar": 3.0, "sodium": 340},
    "kadai_paneer":          {"calories_100g": 165, "protein": 8.0, "carbs": 9.0,  "fat": 11.0,"fiber": 1.5, "sugar": 3.0, "sodium": 360},
    "paneer_bhurji":         {"calories_100g": 190, "protein": 12.0,"carbs": 5.0,  "fat": 14.0,"fiber": 0.5, "sugar": 2.0, "sodium": 300},
    "tofu":                  {"calories_100g": 76,  "protein": 8.0, "carbs": 2.0,  "fat": 4.0, "fiber": 0.3, "sugar": 0.5, "sodium": 7},
    "soya_chunks":           {"calories_100g": 345, "protein": 52.0,"carbs": 33.0, "fat": 0.5, "fiber": 13.0,"sugar": 2.0, "sodium": 10},
    "soya_chunks_cooked":    {"calories_100g": 149, "protein": 15.0,"carbs": 8.0,  "fat": 0.5, "fiber": 5.0, "sugar": 1.0, "sodium": 100},
    "soya_granules":         {"calories_100g": 340, "protein": 50.0,"carbs": 32.0, "fat": 0.5, "fiber": 12.0,"sugar": 2.0, "sodium": 10},

    # ════════════════════════════════════════════════════════════════════════════
    # DAIRY
    # ════════════════════════════════════════════════════════════════════════════
    "milk_full_fat":         {"calories_100g": 61,  "protein": 3.2, "carbs": 4.8,  "fat": 3.3, "fiber": 0.0, "sugar": 5.0, "sodium": 43},
    "milk_toned":            {"calories_100g": 44,  "protein": 3.3, "carbs": 4.4,  "fat": 1.5, "fiber": 0.0, "sugar": 4.4, "sodium": 43},
    "milk_double_toned":     {"calories_100g": 38,  "protein": 3.2, "carbs": 4.5,  "fat": 0.5, "fiber": 0.0, "sugar": 4.5, "sodium": 43},
    "milk_skimmed":          {"calories_100g": 35,  "protein": 3.4, "carbs": 5.0,  "fat": 0.1, "fiber": 0.0, "sugar": 5.0, "sodium": 44},
    "curd":                  {"calories_100g": 60,  "protein": 3.1, "carbs": 3.4,  "fat": 3.3, "fiber": 0.0, "sugar": 3.4, "sodium": 36},
    "curd_low_fat":          {"calories_100g": 45,  "protein": 3.5, "carbs": 3.6,  "fat": 1.5, "fiber": 0.0, "sugar": 3.6, "sodium": 36},
    "greek_yogurt":          {"calories_100g": 100, "protein": 9.0, "carbs": 3.6,  "fat": 5.0, "fiber": 0.0, "sugar": 3.6, "sodium": 36},
    "raita":                 {"calories_100g": 60,  "protein": 2.5, "carbs": 5.0,  "fat": 3.0, "fiber": 0.3, "sugar": 4.0, "sodium": 150},
    "lassi":                 {"calories_100g": 65,  "protein": 3.0, "carbs": 7.5,  "fat": 2.5, "fiber": 0.0, "sugar": 7.0, "sodium": 50},
    "lassi_sweet":           {"calories_100g": 80,  "protein": 2.8, "carbs": 13.0, "fat": 2.0, "fiber": 0.0, "sugar": 12.0,"sodium": 50},
    "mango_lassi":           {"calories_100g": 90,  "protein": 2.5, "carbs": 16.0, "fat": 2.0, "fiber": 0.3, "sugar": 14.0,"sodium": 45},
    "buttermilk":            {"calories_100g": 40,  "protein": 3.3, "carbs": 5.0,  "fat": 0.9, "fiber": 0.0, "sugar": 5.0, "sodium": 105},
    "whey_protein":          {"calories_100g": 370, "protein": 75.0,"carbs": 10.0, "fat": 5.0, "fiber": 0.0, "sugar": 5.0, "sodium": 200},
    "cheese":                {"calories_100g": 402, "protein": 25.0,"carbs": 1.3,  "fat": 33.0,"fiber": 0.0, "sugar": 0.5, "sodium": 621},
    "cheese_slice":          {"calories_100g": 295, "protein": 18.5,"carbs": 8.0,  "fat": 21.0,"fiber": 0.0, "sugar": 2.0, "sodium": 900},
    "butter":                {"calories_100g": 717, "protein": 0.9, "carbs": 0.1,  "fat": 81.0,"fiber": 0.0, "sugar": 0.1, "sodium": 576},
    "ghee":                  {"calories_100g": 900, "protein": 0.0, "carbs": 0.0,  "fat": 100.0,"fiber": 0.0,"sugar": 0.0, "sodium": 1},

    # ════════════════════════════════════════════════════════════════════════════
    # BREAKFAST / SOUTH INDIAN
    # ════════════════════════════════════════════════════════════════════════════
    "idli":                  {"calories_100g": 58,  "protein": 2.0, "carbs": 12.0, "fat": 0.4, "fiber": 0.5, "sugar": 0.5, "sodium": 250},
    "dosa":                  {"calories_100g": 168, "protein": 3.9, "carbs": 30.0, "fat": 3.7, "fiber": 1.0, "sugar": 0.5, "sodium": 390},
    "dosa_masala":           {"calories_100g": 185, "protein": 4.0, "carbs": 32.0, "fat": 5.0, "fiber": 1.5, "sugar": 1.0, "sodium": 420},
    "rava_dosa":             {"calories_100g": 160, "protein": 3.5, "carbs": 28.0, "fat": 4.0, "fiber": 0.8, "sugar": 0.5, "sodium": 350},
    "uttapam":               {"calories_100g": 140, "protein": 4.0, "carbs": 25.0, "fat": 3.0, "fiber": 1.2, "sugar": 1.0, "sodium": 350},
    "medu_vada":             {"calories_100g": 310, "protein": 7.0, "carbs": 30.0, "fat": 18.0,"fiber": 2.0, "sugar": 1.0, "sodium": 400},
    "upma":                  {"calories_100g": 120, "protein": 3.0, "carbs": 20.0, "fat": 3.0, "fiber": 1.5, "sugar": 0.5, "sodium": 300},
    "poha":                  {"calories_100g": 130, "protein": 2.5, "carbs": 26.0, "fat": 2.0, "fiber": 1.0, "sugar": 1.0, "sodium": 280},
    "poha_raw":              {"calories_100g": 371, "protein": 6.6, "carbs": 81.0, "fat": 1.2, "fiber": 1.5, "sugar": 0.5, "sodium": 10},
    "pesarattu":             {"calories_100g": 150, "protein": 8.0, "carbs": 22.0, "fat": 3.0, "fiber": 3.0, "sugar": 1.0, "sodium": 280},
    "appam":                 {"calories_100g": 120, "protein": 2.5, "carbs": 24.0, "fat": 1.5, "fiber": 0.8, "sugar": 2.0, "sodium": 200},
    "pongal":                {"calories_100g": 130, "protein": 4.0, "carbs": 24.0, "fat": 3.5, "fiber": 1.0, "sugar": 0.5, "sodium": 220},
    "ven_pongal":            {"calories_100g": 138, "protein": 4.5, "carbs": 22.0, "fat": 4.5, "fiber": 1.0, "sugar": 0.5, "sodium": 250},
    "sabudana_khichdi":      {"calories_100g": 200, "protein": 2.0, "carbs": 38.0, "fat": 5.0, "fiber": 0.5, "sugar": 1.0, "sodium": 200},
    "rava_idli":             {"calories_100g": 100, "protein": 3.0, "carbs": 18.0, "fat": 2.5, "fiber": 0.5, "sugar": 0.5, "sodium": 280},

    # ════════════════════════════════════════════════════════════════════════════
    # VEGETABLES & CURRIES
    # ════════════════════════════════════════════════════════════════════════════
    "pav_bhaji":             {"calories_100g": 110, "protein": 3.5, "carbs": 16.0, "fat": 4.0, "fiber": 2.5, "sugar": 3.0, "sodium": 380},
    "aloo_gobi":             {"calories_100g": 85,  "protein": 2.5, "carbs": 13.0, "fat": 2.5, "fiber": 2.0, "sugar": 2.0, "sodium": 250},
    "baingan_bharta":        {"calories_100g": 70,  "protein": 2.0, "carbs": 10.0, "fat": 3.0, "fiber": 3.0, "sugar": 4.0, "sodium": 220},
    "aloo_matar":            {"calories_100g": 90,  "protein": 3.0, "carbs": 14.0, "fat": 2.5, "fiber": 3.0, "sugar": 2.0, "sodium": 240},
    "mix_veg":               {"calories_100g": 80,  "protein": 2.5, "carbs": 11.0, "fat": 3.0, "fiber": 2.5, "sugar": 2.5, "sodium": 230},
    "jeera_aloo":            {"calories_100g": 110, "protein": 2.0, "carbs": 18.0, "fat": 3.5, "fiber": 2.0, "sugar": 1.0, "sodium": 200},
    "sabzi":                 {"calories_100g": 70,  "protein": 2.0, "carbs": 10.0, "fat": 2.5, "fiber": 2.0, "sugar": 2.0, "sodium": 200},
    "bhindi_masala":         {"calories_100g": 75,  "protein": 2.2, "carbs": 10.0, "fat": 3.0, "fiber": 3.2, "sugar": 1.5, "sodium": 220},
    "aloo_curry":            {"calories_100g": 95,  "protein": 2.0, "carbs": 16.0, "fat": 2.5, "fiber": 2.0, "sugar": 1.0, "sodium": 230},
    "kaddu_sabzi":           {"calories_100g": 60,  "protein": 1.5, "carbs": 10.0, "fat": 1.5, "fiber": 1.5, "sugar": 3.0, "sodium": 180},
    "lauki_sabzi":           {"calories_100g": 50,  "protein": 1.2, "carbs": 8.0,  "fat": 1.5, "fiber": 1.5, "sugar": 2.5, "sodium": 160},

    # ════════════════════════════════════════════════════════════════════════════
    # STREET FOOD & SNACKS
    # ════════════════════════════════════════════════════════════════════════════
    "samosa":                {"calories_100g": 308, "protein": 6.0, "carbs": 35.0, "fat": 16.0,"fiber": 2.0, "sugar": 1.0, "sodium": 430},
    "pakora":                {"calories_100g": 285, "protein": 6.0, "carbs": 32.0, "fat": 15.0,"fiber": 2.0, "sugar": 1.0, "sodium": 380},
    "vada_pav":              {"calories_100g": 230, "protein": 5.0, "carbs": 32.0, "fat": 9.0, "fiber": 2.0, "sugar": 2.0, "sodium": 420},
    "chole_bhature":         {"calories_100g": 250, "protein": 8.0, "carbs": 35.0, "fat": 9.0, "fiber": 4.0, "sugar": 2.0, "sodium": 420},
    "pani_puri":             {"calories_100g": 200, "protein": 4.0, "carbs": 32.0, "fat": 6.0, "fiber": 2.0, "sugar": 5.0, "sodium": 400},
    "bhel_puri":             {"calories_100g": 180, "protein": 4.0, "carbs": 30.0, "fat": 5.0, "fiber": 2.0, "sugar": 4.0, "sodium": 350},
    "sev_puri":              {"calories_100g": 210, "protein": 4.5, "carbs": 28.0, "fat": 9.0, "fiber": 2.0, "sugar": 5.0, "sodium": 380},
    "dahi_puri":             {"calories_100g": 190, "protein": 5.0, "carbs": 27.0, "fat": 6.0, "fiber": 1.5, "sugar": 7.0, "sodium": 350},
    "dahi_vada":             {"calories_100g": 145, "protein": 6.5, "carbs": 20.0, "fat": 4.5, "fiber": 1.5, "sugar": 6.0, "sodium": 320},
    "aloo_tikki":            {"calories_100g": 180, "protein": 3.5, "carbs": 26.0, "fat": 7.0, "fiber": 2.0, "sugar": 1.5, "sodium": 350},
    "dabeli":                {"calories_100g": 220, "protein": 5.0, "carbs": 30.0, "fat": 9.0, "fiber": 2.0, "sugar": 6.0, "sodium": 380},
    "misal_pav":             {"calories_100g": 130, "protein": 6.0, "carbs": 18.0, "fat": 4.0, "fiber": 4.0, "sugar": 2.0, "sodium": 320},
    "misal":                 {"calories_100g": 100, "protein": 6.0, "carbs": 14.0, "fat": 3.0, "fiber": 4.0, "sugar": 2.0, "sodium": 280},
    "usal":                  {"calories_100g": 95,  "protein": 6.5, "carbs": 13.0, "fat": 2.5, "fiber": 4.5, "sugar": 2.0, "sodium": 250},
    "dhokla":                {"calories_100g": 160, "protein": 5.0, "carbs": 28.0, "fat": 4.0, "fiber": 1.5, "sugar": 3.0, "sodium": 380},
    "khandvi":               {"calories_100g": 140, "protein": 5.0, "carbs": 18.0, "fat": 5.0, "fiber": 1.5, "sugar": 3.0, "sodium": 320},
    "momos":                 {"calories_100g": 150, "protein": 8.0, "carbs": 20.0, "fat": 4.5, "fiber": 1.0, "sugar": 1.0, "sodium": 350},
    "veg_momos":             {"calories_100g": 130, "protein": 5.0, "carbs": 22.0, "fat": 3.0, "fiber": 1.5, "sugar": 1.0, "sodium": 300},
    "chicken_momos":         {"calories_100g": 160, "protein": 10.0,"carbs": 18.0, "fat": 5.0, "fiber": 1.0, "sugar": 1.0, "sodium": 380},
    "frankie":               {"calories_100g": 210, "protein": 7.0, "carbs": 30.0, "fat": 7.0, "fiber": 2.0, "sugar": 2.0, "sodium": 400},
    "kati_roll":             {"calories_100g": 220, "protein": 9.0, "carbs": 28.0, "fat": 8.0, "fiber": 2.0, "sugar": 2.0, "sodium": 420},
    "rasam":                 {"calories_100g": 30,  "protein": 1.5, "carbs": 5.0,  "fat": 0.5, "fiber": 0.8, "sugar": 2.0, "sodium": 300},
    "chakli":                {"calories_100g": 480, "protein": 7.0, "carbs": 55.0, "fat": 26.0,"fiber": 3.0, "sugar": 1.0, "sodium": 450},
    "murukku":               {"calories_100g": 500, "protein": 8.0, "carbs": 58.0, "fat": 26.0,"fiber": 2.0, "sugar": 1.0, "sodium": 480},
    "chivda":                {"calories_100g": 420, "protein": 9.0, "carbs": 52.0, "fat": 20.0,"fiber": 3.0, "sugar": 5.0, "sodium": 600},
    "khari":                 {"calories_100g": 490, "protein": 8.0, "carbs": 58.0, "fat": 25.0,"fiber": 1.5, "sugar": 3.0, "sodium": 400},
    "namkeen":               {"calories_100g": 450, "protein": 9.0, "carbs": 52.0, "fat": 23.0,"fiber": 3.0, "sugar": 2.0, "sodium": 800},

    # ════════════════════════════════════════════════════════════════════════════
    # FAST FOOD & INTERNATIONAL
    # ════════════════════════════════════════════════════════════════════════════
    "burger":                {"calories_100g": 250, "protein": 12.0,"carbs": 28.0, "fat": 10.0,"fiber": 1.5, "sugar": 5.0, "sodium": 480},
    "veg_burger":            {"calories_100g": 220, "protein": 7.0, "carbs": 32.0, "fat": 8.0, "fiber": 2.0, "sugar": 5.0, "sodium": 420},
    "chicken_burger":        {"calories_100g": 265, "protein": 15.0,"carbs": 25.0, "fat": 11.0,"fiber": 1.5, "sugar": 5.0, "sodium": 520},
    "pizza_slice":           {"calories_100g": 266, "protein": 11.0,"carbs": 33.0, "fat": 10.0,"fiber": 2.0, "sugar": 3.6, "sodium": 598},
    "maggi_noodles":         {"calories_100g": 400, "protein": 10.0,"carbs": 57.0, "fat": 15.0,"fiber": 1.5, "sugar": 1.5, "sodium": 1000},
    "sandwich":              {"calories_100g": 210, "protein": 8.0, "carbs": 28.0, "fat": 7.0, "fiber": 2.0, "sugar": 3.0, "sodium": 440},
    "chips":                 {"calories_100g": 536, "protein": 7.0, "carbs": 53.0, "fat": 35.0,"fiber": 3.0, "sugar": 0.4, "sodium": 524},
    "pasta":                 {"calories_100g": 131, "protein": 5.0, "carbs": 25.0, "fat": 1.1, "fiber": 1.8, "sugar": 0.6, "sodium": 1},
    "pasta_raw":             {"calories_100g": 371, "protein": 13.0,"carbs": 74.0, "fat": 1.5, "fiber": 3.2, "sugar": 2.5, "sodium": 6},
    "cornflakes":            {"calories_100g": 357, "protein": 7.0, "carbs": 84.0, "fat": 0.9, "fiber": 2.4, "sugar": 8.0, "sodium": 752},
    "muesli":                {"calories_100g": 370, "protein": 10.0,"carbs": 64.0, "fat": 7.0, "fiber": 7.0, "sugar": 20.0,"sodium": 120},

    # ════════════════════════════════════════════════════════════════════════════
    # PACKAGED / BISCUITS
    # ════════════════════════════════════════════════════════════════════════════
    "parle_g":               {"calories_100g": 450, "protein": 6.7, "carbs": 75.0, "fat": 14.0,"fiber": 0.5, "sugar": 25.0,"sodium": 260},
    "marie_biscuit":         {"calories_100g": 412, "protein": 7.5, "carbs": 75.0, "fat": 9.5, "fiber": 2.0, "sugar": 18.0,"sodium": 300},
    "digestive_biscuit":     {"calories_100g": 471, "protein": 6.7, "carbs": 68.0, "fat": 20.0,"fiber": 3.5, "sugar": 16.0,"sodium": 475},
    "good_day_biscuit":      {"calories_100g": 500, "protein": 7.0, "carbs": 64.0, "fat": 24.0,"fiber": 1.5, "sugar": 22.0,"sodium": 280},

    # ════════════════════════════════════════════════════════════════════════════
    # DRINKS & BEVERAGES
    # ════════════════════════════════════════════════════════════════════════════
    "chai":                  {"calories_100g": 45,  "protein": 1.7, "carbs": 6.5,  "fat": 1.5, "fiber": 0.0, "sugar": 5.0, "sodium": 20},
    "coffee":                {"calories_100g": 5,   "protein": 0.3, "carbs": 1.0,  "fat": 0.0, "fiber": 0.0, "sugar": 0.0, "sodium": 2},
    "cold_coffee":           {"calories_100g": 80,  "protein": 3.0, "carbs": 12.0, "fat": 2.5, "fiber": 0.0, "sugar": 10.0,"sodium": 40},
    "juice":                 {"calories_100g": 45,  "protein": 0.5, "carbs": 11.0, "fat": 0.1, "fiber": 0.2, "sugar": 9.0, "sodium": 5},
    "nimbu_pani":            {"calories_100g": 25,  "protein": 0.3, "carbs": 6.0,  "fat": 0.0, "fiber": 0.1, "sugar": 5.0, "sodium": 5},
    "coconut_water":         {"calories_100g": 19,  "protein": 0.7, "carbs": 3.7,  "fat": 0.2, "fiber": 1.1, "sugar": 2.6, "sodium": 105},
    "protein_shake_milk":    {"calories_100g": 80,  "protein": 8.0, "carbs": 7.0,  "fat": 2.0, "fiber": 0.0, "sugar": 6.0, "sodium": 80},

    # ════════════════════════════════════════════════════════════════════════════
    # FRUITS
    # ════════════════════════════════════════════════════════════════════════════
    "banana":                {"calories_100g": 89,  "protein": 1.1, "carbs": 23.0, "fat": 0.3, "fiber": 2.6, "sugar": 12.0,"sodium": 1},
    "apple":                 {"calories_100g": 52,  "protein": 0.3, "carbs": 14.0, "fat": 0.2, "fiber": 2.4, "sugar": 10.0,"sodium": 1},
    "aamras":                {"calories_100g": 90,  "protein": 0.8, "carbs": 22.0, "fat": 0.4, "fiber": 1.2, "sugar": 20.0,"sodium": 2},
    "mango_pulp":            {"calories_100g": 90,  "protein": 0.8, "carbs": 22.0, "fat": 0.4, "fiber": 1.2, "sugar": 20.0,"sodium": 2},
    "mango":                 {"calories_100g": 60,  "protein": 0.8, "carbs": 15.0, "fat": 0.4, "fiber": 1.6, "sugar": 14.0,"sodium": 1},
    "raw_mango":             {"calories_100g": 55,  "protein": 0.7, "carbs": 14.0, "fat": 0.3, "fiber": 1.6, "sugar": 13.0,"sodium": 1},
    "green_mango":           {"calories_100g": 55,  "protein": 0.7, "carbs": 14.0, "fat": 0.3, "fiber": 1.6, "sugar": 13.0,"sodium": 1},
    "mango_slice":           {"calories_100g": 60,  "protein": 0.8, "carbs": 15.0, "fat": 0.4, "fiber": 1.6, "sugar": 14.0,"sodium": 1},
    "mango_chunks":          {"calories_100g": 60,  "protein": 0.8, "carbs": 15.0, "fat": 0.4, "fiber": 1.6, "sugar": 14.0,"sodium": 1},
    "alphonso_mango":        {"calories_100g": 62,  "protein": 0.8, "carbs": 16.0, "fat": 0.4, "fiber": 1.6, "sugar": 14.0,"sodium": 1},
    "orange":                {"calories_100g": 47,  "protein": 0.9, "carbs": 12.0, "fat": 0.1, "fiber": 2.4, "sugar": 9.0, "sodium": 0},
    "grapes":                {"calories_100g": 69,  "protein": 0.7, "carbs": 18.0, "fat": 0.2, "fiber": 0.9, "sugar": 15.0,"sodium": 2},
    "watermelon":            {"calories_100g": 30,  "protein": 0.6, "carbs": 8.0,  "fat": 0.2, "fiber": 0.4, "sugar": 6.0, "sodium": 1},
    "papaya":                {"calories_100g": 43,  "protein": 0.5, "carbs": 11.0, "fat": 0.3, "fiber": 1.7, "sugar": 8.0, "sodium": 8},
    "pomegranate":           {"calories_100g": 83,  "protein": 1.7, "carbs": 19.0, "fat": 1.2, "fiber": 4.0, "sugar": 14.0,"sodium": 3},
    "guava":                 {"calories_100g": 68,  "protein": 2.6, "carbs": 14.0, "fat": 1.0, "fiber": 5.4, "sugar": 9.0, "sodium": 2},
    "chikoo":                {"calories_100g": 83,  "protein": 0.4, "carbs": 20.0, "fat": 1.1, "fiber": 5.3, "sugar": 16.0,"sodium": 12},
    "pear":                  {"calories_100g": 57,  "protein": 0.4, "carbs": 15.0, "fat": 0.1, "fiber": 3.1, "sugar": 10.0,"sodium": 1},
    "strawberries":          {"calories_100g": 32,  "protein": 0.7, "carbs": 8.0,  "fat": 0.3, "fiber": 2.0, "sugar": 5.0, "sodium": 1},
    "kiwi":                  {"calories_100g": 61,  "protein": 1.1, "carbs": 15.0, "fat": 0.5, "fiber": 3.0, "sugar": 9.0, "sodium": 3},
    "pineapple":             {"calories_100g": 50,  "protein": 0.5, "carbs": 13.0, "fat": 0.1, "fiber": 1.4, "sugar": 10.0,"sodium": 1},
    "lychee":                {"calories_100g": 66,  "protein": 0.8, "carbs": 17.0, "fat": 0.4, "fiber": 1.3, "sugar": 15.0,"sodium": 1},
    "sitaphal":              {"calories_100g": 101, "protein": 1.7, "carbs": 25.0, "fat": 0.4, "fiber": 4.4, "sugar": 20.0,"sodium": 4},
    "jamun":                 {"calories_100g": 62,  "protein": 0.7, "carbs": 14.0, "fat": 0.3, "fiber": 0.6, "sugar": 10.0,"sodium": 26},
    "lemon":                 {"calories_100g": 29,  "protein": 1.1, "carbs": 9.0,  "fat": 0.3, "fiber": 2.8, "sugar": 2.5, "sodium": 2},
    "sweet_lime":            {"calories_100g": 43,  "protein": 0.7, "carbs": 10.0, "fat": 0.3, "fiber": 0.5, "sugar": 8.0, "sodium": 1},
    "muskmelon":             {"calories_100g": 34,  "protein": 0.8, "carbs": 8.0,  "fat": 0.2, "fiber": 0.9, "sugar": 7.0, "sodium": 16},
    "lychee":                {"calories_100g": 66,  "protein": 0.8, "carbs": 17.0, "fat": 0.4, "fiber": 1.3, "sugar": 15.0,"sodium": 1},
    "coconut_fresh":         {"calories_100g": 354, "protein": 3.3, "carbs": 15.0, "fat": 33.0,"fiber": 9.0, "sugar": 6.0, "sodium": 20},
    "dates":                 {"calories_100g": 282, "protein": 2.5, "carbs": 75.0, "fat": 0.4, "fiber": 8.0, "sugar": 63.0,"sodium": 2},
    "fig":                   {"calories_100g": 74,  "protein": 0.8, "carbs": 19.0, "fat": 0.3, "fiber": 3.0, "sugar": 16.0,"sodium": 1},
    "raw_mango":             {"calories_100g": 55,  "protein": 0.7, "carbs": 14.0, "fat": 0.3, "fiber": 1.6, "sugar": 13.0,"sodium": 1},
    "green_mango":           {"calories_100g": 55,  "protein": 0.7, "carbs": 14.0, "fat": 0.3, "fiber": 1.6, "sugar": 13.0,"sodium": 1},

    # ════════════════════════════════════════════════════════════════════════════
    # VEGETABLES (raw unless noted)
    # ════════════════════════════════════════════════════════════════════════════
    "salad":                 {"calories_100g": 20,  "protein": 1.5, "carbs": 3.5,  "fat": 0.2, "fiber": 1.5, "sugar": 2.0, "sodium": 15},
    "cucumber":              {"calories_100g": 16,  "protein": 0.7, "carbs": 3.6,  "fat": 0.1, "fiber": 0.5, "sugar": 1.7, "sodium": 2},
    "tomato":                {"calories_100g": 18,  "protein": 0.9, "carbs": 3.9,  "fat": 0.2, "fiber": 1.2, "sugar": 2.6, "sodium": 5},
    "onion":                 {"calories_100g": 40,  "protein": 1.1, "carbs": 9.0,  "fat": 0.1, "fiber": 1.7, "sugar": 4.0, "sodium": 4},
    "spinach":               {"calories_100g": 23,  "protein": 2.9, "carbs": 3.6,  "fat": 0.4, "fiber": 2.2, "sugar": 0.4, "sodium": 79},
    "broccoli":              {"calories_100g": 34,  "protein": 2.8, "carbs": 7.0,  "fat": 0.4, "fiber": 2.6, "sugar": 1.7, "sodium": 33},
    "potato":                {"calories_100g": 77,  "protein": 2.0, "carbs": 17.0, "fat": 0.1, "fiber": 2.2, "sugar": 0.8, "sodium": 6},
    "sweet_potato":          {"calories_100g": 86,  "protein": 1.6, "carbs": 20.0, "fat": 0.1, "fiber": 3.0, "sugar": 4.2, "sodium": 55},
    "carrot":                {"calories_100g": 41,  "protein": 0.9, "carbs": 10.0, "fat": 0.2, "fiber": 2.8, "sugar": 4.7, "sodium": 69},
    "cauliflower":           {"calories_100g": 25,  "protein": 1.9, "carbs": 5.0,  "fat": 0.3, "fiber": 2.0, "sugar": 1.9, "sodium": 30},
    "cabbage":               {"calories_100g": 25,  "protein": 1.3, "carbs": 6.0,  "fat": 0.1, "fiber": 2.5, "sugar": 3.2, "sodium": 18},
    "capsicum":              {"calories_100g": 31,  "protein": 1.0, "carbs": 6.0,  "fat": 0.3, "fiber": 2.1, "sugar": 4.2, "sodium": 4},
    "mushroom":              {"calories_100g": 22,  "protein": 3.1, "carbs": 3.3,  "fat": 0.3, "fiber": 1.0, "sugar": 2.0, "sodium": 5},
    "beetroot":              {"calories_100g": 43,  "protein": 1.6, "carbs": 10.0, "fat": 0.2, "fiber": 2.8, "sugar": 6.8, "sodium": 78},
    "bhindi":                {"calories_100g": 33,  "protein": 2.0, "carbs": 7.0,  "fat": 0.2, "fiber": 3.2, "sugar": 1.5, "sodium": 8},
    "brinjal":               {"calories_100g": 25,  "protein": 1.0, "carbs": 6.0,  "fat": 0.2, "fiber": 3.0, "sugar": 3.5, "sodium": 2},
    "radish":                {"calories_100g": 16,  "protein": 0.7, "carbs": 3.4,  "fat": 0.1, "fiber": 1.6, "sugar": 2.0, "sodium": 39},
    "bottle_gourd":          {"calories_100g": 14,  "protein": 0.6, "carbs": 3.0,  "fat": 0.0, "fiber": 0.5, "sugar": 1.5, "sodium": 2},
    "bitter_gourd":          {"calories_100g": 17,  "protein": 1.0, "carbs": 3.7,  "fat": 0.2, "fiber": 2.8, "sugar": 1.5, "sodium": 5},
    "tinda":                 {"calories_100g": 21,  "protein": 1.2, "carbs": 4.7,  "fat": 0.1, "fiber": 1.5, "sugar": 2.0, "sodium": 8},
    "ridge_gourd":           {"calories_100g": 20,  "protein": 1.2, "carbs": 4.0,  "fat": 0.1, "fiber": 0.5, "sugar": 2.0, "sodium": 3},
    "taro":                  {"calories_100g": 112, "protein": 1.5, "carbs": 27.0, "fat": 0.2, "fiber": 4.1, "sugar": 0.4, "sodium": 11},
    "corn":                  {"calories_100g": 86,  "protein": 3.3, "carbs": 19.0, "fat": 1.4, "fiber": 2.7, "sugar": 6.3, "sodium": 15},
    "sweet_corn":            {"calories_100g": 96,  "protein": 3.4, "carbs": 21.0, "fat": 1.5, "fiber": 2.4, "sugar": 4.5, "sodium": 15},
    "corn_on_cob":           {"calories_100g": 86,  "protein": 3.3, "carbs": 19.0, "fat": 1.4, "fiber": 2.7, "sugar": 6.3, "sodium": 15},

    # ════════════════════════════════════════════════════════════════════════════
    # SPROUTS
    # ════════════════════════════════════════════════════════════════════════════
    "moong_sprouts":         {"calories_100g": 30,  "protein": 3.0, "carbs": 4.0,  "fat": 0.2, "fiber": 1.8, "sugar": 2.0, "sodium": 6},
    "mixed_sprouts":         {"calories_100g": 65,  "protein": 5.0, "carbs": 10.0, "fat": 0.4, "fiber": 3.5, "sugar": 2.0, "sodium": 14},
    "chana_sprouts":         {"calories_100g": 120, "protein": 7.0, "carbs": 19.0, "fat": 1.0, "fiber": 5.0, "sugar": 4.0, "sodium": 20},

    # ════════════════════════════════════════════════════════════════════════════
    # GRAINS, FLOUR & CEREALS
    # ════════════════════════════════════════════════════════════════════════════
    "whole_wheat_flour":     {"calories_100g": 340, "protein": 12.0,"carbs": 72.0, "fat": 2.5, "fiber": 12.0,"sugar": 0.5, "sodium": 2},
    "maida":                 {"calories_100g": 364, "protein": 10.0,"carbs": 76.0, "fat": 1.0, "fiber": 2.7, "sugar": 0.3, "sodium": 2},
    "chickpea_flour":        {"calories_100g": 387, "protein": 22.0,"carbs": 58.0, "fat": 6.7, "fiber": 10.8,"sugar": 11.0,"sodium": 64},
    "semolina":              {"calories_100g": 360, "protein": 13.0,"carbs": 73.0, "fat": 1.1, "fiber": 3.9, "sugar": 0.8, "sodium": 1},
    "quinoa_cooked":         {"calories_100g": 120, "protein": 4.4, "carbs": 21.0, "fat": 1.9, "fiber": 2.8, "sugar": 0.9, "sodium": 7},
    "quinoa_raw":            {"calories_100g": 368, "protein": 14.0,"carbs": 64.0, "fat": 6.1, "fiber": 7.0, "sugar": 0.9, "sodium": 5},

    # ════════════════════════════════════════════════════════════════════════════
    # NUTS & SEEDS
    # ════════════════════════════════════════════════════════════════════════════
    "almonds":               {"calories_100g": 579, "protein": 21.0,"carbs": 22.0, "fat": 50.0,"fiber": 12.0,"sugar": 4.0, "sodium": 1},
    "peanuts":               {"calories_100g": 567, "protein": 26.0,"carbs": 16.0, "fat": 49.0,"fiber": 8.5, "sugar": 4.0, "sodium": 18},
    "cashews":               {"calories_100g": 553, "protein": 18.0,"carbs": 30.0, "fat": 44.0,"fiber": 3.0, "sugar": 6.0, "sodium": 12},
    "walnuts":               {"calories_100g": 654, "protein": 15.0,"carbs": 14.0, "fat": 65.0,"fiber": 6.7, "sugar": 2.6, "sodium": 2},
    "pistachios":            {"calories_100g": 560, "protein": 20.0,"carbs": 28.0, "fat": 45.0,"fiber": 10.0,"sugar": 7.0, "sodium": 1},
    "flaxseeds":             {"calories_100g": 534, "protein": 18.0,"carbs": 29.0, "fat": 42.0,"fiber": 27.0,"sugar": 1.5, "sodium": 30},
    "chia_seeds":            {"calories_100g": 486, "protein": 17.0,"carbs": 42.0, "fat": 31.0,"fiber": 34.0,"sugar": 0.0, "sodium": 16},
    "sunflower_seeds":       {"calories_100g": 584, "protein": 21.0,"carbs": 20.0, "fat": 51.0,"fiber": 8.6, "sugar": 2.6, "sodium": 9},
    "pumpkin_seeds":         {"calories_100g": 559, "protein": 30.0,"carbs": 11.0, "fat": 49.0,"fiber": 6.0, "sugar": 1.4, "sodium": 7},
    "peanut_butter":         {"calories_100g": 588, "protein": 25.0,"carbs": 20.0, "fat": 50.0,"fiber": 6.0, "sugar": 9.0, "sodium": 440},

    # ════════════════════════════════════════════════════════════════════════════
    # SWEETS & DESSERTS
    # ════════════════════════════════════════════════════════════════════════════
    "gulab_jamun":           {"calories_100g": 380, "protein": 6.0, "carbs": 60.0, "fat": 13.0,"fiber": 0.5, "sugar": 45.0,"sodium": 120},
    "rasgulla":              {"calories_100g": 186, "protein": 4.0, "carbs": 40.0, "fat": 2.0, "fiber": 0.0, "sugar": 35.0,"sodium": 50},
    "kheer":                 {"calories_100g": 140, "protein": 4.0, "carbs": 22.0, "fat": 4.0, "fiber": 0.2, "sugar": 18.0,"sodium": 60},
    "ladoo":                 {"calories_100g": 420, "protein": 7.0, "carbs": 58.0, "fat": 18.0,"fiber": 2.0, "sugar": 35.0,"sodium": 80},
    "halwa":                 {"calories_100g": 270, "protein": 3.0, "carbs": 40.0, "fat": 11.0,"fiber": 1.0, "sugar": 28.0,"sodium": 90},
    "jalebi":                {"calories_100g": 360, "protein": 3.0, "carbs": 65.0, "fat": 10.0,"fiber": 0.5, "sugar": 50.0,"sodium": 100},
    "barfi":                 {"calories_100g": 390, "protein": 8.0, "carbs": 55.0, "fat": 16.0,"fiber": 0.5, "sugar": 42.0,"sodium": 85},
    "chocolate":             {"calories_100g": 535, "protein": 8.0, "carbs": 60.0, "fat": 30.0,"fiber": 3.4, "sugar": 48.0,"sodium": 79},
    "ice_cream":             {"calories_100g": 207, "protein": 3.5, "carbs": 24.0, "fat": 11.0,"fiber": 0.0, "sugar": 21.0,"sodium": 80},
    "rasmalai":              {"calories_100g": 220, "protein": 6.0, "carbs": 28.0, "fat": 9.0, "fiber": 0.0, "sugar": 24.0,"sodium": 80},
    "payasam":               {"calories_100g": 160, "protein": 4.5, "carbs": 26.0, "fat": 5.0, "fiber": 0.5, "sugar": 20.0,"sodium": 70},
    "shrikhand":             {"calories_100g": 210, "protein": 6.0, "carbs": 32.0, "fat": 7.0, "fiber": 0.0, "sugar": 28.0,"sodium": 50},
    "kulfi":                 {"calories_100g": 187, "protein": 4.5, "carbs": 20.0, "fat": 10.0,"fiber": 0.0, "sugar": 18.0,"sodium": 75},
}


def normalize_food_name(food_name: str) -> str:
    return food_name.strip().lower().replace(" ", "_")


def load_nutrition_data(csv_path=DEFAULT_CSV) -> dict:
    """
    Loads nutrition from 4 sources in order:
    1. Built-in Indian foods (hardcoded — most accurate, ICMR-based)
    2. Indian Food 2025 dataset (from Kaggle)
    3. Kaggle dataset (1600+ foods)
    4. Local CSV (custom foods)

    Layer 1 always wins — hardcoded verified data is never overwritten.
    """
    global NUTRITION_DB

    # ── Layer 1: Built-in Indian foods ────────────────────────────────────────
    NUTRITION_DB = dict(INDIAN_FOODS_DB)
    print(f"✅ Built-in Indian foods: {len(NUTRITION_DB)}")

    # ── Layer 2: Indian Food 2025 dataset ─────────────────────────────────────
    try:
        from modules.ifct_loader import load_indian_foods
        indian_foods = load_indian_foods()
        added = 0
        for key, nutrition in indian_foods.items():
            if key not in NUTRITION_DB:
                NUTRITION_DB[key] = nutrition
                added += 1
        print(f"✅ Added {added} new foods from Indian Food 2025 dataset")
    except Exception as e:
        print(f"⚠️  Indian food 2025 loader error: {e}")

    # ── Layer 3: Kaggle dataset ───────────────────────────────────────────────
    try:
        from modules.kaggle_loader import load_kaggle_foods
        kaggle_foods = load_kaggle_foods()
        added = 0
        for key, nutrition in kaggle_foods.items():
            if key not in NUTRITION_DB:
                NUTRITION_DB[key] = nutrition
                added += 1
        print(f"✅ Added {added} new foods from Kaggle dataset")
    except Exception as e:
        print(f"⚠️  Kaggle loader error: {e}")

    # ── Layer 4: Local CSV ────────────────────────────────────────────────────
    csv_path = Path(csv_path)
    if csv_path.exists():
        try:
            with open(csv_path, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    food = normalize_food_name(row["food"])
                    NUTRITION_DB[food] = {
                        "calories_100g": float(row["calories_100g"]),
                        "protein":       float(row["protein"]),
                        "carbs":         float(row["carbs"]),
                        "fat":           float(row["fat"]),
                        "fiber":         float(row.get("fiber", 0) or 0),
                        "sugar":         float(row.get("sugar", 0) or 0),
                        "sodium":        float(row.get("sodium", 0) or 0),
                    }
            print(f"✅ Local CSV loaded")
        except Exception as e:
            print(f"⚠️  CSV error: {e}")

    print(f"🍽️  Total foods in database: {len(NUTRITION_DB)}")
    return NUTRITION_DB


def get_food_nutrition(food_name: str) -> dict | None:
    """
    Returns nutrition data for a food name.

    Search order:
    1. Alias map        (egg → egg_boiled, anda → egg_boiled)
    2. Exact match      (egg_boiled)
    3. Underscore match (pav bhaji → pav_bhaji)
    4. Partial match    (chicken tikka masala → chicken_tikka)
    """
    if not NUTRITION_DB:
        raise RuntimeError("Nutrition DB not loaded. Call load_nutrition_data() first.")

    food_name = food_name.strip().lower()

    # Step 1: alias map (handles Hindi names + common variants)
    alias_key = FOOD_ALIAS_MAP.get(food_name)
    if alias_key and alias_key in NUTRITION_DB:
        return NUTRITION_DB[alias_key]

    # Step 2: exact match
    if food_name in NUTRITION_DB:
        return NUTRITION_DB[food_name]

    # Step 3: underscore match
    underscored = food_name.replace(" ", "_")
    if underscored in NUTRITION_DB:
        return NUTRITION_DB[underscored]

    # Step 4: partial match — prefer longer key matches (more specific)
    best_match = None
    best_len = 0
    food_clean = food_name.replace("_", " ")
    for key in NUTRITION_DB:
        key_clean = key.replace("_", " ")
        if food_clean in key_clean or key_clean in food_clean:
            if len(key_clean) > best_len:
                best_match = key
                best_len = len(key_clean)

    if best_match:
        return NUTRITION_DB[best_match]

    return None