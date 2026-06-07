import React, { useState } from "react";
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

const rnd = v => Math.round(v || 0);

// ─────────────────────────────────────────────
// CART LOGIC — all unchanged
// ─────────────────────────────────────────────
let _cart = { items: [], restaurant_name: "", total_price: 0, total_calories: 0, total_protein: 0, total_carbs: 0 };

function addToCart(item) {
  const ex = _cart.items.find(i => i.id === item.id);
  if (ex) { ex.quantity += 1; ex.subtotal = ex.price * ex.quantity; }
  else _cart.items.push({ ...item, quantity: 1, subtotal: item.price });
  recalc(); return { ..._cart, items: [..._cart.items] };
}
function removeFromCart(id) {
  _cart.items = _cart.items.filter(i => i.id !== id);
  recalc(); return { ..._cart, items: [..._cart.items] };
}
function updateQty(id, qty) {
  if (qty <= 0) return removeFromCart(id);
  const i = _cart.items.find(i => i.id === id);
  if (i) { i.quantity = qty; i.subtotal = i.price * qty; }
  recalc(); return { ..._cart, items: [..._cart.items] };
}
function clearCart() { _cart = { items: [], restaurant_name: "", total_price: 0, total_calories: 0, total_protein: 0, total_carbs: 0 }; }
function recalc() {
  _cart.total_price    = _cart.items.reduce((s, i) => s + i.subtotal, 0);
  _cart.total_calories = _cart.items.reduce((s, i) => s + (i.calories || 0) * i.quantity, 0);
  _cart.total_protein  = _cart.items.reduce((s, i) => s + (i.protein  || 0) * i.quantity, 0);
  _cart.total_carbs    = _cart.items.reduce((s, i) => s + (i.carbs    || 0) * i.quantity, 0);
}

// ─────────────────────────────────────────────
// DEMO DATA — unchanged
// ─────────────────────────────────────────────
const DEMO_RESTS = [
  { id: "r1", name: "Green Bowl Co.",  address: "FC Road, Pune",       cuisine: "Healthy",   distance_km: 0.8, phone: "9876543210" },
  { id: "r2", name: "Protein Palace",  address: "Koregaon Park, Pune", cuisine: "Fitness",   distance_km: 1.2, phone: "9876543211" },
  { id: "r3", name: "Roti Republic",   address: "Shivajinagar, Pune",  cuisine: "Indian",    distance_km: 0.5, phone: "9876543212" },
  { id: "r4", name: "Sushi & Macros",  address: "Viman Nagar, Pune",   cuisine: "Japanese",  distance_km: 3.1, phone: "9876543213" },
  { id: "r5", name: "The Egg Station", address: "Baner, Pune",         cuisine: "Breakfast", distance_km: 2.4, phone: "9876543214" },
];

const DEMO_MENU = [
  { id: "m1", name: "Grilled Chicken Bowl", desc: "Brown rice, chicken, roasted veggies", price: 249, calories: 480, protein: 42, carbs: 38, fat: 8,  veg: false },
  { id: "m2", name: "Paneer Tikka Wrap",    desc: "Whole wheat wrap, paneer, mint chutney",price: 199, calories: 390, protein: 22, carbs: 44, fat: 11, veg: true  },
  { id: "m3", name: "Egg White Omelette",   desc: "3 egg whites, spinach, mushrooms",     price: 149, calories: 180, protein: 24, carbs: 4,  fat: 3,  veg: false },
  { id: "m4", name: "Quinoa Salad Bowl",    desc: "Quinoa, chickpeas, lemon dressing",    price: 229, calories: 340, protein: 14, carbs: 52, fat: 7,  veg: true  },
  { id: "m5", name: "Masala Dal + 2 Roti", desc: "Moong dal, whole wheat roti",          price: 129, calories: 420, protein: 18, carbs: 65, fat: 6,  veg: true  },
  { id: "m6", name: "Avocado Toast",        desc: "Multigrain bread, avocado, tomatoes",  price: 179, calories: 310, protein: 8,  carbs: 34, fat: 16, veg: true  },
];

