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

// ─── Verification badge levels ────────────────────────────────────────────────
const BADGES = {
  unverified: { label: "Unverified",  color: C.textSub, bg: C.surface2,               desc: "Nutrition data submitted but not yet reviewed." },
  calculated: { label: "Calculated",  color: C.amber,   bg: "rgba(255,149,0,0.08)",   desc: "Macros auto-calculated from submitted recipe."  },
  verified:   { label: "Verified",    color: C.blue,    bg: "rgba(0,122,255,0.08)",   desc: "Reviewed and approved by FoodMood nutrition team." },
  premium:    { label: "Premium",     color: C.green,   bg: "rgba(48,209,88,0.08)",   desc: "Lab-tested macros. Highest accuracy guarantee."  },
};

// ─── Maps a backend menu_items row -> the shape this UI already uses ─────────
function mapFromBackend(row) {
  return {
    id:      row.id,
    name:    row.name,
    kcal:    row.calories,
    protein: row.protein,
    carbs:   row.carbs,
    fat:     row.fat,
    fiber:   row.fiber,
    status:  row.status,
    veg:     row.veg,
    tags:    row.tags || [],
  };
}

const DIET_TAGS = ["high-protein", "low-carb", "vegan", "vegetarian", "gluten-free", "dairy-free", "high-fiber", "keto", "omega-3"];

// ─── Empty form state ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: "", kcal: "", protein: "", carbs: "", fat: "",
  fiber: "", sugar: "", sodium: "", serving_grams: "100",
  veg: false, tags: [],
};

