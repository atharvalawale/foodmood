import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/client";

// ─────────────────────────────────────────────
// COLOUR TOKENS — same as Dashboard/Login/Onboarding
// ─────────────────────────────────────────────
const C = {
  bg:       "#F2F2F7",
  surface:  "#FFFFFF",
  surface2: "#F2F2F7",
  text:     "#1C1C1E",
  textSub:  "#8E8E93",
  sep:      "#E5E5EA",
  accent:   "#1C1C1E",
  green:    "#30D158",
  blue:     "#007AFF",
  red:      "#FF3B30",
  amber:    "#FF9500",
};

const rnd = v => Math.round(v || 0);

const MEAL_SLOTS = [
  { key: "morning",       label: "Breakfast",     icon: "ti-sun"      },
  { key: "morning_snack", label: "Morning Snack", icon: "ti-coffee"   },
  { key: "lunch",         label: "Lunch",         icon: "ti-sun-high" },
  { key: "evening_snack", label: "Snack",         icon: "ti-apple"    },
  { key: "dinner",        label: "Dinner",        icon: "ti-moon"     },
];

const UNITS = ["serving", "piece", "g", "ml", "cup", "bowl", "tbsp", "tsp"];

function getCurrentSlot() {
  const h = new Date().getHours();
  if (h < 10) return "morning";
  if (h < 12) return "morning_snack";
  if (h < 15) return "lunch";
  if (h < 19) return "evening_snack";
  return "dinner";
}

