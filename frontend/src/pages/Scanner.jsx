import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

// ─── Tokens (same as Dashboard) ───────────────────────────────────────────────
const D = {
  yellow:"#FFD60A", yellowDim:"rgba(255,214,10,0.12)", yellowText:"#B8960A",
  bg:"#0F0F0F", s1:"#181818", s2:"#222222", s3:"#2A2A2A",
  border:"rgba(255,255,255,0.07)", border2:"rgba(255,255,255,0.12)",
  green:"#00C97A", greenDim:"rgba(0,201,122,0.12)",
  coral:"#FF5A5A", coralDim:"rgba(255,90,90,0.12)",
  blue:"#4D9EFF",  blueDim:"rgba(77,158,255,0.12)",
  amber:"#FFAB00", amberDim:"rgba(255,171,0,0.12)",
  t1:"#F0F0F0", t2:"#888888", t3:"#444444",
};

const rnd = v => Math.round(v || 0);

// ─── Result Card ──────────────────────────────────────────────────────────────
function ResultCard({ result, onClear }) {
  const [qty,  setQty]  = useState(result.quantity || 100);
  const [unit, setUnit] = useState(result.unit || "g");
  const [meal, setMeal] = useState("lunch");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const m = result.nutrition || result;
  const calories = rnd(m.total_calories ?? m.calories ?? 0);
  const protein  = rnd(m.total_protein  ?? m.protein  ?? 0);
  const carbs    = rnd(m.total_carbs    ?? m.carbs    ?? 0);
  const fat      = rnd(m.total_fat      ?? m.fat      ?? 0);
  const score    = result.health_score;
  const warnings = result.warnings;
  const skipped  = result.skipped_foods;
  const scColor  = score >= 70 ? D.green : score >= 40 ? D.amber : D.coral;

  async function log() {
    setBusy(true);
    try {
      await api.post("/log", {
        food_name: result.food_name || result.name || "Food",
        quantity: qty, unit, meal_time: meal,
        calories, protein, carbs, fat,
        sugar:  rnd(m.total_sugar  ?? m.sugar  ?? 0),
        sodium: rnd(m.total_sodium ?? m.sodium ?? 0),
        fiber:  rnd(m.total_fiber  ?? m.fiber  ?? 0),
      });
    } catch {}
    setDone(true); setBusy(false);
  }

  return (
    <div style={{ background:D.s1, border:`1px solid ${D.border}`, borderRadius:12, marginTop:10, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"10px 12px", borderBottom:`1px solid ${D.border}`, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:D.t1, marginBottom:3 }}>
            {result.food_name || result.name || "Food detected"}
          </div>
          {result.verification_status && (
            <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:99,
              background: result.verification_status==="verified"?D.greenDim:D.s2,
              color: result.verification_status==="verified"?D.green:D.t2 }}>
              {result.verification_status}
            </span>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          {score !== undefined && (
            <div style={{ fontSize:11, fontWeight:700, color:scColor,
              background:`${scColor}18`, border:`1px solid ${scColor}33`,
              borderRadius:7, padding:"3px 8px" }}>
              {score}/100
            </div>
          )}
          <button onClick={onClear} style={{ background:D.s2, border:"none", borderRadius:7,
            width:26, height:26, cursor:"pointer", fontSize:13, color:D.t2 }}>✕</button>
        </div>
      </div>

      {/* Macro grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:1, background:D.border }}>
        {[
          { l:"Calories", v:calories, u:"kcal", c:D.amber  },
          { l:"Protein",  v:protein,  u:"g",    c:D.blue   },
          { l:"Carbs",    v:carbs,    u:"g",    c:D.green  },
          { l:"Fat",      v:fat,      u:"g",    c:D.coral  },
        ].map(n => (
          <div key={n.l} style={{ background:D.s1, padding:"10px 6px", textAlign:"center" }}>
            <div style={{ fontSize:15, fontWeight:700, color:n.c, fontFamily:"'DM Mono',monospace" }}>{n.v}</div>
            <div style={{ fontSize:9, color:D.t2 }}>{n.u}</div>
            <div style={{ fontSize:9, color:D.t3, marginTop:1 }}>{n.l}</div>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {warnings && (
        <div style={{ margin:"8px 10px 0", background:D.amberDim, border:`1px solid ${D.amber}33`,
          borderRadius:8, padding:"7px 10px", fontSize:11, color:D.amber }}>
          ⚠️ {warnings}
        </div>
      )}
      {skipped?.length > 0 && (
        <div style={{ margin:"6px 10px 0", background:D.blueDim, border:`1px solid ${D.blue}33`,
          borderRadius:8, padding:"7px 10px", fontSize:11, color:D.blue }}>
          ℹ️ No data for: {skipped.join(", ")}
        </div>
      )}

      {/* Log form */}
      <div style={{ padding:"10px 12px" }}>
        <div style={{ display:"flex", gap:6, marginBottom:8 }}>
          {[
            { label:"Qty", el:
              <input type="number" value={qty} min="1"
                onChange={e => setQty(+e.target.value)}
                style={{ ...inp, textAlign:"center" }} />
            },
            { label:"Unit", el:
              <select value={unit} onChange={e => setUnit(e.target.value)} style={inp}>
                {["g","ml","serving","piece","cup"].map(u => <option key={u}>{u}</option>)}
              </select>
            },
            { label:"Meal", el:
              <select value={meal} onChange={e => setMeal(e.target.value)} style={inp}>
                {["breakfast","lunch","dinner","snack"].map(u => <option key={u}>{u}</option>)}
              </select>
            },
          ].map(f => (
            <div key={f.label} style={{ flex:1 }}>
              <div style={{ fontSize:9, color:D.t2, marginBottom:3, textTransform:"uppercase", letterSpacing:.5 }}>{f.label}</div>
              {f.el}
            </div>
          ))}
        </div>
        {done
          ? <div style={{ textAlign:"center", fontSize:12, fontWeight:700, color:D.green, padding:"8px 0" }}>✅ Added to log!</div>
          : <button onClick={log} disabled={busy} style={{
              width:"100%", padding:"9px 0", background:D.yellow, color:D.bg,
              border:"none", borderRadius:8, fontWeight:700, fontSize:12,
              cursor:busy?"not-allowed":"pointer", fontFamily:"'Inter',sans-serif",
              opacity:busy?0.6:1,
            }}>{busy ? "Logging…" : "Add to Daily Log"}</button>
        }
      </div>
    </div>
  );
}

