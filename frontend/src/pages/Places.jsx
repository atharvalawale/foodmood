import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const D = {
  yellow:"#FFD60A", yellowDim:"rgba(255,214,10,0.12)",
  bg:"#0F0F0F", s1:"#181818", s2:"#222222", s3:"#2A2A2A",
  border:"rgba(255,255,255,0.07)", border2:"rgba(255,255,255,0.12)",
  green:"#00C97A", greenDim:"rgba(0,201,122,0.12)",
  coral:"#FF5A5A", coralDim:"rgba(255,90,90,0.12)",
  blue:"#4D9EFF",  blueDim:"rgba(77,158,255,0.12)",
  amber:"#FFAB00", amberDim:"rgba(255,171,0,0.12)",
  t1:"#F0F0F0", t2:"#888888", t3:"#444444",
};

const rnd = v => Math.round(v || 0);

// ─── Cart state ───────────────────────────────────────────────────────────────
let _cart = { items:[], restaurant_name:"", total_price:0, total_calories:0, total_protein:0, total_carbs:0 };

function addToCart(item) {
  const ex = _cart.items.find(i => i.id === item.id);
  if (ex) { ex.quantity += 1; ex.subtotal = ex.price * ex.quantity; }
  else _cart.items.push({ ...item, quantity:1, subtotal:item.price });
  recalc(); return { ..._cart, items:[..._cart.items] };
}
function removeFromCart(id) {
  _cart.items = _cart.items.filter(i => i.id !== id);
  recalc(); return { ..._cart, items:[..._cart.items] };
}
function updateQty(id, qty) {
  if (qty <= 0) return removeFromCart(id);
  const i = _cart.items.find(i => i.id === id);
  if (i) { i.quantity = qty; i.subtotal = i.price * qty; }
  recalc(); return { ..._cart, items:[..._cart.items] };
}
function clearCart() { _cart = { items:[], restaurant_name:"", total_price:0, total_calories:0, total_protein:0, total_carbs:0 }; }
function recalc() {
  _cart.total_price    = _cart.items.reduce((s,i) => s + i.subtotal, 0);
  _cart.total_calories = _cart.items.reduce((s,i) => s + (i.calories||0)*i.quantity, 0);
  _cart.total_protein  = _cart.items.reduce((s,i) => s + (i.protein||0)*i.quantity, 0);
  _cart.total_carbs    = _cart.items.reduce((s,i) => s + (i.carbs||0)*i.quantity, 0);
}

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_RESTS = [
  { id:"r1", name:"Green Bowl Co.",    address:"FC Road, Pune",       cuisine:"Healthy",   distance_km:0.8, phone:"9876543210" },
  { id:"r2", name:"Protein Palace",    address:"Koregaon Park, Pune", cuisine:"Fitness",   distance_km:1.2, phone:"9876543211" },
  { id:"r3", name:"Roti Republic",     address:"Shivajinagar, Pune",  cuisine:"Indian",    distance_km:0.5, phone:"9876543212" },
  { id:"r4", name:"Sushi & Macros",    address:"Viman Nagar, Pune",   cuisine:"Japanese",  distance_km:3.1, phone:"9876543213" },
  { id:"r5", name:"The Egg Station",   address:"Baner, Pune",         cuisine:"Breakfast", distance_km:2.4, phone:"9876543214" },
];

const DEMO_MENU = [
  { id:"m1", name:"Grilled Chicken Bowl", desc:"Brown rice, chicken, roasted veggies", price:249, calories:480, protein:42, carbs:38, fat:8,  veg:false, emoji:"🍗" },
  { id:"m2", name:"Paneer Tikka Wrap",    desc:"Whole wheat wrap, paneer, mint chutney",price:199, calories:390, protein:22, carbs:44, fat:11, veg:true,  emoji:"🌯" },
  { id:"m3", name:"Egg White Omelette",   desc:"3 egg whites, spinach, mushrooms",     price:149, calories:180, protein:24, carbs:4,  fat:3,  veg:false, emoji:"🍳" },
  { id:"m4", name:"Quinoa Salad Bowl",    desc:"Quinoa, chickpeas, lemon dressing",    price:229, calories:340, protein:14, carbs:52, fat:7,  veg:true,  emoji:"🥗" },
  { id:"m5", name:"Masala Dal + 2 Roti", desc:"Moong dal, whole wheat roti",          price:129, calories:420, protein:18, carbs:65, fat:6,  veg:true,  emoji:"🫓" },
  { id:"m6", name:"Avocado Toast",        desc:"Multigrain bread, avocado, tomatoes",  price:179, calories:310, protein:8,  carbs:34, fat:16, veg:true,  emoji:"🥑" },
];

