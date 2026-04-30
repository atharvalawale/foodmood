import { useState, useEffect } from "react";
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

// ─── Formulas ─────────────────────────────────────────────────────────────────
function calculate_bmi(weight_kg, height_cm) {
  if (!height_cm) return { bmi:0, category:"Unknown", color:D.t2 };
  const h = height_cm / 100;
  const bmi = +(weight_kg / (h*h)).toFixed(1);
  const category = bmi<18.5?"Underweight 🔵":bmi<25?"Normal ✅":bmi<30?"Overweight 🟡":"Obese 🔴";
  const color     = bmi<18.5?D.blue:bmi<25?D.green:bmi<30?D.amber:D.coral;
  return { bmi, category, color };
}
function calculate_tdee(weight_kg, height_cm, age, gender, activity_level) {
  const bmr = gender==="Male"
    ? 10*weight_kg+6.25*height_cm-5*age+5
    : 10*weight_kg+6.25*height_cm-5*age-161;
  const factors = { "Sedentary":1.2,"Lightly":1.375,"Moderately":1.55,"Very":1.725,"Extremely":1.9 };
  const key = Object.keys(factors).find(k=>(activity_level||"").includes(k))||"Moderately";
  return Math.round(bmr*factors[key]);
}
function goal_calories(tdee, goal) {
  if (goal==="weight_loss") return tdee-500;
  if (goal==="muscle_gain") return tdee+300;
  return tdee;
}

const ACTIVITY_OPTIONS = [
  "Sedentary (desk job, no exercise)",
  "Lightly Active (exercise 1-3 days/wk)",
  "Moderately Active (exercise 3-5 days)",
  "Very Active (exercise 6-7 days)",
  "Extremely Active (athlete/hard labor)",
];
const DIET_OPTIONS = ["No restriction","Vegetarian","Vegan","Keto","Halal","Gluten-free","Diabetic-friendly"];
const GOAL_OPTIONS = [
  { val:"maintenance", label:"Maintain", emoji:"⚖️", desc:"Eat at TDEE" },
  { val:"weight_loss", label:"Lose Fat",  emoji:"🔥", desc:"TDEE − 500" },
  { val:"muscle_gain", label:"Muscle",   emoji:"💪", desc:"TDEE + 300" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionLabel({ children, top=true }) {
  return (
    <div style={{ fontSize:9, color:D.t2, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10, marginTop:top?20:0, fontFamily:"'DM Mono',monospace", fontWeight:600 }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ flex:1, background:D.s2, border:`1px solid ${color}33`, borderRadius:10, padding:"11px 8px", textAlign:"center" }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:18, fontWeight:700, color:color||D.t1 }}>{value}</div>
      <div style={{ fontSize:9, color:D.t2, marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:9, color:color, marginTop:3, fontWeight:600 }}>{sub}</div>}
    </div>
  );
}

