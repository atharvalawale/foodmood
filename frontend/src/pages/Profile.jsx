import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

// ─────────────────────────────────────────────
// COLOUR TOKENS — same as all other pages
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
// HELPERS — all unchanged
// ─────────────────────────────────────────────
function calculate_bmi(weight_kg, height_cm) {
  if (!height_cm) return { bmi: 0, category: "Unknown", color: C.textSub };
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
  const factors = { Sedentary: 1.2, Lightly: 1.375, Moderately: 1.55, Very: 1.725, Extremely: 1.9 };
  const key = Object.keys(factors).find(k => (activity_level || "").includes(k)) || "Moderately";
  return Math.round(bmr * factors[key]);
}

function goal_calories(tdee, goal) {
  return goal === "weight_loss" ? tdee - 500 : goal === "muscle_gain" ? tdee + 300 : tdee;
}

// ─────────────────────────────────────────────
// OPTIONS — unchanged
// ─────────────────────────────────────────────
const ACTIVITY_OPTIONS = [
  "Sedentary (desk job, no exercise)",
  "Lightly Active (exercise 1-3 days/wk)",
  "Moderately Active (exercise 3-5 days)",
  "Very Active (exercise 6-7 days)",
  "Extremely Active (athlete/hard labor)",
];

const DIET_OPTIONS = [
  "No restriction", "Vegetarian", "Vegan",
  "Keto", "Halal", "Gluten-free", "Diabetic-friendly",
];

const GOAL_OPTIONS = [
  { val: "maintenance", label: "Maintain",    icon: "ti-scale",        desc: "Eat at TDEE"  },
  { val: "weight_loss", label: "Lose Fat",    icon: "ti-trending-down", desc: "TDEE − 500"   },
  { val: "muscle_gain", label: "Build Muscle",icon: "ti-barbell",      desc: "TDEE + 300"   },
];

// ─────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: C.textSub,
      letterSpacing: "0.5px", textTransform: "uppercase",
      marginBottom: 10, marginTop: 24,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// STAT CELL
