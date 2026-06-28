import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

// ─── Demo meal plan data ───────────────────────────────────────────────────────
const PLANS = [
  {
    id: "lean",
    name: "Lean & Strong",
    desc: "High protein, calorie-controlled. Designed for fat loss while preserving muscle.",
    kcal: 1800,
    protein: 150,
    carbs: 160,
    fat: 55,
    price: 69,
    period: "week",
    tag: "Most popular",
    tagColor: C.green,
  },
  {
    id: "balanced",
    name: "Balanced Performance",
    desc: "Optimal macros for active lifestyles. Sustains energy through training and work.",
    kcal: 2200,
    protein: 130,
    carbs: 240,
    fat: 70,
    price: 79,
    period: "week",
    tag: null,
  },
  {
    id: "muscle",
    name: "Muscle Builder",
    desc: "Caloric surplus with high protein. Supports lean muscle gain and recovery.",
    kcal: 2600,
    protein: 180,
    carbs: 290,
    fat: 75,
    price: 89,
    period: "week",
    tag: "Best for gains",
    tagColor: C.blue,
  },
];

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEMO_MEALS = {
  Mon: [
    { slot: "Breakfast", name: "Greek Yogurt Bowl",       kcal: 380, protein: 28, carbs: 42, fat: 8,  verified: true  },
    { slot: "Lunch",     name: "Grilled Chicken Wrap",    kcal: 520, protein: 44, carbs: 38, fat: 14, verified: true  },
    { slot: "Snack",     name: "Protein Bar",             kcal: 220, protein: 20, carbs: 22, fat: 6,  verified: true  },
    { slot: "Dinner",    name: "Salmon with Quinoa",      kcal: 580, protein: 48, carbs: 52, fat: 16, verified: true  },
  ],
  Tue: [
    { slot: "Breakfast", name: "Overnight Oats",          kcal: 360, protein: 18, carbs: 58, fat: 7,  verified: true  },
    { slot: "Lunch",     name: "Turkey Rice Bowl",        kcal: 490, protein: 42, carbs: 44, fat: 10, verified: true  },
    { slot: "Snack",     name: "Cottage Cheese & Fruit",  kcal: 180, protein: 16, carbs: 18, fat: 3,  verified: false },
    { slot: "Dinner",    name: "Beef Stir Fry",           kcal: 560, protein: 46, carbs: 38, fat: 18, verified: true  },
  ],
  Wed: [
    { slot: "Breakfast", name: "Egg White Omelette",      kcal: 280, protein: 24, carbs: 12, fat: 9,  verified: true  },
    { slot: "Lunch",     name: "Tuna Pasta Salad",        kcal: 510, protein: 40, carbs: 52, fat: 12, verified: true  },
    { slot: "Snack",     name: "Mixed Nuts",              kcal: 190, protein: 6,  carbs: 8,  fat: 16, verified: false },
    { slot: "Dinner",    name: "Chicken Breast & Veggies",kcal: 520, protein: 52, carbs: 28, fat: 14, verified: true  },
  ],
  Thu: [
    { slot: "Breakfast", name: "Protein Pancakes",        kcal: 420, protein: 32, carbs: 48, fat: 10, verified: true  },
    { slot: "Lunch",     name: "Lentil Soup & Bread",     kcal: 440, protein: 24, carbs: 62, fat: 8,  verified: true  },
    { slot: "Snack",     name: "Apple & Peanut Butter",   kcal: 200, protein: 6,  carbs: 24, fat: 10, verified: false },
    { slot: "Dinner",    name: "Shrimp & Brown Rice",     kcal: 530, protein: 44, carbs: 56, fat: 10, verified: true  },
  ],
  Fri: [
    { slot: "Breakfast", name: "Smoothie Bowl",           kcal: 340, protein: 20, carbs: 52, fat: 6,  verified: true  },
    { slot: "Lunch",     name: "Grilled Fish Tacos",      kcal: 500, protein: 38, carbs: 46, fat: 16, verified: true  },
    { slot: "Snack",     name: "Hummus & Veggies",        kcal: 160, protein: 6,  carbs: 18, fat: 8,  verified: false },
    { slot: "Dinner",    name: "Turkey Meatballs & Pasta",kcal: 580, protein: 48, carbs: 58, fat: 14, verified: true  },
  ],
  Sat: [
    { slot: "Breakfast", name: "Avocado Toast & Eggs",    kcal: 440, protein: 22, carbs: 38, fat: 22, verified: true  },
    { slot: "Lunch",     name: "Chicken Caesar Salad",    kcal: 420, protein: 36, carbs: 22, fat: 20, verified: true  },
    { slot: "Snack",     name: "Whey Protein Shake",      kcal: 200, protein: 24, carbs: 14, fat: 4,  verified: true  },
    { slot: "Dinner",    name: "Beef Tenderloin & Veggies",kcal:560, protein: 52, carbs: 18, fat: 28, verified: true  },
  ],
  Sun: [
    { slot: "Breakfast", name: "French Toast & Berries",  kcal: 400, protein: 18, carbs: 62, fat: 10, verified: false },
    { slot: "Lunch",     name: "Vegetable Curry & Rice",  kcal: 480, protein: 16, carbs: 72, fat: 12, verified: true  },
    { slot: "Snack",     name: "Greek Yogurt",            kcal: 140, protein: 14, carbs: 12, fat: 3,  verified: true  },
    { slot: "Dinner",    name: "Roast Chicken & Potatoes",kcal: 560, protein: 48, carbs: 42, fat: 18, verified: true  },
  ],
};

