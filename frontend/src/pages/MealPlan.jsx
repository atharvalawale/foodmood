import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

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

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// day_number in the backend is 1-7 and cycles weekly — map it to labels for display.
const dayNumberToLabel = (n) => WEEK_DAYS[(n - 1) % 7];

export default function MealPlan() {
  const nav = useNavigate();
  const [plans,        setPlans]        = useState([]);
  const [loadingPlans, setLoadingPlans]  = useState(true);
  const [selectedPlan, setSelectedPlan]  = useState(null);
  const [selectedDay,  setSelectedDay]   = useState(1);
  const [planMeals,    setPlanMeals]     = useState([]);
  const [loadingMeals, setLoadingMeals]  = useState(false);
  const [subscription, setSubscription]  = useState(null); // active/paused subscription, or null
  const [subscribing,  setSubscribing]   = useState(false);
  const [controlBusy,  setControlBusy]   = useState(false);
  const [error,        setError]         = useState("");
  const [swapping,     setSwapping]      = useState(null); // decorative only — no backend action yet

  // Load available plans + the user's current subscription (if any) on mount.
  useEffect(() => {
    api.get("/plans/browse").then(res => {
      const list = res.data || [];
      setPlans(list);
      if (list.length > 0) setSelectedPlan(list[0].id);
      setLoadingPlans(false);
    }).catch(() => { setError("Couldn't load plans."); setLoadingPlans(false); });

    api.get("/my-subscription").then(res => {
      if (res.data?.active) {
        setSubscription(res.data);
      } else {
        setSubscription(null);
      }
    }).catch((e) => {
      setError(`Couldn't check your subscription: ${e?.response?.status || e.message}`);
    });
  }, []);

  // Load the selected plan's weekly schedule whenever it changes.
  useEffect(() => {
    if (!selectedPlan) return;
    setLoadingMeals(true);
    api.get(`/plans/${selectedPlan}/meals`).then(res => {
      setPlanMeals(res.data || []);
      setLoadingMeals(false);
    }).catch(() => { setError("Couldn't load this plan's meals."); setLoadingMeals(false); });
  }, [selectedPlan]);

  async function handleSubscribe() {
    setSubscribing(true);
    try {
      await api.post(`/plans/${selectedPlan}/subscribe`);
      const res = await api.get("/my-subscription");
      if (res.data?.active) setSubscription(res.data);
    } catch {
      setError("Couldn't subscribe. Try again.");
    }
    setSubscribing(false);
  }

  async function handleCancel() {
    try {
      await api.post("/my-subscription/cancel");
      setSubscription(null);
    } catch {
      setError("Couldn't cancel. Try again.");
    }
  }

  async function handlePauseResume() {
    setControlBusy(true);
    try {
      if (subscription.status === "paused") {
        await api.post("/my-subscription/resume");
      } else {
        await api.post("/my-subscription/pause");
      }
      const res = await api.get("/my-subscription");
      setSubscription(res.data?.active ? res.data : null);
    } catch {
      setError("Couldn't update your plan. Try again.");
    }
    setControlBusy(false);
  }

  async function handleSkipDay() {
    setControlBusy(true);
    try {
      await api.post("/my-subscription/advance-day");
      const res = await api.get("/my-subscription");
      setSubscription(res.data?.active ? res.data : null);
    } catch {
      setError("Couldn't skip ahead. Try again.");
    }
    setControlBusy(false);
  }

  const plan  = plans.find(p => p.id === selectedPlan);
  const meals = planMeals.filter(m => m.day_number === selectedDay);
  const dayTotals = meals.reduce((a, m) => ({
    kcal:    a.kcal    + (m.menu_item?.calories || 0),
    protein: a.protein + (m.menu_item?.protein  || 0),
    carbs:   a.carbs   + (m.menu_item?.carbs    || 0),
    fat:     a.fat     + (m.menu_item?.fat      || 0),
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
        {loadingPlans && (
          <div style={{ padding: "0 16px", fontSize: 13, color: C.textSub }}>Loading plans…</div>
        )}
        {!loadingPlans && plans.length === 0 && (
          <div style={{ padding: "0 16px", fontSize: 13, color: C.textSub }}>
            No plans available yet — check back soon.
          </div>
        )}
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
          {plans.map(p => {
            const active = selectedPlan === p.id;
            return (
              <div
                key={p.id}
                className="tappable"
                onClick={() => { setSelectedPlan(p.id); setSelectedDay(1); }}
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
                    </div>
                    <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.5 }}>{p.description}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: -0.5 }}>
                      ₹{p.price_per_week}
                    </div>
                    <div style={{ fontSize: 11, color: C.textSub }}>/ week</div>
                  </div>
                </div>

                {/* Info pills */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[
                    { lbl: `${p.meals_per_week} meals/week`, color: C.accent },
                    { lbl: p.target_goal, color: C.blue  },
                    { lbl: p.diet_type,   color: C.green },
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
          {[1, 2, 3, 4, 5, 6, 7].map(dayNum => {
            const active = selectedDay === dayNum;
            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDay(dayNum)}
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
                {dayNumberToLabel(dayNum)}
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
          {loadingMeals && (
            <div style={{ padding: "16px 0", textAlign: "center", fontSize: 13, color: C.textSub }}>
              Loading meals…
            </div>
          )}
          {!loadingMeals && meals.length === 0 && (
            <div style={{ padding: "16px 0", textAlign: "center", fontSize: 13, color: C.textSub }}>
              No meals scheduled for this day yet.
            </div>
          )}
          {meals.map((meal, i) => {
            const item = meal.menu_item || {};
            const isVerified = item.status === "verified" || item.status === "premium";
            const slotLabel = (meal.meal_slot || "").replace("_", " ");
            return (
              <div
                key={meal.id || i}
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
                    slotLabel === "breakfast" ? "ti-sun" :
                    slotLabel === "lunch"     ? "ti-sun-high" :
                    slotLabel.includes("snack") ? "ti-apple" : "ti-moon"
                  }`} style={{ fontSize: 18, color: C.textSub }} aria-hidden="true" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.name}</div>
                    {isVerified && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: C.green,
                        background: "rgba(48,209,88,0.1)", borderRadius: 4,
                        padding: "1px 6px", flexShrink: 0,
                      }}>
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: C.textSub, textTransform: "capitalize" }}>
                    {slotLabel} · {item.calories || 0} kcal · {item.protein || 0}g P
                  </div>
                </div>

                {/* Swap button — visual only for now, no backend action yet */}
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
            );
          })}
        </div>

        {/* ── PLAN CONTROLS ── */}
        <div style={s.secLbl}>Plan Controls</div>
        <div style={{ padding: "0 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          {[
            {
              icon: subscription?.status === "paused" ? "ti-player-play" : "ti-player-pause",
              label: subscription?.status === "paused" ? "Resume plan" : "Pause plan",
              sub: subscription?.status === "paused" ? "Back to active" : "Resume anytime",
              color: C.amber,
              onClick: handlePauseResume,
              disabled: !subscription,
            },
            { icon: "ti-refresh",  label: "Swap a meal",   sub: "Tap any meal above", color: C.blue, disabled: true },
            {
              icon: "ti-x", label: "Skip a day", sub: "Move to next day", color: C.red,
              onClick: handleSkipDay, disabled: !subscription,
            },
            { icon: "ti-calendar", label: "View full week", sub: "Use the day tabs above", color: C.green, disabled: true },
          ].map(a => (
            <div
              key={a.label}
              onClick={() => { if (!a.disabled && a.onClick && !controlBusy) a.onClick(); }}
              style={{
                background: C.surface, border: `0.5px solid ${C.sep}`,
                borderRadius: 14, padding: "14px 14px",
                display: "flex", flexDirection: "column", gap: 8,
                cursor: a.disabled ? "default" : "pointer",
                opacity: a.disabled ? 0.5 : (controlBusy ? 0.6 : 1),
              }}
            >
              <i className={`ti ${a.icon}`} style={{ fontSize: 20, color: a.color }} aria-hidden="true" />
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.label}</div>
              <div style={{ fontSize: 11, color: C.textSub }}>{a.sub}</div>
            </div>
          ))}
        </div>
        {!subscription && (
          <div style={{ padding: "0 16px", fontSize: 11, color: C.textSub, marginBottom: 8 }}>
            Subscribe to a plan below to use these controls.
          </div>
        )}

        {/* ── SUBSCRIBE CTA ── */}
        {plan && !subscription ? (
          <div style={{ padding: "8px 16px 0" }}>
            <div style={{
              background: C.surface, border: `0.5px solid ${C.sep}`,
              borderRadius: 20, padding: "20px 20px", marginBottom: 8,
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                {plan.name}
              </div>
              <div style={{ fontSize: 13, color: C.textSub, marginBottom: 16 }}>
                {plan.meals_per_week} meals/week · {plan.target_goal}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: -1 }}>
                    ₹{plan.price_per_week}
                  </span>
                  <span style={{ fontSize: 13, color: C.textSub }}> / week</span>
                </div>
                <div style={{ fontSize: 12, color: C.textSub }}>Cancel anytime</div>
              </div>
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                style={{
                  width: "100%", padding: "15px 0",
                  background: C.accent, color: "#fff",
                  border: "none", borderRadius: 14,
                  fontSize: 15, fontWeight: 700,
                  cursor: "pointer", fontFamily: "'Inter', sans-serif",
                  opacity: subscribing ? 0.6 : 1,
                }}
              >
                {subscribing ? "Starting…" : "Start this plan"}
              </button>
              {error && (
                <div style={{ fontSize: 12, color: C.red, textAlign: "center", marginTop: 10 }}>{error}</div>
              )}
            </div>
          </div>
        ) : subscription ? (
          <div style={{ padding: "8px 16px 0" }}>
            <div style={{
              background: subscription.status === "paused" ? "#FFF8E6" : "#F0FFF4",
              border: `0.5px solid ${(subscription.status === "paused" ? C.amber : C.green)}33`,
              borderRadius: 20, padding: "20px 20px", textAlign: "center",
            }}>
              <i className={`ti ${subscription.status === "paused" ? "ti-player-pause" : "ti-circle-check"}`}
                style={{ fontSize: 40, color: subscription.status === "paused" ? C.amber : C.green, display: "block", marginBottom: 10 }}
                aria-hidden="true" />
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                {subscription.status === "paused" ? "Plan paused" : "Plan activated"}
              </div>
              <div style={{ fontSize: 13, color: C.textSub, marginBottom: 16 }}>
                {subscription.plan?.name} · Day {subscription.current_day_number} of {subscription.plan?.meals_per_week}
              </div>
              <button
                onClick={handleCancel}
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
        ) : null}

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