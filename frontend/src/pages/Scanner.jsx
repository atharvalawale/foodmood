import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/client";

const D = {
  bg:"#000000",s1:"#0D0D0D",s2:"#141414",s3:"#1A1A1A",
  border:"rgba(255,255,255,0.05)",border2:"rgba(255,255,255,0.08)",
  t1:"#FFFFFF",t2:"rgba(255,255,255,0.35)",t3:"rgba(255,255,255,0.12)",
  purple:"#A78BFA",blue:"#60A5FA",green:"#34D399",red:"#F87171",amber:"#FBBF24",
};
const rnd=v=>Math.round(v||0);
const MEAL_SLOTS=[
  {key:"morning",      label:"Morning",      emoji:"🌅"},
  {key:"morning_snack",label:"Morning Snack",emoji:"🍎"},
  {key:"lunch",        label:"Lunch",        emoji:"☀️"},
  {key:"evening_snack",label:"Evening Snack",emoji:"🌆"},
  {key:"dinner",       label:"Dinner",       emoji:"🌙"},
];
const UNITS=["serving","piece","g","ml","cup","bowl","tbsp","tsp"];
function getCurrentSlot(){
  const h=new Date().getHours();
  if(h<10)return"morning";if(h<12)return"morning_snack";
  if(h<15)return"lunch";if(h<19)return"evening_snack";return"dinner";
}
const inp={width:"100%",background:D.s2,border:`1px solid ${D.border}`,borderRadius:10,padding:"9px 12px",fontSize:12,color:D.t1,fontFamily:"'DM Sans',system-ui",outline:"none",boxSizing:"border-box"};