const inputStyle = (editing) => ({
  width:"100%", background:editing?D.s2:D.s1,
  border:`1px solid ${editing?D.border2:D.border}`,
  borderRadius:10, fontSize:13, padding:"11px 13px",
  outline:"none", boxSizing:"border-box",
  fontFamily:"'Inter',sans-serif", color:D.t1,
  transition:"border-color 0.2s",
  opacity: editing ? 1 : 0.7,
});

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();
  const [saved,   setSaved]   = useState(false);
  const [editing, setEditing] = useState(false);

  const load = () => JSON.parse(localStorage.getItem("foodmood_user")||"{}");

  const [form, setForm] = useState({
    name:"", gender:"Male", age:25,
    weight_kg:70, height_cm:170,
    activity_level:"Moderately Active (exercise 3-5 days)",
    goal:"maintenance", diet_type:"No restriction", allergies:"",
    ...load(),
  });

  useEffect(() => { setForm(f=>({...f,...load()})); }, []);
  const set = (key, val) => setForm(f=>({...f,[key]:val}));

  const { bmi, category:bmiCat, color:bmiColor } = calculate_bmi(form.weight_kg, form.height_cm);
  const tdee    = calculate_tdee(form.weight_kg, form.height_cm, form.age, form.gender, form.activity_level);
  const calGoal = goal_calories(tdee, form.goal);
  const protein = form.goal==="muscle_gain"?180:form.goal==="weight_loss"?120:100;
  const carbs   = form.goal==="weight_loss"?150:250;
  const fat     = form.goal==="weight_loss"?50:65;
  const allergyList = form.allergies ? form.allergies.split(",").map(a=>a.trim().toLowerCase()).filter(Boolean) : [];

  async function saveProfile() {
    const profile = { ...form, bmi, tdee, calGoal, allergies_list:allergyList };
    localStorage.setItem("foodmood_user", JSON.stringify(profile));
    try { await api.post("/profile", profile); } catch {}
    setSaved(true); setEditing(false);
    setTimeout(()=>setSaved(false), 3000);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        html,body { background:${D.bg}; color:${D.t1}; }
        .profile { font-family:'Inter',sans-serif; background:${D.bg}; min-height:100vh; padding-bottom:90px; color:${D.t1}; font-size:13px; }
        select { appearance:none; }
        select option { background:${D.s2}; color:${D.t1}; }
        input[type=range] { accent-color:${D.yellow}; width:100%; height:4px; cursor:pointer; }
        input[type=range]:focus { outline:none; }
        input:focus,select:focus,textarea:focus { border-color:${D.yellow}66 !important; outline:none; }
        ::-webkit-scrollbar { display:none; }
        .card { background:${D.s1}; border:1px solid ${D.border}; border-radius:12px; }
      `}</style>

      <div className="profile">

        {/* ── Header ── */}
        <div style={{ background:D.s1, borderBottom:`1px solid ${D.border}`, padding:"48px 14px 14px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <button onClick={() => navigate("/dashboard")} style={{
              background:D.s2, border:`1px solid ${D.border}`,
              borderRadius:9, width:32, height:32,
              cursor:"pointer", fontSize:14, color:D.t1, flexShrink:0,
            }}>←</button>
            <div style={{ fontSize:16, fontWeight:700, color:D.t1, flex:1, letterSpacing:"-0.3px" }}>My Profile 👤</div>
            <button onClick={() => setEditing(e=>!e)} style={{
              background: editing ? D.s2 : D.yellow,
              color: editing ? D.t1 : D.bg,
              border: editing ? `1px solid ${D.border2}` : "none",
              borderRadius:99, padding:"6px 14px",
              fontWeight:700, fontSize:11, cursor:"pointer",
              fontFamily:"'Inter',sans-serif", transition:"all 0.15s",
            }}>
              {editing ? "Cancel" : "✏️ Edit"}
            </button>
          </div>

          {/* Avatar + name */}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{
              width:48, height:48, borderRadius:13,
              background:D.yellow, color:D.bg,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:22, fontWeight:700, flexShrink:0,
            }}>
              {form.name ? form.name[0].toUpperCase() : "?"}
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:D.t1 }}>{form.name||"Your Name"}</div>
              <div style={{ fontSize:11, color:D.t2, marginTop:2 }}>{form.gender} · {form.age} yrs · {form.diet_type}</div>
            </div>
          </div>
        </div>

        <div style={{ padding:"0 14px" }}>

          {/* ── Stats ── */}
          <SectionLabel>📊 Auto-Calculated Stats</SectionLabel>
          <div style={{ display:"flex", gap:8, marginBottom:8 }}>
            <StatCard label="BMI"      value={bmi}          sub={bmiCat}                          color={bmiColor} />
            <StatCard label="TDEE"     value={`${tdee}`}    sub="kcal/day"                        color={D.amber}  />
            <StatCard label="Cal Goal" value={`${calGoal}`} sub={form.goal.replace("_"," ")}      color={D.blue}   />
          </div>
          <div style={{ display:"flex", gap:8, marginBottom:8 }}>
            <StatCard label="Protein"  value={`${protein}g`} sub="daily target" color={D.blue}  />
            <StatCard label="Carbs"    value={`${carbs}g`}   sub="daily target" color={D.green} />
            <StatCard label="Fat"      value={`${fat}g`}     sub="daily target" color={D.coral} />
          </div>

          {/* Goal note */}
          <div style={{ background:D.yellowDim, border:`1px solid ${D.yellow}22`, borderRadius:10, padding:"9px 12px", fontSize:11, color:D.t1, marginBottom:4 }}>
            <span style={{ color:D.yellow, fontWeight:700 }}>🎯 Target: {calGoal} kcal/day</span>
            {form.goal==="weight_loss" && <span style={{ color:D.t2 }}> · TDEE − 500 → lose ~0.5kg/week</span>}
            {form.goal==="muscle_gain" && <span style={{ color:D.t2 }}> · TDEE + 300 → gain muscle</span>}
            {form.goal==="maintenance"&& <span style={{ color:D.t2 }}> · eating at TDEE</span>}
          </div>

          {/* ── Personal Info ── */}
          <SectionLabel>👤 Personal Info</SectionLabel>

          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, color:D.t2, marginBottom:5, fontWeight:600, textTransform:"uppercase", letterSpacing:.4 }}>Your Name</div>
            <input type="text" value={form.name} disabled={!editing}
              onChange={e=>set("name",e.target.value)} placeholder="Enter your name"
              style={inputStyle(editing)} />
          </div>

          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, color:D.t2, marginBottom:5, fontWeight:600, textTransform:"uppercase", letterSpacing:.4 }}>Gender</div>
            <div style={{ display:"flex", gap:8 }}>
              {["Male","Female"].map(g=>(
                <button key={g} disabled={!editing} onClick={()=>set("gender",g)} style={{
                  flex:1, padding:"10px 0", border:`1px solid`,
                  borderColor: form.gender===g ? `${D.yellow}66` : D.border,
                  borderRadius:10, fontWeight:700, fontSize:12,
                  background: form.gender===g ? D.yellowDim : D.s2,
                  color: form.gender===g ? D.yellow : D.t2,
                  cursor: editing?"pointer":"default",
                  fontFamily:"'Inter',sans-serif", transition:"all 0.15s",
                }}>
                  {g==="Male"?"👨 Male":"👩 Female"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, color:D.t2, marginBottom:5, fontWeight:600, textTransform:"uppercase", letterSpacing:.4 }}>Age: {form.age} years</div>
            <input type="range" min="10" max="100" value={form.age}
              disabled={!editing} onChange={e=>set("age",+e.target.value)} />
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:D.t3, marginTop:3 }}>
              <span>10</span><span style={{ color:D.yellow, fontWeight:700 }}>{form.age} yrs</span><span>100</span>
            </div>
          </div>

          {/* ── Body Measurements ── */}
          <SectionLabel>⚖️ Body Measurements</SectionLabel>
          <div style={{ display:"flex", gap:8, marginBottom:10 }}>
            {[
              { key:"weight_kg", label:`Weight: ${form.weight_kg}kg`, min:30,  max:300, step:0.5 },
              { key:"height_cm", label:`Height: ${form.height_cm}cm`, min:100, max:250, step:0.5 },
            ].map(f=>(
              <div key={f.key} style={{ flex:1 }}>
                <div style={{ fontSize:10, color:D.t2, marginBottom:5, fontWeight:600, textTransform:"uppercase", letterSpacing:.4 }}>{f.label}</div>
                <input type="number" value={form[f.key]} min={f.min} max={f.max} step={f.step}
                  disabled={!editing} onChange={e=>set(f.key,+e.target.value)}
                  style={inputStyle(editing)} />
              </div>
            ))}
          </div>

          {/* BMI bar */}
          <div className="card" style={{ padding:"11px 13px", marginBottom:4 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:12, fontWeight:600, color:D.t1 }}>BMI: <span style={{ fontFamily:"'DM Mono',monospace" }}>{bmi}</span></span>
              <span style={{ fontSize:12, color:bmiColor, fontWeight:700 }}>{bmiCat}</span>
            </div>
            <div style={{ height:6, background:`linear-gradient(to right,${D.blue} 0%,${D.green} 30%,${D.amber} 65%,${D.coral} 100%)`, borderRadius:99, position:"relative" }}>
              <div style={{
                position:"absolute", top:"50%", transform:"translate(-50%,-50%)",
                left:`${Math.min(Math.max(((bmi-10)/30)*100,0),100)}%`,
                width:12, height:12, borderRadius:"50%",
                background:D.t1, border:`2px solid ${D.bg}`,
              }}/>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:D.t3, marginTop:5 }}>
              <span>Underweight</span><span>Normal</span><span>Overweight</span><span>Obese</span>
            </div>
          </div>

          {/* ── Activity Level ── */}
          <SectionLabel>🏃 Activity Level</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:4 }}>
            {ACTIVITY_OPTIONS.map(opt=>(
              <div key={opt} onClick={()=>editing&&set("activity_level",opt)} style={{
                display:"flex", alignItems:"center", gap:10,
                background: form.activity_level===opt ? D.yellowDim : D.s2,
                border:`1px solid ${form.activity_level===opt ? D.yellow+"66" : D.border}`,
                borderRadius:10, padding:"10px 12px",
                cursor:editing?"pointer":"default", transition:"all 0.15s",
              }}>
                <div style={{
                  width:14, height:14, borderRadius:"50%", flexShrink:0,
                  border:`2px solid ${form.activity_level===opt ? D.yellow : D.t3}`,
                  background: form.activity_level===opt ? D.yellow : "transparent",
                }}/>
                <span style={{ fontSize:12, fontWeight:form.activity_level===opt?700:400, color:form.activity_level===opt?D.yellow:D.t1 }}>
                  {opt}
                </span>
              </div>
            ))}
          </div>

          {/* ── Fitness Goal ── */}
          <SectionLabel>🎯 Fitness Goal</SectionLabel>
          <div style={{ display:"flex", gap:8, marginBottom:4 }}>
            {GOAL_OPTIONS.map(g=>(
              <div key={g.val} onClick={()=>editing&&set("goal",g.val)} style={{
                flex:1, textAlign:"center", padding:"13px 6px",
                background: form.goal===g.val ? D.yellowDim : D.s2,
                color: form.goal===g.val ? D.yellow : D.t2,
                borderRadius:10, cursor:editing?"pointer":"default",
                border:`1px solid ${form.goal===g.val ? D.yellow+"66" : D.border}`,
                transition:"all 0.15s",
              }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{g.emoji}</div>
                <div style={{ fontWeight:700, fontSize:11 }}>{g.label}</div>
                <div style={{ fontSize:9, marginTop:3, color:form.goal===g.val?"rgba(255,214,10,0.5)":D.t3 }}>{g.desc}</div>
              </div>
            ))}
          </div>

          {/* ── Diet Type ── */}
          <SectionLabel>🥗 Diet Type</SectionLabel>
          <div style={{ marginBottom:10 }}>
            <select value={form.diet_type} disabled={!editing}
              onChange={e=>set("diet_type",e.target.value)}
              style={{ ...inputStyle(editing), cursor:editing?"pointer":"default" }}>
              {DIET_OPTIONS.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* ── Allergies ── */}
          <SectionLabel>⚠️ Allergies</SectionLabel>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, color:D.t2, marginBottom:5 }}>Comma-separated (e.g. nuts, dairy, gluten)</div>
            <input type="text" value={form.allergies} disabled={!editing}
              onChange={e=>set("allergies",e.target.value)} placeholder="e.g. nuts, dairy, gluten"
              style={inputStyle(editing)} />
          </div>
          {allergyList.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:4 }}>
              {allergyList.map(a=>(
                <span key={a} style={{
                  background:D.coralDim, color:D.coral,
                  border:`1px solid ${D.coral}33`,
                  borderRadius:99, padding:"3px 10px",
                  fontSize:10, fontWeight:600,
                }}>⚠️ {a}</span>
              ))}
            </div>
          )}

          {/* ── Profile Summary ── */}
          <SectionLabel>📋 Profile Summary</SectionLabel>
          <div className="card" style={{ padding:"12px 14px", marginBottom:14 }}>
            {[
              { label:"Name",         val:form.name||"Not set" },
              { label:"Body",         val:`${form.weight_kg}kg · ${form.height_cm}cm · ${form.gender}` },
              { label:"BMI",          val:`${bmi} (${bmiCat})` },
              { label:"TDEE",         val:`${tdee} kcal/day` },
              { label:"Daily Target", val:`${calGoal} kcal (${form.goal.replace("_"," ")})` },
              { label:"Diet",         val:form.diet_type },
              { label:"Allergies",    val:allergyList.length>0?allergyList.join(", "):"None" },
            ].map(row=>(
              <div key={row.label} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"6px 0", borderBottom:`1px solid ${D.border}` }}>
                <span style={{ color:D.t2 }}>{row.label}</span>
                <span style={{ fontWeight:600, color:D.t1, textAlign:"right", maxWidth:"60%" }}>{row.val}</span>
              </div>
            ))}
          </div>

          {/* ── Save ── */}
          {editing && (
            <button onClick={saveProfile} style={{
              width:"100%", padding:"13px 0",
              background:D.yellow, color:D.bg,
              border:"none", borderRadius:10,
              fontWeight:700, fontSize:13, cursor:"pointer",
              fontFamily:"'Inter',sans-serif", marginBottom:10,
              transition:"opacity 0.15s",
            }}
            onMouseEnter={e=>e.currentTarget.style.opacity=".85"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              💾 Save Profile
            </button>
          )}

          {saved && (
            <div style={{ background:D.greenDim, border:`1px solid ${D.green}33`, borderRadius:10, padding:"11px 14px", textAlign:"center", fontSize:12, color:D.green, fontWeight:600, marginBottom:10 }}>
              ✅ Profile saved! Dashboard will use your updated goals.
            </div>
          )}

          {/* ── Quick Actions ── */}
          <SectionLabel>Quick Actions</SectionLabel>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
            {[
              { icon:"📊", label:"Dashboard", to:"/dashboard" },
              { icon:"📷", label:"Scanner",   to:"/scanner"   },
              { icon:"📍", label:"Places",    to:"/places"    },
              { icon:"🚪", label:"Logout",    to:"/login"     },
            ].map(a=>(
              <button key={a.to} onClick={()=>{ if(a.label==="Logout") localStorage.clear(); navigate(a.to); }} style={{
                display:"flex", alignItems:"center", gap:10,
                background:D.s2, border:`1px solid ${D.border}`,
                borderRadius:10, padding:"12px 14px", cursor:"pointer",
                fontFamily:"'Inter',sans-serif", textAlign:"left",
                transition:"border-color 0.15s",
              }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=`${D.yellow}44`}
              onMouseLeave={e=>e.currentTarget.style.borderColor=D.border}>
                <span style={{ fontSize:20 }}>{a.icon}</span>
                <span style={{ fontWeight:700, fontSize:12, color:D.t1 }}>{a.label}</span>
              </button>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}