// ─────────────────────────────────────────────
function StatCell({ label, value, sub, color }) {
  return (
    <div style={{
      flex: 1, background: C.surface,
      borderRadius: 14, padding: "14px 10px", textAlign: "center",
      border: `0.5px solid ${C.sep}`,
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || C.text, letterSpacing: -0.5 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: C.textSub, marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color, marginTop: 3, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();

  const [saved,     setSaved]     = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editing,   setEditing]   = useState(false);
  const [loading,   setLoading]   = useState(true);

  const [form, setForm] = useState({
    name: "", gender: "Male", age: 25,
    weight_kg: 70, height_cm: 170,
    activity_level: "Moderately Active (exercise 3-5 days)",
    goal: "maintenance", diet_type: "No restriction", allergies: "",
  });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    async function loadProfile() {
      const local = JSON.parse(localStorage.getItem("foodmood_user") || "{}");
      if (Object.keys(local).length > 0) setForm(f => ({ ...f, ...local }));
      try {
        const res = await api.get("/profile");
        if (res.data && Object.keys(res.data).length > 0) {
          setForm(f => ({ ...f, ...res.data }));
          const cur = JSON.parse(localStorage.getItem("foodmood_user") || "{}");
          localStorage.setItem("foodmood_user", JSON.stringify({ ...cur, ...res.data }));
        }
      } catch (e) {
        console.warn("Profile API failed:", e?.message);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const { bmi, category: bmiCat, color: bmiColor } = calculate_bmi(form.weight_kg, form.height_cm);
  const tdee    = calculate_tdee(form.weight_kg, form.height_cm, form.age, form.gender, form.activity_level);
  const calGoal = goal_calories(tdee, form.goal);
  const protein = form.goal === "muscle_gain" ? 180 : form.goal === "weight_loss" ? 120 : 100;
  const carbs   = form.goal === "weight_loss" ? 150 : 250;
  const fat     = form.goal === "weight_loss" ? 50 : 65;

  const allergyList = Array.isArray(form.allergies)
    ? form.allergies.filter(Boolean)
    : (form.allergies || "").split(",").map(a => a.trim().toLowerCase()).filter(Boolean);

  async function saveProfile() {
    setSaveError("");
    const profile = {
      name:           form.name,
      gender:         form.gender,
      age:            Number(form.age),
      weight_kg:      Number(form.weight_kg),
      height_cm:      Number(form.height_cm),
      activity_level: form.activity_level,
      goal:           form.goal,
      diet_type:      form.diet_type,
      // ✅ FIX 1: convert array to string before sending
      allergies:      Array.isArray(form.allergies) ? form.allergies.join(", ") : (form.allergies || ""),
      calGoal, tdee, bmi,
    };
    const existing = JSON.parse(localStorage.getItem("foodmood_user") || "{}");
    localStorage.setItem("foodmood_user", JSON.stringify({ ...existing, ...profile }));
    try {
      await api.post("/profile", profile);
      setSaved(true); setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      // ✅ FIX 2: show full error object instead of [object Object]
      const msg = JSON.stringify(e?.response?.data) || e?.message || "Unknown error";
      setSaveError(`API error: ${msg}`);
      setSaved(true); setEditing(false);
      setTimeout(() => { setSaved(false); setSaveError(""); }, 5000);
    }
  }

  const inputSt = {
    width: "100%", background: C.surface2,
    border: `0.5px solid ${C.sep}`,
    borderRadius: 12, fontSize: 15,
    padding: "13px 16px", outline: "none",
    fontFamily: "'Inter', sans-serif",
    color: C.text, transition: "border-color 0.15s",
    WebkitAppearance: "none",
  };

  if (loading) return (
    <div style={{
      background: C.bg, minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: C.textSub, fontSize: 14, fontFamily: "'Inter', sans-serif",
    }}>
      Loading profile…
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${C.bg}; }
        .profile {
          font-family: 'Inter', -apple-system, sans-serif;
          background: ${C.bg};
          min-height: 100vh;
          padding-bottom: 90px;
          color: ${C.text};
          max-width: 430px;
          margin: 0 auto;
          -webkit-font-smoothing: antialiased;
        }
        select { appearance: none; -webkit-appearance: none; }
        select option { background: ${C.surface}; color: ${C.text}; }
        input[type=range] {
          -webkit-appearance: none;
          width: 100%; height: 4px;
          background: ${C.sep}; border-radius: 99px;
          outline: none; cursor: pointer;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px; height: 22px; border-radius: 50%;
          background: ${C.accent}; cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        input:focus, select:focus { border-color: ${C.accent} !important; outline: none; }
        ::-webkit-scrollbar { display: none; }
        .tappable { cursor: pointer; transition: opacity 0.15s; }
        .tappable:active { opacity: 0.6; }
      `}</style>

      <div className="profile">

        {/* ── HEADER ── */}
        <div style={{
          background: C.surface,
          borderBottom: `0.5px solid ${C.sep}`,
          padding: "52px 20px 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <button onClick={() => navigate("/dashboard")} style={{
              background: C.surface2, border: `0.5px solid ${C.sep}`,
              borderRadius: 10, width: 36, height: 36,
              cursor: "pointer", color: C.text, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <i className="ti ti-arrow-left" style={{ fontSize: 18 }} aria-hidden="true" />
            </button>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.text, flex: 1 }}>Profile</div>
            <button
              onClick={() => { setEditing(e => !e); setSaveError(""); }}
              style={{
                background: editing ? C.surface2 : C.accent,
                color: editing ? C.text : "#fff",
                border: `0.5px solid ${editing ? C.sep : C.accent}`,
                borderRadius: 20, padding: "7px 16px",
                fontWeight: 600, fontSize: 13, cursor: "pointer",
                fontFamily: "'Inter', sans-serif", transition: "all 0.15s",
              }}
            >
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: C.accent, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 700, flexShrink: 0, letterSpacing: 0.5,
            }}>
              {form.name ? form.name.slice(0, 2).toUpperCase() : "??"}
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>
                {form.name || "Your Name"}
              </div>
              <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>
                {form.gender} · {form.age} yrs · {form.diet_type}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "0 16px" }}>

          {/* ── STATS ── */}
          <SectionLabel>Stats</SectionLabel>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <StatCell label="BMI"      value={bmi}      sub={bmiCat}                         color={bmiColor} />
            <StatCell label="TDEE"     value={tdee}     sub="kcal/day"                       color={C.amber}  />
            <StatCell label="Goal"     value={calGoal}  sub={form.goal.replace("_", " ")}    color={C.blue}   />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <StatCell label="Protein"  value={`${protein}g`} sub="daily"  color={C.blue}  />
            <StatCell label="Carbs"    value={`${carbs}g`}   sub="daily"  color={C.green} />
            <StatCell label="Fat"      value={`${fat}g`}     sub="daily"  color={C.red}   />
          </div>

          <div style={{
            background: C.surface, border: `0.5px solid ${C.sep}`,
            borderRadius: 14, padding: "12px 16px",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
              Target: {calGoal} kcal/day
            </div>
            <div style={{ fontSize: 12, color: C.textSub, marginTop: 3 }}>
              {form.goal === "weight_loss" && "TDEE − 500 · lose ~0.5 kg/week"}
              {form.goal === "muscle_gain" && "TDEE + 300 · lean muscle gain"}
              {form.goal === "maintenance" && "Eating at TDEE · maintain weight"}
            </div>
          </div>

          {/* ── PERSONAL INFO ── */}
          <SectionLabel>Personal Info</SectionLabel>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 7 }}>Name</div>
            <input
              type="text" value={form.name} disabled={!editing}
              onChange={e => set("name", e.target.value)}
              placeholder="Your name"
              style={{ ...inputSt, opacity: editing ? 1 : 0.7 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 7 }}>Gender</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Male", "Female"].map(g => (
                <button
                  key={g}
                  disabled={!editing}
                  onClick={() => set("gender", g)}
                  style={{
                    flex: 1, padding: "12px 0",
                    border: `0.5px solid ${form.gender === g ? C.accent : C.sep}`,
                    borderRadius: 12, fontWeight: 600, fontSize: 14,
                    background: C.surface,
                    color: form.gender === g ? C.text : C.textSub,
                    cursor: editing ? "pointer" : "default",
                    fontFamily: "'Inter', sans-serif",
                    transition: "all 0.15s",
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            background: C.surface, borderRadius: 14,
            padding: "16px 16px", marginBottom: 12,
            border: `0.5px solid ${C.sep}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Age</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: -0.5 }}>
                {form.age}<span style={{ fontSize: 12, color: C.textSub, fontWeight: 400, marginLeft: 3 }}>yrs</span>
              </span>
            </div>
            <input
              type="range" min="10" max="100" value={form.age}
              disabled={!editing}
              onChange={e => set("age", +e.target.value)}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textSub, marginTop: 6 }}>
              <span>10</span><span>100</span>
            </div>
          </div>

          {/* ── BODY MEASUREMENTS ── */}
          <SectionLabel>Body Measurements</SectionLabel>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[
              { key: "weight_kg", label: "Weight", unit: "kg", min: 30,  max: 300, step: 0.5 },
              { key: "height_cm", label: "Height", unit: "cm", min: 100, max: 250, step: 0.5 },
            ].map(f => (
              <div key={f.key} style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 7 }}>
                  {f.label}
                </div>
                <input
                  type="number" value={form[f.key]}
                  min={f.min} max={f.max} step={f.step}
                  disabled={!editing}
                  onChange={e => set(f.key, +e.target.value)}
                  style={{ ...inputSt, opacity: editing ? 1 : 0.7 }}
                />
              </div>
            ))}
          </div>

          <div style={{
            background: C.surface, borderRadius: 14,
            padding: "14px 16px", marginBottom: 4,
            border: `0.5px solid ${C.sep}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                BMI {bmi}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 600, color: bmiColor,
                background: `${bmiColor}18`, borderRadius: 7, padding: "2px 10px",
              }}>
                {bmiCat}
              </span>
            </div>
            <div style={{
              height: 6,
              background: `linear-gradient(to right, ${C.blue} 0%, ${C.green} 30%, ${C.amber} 65%, ${C.red} 100%)`,
              borderRadius: 99, position: "relative",
            }}>
              <div style={{
                position: "absolute", top: "50%",
                transform: "translate(-50%, -50%)",
                left: `${Math.min(Math.max(((bmi - 10) / 30) * 100, 0), 100)}%`,
                width: 14, height: 14, borderRadius: "50%",
                background: "#fff", border: `2px solid ${C.text}`,
                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textSub, marginTop: 6 }}>
              <span>Under</span><span>Normal</span><span>Over</span><span>Obese</span>
            </div>
          </div>

          {/* ── ACTIVITY LEVEL ── */}
          <SectionLabel>Activity Level</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {ACTIVITY_OPTIONS.map(opt => {
              const active = form.activity_level === opt;
              return (
                <div
                  key={opt}
                  className={editing ? "tappable" : ""}
                  onClick={() => editing && set("activity_level", opt)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: C.surface,
                    border: `0.5px solid ${active ? C.accent : C.sep}`,
                    borderRadius: 14, padding: "13px 16px",
                    cursor: editing ? "pointer" : "default",
                    transition: "border-color 0.15s",
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${active ? C.accent : C.sep}`,
                    background: active ? C.accent : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: C.text }}>
                    {opt}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ── FITNESS GOAL ── */}
          <SectionLabel>Fitness Goal</SectionLabel>
          <div style={{ display: "flex", gap: 8 }}>
            {GOAL_OPTIONS.map(g => {
              const active = form.goal === g.val;
              return (
                <div
                  key={g.val}
                  className={editing ? "tappable" : ""}
                  onClick={() => editing && set("goal", g.val)}
                  style={{
                    flex: 1, textAlign: "center", padding: "16px 8px",
                    background: C.surface,
                    border: `0.5px solid ${active ? C.accent : C.sep}`,
                    borderRadius: 14,
                    cursor: editing ? "pointer" : "default",
                    transition: "border-color 0.15s",
                  }}
                >
                  <i className={`ti ${g.icon}`}
                    style={{ fontSize: 22, color: active ? C.accent : C.textSub, display: "block", marginBottom: 6 }}
                    aria-hidden="true" />
                  <div style={{ fontSize: 12, fontWeight: 700, color: active ? C.text : C.textSub, marginBottom: 3 }}>
                    {g.label}
                  </div>
                  <div style={{ fontSize: 10, color: C.textSub }}>{g.desc}</div>
                </div>
              );
            })}
          </div>

          {/* ── DIET TYPE ── */}
          <SectionLabel>Diet Type</SectionLabel>
          <div style={{ position: "relative" }}>
            <select
              value={form.diet_type} disabled={!editing}
              onChange={e => set("diet_type", e.target.value)}
              style={{ ...inputSt, opacity: editing ? 1 : 0.7, cursor: editing ? "pointer" : "default" }}
            >
              {DIET_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <i className="ti ti-chevron-down" style={{
              position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
              fontSize: 16, color: C.textSub, pointerEvents: "none",
            }} aria-hidden="true" />
          </div>

          {/* ── ALLERGIES ── */}
          <SectionLabel>Allergies</SectionLabel>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 7 }}>
              Comma-separated (e.g. nuts, dairy, gluten)
            </div>
            <input
              type="text" value={form.allergies} disabled={!editing}
              onChange={e => set("allergies", e.target.value)}
              placeholder="e.g. nuts, dairy, gluten"
              style={{ ...inputSt, opacity: editing ? 1 : 0.7 }}
            />
          </div>
          {allergyList.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {allergyList.map(a => (
                <span key={a} style={{
                  background: "#FFF0F0",
                  color: C.red,
                  border: `0.5px solid ${C.red}33`,
                  borderRadius: 20, padding: "4px 12px",
                  fontSize: 12, fontWeight: 500,
                }}>
                  {a}
                </span>
              ))}
            </div>
          )}

          {/* ── PROFILE SUMMARY ── */}
          <SectionLabel>Summary</SectionLabel>
          <div style={{
            background: C.surface, border: `0.5px solid ${C.sep}`,
            borderRadius: 16, padding: "14px 16px", marginBottom: 4,
          }}>
            {[
              { label: "Name",         val: form.name || "Not set" },
              { label: "Body",         val: `${form.weight_kg} kg · ${form.height_cm} cm · ${form.gender}` },
              { label: "BMI",          val: `${bmi} — ${bmiCat}` },
              { label: "TDEE",         val: `${tdee} kcal/day` },
              { label: "Daily Target", val: `${calGoal} kcal (${form.goal.replace("_", " ")})` },
              { label: "Diet",         val: form.diet_type },
              { label: "Allergies",    val: allergyList.length > 0 ? allergyList.join(", ") : "None" },
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", padding: "10px 0",
                borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none",
              }}>
                <span style={{ fontSize: 13, color: C.textSub }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text, textAlign: "right", maxWidth: "60%" }}>
                  {row.val}
                </span>
              </div>
            ))}
          </div>

          {/* ── SAVE BUTTON ── */}
          {editing && (
            <button onClick={saveProfile} style={{
              width: "100%", padding: "15px 0", marginTop: 16,
              background: C.accent, color: "#fff",
              border: "none", borderRadius: 14,
              fontWeight: 700, fontSize: 15, cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}>
              Save Profile
            </button>
          )}

          {saved && !saveError && (
            <div style={{
              background: "#F0FFF4", border: `0.5px solid ${C.green}33`,
              borderRadius: 12, padding: "12px 16px",
              textAlign: "center", fontSize: 13, color: C.green,
              fontWeight: 600, marginTop: 10,
            }}>
              Profile saved — dashboard updated
            </div>
          )}

          {saveError && (
            <div style={{
              background: "#FFF0F0", border: `0.5px solid ${C.red}33`,
              borderRadius: 12, padding: "12px 16px",
              fontSize: 13, color: C.red, marginTop: 10,
            }}>
              {saveError}
              <div style={{ marginTop: 6, fontSize: 12, color: C.textSub }}>
                Saved locally — check Supabase users table for missing columns.
              </div>
            </div>
          )}

          {/* ── QUICK ACTIONS ── */}
          <SectionLabel>Quick Actions</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
            {[
              { icon: "ti-home",     label: "Dashboard", to: "/dashboard" },
              { icon: "ti-scan",     label: "Scanner",   to: "/scanner"   },
              { icon: "ti-map-pin",  label: "Places",    to: "/places"    },
              { icon: "ti-logout",   label: "Log Out",   to: "/login", logout: true },
            ].map(a => (
              <button
                key={a.to}
                onClick={() => {
                  if (a.logout) localStorage.clear();
                  navigate(a.to);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: C.surface, border: `0.5px solid ${a.logout ? C.red + "44" : C.sep}`,
                  borderRadius: 14, padding: "14px 16px",
                  cursor: "pointer", fontFamily: "'Inter', sans-serif",
                  textAlign: "left", transition: "border-color 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = a.logout ? C.red : C.accent}
                onMouseLeave={e => e.currentTarget.style.borderColor = a.logout ? C.red + "44" : C.sep}
              >
                <i className={`ti ${a.icon}`}
                  style={{ fontSize: 20, color: a.logout ? C.red : C.textSub }}
                  aria-hidden="true" />
                <span style={{ fontSize: 13, fontWeight: 600, color: a.logout ? C.red : C.text }}>
                  {a.label}
                </span>
              </button>
            ))}
          </div>

        </div>

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
            { icon: "ti-user",    label: "Profile", to: "/profile", active: true },
          ].map(item => (
            <div key={item.label} onClick={() => navigate(item.to)} style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3, padding: "6px 16px", cursor: "pointer",
            }}>
              <i className={`ti ${item.icon}`}
                style={{ fontSize: 22, color: item.active ? C.accent : C.textSub }}
                aria-hidden="true" />
              <span style={{
                fontSize: 9, fontWeight: item.active ? 600 : 400,
                letterSpacing: "0.3px", color: item.active ? C.accent : C.textSub,
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