// ─────────────────────────────────────────────
// RESULT CARD — shown after image/text/barcode
// All logic unchanged
// ─────────────────────────────────────────────
function ResultCard({ result, mealType, onClear }) {
  const [qty,  setQty]  = useState(1);
  const [unit, setUnit] = useState("serving");
  const [meal, setMeal] = useState(mealType || getCurrentSlot());
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const m        = result.nutrition || result;
  const calories = rnd(m.total_calories ?? m.calories ?? 0);
  const protein  = rnd(m.total_protein  ?? m.protein  ?? 0);
  const carbs    = rnd(m.total_carbs    ?? m.carbs    ?? 0);
  const fat      = rnd(m.total_fat      ?? m.fat      ?? 0);
  const score    = result.health_score;
  const scoreColor = score >= 70 ? C.green : score >= 40 ? C.amber : C.red;

  async function log() {
    setBusy(true);
    try {
      await api.post("/log", {
        food_name: result.food_name || result.name || "Food",
        quantity: qty, unit, meal_type: meal, meal_time: meal,
        calories, protein, carbs, fat,
        sugar:  rnd(m.total_sugar  ?? m.sugar  ?? 0),
        sodium: rnd(m.total_sodium ?? m.sodium ?? 0),
        fiber:  rnd(m.total_fiber  ?? m.fiber  ?? 0),
      });
      setDone(true);
    } catch {}
    setBusy(false);
  }

  return (
    <div style={{
      background: C.surface, borderRadius: 20,
      marginTop: 12, overflow: "hidden",
      border: `0.5px solid ${C.sep}`,
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px",
        borderBottom: `0.5px solid ${C.sep}`,
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>
            {result.food_name || result.name || "Food detected"}
          </div>
          {result.verification_status && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "2px 8px",
              borderRadius: 6, background: C.surface2, color: C.textSub,
            }}>
              {result.verification_status}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {score !== undefined && (
            <div style={{
              fontSize: 12, fontWeight: 700, color: scoreColor,
              background: `${scoreColor}18`, borderRadius: 8, padding: "3px 10px",
            }}>
              {score}/100
            </div>
          )}
          <button onClick={onClear} style={{
            background: C.surface2, border: "none", borderRadius: 8,
            width: 28, height: 28, cursor: "pointer",
            fontSize: 14, color: C.textSub,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>
      </div>

      {/* Macros grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: C.sep }}>
        {[
          { l: "Calories", v: calories, u: "kcal", c: C.amber },
          { l: "Protein",  v: protein,  u: "g",    c: C.blue  },
          { l: "Carbs",    v: carbs,    u: "g",    c: C.green },
          { l: "Fat",      v: fat,      u: "g",    c: C.red   },
        ].map(n => (
          <div key={n.l} style={{ background: C.surface, padding: "14px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: n.c, fontFamily: "'Inter', monospace" }}>
              {n.v}
            </div>
            <div style={{ fontSize: 9, color: C.textSub, marginTop: 2 }}>{n.u}</div>
            <div style={{ fontSize: 9, color: C.textSub, marginTop: 1 }}>{n.l}</div>
          </div>
        ))}
      </div>

      {/* Nutri-Score + allergens — only present for barcode/packaged-food results */}
      {(result.nutriscore || (result.allergens && result.allergens.length > 0)) && (
        <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {result.nutriscore && result.nutriscore !== "?" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 800, color: "#fff",
                background: { A: "#1E8E3E", B: "#7CB342", C: C.amber, D: "#F4511E", E: C.red }[result.nutriscore] || C.textSub,
              }}>
                {result.nutriscore}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Nutri-Score {result.nutriscore}</div>
                <div style={{ fontSize: 11, color: C.textSub }}>Independent nutrition grade from Open Food Facts</div>
              </div>
            </div>
          )}
          {result.allergens && result.allergens.length > 0 && (
            <div style={{
              background: "#FFF0F0", border: `0.5px solid ${C.red}33`,
              borderRadius: 10, padding: "8px 12px",
              fontSize: 12, color: C.red,
            }}>
              ⚠️ Contains: {result.allergens.map(a => a.replace("en:", "").replace(/-/g, " ")).join(", ")}
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr", gap: 8, marginBottom: 12 }}>
          {[
            {
              label: "Qty",
              el: <input type="number" value={qty} min="0.25" step="0.25"
                onChange={e => setQty(+e.target.value)}
                style={{ width: "100%", background: C.surface2, border: `0.5px solid ${C.sep}`, borderRadius: 10, padding: "10px 8px", fontSize: 14, color: C.text, outline: "none", textAlign: "center", fontFamily: "'Inter', sans-serif" }} />
            },
            {
              label: "Unit",
              el: <select value={unit} onChange={e => setUnit(e.target.value)}
                style={{ width: "100%", background: C.surface2, border: `0.5px solid ${C.sep}`, borderRadius: 10, padding: "10px 8px", fontSize: 13, color: C.text, outline: "none", fontFamily: "'Inter', sans-serif" }}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            },
            {
              label: "Meal",
              el: <select value={meal} onChange={e => setMeal(e.target.value)}
                style={{ width: "100%", background: C.surface2, border: `0.5px solid ${C.sep}`, borderRadius: 10, padding: "10px 8px", fontSize: 13, color: C.text, outline: "none", fontFamily: "'Inter', sans-serif" }}>
                {MEAL_SLOTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.textSub, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                {f.label}
              </div>
              {f.el}
            </div>
          ))}
        </div>

        {done
          ? <div style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: C.green, padding: "10px 0" }}>
              Added to log
            </div>
          : <button onClick={log} disabled={busy} style={{
              width: "100%", padding: "14px 0",
              background: C.accent, color: "#fff",
              border: "none", borderRadius: 14,
              fontWeight: 700, fontSize: 14,
              cursor: busy ? "not-allowed" : "pointer",
              fontFamily: "'Inter', sans-serif",
              opacity: busy ? 0.6 : 1,
            }}>
              {busy ? "Logging…" : `Add to ${MEAL_SLOTS.find(s => s.key === meal)?.label}`}
            </button>
        }
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SEARCH TAB — all logic unchanged
// ─────────────────────────────────────────────
function SearchTab({ defaultSlot }) {
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [quantity,  setQuantity]  = useState(1);
  const [unit,      setUnit]      = useState("serving");
  const [mealType,  setMealType]  = useState(defaultSlot || getCurrentSlot());
  const [nutrition, setNutrition] = useState(null);
  const [calculating, setCalc]   = useState(false);
  const [logging,   setLogging]   = useState(false);
  const [logged,    setLogged]    = useState(false);
  const [error,     setError]     = useState("");
  const [dietWarning, setDietWarning] = useState("");

  const searchTimer = useRef(null);
  const inputRef    = useRef(null);

  const QUICK = ["Chapati", "Dal tadka", "Egg boiled", "White rice", "Chai", "Banana", "Chicken grilled", "Oats", "Paneer", "Curd"];

  useEffect(() => {
    if (query.length < 3) { setResults([]); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true); setError("");
      try {
        const res = await api.get(`/foods/search?q=${encodeURIComponent(query)}`);
        setResults(res.data.results || []);
      } catch (e) {
        setError("Search failed. Is the backend running?");
        setResults([]);
      } finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  useEffect(() => {
    if (!selected) return;
    const q = parseFloat(quantity) || 1;
    if (q <= 0) return;
    if (unit === "g" || unit === "ml") {
      const factor = q / 100;
      setNutrition({
        food_key: selected.key, grams: q, quantity: q, unit,
        calories: Math.round((selected.calories_per_100g || 0) * factor * 10) / 10,
        protein:  Math.round((selected.protein_per_100g  || 0) * factor * 10) / 10,
        carbs:    Math.round((selected.carbs_per_100g    || 0) * factor * 10) / 10,
        fat:      Math.round((selected.fat_per_100g      || 0) * factor * 10) / 10,
        fiber: 0, sugar: 0, sodium: 0,
      });
      setCalc(false); return;
    }
    let cancelled = false;
    const calc = async () => {
      setCalc(true);
      try {
        const res = await api.post("/foods/calculate", { food_key: selected.key, quantity: q, unit });
        if (!cancelled) {
          const calcCal100   = res.data.grams > 0 ? (res.data.calories / res.data.grams) * 100 : 0;
          const searchCal100 = selected.calories_per_100g || 0;
          const diff         = Math.abs(calcCal100 - searchCal100);
          if (searchCal100 > 0 && diff > searchCal100 * 0.2) {
            const factor = res.data.grams / 100;
            setNutrition({
              ...res.data,
              calories: Math.round(searchCal100 * factor * 10) / 10,
              protein:  Math.round((selected.protein_per_100g || 0) * factor * 10) / 10,
              carbs:    Math.round((selected.carbs_per_100g   || 0) * factor * 10) / 10,
              fat:      Math.round((selected.fat_per_100g     || 0) * factor * 10) / 10,
            });
          } else { setNutrition(res.data); }
        }
      } catch {
        if (!cancelled && selected.calories_per_100g) {
          const factor = (q * 100) / 100;
          setNutrition({
            food_key: selected.key, grams: q * 100, quantity: q, unit,
            calories: Math.round(selected.calories_per_100g * factor * 10) / 10,
            protein:  Math.round((selected.protein_per_100g || 0) * factor * 10) / 10,
            carbs:    Math.round((selected.carbs_per_100g   || 0) * factor * 10) / 10,
            fat:      Math.round((selected.fat_per_100g     || 0) * factor * 10) / 10,
            fiber: 0, sugar: 0, sodium: 0,
          });
        }
      } finally { if (!cancelled) setCalc(false); }
    };
    calc();
    return () => { cancelled = true; };
  }, [selected, quantity, unit]);

  async function handleLog() {
    if (!nutrition) return;
    setLogging(true);
    setDietWarning("");
    try {
      const res = await api.post("/log", {
        food_name: selected.name,
        calories:  nutrition.calories, protein: nutrition.protein,
        carbs:     nutrition.carbs,    fat:     nutrition.fat,
        fiber:     nutrition.fiber  || 0,
        sugar:     nutrition.sugar  || 0,
        sodium:    nutrition.sodium || 0,
        quantity:  parseFloat(quantity), unit,
        meal_type: mealType, meal_time: mealType,
      });
      if (res.data.warnings) setDietWarning(res.data.warnings);
      setLogged(true);
      setTimeout(() => {
        setLogged(false); setSelected(null); setNutrition(null);
        setQuery(""); setResults([]); setQuantity(1); setUnit("serving");
        inputRef.current?.focus();
      }, 1800);
    } catch { setError("Failed to log. Try again."); }
    setLogging(false);
  }

  return (
    <div>
      {/* Meal selector */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 16,
        overflowX: "auto", paddingBottom: 4,
      }}>
        {MEAL_SLOTS.map(s => (
          <button key={s.key} onClick={() => setMealType(s.key)} style={{
            flexShrink: 0, padding: "7px 14px",
            borderRadius: 20, border: "none", cursor: "pointer",
            background: mealType === s.key ? C.accent : C.surface,
            color: mealType === s.key ? "#fff" : C.textSub,
            fontSize: 12, fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            transition: "all 0.15s",
            border: `0.5px solid ${mealType === s.key ? C.accent : C.sep}`,
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {!selected && (
        <>
          {/* Search input */}
          <div style={{
            display: "flex", alignItems: "center",
            background: C.surface,
            border: `0.5px solid ${C.sep}`,
            borderRadius: 14, padding: "12px 16px",
            gap: 10, marginBottom: 14,
          }}>
            <i className="ti ti-search" style={{ fontSize: 18, color: C.textSub }} aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search 1,700+ Indian foods…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
              style={{
                flex: 1, border: "none", outline: "none",
                fontSize: 15, color: C.text,
                background: "transparent",
                fontFamily: "'Inter', sans-serif",
              }}
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults([]); }}
                style={{ background: "none", border: "none", color: C.textSub, cursor: "pointer", fontSize: 16 }}>
                ✕
              </button>
            )}
          </div>

          {query.length > 0 && query.length < 3 && (
            <div style={{ textAlign: "center", color: C.textSub, fontSize: 13, padding: "6px 0" }}>
              Keep typing…
            </div>
          )}

          {searching && (
            <div style={{ textAlign: "center", color: C.textSub, fontSize: 13, padding: "8px 0" }}>
              Searching…
            </div>
          )}

          {error && (
            <div style={{
              background: "#FFF0F0", border: `0.5px solid ${C.red}33`,
              borderRadius: 12, padding: "10px 14px",
              fontSize: 13, color: C.red, marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div style={{
              background: C.surface, borderRadius: 16,
              overflow: "hidden", border: `0.5px solid ${C.sep}`,
              marginBottom: 14,
            }}>
              {results.map((food, i) => (
                <button
                  key={i}
                  onClick={() => { setSelected(food); setQuantity(1); setUnit("serving"); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "13px 16px",
                    border: "none",
                    borderBottom: i < results.length - 1 ? `0.5px solid ${C.sep}` : "none",
                    background: C.surface, cursor: "pointer", textAlign: "left",
                    fontFamily: "'Inter', sans-serif",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surface2}
                  onMouseLeave={e => e.currentTarget.style.background = C.surface}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{food.name}</div>
                    <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>
                      {food.category} · {food.calories_per_100g} kcal/100g
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{food.calories_per_serving}</div>
                      <div style={{ fontSize: 10, color: C.textSub }}>kcal/serving</div>
                    </div>
                    <i className="ti ti-chevron-right" style={{ fontSize: 16, color: C.textSub }} aria-hidden="true" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {query.length >= 3 && !searching && results.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                No results for "{query}"
              </div>
              <div style={{ fontSize: 12, color: C.textSub }}>Try: chapati, dal, egg, chai…</div>
            </div>
          )}

          {/* Quick picks */}
          {query.length === 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10 }}>
                Quick picks
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {QUICK.map(f => (
                  <button key={f} onClick={() => setQuery(f)} style={{
                    padding: "8px 14px",
                    background: C.surface,
                    border: `0.5px solid ${C.sep}`,
                    borderRadius: 20,
                    fontSize: 13, fontWeight: 500, color: C.text,
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    transition: "border-color 0.12s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.sep}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Selected food detail */}
      {selected && (
        <div>
          <button onClick={() => { setSelected(null); setNutrition(null); }} style={{
            background: C.surface, border: `0.5px solid ${C.sep}`,
            borderRadius: 10, padding: "8px 14px",
            color: C.text, fontSize: 13, cursor: "pointer",
            marginBottom: 16, fontFamily: "'Inter', sans-serif", fontWeight: 500,
          }}>
            ← Back
          </button>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: -0.5, marginBottom: 4 }}>
              {selected.name}
            </div>
            <div style={{ fontSize: 12, color: C.textSub }}>
              {selected.category} · {selected.calories_per_100g} kcal / 100g
            </div>
          </div>

          {/* Nutrition display */}
          <div style={{ background: C.surface, borderRadius: 20, padding: 20, marginBottom: 12 }}>
            {calculating
              ? <div style={{ textAlign: "center", color: C.textSub, fontSize: 13, padding: "20px 0" }}>Calculating…</div>
              : nutrition
                ? (
                  <>
                    <div style={{ textAlign: "center", marginBottom: 18 }}>
                      <div style={{ fontSize: 56, fontWeight: 700, color: C.text, letterSpacing: -2, lineHeight: 1, fontFamily: "'Inter', sans-serif" }}>
                        {rnd(nutrition.calories)}
                      </div>
                      <div style={{ fontSize: 12, color: C.textSub, marginTop: 4, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                        kcal · {rnd(nutrition.grams)}g
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-around", paddingTop: 14, borderTop: `0.5px solid ${C.sep}` }}>
                      {[
                        { l: "Protein", v: nutrition.protein, c: C.blue  },
                        { l: "Carbs",   v: nutrition.carbs,   c: C.green },
                        { l: "Fat",     v: nutrition.fat,     c: C.red   },
                        { l: "Fiber",   v: nutrition.fiber,   c: C.amber },
                      ].map(m => (
                        <div key={m.l} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: m.c }}>{rnd(m.v)}g</div>
                          <div style={{ fontSize: 10, color: C.textSub, marginTop: 3 }}>{m.l}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )
                : <div style={{ textAlign: "center", color: C.textSub, fontSize: 13, padding: "20px 0" }}>
                    Select quantity below
                  </div>
            }
          </div>

          {/* Quantity controls */}
          <div style={{ background: C.surface, borderRadius: 20, padding: 18, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 14 }}>
              Quantity
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <button
                onClick={() => setQuantity(q => Math.round(Math.max(0.25, (parseFloat(q) || 1) - 0.25) * 100) / 100)}
                style={{
                  width: 46, height: 46, borderRadius: 14,
                  background: C.surface2, border: `0.5px solid ${C.sep}`,
                  fontSize: 24, fontWeight: 700, cursor: "pointer",
                  color: C.text, display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >−</button>
              <input
                type="number" value={quantity} min="0.25" step="0.25"
                onChange={e => setQuantity(parseFloat(e.target.value) || 1)}
                style={{
                  flex: 1, textAlign: "center", fontSize: 28, fontWeight: 700,
                  border: `0.5px solid ${C.sep}`, borderRadius: 14, padding: "10px",
                  color: C.text, outline: "none", background: C.surface2,
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <button
                onClick={() => setQuantity(q => Math.round(((parseFloat(q) || 1) + 0.25) * 100) / 100)}
                style={{
                  width: 46, height: 46, borderRadius: 14,
                  background: C.surface2, border: `0.5px solid ${C.sep}`,
                  fontSize: 24, fontWeight: 700, cursor: "pointer",
                  color: C.text, display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >+</button>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10 }}>
              Unit
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {UNITS.map(u => (
                <button key={u} onClick={() => setUnit(u)} style={{
                  padding: "8px 14px", borderRadius: 20,
                  border: `0.5px solid ${unit === u ? C.accent : C.sep}`,
                  background: unit === u ? C.accent : C.surface,
                  color: unit === u ? "#fff" : C.textSub,
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  transition: "all 0.12s",
                }}>{u}</button>
              ))}
            </div>
          </div>

          {/* Meal selector */}
          <div style={{ background: C.surface, borderRadius: 20, padding: 18, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10 }}>
              Meal
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {MEAL_SLOTS.map(s => (
                <button key={s.key} onClick={() => setMealType(s.key)} style={{
                  padding: "8px 14px", borderRadius: 20,
                  border: `0.5px solid ${mealType === s.key ? C.accent : C.sep}`,
                  background: mealType === s.key ? C.accent : C.surface,
                  color: mealType === s.key ? "#fff" : C.textSub,
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  transition: "all 0.12s",
                }}>{s.label}</button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              background: "#FFF0F0", border: `0.5px solid ${C.red}33`,
              borderRadius: 12, padding: "10px 14px",
              fontSize: 13, color: C.red, marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          {dietWarning && (
            <div style={{
              background: "#FFF8E6", border: `0.5px solid ${C.amber}55`,
              borderRadius: 12, padding: "10px 14px",
              fontSize: 13, color: C.amber, marginBottom: 12,
            }}>
              {dietWarning}
            </div>
          )}

          <button onClick={handleLog} disabled={logging || !nutrition || logged} style={{
            width: "100%", padding: "15px 0",
            background: logged ? C.green : C.accent,
            color: "#fff", border: "none", borderRadius: 14,
            fontSize: 15, fontWeight: 700,
            cursor: logging ? "not-allowed" : "pointer",
            fontFamily: "'Inter', sans-serif",
            transition: "all 0.2s",
          }}>
            {logged ? "Added!" : logging ? "Logging…" : `Add to ${MEAL_SLOTS.find(s => s.key === mealType)?.label}`}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// CUSTOM FOOD FORM — all logic unchanged
// ─────────────────────────────────────────────
function CustomFoodForm({ onSuccess }) {
  const [form, setForm] = useState({
    food_name: "", calories_100g: "", protein: "", carbs: "", fat: "",
    fiber: "", sugar: "", sodium: "", serving_grams: "100", brand: "",
  });
  const [saving, setSaving] = useState(false);
  const [done,   setDone]   = useState(false);
  const [error,  setError]  = useState("");
  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const fields = [
    { key: "calories_100g", label: "Calories",     unit: "kcal/100g", required: true  },
    { key: "protein",       label: "Protein",      unit: "g/100g",    required: false },
    { key: "carbs",         label: "Carbs",        unit: "g/100g",    required: false },
    { key: "fat",           label: "Fat",          unit: "g/100g",    required: false },
    { key: "fiber",         label: "Fiber",        unit: "g/100g",    required: false },
    { key: "sugar",         label: "Sugar",        unit: "g/100g",    required: false },
    { key: "sodium",        label: "Sodium",       unit: "mg/100g",   required: false },
    { key: "serving_grams", label: "Serving Size", unit: "grams",     required: false },
  ];

  async function handleSave() {
    if (!form.food_name.trim()) { setError("Food name is required"); return; }
    if (!form.calories_100g)    { setError("Calories is required");  return; }
    setSaving(true); setError("");
    try {
      await api.post("/foods/custom", {
        food_name:     form.food_name.trim(),
        calories_100g: parseFloat(form.calories_100g) || 0,
        protein:       parseFloat(form.protein)       || 0,
        carbs:         parseFloat(form.carbs)         || 0,
        fat:           parseFloat(form.fat)           || 0,
        fiber:         parseFloat(form.fiber)         || 0,
        sugar:         parseFloat(form.sugar)         || 0,
        sodium:        parseFloat(form.sodium)        || 0,
        serving_grams: parseFloat(form.serving_grams) || 100,
        brand:         form.brand.trim(),
      });
      setDone(true);
      setTimeout(() => { onSuccess && onSuccess(); }, 1500);
    } catch { setError("Failed to save. Try again."); }
    setSaving(false);
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: -0.5, marginBottom: 4 }}>
          Add Custom Food
        </div>
        <div style={{ fontSize: 13, color: C.textSub }}>
          Add any food from a nutrition label — saved to your account
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 6, letterSpacing: "0.3px" }}>
          Food Name *
        </div>
        <input type="text" placeholder="e.g. Amul Butter, Protein Bar…"
          value={form.food_name} onChange={e => update("food_name", e.target.value)}
          style={{
            width: "100%", background: C.surface2, border: `0.5px solid ${C.sep}`,
            borderRadius: 12, padding: "13px 16px", fontSize: 15, color: C.text,
            outline: "none", fontFamily: "'Inter', sans-serif",
          }} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 6, letterSpacing: "0.3px" }}>
          Brand (optional)
        </div>
        <input type="text" placeholder="e.g. Amul, Britannia…"
          value={form.brand} onChange={e => update("brand", e.target.value)}
          style={{
            width: "100%", background: C.surface2, border: `0.5px solid ${C.sep}`,
            borderRadius: 12, padding: "13px 16px", fontSize: 15, color: C.text,
            outline: "none", fontFamily: "'Inter', sans-serif",
          }} />
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10 }}>
        Nutrition per 100g
      </div>

      <div style={{ background: C.surface, borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
        {fields.map((f, i) => (
          <div key={f.key} style={{
            display: "flex", alignItems: "center",
            padding: "13px 16px",
            borderBottom: i < fields.length - 1 ? `0.5px solid ${C.sep}` : "none",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                {f.label}{f.required ? " *" : ""}
              </div>
              <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>{f.unit}</div>
            </div>
            <input type="number" placeholder="0" value={form[f.key]}
              onChange={e => update(f.key, e.target.value)}
              style={{
                width: 80, textAlign: "right",
                background: C.surface2, border: `0.5px solid ${C.sep}`,
                borderRadius: 8, padding: "8px 10px",
                fontSize: 15, fontWeight: 700, color: C.text,
                outline: "none", fontFamily: "'Inter', sans-serif",
              }} />
          </div>
        ))}
      </div>

      {/* Preview */}
      {form.calories_100g && (
        <div style={{
          background: C.surface, borderRadius: 16,
          padding: 16, marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10 }}>
            Preview — per serving ({form.serving_grams || 100}g)
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { l: "Cal",     v: Math.round((parseFloat(form.calories_100g) || 0) * (parseFloat(form.serving_grams) || 100) / 100), c: C.amber },
              { l: "Protein", v: Math.round((parseFloat(form.protein)       || 0) * (parseFloat(form.serving_grams) || 100) / 100), c: C.blue  },
              { l: "Carbs",   v: Math.round((parseFloat(form.carbs)         || 0) * (parseFloat(form.serving_grams) || 100) / 100), c: C.green },
              { l: "Fat",     v: Math.round((parseFloat(form.fat)           || 0) * (parseFloat(form.serving_grams) || 100) / 100), c: C.red   },
            ].map(m => (
              <div key={m.l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: m.c }}>{m.v}</div>
                <div style={{ fontSize: 10, color: C.textSub, marginTop: 2 }}>{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          background: "#FFF0F0", border: `0.5px solid ${C.red}33`,
          borderRadius: 12, padding: "10px 14px",
          fontSize: 13, color: C.red, marginBottom: 14,
        }}>
          {error}
        </div>
      )}

      <button onClick={handleSave} disabled={saving || done} style={{
        width: "100%", padding: "15px 0",
        background: done ? C.green : C.accent,
        color: "#fff", border: "none", borderRadius: 14,
        fontSize: 15, fontWeight: 700,
        cursor: saving ? "not-allowed" : "pointer",
        fontFamily: "'Inter', sans-serif",
        transition: "all 0.2s",
      }}>
        {done ? "Food Added!" : saving ? "Saving…" : "Save Food"}
      </button>

      <div style={{ fontSize: 12, color: C.textSub, textAlign: "center", marginTop: 10 }}>
        This food will appear in search results immediately
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN SCANNER — all logic unchanged
// ─────────────────────────────────────────────
export default function Scanner() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultSlot = searchParams.get("slot") || getCurrentSlot();

  const [tab,        setTab]        = useState("search");
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [imgFile,    setImgFile]    = useState(null);
  const [imgPrev,    setImgPrev]    = useState(null);
  const [text,       setText]       = useState("");
  const [barcode,    setBarcode]    = useState("");
  const [transcript, setTranscript] = useState("");
  const [listening,  setListening]  = useState(false);
  const fileRef = useRef();

  const TABS = [
    { id: "search",  label: "Search"   },
    { id: "image",   label: "Photo"    },
    { id: "text",    label: "Text"     },
    { id: "barcode", label: "Barcode"  },
    { id: "voice",   label: "Voice"    },
    { id: "custom",  label: "Add Food" },
  ];

  function switchTab(id) { setTab(id); setResult(null); setError(""); }
  function handleImg(e) {
    const f = e.target.files[0]; if (!f) return;
    setImgFile(f); setImgPrev(URL.createObjectURL(f));
    setResult(null); setError("");
  }
  async function analyzeImage() {
    if (!imgFile) return; setLoading(true); setError("");
    try {
      const fd = new FormData(); fd.append("file", imgFile);
      const r = await api.post("/analyze-image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(r.data);
    } catch { setError("Image analysis failed. Check Gemini API key."); }
    setLoading(false);
  }
  async function analyzeText() {
    if (!text.trim()) return; setLoading(true); setError("");
    try { const r = await api.post("/analyze-text", { text }); setResult(r.data); }
    catch { setError("Text analysis failed."); }
    setLoading(false);
  }
  async function lookupBarcode() {
    if (!barcode.trim()) return; setLoading(true); setError("");
    try { const r = await api.get(`/barcode/${barcode}`); setResult(r.data); }
    catch { setError("Barcode not found. Try: 3017620422003"); }
    setLoading(false);
  }
  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("Speech not supported. Use Chrome."); return; }
    const r = new SR(); r.lang = "en-IN";
    r.onresult = e => { setTranscript(e.results[0][0].transcript); setListening(false); };
    r.onerror  = () => { setError("Mic error."); setListening(false); };
    r.onend    = () => setListening(false);
    r.start(); setListening(true);
  }
  async function analyzeVoice() {
    if (!transcript.trim()) return; setLoading(true); setError("");
    try { const r = await api.post("/analyze-text", { text: transcript }); setResult(r.data); }
    catch { setError("Voice analysis failed."); }
    setLoading(false);
  }

  const btnDisabled = disabled => ({
    width: "100%", marginTop: 12, padding: "14px 0",
    background: disabled ? C.surface2 : C.accent,
    color: disabled ? C.textSub : "#fff",
    border: "none", borderRadius: 14,
    fontWeight: 700, fontSize: 15,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "'Inter', sans-serif",
    transition: "all 0.15s",
  });

  const inputStyle = {
    width: "100%", background: C.surface,
    border: `0.5px solid ${C.sep}`,
    borderRadius: 14, padding: "13px 16px",
    fontSize: 15, color: C.text, outline: "none",
    fontFamily: "'Inter', sans-serif",
    boxSizing: "border-box",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${C.bg}; }
        .scanner {
          font-family: 'Inter', -apple-system, sans-serif;
          background: ${C.bg};
          min-height: 100vh;
          padding-bottom: 90px;
          color: ${C.text};
          max-width: 430px;
          margin: 0 auto;
          -webkit-font-smoothing: antialiased;
        }
        textarea, input, select { font-family: 'Inter', sans-serif; }
        input::placeholder, textarea::placeholder { color: ${C.textSub}; opacity: 0.6; }
        select option { background: ${C.surface}; color: ${C.text}; }
        ::-webkit-scrollbar { display: none; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeUp 0.3s ease both; }
      `}</style>

      <div className="scanner">

        {/* ── HEADER ── */}
        <div style={{
          background: C.surface,
          borderBottom: `0.5px solid ${C.sep}`,
          padding: "52px 20px 0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <button onClick={() => nav("/dashboard")} style={{
              background: C.surface2, border: `0.5px solid ${C.sep}`,
              borderRadius: 10, width: 36, height: 36,
              cursor: "pointer", color: C.text,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <i className="ti ti-arrow-left" style={{ fontSize: 18 }} aria-hidden="true" />
            </button>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>
              {tab === "search"
                ? `Add to ${MEAL_SLOTS.find(s => s.key === defaultSlot)?.label}`
                : "Scan Food"}
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => switchTab(t.id)} style={{
                flexShrink: 0, padding: "10px 16px",
                background: "transparent", border: "none",
                borderBottom: tab === t.id
                  ? `2px solid ${C.accent}`
                  : "2px solid transparent",
                cursor: "pointer",
                fontWeight: tab === t.id ? 600 : 400,
                fontSize: 13,
                fontFamily: "'Inter', sans-serif",
                whiteSpace: "nowrap",
                color: tab === t.id ? C.text : C.textSub,
                transition: "all 0.15s",
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ padding: "16px 16px" }}>

          {tab === "search" && <SearchTab defaultSlot={defaultSlot} />}

          {tab === "image" && (
            <>
              <div
                onClick={() => !imgPrev && fileRef.current.click()}
                style={{
                  border: `0.5px dashed ${imgPrev ? "transparent" : C.sep}`,
                  borderRadius: 16, overflow: "hidden",
                  cursor: imgPrev ? "default" : "pointer",
                  background: imgPrev ? "transparent" : C.surface,
                }}
              >
                {imgPrev
                  ? (
                    <div style={{ position: "relative" }}>
                      <img src={imgPrev} alt="food" style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block", borderRadius: 16 }} />
                      <button onClick={e => { e.stopPropagation(); fileRef.current.click(); }} style={{
                        position: "absolute", bottom: 10, right: 10,
                        background: "rgba(0,0,0,0.6)", color: "#fff",
                        border: "none", borderRadius: 99, padding: "6px 12px",
                        fontSize: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif",
                      }}>
                        Change
                      </button>
                    </div>
                  )
                  : (
                    <div style={{ padding: "40px 20px", textAlign: "center" }}>
                      <i className="ti ti-camera" style={{ fontSize: 40, color: C.textSub, display: "block", marginBottom: 10 }} aria-hidden="true" />
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                        Upload a food photo
                      </div>
                      <div style={{ fontSize: 12, color: C.textSub }}>JPG · PNG · WEBP</div>
                    </div>
                  )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImg} />
              <button onClick={analyzeImage} disabled={!imgFile || loading} style={btnDisabled(!imgFile || loading)}>
                {loading ? "Analyzing with Gemini…" : "Analyse Photo"}
              </button>
            </>
          )}

          {tab === "text" && (
            <>
              <textarea
                value={text} onChange={e => setText(e.target.value)}
                placeholder={"Describe your meal…\n\nExamples:\n• 2 eggs and 1 chapati\n• 1 bowl dal with 2 rotis\n• Oats with banana and honey"}
                style={{
                  ...inputStyle,
                  minHeight: 160, resize: "none",
                  lineHeight: 1.65, padding: "14px 16px",
                }}
              />
              <div style={{ fontSize: 12, color: C.textSub, marginTop: 6 }}>
                Include quantities for better accuracy
              </div>
              <button onClick={analyzeText} disabled={!text.trim() || loading} style={btnDisabled(!text.trim() || loading)}>
                {loading ? "Analysing…" : "Analyse Text"}
              </button>
            </>
          )}

          {tab === "barcode" && (
            <>
              <div style={{
                background: C.surface, borderRadius: 16,
                padding: "32px 20px", textAlign: "center", marginBottom: 16,
              }}>
                <i className="ti ti-barcode" style={{ fontSize: 48, color: C.textSub, display: "block", marginBottom: 12 }} aria-hidden="true" />
                <div style={{ fontSize: 14, color: C.textSub }}>Enter the barcode number</div>
              </div>
              <input
                type="text" value={barcode}
                onChange={e => setBarcode(e.target.value)}
                onKeyDown={e => e.key === "Enter" && lookupBarcode()}
                placeholder="e.g. 3017620422003"
                maxLength={14}
                style={{
                  ...inputStyle,
                  textAlign: "center", fontSize: 20,
                  letterSpacing: 3, fontWeight: 600,
                }}
              />
              <div style={{ fontSize: 12, color: C.textSub, textAlign: "center", marginTop: 6 }}>
                Test barcode: 3017620422003
              </div>
              <button onClick={lookupBarcode} disabled={!barcode.trim() || loading} style={btnDisabled(!barcode.trim() || loading)}>
                {loading ? "Looking up…" : "Lookup Barcode"}
              </button>
            </>
          )}

          {tab === "voice" && (
            <>
              <div style={{ textAlign: "center", padding: "32px 0 16px" }}>
                <button
                  onClick={listening ? undefined : startListening}
                  style={{
                    width: 80, height: 80, borderRadius: 24,
                    border: `2px solid ${listening ? C.red : C.sep}`,
                    background: listening ? "#FFF0F0" : C.surface,
                    fontSize: 32, cursor: "pointer",
                    margin: "0 auto 12px", display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <i className={`ti ${listening ? "ti-microphone" : "ti-microphone"}`}
                    style={{ fontSize: 32, color: listening ? C.red : C.textSub }}
                    aria-hidden="true" />
                </button>
                <div style={{ fontSize: 13, color: listening ? C.red : C.textSub, fontWeight: listening ? 600 : 400 }}>
                  {listening ? "Listening… speak now" : "Tap to speak"}
                </div>
              </div>
              {transcript && (
                <div style={{ background: C.surface, borderRadius: 14, padding: "14px 16px", marginBottom: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>
                    You said
                  </div>
                  <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5 }}>{transcript}</div>
                </div>
              )}
              {transcript && (
                <button onClick={analyzeVoice} disabled={loading} style={btnDisabled(loading)}>
                  {loading ? "Analysing…" : "Analyse Speech"}
                </button>
              )}
            </>
          )}

          {/* Error */}
          {error && tab !== "search" && (
            <div style={{
              marginTop: 12, padding: "12px 14px",
              background: "#FFF0F0", border: `0.5px solid ${C.red}33`,
              borderRadius: 12, fontSize: 13, color: C.red,
            }}>
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{
              marginTop: 12, padding: "20px",
              background: C.surface, border: `0.5px solid ${C.sep}`,
              borderRadius: 14, textAlign: "center",
            }}>
              <div style={{ fontSize: 13, color: C.textSub }}>Analysing your food…</div>
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <ResultCard result={result} mealType={defaultSlot} onClear={() => setResult(null)} />
          )}

          {/* Tips */}
          {!result && !loading && !error && tab !== "search" && tab !== "custom" && (
            <div style={{
              marginTop: 16, padding: "14px 16px",
              background: C.surface, border: `0.5px solid ${C.sep}`,
              borderRadius: 14,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 8 }}>
                Tip
              </div>
              {[
                { tab: "image",   tip: "Take photo in good lighting for best results" },
                { tab: "text",    tip: "Include quantities: '2 eggs, 1 cup rice'" },
                { tab: "barcode", tip: "Works with all packaged foods worldwide" },
                { tab: "voice",   tip: "Say clearly: 'I had 2 rotis with dal'" },
              ].filter(t => t.tab === tab).map(t => (
                <div key={t.tip} style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{t.tip}</div>
              ))}
            </div>
          )}

          {tab === "custom" && <CustomFoodForm onSuccess={() => switchTab("search")} />}
        </div>

        {/* ── BOTTOM NAV ── */}
        <div style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 430, height: 66,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: `0.5px solid ${C.sep}`,
          display: "flex", alignItems: "center", justifyContent: "space-around",
          paddingBottom: "env(safe-area-inset-bottom)", zIndex: 100,
        }}>
          {[
            { icon: "ti-home",    label: "Home",    to: "/dashboard" },
            { icon: "ti-scan",    label: "Scan",    to: "/scanner",  active: true },
            { icon: "ti-map-pin", label: "Places",  to: "/places"   },
            { icon: "ti-user",    label: "Profile", to: "/profile"  },
          ].map(item => (
            <div key={item.label} onClick={() => nav(item.to)} style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3, padding: "6px 16px", cursor: "pointer",
            }}>
              <i className={`ti ${item.icon}`}
                style={{ fontSize: 22, color: item.active ? C.accent : C.textSub }}
                aria-hidden="true" />
              <span style={{
                fontSize: 9, fontWeight: item.active ? 600 : 400,
                letterSpacing: "0.3px",
                color: item.active ? C.accent : C.textSub,
              }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}