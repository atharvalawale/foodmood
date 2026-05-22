import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const D = {
  bg:"#000000",s1:"#0D0D0D",s2:"#141414",s3:"#1A1A1A",
  border:"rgba(255,255,255,0.05)",border2:"rgba(255,255,255,0.08)",
  t1:"#FFFFFF",t2:"rgba(255,255,255,0.35)",t3:"rgba(255,255,255,0.12)",
  purple:"#A78BFA",blue:"#60A5FA",green:"#34D399",red:"#F87171",amber:"#FBBF24",pink:"#F472B6",
};

const AURORA=[[167,139,250],[96,165,250],[244,114,182],[52,211,153],[167,139,250]];
const rnd=v=>Math.round(v||0);
const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,v));
function lerp(a,b,f){return a+(b-a)*f;}
function getAuroraColor(pos){
  const scaled=((pos%1)+1)%1*(AURORA.length-1);
  const i=Math.floor(scaled),f=scaled-i;
  const c1=AURORA[i],c2=AURORA[(i+1)%AURORA.length];
  return[lerp(c1[0],c2[0],f),lerp(c1[1],c2[1],f),lerp(c1[2],c2[2],f)];
}
function greet(){const h=new Date().getHours();return h<12?"Good morning":h<17?"Good afternoon":"Good evening";}
function timeAgo(iso){
  if(!iso)return"";
  const m=(Date.now()-new Date(iso))/60000;
  return m<2?"just now":m<60?`${rnd(m)}m ago`:`${rnd(m/60)}h ago`;
}
function calcTDEE(w,h,age,gender,act){
  const bmr=gender==="Male"?10*w+6.25*h-5*age+5:10*w+6.25*h-5*age-161;
  const m={Sedentary:1.2,Lightly:1.375,Moderately:1.55,Very:1.725,Extremely:1.9};
  return Math.round(bmr*(m[Object.keys(m).find(k=>(act||"").includes(k))||"Moderately"]));
}
function calcGoal(tdee,goal){return goal==="weight_loss"?tdee-500:goal==="muscle_gain"?tdee+300:tdee;}

const MEAL_SLOTS=[
  {key:"morning",      label:"Morning",      emoji:"🌅",hour:[0,10]},
  {key:"morning_snack",label:"Morning Snack",emoji:"🍎",hour:[10,12]},
  {key:"lunch",        label:"Lunch",        emoji:"☀️",hour:[12,15]},
  {key:"evening_snack",label:"Evening Snack",emoji:"🌆",hour:[15,19]},
  {key:"dinner",       label:"Dinner",       emoji:"🌙",hour:[19,24]},
];
function getCurrentSlot(){const h=new Date().getHours();return MEAL_SLOTS.find(s=>h>=s.hour[0]&&h<s.hour[1])?.key||"dinner";}

function AuroraRing({calories,goal}){
  const canvasRef=useRef(null),animRef=useRef(null),tRef=useRef(0);
  useEffect(()=>{
    const cv=canvasRef.current;if(!cv)return;
    const ctx=cv.getContext("2d");
    const W=220,H=220,cx=110,cy=110,R=95;
    const pct=clamp(calories/Math.max(goal,1),0,1);
    function draw(){
      ctx.clearRect(0,0,W,H);tRef.current+=0.004;const t=tRef.current;
      ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);
      ctx.strokeStyle="rgba(255,255,255,0.04)";ctx.lineWidth=10;ctx.stroke();
      const segments=200,startA=-Math.PI/2;
      for(let i=0;i<segments;i++){
        const progress=i/segments;if(progress>pct)break;
        const a1=startA+progress*Math.PI*2,a2=startA+((i+1)/segments)*Math.PI*2;
        const colorPos=(progress*0.8+t)%1;
        const[r,g,b]=getAuroraColor(colorPos);
        const alpha=0.4+progress*0.6,isLeading=progress>pct-0.06;
        ctx.beginPath();ctx.arc(cx,cy,R,a1,a2);
        ctx.strokeStyle=`rgba(${r},${g},${b},${alpha})`;ctx.lineWidth=10;ctx.lineCap="round";
        if(isLeading){ctx.shadowColor=`rgb(${r},${g},${b})`;ctx.shadowBlur=22;}
        ctx.stroke();ctx.shadowBlur=0;
      }
      if(pct>0){
        const tipA=startA+pct*Math.PI*2;
        const tx=cx+Math.cos(tipA)*R,ty=cy+Math.sin(tipA)*R;
        const[tr,tg,tb]=getAuroraColor((pct*0.8+t)%1);
        ctx.shadowColor=`rgb(${tr},${tg},${tb})`;ctx.shadowBlur=30;
        ctx.beginPath();ctx.arc(tx,ty,6,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();ctx.shadowBlur=0;
      }
      const[ir,ig,ib]=getAuroraColor(t%1);
      const grad=ctx.createRadialGradient(cx,cy,0,cx,cy,65);
      grad.addColorStop(0,`rgba(${ir},${ig},${ib},0.05)`);grad.addColorStop(1,"transparent");
      ctx.beginPath();ctx.arc(cx,cy,65,0,Math.PI*2);ctx.fillStyle=grad;ctx.fill();
      animRef.current=requestAnimationFrame(draw);
    }
    draw();return()=>cancelAnimationFrame(animRef.current);
  },[calories,goal]);
  return<canvas ref={canvasRef} width={220} height={220} style={{position:"absolute",inset:0}}/>;
}

