import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

// ─────────────────────────────────────────────
// HELPERS — all unchanged from your original
// ─────────────────────────────────────────────
const rnd = v => Math.round(v || 0);
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

function greet() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
function timeAgo(iso) {
  if (!iso) return "";
  const m = (Date.now() - new Date(iso)) / 60000;
  return m < 2 ? "just now" : m < 60 ? `${rnd(m)}m ago` : `${rnd(m / 60)}h ago`;
}
function calcTDEE(w, h, age, gender, act) {
  const bmr = gender === "Male"
    ? 10 * w + 6.25 * h - 5 * age + 5
    : 10 * w + 6.25 * h - 5 * age - 161;
  const m = { Sedentary: 1.2, Lightly: 1.375, Moderately: 1.55, Very: 1.725, Extremely: 1.9 };
  return Math.round(bmr * (m[Object.keys(m).find(k => (act || "").includes(k)) || "Moderately"]));
}
function calcGoal(tdee, goal) {
  return goal === "weight_loss" ? tdee - 500 : goal === "muscle_gain" ? tdee + 300 : tdee;
}

// ─────────────────────────────────────────────
// MEAL SLOTS — unchanged
// ─────────────────────────────────────────────
const MEAL_SLOTS = [
  { key: "morning",       label: "Breakfast",     icon: "ti-sun",      hour: [0, 10] },
  { key: "morning_snack", label: "Morning Snack", icon: "ti-coffee",   hour: [10, 12] },
  { key: "lunch",         label: "Lunch",         icon: "ti-sun-high", hour: [12, 15] },
  { key: "evening_snack", label: "Snack",         icon: "ti-apple",    hour: [15, 19] },
  { key: "dinner",        label: "Dinner",        icon: "ti-moon",     hour: [19, 24] },
];
function getCurrentSlot() {
  const h = new Date().getHours();
  return MEAL_SLOTS.find(s => h >= s.hour[0] && h < s.hour[1])?.key || "dinner";
}

