import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

// ─────────────────────────────────────────────
// COLOUR TOKENS — same as Dashboard + Login
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

// ─────────────────────────────────────────────
// OPTIONS — all unchanged
// ─────────────────────────────────────────────
const ACTIVITY_OPTIONS = [
  { label:"Sedentary",         sub:"Desk job, no exercise",   val:"Sedentary (desk job, no exercise)"      },
  { label:"Lightly Active",    sub:"Exercise 1-3 days/week",  val:"Lightly Active (exercise 1-3 days/wk)"  },
  { label:"Moderately Active", sub:"Exercise 3-5 days/week",  val:"Moderately Active (exercise 3-5 days)"  },
  { label:"Very Active",       sub:"Exercise 6-7 days/week",  val:"Very Active (exercise 6-7 days)"        },
  { label:"Extremely Active",  sub:"Athlete or hard labor",   val:"Extremely Active (athlete/hard labor)"  },
];

const GOAL_OPTIONS = [
  { val:"weight_loss", label:"Lose Weight",  desc:"TDEE − 500 kcal · ~0.5 kg/week" },
  { val:"maintenance", label:"Stay Fit",     desc:"Eat at TDEE · Maintain weight"   },
  { val:"muscle_gain", label:"Build Muscle", desc:"TDEE + 300 kcal · Lean gains"    },
];

const DIET_OPTIONS = [
  "No restriction","Vegetarian","Vegan",
  "Keto","Halal","Gluten-free","Diabetic-friendly",
];

const ALLERGY_OPTIONS = [
  "Nuts","Dairy","Gluten","Eggs","Soy","Fish","Shellfish","Peanuts",
];

// ─────────────────────────────────────────────
// HELPERS — all unchanged
// ─────────────────────────────────────────────
function calculate_bmi(weight_kg, height_cm) {
  if (!height_cm) return { bmi: 0, category: "—" };
  const h   = height_cm / 100;
  const bmi = +(weight_kg / (h * h)).toFixed(1);
  const category =
    bmi < 18.5 ? "Underweight" :
    bmi < 25   ? "Normal"      :
    bmi < 30   ? "Overweight"  : "Obese";
  const color =
    bmi < 18.5 ? C.blue  :
    bmi < 25   ? C.green :
    bmi < 30   ? C.amber : C.red;
  return { bmi, category, color };
}

function calculate_tdee(weight_kg, height_cm, age, gender, activity_level) {
  const bmr = gender === "Male"
    ? 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    : 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  const factors = { Sedentary:1.2, Lightly:1.375, Moderately:1.55, Very:1.725, Extremely:1.9 };
  const key = Object.keys(factors).find(k => (activity_level || "").includes(k)) || "Moderately";
  return Math.round(bmr * factors[key]);
}

function goal_calories(tdee, goal) {
  return goal === "weight_loss" ? tdee - 500 : goal === "muscle_gain" ? tdee + 300 : tdee;
}

