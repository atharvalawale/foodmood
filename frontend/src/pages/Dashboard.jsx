import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

// ─── Tokens ───────────────────────────────────────────────────────────────────
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

const rnd  = v => Math.round(v||0);
const clamp= (v,lo=0,hi=100) => Math.max(lo,Math.min(hi,v));

function calcTDEE(w,h,age,gender,act){
  const bmr=gender==="Male"?10*w+6.25*h-5*age+5:10*w+6.25*h-5*age-161;
  const m={Sedentary:1.2,Lightly:1.375,Moderately:1.55,Very:1.725,Extremely:1.9};
  return Math.round(bmr*(m[Object.keys(m).find(k=>(act||"").includes(k))||"Moderately"]));
}
function calcGoal(tdee,goal){return goal==="weight_loss"?tdee-500:goal==="muscle_gain"?tdee+300:tdee;}
function greet(){const h=new Date().getHours();return h<12?"Morning":h<17?"Afternoon":"Evening";}
function timeAgo(iso){if(!iso)return"";const m=(Date.now()-new Date(iso))/60000;return m<2?"now":m<60?`${rnd(m)}m`:m<1440?`${rnd(m/60)}h`:"1d";}
function getMealSlot(){const h=new Date().getHours();return h<10?"breakfast":h<14?"lunch":h<18?"snack":"dinner";}

// ─── Animated number ──────────────────────────────────────────────────────────
function Num({to,dur=700}){
  const [v,setV]=useState(0);
  const r=useRef(),t=useRef();
  useEffect(()=>{
    if(!to){setV(0);return;}
    t.current=null;
    const run=ts=>{if(!t.current)t.current=ts;const p=Math.min((ts-t.current)/dur,1);setV(Math.round((1-Math.pow(1-p,3))*to));if(p<1)r.current=requestAnimationFrame(run);};
    r.current=requestAnimationFrame(run);
    return()=>cancelAnimationFrame(r.current);
  },[to]);
  return<>{v.toLocaleString()}</>;
}