// ─────────────────────────────────────────────
// RAZORPAY — unchanged
// ─────────────────────────────────────────────
function openRazorpay(amount, name, phone, onSuccess) {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!key || !window.Razorpay) {
    setTimeout(() => onSuccess("FM_DEMO_" + Date.now()), 800);
    return;
  }
  const rzp = new window.Razorpay({
    key, amount: amount * 100, currency: "INR",
    name: "FoodMood", description: "Food Order",
    prefill: { name, contact: phone },
    theme: { color: C.accent },
    handler: res => onSuccess(res.razorpay_payment_id),
  });
  rzp.open();
}

// ─────────────────────────────────────────────
// SHARED INPUT STYLE
// ─────────────────────────────────────────────
const inputStyle = {
  width: "100%", background: C.surface2,
  border: `0.5px solid ${C.sep}`,
  borderRadius: 12, padding: "13px 16px",
  fontSize: 15, color: C.text, outline: "none",
  fontFamily: "'Inter', sans-serif",
  boxSizing: "border-box",
};

// ─────────────────────────────────────────────
// MAIN COMPONENT — all logic unchanged
// ─────────────────────────────────────────────
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
  const [form,        setForm]      = useState({ name: "", phone: "", address: "", payment: "razorpay" });
  const [placing,     setPlacing]   = useState(false);
  const [formErr,     setFormErr]   = useState("");
  const [lastOrder,   setLastOrder] = useState(null);

  function refreshCart() { setCart({ ...structuredClone(_cart), items: [..._cart.items] }); }

  // ── Search — unchanged ──
  async function search() {
    if (!city.trim()) return;
    setSearching(true);
    try {
      const r = await api.get(`/restaurants?city=${encodeURIComponent(city)}`);
      setRests(r.data.restaurants || r.data || []);
    } catch { setRests(DEMO_RESTS); }
    setSearching(false);
  }

  // ── Open restaurant — unchanged ──
  async function openRest(r) {
    setActiveRest(r); setMenuLoad(true); setView("menu");
    clearCart(); _cart.restaurant_name = r.name; refreshCart();
    try {
      const res = await api.get(`/menu/${r.id}?cuisine=${r.cuisine}`);
      setMenu(res.data.items || res.data || []);
    } catch { setMenu(DEMO_MENU); }
    setMenuLoad(false);
  }

  // ── Place order — unchanged ──
  async function placeOrder() {
    if (!form.name || !form.phone || !form.address) { setFormErr("Fill all delivery details."); return; }
    if (form.phone.length < 10) { setFormErr("Enter a valid 10-digit phone number."); return; }
    setFormErr(""); setPlacing(true);
    openRazorpay(cart.total_price + 49, form.name, form.phone, async (paymentId) => {
      try {
        const res = await api.post("/order", {
          restaurant_id:    activeRest?.id,
          restaurant_name:  activeRest?.name,
          items:            cart.items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          total:            cart.total_price + 49,
          user_name:        form.name, phone: form.phone,
          delivery_address: form.address, use_stripe: false,
        });
        setLastOrder({ order_id: res.data.order_id || "FM" + Date.now(), payment_id: paymentId, restaurant: activeRest?.name, total: cart.total_price + 49, calories: rnd(cart.total_calories), address: form.address });
      } catch {
        setLastOrder({ order_id: "FM" + Date.now(), payment_id: paymentId, restaurant: activeRest?.name, total: cart.total_price + 49, calories: rnd(cart.total_calories), address: form.address });
      }
      clearCart(); refreshCart(); setView("confirmed"); setPlacing(false);
    });
  }

  // ── Back logic — unchanged ──
  function goBack() {
    if      (view === "menu")     setView("search");
    else if (view === "cart")     setView("menu");
    else if (view === "checkout") setView("cart");
    else nav("/dashboard");
  }

  const filteredMenu = vegOnly ? menu.filter(i => i.veg) : menu;

  const TITLES = {
    search: "Order Food", menu: activeRest?.name || "Menu",
    cart: "Cart", checkout: "Checkout", confirmed: "Order Placed",
  };

  // ── Qty stepper button ──
  const qtyBtnStyle = {
    width: 28, height: 28, borderRadius: 8,
    background: C.surface2, border: `0.5px solid ${C.sep}`,
    fontSize: 16, cursor: "pointer", fontWeight: 700, color: C.text,
    display: "flex", alignItems: "center", justifyContent: "center",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${C.bg}; }
        .places {
          font-family: 'Inter', -apple-system, sans-serif;
          background: ${C.bg};
          min-height: 100vh;
          padding-bottom: 80px;
          color: ${C.text};
          max-width: 430px;
          margin: 0 auto;
          -webkit-font-smoothing: antialiased;
        }
        input::placeholder, textarea::placeholder { color: ${C.textSub}; opacity: 0.6; }
        select option { background: ${C.surface}; color: ${C.text}; }
        ::-webkit-scrollbar { display: none; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeUp 0.3s ease both; }
        .rest-row:hover { background: ${C.surface2} !important; }
        .menu-item:hover { background: ${C.surface2} !important; }
        .tappable { cursor: pointer; transition: opacity 0.15s; }
        .tappable:active { opacity: 0.6; }
      `}</style>

      <div className="places">

        {/* ── HEADER ── */}
        <div style={{
          background: C.surface,
          borderBottom: `0.5px solid ${C.sep}`,
          padding: "52px 20px 12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {view !== "confirmed" && (
              <button onClick={goBack} style={{
                background: C.surface2, border: `0.5px solid ${C.sep}`,
                borderRadius: 10, width: 36, height: 36,
                cursor: "pointer", color: C.text, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <i className="ti ti-arrow-left" style={{ fontSize: 18 }} aria-hidden="true" />
              </button>
            )}
            <div style={{ fontSize: 17, fontWeight: 700, color: C.text, flex: 1 }}>
              {TITLES[view]}
            </div>
            {(view === "search" || view === "menu") && cart.items.length > 0 && (
              <button onClick={() => setView("cart")} style={{
                background: C.accent, color: "#fff", border: "none",
                borderRadius: 20, padding: "6px 14px",
                fontWeight: 600, fontSize: 12,
                cursor: "pointer", fontFamily: "'Inter', sans-serif",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <i className="ti ti-shopping-cart" style={{ fontSize: 14 }} aria-hidden="true" />
                {cart.items.length}
              </button>
            )}
          </div>
        </div>

        {/* ══ VIEW 1 — SEARCH ══ */}
        {view === "search" && (
          <div style={{ padding: "16px 16px" }}>
            {/* Search bar */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <div style={{
                flex: 1, display: "flex", alignItems: "center", gap: 10,
                background: C.surface, border: `0.5px solid ${C.sep}`,
                borderRadius: 14, padding: "12px 16px",
              }}>
                <i className="ti ti-map-pin" style={{ fontSize: 18, color: C.textSub }} aria-hidden="true" />
                <input
                  value={city} onChange={e => setCity(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && search()}
                  placeholder="Enter city (e.g. Pune, Mumbai)"
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 15, color: C.text, background: "transparent", fontFamily: "'Inter', sans-serif" }}
                />
              </div>
              <button onClick={search} disabled={searching || !city.trim()} style={{
                background: C.accent, color: "#fff", border: "none",
                borderRadius: 14, padding: "0 18px",
                fontWeight: 600, fontSize: 14, cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                opacity: (!city.trim() || searching) ? 0.4 : 1,
              }}>
                {searching ? "…" : "Search"}
              </button>
            </div>

            {rests.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 12 }}>
                  {rests.length} restaurants found
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {rests.map((r, i) => (
                    <div
                      key={r.id || r.name}
                      className="rest-row tappable"
                      onClick={() => openRest(r)}
                      style={{
                        background: C.surface,
                        border: `0.5px solid ${C.sep}`,
                        borderRadius: 16, padding: "14px 16px",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                        animation: `fadeUp 0.3s ${i * 0.04}s both`,
                        transition: "border-color 0.15s",
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: C.surface2,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <i className="ti ti-building-store" style={{ fontSize: 20, color: C.textSub }} aria-hidden="true" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>
                          {r.name}
                        </div>
                        <div style={{ fontSize: 12, color: C.textSub }}>
                          {r.address}
                        </div>
                        <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>
                          {r.cuisine} · {r.distance_km} km
                          {r.phone && ` · ${r.phone}`}
                        </div>
                      </div>
                      <i className="ti ti-chevron-right" style={{ fontSize: 16, color: C.textSub }} aria-hidden="true" />
                    </div>
                  ))}
                </div>
              </>
            )}

            {rests.length === 0 && !searching && (
              <div style={{ textAlign: "center", padding: "56px 0" }}>
                <i className="ti ti-map-search" style={{ fontSize: 48, color: C.textSub, display: "block", marginBottom: 12 }} aria-hidden="true" />
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                  Find healthy restaurants
                </div>
                <div style={{ fontSize: 13, color: C.textSub }}>
                  Search your city to get started
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ VIEW 2 — MENU ══ */}
        {view === "menu" && (
          <>
            {/* Restaurant info bar */}
            <div style={{
              padding: "10px 16px", background: C.surface,
              borderBottom: `0.5px solid ${C.sep}`,
            }}>
              <div style={{ fontSize: 12, color: C.textSub }}>
                {activeRest?.address} · {activeRest?.distance_km} km
              </div>
              {cart.items.length > 0 && (
                <div
                  className="tappable"
                  onClick={() => setView("cart")}
                  style={{
                    marginTop: 8, background: C.surface2,
                    border: `0.5px solid ${C.sep}`,
                    borderRadius: 10, padding: "8px 12px",
                    fontSize: 13, fontWeight: 600, color: C.text,
                    cursor: "pointer", display: "flex", justifyContent: "space-between",
                    transition: "border-color 0.15s",
                  }}
                >
                  <span>{cart.items.length} item{cart.items.length > 1 ? "s" : ""} in cart</span>
                  <span>₹{cart.total_price} → View</span>
                </div>
              )}
            </div>

            {/* Veg filter */}
            <div style={{
              padding: "10px 16px", background: C.surface,
              borderBottom: `0.5px solid ${C.sep}`,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 500, color: C.text }}>
                <input type="checkbox" checked={vegOnly} onChange={e => setVegOnly(e.target.checked)}
                  style={{ accentColor: C.green, width: 16, height: 16 }} />
                Veg only
              </label>
            </div>

            <div style={{ padding: "12px 16px" }}>
              {menuLoading
                ? [1, 2, 3].map(i => (
                  <div key={i} style={{
                    height: 72, background: C.surface, borderRadius: 14,
                    marginBottom: 8, border: `0.5px solid ${C.sep}`,
                  }} />
                ))
                : filteredMenu.map((item, i) => (
                  <div
                    key={item.id}
                    className="menu-item"
                    style={{
                      background: C.surface,
                      border: `0.5px solid ${C.sep}`,
                      borderRadius: 16, padding: "14px 16px",
                      marginBottom: 8,
                      display: "flex", alignItems: "center", gap: 12,
                      animation: `fadeUp 0.3s ${i * 0.04}s both`,
                      transition: "background 0.12s",
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: item.veg ? "#F0FFF4" : "#FFF0F0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <i className={`ti ${item.veg ? "ti-leaf" : "ti-meat"}`}
                        style={{ fontSize: 20, color: item.veg ? C.green : C.red }}
                        aria-hidden="true" />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                        {item.name}
                      </div>
                      <div style={{
                        fontSize: 12, color: C.textSub, marginBottom: 6,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {item.desc || item.description}
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: C.amber }}>{item.calories} kcal</span>
                        <span style={{ fontSize: 11, color: C.blue  }}>P {item.protein}g</span>
                        <span style={{ fontSize: 11, color: C.green }}>C {item.carbs}g</span>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                        ₹{item.price}
                      </div>
                      <button
                        onClick={() => { const c = addToCart(item); setCart(c); }}
                        style={{
                          width: 30, height: 30, borderRadius: 9,
                          background: C.accent, border: "none",
                          fontSize: 18, cursor: "pointer", fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", transition: "opacity 0.12s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                      >
                        <i className="ti ti-plus" style={{ fontSize: 16 }} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Sticky cart bar */}
            {cart.items.length > 0 && (
              <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: 398, zIndex: 100 }}>
                <button onClick={() => setView("cart")} style={{
                  width: "100%", padding: "14px 20px",
                  background: C.accent, color: "#fff",
                  border: "none", borderRadius: 16,
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                }}>
                  <span>View Cart · {cart.items.length} items</span>
                  <span>₹{cart.total_price}</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* ══ VIEW 3 — CART ══ */}
        {view === "cart" && (
          <div style={{ padding: "16px 16px" }}>
            {cart.items.length === 0
              ? (
                <div style={{ textAlign: "center", padding: "56px 0" }}>
                  <i className="ti ti-shopping-cart-off" style={{ fontSize: 48, color: C.textSub, display: "block", marginBottom: 12 }} aria-hidden="true" />
                  <div style={{ fontSize: 14, color: C.textSub }}>Your cart is empty</div>
                </div>
              )
              : (
                <>
                  <div style={{ fontSize: 13, color: C.textSub, marginBottom: 12 }}>
                    From <span style={{ fontWeight: 600, color: C.text }}>{cart.restaurant_name}</span>
                  </div>

                  {cart.items.map(item => (
                    <div key={item.id} style={{
                      background: C.surface, border: `0.5px solid ${C.sep}`,
                      borderRadius: 16, padding: "14px 16px",
                      marginBottom: 8, display: "flex", alignItems: "center", gap: 12,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 12, color: C.textSub }}>
                          ₹{item.price} each · {item.calories} kcal
                        </div>
                      </div>
                      {/* Qty stepper */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button onClick={() => { const c = updateQty(item.id, item.quantity - 1); setCart(c); }} style={qtyBtnStyle}>−</button>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.text, minWidth: 18, textAlign: "center" }}>
                          {item.quantity}
                        </span>
                        <button onClick={() => { const c = updateQty(item.id, item.quantity + 1); setCart(c); }} style={qtyBtnStyle}>+</button>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                          ₹{item.subtotal}
                        </div>
                        <button onClick={() => { const c = removeFromCart(item.id); setCart(c); }} style={{
                          background: "none", border: "none", color: C.red,
                          cursor: "pointer", fontSize: 13, fontFamily: "'Inter', sans-serif",
                          fontWeight: 500,
                        }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Totals */}
                  <div style={{
                    background: C.surface, border: `0.5px solid ${C.sep}`,
                    borderRadius: 16, padding: "14px 16px", marginBottom: 16,
                  }}>
                    {[
                      { l: "Subtotal",  v: `₹${cart.total_price}`,            bold: false },
                      { l: "Delivery",  v: "₹49",                              bold: true  },
                      { l: "Calories",  v: `${rnd(cart.total_calories)} kcal`, bold: false },
                      { l: "Protein",   v: `${rnd(cart.total_protein)}g`,      bold: false },
                    ].map((r, i, arr) => (
                      <div key={r.l} style={{
                        display: "flex", justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none",
                      }}>
                        <span style={{ fontSize: 13, color: r.bold ? C.text : C.textSub, fontWeight: r.bold ? 600 : 400 }}>
                          {r.l}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: r.bold ? 700 : 500, color: C.text }}>
                          {r.v}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => setView("checkout")} style={{
                    width: "100%", padding: "15px 0",
                    background: C.accent, color: "#fff",
                    border: "none", borderRadius: 14,
                    fontWeight: 700, fontSize: 15, cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    Proceed to Checkout
                  </button>
                </>
              )
            }
          </div>
        )}

        {/* ══ VIEW 4 — CHECKOUT ══ */}
        {view === "checkout" && (
          <div style={{ padding: "16px 16px" }}>
            {/* Order summary */}
            <div style={{
              background: C.surface, border: `0.5px solid ${C.sep}`,
              borderRadius: 16, padding: "14px 16px", marginBottom: 20,
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                ₹{cart.total_price + 49} total
              </div>
              <div style={{ fontSize: 13, color: C.textSub }}>
                {cart.items.length} items · {rnd(cart.total_calories)} kcal · {cart.restaurant_name}
              </div>
            </div>

            {/* Delivery details */}
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10 }}>
              Delivery Details
            </div>

            {[
              { key: "name",  placeholder: "Your name",              label: "Name"  },
              { key: "phone", placeholder: "10-digit mobile number", label: "Phone" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 6 }}>{f.label}</div>
                <input
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={inputStyle}
                />
              </div>
            ))}

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 6 }}>Address</div>
              <textarea
                value={form.address}
                onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                placeholder="Full delivery address"
                rows={3}
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>

            {/* Payment method */}
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textSub, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10 }}>
              Payment
            </div>
            {[
              { val: "razorpay", label: "Razorpay", sub: "UPI · Card · Wallet · NetBanking" },
              { val: "demo",     label: "Demo Mode", sub: "No real payment (test)"           },
            ].map(opt => (
              <div
                key={opt.val}
                className="tappable"
                onClick={() => setForm(p => ({ ...p, payment: opt.val }))}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  background: C.surface, border: `0.5px solid ${form.payment === opt.val ? C.accent : C.sep}`,
                  borderRadius: 14, padding: "14px 16px", marginBottom: 8,
                  cursor: "pointer", transition: "border-color 0.15s",
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${form.payment === opt.val ? C.accent : C.sep}`,
                  background: form.payment === opt.val ? C.accent : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {form.payment === opt.val && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>{opt.sub}</div>
                </div>
              </div>
            ))}

            {formErr && (
              <div style={{
                background: "#FFF0F0", border: `0.5px solid ${C.red}33`,
                borderRadius: 12, padding: "10px 14px",
                fontSize: 13, color: C.red, marginBottom: 16,
              }}>
                {formErr}
              </div>
            )}

            <button onClick={placeOrder} disabled={placing} style={{
              width: "100%", padding: "15px 0",
              background: C.accent, color: "#fff",
              border: "none", borderRadius: 14,
              fontWeight: 700, fontSize: 15,
              cursor: placing ? "not-allowed" : "pointer",
              fontFamily: "'Inter', sans-serif",
              opacity: placing ? 0.6 : 1, marginTop: 4,
            }}>
              {placing ? "Processing…" : `Place Order · ₹${cart.total_price + 49}`}
            </button>
          </div>
        )}

        {/* ══ VIEW 5 — CONFIRMED ══ */}
        {view === "confirmed" && lastOrder && (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "#F0FFF4", border: `2px solid ${C.green}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <i className="ti ti-check" style={{ fontSize: 32, color: C.green }} aria-hidden="true" />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6 }}>
              Order Placed
            </div>
            <div style={{ fontSize: 14, color: C.textSub, marginBottom: 24 }}>
              Your food is on its way from {lastOrder.restaurant}
            </div>

            <div style={{
              background: C.surface, border: `0.5px solid ${C.sep}`,
              borderRadius: 16, padding: "16px 16px", marginBottom: 16, textAlign: "left",
            }}>
              {[
                { l: "Order ID",   v: lastOrder.order_id    },
                { l: "Payment ID", v: lastOrder.payment_id  },
                { l: "Total",      v: `₹${lastOrder.total}` },
                { l: "Calories",   v: `${lastOrder.calories} kcal` },
                { l: "Address",    v: lastOrder.address     },
              ].map((r, i, arr) => (
                <div key={r.l} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  padding: "10px 0",
                  borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sep}` : "none",
                }}>
                  <span style={{ fontSize: 13, color: C.textSub }}>{r.l}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text, maxWidth: "60%", textAlign: "right", wordBreak: "break-all" }}>
                    {r.v}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              background: "#F0FFF4", border: `0.5px solid ${C.green}33`,
              borderRadius: 12, padding: "12px 14px",
              fontSize: 13, color: C.green, fontWeight: 500, marginBottom: 24,
            }}>
              Meal automatically added to your nutrition log
            </div>

            <button
              onClick={() => { setView("search"); setRests([]); setCity(""); }}
              style={{
                background: C.accent, color: "#fff", border: "none",
                borderRadius: 14, padding: "14px 32px",
                fontWeight: 700, fontSize: 15,
                cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}
            >
              Back to Restaurants
            </button>
          </div>
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
            { icon: "ti-map-pin", label: "Places",  to: "/places",  active: true },
            { icon: "ti-user",    label: "Profile", to: "/profile"  },
          ].map(item => (
            <div key={item.label} onClick={() => nav(item.to)} style={{
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

// ── qty stepper button style (defined outside component to avoid recreation) ──
const qtyBtnStyle = {
  width: 28, height: 28, borderRadius: 8,
  background: "#F2F2F7", border: "0.5px solid #E5E5EA",
  fontSize: 16, cursor: "pointer", fontWeight: 700, color: "#1C1C1E",
  display: "flex", alignItems: "center", justifyContent: "center",
};