// ─────────────────────────────────────────────
// STEP PROGRESS BAR
// ─────────────────────────────────────────────
function StepBar({ total, current }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 4,
          flex: i === current ? 2 : 1,
          borderRadius: 99,
          background: i <= current ? C.accent : C.sep,
          transition: "all 0.3s",
        }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const TOTAL = 6;

  // ── Form state — unchanged ──
  const [form, setForm] = useState({
    name: "", gender: "Male", age: 22,
    weight_kg: 70, height_cm: 170,
    activity_level: "Moderately Active (exercise 3-5 days)",
    goal: "maintenance", diet_type: "No restriction", allergies: [],
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const toggleAllergy = val => set("allergies",
    form.allergies.includes(val)
      ? form.allergies.filter(a => a !== val)
      : [...form.allergies, val]
  );

  const { bmi, category: bmiCat, color: bmiColor } = calculate_bmi(form.weight_kg, form.height_cm);
  const tdee    = calculate_tdee(form.weight_kg, form.height_cm, form.age, form.gender, form.activity_level);
  const calGoal = goal_calories(tdee, form.goal);

  // ── finish — unchanged ──
  async function finish() {
    const profile = { ...form, allergies: form.allergies.join(", "), bmi, tdee, calGoal };
    localStorage.setItem("foodmood_user", JSON.stringify(profile));
    try { await api.post("/profile", profile); } catch {}
    navigate("/dashboard");
  }

  const next = () => step < TOTAL - 1 ? setStep(s => s + 1) : finish();
  const back = () => step > 0 ? setStep(s => s - 1) : navigate("/login");

  const TITLES = [
    "What's your name?",
    "Your body stats",
    "Activity level",
    "Your goal",
    "Diet preference",
    "Food allergies",
  ];
  const SUBS = [
    "Let's personalise your experience.",
    "We'll calculate your BMI and calorie needs.",
    "This helps us calculate your TDEE accurately.",
    "We'll set your daily calorie target accordingly.",
    "So we can filter menus and recommendations.",
    "We'll warn you when detected foods contain these.",
  ];

  // ── Shared input style ──
  const inputStyle = {
    width: "100%",
    background: C.surface2,
    border: `1px solid ${C.sep}`,
    borderRadius: 12,
    fontSize: 15,
    padding: "14px 16px",
    outline: "none",
    fontFamily: "'Inter', sans-serif",
    color: C.text,
    transition: "border-color 0.15s",
    WebkitAppearance: "none",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${C.bg}; }
        .ob {
          font-family: 'Inter', -apple-system, sans-serif;
          min-height: 100vh;
          background: ${C.bg};
          display: flex;
          flex-direction: column;
          padding-bottom: 40px;
          -webkit-font-smoothing: antialiased;
          max-width: 430px;
          margin: 0 auto;
        }
        input::placeholder { color: ${C.textSub}; opacity: 0.6; }
        input:focus { border-color: ${C.accent} !important; outline: none; }
        input[type=range] {
          -webkit-appearance: none;
          width: 100%; height: 4px;
          background: ${C.sep};
          border-radius: 99px;
          outline: none;
          cursor: pointer;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px; height: 22px;
          border-radius: 50%;
          background: ${C.accent};
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        .tappable { cursor: pointer; transition: opacity 0.15s; }
        .tappable:active { opacity: 0.6; }
        .row-card {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 16px; border-radius: 14px;
          border: 0.5px solid ${C.sep};
          background: ${C.surface};
          cursor: pointer; transition: border-color 0.15s;
          margin-bottom: 8px;
        }
        .row-card.active { border-color: ${C.accent}; background: ${C.surface}; }
        .grid-card {
          padding: 16px 10px; text-align: center;
          border-radius: 14px;
          border: 0.5px solid ${C.sep};
          background: ${C.surface};
          cursor: pointer; transition: border-color 0.15s;
          position: relative;
        }
        .grid-card.active { border-color: ${C.accent}; }
      `}</style>

      <div className="ob">

        {/* ── HEADER ── */}
        <div style={{ padding: "56px 20px 20px" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 28 }}>
            <div style={{
              width: 30, height: 30, background: C.accent, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: 0.3 }}>FM</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>FoodMood</span>
          </div>

          {/* Step progress bar */}
          <StepBar total={TOTAL} current={step} />

          {/* Step label */}
          <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>
            Step {step + 1} of {TOTAL}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: -0.5, marginBottom: 6, lineHeight: 1.15 }}>
            {TITLES[step]}
          </h1>
          <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.5 }}>{SUBS[step]}</p>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ flex: 1, padding: "0 20px" }}>

          {/* ── STEP 0: Name + Gender ── */}
          {step === 0 && (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 8, letterSpacing: 0.3 }}>
                  Full Name
                </div>
                <input
                  type="text" value={form.name} autoFocus
                  placeholder="Atharva Lawale"
                  onChange={e => set("name", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 10, letterSpacing: 0.3 }}>
                Gender
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {["Male", "Female"].map(g => (
                  <div
                    key={g}
                    className="tappable"
                    onClick={() => set("gender", g)}
                    style={{
                      padding: "20px 10px",
                      borderRadius: 16,
                      border: `0.5px solid ${form.gender === g ? C.accent : C.sep}`,
                      background: C.surface,
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                  >
                    {/* Icon box instead of emoji */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: form.gender === g ? C.accent : C.surface2,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 10px",
                    }}>
                      <i className={`ti ti-${g === "Male" ? "man" : "woman"}`}
                        style={{ fontSize: 22, color: form.gender === g ? "#fff" : C.textSub }}
                        aria-hidden="true" />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: form.gender === g ? C.text : C.textSub }}>
                      {g}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── STEP 1: Body Stats ── */}
          {step === 1 && (
            <>
              {[
                { key: "age",       label: "Age",    unit: "yrs", min: 10,  max: 80,  step: 1   },
                { key: "weight_kg", label: "Weight", unit: "kg",  min: 30,  max: 200, step: 0.5 },
                { key: "height_cm", label: "Height", unit: "cm",  min: 100, max: 220, step: 0.5 },
              ].map(s => (
                <div key={s.key} style={{
                  background: C.surface, borderRadius: 16,
                  padding: "16px 16px", marginBottom: 10,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: -0.5, fontFamily: "'Inter', sans-serif" }}>
                      {form[s.key]}
                      <span style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginLeft: 3 }}>{s.unit}</span>
                    </div>
                  </div>
                  <input
                    type="range" min={s.min} max={s.max} step={s.step}
                    value={form[s.key]}
                    onChange={e => set(s.key, +e.target.value)}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textSub, marginTop: 6 }}>
                    <span>{s.min} {s.unit}</span>
                    <span>{s.max} {s.unit}</span>
                  </div>
                </div>
              ))}

              {/* BMI card */}
              <div style={{
                background: C.surface, borderRadius: 16,
                padding: "16px 16px",
                border: `0.5px solid ${bmiColor}44`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 4 }}>Your BMI</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: bmiColor, letterSpacing: -1 }}>{bmi}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontSize: 12, fontWeight: 600,
                      color: bmiColor,
                      background: `${bmiColor}18`,
                      borderRadius: 8, padding: "4px 10px",
                      marginBottom: 6,
                    }}>
                      {bmiCat}
                    </div>
                    <div style={{ fontSize: 11, color: C.textSub }}>
                      {form.weight_kg} kg · {form.height_cm} cm
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 2: Activity ── */}
          {step === 2 && (
            <div>
              {ACTIVITY_OPTIONS.map((opt, i) => {
                const active = form.activity_level === opt.val;
                return (
                  <div
                    key={opt.val}
                    className="tappable"
                    onClick={() => set("activity_level", opt.val)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 16px", borderRadius: 14,
                      border: `0.5px solid ${active ? C.accent : C.sep}`,
                      background: C.surface,
                      marginBottom: 8, cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                  >
                    {/* Number badge */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: active ? C.accent : C.surface2,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: active ? "#fff" : C.textSub }}>
                        {i + 1}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 12, color: C.textSub }}>{opt.sub}</div>
                    </div>
                    {/* Check */}
                    {active && (
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%",
                        background: C.accent,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <i className="ti ti-check" style={{ fontSize: 12, color: "#fff" }} aria-hidden="true" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── STEP 3: Goal ── */}
          {step === 3 && (
            <>
              {GOAL_OPTIONS.map(g => {
                const active = form.goal === g.val;
                return (
                  <div
                    key={g.val}
                    className="tappable"
                    onClick={() => set("goal", g.val)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "16px 16px", borderRadius: 14,
                      border: `0.5px solid ${active ? C.accent : C.sep}`,
                      background: C.surface,
                      marginBottom: 10, cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: active ? C.accent : C.surface2,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <i className={`ti ${g.val === "weight_loss" ? "ti-trending-down" : g.val === "muscle_gain" ? "ti-barbell" : "ti-scale"}`}
                        style={{ fontSize: 20, color: active ? "#fff" : C.textSub }}
                        aria-hidden="true" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 3 }}>
                        {g.label}
                      </div>
                      <div style={{ fontSize: 12, color: C.textSub }}>{g.desc}</div>
                    </div>
                    {active && (
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%",
                        background: C.accent, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <i className="ti ti-check" style={{ fontSize: 12, color: "#fff" }} aria-hidden="true" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* TDEE preview */}
              <div style={{
                background: C.surface, borderRadius: 16,
                padding: "16px 16px", marginTop: 4,
              }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 8 }}>
                  Your personalised target
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 34, fontWeight: 700, color: C.text, letterSpacing: -1 }}>
                      {calGoal}
                    </span>
                    <span style={{ fontSize: 13, color: C.textSub, marginLeft: 4 }}>kcal/day</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: C.textSub }}>TDEE: {tdee} kcal</div>
                    <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>
                      {form.goal === "weight_loss" ? "−500 for fat loss" :
                       form.goal === "muscle_gain" ? "+300 for muscle"   : "at maintenance"}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 4: Diet ── */}
          {step === 4 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {DIET_OPTIONS.map(d => {
                const active = form.diet_type === d;
                return (
                  <div
                    key={d}
                    className="tappable"
                    onClick={() => set("diet_type", d)}
                    style={{
                      padding: "16px 10px", textAlign: "center",
                      borderRadius: 14,
                      border: `0.5px solid ${active ? C.accent : C.sep}`,
                      background: C.surface,
                      cursor: "pointer", transition: "border-color 0.15s",
                      position: "relative",
                    }}
                  >
                    {active && (
                      <div style={{
                        position: "absolute", top: 8, right: 8,
                        width: 18, height: 18, borderRadius: "50%",
                        background: C.accent,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <i className="ti ti-check" style={{ fontSize: 10, color: "#fff" }} aria-hidden="true" />
                      </div>
                    )}
                    <div style={{ fontSize: 13, fontWeight: 600, color: active ? C.text : C.textSub, marginTop: 4 }}>
                      {d}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── STEP 5: Allergies ── */}
          {step === 5 && (
            <>
              <div style={{ fontSize: 13, color: C.textSub, marginBottom: 16 }}>
                Select all that apply. We'll warn you when food contains these.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                {ALLERGY_OPTIONS.map(a => {
                  const sel = form.allergies.includes(a.toLowerCase());
                  return (
                    <div
                      key={a}
                      className="tappable"
                      onClick={() => toggleAllergy(a.toLowerCase())}
                      style={{
                        padding: "14px 10px", textAlign: "center",
                        borderRadius: 14,
                        border: `0.5px solid ${sel ? C.accent : C.sep}`,
                        background: C.surface,
                        cursor: "pointer", transition: "border-color 0.15s",
                        position: "relative",
                      }}
                    >
                      {sel && (
                        <div style={{
                          position: "absolute", top: 8, right: 8,
                          width: 18, height: 18, borderRadius: "50%",
                          background: C.accent,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <i className="ti ti-check" style={{ fontSize: 10, color: "#fff" }} aria-hidden="true" />
                        </div>
                      )}
                      <div style={{ fontSize: 13, fontWeight: 600, color: sel ? C.text : C.textSub }}>
                        {a}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* No allergies */}
              <div
                className="tappable"
                onClick={() => set("allergies", [])}
                style={{
                  padding: "13px 16px", borderRadius: 14, cursor: "pointer",
                  textAlign: "center",
                  border: `0.5px solid ${form.allergies.length === 0 ? C.green : C.sep}`,
                  background: C.surface,
                  fontWeight: 600, fontSize: 14,
                  color: form.allergies.length === 0 ? C.green : C.textSub,
                  marginBottom: 16, transition: "all 0.15s",
                }}
              >
                No Allergies
              </div>

              {/* Summary card */}
              <div style={{ background: C.surface, borderRadius: 16, padding: "16px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 12 }}>
                  Profile Summary
                </div>
                {[
                  { label: "Name",      val: form.name || "Not set" },
                  { label: "Body",      val: `${form.weight_kg} kg · ${form.height_cm} cm · BMI ${bmi}` },
                  { label: "Goal",      val: `${calGoal} kcal/day` },
                  { label: "Diet",      val: form.diet_type },
                  { label: "Allergies", val: form.allergies.length > 0 ? form.allergies.join(", ") : "None" },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none",
                  }}>
                    <span style={{ fontSize: 13, color: C.textSub }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text, textAlign: "right", maxWidth: "60%" }}>
                      {row.val}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── NAV BUTTONS ── */}
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <button
              onClick={back}
              style={{
                flex: 1, padding: "15px 0",
                background: C.surface,
                border: `0.5px solid ${C.sep}`,
                borderRadius: 14, fontWeight: 600,
                fontSize: 15, color: C.text,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.sep}
            >
              Back
            </button>
            <button
              onClick={next}
              disabled={step === 0 && !form.name.trim()}
              style={{
                flex: 2, padding: "15px 0",
                background: step === 0 && !form.name.trim() ? C.sep : C.accent,
                color: step === 0 && !form.name.trim() ? C.textSub : "#fff",
                border: "none", borderRadius: 14,
                fontWeight: 700, fontSize: 15,
                cursor: step === 0 && !form.name.trim() ? "not-allowed" : "pointer",
                fontFamily: "'Inter', sans-serif",
                transition: "opacity 0.15s",
              }}
            >
              {step === TOTAL - 1 ? "Get Started" : "Continue"}
            </button>
          </div>

          {/* Skip */}
          {step < TOTAL - 1 && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <span
                className="tappable"
                onClick={() => navigate("/dashboard")}
                style={{ fontSize: 13, color: C.textSub, fontWeight: 500 }}
              >
                Skip for now
              </span>
            </div>
          )}

        </div>
      </div>
    </>
  );
}