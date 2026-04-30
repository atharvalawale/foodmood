import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

// ─── Same tokens as Dashboard ─────────────────────────────────────────────────
const D = {
  yellow:"#FFD60A", yellowDim:"rgba(255,214,10,0.12)", yellowText:"#B8960A",
  bg:"#0F0F0F", s1:"#181818", s2:"#222222", s3:"#2A2A2A",
  border:"rgba(255,255,255,0.07)", border2:"rgba(255,255,255,0.12)",
  green:"#00C97A", greenDim:"rgba(0,201,122,0.12)",
  coral:"#FF5A5A", coralDim:"rgba(255,90,90,0.12)",
  blue:"#4D9EFF",  blueDim:"rgba(77,158,255,0.12)",
  amber:"#FFAB00", amberDim:"rgba(255,171,0,0.12)",
  purple:"#9B7FFF",
  t1:"#F0F0F0", t2:"#888888", t3:"#444444",
};

const ACTIVITY_OPTIONS = [
  { label:"Sedentary",         sub:"Desk job, no exercise",   emoji:"🪑", val:"Sedentary (desk job, no exercise)"       },
  { label:"Lightly Active",    sub:"Exercise 1-3 days/week",  emoji:"🚶", val:"Lightly Active (exercise 1-3 days/wk)"   },
  { label:"Moderately Active", sub:"Exercise 3-5 days/week",  emoji:"🏃", val:"Moderately Active (exercise 3-5 days)"   },
  { label:"Very Active",       sub:"Exercise 6-7 days/week",  emoji:"💪", val:"Very Active (exercise 6-7 days)"         },
  { label:"Extremely Active",  sub:"Athlete or hard labor",   emoji:"🏋️", val:"Extremely Active (athlete/hard labor)"  },
];

const GOAL_OPTIONS = [
  { val:"weight_loss", emoji:"🔥", label:"Lose Weight",  desc:"TDEE − 500 kcal/day\n~0.5kg/week loss",  color:D.coral  },
  { val:"maintenance", emoji:"⚖️", label:"Stay Fit",     desc:"Eat at TDEE\nMaintain current weight",    color:D.amber  },
  { val:"muscle_gain", emoji:"💪", label:"Build Muscle", desc:"TDEE + 300 kcal/day\nLean muscle gain",   color:D.blue   },
];

const DIET_OPTIONS = [
  { val:"No restriction",    emoji:"🍽️" },
  { val:"Vegetarian",        emoji:"🥗"  },
  { val:"Vegan",             emoji:"🌱"  },
  { val:"Keto",              emoji:"🥩"  },
  { val:"Halal",             emoji:"☪️"  },
  { val:"Gluten-free",       emoji:"🌾"  },
  { val:"Diabetic-friendly", emoji:"💉"  },
];

const ALLERGY_OPTIONS = [
  { val:"nuts",     emoji:"🥜" },
  { val:"dairy",    emoji:"🥛" },
  { val:"gluten",   emoji:"🌾" },
  { val:"eggs",     emoji:"🥚" },
  { val:"soy",      emoji:"🫘" },
  { val:"fish",     emoji:"🐟" },
  { val:"shellfish",emoji:"🦐" },
  { val:"peanuts",  emoji:"🥜" },
];

function calculate_bmi(weight_kg, height_cm) {
  if (!height_cm) return { bmi:0, category:"—", color:D.t2 };
  const h = height_cm / 100;
  const bmi = +(weight_kg / (h * h)).toFixed(1);
  const category = bmi < 18.5 ? "Underweight 🔵" : bmi < 25 ? "Normal ✅" : bmi < 30 ? "Overweight 🟡" : "Obese 🔴";
  const color     = bmi < 18.5 ? D.blue : bmi < 25 ? D.green : bmi < 30 ? D.amber : D.coral;
  return { bmi, category, color };
}