const inp = {
  width:"100%", background:D.s2, border:`1px solid ${D.border}`,
  borderRadius:7, padding:"7px 8px", fontSize:11, color:D.t1,
  fontFamily:"'Inter',sans-serif", outline:"none", boxSizing:"border-box",
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id:"image",   emoji:"📷", label:"Photo"   },
  { id:"text",    emoji:"📝", label:"Text"    },
  { id:"barcode", emoji:"📦", label:"Barcode" },
  { id:"voice",   emoji:"🎤", label:"Voice"   },
  { id:"video",   emoji:"🎥", label:"Video"   },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Scanner() {
  const nav = useNavigate();
  const [tab,        setTab]        = useState("image");
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [imgFile,    setImgFile]    = useState(null);
  const [imgPrev,    setImgPrev]    = useState(null);
  const [vidFile,    setVidFile]    = useState(null);
  const [text,       setText]       = useState("");
  const [barcode,    setBarcode]    = useState("");
  const [transcript, setTranscript] = useState("");
  const [listening,  setListening]  = useState(false);
  const fileRef = useRef();
  const vidRef  = useRef();

  function switchTab(id) { setTab(id); setResult(null); setError(""); }

  function handleImg(e) {
    const f = e.target.files[0]; if (!f) return;
    setImgFile(f); setImgPrev(URL.createObjectURL(f)); setResult(null); setError("");
  }

  async function analyzeImage() {
    if (!imgFile) return;
    setLoading(true); setError("");
    try {
      const fd = new FormData(); fd.append("file", imgFile);
      const r = await api.post("/analyze-image", fd, { headers:{ "Content-Type":"multipart/form-data" } });
      setResult(r.data);
    } catch { setError("Image analysis failed. Check Gemini API key (20 req/day limit in India)."); }
    setLoading(false);
  }

  async function analyzeText() {
    if (!text.trim()) return;
    setLoading(true); setError("");
    try {
      const r = await api.post("/analyze-text", { text });
      setResult(r.data);
    } catch { setError("Text analysis failed. Make sure backend is running."); }
    setLoading(false);
  }

  async function lookupBarcode() {
    if (!barcode.trim()) return;
    setLoading(true); setError("");
    try {
      const r = await api.get(`/barcode/${barcode}`);
      setResult(r.data);
    } catch { setError("Barcode not found. Try: 3017620422003 (Nutella) for testing."); }
    setLoading(false);
  }

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("Speech recognition not supported. Use Chrome."); return; }
    const r = new SR(); r.lang = "en-IN";
    r.onresult = e => { setTranscript(e.results[0][0].transcript); setListening(false); };
    r.onerror  = () => { setError("Mic error. Allow microphone access."); setListening(false); };
    r.onend    = () => setListening(false);
    r.start(); setListening(true);
  }

  async function analyzeVoice() {
    if (!transcript.trim()) return;
    setLoading(true); setError("");
    try {
      const r = await api.post("/analyze-text", { text: transcript });
      setResult(r.data);
    } catch { setError("Voice analysis failed."); }
    setLoading(false);
  }

  async function analyzeVideo() {
    if (!vidFile) return;
    setLoading(true); setError("");
    try {
      const fd = new FormData(); fd.append("file", vidFile);
      const r = await api.post("/analyze-video", fd, { headers:{ "Content-Type":"multipart/form-data" } });
      setResult(r.data);
    } catch { setError("Video analysis failed. Uses multiple Gemini quota calls."); }
    setLoading(false);
  }

  const analyzeBtn = {
    width:"100%", marginTop:10, padding:"10px 0",
    background:D.yellow, color:D.bg, border:"none", borderRadius:9,
    fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"'Inter',sans-serif",
    opacity: loading ? 0.55 : 1,
    transition:"opacity 0.15s",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${D.bg};}
        .scanner{font-family:'Inter',sans-serif;background:${D.bg};min-height:100vh;padding-bottom:80px;color:${D.t1};font-size:13px;}
        textarea,input,select{font-family:'Inter',sans-serif;}
        input::placeholder,textarea::placeholder{color:${D.t3};}
        select option{background:${D.s2};color:${D.t1};}
        ::-webkit-scrollbar{display:none;}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
      `}</style>

      <div className="scanner">

        {/* ── Top bar ── */}
        <div style={{ background:D.s1, borderBottom:`1px solid ${D.border}`, padding:"48px 14px 0" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <button onClick={() => nav("/dashboard")} style={{
              background:D.s2, border:`1px solid ${D.border}`, borderRadius:8,
              width:32, height:32, cursor:"pointer", fontSize:16, color:D.t1,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>←</button>
            <div style={{ fontSize:15, fontWeight:700, color:D.t1 }}>Scan Food</div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:0, overflowX:"auto", scrollbarWidth:"none" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => switchTab(t.id)} style={{
                flexShrink:0, padding:"8px 14px",
                borderBottom: tab===t.id ? `2px solid ${D.yellow}` : "2px solid transparent",
                background:"transparent", border:"none",
                borderBottom: tab===t.id ? `2px solid ${D.yellow}` : "2px solid transparent",
                cursor:"pointer", fontWeight:600, fontSize:12,
                fontFamily:"'Inter',sans-serif", whiteSpace:"nowrap",
                color: tab===t.id ? D.yellow : D.t2,
                transition:"all 0.18s",
              }}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding:"12px 14px" }}>

          {/* ── IMAGE TAB ── */}
          {tab === "image" && (
            <>
              <div
                onClick={() => !imgPrev && fileRef.current.click()}
                style={{
                  border:`1.5px dashed ${imgPrev ? "transparent" : D.border2}`,
                  borderRadius:12, overflow:"hidden",
                  cursor: imgPrev ? "default" : "pointer",
                  background: imgPrev ? "transparent" : D.s1,
                  transition:"border-color 0.2s",
                }}
                onMouseEnter={e => { if (!imgPrev) e.currentTarget.style.borderColor = `${D.yellow}66`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = imgPrev ? "transparent" : D.border2; }}
              >
                {imgPrev ? (
                  <div style={{ position:"relative" }}>
                    <img src={imgPrev} alt="food" style={{ width:"100%", maxHeight:220, objectFit:"cover", display:"block", borderRadius:12 }} />
                    <button onClick={e => { e.stopPropagation(); fileRef.current.click(); }} style={{
                      position:"absolute", bottom:8, right:8,
                      background:"rgba(0,0,0,0.7)", color:"#fff", border:"none",
                      borderRadius:99, padding:"5px 10px", fontSize:11, cursor:"pointer",
                    }}>Change</button>
                  </div>
                ) : (
                  <div style={{ padding:"32px 20px", textAlign:"center" }}>
                    <div style={{ fontSize:36, marginBottom:8 }}>📷</div>
                    <div style={{ fontSize:12, fontWeight:600, color:D.t1, marginBottom:4 }}>Tap to upload food photo</div>
                    <div style={{ fontSize:10, color:D.t3 }}>JPG · PNG · WEBP</div>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleImg} />
              <button onClick={analyzeImage} disabled={!imgFile || loading} style={analyzeBtn}>
                {loading ? "Analyzing with Gemini…" : "🔍 Analyze Photo"}
              </button>
            </>
          )}

          {/* ── TEXT TAB ── */}
          {tab === "text" && (
            <>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={"Describe your meal…\n\nExamples:\n• 2 eggs, bowl of rice, grilled chicken\n• 2 rotis with dal and sabzi\n• bowl of oats with banana"}
                style={{
                  width:"100%", background:D.s1, border:`1px solid ${D.border}`,
                  borderRadius:12, fontSize:12, padding:"11px 12px",
                  minHeight:140, resize:"none", outline:"none",
                  color:D.t1, lineHeight:1.65, boxSizing:"border-box",
                }}
              />
              <div style={{ fontSize:10, color:D.t3, marginTop:6 }}>
                💡 Be specific with portion sizes for better accuracy
              </div>
              <button onClick={analyzeText} disabled={!text.trim() || loading} style={analyzeBtn}>
                {loading ? "Analyzing…" : "🧠 Analyze Text"}
              </button>
            </>
          )}

          {/* ── BARCODE TAB ── */}
          {tab === "barcode" && (
            <>
              <div style={{ textAlign:"center", padding:"20px 0 12px", fontSize:40 }}>📦</div>
              <input
                type="text" value={barcode}
                onChange={e => setBarcode(e.target.value)}
                onKeyDown={e => e.key === "Enter" && lookupBarcode()}
                placeholder="Enter barcode number"
                maxLength={14}
                style={{
                  width:"100%", background:D.s1, border:`1px solid ${D.border}`,
                  borderRadius:12, fontSize:18, padding:"12px",
                  outline:"none", textAlign:"center", letterSpacing:3,
                  fontFamily:"'DM Mono',monospace", color:D.t1, boxSizing:"border-box",
                }}
              />
              <div style={{ fontSize:10, color:D.t3, textAlign:"center", marginTop:6 }}>
                OpenFoodFacts database · Test: 3017620422003
              </div>
              <button onClick={lookupBarcode} disabled={!barcode.trim() || loading} style={analyzeBtn}>
                {loading ? "Looking up…" : "🔢 Lookup Barcode"}
              </button>
            </>
          )}

          {/* ── VOICE TAB ── */}
          {tab === "voice" && (
            <>
              <div style={{ textAlign:"center", padding:"20px 0 10px" }}>
                <button onClick={listening ? undefined : startListening} style={{
                  width:72, height:72, borderRadius:22, border:"none",
                  fontSize:28, cursor:"pointer", margin:"0 auto 10px", display:"block",
                  background: listening ? D.coralDim : D.s1,
                  outline: `2px solid ${listening ? D.coral : D.border2}`,
                  animation: listening ? "pulse 1s infinite" : "none",
                  transition:"all 0.2s",
                }}>🎙️</button>
                <div style={{ fontSize:11, color: listening ? D.coral : D.t2, fontWeight:listening?600:400 }}>
                  {listening ? "Listening… speak now" : "Tap to speak"}
                </div>
              </div>
              {transcript && (
                <div style={{
                  background:D.s1, border:`1px solid ${D.border}`,
                  borderRadius:12, padding:"10px 12px", marginBottom:4,
                }}>
                  <div style={{ fontSize:9, color:D.amber, fontWeight:700, marginBottom:5, letterSpacing:1 }}>YOU SAID</div>
                  <div style={{ fontSize:12, color:D.t1, lineHeight:1.5 }}>{transcript}</div>
                </div>
              )}
              {transcript && (
                <button onClick={analyzeVoice} disabled={loading} style={analyzeBtn}>
                  {loading ? "Analyzing…" : "🧠 Analyze Speech"}
                </button>
              )}
            </>
          )}

          {/* ── VIDEO TAB ── */}
          {tab === "video" && (
            <>
              <div
                onClick={() => vidRef.current.click()}
                style={{
                  border:`1.5px dashed ${D.border2}`, borderRadius:12,
                  padding:"28px 20px", textAlign:"center", cursor:"pointer",
                  background:D.s1,
                }}
              >
                {vidFile ? (
                  <div>
                    <div style={{ fontSize:28, marginBottom:6 }}>📹</div>
                    <div style={{ fontSize:12, fontWeight:600, color:D.t1 }}>{vidFile.name}</div>
                    <div style={{ fontSize:10, color:D.t3, marginTop:3 }}>Tap to change</div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize:36, marginBottom:8 }}>🎥</div>
                    <div style={{ fontSize:12, fontWeight:600, color:D.t1, marginBottom:4 }}>Upload meal video</div>
                    <div style={{ fontSize:10, color:D.t3 }}>MP4 · MOV · AVI · Max 50MB</div>
                  </>
                )}
              </div>
              <input ref={vidRef} type="file" accept="video/*" style={{ display:"none" }}
                onChange={e => { const f=e.target.files[0]; if(f){setVidFile(f);setResult(null);} }} />
              <div style={{ fontSize:10, color:D.t3, marginTop:6, textAlign:"center" }}>
                AI analyzes frames every 60 frames · Uses multiple Gemini quota calls
              </div>
              <button onClick={analyzeVideo} disabled={!vidFile || loading} style={analyzeBtn}>
                {loading ? "Analyzing frames…" : "🎬 Analyze Video"}
              </button>
            </>
          )}

          {/* Error */}
          {error && (
            <div style={{
              marginTop:10, padding:"9px 12px",
              background:D.coralDim, border:`1px solid ${D.coral}33`,
              borderRadius:10, fontSize:11, color:D.coral,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div style={{
              marginTop:10, padding:"14px", background:D.s1,
              border:`1px solid ${D.border}`, borderRadius:12,
              textAlign:"center",
            }}>
              <div style={{ fontSize:11, color:D.t2, marginBottom:8 }}>Analyzing your food…</div>
              <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width:6, height:6, borderRadius:"50%", background:D.yellow,
                    animation:`pulse 1s ${i*0.2}s infinite`,
                  }}/>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <ResultCard result={result} onClear={() => setResult(null)} />
          )}

          {/* Recent scans hint */}
          {!result && !loading && !error && (
            <div style={{
              marginTop:16, padding:"12px",
              background:D.s1, border:`1px solid ${D.border}`,
              borderRadius:12,
            }}>
              <div style={{ fontSize:10, color:D.t3, marginBottom:10, textTransform:"uppercase", letterSpacing:.5, fontWeight:600 }}>
                Tips
              </div>
              {[
                { tab:"image",   tip:"Take photo in good lighting for best accuracy"      },
                { tab:"text",    tip:"Include quantities: '2 eggs, 1 cup rice'"           },
                { tab:"barcode", tip:"Works with packaged foods from any country"         },
                { tab:"voice",   tip:"Speak clearly: 'I had 2 rotis with dal for lunch'" },
                { tab:"video",   tip:"Scan a plate slowly for frame-by-frame detection"  },
              ].filter(t => t.tab === tab).map(t => (
                <div key={t.tip} style={{ fontSize:11, color:D.t2, lineHeight:1.5 }}>💡 {t.tip}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}