// ─── Razorpay payment ─────────────────────────────────────────────────────────
function openRazorpay(amount, name, phone, onSuccess) {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!key || !window.Razorpay) {
    // Demo mode — no real payment
    setTimeout(() => onSuccess("FM_DEMO_" + Date.now()), 800);
    return;
  }
  const rzp = new window.Razorpay({
    key,
    amount: amount * 100, // paise
    currency: "INR",
    name: "FoodMood",
    description: "Food Order",
    prefill: { name, contact: phone },
    theme: { color: D.yellow },
    handler: res => onSuccess(res.razorpay_payment_id),
  });
  rzp.open();
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function Label({ children }) {
  return (
    <div style={{ fontSize:10, color:D.t2, letterSpacing:.5, textTransform:"uppercase",
      fontWeight:600, marginBottom:8 }}>{children}</div>
  );
}

function inp(extra={}) {
  return {
    width:"100%", background:D.s2, border:`1px solid ${D.border}`,
    borderRadius:8, padding:"9px 10px", fontSize:12, color:D.t1,
    fontFamily:"'Inter',sans-serif", outline:"none", boxSizing:"border-box", ...extra,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Places() {
  const nav = useNavigate();
  const [view,        setView]      = useState("search");
  const [city,        setCity]      = useState("");
  const [rests,       setRests]     = useState([]);
  const [searching,   setSearching] = useState(false);
  const [vegOnly,     setVegOnly]   = useState(false);
  const [activeRest,  setActiveRest]= useState(null);
  const [menu,        setMenu]      = useState([]);
  const [menuLoading, setMenuLoad]  = useState(false);
  const [cart,        setCart]      = useState(_cart);
  const [form,        setForm]      = useState({ name:"", phone:"", address:"", payment:"razorpay" });
  const [placing,     setPlacing]   = useState(false);
  const [formErr,     setFormErr]   = useState("");
  const [lastOrder,   setLastOrder] = useState(null);

  function refreshCart() { setCart({ ...structuredClone(_cart), items:[..._cart.items] }); }

  const CUISINE_EMOJI = { Healthy:"🥗", Fitness:"💪", Indian:"🍛", Japanese:"🍱", Breakfast:"🍳" };

  // ── Search ────────────────────────────────────────────────────────────────
  async function search() {
    if (!city.trim()) return;
    setSearching(true);
    try {
      const r = await api.get(`/restaurants?city=${encodeURIComponent(city)}`);
      setRests(r.data.restaurants || r.data || []);
    } catch { setRests(DEMO_RESTS); }
    setSearching(false);
  }

  // ── Open restaurant ───────────────────────────────────────────────────────
  async function openRest(r) {
    setActiveRest(r); setMenuLoad(true); setView("menu");
    clearCart(); _cart.restaurant_name = r.name; refreshCart();
    try {
      const res = await api.get(`/menu/${r.id}?cuisine=${r.cuisine}`);
      setMenu(res.data.items || res.data || []);
    } catch { setMenu(DEMO_MENU); }
    setMenuLoad(false);
  }

  // ── Place order ───────────────────────────────────────────────────────────
  async function placeOrder() {
    if (!form.name || !form.phone || !form.address) { setFormErr("Fill all delivery details."); return; }
    if (form.phone.length < 10) { setFormErr("Enter a valid 10-digit phone number."); return; }
    setFormErr(""); setPlacing(true);

    // Razorpay payment
    openRazorpay(cart.total_price + 49, form.name, form.phone, async (paymentId) => {
      try {
        const res = await api.post("/order", {
          restaurant_id:   activeRest?.id,
          restaurant_name: activeRest?.name,
          items:           cart.items.map(i=>({id:i.id,name:i.name,price:i.price,quantity:i.quantity})),
          total:           cart.total_price + 49,
          user_name:       form.name, phone:form.phone,
          delivery_address:form.address,
          use_stripe:      false,
        });
        setLastOrder({
          order_id:        res.data.order_id || "FM"+Date.now(),
          payment_id:      paymentId,
          restaurant:      activeRest?.name,
          total:           cart.total_price + 49,
          calories:        rnd(cart.total_calories),
          address:         form.address,
        });
      } catch {
        setLastOrder({
          order_id:   "FM"+Date.now(),
          payment_id: paymentId,
          restaurant: activeRest?.name,
          total:      cart.total_price + 49,
          calories:   rnd(cart.total_calories),
          address:    form.address,
        });
      }
      clearCart(); refreshCart();
      setView("confirmed"); setPlacing(false);
    });
  }

  // ── Back logic ────────────────────────────────────────────────────────────
  function goBack() {
    if (view==="menu")     { setView("search"); }
    else if (view==="cart")     { setView("menu"); }
    else if (view==="checkout") { setView("cart"); }
    else nav("/dashboard");
  }

  const filteredMenu = vegOnly ? menu.filter(i=>i.veg) : menu;
  const titles = { search:"Order Food 🍽️", menu:activeRest?.name||"Menu", cart:"Cart 🛒", checkout:"Checkout 💳", confirmed:"Order Placed! 🎉" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${D.bg};}
        .places{font-family:'Inter',sans-serif;background:${D.bg};min-height:100vh;padding-bottom:80px;color:${D.t1};font-size:13px;}
        input::placeholder,textarea::placeholder{color:${D.t3};}
        select option{background:${D.s2};color:${D.t1};}
        ::-webkit-scrollbar{display:none;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bounce{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
      `}</style>

      <div className="places">

        {/* ── Top bar ── */}
        <div style={{ background:D.s1, borderBottom:`1px solid ${D.border}`, padding:"48px 14px 12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {view !== "confirmed" && (
              <button onClick={goBack} style={{
                background:D.s2, border:`1px solid ${D.border}`, borderRadius:8,
                width:32, height:32, cursor:"pointer", fontSize:16, color:D.t1, flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>←</button>
            )}
            <div style={{ fontSize:15, fontWeight:700, color:D.t1, flex:1 }}>{titles[view]}</div>
            {(view==="search"||view==="menu") && cart.items.length>0 && (
              <button onClick={()=>setView("cart")} style={{
                background:D.yellow, color:D.bg, border:"none",
                borderRadius:99, padding:"5px 12px", fontWeight:700, fontSize:11,
                cursor:"pointer", fontFamily:"'Inter',sans-serif",
              }}>🛒 {cart.items.length}</button>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            VIEW 1 — SEARCH
        ══════════════════════════════════════════ */}
        {view==="search" && (
          <div style={{ padding:"12px 14px" }}>
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              <input
                value={city} onChange={e=>setCity(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&search()}
                placeholder="Enter city (e.g. Pune, Mumbai)"
                style={{ ...inp(), flex:1 }}
              />
              <button onClick={search} disabled={searching||!city.trim()} style={{
                background:D.yellow, color:D.bg, border:"none", borderRadius:8,
                padding:"0 14px", fontWeight:700, fontSize:12, cursor:"pointer",
                fontFamily:"'Inter',sans-serif", opacity:(!city.trim()||searching)?0.5:1,
              }}>{searching?"…":"Search"}</button>
            </div>

            {rests.length>0 && (
              <>
                <Label>{rests.length} restaurants found</Label>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {rests.map((r,i) => (
                    <div key={r.id||r.name} onClick={()=>openRest(r)} style={{
                      background:D.s1, border:`1px solid ${D.border}`, borderRadius:12,
                      padding:"11px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:12,
                      animation:`fadeUp 0.3s ${i*0.04}s both`,
                      transition:"border-color 0.15s",
                    }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=`${D.yellow}44`}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=D.border}>
                      {/* Icon */}
                      <div style={{ width:40, height:40, borderRadius:12, background:D.s2,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:20, flexShrink:0 }}>
                        {CUISINE_EMOJI[r.cuisine]||"🍽️"}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:D.t1, marginBottom:3 }}>{r.name}</div>
                        <div style={{ fontSize:10, color:D.t2 }}>📍 {r.address}</div>
                        <div style={{ fontSize:10, color:D.t3, marginTop:2 }}>
                          {r.cuisine} · {r.distance_km} km
                          {r.phone&&` · ${r.phone}`}
                        </div>
                      </div>
                      <div style={{ fontSize:11, color:D.t3 }}>→</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {rests.length===0 && !searching && (
              <div style={{ textAlign:"center", padding:"48px 0", color:D.t2 }}>
                <div style={{ fontSize:36, marginBottom:10 }}>🔍</div>
                <div style={{ fontSize:12 }}>Search your city to find healthy restaurants</div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            VIEW 2 — MENU
        ══════════════════════════════════════════ */}
        {view==="menu" && (
          <>
            {/* Restaurant info */}
            <div style={{ padding:"10px 14px", background:D.s1, borderBottom:`1px solid ${D.border}` }}>
              <div style={{ fontSize:11, color:D.t2, marginBottom:2 }}>
                📍 {activeRest?.address} · {activeRest?.distance_km} km
              </div>
              {cart.items.length>0 && (
                <div onClick={()=>setView("cart")} style={{
                  marginTop:8, background:D.yellowDim, border:`1px solid ${D.yellow}33`,
                  borderRadius:8, padding:"7px 10px", fontSize:11, fontWeight:600,
                  color:D.yellow, cursor:"pointer", display:"flex", justifyContent:"space-between",
                }}>
                  <span>🛒 {cart.items.length} item{cart.items.length>1?"s":""} in cart</span>
                  <span>₹{cart.total_price} → View cart</span>
                </div>
              )}
            </div>

            {/* Veg filter */}
            <div style={{ padding:"8px 14px", display:"flex", alignItems:"center", gap:8,
              borderBottom:`1px solid ${D.border}` }}>
              <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12, fontWeight:500 }}>
                <input type="checkbox" checked={vegOnly} onChange={e=>setVegOnly(e.target.checked)}
                  style={{ accentColor:D.green, width:14, height:14 }}/>
                🌿 Veg only
              </label>
            </div>

            <div style={{ padding:"10px 14px" }}>
              {menuLoading
                ? [1,2,3].map(i=><div key={i} style={{ height:68, background:D.s1, borderRadius:10, marginBottom:6, animation:"shimmer 1.5s infinite" }}/>)
                : filteredMenu.map((item,i) => (
                  <div key={item.id} style={{
                    background:D.s1, border:`1px solid ${D.border}`, borderRadius:12,
                    padding:"10px 12px", marginBottom:8,
                    display:"flex", alignItems:"center", gap:10,
                    animation:`fadeUp 0.3s ${i*0.04}s both`,
                  }}>
                    <div style={{ fontSize:26, width:40, height:40, background:D.s2,
                      borderRadius:10, display:"flex", alignItems:"center",
                      justifyContent:"center", flexShrink:0 }}>
                      {item.emoji||item.image||"🍽️"}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:D.t1, marginBottom:2 }}>
                        {item.name}
                        <span style={{ marginLeft:5, fontSize:9, color:item.veg?D.green:D.coral }}>
                          {item.veg?"🌿":"🍖"}
                        </span>
                      </div>
                      <div style={{ fontSize:10, color:D.t3, marginBottom:5, overflow:"hidden",
                        textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.desc||item.description}</div>
                      <div style={{ display:"flex", gap:6 }}>
                        <span style={{ fontSize:10, fontWeight:700, color:D.amber }}>🔥{item.calories}</span>
                        <span style={{ fontSize:10, color:D.blue  }}>P:{item.protein}g</span>
                        <span style={{ fontSize:10, color:D.green }}>C:{item.carbs}g</span>
                      </div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:D.t1, marginBottom:6,
                        fontFamily:"'DM Mono',monospace" }}>₹{item.price}</div>
                      <button onClick={()=>{const c=addToCart(item);setCart(c);}} style={{
                        width:28, height:28, borderRadius:8, background:D.yellow,
                        border:"none", fontSize:16, cursor:"pointer", fontWeight:700,
                        display:"flex", alignItems:"center", justifyContent:"center", color:D.bg,
                        transition:"transform 0.1s",
                      }}
                      onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
                      onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>+</button>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Sticky cart bar */}
            {cart.items.length>0 && (
              <div style={{ position:"fixed", bottom:80, left:14, right:14, zIndex:100 }}>
                <button onClick={()=>setView("cart")} style={{
                  width:"100%", padding:"12px 16px",
                  background:D.yellow, color:D.bg, border:"none", borderRadius:12,
                  fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Inter',sans-serif",
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  boxShadow:`0 4px 20px rgba(255,214,10,0.3)`,
                }}>
                  <span>🛒 View Cart · {cart.items.length} items</span>
                  <span>₹{cart.total_price}</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════
            VIEW 3 — CART
        ══════════════════════════════════════════ */}
        {view==="cart" && (
          <div style={{ padding:"12px 14px" }}>
            {cart.items.length===0 ? (
              <div style={{ textAlign:"center", padding:"48px 0", color:D.t2 }}>
                <div style={{ fontSize:36, marginBottom:10 }}>🛒</div>
                <div style={{ fontSize:12 }}>Your cart is empty</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize:11, color:D.t2, marginBottom:10 }}>
                  From: <b style={{ color:D.t1 }}>{cart.restaurant_name}</b>
                </div>

                {cart.items.map(item => (
                  <div key={item.id} style={{
                    background:D.s1, border:`1px solid ${D.border}`, borderRadius:12,
                    padding:"10px 12px", marginBottom:8, display:"flex", alignItems:"center", gap:10,
                  }}>
                    <div style={{ fontSize:22 }}>{item.emoji||item.image||"🍽️"}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:D.t1, marginBottom:2 }}>{item.name}</div>
                      <div style={{ fontSize:10, color:D.t3 }}>₹{item.price} each · {item.calories} kcal</div>
                    </div>
                    {/* Qty stepper */}
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <button onClick={()=>{const c=updateQty(item.id,item.quantity-1);setCart(c);}} style={qtyBtn}>−</button>
                      <span style={{ fontSize:13, fontWeight:700, color:D.t1, minWidth:16, textAlign:"center",
                        fontFamily:"'DM Mono',monospace" }}>{item.quantity}</span>
                      <button onClick={()=>{const c=updateQty(item.id,item.quantity+1);setCart(c);}} style={qtyBtn}>+</button>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:D.amber,
                        fontFamily:"'DM Mono',monospace" }}>₹{item.subtotal}</div>
                      <button onClick={()=>{const c=removeFromCart(item.id);setCart(c);}} style={{
                        background:"none", border:"none", color:D.coral, cursor:"pointer", fontSize:16, marginTop:2,
                      }}>🗑️</button>
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div style={{ background:D.s1, border:`1px solid ${D.border}`, borderRadius:12, padding:"11px 12px", marginBottom:10 }}>
                  {[
                    { l:"Subtotal",  v:`₹${cart.total_price}`                },
                    { l:"Delivery",  v:"₹49"                                  },
                    { l:"Calories",  v:`${rnd(cart.total_calories)} kcal`      },
                    { l:"Protein",   v:`${rnd(cart.total_protein)}g`           },
                  ].map((r,i) => (
                    <div key={r.l} style={{
                      display:"flex", justifyContent:"space-between",
                      fontSize: i>1?10:12, fontWeight: i===1?"700":"500",
                      color: i===1?D.t1:D.t2, padding:"5px 0",
                      borderTop: i===1?`1px solid ${D.border}`:"none",
                      borderBottom: i===1?`1px solid ${D.border}`:"none",
                    }}>
                      <span>{r.l}</span>
                      <span style={{ fontFamily:"'DM Mono',monospace", color:i===1?D.yellow:D.t2 }}>{r.v}</span>
                    </div>
                  ))}
                </div>

                <button onClick={()=>setView("checkout")} style={{
                  width:"100%", padding:"11px 0", background:D.yellow, color:D.bg,
                  border:"none", borderRadius:10, fontWeight:700, fontSize:13,
                  cursor:"pointer", fontFamily:"'Inter',sans-serif",
                }}>Proceed to Checkout →</button>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            VIEW 4 — CHECKOUT
        ══════════════════════════════════════════ */}
        {view==="checkout" && (
          <div style={{ padding:"12px 14px" }}>
            {/* Order summary */}
            <div style={{ background:D.s1, border:`1px solid ${D.border}`, borderRadius:10,
              padding:"10px 12px", marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:700, color:D.t1 }}>
                ₹{cart.total_price + 49} total
              </div>
              <div style={{ fontSize:10, color:D.t2, marginTop:3 }}>
                {cart.items.length} items · {rnd(cart.total_calories)} kcal · from {cart.restaurant_name}
              </div>
            </div>

            {/* Delivery details */}
            <Label>Delivery Details</Label>
            {[
              { key:"name",    placeholder:"Your name",                label:"Name"    },
              { key:"phone",   placeholder:"10 digit mobile number",   label:"Phone"   },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:8 }}>
                <div style={{ fontSize:10, color:D.t3, marginBottom:3 }}>{f.label}</div>
                <input value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                  placeholder={f.placeholder} style={inp()} />
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, color:D.t3, marginBottom:3 }}>Address</div>
              <textarea value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))}
                placeholder="Full delivery address" rows={3}
                style={{ ...inp(), resize:"none" }} />
            </div>

            {/* Payment method */}
            <Label>Payment</Label>
            {[
              { val:"razorpay", label:"Razorpay", sub:"UPI · Card · Wallet · NetBanking", icon:"💳" },
              { val:"demo",     label:"Demo",     sub:"No real payment (test mode)",       icon:"🧪" },
            ].map(opt => (
              <div key={opt.val} onClick={()=>setForm(p=>({...p,payment:opt.val}))} style={{
                display:"flex", alignItems:"center", gap:10,
                background:form.payment===opt.val?D.yellowDim:D.s1,
                border:`1px solid ${form.payment===opt.val?`${D.yellow}44`:D.border}`,
                borderRadius:10, padding:"10px 12px", marginBottom:7, cursor:"pointer",
                transition:"all 0.15s",
              }}>
                <div style={{ width:16, height:16, borderRadius:"50%", flexShrink:0,
                  border:`2px solid ${form.payment===opt.val?D.yellow:D.t3}`,
                  background:form.payment===opt.val?D.yellow:"transparent" }}/>
                <div style={{ fontSize:20 }}>{opt.icon}</div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:form.payment===opt.val?D.yellow:D.t1 }}>{opt.label}</div>
                  <div style={{ fontSize:10, color:D.t3 }}>{opt.sub}</div>
                </div>
              </div>
            ))}

            {formErr && (
              <div style={{ background:D.coralDim, border:`1px solid ${D.coral}33`, borderRadius:8,
                padding:"8px 10px", fontSize:11, color:D.coral, marginBottom:10 }}>
                ⚠️ {formErr}
              </div>
            )}

            <button onClick={placeOrder} disabled={placing} style={{
              width:"100%", padding:"12px 0", background:D.yellow, color:D.bg,
              border:"none", borderRadius:10, fontWeight:700, fontSize:13,
              cursor:placing?"not-allowed":"pointer", fontFamily:"'Inter',sans-serif",
              opacity:placing?0.6:1, marginTop:4,
            }}>
              {placing ? "Processing…" : "🎉 Place Order · ₹" + (cart.total_price + 49)}
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════
            VIEW 5 — CONFIRMED
        ══════════════════════════════════════════ */}
        {view==="confirmed" && lastOrder && (
          <div style={{ padding:"40px 20px", textAlign:"center" }}>
            <div style={{ fontSize:56, marginBottom:14, animation:"bounce 0.6s" }}>🎉</div>
            <div style={{ fontSize:18, fontWeight:700, color:D.t1, marginBottom:6 }}>Order Placed!</div>
            <div style={{ fontSize:12, color:D.t2, marginBottom:20 }}>
              Your food is on its way from {lastOrder.restaurant}
            </div>

            <div style={{ background:D.s1, border:`1px solid ${D.border}`, borderRadius:12,
              padding:"12px 14px", marginBottom:14, textAlign:"left" }}>
              {[
                { l:"Order ID",   v:lastOrder.order_id    },
                { l:"Payment ID", v:lastOrder.payment_id  },
                { l:"Total",      v:`₹${lastOrder.total}` },
                { l:"Calories",   v:`${lastOrder.calories} kcal` },
                { l:"Address",    v:lastOrder.address      },
              ].map(r => (
                <div key={r.l} style={{ display:"flex", justifyContent:"space-between",
                  fontSize:11, padding:"6px 0", borderBottom:`1px solid ${D.border}`,
                  color:D.t2 }}>
                  <span>{r.l}</span>
                  <span style={{ color:D.t1, fontWeight:500, maxWidth:"60%",
                    textAlign:"right", wordBreak:"break-all" }}>{r.v}</span>
                </div>
              ))}
            </div>

            <div style={{ background:D.greenDim, border:`1px solid ${D.green}33`, borderRadius:10,
              padding:"9px 12px", fontSize:11, color:D.green, marginBottom:20 }}>
              ✅ Meal automatically added to your daily nutrition log!
            </div>

            <button onClick={()=>{ setView("search"); setRests([]); setCity(""); }} style={{
              background:D.yellow, color:D.bg, border:"none", borderRadius:10,
              padding:"11px 28px", fontWeight:700, fontSize:13,
              cursor:"pointer", fontFamily:"'Inter',sans-serif",
            }}>← Back to Restaurants</button>
          </div>
        )}

      </div>
    </>
  );
}

const qtyBtn = {
  width:26, height:26, borderRadius:7, background:D.s2,
  border:`1px solid ${D.border}`, fontSize:14, cursor:"pointer",
  fontWeight:700, color:D.t1, display:"flex", alignItems:"center", justifyContent:"center",
};