// ─── Mini arc (calorie) ───────────────────────────────────────────────────────
function Arc({val,goal,size=140,sw=10}){
  const pct=clamp(val/goal*100,0,100);
  const r=(size-sw)/2, cx=size/2, cy=size/2;
  const circ=2*Math.PI*r;
  const color=pct>100?D.coral:pct>80?D.amber:pct>40?D.yellow:D.green;
  const dash=(pct/100)*circ*0.75;
  const gap=circ*0.25;
  return(
    <svg width={size} height={size} style={{transform:"rotate(135deg)"}}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={D.s3} strokeWidth={sw}
        strokeDasharray={`${circ*0.75} ${circ*0.25}`} strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
        style={{transition:"stroke-dasharray 1s cubic-bezier(.4,0,.2,1)"}}/>
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard(){
  const nav=useNavigate();
  const [log,setLog]=useState([]);
  const [tot,setTot]=useState({calories:0,protein:0,carbs:0,fat:0,fiber:0,sugar:0,sodium:0});
  const [streak,setStreak]=useState(0);
  const [score,setScore]=useState(null);
  const [reco,setReco]=useState("");
  const [loading,setLoading]=useState(true);
  const [weekly,setWeekly]=useState(null);
  const [tab,setTab]=useState("log");
  const [glasses,setGlasses]=useState(0);
  const [expanded,setExpanded]=useState(null);

  const p=JSON.parse(localStorage.getItem("foodmood_user")||"{}");
  const{name="Friend",weight_kg=70,height_cm=170,age=25,gender="Male",activity_level="Moderately Active",goal="maintenance"}=p;
  const tdee=calcTDEE(weight_kg,height_cm,age,gender,activity_level);
  const calGoal=calcGoal(tdee,goal);
  const tgt={calories:calGoal,protein:goal==="muscle_gain"?180:goal==="weight_loss"?120:100,carbs:goal==="weight_loss"?150:250,fat:goal==="weight_loss"?50:65};

  useEffect(()=>{load();},[]);

  async function load(){
    setLoading(true);
    try{
      const r=await api.get("/daily-log");const d=r.data;
      setLog(d.meals||[]);setTot(d.totals||tot);setStreak(d.streak||0);
      if(d.health_score!==undefined)setScore(d.health_score);
      if(d.recommendation)setReco(d.recommendation);
      if(d.weekly)setWeekly(d.weekly);
    }catch{
      const demo=[
        {id:1,food_name:"Oats + Banana",quantity:300,unit:"g",meal_time:"breakfast",calories:380,protein:12,carbs:68,fat:6,fiber:6,sugar:18,sodium:140,logged_at:new Date(Date.now()-7200000).toISOString()},
        {id:2,food_name:"Chicken Rice Bowl",quantity:400,unit:"g",meal_time:"lunch",calories:520,protein:44,carbs:52,fat:10,fiber:3,sugar:2,sodium:420,logged_at:new Date(Date.now()-3600000).toISOString()},
        {id:3,food_name:"Whey Shake",quantity:300,unit:"ml",meal_time:"snack",calories:180,protein:28,carbs:10,fat:2,fiber:0,sugar:6,sodium:180,logged_at:new Date(Date.now()-900000).toISOString()},
      ];
      setLog(demo);setTot({calories:1080,protein:84,carbs:130,fat:18,fiber:9,sugar:26,sodium:740});
      setStreak(12);setScore(81);setReco("Great protein! Add veggies at dinner for fiber.");
      setWeekly({days_goal_hit:5,days_total:7,consistency:"71%",averages:{calories:1740}});
    }
    setLoading(false);
  }

  async function del(id){
    try{await api.delete(`/log/${id}`);}catch{}
    const r=log.filter(m=>m.id!==id);setLog(r);
    setTot(r.reduce((a,m)=>({calories:a.calories+m.calories,protein:a.protein+m.protein,carbs:a.carbs+m.carbs,fat:a.fat+m.fat,fiber:a.fiber+(m.fiber||0),sugar:a.sugar+(m.sugar||0),sodium:a.sodium+(m.sodium||0)}),{calories:0,protein:0,carbs:0,fat:0,fiber:0,sugar:0,sodium:0}));
  }

  const calPct=clamp(tot.calories/tgt.calories*100,0,100);
  const calLeft=Math.max(0,rnd(tgt.calories-tot.calories));
  const sc=score??0;
  const scColor=sc>=70?D.green:sc>=45?D.amber:D.coral;
  const mealIcons={breakfast:"🌅",lunch:"☀️",dinner:"🌙",snack:"🍎",order:"🛵"};
  const today=new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"});

  return(
    <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
      html,body{background:${D.bg};color:${D.t1};}
      .dash{font-family:'Inter',sans-serif;background:${D.bg};min-height:100vh;padding-bottom:72px;font-size:13px;}
      @keyframes shimmer{0%,100%{opacity:.3}50%{opacity:.6}}
      @keyframes up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      .sk{background:${D.s2};border-radius:8px;animation:shimmer 1.5s infinite;}
      .row{display:flex;align-items:center;}
      .card{background:${D.s1};border:1px solid ${D.border};border-radius:12px;}
      .tag{display:inline-flex;align-items:center;padding:2px 7px;border-radius:99px;font-size:10px;font-weight:600;font-family:'DM Mono',monospace;}
      ::-webkit-scrollbar{display:none;}
    `}</style>

    <div className="dash">

      {/* ── HEADER ── */}
      <div style={{background:D.s1,borderBottom:`1px solid ${D.border}`,padding:"48px 14px 12px"}}>
        <div className="row" style={{justifyContent:"space-between",marginBottom:12}}>
          <div>
            <div style={{fontSize:11,color:D.t2,marginBottom:2}}>{greet()}, {today}</div>
            <div style={{fontSize:18,fontWeight:700,color:D.t1,letterSpacing:"-0.3px"}}>{name} 👋</div>
          </div>
          <div className="row" style={{gap:8}}>
            {score!==null&&(
              <div style={{background:`${scColor}18`,border:`1px solid ${scColor}33`,borderRadius:8,padding:"4px 9px",fontSize:11,fontWeight:600,color:scColor}}>
                {sc}/100
              </div>
            )}
            {streak>0&&(
              <div style={{background:D.s2,border:`1px solid ${D.border}`,borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700,color:D.yellow}}>
                🔥{streak}
              </div>
            )}
          </div>
        </div>

        {/* Calorie row */}
        <div className="card" style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:14}}>
          {/* Mini arc */}
          <div style={{position:"relative",flexShrink:0}}>
            {loading?<div className="sk" style={{width:72,height:72,borderRadius:99}}/>:<>
              <Arc val={tot.calories} goal={tgt.calories} size={72} sw={7}/>
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontSize:13,fontWeight:700,color:D.t1,lineHeight:1,fontFamily:"'DM Mono',monospace"}}>
                  {loading?"-":<Num to={rnd(tot.calories)} dur={700}/>}
                </div>
                <div style={{fontSize:9,color:D.t2,marginTop:1}}>kcal</div>
              </div>
            </>}
          </div>

          <div style={{flex:1,minWidth:0}}>
            <div className="row" style={{justifyContent:"space-between",marginBottom:6}}>
              <div>
                <span style={{fontSize:11,color:D.t2}}>consumed / </span>
                <span style={{fontSize:11,color:D.t2}}>{tgt.calories.toLocaleString()} goal</span>
              </div>
              <span style={{fontSize:11,fontWeight:600,color:calLeft===0?D.green:D.t2}}>{calLeft===0?"Goal hit!":calLeft+" left"}</span>
            </div>
            {/* Progress bar */}
            <div style={{height:5,background:D.s3,borderRadius:99,overflow:"hidden",marginBottom:8}}>
              <div style={{height:"100%",width:`${calPct}%`,background:calPct>100?D.coral:calPct>80?D.amber:D.yellow,borderRadius:99,transition:"width 1s cubic-bezier(.4,0,.2,1)"}}/>
            </div>
            {/* Macros inline */}
            <div className="row" style={{gap:10}}>
              {[
                {l:"P",v:tot.protein,g:tgt.protein,c:D.blue},
                {l:"C",v:tot.carbs,g:tgt.carbs,c:D.green},
                {l:"F",v:tot.fat,g:tgt.fat,c:D.amber},
              ].map(m=>(
                <div key={m.l} style={{flex:1}}>
                  <div className="row" style={{justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:10,color:D.t2}}>{m.l}</span>
                    <span style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:D.t1}}>{rnd(m.v)}g</span>
                  </div>
                  <div style={{height:3,background:D.s3,borderRadius:99,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${clamp(m.v/m.g*100,0,100)}%`,background:m.c,borderRadius:99,transition:"width 1s"}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div style={{padding:"10px 14px 0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[
          {icon:"📷",label:"Scan Food",sub:"AI detection",bg:D.yellow,fg:D.bg,to:"/scanner"},
          {icon:"🍽️",label:"Order Food",sub:"Find restaurants",bg:D.s1,fg:D.t1,to:"/places",border:true},
        ].map(a=>(
          <button key={a.to} onClick={()=>nav(a.to)} style={{
            background:a.bg,color:a.fg,border:a.border?`1px solid ${D.border}`:"none",
            borderRadius:12,padding:"11px 12px",cursor:"pointer",textAlign:"left",
            fontFamily:"'Inter',sans-serif",transition:"opacity 0.15s",
          }}
          onMouseEnter={e=>e.currentTarget.style.opacity=".85"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
            <div style={{fontSize:18,marginBottom:6,lineHeight:1}}>{a.icon}</div>
            <div style={{fontSize:12,fontWeight:700}}>{a.label}</div>
            <div style={{fontSize:10,opacity:.55,marginTop:1}}>{a.sub}</div>
          </button>
        ))}
      </div>

      {/* ── MEAL TIMELINE ── */}
      <div style={{margin:"10px 14px 0"}} className="card">
        <div style={{padding:"10px 12px 8px"}}>
          <div style={{fontSize:11,fontWeight:600,color:D.t2,letterSpacing:.5,textTransform:"uppercase",marginBottom:10}}>Meal Timeline</div>
          <div style={{display:"flex",gap:0}}>
            {["breakfast","lunch","snack","dinner"].map((slot,i)=>{
              const meals=log.filter(m=>m.meal_time===slot);
              const done=meals.length>0;
              const curr=getMealSlot()===slot;
              const icons={breakfast:"🌅",lunch:"☀️",snack:"🍎",dinner:"🌙"};
              const cals=meals.reduce((s,m)=>s+(m.calories||0),0);
              return(
                <div key={slot} style={{flex:1,textAlign:"center",position:"relative"}}>
                  {i<3&&<div style={{position:"absolute",top:14,left:"50%",right:"-50%",height:1,background:D.s3,zIndex:0}}/>}
                  <div style={{
                    width:28,height:28,borderRadius:9,margin:"0 auto 5px",
                    background:done?D.yellow:curr?D.yellowDim:D.s2,
                    border:`1px solid ${done?D.yellow:curr?`${D.yellow}44`:D.border}`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:13,position:"relative",zIndex:1,
                  }}>{done?"✓":icons[slot]}</div>
                  <div style={{fontSize:9,fontWeight:600,color:done?D.yellow:curr?D.t1:D.t3}}>{slot.slice(0,5)}</div>
                  {done&&<div style={{fontSize:9,color:D.t2,fontFamily:"'DM Mono',monospace"}}>{rnd(cals)}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── DAILY MISSION ── */}
      {!loading&&(
        <div style={{margin:"10px 14px 0"}} className="card">
          <div style={{padding:"10px 12px"}}>
            <div className="row" style={{justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:600,color:D.t2,letterSpacing:.5,textTransform:"uppercase"}}>Daily Mission</div>
              <div style={{fontSize:10,fontWeight:700,color:D.yellow}}>
                {[tot.protein>=tgt.protein,tot.calories>=tgt.calories*0.8,log.length>=3].filter(Boolean).length}/3
              </div>
            </div>
            {[
              {label:"Protein",cur:rnd(tot.protein),goal:rnd(tgt.protein),unit:"g",color:D.blue},
              {label:"Calories",cur:rnd(tot.calories),goal:rnd(tgt.calories),unit:"kcal",color:D.yellow},
              {label:"Log 3 meals",cur:log.length,goal:3,unit:"",color:D.green},
            ].map(m=>{
              const pct=clamp(m.cur/m.goal*100,0,100);
              const done=m.cur>=m.goal;
              return(
                <div key={m.label} className="row" style={{gap:10,marginBottom:8}}>
                  <div style={{width:18,height:18,borderRadius:5,background:done?`${m.color}22`:D.s2,border:`1px solid ${done?m.color:D.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:m.color,flexShrink:0}}>
                    {done?"✓":""}
                  </div>
                  <div style={{flex:1}}>
                    <div className="row" style={{justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:11,fontWeight:500,color:done?m.color:D.t1}}>{m.label}</span>
                      <span style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:D.t2}}>{m.cur}/{m.goal}{m.unit}</span>
                    </div>
                    <div style={{height:4,background:D.s3,borderRadius:99,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:done?m.color:`${m.color}88`,borderRadius:99,transition:"width 1s"}}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── WATER ── */}
      <div style={{margin:"10px 14px 0"}} className="card">
        <div style={{padding:"10px 12px"}}>
          <div className="row" style={{justifyContent:"space-between",marginBottom:8}}>
            <div style={{fontSize:11,fontWeight:600,color:D.t2,letterSpacing:.5,textTransform:"uppercase"}}>Water</div>
            <span style={{fontSize:10,color:glasses>=8?D.green:D.t2,fontFamily:"'DM Mono',monospace"}}>{glasses}/8 glasses</span>
          </div>
          <div style={{display:"flex",gap:5}}>
            {Array.from({length:8}).map((_,i)=>(
              <button key={i} onClick={()=>setGlasses(g=>g===i+1?i:i+1)} style={{
                flex:1,height:28,borderRadius:7,border:"none",cursor:"pointer",
                background:i<glasses?D.blue:D.s2,
                transition:"all 0.15s",
                fontSize:12,
              }}>
                {i<glasses?"💧":""}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI NUDGE ── */}
      {!loading&&(
        <div style={{margin:"10px 14px 0",background:D.yellowDim,border:`1px solid ${D.yellow}22`,borderRadius:12,padding:"9px 12px"}}>
          <div style={{fontSize:11,color:D.t1,lineHeight:1.5}}>
            <span style={{color:D.yellow,fontWeight:600}}>✨ AI · </span>
            {reco||"Looking great today! Your nutrition is well balanced."}
          </div>
        </div>
      )}

      {/* ── TABS ── */}
      <div style={{padding:"10px 14px 0"}}>
        <div style={{display:"flex",background:D.s2,borderRadius:9,padding:3,gap:2,marginBottom:10}}>
          {[{v:"log",l:"Log"},{v:"weekly",l:"Week"},{v:"nutrients",l:"Nutrients"}].map(t=>(
            <button key={t.v} onClick={()=>setTab(t.v)} style={{
              flex:1,padding:"7px 4px",border:"none",borderRadius:7,
              fontWeight:600,fontSize:11,cursor:"pointer",
              fontFamily:"'Inter',sans-serif",transition:"all 0.18s",
              background:tab===t.v?D.yellow:"transparent",
              color:tab===t.v?D.bg:D.t2,
            }}>{t.l}</button>
          ))}
        </div>

        {/* LOG */}
        {tab==="log"&&(
          <>
            <div className="row" style={{justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:11,color:D.t2}}>{log.length} meal{log.length!==1?"s":""} today</span>
              <button onClick={()=>nav("/scanner")} style={{
                background:D.yellow,color:D.bg,border:"none",borderRadius:99,
                padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",
              }}>+ Add</button>
            </div>
            {loading?[1,2,3].map(i=><div key={i} className="sk" style={{height:64,marginBottom:6}}/>):
            log.length===0?(
              <div style={{textAlign:"center",padding:"32px 16px",background:D.s1,borderRadius:12,border:`1px dashed ${D.border}`}}>
                <div style={{fontSize:32,marginBottom:8}}>🥗</div>
                <div style={{fontSize:13,fontWeight:600,color:D.t1,marginBottom:4}}>Nothing logged yet</div>
                <div style={{fontSize:11,color:D.t2,marginBottom:14}}>Scan your first meal to start</div>
                <button onClick={()=>nav("/scanner")} style={{background:D.yellow,color:D.bg,border:"none",borderRadius:8,padding:"8px 18px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                  📷 Scan
                </button>
              </div>
            ):(
              <>
                {log.map((m,i)=>{
                  const isOpen=expanded===m.id;
                  return(
                    <div key={m.id} className="card" style={{marginBottom:6,overflow:"hidden",animation:`up 0.3s ${i*0.04}s both`}}>
                      <div className="row" style={{padding:"10px 12px",gap:10,cursor:"pointer"}} onClick={()=>setExpanded(isOpen?null:m.id)}>
                        <div style={{width:32,height:32,borderRadius:9,background:D.s2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>
                          {mealIcons[m.meal_time]||"🍽️"}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,color:D.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.food_name||m.name}</div>
                          <div style={{fontSize:10,color:D.t2,marginTop:2}}>{m.quantity}{m.unit} · {m.meal_time} · {timeAgo(m.logged_at)}</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontSize:13,fontWeight:700,color:D.t1,fontFamily:"'DM Mono',monospace"}}>{rnd(m.calories)}</div>
                          <div style={{fontSize:9,color:D.t2}}>kcal</div>
                        </div>
                      </div>
                      {isOpen&&(
                        <div style={{borderTop:`1px solid ${D.border}`,padding:"8px 12px"}}>
                          <div className="row" style={{gap:8,marginBottom:8}}>
                            {[{l:"Protein",v:m.protein,c:D.blue},{l:"Carbs",v:m.carbs,c:D.green},{l:"Fat",v:m.fat,c:D.amber}].map(x=>(
                              <div key={x.l} className="tag" style={{background:`${x.c}18`,color:x.c}}>
                                {x.l} {rnd(x.v)}g
                              </div>
                            ))}
                          </div>
                          <button onClick={()=>del(m.id)} style={{
                            background:D.coralDim,border:`1px solid ${D.coral}33`,borderRadius:7,
                            padding:"5px 10px",fontSize:11,fontWeight:600,color:D.coral,
                            cursor:"pointer",fontFamily:"'Inter',sans-serif",
                          }}>Delete</button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button onClick={async()=>{try{await api.delete("/daily-log");}catch{}setLog([]);setTot({calories:0,protein:0,carbs:0,fat:0,fiber:0,sugar:0,sodium:0});}} style={{
                  width:"100%",padding:"9px 0",background:"transparent",border:`1px dashed ${D.border}`,
                  borderRadius:10,color:D.t2,fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"'Inter',sans-serif",marginTop:4,
                }}>Clear log</button>
              </>
            )}
          </>
        )}

        {/* WEEKLY */}
        {tab==="weekly"&&(
          weekly?(
            <>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                {[
                  {v:`${weekly.days_goal_hit}/${weekly.days_total}`,l:"On track",c:D.green},
                  {v:weekly.consistency,l:"Consistency",c:D.yellow},
                  {v:`${weekly.averages?.calories}`,l:"Avg kcal",c:D.coral},
                  {v:`${streak}d`,l:"Streak",c:D.purple},
                ].map(w=>(
                  <div key={w.l} className="card" style={{padding:"10px 12px"}}>
                    <div style={{fontSize:18,fontWeight:700,color:w.c,fontFamily:"'DM Mono',monospace"}}>{w.v}</div>
                    <div style={{fontSize:10,color:D.t2,marginTop:2}}>{w.l}</div>
                  </div>
                ))}
              </div>
              <div className="card" style={{padding:"12px"}}>
                <div style={{fontSize:11,fontWeight:600,color:D.t2,letterSpacing:.5,textTransform:"uppercase",marginBottom:10}}>This week</div>
                <div style={{display:"flex",gap:6,alignItems:"flex-end",height:72}}>
                  {["M","T","W","T","F","S","S"].map((d,i)=>{
                    const h=[68,82,51,94,73,100,38][i];
                    const isToday=i===(new Date().getDay()+6)%7;
                    return(
                      <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                        <div style={{width:"100%",height:`${h}%`,borderRadius:5,background:isToday?D.yellow:h>70?`${D.green}44`:D.s3,border:isToday?`1px solid ${D.yellow}`:isToday?"none":"none",transition:"height 0.7s"}}/>
                        <div style={{fontSize:9,fontWeight:isToday?700:400,color:isToday?D.yellow:D.t3}}>{d}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ):(
            <div style={{textAlign:"center",padding:"32px 0",color:D.t2}}>
              <div style={{fontSize:32,marginBottom:8}}>📅</div>
              <div style={{fontSize:12}}>Log meals for a few days to see your weekly report</div>
            </div>
          )
        )}

        {/* NUTRIENTS */}
        {tab==="nutrients"&&(
          <div className="card" style={{padding:"12px"}}>
            {[
              {l:"Fiber", v:tot.fiber, g:25,   u:"g",  c:D.purple},
              {l:"Sugar", v:tot.sugar, g:50,   u:"g",  c:D.coral },
              {l:"Sodium",v:tot.sodium,g:2300, u:"mg", c:D.amber },
            ].map(m=>{
              const pct=clamp(m.v/m.g*100,0,100);
              const over=m.v>m.g;
              return(
                <div key={m.l} style={{marginBottom:12}}>
                  <div className="row" style={{justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:11,fontWeight:600,color:over?m.c:D.t1}}>{over?"⚠️ ":""}{m.l}</span>
                    <span style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:D.t2}}>{rnd(m.v)}/{m.g}{m.u}</span>
                  </div>
                  <div style={{height:5,background:D.s3,borderRadius:99,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:over?m.c:m.c+"88",borderRadius:99,transition:"width 1s"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ACHIEVEMENTS ── */}
      {!loading&&(
        <div style={{margin:"10px 14px 0"}} className="card">
          <div style={{padding:"10px 12px"}}>
            <div style={{fontSize:11,fontWeight:600,color:D.t2,letterSpacing:.5,textTransform:"uppercase",marginBottom:10}}>Achievements</div>
            <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:2}}>
              {[
                {icon:"🔥",l:"On Fire",earned:streak>=7},
                {icon:"💪",l:"Protein+",earned:tot.protein>=tgt.protein},
                {icon:"🍽️",l:"3 Meals",earned:log.length>=3},
                {icon:"💧",l:"Hydrated",earned:glasses>=8},
                {icon:"🏆",l:"Champion",earned:streak>=30},
                {icon:"🥗",l:"Clean",earned:sc>=80},
              ].map(b=>(
                <div key={b.l} style={{flexShrink:0,textAlign:"center",opacity:b.earned?1:0.3}}>
                  <div style={{width:40,height:40,borderRadius:12,background:b.earned?D.yellowDim:D.s2,border:`1px solid ${b.earned?D.yellow+"44":D.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,margin:"0 auto 4px"}}>
                    {b.icon}
                  </div>
                  <div style={{fontSize:9,fontWeight:600,color:b.earned?D.t1:D.t3}}>{b.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PROFILE ROW ── */}
      <button onClick={()=>nav("/profile")} style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",
        margin:"10px 14px 0",padding:"10px 12px",
        background:D.s1,border:`1px solid ${D.border}`,borderRadius:12,
        cursor:"pointer",fontFamily:"'Inter',sans-serif",width:"calc(100% - 28px)",
        transition:"border-color 0.15s",
      }}
      onMouseEnter={e=>e.currentTarget.style.borderColor=`${D.yellow}44`}
      onMouseLeave={e=>e.currentTarget.style.borderColor=D.border}>
        <div className="row" style={{gap:10}}>
          <div style={{width:32,height:32,borderRadius:9,background:D.yellow,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:D.bg}}>
            {name[0]?.toUpperCase()||"?"}
          </div>
          <div style={{textAlign:"left"}}>
            <div style={{fontSize:12,fontWeight:600,color:D.t1}}>{name}</div>
            <div style={{fontSize:10,color:D.t2}}>{goal.replace("_"," ")} · {calGoal.toLocaleString()} kcal · TDEE {tdee.toLocaleString()}</div>
          </div>
        </div>
        <div style={{fontSize:11,color:D.t3}}>→</div>
      </button>

    </div>

    {/* FAB */}
    <button onClick={()=>nav("/scanner")} style={{
      position:"fixed",bottom:82,right:16,zIndex:200,
      width:46,height:46,borderRadius:14,
      background:D.yellow,border:"none",cursor:"pointer",
      fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",
      boxShadow:`0 4px 16px rgba(255,214,10,0.35)`,
      transition:"transform 0.15s",
    }}
    onMouseEnter={e=>e.currentTarget.style.transform="scale(1.06)"}
    onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
      📷
    </button>
    </>
  );
}