function AnimNum({to,dur=800}){
  const[v,setV]=useState(0);const r=useRef(),t=useRef();
  useEffect(()=>{
    t.current=null;
    const run=ts=>{
      if(!t.current)t.current=ts;
      const p=Math.min((ts-t.current)/dur,1);
      setV(Math.round((1-Math.pow(1-p,3))*to));
      if(p<1)r.current=requestAnimationFrame(run);
    };
    r.current=requestAnimationFrame(run);
    return()=>cancelAnimationFrame(r.current);
  },[to]);
  return<>{v.toLocaleString()}</>;
}

export default function Dashboard(){
  const nav=useNavigate();
  const[log,setLog]=useState([]);
  const[tot,setTot]=useState({calories:0,protein:0,carbs:0,fat:0,fiber:0,sugar:0,sodium:0});
  const[streak,setStreak]=useState(0);
  const[score,setScore]=useState(null);
  const[reco,setReco]=useState("");
  const[loading,setLoading]=useState(true);
  const[glasses,setGlasses]=useState(0);
  const[expanded,setExpanded]=useState(null);
  const[weekly,setWeekly]=useState(null);

  // ── Profile state — loaded from localStorage first, then synced from Supabase
  const[profile,setProfile]=useState(()=>{
    const p=JSON.parse(localStorage.getItem("foodmood_user")||"{}");
    return{
      name:"Friend",weight_kg:70,height_cm:170,age:25,
      gender:"Male",activity_level:"Moderately Active (exercise 3-5 days)",
      goal:"maintenance",calGoal:0,tdee:0,...p,
    };
  });

  const{name,weight_kg,height_cm,age,gender,activity_level,goal}=profile;
  const tdee=calcTDEE(weight_kg,height_cm,age,gender,activity_level);
  const calGoal=profile.calGoal||calcGoal(tdee,goal)||2000;
  const tgt={
    calories:calGoal,
    protein: goal==="muscle_gain"?180:goal==="weight_loss"?120:100,
    carbs:   goal==="weight_loss"?150:250,
    fat:     goal==="weight_loss"?50:65,
    fiber:   25,
  };

  const currentSlot=getCurrentSlot();
  const firstName=(name||"Friend").split(" ")[0];

  useEffect(()=>{load();},[]);

  async function load(){
    setLoading(true);
    try{
      // ── Load profile from Supabase — ensures calorie ring shows correct goal
      try{
        const pr=await api.get("/profile");
        if(pr.data&&Object.keys(pr.data).length>0){
          // Preserve token when merging — never wipe auth
          const existing=JSON.parse(localStorage.getItem("foodmood_user")||"{}");
          const merged={...existing,...pr.data};
          localStorage.setItem("foodmood_user",JSON.stringify(merged));
          setProfile(p=>({...p,...pr.data}));
        }
      }catch(e){
        console.warn("Profile load failed — using localStorage:",e?.message);
      }

      // ── Load daily log
      const r=await api.get("/daily-log");
      const d=r.data;
      setLog(d.meals||[]);
      setTot(d.totals||tot);
      setStreak(d.streak||0);
      if(d.health_score!==undefined)setScore(d.health_score);
      if(d.recommendation)setReco(d.recommendation);
      if(d.weekly)setWeekly(d.weekly);
    }catch{
      const demo=[
        {id:1,food_name:"Oats + Banana",     meal_type:"morning",       calories:380,protein:12,carbs:68,fat:6, fiber:6,sugar:18,sodium:140,logged_at:new Date(Date.now()-7200000).toISOString()},
        {id:2,food_name:"Chicken Rice Bowl",  meal_type:"lunch",         calories:520,protein:44,carbs:52,fat:10,fiber:3,sugar:2, sodium:420,logged_at:new Date(Date.now()-3600000).toISOString()},
        {id:3,food_name:"Whey Shake",         meal_type:"evening_snack", calories:180,protein:28,carbs:10,fat:2, fiber:0,sugar:6, sodium:180,logged_at:new Date(Date.now()-900000).toISOString()},
      ];
      setLog(demo);
      setTot({calories:1080,protein:84,carbs:130,fat:18,fiber:9,sugar:26,sodium:740});
      setStreak(12);setScore(81);
      setReco("Great protein today! Add some veggies at dinner for fiber.");
    }
    setLoading(false);
  }

  async function del(id){
    try{await api.delete(`/log/${id}`);}catch{}
    const updated=log.filter(m=>m.id!==id);
    setLog(updated);
    const newTot=updated.reduce((a,m)=>({
      calories:a.calories+(m.calories||0),protein:a.protein+(m.protein||0),
      carbs:a.carbs+(m.carbs||0),fat:a.fat+(m.fat||0),
      fiber:a.fiber+(m.fiber||0),sugar:a.sugar+(m.sugar||0),sodium:a.sodium+(m.sodium||0),
    }),{calories:0,protein:0,carbs:0,fat:0,fiber:0,sugar:0,sodium:0});
    setTot(newTot);
  }

  const calPct=clamp(tot.calories/tgt.calories*100,0,100);
  const calLeft=Math.max(0,rnd(tgt.calories-tot.calories));
  function getMealsForSlot(k){return log.filter(m=>(m.meal_type||m.meal_time)===k);}
  function getSlotCals(k){return getMealsForSlot(k).reduce((s,m)=>s+(m.calories||0),0);}
  const today=new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"});

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#000;}
        .dash{font-family:'DM Sans',system-ui;background:#000;min-height:100vh;padding-bottom:80px;color:#fff;}
        ::-webkit-scrollbar{display:none;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        .fade-up{animation:fadeUp 0.4s ease both;}
      `}</style>

      <div className="dash">

        {/* HEADER */}
        <div style={{padding:"52px 22px 0",marginBottom:28}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:D.t2,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>
                {greet()} · {today}
              </div>
              <div style={{fontSize:30,fontWeight:900,color:D.t1,letterSpacing:-1}}>{firstName} 👋</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
              {streak>0&&(
                <div style={{background:D.s1,border:`1px solid ${D.border2}`,borderRadius:12,padding:"7px 13px",display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:16}}>🔥</span>
                  <span style={{fontSize:13,fontWeight:800}}>{streak}</span>
                  <span style={{fontSize:10,color:D.t2,fontWeight:500}}>day streak</span>
                </div>
              )}
              {score!==null&&(
                <div style={{fontSize:10,fontWeight:700,color:score>=70?D.green:score>=45?D.amber:D.red,background:`rgba(${score>=70?"52,211,153":score>=45?"251,191,36":"248,113,113"},0.08)`,border:`1px solid rgba(${score>=70?"52,211,153":score>=45?"251,191,36":"248,113,113"},0.15)`,borderRadius:8,padding:"4px 10px",letterSpacing:0.5}}>
                  {score>=70?"✓ STEADY & HEALTHY":score>=45?"~ ROOM TO IMPROVE":"⚠ NEEDS ATTENTION"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AURORA RING */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"0 22px 28px"}}>
          <div style={{position:"relative",width:220,height:220,marginBottom:24}}>
            <AuroraRing calories={tot.calories} goal={tgt.calories}/>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <div style={{fontSize:52,fontWeight:900,color:D.t1,letterSpacing:-3,lineHeight:1,fontFamily:"'DM Mono',monospace"}}>
                {loading?"—":<AnimNum to={rnd(tot.calories)}/>}
              </div>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:D.t2,marginTop:5}}>kcal eaten</div>
              <div style={{fontSize:13,fontWeight:600,color:D.purple,marginTop:5}}>
                {calLeft===0?"🎯 Goal hit!":`${calLeft.toLocaleString()} remaining`}
              </div>
            </div>
          </div>

          {/* Goal label — shows actual goal from profile */}
          <div style={{fontSize:10,color:D.t3,marginTop:-16,marginBottom:16,letterSpacing:1}}>
            Goal: <span style={{color:D.purple,fontWeight:700}}>{calGoal.toLocaleString()} kcal</span>
            {" · "}<span style={{color:D.t2}}>{goal.replace("_"," ")}</span>
            {" · "}<span style={{color:D.t3}}>{rnd(weight_kg)}kg</span>
          </div>

          {/* Stats row */}
          <div style={{display:"flex",width:"100%",justifyContent:"space-between",padding:"0 8px"}}>
            {[
              {val:`${rnd(tot.protein)}g`,lbl:"Protein",color:D.blue,  sub:tot.protein>=tgt.protein?"✓ on track":"needs more"},
              {val:`${rnd(calPct)}%`,     lbl:"Goal",   color:D.purple,sub:calPct>=80?"almost there":"on track"},
              {val:`${rnd(tot.fat)}g`,    lbl:"Fat",    color:tot.fat>tgt.fat?D.red:D.amber,sub:tot.fat>tgt.fat?"⚠ above":"within range"},
            ].map((s,i)=>(
              <div key={i} style={{flex:1,textAlign:"center",padding:"0 4px"}}>
                <div style={{fontSize:22,fontWeight:900,letterSpacing:-0.8,color:s.color,fontFamily:"'DM Mono',monospace"}}>{s.val}</div>
                <div style={{fontSize:8,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:D.t3,margin:"4px 0 3px"}}>{s.lbl}</div>
                <div style={{fontSize:9,fontWeight:600,color:`${s.color}88`}}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MACRO BARS */}
        <div style={{padding:"0 22px",marginBottom:28}}>
          {[
            {lbl:"Protein",val:tot.protein,goal:tgt.protein,color:D.blue},
            {lbl:"Carbs",  val:tot.carbs,  goal:tgt.carbs,  color:D.green},
            {lbl:"Fat",    val:tot.fat,    goal:tgt.fat,    color:tot.fat>tgt.fat?D.red:D.amber},
            {lbl:"Fiber",  val:tot.fiber,  goal:tgt.fiber,  color:"#C084FC"},
          ].map(m=>{
            const pct=clamp(m.val/Math.max(m.goal,1)*100,0,100);
            return(
              <div key={m.lbl} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:D.t3,width:42}}>{m.lbl}</div>
                <div style={{flex:1,height:3,background:"rgba(255,255,255,0.05)",borderRadius:99,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:m.color,borderRadius:99,boxShadow:`0 0 8px ${m.color}88`,transition:"width 1s cubic-bezier(.4,0,.2,1)"}}/>
                </div>
                <div style={{fontSize:11,fontWeight:700,color:m.color,width:60,textAlign:"right",fontFamily:"'DM Mono',monospace"}}>
                  {rnd(m.val)}/{rnd(m.goal)}g
                </div>
              </div>
            );
          })}
        </div>

        {/* MEAL SLOTS */}
        <div style={{padding:"0 22px",marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:D.t3}}>Meals Today</div>
            <div style={{fontSize:11,fontWeight:700,color:D.t2}}>{log.length} logged</div>
          </div>
          {MEAL_SLOTS.map((slot,si)=>{
            const meals=getMealsForSlot(slot.key);
            const slotCals=getSlotCals(slot.key);
            const isNow=slot.key===currentSlot;
            const hasMeals=meals.length>0;
            const isExpanded=expanded===slot.key;
            return(
              <div key={slot.key} className="fade-up" style={{animationDelay:`${si*0.05}s`,marginBottom:6}}>
                <div
                  onClick={()=>hasMeals&&setExpanded(isExpanded?null:slot.key)}
                  style={{
                    background:isNow?"rgba(167,139,250,0.06)":D.s1,
                    border:`1px solid ${isNow?"rgba(167,139,250,0.25)":D.border}`,
                    borderRadius:isExpanded?"16px 16px 0 0":16,
                    padding:"13px 15px",display:"flex",alignItems:"center",justifyContent:"space-between",
                    cursor:hasMeals?"pointer":"default",position:"relative",overflow:"hidden",transition:"all 0.2s",
                  }}
                >
                  {isNow&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:`linear-gradient(180deg,${D.purple},${D.blue})`,borderRadius:"0 2px 2px 0"}}/>}
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:38,height:38,borderRadius:12,background:hasMeals?"rgba(167,139,250,0.08)":isNow?"rgba(167,139,250,0.06)":"rgba(255,255,255,0.03)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                      {slot.emoji}
                    </div>
                    <div>
                      <div style={{fontSize:11,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:isNow?D.purple:hasMeals?"rgba(255,255,255,0.7)":D.t3}}>
                        {slot.label}{isNow&&<span style={{fontSize:8,marginLeft:6,color:D.purple,letterSpacing:1}}>NOW</span>}
                      </div>
                      <div style={{fontSize:10,color:isNow?"rgba(167,139,250,0.45)":D.t3,marginTop:2}}>
                        {hasMeals?meals.map(m=>m.food_name).join(", ").slice(0,28)+(meals.map(m=>m.food_name).join(", ").length>28?"…":""):isNow?"Tap + to log now":"Not logged yet"}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    {hasMeals&&<div style={{fontSize:17,fontWeight:900,color:"rgba(255,255,255,0.6)",fontFamily:"'DM Mono',monospace",letterSpacing:-0.5}}>{rnd(slotCals)}</div>}
                    <button
                      onClick={e=>{e.stopPropagation();nav(`/scanner?slot=${slot.key}`);}}
                      style={{width:30,height:30,borderRadius:10,border:"none",cursor:"pointer",background:isNow?D.purple:"rgba(255,255,255,0.06)",color:isNow?"#000":D.t2,fontSize:20,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}
                    >+</button>
                  </div>
                </div>
                {isExpanded&&hasMeals&&(
                  <div style={{background:D.s1,border:`1px solid ${D.border}`,borderTop:"none",borderRadius:"0 0 16px 16px",padding:"8px 12px"}}>
                    {meals.map(m=>(
                      <div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 4px",borderBottom:`1px solid ${D.border}`}}>
                        <div>
                          <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.7)"}}>{m.food_name}</div>
                          <div style={{fontSize:10,color:D.t3,marginTop:2}}>{rnd(m.protein)}g P · {rnd(m.carbs)}g C · {rnd(m.fat)}g F · {timeAgo(m.logged_at)}</div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{fontSize:13,fontWeight:800,color:"rgba(255,255,255,0.5)",fontFamily:"'DM Mono',monospace"}}>{rnd(m.calories)}</div>
                          <button onClick={()=>del(m.id)} style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:8,padding:"4px 8px",color:D.red,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',system-ui"}}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* QUICK ACTIONS */}
        <div style={{padding:"0 22px",marginBottom:24}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:D.t3,marginBottom:14}}>Quick Actions</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[
              {icon:"📷",name:"AI Scan",   sub:"Photo detect",            to:"/scanner",accent:D.purple},
              {icon:"🍽️",name:"Order Food",sub:"Restaurants nearby",      to:"/places", accent:D.blue},
              {icon:"📈",name:"This Week", sub:`${weekly?.days_goal_hit||0} of 7 days`,to:null,accent:D.green},
              {icon:"💧",name:"Water",     sub:`${glasses} of 8 glasses`,  to:null,      accent:"#60A5FA"},
            ].map((a,i)=>(
              <button key={i} onClick={()=>{if(a.to)nav(a.to);else if(a.name==="Water")setGlasses(g=>g<8?g+1:0);}}
                style={{background:D.s1,border:`1px solid ${D.border}`,borderRadius:18,padding:16,display:"flex",flexDirection:"column",gap:7,cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',system-ui",transition:"border-color 0.2s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=`${a.accent}44`}
                onMouseLeave={e=>e.currentTarget.style.borderColor=D.border}>
                <span style={{fontSize:20}}>{a.icon}</span>
                <span style={{fontSize:13,fontWeight:800,color:D.t1,letterSpacing:-0.3}}>{a.name}</span>
                <span style={{fontSize:10,color:D.t3,fontWeight:500}}>{a.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* WATER */}
        <div style={{margin:"0 22px 24px",background:D.s1,border:`1px solid ${D.border}`,borderRadius:18,padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:D.t3}}>Hydration</div>
            <div style={{fontSize:12,fontWeight:800,color:"#60A5FA"}}>{glasses} / 8 glasses</div>
          </div>
          <div style={{display:"flex",gap:5}}>
            {Array.from({length:8}).map((_,i)=>(
              <button key={i} onClick={()=>setGlasses(g=>g===i+1?i:i+1)}
                style={{flex:1,height:28,borderRadius:8,border:"none",cursor:"pointer",background:i<glasses?"rgba(96,165,250,0.2)":"rgba(255,255,255,0.03)",borderWidth:1,borderStyle:"solid",borderColor:i<glasses?"rgba(96,165,250,0.3)":"rgba(255,255,255,0.05)",transition:"all 0.2s",fontSize:13}}>
                {i<glasses?"💧":""}
              </button>
            ))}
          </div>
        </div>

        {/* AI COACH */}
        {reco&&(
          <div style={{margin:"0 22px 24px",background:D.s1,border:`1px solid ${D.border}`,borderRadius:18,padding:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:D.t3}}>FoodMood Coach</div>
              <div style={{fontSize:10,fontWeight:700,color:`${D.purple}88`,letterSpacing:0.5}}>VIEW PLAN →</div>
            </div>
            <div style={{fontSize:17,fontWeight:900,color:D.t1,letterSpacing:-0.4,marginBottom:8}}>
              {score>=70?"Steady and Healthy":score>=45?"Room to Improve":"Let's Get Back on Track"}
            </div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",lineHeight:1.7}}>{reco}</div>
          </div>
        )}

        {/* DAILY MISSION */}
        <div style={{margin:"0 22px",background:D.s1,border:`1px solid ${D.border}`,borderRadius:18,padding:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:D.t3}}>Daily Mission</div>
            <div style={{fontSize:11,fontWeight:800,color:D.purple}}>
              {[tot.protein>=tgt.protein,tot.calories>=tgt.calories*0.8,log.length>=3,glasses>=6].filter(Boolean).length}/4
            </div>
          </div>
          {[
            {lbl:"Hit protein goal",  cur:rnd(tot.protein), goal:rnd(tgt.protein), unit:"g",   color:D.blue},
            {lbl:"Reach calorie goal",cur:rnd(tot.calories),goal:rnd(tgt.calories),unit:"kcal",color:D.purple},
            {lbl:"Log 3 meals",       cur:log.length,        goal:3,               unit:"",    color:D.green},
            {lbl:"Drink 6 glasses",   cur:glasses,           goal:6,               unit:"",    color:"#60A5FA"},
          ].map(m=>{
            const pct=clamp(m.cur/Math.max(m.goal,1)*100,0,100);
            const done=m.cur>=m.goal;
            return(
              <div key={m.lbl} style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <div style={{width:20,height:20,borderRadius:6,background:done?`${m.color}18`:D.s2,border:`1px solid ${done?m.color:D.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:m.color,flexShrink:0}}>
                  {done?"✓":""}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:11,fontWeight:600,color:done?m.color:"rgba(255,255,255,0.5)"}}>{m.lbl}</span>
                    <span style={{fontSize:10,color:D.t3,fontFamily:"'DM Mono',monospace"}}>{m.cur}/{m.goal}{m.unit}</span>
                  </div>
                  <div style={{height:3,background:"rgba(255,255,255,0.05)",borderRadius:99,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:done?m.color:`${m.color}66`,borderRadius:99,transition:"width 1s"}}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </>
  );
}