function calculate_tdee(weight_kg, height_cm, age, gender, activity_level) {
  const bmr = gender === "Male"
    ? 10*weight_kg + 6.25*height_cm - 5*age + 5
    : 10*weight_kg + 6.25*height_cm - 5*age - 161;
  const factors = { "Sedentary":1.2, "Lightly":1.375, "Moderately":1.55, "Very":1.725, "Extremely":1.9 };
  const key = Object.keys(factors).find(k => (activity_level||"").includes(k)) || "Moderately";
  return Math.round(bmr * factors[key]);
}

function goal_calories(tdee, goal) {
  if (goal === "weight_loss") return tdee - 500;
  if (goal === "muscle_gain") return tdee + 300;
  return tdee;
}

function StepDots({ total, current }) {
  return (
    <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:24 }}>
      {Array.from({ length:total }).map((_, i) => (
        <div key={i} style={{
          height:5,
          width: i === current ? 22 : 5,
          borderRadius:99,
          background: i <= current ? D.yellow : D.s3,
          transition:"all 0.3s",
        }} />
      ))}
    </div>
  );
}

const inputStyle = {
  width:"100%", background:D.s2,
  border:`1px solid ${D.border2}`,
  borderRadius:10, fontSize:14,
  padding:"12px 14px", outline:"none",
  boxSizing:"border-box",
  fontFamily:"'Inter',sans-serif",
  color:D.t1, transition:"border-color 0.2s",
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const TOTAL = 6;

  const [form, setForm] = useState({
    name:"", gender:"Male", age:22,
    weight_kg:70, height_cm:170,
    activity_level:"Moderately Active (exercise 3-5 days)",
    goal:"maintenance", diet_type:"No restriction", allergies:[],
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]:val }));
  const toggleAllergy = val => set("allergies",
    form.allergies.includes(val)
      ? form.allergies.filter(a => a !== val)
      : [...form.allergies, val]
  );

  const { bmi, category:bmiCat, color:bmiColor } = calculate_bmi(form.weight_kg, form.height_cm);
  const tdee    = calculate_tdee(form.weight_kg, form.height_cm, form.age, form.gender, form.activity_level);
  const calGoal = goal_calories(tdee, form.goal);

  async function finish() {
    const profile = { ...form, allergies:form.allergies.join(", "), bmi, tdee, calGoal };
    localStorage.setItem("foodmood_user", JSON.stringify(profile));
    try { await api.post("/profile", profile); } catch {}
    navigate("/dashboard");
  }

  const next = () => step < TOTAL - 1 ? setStep(s => s+1) : finish();
  const back = () => step > 0 ? setStep(s => s-1) : navigate("/login");

  const TITLES = [
    "What's your name?","Your body stats","How active are you?",
    "What's your goal?","Diet preferences","Any food allergies?",
  ];
  const SUBS = [
    "Let's personalise your experience.",
    "We'll calculate your BMI and daily calorie needs.",
    "This helps us calculate your TDEE accurately.",
    "We'll set your daily calorie target accordingly.",
    "So we can filter menus and recommendations for you.",
    "We'll warn you when detected foods contain these.",
  ];

  // selected card style
  const selCard = (active) => ({
    display:"flex", alignItems:"center", gap:12,
    padding:"13px 14px", borderRadius:11, cursor:"pointer",
    background: active ? D.yellowDim : D.s2,
    border:`1px solid ${active ? D.yellow+"66" : D.border}`,
    transition:"all 0.18s",
  });

  const gridCard = (active, accentColor) => ({
    padding:"14px 10px", textAlign:"center", borderRadius:11, cursor:"pointer",
    background: active ? `${accentColor}18` : D.s2,
    border:`1px solid ${active ? accentColor+"66" : D.border}`,
    transition:"all 0.18s", position:"relative",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        html,body { background:${D.bg}; color:${D.t1}; }
        .ob {
          font-family:'Inter',sans-serif;
          min-height:100vh; background:${D.bg};
          display:flex; flex-direction:column;
          padding-bottom:32px;
        }
        input::placeholder { color:${D.t3}; }
        input[type=range] {
          accent-color:${D.yellow}; width:100%;
          height:4px; cursor:pointer;
        }
        input[type=range]:focus { outline:none; }
        input:focus { border-color:${D.yellow}66 !important; }
      `}</style>

      <div className="ob">

        {/* ── Header ── */}
        <div style={{ padding:"52px 16px 24px", borderBottom:`1px solid ${D.border}` }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:24 }}>
            <div style={{
              width:32, height:32, background:D.yellow,
              borderRadius:9, display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:17,
            }}>🍱</div>
            <span style={{ fontSize:15, fontWeight:700, color:D.t1 }}>FoodMood</span>
          </div>

          <StepDots total={TOTAL} current={step} />

          <div style={{ fontSize:9, color:D.t2, marginBottom:5, fontWeight:600, letterSpacing:1, textTransform:"uppercase", fontFamily:"'DM Mono',monospace" }}>
            Step {step+1} of {TOTAL}
          </div>
          <h1 style={{ fontSize:22, fontWeight:700, color:D.t1, lineHeight:1.1, marginBottom:6, letterSpacing:"-0.3px" }}>
            {TITLES[step]}
          </h1>
          <p style={{ fontSize:12, color:D.t2, lineHeight:1.5 }}>{SUBS[step]}</p>
        </div>

        {/* ── Content ── */}
        <div style={{ flex:1, padding:"20px 16px 0" }}>

          {/* ── STEP 0: Name + Gender ── */}
          {step === 0 && (
            <>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, color:D.t2, marginBottom:5, fontWeight:600, textTransform:"uppercase", letterSpacing:.4 }}>Full Name</div>
                <input
                  type="text" value={form.name} autoFocus
                  placeholder="e.g. Atharva Joshi"
                  onChange={e => set("name", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ fontSize:10, color:D.t2, marginBottom:10, fontWeight:600, textTransform:"uppercase", letterSpacing:.4 }}>Gender</div>
              <div style={{ display:"flex", gap:10 }}>
                {["Male","Female"].map(g => (
                  <div key={g} onClick={() => set("gender", g)} style={{
                    flex:1, textAlign:"center", padding:"18px 0",
                    borderRadius:11, cursor:"pointer",
                    background: form.gender===g ? D.yellowDim : D.s2,
                    border:`1px solid ${form.gender===g ? D.yellow+"66" : D.border}`,
                    transition:"all 0.18s",
                  }}>
                    <div style={{ fontSize:32, marginBottom:6 }}>{g==="Male"?"👨":"👩"}</div>
                    <div style={{ fontWeight:700, fontSize:12, color:form.gender===g?D.yellow:D.t1 }}>{g}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── STEP 1: Body Stats ── */}
          {step === 1 && (
            <>
              {[
                { key:"age",        label:"Age",    unit:"yrs", min:10,  max:80,  step:1   },
                { key:"weight_kg",  label:"Weight", unit:"kg",  min:30,  max:200, step:0.5 },
                { key:"height_cm",  label:"Height", unit:"cm",  min:100, max:220, step:0.5 },
              ].map(s => (
                <div key={s.key} style={{ marginBottom:20 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:D.t1 }}>{s.label}</div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:18, fontWeight:700, color:D.yellow }}>
                      {form[s.key]} <span style={{ fontSize:11, color:D.t2 }}>{s.unit}</span>
                    </div>
                  </div>
                  <input type="range" min={s.min} max={s.max} step={s.step}
                    value={form[s.key]} onChange={e => set(s.key, +e.target.value)} />
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:D.t3, marginTop:3 }}>
                    <span>{s.min}{s.unit}</span><span>{s.max}{s.unit}</span>
                  </div>
                </div>
              ))}

              {/* Live BMI */}
              <div style={{
                background:D.s2, borderRadius:11, padding:"12px 14px",
                display:"flex", alignItems:"center", justifyContent:"space-between",
                border:`1px solid ${bmiColor}33`,
              }}>
                <div>
                  <div style={{ fontSize:10, color:D.t2, marginBottom:2 }}>Your BMI</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:26, fontWeight:700, color:bmiColor }}>{bmi}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:bmiColor }}>{bmiCat}</div>
                  <div style={{ fontSize:10, color:D.t2, marginTop:2 }}>{form.weight_kg}kg · {form.height_cm}cm</div>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 2: Activity ── */}
          {step === 2 && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {ACTIVITY_OPTIONS.map(opt => (
                <div key={opt.val} onClick={() => set("activity_level", opt.val)}
                  style={selCard(form.activity_level===opt.val)}>
                  <span style={{ fontSize:22 }}>{opt.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:12, color:form.activity_level===opt.val?D.yellow:D.t1 }}>{opt.label}</div>
                    <div style={{ fontSize:10, marginTop:2, color:form.activity_level===opt.val?"rgba(255,214,10,0.5)":D.t2 }}>{opt.sub}</div>
                  </div>
                  {form.activity_level===opt.val && (
                    <div style={{ width:18, height:18, borderRadius:"50%", background:D.yellow, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:D.bg }}>✓</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── STEP 3: Goal ── */}
          {step === 3 && (
            <>
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
                {GOAL_OPTIONS.map(g => (
                  <div key={g.val} onClick={() => set("goal", g.val)} style={{
                    display:"flex", alignItems:"center", gap:14,
                    padding:"14px", borderRadius:11, cursor:"pointer",
                    background: form.goal===g.val ? `${g.color}18` : D.s2,
                    border:`1px solid ${form.goal===g.val ? g.color+"66" : D.border}`,
                    transition:"all 0.18s",
                  }}>
                    <span style={{ fontSize:28 }}>{g.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:form.goal===g.val?g.color:D.t1 }}>{g.label}</div>
                      {g.desc.split("\n").map((line,i) => (
                        <div key={i} style={{ fontSize:11, marginTop:i===0?3:1, color:form.goal===g.val?`${g.color}88`:D.t2 }}>{line}</div>
                      ))}
                    </div>
                    {form.goal===g.val && (
                      <div style={{ width:18, height:18, borderRadius:"50%", background:g.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#fff" }}>✓</div>
                    )}
                  </div>
                ))}
              </div>

              {/* TDEE preview */}
              <div style={{ background:D.yellowDim, border:`1px solid ${D.yellow}22`, borderRadius:11, padding:"12px 14px" }}>
                <div style={{ fontSize:10, color:D.t2, marginBottom:4 }}>Your personalised target</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:24, fontWeight:700, color:D.yellow }}>{calGoal}</span>
                    <span style={{ fontSize:11, color:D.t2 }}> kcal/day</span>
                  </div>
                  <div style={{ textAlign:"right", fontSize:11, color:D.t2 }}>
                    <div>TDEE: {tdee} kcal</div>
                    <div style={{ marginTop:2 }}>
                      {form.goal==="weight_loss"?"−500 for fat loss":form.goal==="muscle_gain"?"+300 for muscle":"at maintenance"}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 4: Diet ── */}
          {step === 4 && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {DIET_OPTIONS.map(d => (
                <div key={d.val} onClick={() => set("diet_type", d.val)}
                  style={gridCard(form.diet_type===d.val, D.yellow)}>
                  <div style={{ fontSize:26, marginBottom:6 }}>{d.emoji}</div>
                  <div style={{ fontWeight:600, fontSize:11, color:form.diet_type===d.val?D.yellow:D.t1 }}>{d.val}</div>
                  {form.diet_type===d.val && (
                    <div style={{ position:"absolute", top:7, right:7, width:16, height:16, borderRadius:"50%", background:D.yellow, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:D.bg }}>✓</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── STEP 5: Allergies ── */}
          {step === 5 && (
            <>
              <div style={{ fontSize:11, color:D.t2, marginBottom:14 }}>
                Tap all that apply. We'll warn you when food contains these.
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                {ALLERGY_OPTIONS.map(a => {
                  const sel = form.allergies.includes(a.val);
                  return (
                    <div key={a.val} onClick={() => toggleAllergy(a.val)}
                      style={gridCard(sel, D.coral)}>
                      {sel && (
                        <div style={{ position:"absolute", top:7, right:7, width:16, height:16, borderRadius:"50%", background:D.coral, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#fff" }}>✓</div>
                      )}
                      <div style={{ fontSize:24, marginBottom:5 }}>{a.emoji}</div>
                      <div style={{ fontWeight:600, fontSize:11, color:sel?D.coral:D.t1, textTransform:"capitalize" }}>{a.val}</div>
                    </div>
                  );
                })}
              </div>

              {/* None */}
              <div onClick={() => set("allergies",[])} style={{
                padding:"11px 14px", borderRadius:11, cursor:"pointer", textAlign:"center",
                background: form.allergies.length===0 ? D.greenDim : D.s2,
                border:`1px solid ${form.allergies.length===0 ? D.green+"66" : D.border}`,
                fontWeight:700, fontSize:12,
                color: form.allergies.length===0 ? D.green : D.t1,
                marginBottom:14, transition:"all 0.18s",
              }}>
                ✅ No Allergies
              </div>

              {/* Summary */}
              <div style={{ background:D.yellowDim, border:`1px solid ${D.yellow}22`, borderRadius:11, padding:"12px 14px" }}>
                <div style={{ fontSize:9, fontWeight:700, color:D.yellow, marginBottom:10, textTransform:"uppercase", letterSpacing:.5, fontFamily:"'DM Mono',monospace" }}>Profile Summary</div>
                {[
                  { label:"Name",      val:form.name||"Not set" },
                  { label:"Body",      val:`${form.weight_kg}kg · ${form.height_cm}cm · BMI ${bmi}` },
                  { label:"Goal",      val:`${calGoal} kcal/day (${form.goal.replace("_"," ")})` },
                  { label:"Diet",      val:form.diet_type },
                  { label:"Allergies", val:form.allergies.length>0?form.allergies.join(", "):"None" },
                ].map(row => (
                  <div key={row.label} style={{
                    display:"flex", justifyContent:"space-between",
                    fontSize:11, padding:"5px 0",
                    borderBottom:`1px solid ${D.border}`,
                  }}>
                    <span style={{ color:D.t2 }}>{row.label}</span>
                    <span style={{ fontWeight:600, color:D.t1, textAlign:"right", maxWidth:"60%" }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Nav buttons ── */}
          <div style={{ display:"flex", gap:10, marginTop:24 }}>
            <button onClick={back} style={{
              flex:1, padding:"13px 0",
              background:D.s2, color:D.t1,
              border:`1px solid ${D.border2}`,
              borderRadius:10, fontWeight:700,
              fontSize:12, cursor:"pointer",
              fontFamily:"'Inter',sans-serif",
              transition:"border-color 0.15s",
            }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=`${D.yellow}44`}
            onMouseLeave={e=>e.currentTarget.style.borderColor=D.border2}>
              ← Back
            </button>
            <button
              onClick={next}
              disabled={step===0 && !form.name.trim()}
              style={{
                flex:2, padding:"13px 0",
                background: step===0 && !form.name.trim() ? D.s3 : D.yellow,
                color:      step===0 && !form.name.trim() ? D.t3  : D.bg,
                border:"none", borderRadius:10,
                fontWeight:700, fontSize:12, cursor:"pointer",
                fontFamily:"'Inter',sans-serif", transition:"opacity 0.15s",
              }}
              onMouseEnter={e=>{ if(!(step===0&&!form.name.trim())) e.currentTarget.style.opacity=".85"; }}
              onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              {step===TOTAL-1 ? "🚀 Let's Go!" : "Continue →"}
            </button>
          </div>

          {/* Skip */}
          {step < TOTAL-1 && (
            <div style={{ textAlign:"center", marginTop:14 }}>
              <span onClick={() => navigate("/dashboard")} style={{ fontSize:11, color:D.t3, cursor:"pointer", transition:"color 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.color=D.yellow}
                onMouseLeave={e=>e.currentTarget.style.color=D.t3}>
                Skip for now
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}