export default function MealPlan() {
  const nav = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState("lean");
  const [selectedDay,  setSelectedDay]  = useState("Mon");
  const [subscribed,   setSubscribed]   = useState(false);
  const [swapping,     setSwapping]     = useState(null);

  const plan  = PLANS.find(p => p.id === selectedPlan);
  const meals = DEMO_MEALS[selectedDay] || [];
  const dayTotals = meals.reduce((a, m) => ({
    kcal:    a.kcal    + m.kcal,
    protein: a.protein + m.protein,
    carbs:   a.carbs   + m.carbs,
    fat:     a.fat     + m.fat,
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

  const s = {
    page: {
      fontFamily: "'Inter', -apple-system, sans-serif",
      background: C.bg, minHeight: "100vh",
      paddingBottom: 90, color: C.text,
      maxWidth: 430, margin: "0 auto",
      WebkitFontSmoothing: "antialiased",
    },
    card: {
      background: C.surface, borderRadius: 20,
      padding: "18px 18px", margin: "0 16px 8px",
      border: `0.5px solid ${C.sep}`,
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #F2F2F7; }
        ::-webkit-scrollbar { display: none; }
        .tappable { cursor: pointer; transition: opacity 0.15s; }
        .tappable:active { opacity: 0.6; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeUp 0.3s ease both; }
      `}</style>

      <div style={s.page}>

        {/* ── HEADER ── */}
        <div style={{
          background: C.surface, borderBottom: `0.5px solid ${C.sep}`,
          padding: "52px 20px 14px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <button onClick={() => nav("/dashboard")} style={{
              background: C.surface2, border: `0.5px solid ${C.sep}`,
              borderRadius: 10, width: 36, height: 36, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <i className="ti ti-arrow-left" style={{ fontSize: 18, color: C.text }} aria-hidden="true" />
            </button>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Meal Plans</div>
              <div style={{ fontSize: 12, color: C.textSub }}>
                Personalised weekly nutrition
              </div>
            </div>
          </div>
        </div>

        {/* ── HERO BANNER ── */}
        <div style={{
          margin: "12px 16px",
          background: C.accent, borderRadius: 20,
          padding: "22px 20px",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>
            AI Nutrition Platform
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: -0.4, marginBottom: 8, lineHeight: 1.2 }}>
            Your weekly plan.<br />Built around your goals.
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: 16 }}>
            Every meal verified for macros. Skip, swap, or pause anytime. Delivered to your door.
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { val: "100%", lbl: "Macro verified" },
              { val: "7",    lbl: "Days covered"   },
              { val: "4",    lbl: "Meals per day"  },
            ].map(s => (
              <div key={s.lbl}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: -0.5 }}>{s.val}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PLAN SELECTOR ── */}
        <div style={s.secLbl}>Choose Your Plan</div>
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
          {PLANS.map(p => {
            const active = selectedPlan === p.id;
            return (
              <div
                key={p.id}
                className="tappable"
                onClick={() => setSelectedPlan(p.id)}
                style={{
                  background: C.surface,
                  border: `0.5px solid ${active ? C.accent : C.sep}`,
                  borderRadius: 16, padding: "16px 16px",
                  transition: "border-color 0.15s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{p.name}</div>
                      {p.tag && (
                        <span style={{
                          fontSize: 10, fontWeight: 600, color: p.tagColor,
                          background: `${p.tagColor}18`, borderRadius: 6, padding: "2px 8px",
                        }}>
                          {p.tag}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.5 }}>{p.desc}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: -0.5 }}>
                      €{p.price}
                    </div>
                    <div style={{ fontSize: 11, color: C.textSub }}>/ week</div>
                  </div>
                </div>

                {/* Macro pills */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[
                    { lbl: `${p.kcal} kcal`, color: C.accent },
                    { lbl: `${p.protein}g protein`, color: C.blue  },
                    { lbl: `${p.carbs}g carbs`,   color: C.green },
                    { lbl: `${p.fat}g fat`,       color: C.amber },
                  ].map(t => (
                    <span key={t.lbl} style={{
                      fontSize: 11, fontWeight: 500,
                      color: t.color, background: `${t.color}10`,
                      border: `0.5px solid ${t.color}30`,
                      borderRadius: 6, padding: "3px 8px",
                    }}>
                      {t.lbl}
                    </span>
                  ))}
                </div>

                {/* Radio */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    border: `2px solid ${active ? C.accent : C.sep}`,
                    background: active ? C.accent : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {active && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: active ? C.text : C.textSub }}>
                    {active ? "Selected" : "Select this plan"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── WEEKLY OVERVIEW ── */}
        <div style={s.secLbl}>This Week's Menu</div>

        {/* Day selector */}
        <div style={{ display: "flex", gap: 6, padding: "0 16px", overflowX: "auto", marginBottom: 12 }}>
          {WEEK_DAYS.map(day => {
            const active = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                style={{
                  flexShrink: 0, padding: "7px 14px",
                  borderRadius: 20, border: "none",
                  background: active ? C.accent : C.surface,
                  color: active ? "#fff" : C.textSub,
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  cursor: "pointer", fontFamily: "'Inter', sans-serif",
                  border: `0.5px solid ${active ? C.accent : C.sep}`,
                  transition: "all 0.15s",
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Day totals */}
        <div style={{ ...s.card, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
          {[
            { lbl: "Calories", val: dayTotals.kcal,    unit: "kcal", color: C.text  },
            { lbl: "Protein",  val: dayTotals.protein, unit: "g",    color: C.blue  },
            { lbl: "Carbs",    val: dayTotals.carbs,   unit: "g",    color: C.green },
            { lbl: "Fat",      val: dayTotals.fat,     unit: "g",    color: C.amber },
          ].map((t, i, arr) => (
            <div key={t.lbl} style={{
              textAlign: "center", padding: "10px 4px",
              borderRight: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none",
            }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: t.color, letterSpacing: -0.5 }}>
                {t.val}
              </div>
              <div style={{ fontSize: 9, color: C.textSub, marginTop: 2 }}>{t.unit}</div>
              <div style={{ fontSize: 9, color: C.textSub }}>{t.lbl}</div>
            </div>
          ))}
        </div>

        {/* Meal list for selected day */}
        <div style={s.card}>
          {meals.map((meal, i) => (
            <div
              key={i}
              className="fade-in"
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 0",
                borderBottom: i < meals.length - 1 ? `0.5px solid ${C.sep}` : "none",
                animationDelay: `${i * 0.05}s`,
              }}
            >
              {/* Slot icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: C.surface2,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <i className={`ti ${
                  meal.slot === "Breakfast" ? "ti-sun" :
                  meal.slot === "Lunch"     ? "ti-sun-high" :
                  meal.slot === "Snack"     ? "ti-apple" : "ti-moon"
                }`} style={{ fontSize: 18, color: C.textSub }} aria-hidden="true" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{meal.name}</div>
                  {/* Verified badge */}
                  {meal.verified && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: C.green,
                      background: "rgba(48,209,88,0.1)", borderRadius: 4,
                      padding: "1px 6px", flexShrink: 0,
                    }}>
                      ✓ Verified
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: C.textSub }}>
                  {meal.slot} · {meal.kcal} kcal · {meal.protein}g P
                </div>
              </div>

              {/* Swap button */}
              <button
                onClick={() => setSwapping(swapping === i ? null : i)}
                style={{
                  background: swapping === i ? C.accent : C.surface2,
                  border: `0.5px solid ${swapping === i ? C.accent : C.sep}`,
                  borderRadius: 8, padding: "5px 10px",
                  fontSize: 11, fontWeight: 600,
                  color: swapping === i ? "#fff" : C.textSub,
                  cursor: "pointer", fontFamily: "'Inter', sans-serif",
                  flexShrink: 0,
                }}
              >
                Swap
              </button>
            </div>
          ))}
        </div>

        {/* ── PLAN CONTROLS ── */}
        <div style={s.secLbl}>Plan Controls</div>
        <div style={{ padding: "0 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          {[
            { icon: "ti-player-pause", label: "Pause plan",  sub: "Resume anytime",    color: C.amber },
            { icon: "ti-refresh",      label: "Swap a meal", sub: "Tap any meal above", color: C.blue  },
            { icon: "ti-x",            label: "Skip a day",  sub: "Skip tomorrow",      color: C.red   },
            { icon: "ti-calendar",     label: "View full week",sub: "See all 7 days",   color: C.green },
          ].map(a => (
            <div key={a.label} style={{
              background: C.surface, border: `0.5px solid ${C.sep}`,
              borderRadius: 14, padding: "14px 14px",
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              <i className={`ti ${a.icon}`} style={{ fontSize: 20, color: a.color }} aria-hidden="true" />
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.label}</div>
              <div style={{ fontSize: 11, color: C.textSub }}>{a.sub}</div>
            </div>
          ))}
        </div>

        {/* ── SUBSCRIBE CTA ── */}
        {!subscribed ? (
          <div style={{ padding: "8px 16px 0" }}>
            <div style={{
              background: C.surface, border: `0.5px solid ${C.sep}`,
              borderRadius: 20, padding: "20px 20px", marginBottom: 8,
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                {plan.name}
              </div>
              <div style={{ fontSize: 13, color: C.textSub, marginBottom: 16 }}>
                {plan.kcal} kcal · {plan.protein}g protein · 7 days
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: -1 }}>
                    €{plan.price}
                  </span>
                  <span style={{ fontSize: 13, color: C.textSub }}> / week</span>
                </div>
                <div style={{ fontSize: 12, color: C.textSub }}>Cancel anytime</div>
              </div>
              <button
                onClick={() => setSubscribed(true)}
                style={{
                  width: "100%", padding: "15px 0",
                  background: C.accent, color: "#fff",
                  border: "none", borderRadius: 14,
                  fontSize: 15, fontWeight: 700,
                  cursor: "pointer", fontFamily: "'Inter', sans-serif",
                }}
              >
                Start this plan
              </button>
              <div style={{ fontSize: 11, color: C.textSub, textAlign: "center", marginTop: 10 }}>
                First delivery within 48 hours · Cancel anytime
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: "8px 16px 0" }}>
            <div style={{
              background: "#F0FFF4", border: `0.5px solid ${C.green}33`,
              borderRadius: 20, padding: "20px 20px", textAlign: "center",
            }}>
              <i className="ti ti-circle-check" style={{ fontSize: 40, color: C.green, display: "block", marginBottom: 10 }} aria-hidden="true" />
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                Plan activated
              </div>
              <div style={{ fontSize: 13, color: C.textSub, marginBottom: 16 }}>
                {plan.name} · First delivery within 48 hours
              </div>
              <button
                onClick={() => setSubscribed(false)}
                style={{
                  background: C.surface, border: `0.5px solid ${C.sep}`,
                  borderRadius: 12, padding: "10px 24px",
                  fontSize: 13, fontWeight: 600, color: C.red,
                  cursor: "pointer", fontFamily: "'Inter', sans-serif",
                }}
              >
                Cancel plan
              </button>
            </div>
          </div>
        )}

        {/* ── BOTTOM NAV ── */}
        <div style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 430, height: 66,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderTop: `0.5px solid ${C.sep}`,
          display: "flex", alignItems: "center", justifyContent: "space-around",
          paddingBottom: "env(safe-area-inset-bottom)", zIndex: 100,
        }}>
          {[
            { icon: "ti-home",    label: "Home",    to: "/dashboard" },
            { icon: "ti-scan",    label: "Scan",    to: "/scanner"   },
            { icon: "ti-map-pin", label: "Places",  to: "/places"    },
            { icon: "ti-user",    label: "Profile", to: "/profile"   },
          ].map(item => (
            <div key={item.label} onClick={() => nav(item.to)} style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3, padding: "6px 16px", cursor: "pointer",
            }}>
              <i className={`ti ${item.icon}`} style={{ fontSize: 22, color: C.textSub }} aria-hidden="true" />
              <span style={{ fontSize: 9, fontWeight: 400, letterSpacing: "0.3px", color: C.textSub }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}