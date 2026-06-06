import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

// ─────────────────────────────────────────────
// COLOUR TOKENS — same as Dashboard
// Night mode: swap C values (see Dashboard.jsx comment)
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

export default function Login() {
  const navigate = useNavigate();

  // ── State — all unchanged ──
  const [mode,     setMode]     = useState("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  // ── handleSubmit — unchanged ──
  async function handleSubmit() {
    if (!email || !password) { setError("Please fill all fields."); return; }
    if (mode === "signup" && !name) { setError("Please enter your name."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "signup") {
        const res = await api.post("/auth/register", { email, password, name });
        const user = {
          id:    res.data.user_id,
          email: res.data.email,
          name,
          token: null,
        };
        localStorage.setItem("foodmood_user", JSON.stringify(user));
        setSuccess("Account created! Check your email to confirm, then log in.");
        setMode("login");
      } else {
        const res = await api.post("/auth/login", { email, password });
        const user = {
          id:    res.data.user_id,
          email: res.data.email,
          name:  res.data.email.split("@")[0],
          token: res.data.access_token,
        };
        localStorage.setItem("foodmood_user", JSON.stringify(user));
        navigate("/dashboard");
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || "Something went wrong. Please try again.";
      setError(msg);
    }

    setLoading(false);
  }

  // ── demoLogin — unchanged ──
  function demoLogin() {
    const demoUser = {
      id:    "demo-user-001",
      name:  "Atharva",
      email: "demo@foodmood.ai",
      token: null,
      goal: "muscle_gain", weight_kg: 72, height_cm: 175,
      age: 22, gender: "Male",
      activity_level: "Moderately Active (exercise 3-5 days)",
      diet_type: "No restriction", allergies: "",
    };
    localStorage.setItem("foodmood_user", JSON.stringify(demoUser));
    navigate("/dashboard");
  }

  // ── Shared input style ──
  const inputStyle = {
    width: "100%",
    background: C.surface2,
    border: `1px solid ${C.sep}`,
    borderRadius: 12,
    fontSize: 15,
    padding: "14px 16px",
    outline: "none",
    fontFamily: "'Inter', sans-serif",
    color: C.text,
    transition: "border-color 0.15s",
    WebkitAppearance: "none",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${C.bg}; }
        .login-root {
          min-height: 100vh;
          background: ${C.bg};
          font-family: 'Inter', -apple-system, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          -webkit-font-smoothing: antialiased;
        }
        .login-wrap {
          width: 100%;
          max-width: 390px;
        }
        input::placeholder { color: ${C.textSub}; opacity: 0.6; }
        input:focus { border-color: ${C.accent} !important; outline: none; }
        .seg-btn {
          flex: 1;
          padding: 8px 0;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.18s;
        }
        .tappable { cursor: pointer; transition: opacity 0.15s; }
        .tappable:active { opacity: 0.6; }
        .feature-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 0.5px solid ${C.sep};
          font-size: 14px;
          color: ${C.text};
          font-weight: 500;
        }
        .feature-row:last-child { border-bottom: none; padding-bottom: 0; }
        .feature-icon {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: ${C.surface2};
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          font-size: 16px;
        }
      `}</style>

      <div className="login-root">
        <div className="login-wrap">

          {/* ── LOGO + HEADING ── */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: C.accent,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: 0.5 }}>FM</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: -0.5, marginBottom: 6 }}>
              {mode === "login" ? "Welcome back" : "Create account"}
            </div>
            <div style={{ fontSize: 14, color: C.textSub, fontWeight: 400 }}>
              {mode === "login"
                ? "Log in to track your nutrition and goals"
                : "Start your nutrition journey today"}
            </div>
          </div>

          {/* ── SEGMENTED CONTROL ── */}
          <div style={{
            display: "flex",
            background: C.surface,
            border: `0.5px solid ${C.sep}`,
            borderRadius: 12, padding: 3, gap: 3,
            marginBottom: 24,
          }}>
            {[{ val: "login", label: "Log In" }, { val: "signup", label: "Sign Up" }].map(m => (
              <button
                key={m.val}
                className="seg-btn"
                onClick={() => { setMode(m.val); setError(""); setSuccess(""); }}
                style={{
                  background: mode === m.val ? C.accent : "transparent",
                  color:      mode === m.val ? "#fff"   : C.textSub,
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* ── FORM CARD ── */}
          <div style={{
            background: C.surface,
            borderRadius: 20,
            padding: "20px 20px",
            marginBottom: 12,
          }}>

            {/* Name — signup only */}
            {mode === "signup" && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 6, letterSpacing: 0.3 }}>
                  Full Name
                </div>
                <input
                  type="text"
                  value={name}
                  placeholder="Atharva Lawale"
                  onChange={e => setName(e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 6, letterSpacing: 0.3 }}>
                Email
              </div>
              <input
                type="email"
                value={email}
                placeholder="you@example.com"
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: mode === "login" ? 8 : 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 6, letterSpacing: 0.3 }}>
                Password
              </div>
              <input
                type="password"
                value={password}
                placeholder="••••••••"
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                style={inputStyle}
              />
              {mode === "signup" && (
                <div style={{ fontSize: 11, color: C.textSub, marginTop: 5 }}>
                  Minimum 6 characters
                </div>
              )}
            </div>

            {/* Forgot password */}
            {mode === "login" && (
              <div style={{ textAlign: "right", marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: C.blue, fontWeight: 500, cursor: "pointer" }}>
                  Forgot password?
                </span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                background: "#FFF0F0", border: `0.5px solid ${C.red}33`,
                borderRadius: 10, padding: "10px 14px",
                fontSize: 13, color: C.red, marginBottom: 12,
              }}>
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div style={{
                background: "#F0FFF4", border: `0.5px solid ${C.green}33`,
                borderRadius: 10, padding: "10px 14px",
                fontSize: 13, color: C.green, marginBottom: 12,
              }}>
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%", padding: "15px 0",
                background: C.accent, color: "#fff",
                border: "none", borderRadius: 14,
                fontWeight: 700, fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Inter', sans-serif",
                opacity: loading ? 0.5 : 1,
                transition: "opacity 0.15s",
                letterSpacing: -0.2,
              }}
            >
              {loading ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
            </button>
          </div>

          {/* ── DIVIDER ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
            <div style={{ flex: 1, height: 0.5, background: C.sep }} />
            <span style={{ fontSize: 12, color: C.textSub, fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 0.5, background: C.sep }} />
          </div>

          {/* ── DEMO LOGIN ── */}
          <div style={{ marginTop: 4, marginBottom: 24 }}>
            <button
              onClick={demoLogin}
              style={{
                width: "100%", padding: "15px 0",
                background: C.surface,
                border: `0.5px solid ${C.sep}`,
                borderRadius: 14,
                fontWeight: 600, fontSize: 15,
                color: C.text,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.sep}
            >
              Try Demo — No Account Needed
            </button>
          </div>

          {/* ── FEATURES LIST ── */}
          <div style={{
            background: C.surface,
            borderRadius: 20,
            padding: "16px 18px",
            marginBottom: 24,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: C.textSub,
              letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 12,
            }}>
              What you get
            </div>
            {[
              { icon: "📷", label: "AI food detection from photos" },
              { icon: "📊", label: "Personalised calorie and macro goals" },
              { icon: "📍", label: "Nearby healthy restaurant discovery" },
              { icon: "🤖", label: "AI-powered nutrition recommendations" },
              { icon: "📈", label: "Streak tracking and weekly reports" },
            ].map(f => (
              <div key={f.label} className="feature-row">
                <div className="feature-icon">{f.icon}</div>
                <span>{f.label}</span>
              </div>
            ))}
          </div>

          {/* ── BACK ── */}
          <div style={{ textAlign: "center" }}>
            <span
              className="tappable"
              onClick={() => navigate("/")}
              style={{ fontSize: 13, color: C.textSub, fontWeight: 500 }}
            >
              ← Back to Home
            </span>
          </div>

        </div>
      </div>
    </>
  );
}