export default function ProviderDashboard() {
  const nav = useNavigate();

  const [tab,       setTab]      = useState("menu");
  const [items,     setItems]    = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm,  setShowForm] = useState(false);
  const [form,      setForm]     = useState(EMPTY_FORM);
  const [saving,    setSaving]   = useState(false);
  const [saved,     setSaved]    = useState(false);
  const [error,     setError]    = useState("");
  const [expanded,  setExpanded] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/provider/menu");
        if (!cancelled) setItems((res.data || []).map(mapFromBackend));
      } catch {
        if (!cancelled) setError("Couldn't load your menu. Pull down to retry.");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleTag = tag => set("tags",
    form.tags.includes(tag) ? form.tags.filter(t => t !== tag) : [...form.tags, tag]
  );

  // Auto-calculate health score preview (same logic as backend)
  const previewScore = (() => {
    const p = parseFloat(form.protein) || 0;
    const f = parseFloat(form.fiber)   || 0;
    const s = parseFloat(form.sugar)   || 0;
    const n = parseFloat(form.sodium)  || 0;
    const c = parseFloat(form.kcal)    || 0;
    const score = 50 + Math.min(p * 0.8, 25) + Math.min(f * 1.2, 15)
      - Math.min(s * 1.5, 20) - Math.min(n * 0.02, 10) - Math.min(c * 0.01, 10);
    return Math.round(Math.min(Math.max(score, 0), 100));
  })();

  async function handleSubmit() {
    if (!form.name.trim()) { setError("Meal name is required."); return; }
    if (!form.kcal)        { setError("Calories are required.");  return; }
    setError(""); setSaving(true);
    try {
      const res = await api.post("/provider/menu", {
        name:          form.name.trim(),
        calories:      parseFloat(form.kcal)    || 0,
        protein:       parseFloat(form.protein) || 0,
        carbs:         parseFloat(form.carbs)   || 0,
        fat:           parseFloat(form.fat)     || 0,
        fiber:         parseFloat(form.fiber)   || 0,
        sugar:         parseFloat(form.sugar)   || 0,
        sodium:        parseFloat(form.sodium)  || 0,
        serving_grams: parseFloat(form.serving_grams) || 100,
        veg:           form.veg,
        tags:          form.tags,
      });
      const newItem = mapFromBackend(res.data.data);
      setItems(prev => [newItem, ...prev]);
      setSaving(false); setSaved(true);
      setTimeout(() => {
        setSaved(false); setShowForm(false); setForm(EMPTY_FORM);
      }, 1800);
    } catch (e) {
      setSaving(false);
      setError(e?.response?.data?.detail || "Couldn't save this item. Try again.");
    }
  }

  async function handleDelete(itemId) {
    setDeletingId(itemId);
    try {
      await api.delete(`/provider/menu/${itemId}`);
      setItems(prev => prev.filter(i => i.id !== itemId));
      setExpanded(null);
    } catch {
      setError("Couldn't delete this item. Try again.");
    }
    setDeletingId(null);
  }

  const stats = {
    total:      items.length,
    verified:   items.filter(i => i.status === "verified" || i.status === "premium").length,
    premium:    items.filter(i => i.status === "premium").length,
    unverified: items.filter(i => i.status === "unverified").length,
  };

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
    input: {
      width: "100%", background: C.surface2,
      border: `0.5px solid ${C.sep}`, borderRadius: 12,
      padding: "13px 14px", fontSize: 15, color: C.text,
      outline: "none", fontFamily: "'Inter', sans-serif",
      WebkitAppearance: "none",
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
        input:focus, select:focus, textarea:focus { border-color: #1C1C1E !important; outline: none; }
        input::placeholder { color: #8E8E93; opacity: 0.6; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeUp 0.3s ease both; }
      `}</style>

      <div style={s.page}>

        {/* ── HEADER ── */}
        <div style={{
          background: C.surface, borderBottom: `0.5px solid ${C.sep}`,
          padding: "52px 20px 0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <button onClick={() => nav("/dashboard")} style={{
              background: C.surface2, border: `0.5px solid ${C.sep}`,
              borderRadius: 10, width: 36, height: 36, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <i className="ti ti-arrow-left" style={{ fontSize: 18, color: C.text }} aria-hidden="true" />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Provider Dashboard</div>
              <div style={{ fontSize: 12, color: C.textSub }}>Manage your verified menu</div>
            </div>
            <button
              onClick={() => { setShowForm(true); setTab("menu"); }}
              style={{
                background: C.accent, color: "#fff", border: "none",
                borderRadius: 12, padding: "8px 14px",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              <i className="ti ti-plus" style={{ fontSize: 14 }} aria-hidden="true" />
              Add meal
            </button>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
            {[
              { id: "menu",    label: "Menu Items"    },
              { id: "badges",  label: "Verification"  },
              { id: "analytics",label: "Analytics"    },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flexShrink: 0, padding: "10px 18px",
                background: "transparent", border: "none",
                borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent",
                cursor: "pointer", fontWeight: tab === t.id ? 600 : 400,
                fontSize: 13, fontFamily: "'Inter', sans-serif",
                color: tab === t.id ? C.text : C.textSub,
                transition: "all 0.15s",
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4, margin: "12px 16px" }}>
          {[
            { lbl: "Total",      val: stats.total,      color: C.text    },
            { lbl: "Verified",   val: stats.verified,   color: C.blue    },
            { lbl: "Premium",    val: stats.premium,    color: C.green   },
            { lbl: "Pending",    val: stats.unverified, color: C.amber   },
          ].map(s => (
            <div key={s.lbl} style={{
              background: C.surface, borderRadius: 14, padding: "12px 8px",
              textAlign: "center", border: `0.5px solid ${C.sep}`,
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color, letterSpacing: -0.5 }}>
                {s.val}
              </div>
              <div style={{ fontSize: 10, color: C.textSub, marginTop: 3 }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* ══ TAB: MENU ITEMS ══ */}
        {tab === "menu" && (
          <>
            {/* Add meal form */}
            {showForm && (
              <div style={s.card} className="fade-in">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>New Menu Item</div>
                  <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError(""); }} style={{
                    background: C.surface2, border: "none", borderRadius: 8,
                    width: 28, height: 28, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <i className="ti ti-x" style={{ fontSize: 14, color: C.textSub }} aria-hidden="true" />
                  </button>
                </div>

                {/* Meal name */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 6 }}>Meal Name *</div>
                  <input
                    type="text" value={form.name} placeholder="e.g. Grilled Chicken Bowl"
                    onChange={e => set("name", e.target.value)}
                    style={s.input}
                  />
                </div>

                {/* Nutrition fields */}
                <div style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 8 }}>
                  Nutrition per serving
                </div>
                <div style={{ background: C.surface2, borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
                  {[
                    { key: "kcal",    label: "Calories",    unit: "kcal",   required: true  },
                    { key: "protein", label: "Protein",     unit: "g",      required: true  },
                    { key: "carbs",   label: "Carbs",       unit: "g",      required: false },
                    { key: "fat",     label: "Fat",         unit: "g",      required: false },
                    { key: "fiber",   label: "Fiber",       unit: "g",      required: false },
                    { key: "sugar",   label: "Sugar",       unit: "g",      required: false },
                    { key: "sodium",  label: "Sodium",      unit: "mg",     required: false },
                    { key: "serving_grams", label: "Serving size", unit: "g", required: false },
                  ].map((f, i, arr) => (
                    <div key={f.key} style={{
                      display: "flex", alignItems: "center",
                      padding: "12px 14px",
                      borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none",
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>
                          {f.label}{f.required ? " *" : ""}
                        </div>
                        <div style={{ fontSize: 11, color: C.textSub }}>{f.unit}</div>
                      </div>
                      <input
                        type="number" placeholder="0" value={form[f.key]}
                        onChange={e => set(f.key, e.target.value)}
                        style={{
                          width: 80, textAlign: "right",
                          background: C.surface, border: `0.5px solid ${C.sep}`,
                          borderRadius: 8, padding: "8px 10px",
                          fontSize: 15, fontWeight: 700, color: C.text,
                          outline: "none", fontFamily: "'Inter', sans-serif",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Health score preview */}
                {form.kcal && (
                  <div style={{
                    background: previewScore >= 70 ? "rgba(48,209,88,0.06)" : "rgba(255,149,0,0.06)",
                    border: `0.5px solid ${previewScore >= 70 ? C.green : C.amber}33`,
                    borderRadius: 12, padding: "12px 14px", marginBottom: 12,
                    display: "flex", alignItems: "center", gap: 14,
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${previewScore >= 70 ? C.green : C.amber}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{
                        fontSize: 14, fontWeight: 700,
                        color: previewScore >= 70 ? C.green : C.amber,
                      }}>
                        {previewScore}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                        Estimated health score
                      </div>
                      <div style={{ fontSize: 11, color: C.textSub }}>
                        Based on your nutrition inputs. Final score after verification.
                      </div>
                    </div>
                  </div>
                )}

                {/* Veg toggle */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 0", borderTop: `0.5px solid ${C.sep}`, marginBottom: 12,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>Vegetarian</div>
                    <div style={{ fontSize: 11, color: C.textSub }}>No meat or fish</div>
                  </div>
                  <div
                    className="tappable"
                    onClick={() => set("veg", !form.veg)}
                    style={{
                      width: 44, height: 26, borderRadius: 13,
                      background: form.veg ? C.green : C.sep,
                      position: "relative", transition: "background 0.2s",
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 3,
                      left: form.veg ? 21 : 3,
                      width: 20, height: 20, borderRadius: "50%",
                      background: "#fff", transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                    }} />
                  </div>
                </div>

                {/* Diet tags */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 8 }}>
                    Diet tags
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {DIET_TAGS.map(tag => {
                      const sel = form.tags.includes(tag);
                      return (
                        <button key={tag} onClick={() => toggleTag(tag)} style={{
                          padding: "5px 12px", borderRadius: 20,
                          border: `0.5px solid ${sel ? C.accent : C.sep}`,
                          background: sel ? C.accent : C.surface,
                          color: sel ? "#fff" : C.textSub,
                          fontSize: 12, fontWeight: sel ? 600 : 400,
                          cursor: "pointer", fontFamily: "'Inter', sans-serif",
                          transition: "all 0.12s",
                        }}>
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div style={{
                    background: "#FFF0F0", border: `0.5px solid ${C.red}33`,
                    borderRadius: 10, padding: "10px 14px",
                    fontSize: 13, color: C.red, marginBottom: 12,
                  }}>
                    {error}
                  </div>
                )}

                <button onClick={handleSubmit} disabled={saving || saved} style={{
                  width: "100%", padding: "15px 0",
                  background: saved ? C.green : C.accent,
                  color: "#fff", border: "none", borderRadius: 14,
                  fontSize: 15, fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "'Inter', sans-serif",
                  transition: "background 0.2s",
                  opacity: saving ? 0.7 : 1,
                }}>
                  {saved ? "Meal added" : saving ? "Submitting…" : "Submit for verification"}
                </button>
                <div style={{ fontSize: 11, color: C.textSub, textAlign: "center", marginTop: 8 }}>
                  FoodMood will review and assign a verification badge within 48 hours
                </div>
              </div>
            )}

            {/* Menu item list */}
            <div style={s.secLbl}>Your Menu</div>
            <div style={s.card}>
              {loading && (
                <div style={{ padding: "20px 0", textAlign: "center", fontSize: 13, color: C.textSub }}>
                  Loading your menu…
                </div>
              )}
              {!loading && items.length === 0 && (
                <div style={{ padding: "20px 0", textAlign: "center", fontSize: 13, color: C.textSub }}>
                  No menu items yet — add your first one above.
                </div>
              )}
              {items.map((item, i) => {
                const badge   = BADGES[item.status];
                const isOpen  = expanded === item.id;
                return (
                  <div
                    key={item.id}
                    className="fade-in"
                    style={{
                      borderBottom: i < items.length - 1 ? `0.5px solid ${C.sep}` : "none",
                      animationDelay: `${i * 0.04}s`,
                    }}
                  >
                    <div
                      className="tappable"
                      onClick={() => setExpanded(isOpen ? null : item.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "13px 0",
                      }}
                    >
                      {/* Veg/non-veg indicator */}
                      <div style={{
                        width: 10, height: 10, borderRadius: 2, flexShrink: 0,
                        border: `1.5px solid ${item.veg ? C.green : C.red}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <div style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: item.veg ? C.green : C.red,
                        }} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>
                          {item.name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          {/* Verification badge */}
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            color: badge.color, background: badge.bg,
                            borderRadius: 6, padding: "2px 8px",
                          }}>
                            {item.status === "premium"  ? "★ " : ""}
                            {item.status === "verified" ? "✓ " : ""}
                            {badge.label}
                          </span>
                          <span style={{ fontSize: 11, color: C.textSub }}>
                            {item.kcal} kcal · {item.protein}g P
                          </span>
                        </div>
                      </div>

                      <i className={`ti ti-chevron-${isOpen ? "up" : "down"}`}
                        style={{ fontSize: 16, color: C.textSub, flexShrink: 0 }}
                        aria-hidden="true" />
                    </div>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div style={{
                        background: C.surface2, borderRadius: 12,
                        padding: "12px 14px", marginBottom: 12,
                      }}>
                        {/* Macro row */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
                          {[
                            { lbl: "Calories", val: item.kcal,    unit: "kcal", color: C.text  },
                            { lbl: "Protein",  val: item.protein, unit: "g",    color: C.blue  },
                            { lbl: "Carbs",    val: item.carbs,   unit: "g",    color: C.green },
                            { lbl: "Fat",      val: item.fat,     unit: "g",    color: C.amber },
                          ].map(m => (
                            <div key={m.lbl} style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.val}</div>
                              <div style={{ fontSize: 9, color: C.textSub }}>{m.unit}</div>
                              <div style={{ fontSize: 9, color: C.textSub }}>{m.lbl}</div>
                            </div>
                          ))}
                        </div>

                        {/* Badge description */}
                        <div style={{
                          background: badge.bg, borderRadius: 10, padding: "10px 12px",
                          marginBottom: 10,
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: badge.color, marginBottom: 2 }}>
                            {badge.label} — {badge.desc}
                          </div>
                        </div>

                        {/* Tags */}
                        {item.tags.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                            {item.tags.map(tag => (
                              <span key={tag} style={{
                                fontSize: 11, color: C.textSub,
                                background: C.surface, border: `0.5px solid ${C.sep}`,
                                borderRadius: 6, padding: "2px 8px",
                              }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Delete */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                          disabled={deletingId === item.id}
                          style={{
                            width: "100%", padding: "9px 0", borderRadius: 10,
                            border: `0.5px solid ${C.red}55`, background: "transparent",
                            color: C.red, fontSize: 12, fontWeight: 600,
                            opacity: deletingId === item.id ? 0.5 : 1,
                          }}
                        >
                          {deletingId === item.id ? "Removing…" : "Remove item"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ══ TAB: VERIFICATION ══ */}
        {tab === "badges" && (
          <>
            <div style={s.secLbl}>Verification Levels</div>
            <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(BADGES).map(([key, badge], i) => (
                <div key={key} style={{
                  background: C.surface, border: `0.5px solid ${C.sep}`,
                  borderRadius: 16, padding: "16px 16px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: badge.bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <i className={`ti ${
                        key === "unverified" ? "ti-clock" :
                        key === "calculated" ? "ti-calculator" :
                        key === "verified"   ? "ti-shield-check" : "ti-star"
                      }`} style={{ fontSize: 20, color: badge.color }} aria-hidden="true" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{badge.label}</div>
                      <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>{badge.desc}</div>
                    </div>
                    <div style={{
                      marginLeft: "auto", flexShrink: 0,
                      fontSize: 11, fontWeight: 700, color: badge.color,
                      background: badge.bg, borderRadius: 8, padding: "4px 10px",
                    }}>
                      {items.filter(item => item.status === key).length} meals
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* How to get verified */}
            <div style={s.secLbl}>How to get verified</div>
            <div style={s.card}>
              {[
                { n: "1", title: "Submit your recipe",     desc: "Add a meal with full ingredient list and quantities through the Add Meal form." },
                { n: "2", title: "Auto-calculation",       desc: "FoodMood automatically calculates macros from your ingredients. Status becomes Calculated." },
                { n: "3", title: "Nutrition team review",  desc: "Our team reviews your submission within 48 hours. Status upgrades to Verified." },
                { n: "4", title: "Lab testing (Premium)",  desc: "Submit lab test results for your meals to receive the Premium badge — highest accuracy." },
              ].map((s, i, arr) => (
                <div key={s.n} style={{
                  display: "flex", gap: 14, alignItems: "flex-start",
                  padding: "14px 0",
                  borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                    background: C.surface2, border: `0.5px solid ${C.sep}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: C.text,
                  }}>
                    {s.n}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══ TAB: ANALYTICS ══ */}
        {tab === "analytics" && (
          <>
            <div style={s.secLbl}>Overview</div>
            <div style={{ padding: "0 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              {[
                { icon: "ti-eye",       label: "Menu views",      val: "1,284", color: C.blue  },
                { icon: "ti-shopping-cart", label: "Orders this week", val: "47", color: C.green },
                { icon: "ti-star",      label: "Avg rating",      val: "4.8",  color: C.amber },
                { icon: "ti-shield-check", label: "Verified meals", val: `${stats.verified}/${stats.total}`, color: C.blue },
              ].map(a => (
                <div key={a.label} style={{
                  background: C.surface, border: `0.5px solid ${C.sep}`,
                  borderRadius: 16, padding: "16px 16px",
                }}>
                  <i className={`ti ${a.icon}`} style={{ fontSize: 22, color: a.color, display: "block", marginBottom: 8 }} aria-hidden="true" />
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: -0.5, marginBottom: 3 }}>
                    {a.val}
                  </div>
                  <div style={{ fontSize: 12, color: C.textSub }}>{a.label}</div>
                </div>
              ))}
            </div>

            <div style={s.secLbl}>Top performing meals</div>
            <div style={s.card}>
              {items.slice(0, 3).map((item, i, arr) => (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 0",
                  borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: C.surface2,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: C.textSub,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: C.textSub }}>{item.kcal} kcal · {item.protein}g protein</div>
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 700,
                    color: BADGES[item.status].color,
                    background: BADGES[item.status].bg,
                    borderRadius: 6, padding: "3px 9px",
                  }}>
                    {BADGES[item.status].label}
                  </div>
                </div>
              ))}
            </div>
          </>
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