// ─────────────────────────────────────────────
// CALORIE RING — SVG, monochrome 2025 style
// ─────────────────────────────────────────────
function CalorieRing({ calories, goal }) {
  const pct   = clamp(calories / Math.max(goal, 1), 0, 1);
  const R     = 46;
  const circ  = 2 * Math.PI * R;
  const offset = circ * (1 - pct);
  return (
    <svg viewBox="0 0 110 110" width="110" height="110" role="img"
      aria-label={`${rnd(pct * 100)}% of calorie goal reached`}>
      <circle cx="55" cy="55" r={R} fill="none" stroke="#F2F2F7" strokeWidth="9" />
      <circle cx="55" cy="55" r={R} fill="none"
        stroke="#1C1C1E" strokeWidth="9" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 55 55)"
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />
      <text x="55" y="51" textAnchor="middle" fontSize="18" fontWeight="700"
        fill="#1C1C1E" fontFamily="Inter,sans-serif">
        {rnd(pct * 100)}%
      </text>
      <text x="55" y="64" textAnchor="middle" fontSize="10" fontWeight="500"
        fill="#8E8E93" fontFamily="Inter,sans-serif">
        of goal
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────
// WEEK CHART — SVG bars, monochrome
// ─────────────────────────────────────────────
function WeekChart({ weekly, calGoal }) {
  const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const DAY_LBLS = ["M", "T", "W", "T", "F", "S", "S"];
  const todayIdx = (new Date().getDay() + 6) % 7; // 0=Mon

  const vals = Array.isArray(weekly)
    ? weekly.slice(0, 7).map(d => typeof d === "number" ? d : d?.calories || 0)
    : DAY_KEYS.map(k => weekly?.[k] || 0);

  const maxVal = Math.max(...vals, calGoal, 1);
  const BAR_MAX_H = 80; // px in viewBox

  return (
    <svg viewBox="0 0 300 100" width="100%" style={{ overflow: "visible" }}
      role="img" aria-label="Weekly calorie bar chart">
      {/* Goal line */}
      <line
        x1="0" y1={BAR_MAX_H - (calGoal / maxVal) * BAR_MAX_H}
        x2="300" y2={BAR_MAX_H - (calGoal / maxVal) * BAR_MAX_H}
        stroke="#D1D1D6" strokeWidth="1" strokeDasharray="4 3" />

      {vals.map((v, i) => {
        const barH   = v > 0 ? Math.max((v / maxVal) * BAR_MAX_H, 4) : 4;
        const x      = i * 44 + 2;
        const isToday = i === todayIdx;
        const hasDat  = v > 0;
        return (
          <g key={i}>
            <rect
              x={x} y={BAR_MAX_H - barH} width="34" height={barH} rx="6"
              fill={isToday ? "#1C1C1E" : hasDat ? "#E8E8ED" : "#F2F2F7"} />
            {hasDat && (
              <text x={x + 17} y={BAR_MAX_H - barH - 5}
                textAnchor="middle" fontSize="8" fontWeight="500"
                fill={isToday ? "#1C1C1E" : "#8E8E93"}
                fontFamily="Inter,sans-serif">
                {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
              </text>
            )}
            <text x={x + 17} y="96"
              textAnchor="middle" fontSize="10" fontWeight={isToday ? "600" : "400"}
              fill={isToday ? "#1C1C1E" : "#8E8E93"}
              fontFamily="Inter,sans-serif">
              {DAY_LBLS[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────
// MAIN DASHBOARD
// State + all API calls 100% unchanged
// ─────────────────────────────────────────────
export default function Dashboard() {
  const nav = useNavigate();

  // ── State — unchanged ──
  const [log,      setLog]      = useState([]);
  const [tot,      setTot]      = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 });
  const [streak,   setStreak]   = useState(0);
  const [score,    setScore]    = useState(null);
  const [reco,     setReco]     = useState("");
  const [loading,  setLoading]  = useState(true);
  const [glasses,  setGlasses]  = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [weekly,   setWeekly]   = useState(null);

  // ── Profile — unchanged ──
  const [profile, setProfile] = useState(() => {
    const p = JSON.parse(localStorage.getItem("foodmood_user") || "{}");
    return {
      name: "Friend", weight_kg: 70, height_cm: 170, age: 25,
      gender: "Male", activity_level: "Moderately Active (exercise 3-5 days)",
      goal: "maintenance", calGoal: 0, tdee: 0, ...p,
    };
  });

  const { name, weight_kg, height_cm, age, gender, activity_level, goal } = profile;
  const tdee    = calcTDEE(weight_kg, height_cm, age, gender, activity_level);
  const calGoal = profile.calGoal || calcGoal(tdee, goal) || 2000;
  const tgt = {
    calories: calGoal,
    protein:  goal === "muscle_gain" ? 180 : goal === "weight_loss" ? 120 : 140,
    carbs:    goal === "weight_loss" ? 150 : 220,
    fat:      goal === "weight_loss" ? 50  : 60,
    fiber:    30,
  };

  const currentSlot = getCurrentSlot();
  const firstName   = (name || "Friend").split(" ")[0];
  const calPct      = clamp(tot.calories / tgt.calories * 100, 0, 100);
  const calLeft     = Math.max(0, rnd(tgt.calories - tot.calories));

  // ── Load — unchanged ──
  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      try {
        const pr = await api.get("/profile");
        if (pr.data && Object.keys(pr.data).length > 0) {
          const existing = JSON.parse(localStorage.getItem("foodmood_user") || "{}");
          localStorage.setItem("foodmood_user", JSON.stringify({ ...existing, ...pr.data }));
          setProfile(p => ({ ...p, ...pr.data }));
        }
      } catch (e) {
        console.warn("Profile load failed — using localStorage:", e?.message);
      }

      const r = await api.get("/daily-log");
      const d = r.data;
      setLog(d.meals || []);
      setTot(d.totals || tot);
      setStreak(d.streak || 0);
      if (d.health_score !== undefined) setScore(d.health_score);
      if (d.recommendation) setReco(d.recommendation);
      if (d.weekly) setWeekly(d.weekly);
    } catch {
      // Demo fallback — used when backend is offline
      const demo = [
        { id: 1, food_name: "Oats + Banana",    meal_type: "morning",       calories: 380, protein: 12, carbs: 68, fat: 6,  fiber: 6, sugar: 18, sodium: 140, logged_at: new Date(Date.now() - 7200000).toISOString() },
        { id: 2, food_name: "Chicken Rice Bowl", meal_type: "lunch",         calories: 520, protein: 44, carbs: 52, fat: 10, fiber: 3, sugar: 2,  sodium: 420, logged_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, food_name: "Whey Shake",        meal_type: "evening_snack", calories: 180, protein: 28, carbs: 10, fat: 2,  fiber: 0, sugar: 6,  sodium: 180, logged_at: new Date(Date.now() - 900000).toISOString() },
      ];
      setLog(demo);
      setTot({ calories: 1080, protein: 84, carbs: 130, fat: 18, fiber: 9, sugar: 26, sodium: 740 });
      setStreak(5);
      setScore(78);
      setReco("You're 48g short on protein. Add a high-protein dinner — grilled paneer, chicken, or eggs will close the gap. Carbs and fat are on track.");
      setWeekly([1750, 1900, 1650, 2050, 1800, 1080, 0]);
    }
    setLoading(false);
  }

  // ── Delete — unchanged ──
  async function del(id) {
    try { await api.delete(`/log/${id}`); } catch {}
    const updated = log.filter(m => m.id !== id);
    setLog(updated);
    setTot(updated.reduce((a, m) => ({
      calories: a.calories + (m.calories || 0),
      protein:  a.protein  + (m.protein  || 0),
      carbs:    a.carbs    + (m.carbs    || 0),
      fat:      a.fat      + (m.fat      || 0),
      fiber:    a.fiber    + (m.fiber    || 0),
      sugar:    a.sugar    + (m.sugar    || 0),
      sodium:   a.sodium   + (m.sodium   || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }));
  }

  function getMealsForSlot(k) { return log.filter(m => (m.meal_type || m.meal_time) === k); }
  function getSlotCals(k)     { return getMealsForSlot(k).reduce((s, m) => s + (m.calories || 0), 0); }

  // ── Smart order message ──
  const proteinLeft = Math.max(0, rnd(tgt.protein - tot.protein));
  const orderMsg    = proteinLeft > 30
    ? `You need ${proteinLeft}g more protein today`
    : calLeft > 400
    ? `${calLeft} kcal remaining — find a balanced meal`
    : calLeft > 0
    ? "Almost at your goal — order a light option"
    : "Goal hit! Treat yourself tonight";

  // ── Score breakdown ──
  const proteinBonus  = Math.min(rnd(tot.protein * 0.8), 25);
  const fiberBonus    = Math.min(rnd(tot.fiber   * 1.2), 15);
  const sugarPenalty  = Math.min(rnd((tot.sugar  || 0) * 1.5), 20);
  const sodiumPenalty = Math.min(rnd((tot.sodium || 0) * 0.02), 10);
  const scoreLabel    = score === null ? null : score >= 70 ? "Healthy" : score >= 45 ? "Average" : "Needs work";

  // ─────────────────────────────────────────────
  // STYLES
  // Night mode: swap T (light) and D (dark) values.
  // To enable night mode later, pass `dark` prop or
  // read from localStorage("foodmood_dark").
  // ─────────────────────────────────────────────

  /*
   * NIGHT MODE TOKENS (use these when dark mode is enabled):
   * bg:        #000000
   * surface:   #1C1C1E
   * surface2:  #2C2C2E
   * text:      #FFFFFF
   * textSub:   #8E8E93
   * sep:       #38383A
   * green:     #30D158
   * blue:      #0A84FF
   * red:       #FF453A
   * amber:     #FF9F0A
   */

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

  const s = {
    page: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      background: C.bg,
      minHeight: "100vh",
      paddingBottom: 80,
      color: C.text,
      maxWidth: 430,
      margin: "0 auto",
      WebkitFontSmoothing: "antialiased",
    },
    card: {
      background: C.surface,
      borderRadius: 20,
      padding: "18px 18px",
      margin: "0 16px 4px",
    },
    secLbl: {
      fontSize: 11, fontWeight: 600, color: C.textSub,
      letterSpacing: "0.6px", textTransform: "uppercase",
      padding: "20px 20px 10px",
    },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #F2F2F7; }
        ::-webkit-scrollbar { display: none; }
        .dash-page { -webkit-overflow-scrolling: touch; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeUp 0.3s ease both; }
        .meal-row-hover:hover { background: #F8F8F8; border-radius: 12px; }
        .tappable { cursor: pointer; transition: opacity 0.15s; }
        .tappable:active { opacity: 0.6; }
      `}</style>

      <div style={s.page} className="dash-page">

        {/* ── HEADER ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "56px 20px 8px" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 2 }}>
              {greet()}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: -0.5 }}>
              {firstName}
            </div>
          </div>
          {/* Avatar — initials, no emoji */}
          <div
            className="tappable"
            onClick={() => nav("/profile")}
            style={{
              width: 40, height: 40, borderRadius: "50%",
              background: C.accent,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 600, color: "#fff", letterSpacing: 0.5,
            }}
          >
            {firstName.slice(0, 2).toUpperCase()}
          </div>
        </div>

        {/* ── CALORIE HERO CARD ── */}
        <div style={s.secLbl}>Today</div>
        <div style={{ ...s.card, display: "flex", alignItems: "center", gap: 24, padding: "22px 22px 18px" }}>
          {/* Ring */}
          <div style={{ flexShrink: 0 }}>
            <CalorieRing calories={tot.calories} goal={calGoal} />
          </div>
          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 44, fontWeight: 700, color: C.text, letterSpacing: -2, lineHeight: 1 }}>
              {loading ? "—" : rnd(tot.calories).toLocaleString()}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.textSub, marginTop: 3 }}>
              of {calGoal.toLocaleString()} kcal
            </div>
            <div style={{
              display: "inline-block", marginTop: 12,
              fontSize: 13, fontWeight: 600,
              color: calLeft === 0 ? C.green : C.text,
              background: calLeft === 0 ? "#F0FFF4" : C.surface2,
              borderRadius: 8, padding: "4px 10px",
            }}>
              {calLeft === 0 ? "Goal reached" : `${calLeft.toLocaleString()} remaining`}
            </div>
            {/* Goal info */}
            <div style={{ fontSize: 11, color: C.textSub, marginTop: 8 }}>
              {goal.replace("_", " ")} · {rnd(weight_kg)} kg
            </div>
          </div>
        </div>

        {/* ── MACRO CELLS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, margin: "4px 16px" }}>
          {[
            { val: `${rnd(tot.protein)}g`, lbl: "Protein", pct: clamp(tot.protein / tgt.protein * 100, 0, 100) },
            { val: `${rnd(tot.carbs)}g`,   lbl: "Carbs",   pct: clamp(tot.carbs   / tgt.carbs   * 100, 0, 100) },
            { val: `${rnd(tot.fat)}g`,     lbl: "Fat",     pct: clamp(tot.fat     / tgt.fat     * 100, 0, 100), over: tot.fat > tgt.fat },
          ].map(m => (
            <div key={m.lbl} style={{ background: C.surface, borderRadius: 16, padding: "14px 12px" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: m.over ? C.red : C.text, letterSpacing: -0.5, lineHeight: 1 }}>
                {m.val}
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: C.textSub, marginTop: 4 }}>{m.lbl}</div>
              <div style={{ height: 3, background: C.surface2, borderRadius: 99, marginTop: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${m.pct}%`, background: m.over ? C.red : C.accent, borderRadius: 99, transition: "width 1s" }} />
              </div>
            </div>
          ))}
        </div>

        {/* ── HEALTH SCORE ── */}
        {score !== null && (
          <>
            <div style={s.secLbl}>Health Score</div>
            <div style={{ ...s.card, padding: "20px 20px" }}>
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 52, fontWeight: 700, color: C.text, letterSpacing: -2, lineHeight: 1 }}>
                    {score}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.textSub, marginTop: 2 }}>out of 100</div>
                  <div style={{
                    display: "inline-block", marginTop: 10,
                    fontSize: 12, fontWeight: 600,
                    color: score >= 70 ? C.green : score >= 45 ? C.amber : C.red,
                    background: score >= 70 ? "#F0FFF4" : score >= 45 ? "#FFF8F0" : "#FFF0F0",
                    borderRadius: 8, padding: "4px 10px",
                  }}>
                    {scoreLabel}
                  </div>
                </div>
                {/* Factor grid */}
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { name: "Protein", val: `+${proteinBonus}`, color: C.green },
                    { name: "Fiber",   val: `+${fiberBonus}`,   color: C.green },
                    { name: "Sugar",   val: `−${sugarPenalty}`, color: C.red },
                    { name: "Sodium",  val: `−${sodiumPenalty}`,color: C.amber },
                  ].map(f => (
                    <div key={f.name} style={{ background: C.surface2, borderRadius: 12, padding: "10px 12px" }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: C.textSub }}>{f.name}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: f.color, letterSpacing: -0.5, marginTop: 4 }}>
                        {f.val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Score bar */}
              <div style={{ marginTop: 18, height: 4, background: C.surface2, borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${score}%`,
                  background: score >= 70 ? C.green : score >= 45 ? C.amber : C.red,
                  borderRadius: 99, transition: "width 1.2s cubic-bezier(.4,0,.2,1)",
                }} />
              </div>
            </div>
          </>
        )}

        {/* ── WEEKLY CHART ── */}
        {weekly && (
          <>
            <div style={s.secLbl}>This Week</div>
            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Calories</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.textSub }}>
                  Goal {calGoal.toLocaleString()}
                </div>
              </div>
              <WeekChart weekly={weekly} calGoal={calGoal} />
              {/* Streak bar */}
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 6 }}>
                  {streak} day streak
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {Array.from({ length: 7 }).map((_, i) => {
                    const todayIdx = (new Date().getDay() + 6) % 7;
                    const isToday  = i === todayIdx;
                    const isDone   = i < todayIdx && streak >= (todayIdx - i);
                    return (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 99,
                        background: isToday ? C.green : isDone ? C.accent : C.surface2,
                        transition: "background 0.3s",
                      }} />
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── SMART ORDER CTA — dark card ── */}
        <div style={{ height: 8 }} />
        <div
          className="tappable"
          onClick={() => nav("/places")}
          style={{
            margin: "0 16px",
            background: C.accent,
            borderRadius: 20, padding: "20px 20px",
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 6 }}>
              {proteinLeft > 30 ? "Need more protein" : "Order food"}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: -0.3, lineHeight: 1.25, maxWidth: 210 }}>
              {orderMsg}
            </div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <i className="ti ti-arrow-right" style={{ fontSize: 20, color: "#fff" }} aria-hidden="true" />
          </div>
        </div>

        {/* ── MEALS ── */}
        <div style={s.secLbl}>Meals</div>
        <div style={s.card}>
          {MEAL_SLOTS.map((slot, si) => {
            const meals    = getMealsForSlot(slot.key);
            const slotCals = getSlotCals(slot.key);
            const isNow    = slot.key === currentSlot;
            const hasMeals = meals.length > 0;
            const isOpen   = expanded === slot.key;

            return (
              <div key={slot.key} className="fade-in" style={{ animationDelay: `${si * 0.04}s` }}>
                {/* Slot row */}
                <div
                  className="meal-row-hover tappable"
                  onClick={() => hasMeals && setExpanded(isOpen ? null : slot.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "12px 8px",
                    borderBottom: si < MEAL_SLOTS.length - 1 && !isOpen
                      ? `0.5px solid ${C.sep}` : "none",
                  }}
                >
                  {/* Icon box */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: isNow ? C.accent : hasMeals ? C.surface2 : C.surface2,
                  }}>
                    <i className={`ti ${slot.icon}`}
                      style={{ fontSize: 20, color: isNow ? "#fff" : hasMeals ? C.green : C.textSub }}
                      aria-hidden="true" />
                  </div>

                  {/* Label */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: C.text,
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      {slot.label}
                      {/* Live dot for current slot */}
                      {isNow && (
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }} />
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>
                      {hasMeals
                        ? meals.map(m => m.food_name).join(", ").slice(0, 30) + (meals.map(m => m.food_name).join(", ").length > 30 ? "…" : "")
                        : isNow ? "Not logged yet" : "—"}
                    </div>
                  </div>

                  {/* Calories */}
                  {hasMeals && (
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>
                      {rnd(slotCals)}
                    </div>
                  )}

                  {/* Add button */}
                  <button
                    onClick={e => { e.stopPropagation(); nav(`/scanner?slot=${slot.key}`); }}
                    style={{
                      width: 30, height: 30, borderRadius: 9, border: "none", cursor: "pointer",
                      background: isNow ? C.accent : C.surface2,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <i className="ti ti-plus"
                      style={{ fontSize: 16, color: isNow ? "#fff" : C.textSub }}
                      aria-hidden="true" />
                  </button>
                </div>

                {/* Expanded meal detail */}
                {isOpen && hasMeals && (
                  <div style={{ background: C.surface2, borderRadius: 12, margin: "4px 0 8px", overflow: "hidden" }}>
                    {meals.map((m, mi) => (
                      <div key={m.id} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "10px 14px",
                        borderBottom: mi < meals.length - 1 ? `0.5px solid ${C.sep}` : "none",
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.food_name}</div>
                          <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>
                            {rnd(m.protein)}g P · {rnd(m.carbs)}g C · {rnd(m.fat)}g F · {timeAgo(m.logged_at)}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{rnd(m.calories)}</div>
                          <button
                            onClick={() => del(m.id)}
                            style={{
                              background: "#FFF0F0", border: "none", borderRadius: 8,
                              padding: "4px 9px", color: C.red, fontSize: 11,
                              cursor: "pointer", fontFamily: "inherit",
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── DAILY GOALS ── */}
        <div style={s.secLbl}>Daily Goals</div>
        <div style={s.card}>
          {[
            { lbl: "Hit protein goal",   cur: rnd(tot.protein),  goal: rnd(tgt.protein),  unit: "g",    done: tot.protein  >= tgt.protein },
            { lbl: "Reach calorie goal", cur: rnd(tot.calories), goal: rnd(tgt.calories), unit: " kcal",done: tot.calories >= tgt.calories },
            { lbl: "Log 3 meals",        cur: log.length,         goal: 3,                 unit: "",     done: log.length   >= 3 },
            { lbl: "Drink 8 glasses",    cur: glasses,            goal: 8,                 unit: "",     done: glasses      >= 8 },
          ].map((m, i, arr) => (
            <div key={m.lbl} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 0",
              borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none",
            }}>
              {/* Check circle */}
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: m.done ? C.green : "transparent",
                border: m.done ? `none` : `1.5px solid ${C.sep}`,
              }}>
                {m.done && <i className="ti ti-check" style={{ fontSize: 12, color: "#fff" }} aria-hidden="true" />}
              </div>
              {/* Label */}
              <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: m.done ? C.green : C.text }}>
                {m.lbl}
              </div>
              {/* Value */}
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub }}>
                {m.cur}/{m.goal}{m.unit}
              </div>
            </div>
          ))}
        </div>

        {/* ── HYDRATION ── */}
        <div style={s.secLbl}>Hydration</div>
        <div style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Water</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.blue }}>{glasses} of 8 glasses</div>
          </div>
          {/* Tap segments to log */}
          <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="tappable"
                onClick={() => setGlasses(g => g === i + 1 ? i : i + 1)}
                style={{
                  flex: 1, height: 6, borderRadius: 99,
                  background: i < glasses ? C.blue : C.surface2,
                  transition: "background 0.2s",
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 11, color: C.textSub, marginTop: 8 }}>
            Tap to log a glass
          </div>
        </div>

        {/* ── AI COACH ── */}
        {reco && (
          <>
            <div style={s.secLbl}>Coach</div>
            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>FoodMood AI</div>
                <div style={{
                  fontSize: 12, fontWeight: 600,
                  color: score >= 70 ? C.green : score >= 45 ? C.amber : C.red,
                }}>
                  {scoreLabel}
                </div>
              </div>
              <div style={{ fontSize: 14, color: "#3C3C43", lineHeight: 1.65 }}>{reco}</div>
            </div>
          </>
        )}

        {/* ── BOTTOM NAV ── */}
        <div style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 430,
          height: 66,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: `0.5px solid ${C.sep}`,
          display: "flex", alignItems: "center", justifyContent: "space-around",
          paddingBottom: "env(safe-area-inset-bottom)",
          zIndex: 100,
        }}>
          {[
            { icon: "ti-home",    label: "Home",    to: "/",        active: true },
            { icon: "ti-scan",    label: "Scan",    to: "/scanner", active: false },
            { icon: "ti-map-pin", label: "Places",  to: "/places",  active: false },
            { icon: "ti-user",    label: "Profile", to: "/profile", active: false },
          ].map(item => (
            <div
              key={item.label}
              className="tappable"
              onClick={() => nav(item.to)}
              style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 3, padding: "6px 16px",
              }}
            >
              <i className={`ti ${item.icon}`}
                style={{ fontSize: 22, color: item.active ? C.accent : C.textSub }}
                aria-hidden="true" />
              <span style={{
                fontSize: 9, fontWeight: 500, letterSpacing: "0.3px",
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