function ResultCard({result,mealType,onClear}){
  const[qty,setQty]=useState(1);const[unit,setUnit]=useState("serving");
  const[meal,setMeal]=useState(mealType||getCurrentSlot());
  const[busy,setBusy]=useState(false);const[done,setDone]=useState(false);
  const m=result.nutrition||result;
  const calories=rnd(m.total_calories??m.calories??0);
  const protein=rnd(m.total_protein??m.protein??0);
  const carbs=rnd(m.total_carbs??m.carbs??0);
  const fat=rnd(m.total_fat??m.fat??0);
  const score=result.health_score;
  const scColor=score>=70?D.green:score>=40?D.amber:D.red;
  async function log(){
    setBusy(true);
    try{
      await api.post("/log",{food_name:result.food_name||result.name||"Food",quantity:qty,unit,meal_type:meal,meal_time:meal,calories,protein,carbs,fat,sugar:rnd(m.total_sugar??m.sugar??0),sodium:rnd(m.total_sodium??m.sodium??0),fiber:rnd(m.total_fiber??m.fiber??0)});
      setDone(true);
    }catch{}
    setBusy(false);
  }
  return(
    <div style={{background:D.s1,border:`1px solid ${D.border2}`,borderRadius:16,marginTop:10,overflow:"hidden"}}>
      <div style={{padding:"12px 14px",borderBottom:`1px solid ${D.border}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,color:D.t1,marginBottom:4}}>{result.food_name||result.name||"Food detected"}</div>
          {result.verification_status&&<span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:99,background:D.s2,color:D.t2}}>{result.verification_status}</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          {score!==undefined&&<div style={{fontSize:11,fontWeight:700,color:scColor,background:`${scColor}18`,border:`1px solid ${scColor}33`,borderRadius:8,padding:"3px 8px"}}>{score}/100</div>}
          <button onClick={onClear} style={{background:D.s2,border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:14,color:D.t2,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:D.border}}>
        {[{l:"Calories",v:calories,u:"kcal",c:D.amber},{l:"Protein",v:protein,u:"g",c:D.blue},{l:"Carbs",v:carbs,u:"g",c:D.green},{l:"Fat",v:fat,u:"g",c:D.red}].map(n=>(
          <div key={n.l} style={{background:D.s1,padding:"12px 6px",textAlign:"center"}}>
            <div style={{fontSize:16,fontWeight:800,color:n.c,fontFamily:"'DM Mono',monospace"}}>{n.v}</div>
            <div style={{fontSize:9,color:D.t2,marginTop:1}}>{n.u}</div>
            <div style={{fontSize:9,color:D.t3,marginTop:1}}>{n.l}</div>
          </div>
        ))}
      </div>
      <div style={{padding:"12px 14px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1.5fr",gap:8,marginBottom:10}}>
          {[{label:"Qty",el:<input type="number" value={qty} min="0.25" step="0.25" onChange={e=>setQty(+e.target.value)} style={{...inp,textAlign:"center"}}/>},{label:"Unit",el:<select value={unit} onChange={e=>setUnit(e.target.value)} style={inp}>{UNITS.map(u=><option key={u}>{u}</option>)}</select>},{label:"Meal",el:<select value={meal} onChange={e=>setMeal(e.target.value)} style={inp}>{MEAL_SLOTS.map(s=><option key={s.key} value={s.key}>{s.emoji} {s.label}</option>)}</select>}].map(f=>(
            <div key={f.label}>
              <div style={{fontSize:9,color:D.t3,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5,fontWeight:700}}>{f.label}</div>
              {f.el}
            </div>
          ))}
        </div>
        {done?<div style={{textAlign:"center",fontSize:13,fontWeight:700,color:D.green,padding:"10px 0"}}>✓ Added to log!</div>
          :<button onClick={log} disabled={busy} style={{width:"100%",padding:"11px 0",background:D.purple,color:"#000",border:"none",borderRadius:12,fontWeight:800,fontSize:13,cursor:busy?"not-allowed":"pointer",fontFamily:"'DM Sans',system-ui",opacity:busy?0.6:1}}>
            {busy?"Logging…":`Add to ${MEAL_SLOTS.find(s=>s.key===meal)?.emoji} ${MEAL_SLOTS.find(s=>s.key===meal)?.label}`}
          </button>}
      </div>
    </div>
  );
}

function SearchTab({defaultSlot}){
  const[query,setQuery]=useState("");const[results,setResults]=useState([]);
  const[searching,setSearching]=useState(false);const[selected,setSelected]=useState(null);
  const[quantity,setQuantity]=useState(1);const[unit,setUnit]=useState("serving");
  const[mealType,setMealType]=useState(defaultSlot||getCurrentSlot());
  const[nutrition,setNutrition]=useState(null);const[calculating,setCalc]=useState(false);
  const[logging,setLogging]=useState(false);const[logged,setLogged]=useState(false);
  const[error,setError]=useState("");
  const searchTimer=useRef(null);const inputRef=useRef(null);
  const QUICK=["Chapati","Dal tadka","Egg boiled","White rice","Chai","Banana","Chicken grilled","Oats","Paneer","Curd"];

  useEffect(()=>{
    if(query.length<2){setResults([]);return;}
    clearTimeout(searchTimer.current);
    searchTimer.current=setTimeout(async()=>{
      setSearching(true);setError("");
      try{
        const res=await api.get(`/foods/search?q=${encodeURIComponent(query)}`);
        console.log("Search response:", res.data);
        setResults(res.data.results||[]);
        setError("");
      }catch(e){
        console.error("Search error:", e?.response?.data || e.message);
        setError("Search failed. Is the backend running?");
        setResults([]);
      }
      finally{setSearching(false);}
    },400);
    return()=>clearTimeout(searchTimer.current);
  },[query]);

  useEffect(()=>{
    if(!selected) return;
    const q = parseFloat(quantity) || 1;
    if(q <= 0) return;
    let cancelled = false;
    const calc = async () => {
      setCalc(true);
      try {
        const res = await api.post("/foods/calculate", {food_key: selected.key, quantity: q, unit: unit});
        if(!cancelled) setNutrition(res.data);
      } catch(e) {
        console.error("Calculate error:", e?.response?.data || e.message);
      } finally {
        if(!cancelled) setCalc(false);
      }
    };
    calc();
    return () => { cancelled = true; };
  },[selected, quantity, unit]);

  async function handleLog(){
    if(!nutrition)return;setLogging(true);
    try{
      await api.post("/log",{food_name:selected.name,calories:nutrition.calories,protein:nutrition.protein,carbs:nutrition.carbs,fat:nutrition.fat,fiber:nutrition.fiber||0,sugar:nutrition.sugar||0,sodium:nutrition.sodium||0,quantity:parseFloat(quantity),unit,meal_type:mealType,meal_time:mealType});
      setLogged(true);
      setTimeout(()=>{setLogged(false);setSelected(null);setNutrition(null);setQuery("");setResults([]);setQuantity(1);setUnit("serving");inputRef.current?.focus();},1800);
    }catch{setError("Failed to log. Try again.");}
    setLogging(false);
  }

  return(
    <div>
      {/* Meal type pills */}
      <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
        {MEAL_SLOTS.map(s=>(
          <button key={s.key} onClick={()=>setMealType(s.key)} style={{flexShrink:0,padding:"7px 13px",borderRadius:20,border:"none",cursor:"pointer",background:mealType===s.key?D.purple:D.s1,color:mealType===s.key?"#000":D.t2,fontSize:11,fontWeight:700,fontFamily:"'DM Sans',system-ui",transition:"all 0.15s"}}>
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {!selected&&(
        <>
          <div style={{display:"flex",alignItems:"center",background:D.s1,border:`1px solid ${D.border2}`,borderRadius:14,padding:"12px 16px",gap:10,marginBottom:14}}>
            <span style={{fontSize:16}}>🔍</span>
            <input ref={inputRef} type="text" placeholder="Search 1,700+ Indian foods..." value={query} onChange={e=>setQuery(e.target.value)} autoFocus
              style={{flex:1,border:"none",outline:"none",fontSize:14,color:D.t1,background:"transparent",fontFamily:"'DM Sans',system-ui"}}/>
            {query&&<button onClick={()=>{setQuery("");setResults([]);}} style={{background:"none",border:"none",color:D.t3,cursor:"pointer",fontSize:16}}>✕</button>}
          </div>
          {searching&&<div style={{textAlign:"center",color:D.t3,fontSize:12,padding:"8px 0"}}>Searching...</div>}
          {error&&<div style={{background:"rgba(248,113,113,0.08)",border:`1px solid rgba(248,113,113,0.2)`,borderRadius:12,padding:"10px 14px",fontSize:12,color:D.red,marginBottom:12}}>{error}</div>}
          {results.length>0&&(
            <div style={{background:D.s1,borderRadius:16,overflow:"hidden",border:`1px solid ${D.border}`,marginBottom:14}}>
              {results.map((food,i)=>(
                <button key={i} onClick={()=>{setSelected(food);setQuantity(1);setUnit("serving");}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"13px 16px",border:"none",borderBottom:`1px solid ${D.border}`,background:D.s1,cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',system-ui",transition:"background 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=D.s2} onMouseLeave={e=>e.currentTarget.style.background=D.s1}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:D.t1}}>{food.name}</div>
                    <div style={{fontSize:10,color:D.t3,marginTop:2}}>{food.category} · 1 serving</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                    <div>
                      <div style={{fontSize:16,fontWeight:800,color:D.purple,textAlign:"right",fontFamily:"'DM Mono',monospace"}}>{food.calories_per_serving}</div>
                      <div style={{fontSize:9,color:D.t3,textAlign:"right"}}>kcal</div>
                    </div>
                    <div style={{width:26,height:26,borderRadius:8,background:D.s2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:D.t2}}>›</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {query.length>=2&&!searching&&results.length===0&&(
            <div style={{textAlign:"center",padding:"32px 0",color:D.t3}}>
              <div style={{fontSize:32,marginBottom:8}}>🥗</div>
              <div style={{fontSize:13,fontWeight:600,color:D.t2}}>No results for "{query}"</div>
              <div style={{fontSize:11,marginTop:4}}>Try: chapati, dal, egg, chai...</div>
            </div>
          )}
          {query.length===0&&(
            <>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:D.t3,marginBottom:10}}>Quick picks</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {QUICK.map(f=>(
                  <button key={f} onClick={()=>setQuery(f)} style={{padding:"8px 14px",background:D.s1,border:`1px solid ${D.border}`,borderRadius:20,fontSize:12,fontWeight:600,color:D.t2,cursor:"pointer",fontFamily:"'DM Sans',system-ui",transition:"all 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=D.purple;e.currentTarget.style.color=D.purple;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=D.border;e.currentTarget.style.color=D.t2;}}>
                    {f}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {selected&&(
        <div>
          <button onClick={()=>{setSelected(null);setNutrition(null);}} style={{background:D.s1,border:`1px solid ${D.border}`,borderRadius:10,padding:"7px 14px",color:D.t2,fontSize:12,cursor:"pointer",marginBottom:16,fontFamily:"'DM Sans',system-ui",fontWeight:600}}>← Back</button>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:22,fontWeight:900,color:D.t1,letterSpacing:-0.5,marginBottom:4}}>{selected.name}</div>
            <div style={{fontSize:11,color:D.t3}}>{selected.category} · {selected.calories_per_100g} kcal / 100g</div>
          </div>
          <div style={{background:D.s1,border:`1px solid ${D.border}`,borderRadius:18,padding:20,marginBottom:12}}>
            {calculating?<div style={{textAlign:"center",color:D.t3,fontSize:12,padding:"20px 0"}}>Calculating...</div>
              :nutrition?(
                <>
                  <div style={{textAlign:"center",marginBottom:18}}>
                    <div style={{fontSize:60,fontWeight:900,color:D.t1,letterSpacing:-3,lineHeight:1,fontFamily:"'DM Mono',monospace"}}>{rnd(nutrition.calories)}</div>
                    <div style={{fontSize:10,color:D.t3,marginTop:4,letterSpacing:2,textTransform:"uppercase"}}>kcal · {rnd(nutrition.grams)}g</div>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-around",paddingTop:14,borderTop:`1px solid ${D.border}`}}>
                    {[{l:"Protein",v:nutrition.protein,c:D.blue},{l:"Carbs",v:nutrition.carbs,c:D.green},{l:"Fat",v:nutrition.fat,c:D.red},{l:"Fiber",v:nutrition.fiber,c:D.amber}].map(m=>(
                      <div key={m.l} style={{textAlign:"center"}}>
                        <div style={{fontSize:18,fontWeight:800,color:m.c,fontFamily:"'DM Mono',monospace"}}>{rnd(m.v)}g</div>
                        <div style={{fontSize:9,color:D.t3,marginTop:3}}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                </>
              ):<div style={{textAlign:"center",color:D.t3,fontSize:12,padding:"20px 0"}}>Select quantity below</div>}
          </div>
          <div style={{background:D.s1,border:`1px solid ${D.border}`,borderRadius:18,padding:18,marginBottom:12}}>
            <div style={{fontSize:9,fontWeight:700,color:D.t3,letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>Quantity</div>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18}}>
              <button onClick={()=>setQuantity(q=>Math.round(Math.max(0.25, (parseFloat(q)||1) - 0.25) * 100) / 100)} style={{width:46,height:46,borderRadius:14,background:D.s2,border:`1px solid ${D.border}`,fontSize:24,fontWeight:700,cursor:"pointer",color:D.t1,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
              <input type="number" value={quantity} min="0.25" step="0.25" onChange={e=>setQuantity(parseFloat(e.target.value) || 1)}
                style={{flex:1,textAlign:"center",fontSize:28,fontWeight:900,border:`1px solid ${D.border}`,borderRadius:14,padding:"10px",color:D.t1,outline:"none",background:D.s2,fontFamily:"'DM Mono',monospace"}}/>
              <button onClick={()=>setQuantity(q=>Math.round(((parseFloat(q)||1) + 0.25) * 100) / 100)} style={{width:46,height:46,borderRadius:14,background:D.s2,border:`1px solid ${D.border}`,fontSize:24,fontWeight:700,cursor:"pointer",color:D.t1,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
            </div>
            <div style={{fontSize:9,fontWeight:700,color:D.t3,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Unit</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {UNITS.map(u=>(
                <button key={u} onClick={()=>setUnit(u)} style={{padding:"8px 14px",borderRadius:20,border:`1px solid ${unit===u?D.purple:D.border}`,background:unit===u?D.purple:D.s2,color:unit===u?"#000":D.t3,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',system-ui",transition:"all 0.15s"}}>{u}</button>
              ))}
            </div>
          </div>
          {error&&<div style={{background:"rgba(248,113,113,0.08)",border:`1px solid rgba(248,113,113,0.2)`,borderRadius:12,padding:"10px 14px",fontSize:12,color:D.red,marginBottom:12}}>{error}</div>}
          <button onClick={handleLog} disabled={logging||!nutrition||logged} style={{width:"100%",padding:"16px 0",background:logged?D.green:D.purple,color:"#000",border:"none",borderRadius:16,fontSize:15,fontWeight:900,cursor:logging?"not-allowed":"pointer",fontFamily:"'DM Sans',system-ui",transition:"all 0.2s",boxShadow:logged?`0 4px 20px rgba(52,211,153,0.3)`:`0 4px 20px rgba(167,139,250,0.3)`}}>
            {logged?"✓ Added!":logging?"Logging…":`Add to ${MEAL_SLOTS.find(s=>s.key===mealType)?.emoji} ${MEAL_SLOTS.find(s=>s.key===mealType)?.label}`}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Scanner(){
  const nav=useNavigate();
  const[searchParams]=useSearchParams();
  const defaultSlot=searchParams.get("slot")||getCurrentSlot();
  const[tab,setTab]=useState("search");
  const[result,setResult]=useState(null);const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");const[imgFile,setImgFile]=useState(null);
  const[imgPrev,setImgPrev]=useState(null);const[vidFile,setVidFile]=useState(null);
  const[text,setText]=useState("");const[barcode,setBarcode]=useState("");
  const[transcript,setTranscript]=useState("");const[listening,setListening]=useState(false);
  const fileRef=useRef();const vidRef=useRef();
  const TABS=[{id:"search",emoji:"🔍",label:"Search"},{id:"image",emoji:"📷",label:"Photo"},{id:"text",emoji:"📝",label:"Text"},{id:"barcode",emoji:"📦",label:"Barcode"},{id:"voice",emoji:"🎤",label:"Voice"}];

  function switchTab(id){setTab(id);setResult(null);setError("");}
  function handleImg(e){const f=e.target.files[0];if(!f)return;setImgFile(f);setImgPrev(URL.createObjectURL(f));setResult(null);setError("");}
  async function analyzeImage(){if(!imgFile)return;setLoading(true);setError("");try{const fd=new FormData();fd.append("file",imgFile);const r=await api.post("/analyze-image",fd,{headers:{"Content-Type":"multipart/form-data"}});setResult(r.data);}catch{setError("Image analysis failed. Check Gemini API key.");}setLoading(false);}
  async function analyzeText(){if(!text.trim())return;setLoading(true);setError("");try{const r=await api.post("/analyze-text",{text});setResult(r.data);}catch{setError("Text analysis failed.");}setLoading(false);}
  async function lookupBarcode(){if(!barcode.trim())return;setLoading(true);setError("");try{const r=await api.get(`/barcode/${barcode}`);setResult(r.data);}catch{setError("Barcode not found. Try: 3017620422003");}setLoading(false);}
  function startListening(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){setError("Speech not supported. Use Chrome.");return;}const r=new SR();r.lang="en-IN";r.onresult=e=>{setTranscript(e.results[0][0].transcript);setListening(false);};r.onerror=()=>{setError("Mic error.");setListening(false);};r.onend=()=>setListening(false);r.start();setListening(true);}
  async function analyzeVoice(){if(!transcript.trim())return;setLoading(true);setError("");try{const r=await api.post("/analyze-text",{text:transcript});setResult(r.data);}catch{setError("Voice analysis failed.");}setLoading(false);}
  const aBtn=(disabled)=>({width:"100%",marginTop:12,padding:"12px 0",background:disabled?D.s2:D.purple,color:disabled?D.t3:"#000",border:"none",borderRadius:14,fontWeight:800,fontSize:13,cursor:disabled?"not-allowed":"pointer",fontFamily:"'DM Sans',system-ui",transition:"all 0.15s"});

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#000;}
        .scanner{font-family:'DM Sans',system-ui;background:#000;min-height:100vh;padding-bottom:90px;color:#fff;font-size:13px;}
        textarea,input,select{font-family:'DM Sans',system-ui;}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.15);}
        select option{background:#141414;color:#fff;}
        ::-webkit-scrollbar{display:none;}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
      `}</style>
      <div className="scanner">
        <div style={{background:D.s1,borderBottom:`1px solid ${D.border}`,padding:"48px 16px 0"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <button onClick={()=>nav("/dashboard")} style={{background:D.s2,border:`1px solid ${D.border}`,borderRadius:10,width:34,height:34,cursor:"pointer",fontSize:16,color:D.t1,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
            <div style={{fontSize:16,fontWeight:800,color:D.t1}}>
              {tab==="search"?`Add to ${MEAL_SLOTS.find(s=>s.key===defaultSlot)?.emoji} ${MEAL_SLOTS.find(s=>s.key===defaultSlot)?.label}`:"Scan Food"}
            </div>
          </div>
          <div style={{display:"flex",gap:0,overflowX:"auto"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>switchTab(t.id)} style={{flexShrink:0,padding:"9px 16px",background:"transparent",border:"none",borderBottom:tab===t.id?`2px solid ${D.purple}`:"2px solid transparent",cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"'DM Sans',system-ui",whiteSpace:"nowrap",color:tab===t.id?D.purple:D.t3,transition:"all 0.18s"}}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{padding:"16px"}}>
          {tab==="search"&&<SearchTab defaultSlot={defaultSlot}/>}
          {tab==="image"&&(
            <>
              <div onClick={()=>!imgPrev&&fileRef.current.click()} style={{border:`1.5px dashed ${imgPrev?"transparent":D.border2}`,borderRadius:16,overflow:"hidden",cursor:imgPrev?"default":"pointer",background:imgPrev?"transparent":D.s1}}>
                {imgPrev?(<div style={{position:"relative"}}><img src={imgPrev} alt="food" style={{width:"100%",maxHeight:220,objectFit:"cover",display:"block",borderRadius:16}}/><button onClick={e=>{e.stopPropagation();fileRef.current.click();}} style={{position:"absolute",bottom:10,right:10,background:"rgba(0,0,0,0.7)",color:"#fff",border:"none",borderRadius:99,padding:"6px 12px",fontSize:11,cursor:"pointer"}}>Change</button></div>)
                  :(<div style={{padding:"36px 20px",textAlign:"center"}}><div style={{fontSize:40,marginBottom:10}}>📷</div><div style={{fontSize:13,fontWeight:700,color:D.t2,marginBottom:4}}>Tap to upload food photo</div><div style={{fontSize:10,color:D.t3}}>JPG · PNG · WEBP</div></div>)}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleImg}/>
              <button onClick={analyzeImage} disabled={!imgFile||loading} style={aBtn(!imgFile||loading)}>{loading?"Analyzing with Gemini…":"🔍 Analyze Photo"}</button>
            </>
          )}
          {tab==="text"&&(
            <>
              <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={"Describe your meal…\n\nExamples:\n• 2 eggs and 1 chapati\n• 1 bowl dal with 2 rotis\n• Oats with banana and honey"} style={{width:"100%",background:D.s1,border:`1px solid ${D.border}`,borderRadius:14,fontSize:13,padding:"12px 14px",minHeight:150,resize:"none",outline:"none",color:D.t1,lineHeight:1.65,boxSizing:"border-box"}}/>
              <div style={{fontSize:10,color:D.t3,marginTop:6}}>💡 Include quantities for better accuracy</div>
              <button onClick={analyzeText} disabled={!text.trim()||loading} style={aBtn(!text.trim()||loading)}>{loading?"Analyzing…":"🧠 Analyze Text"}</button>
            </>
          )}
          {tab==="barcode"&&(
            <>
              <div style={{textAlign:"center",padding:"24px 0 16px",fontSize:44}}>📦</div>
              <input type="text" value={barcode} onChange={e=>setBarcode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&lookupBarcode()} placeholder="Enter barcode number" maxLength={14} style={{width:"100%",background:D.s1,border:`1px solid ${D.border}`,borderRadius:14,fontSize:20,padding:"14px",outline:"none",textAlign:"center",letterSpacing:3,fontFamily:"'DM Mono',monospace",color:D.t1,boxSizing:"border-box"}}/>
              <div style={{fontSize:10,color:D.t3,textAlign:"center",marginTop:6}}>Test: 3017620422003</div>
              <button onClick={lookupBarcode} disabled={!barcode.trim()||loading} style={aBtn(!barcode.trim()||loading)}>{loading?"Looking up…":"🔢 Lookup Barcode"}</button>
            </>
          )}
          {tab==="voice"&&(
            <>
              <div style={{textAlign:"center",padding:"24px 0 14px"}}>
                <button onClick={listening?undefined:startListening} style={{width:80,height:80,borderRadius:24,border:"none",fontSize:32,cursor:"pointer",margin:"0 auto 12px",display:"block",background:listening?"rgba(248,113,113,0.1)":D.s1,outline:`2px solid ${listening?D.red:D.border2}`,animation:listening?"pulse 1s infinite":"none",transition:"all 0.2s"}}>🎙️</button>
                <div style={{fontSize:12,color:listening?D.red:D.t3,fontWeight:listening?700:400}}>{listening?"Listening… speak now":"Tap to speak"}</div>
              </div>
              {transcript&&(<div style={{background:D.s1,border:`1px solid ${D.border}`,borderRadius:14,padding:"12px 14px",marginBottom:4}}><div style={{fontSize:9,color:D.amber,fontWeight:700,marginBottom:5,letterSpacing:1,textTransform:"uppercase"}}>You said</div><div style={{fontSize:13,color:D.t1,lineHeight:1.5}}>{transcript}</div></div>)}
              {transcript&&<button onClick={analyzeVoice} disabled={loading} style={aBtn(loading)}>{loading?"Analyzing…":"🧠 Analyze Speech"}</button>}
            </>
          )}
          {error&&tab!=="search"&&(<div style={{marginTop:12,padding:"10px 14px",background:"rgba(248,113,113,0.08)",border:`1px solid rgba(248,113,113,0.2)`,borderRadius:12,fontSize:12,color:D.red}}>⚠️ {error}</div>)}
          {loading&&(<div style={{marginTop:12,padding:"16px",background:D.s1,border:`1px solid ${D.border}`,borderRadius:14,textAlign:"center"}}><div style={{fontSize:12,color:D.t3,marginBottom:8}}>Analyzing your food…</div><div style={{display:"flex",gap:6,justifyContent:"center"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:D.purple,animation:`pulse 1s ${i*0.2}s infinite`}}/>)}</div></div>)}
          {result&&!loading&&<ResultCard result={result} mealType={defaultSlot} onClear={()=>setResult(null)}/>}
          {!result&&!loading&&!error&&tab!=="search"&&(<div style={{marginTop:16,padding:"14px",background:D.s1,border:`1px solid ${D.border}`,borderRadius:14}}><div style={{fontSize:9,color:D.t3,marginBottom:8,textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>Tips</div>{[{tab:"image",tip:"Take photo in good lighting"},{tab:"text",tip:"Include quantities: '2 eggs, 1 cup rice'"},{tab:"barcode",tip:"Works with packaged foods worldwide"},{tab:"voice",tip:"Say clearly: 'I had 2 rotis with dal'"}].filter(t=>t.tab===tab).map(t=><div key={t.tip} style={{fontSize:11,color:D.t2,lineHeight:1.5}}>💡 {t.tip}</div>)}</div>)}
        </div>
      </div>
    </>
  );
}