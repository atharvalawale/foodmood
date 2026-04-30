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

const inputStyle = {
  width:"100%",
  background:D.s2,
  border:`1px solid ${D.border2}`,
  borderRadius:10,
  fontSize:13,
  padding:"12px 14px",
  outline:"none",
  boxSizing:"border-box",
  fontFamily:"'Inter',sans-serif",
  color:D.t1,
  transition:"border-color 0.2s",
};

export default function Login() {
  const navigate = useNavigate();
  const [mode,     setMode]    = useState("login");
  const [email,    setEmail]   = useState("");
  const [password, setPassword]= useState("");
  const [name,     setName]    = useState("");
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState("");
  const [success,  setSuccess] = useState("");

  async function handleSubmit() {
    // Basic validation
    if (!email || !password) { setError("Please fill all fields."); return; }
    if (mode === "signup" && !name) { setError("Please enter your name."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "signup") {
        // ── REGISTER ──────────────────────────────────────────────────────────
        // Calls POST /auth/register → creates real account in Supabase
        const res = await api.post("/auth/register", { email, password, name });

        // Save user info to localStorage so other pages can read it
        const user = {
          id:    res.data.user_id,
          email: res.data.email,
          name:  name,
          token: null, // no token yet — user must verify email first (if enabled)
        };
        localStorage.setItem("foodmood_user", JSON.stringify(user));

        // Show success message — Supabase sends a confirmation email by default
        setSuccess("✅ Account created! Check your email to confirm, then log in.");
        setMode("login");

      } else {
        // ── LOGIN ─────────────────────────────────────────────────────────────
        // Calls POST /auth/login → returns access_token from Supabase
        const res = await api.post("/auth/login", { email, password });

        // Save user + token to localStorage
        // The token is used to make authenticated requests later
        const user = {
          id:    res.data.user_id,
          email: res.data.email,
          name:  res.data.email.split("@")[0],
          token: res.data.access_token,  // ← REAL token from Supabase
        };
        localStorage.setItem("foodmood_user", JSON.stringify(user));

        // Go to dashboard
        navigate("/dashboard");
      }

    } catch (err) {
      // Show the error message from the backend
      // err.response.data.detail is the message we return from FastAPI
      const msg = err?.response?.data?.detail || "Something went wrong. Please try again.";
      setError(msg);
    }

    setLoading(false);
  }

  // ── Demo login — still works, no real account needed ──────────────────────
  function demoLogin() {
    const demoUser = {
      id:    "demo-user-001",
      name:  "Atharva",
      email: "demo@foodmood.ai",
      token: null,  // demo user has no real token
      goal:"muscle_gain", weight_kg:72, height_cm:175,
      age:22, gender:"Male",
      activity_level:"Moderately Active (exercise 3-5 days)",
      diet_type:"No restriction", allergies:"",
    };
    localStorage.setItem("foodmood_user", JSON.stringify(demoUser));
    navigate("/dashboard");
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        html,body { background:${D.bg}; color:${D.t1}; }

        .login-root {
          min-height:100vh;
          background:${D.bg};
          font-family:'Inter',sans-serif;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          padding:24px 16px;
        }

        .login-box {
          width:100%; max-width:400px;
          background:${D.s1};
          border:1px solid ${D.border};
          border-radius:16px;
          overflow:hidden;
        }

        /* top accent bar */
        .login-top {
          background:${D.yellowDim};
          border-bottom:1px solid ${D.yellow}22;
          padding:28px 24px 24px;
          text-align:center;
        }

        .logo {
          display:inline-flex; align-items:center; gap:8px;
          margin-bottom:20px;
        }
        .logo-icon {
          width:34px; height:34px; background:${D.yellow};
          border-radius:9px; display:flex; align-items:center;
          justify-content:center; font-size:18px;
        }
        .logo-name {
          font-size:16px; font-weight:700; color:${D.t1};
        }

        .login-heading {
          font-size:20px; font-weight:700;
          color:${D.t1}; margin-bottom:6px;
          letter-spacing:-0.3px;
        }
        .login-sub { font-size:12px; color:${D.t2}; line-height:1.5; }

        /* body */
        .login-body { padding:20px 24px 28px; }

        /* toggle */
        .mode-toggle {
          display:flex; background:${D.s2};
          border:1px solid ${D.border};
          border-radius:10px; padding:3px;
          margin-bottom:20px; gap:3px;
        }
        .mode-btn {
          flex:1; padding:9px 0;
          border:none; border-radius:8px;
          font-weight:600; font-size:12px;
          cursor:pointer; font-family:'Inter',sans-serif;
          transition:all 0.18s;
        }
        .mode-btn.active  { background:${D.yellow}; color:${D.bg}; }
        .mode-btn.inactive{ background:transparent; color:${D.t2}; }

        /* field */
        .field { margin-bottom:12px; }
        .field-label {
          font-size:10px; font-weight:600;
          color:${D.t2}; margin-bottom:5px;
          text-transform:uppercase; letter-spacing:.4px;
        }
        input::placeholder { color:${D.t3}; }
        input:focus { border-color:${D.yellow}66 !important; }

        /* divider */
        .divider {
          display:flex; align-items:center;
          gap:10px; margin:14px 0;
        }
        .divider-line { flex:1; height:1px; background:${D.border}; }
        .divider-text { font-size:10px; color:${D.t3}; font-family:'DM Mono',monospace; }

        /* error */
        .error-box {
          background:${D.coralDim};
          border:1px solid ${D.coral}33;
          border-radius:9px; padding:9px 12px;
          font-size:11px; color:${D.coral};
          margin-bottom:12px;
        }

        /* success */
        .success-box {
          background:${D.greenDim};
          border:1px solid ${D.green}33;
          border-radius:9px; padding:9px 12px;
          font-size:11px; color:${D.green};
          margin-bottom:12px;
        }

        /* features card */
        .features-card {
          background:${D.yellowDim};
          border:1px solid ${D.yellow}22;
          border-radius:10px; padding:14px;
          margin-bottom:16px;
        }
        .features-title {
          font-size:10px; font-weight:700;
          color:${D.yellow}; margin-bottom:10px;
          text-transform:uppercase; letter-spacing:.4px;
        }
        .feature-row {
          font-size:11px; color:${D.t2};
          margin-bottom:6px; display:flex; gap:6px;
        }

        /* back link */
        .back-link { text-align:center; margin-top:4px; }
        .back-link span {
          font-size:11px; color:${D.t3};
          cursor:pointer; transition:color 0.15s;
        }
        .back-link span:hover { color:${D.yellow}; }
      `}</style>

      <div className="login-root">
        <div className="login-box">

          {/* ── Top ── */}
          <div className="login-top">
            <div className="logo">
              <div className="logo-icon">🍱</div>
              <span className="logo-name">FoodMood</span>
            </div>
            <div className="login-heading">
              {mode === "login" ? "Welcome back 👋" : "Create account 🚀"}
            </div>
            <div className="login-sub">
              {mode === "login"
                ? "Log in to track your nutrition and reach your goals."
                : "Join FoodMood and start your nutrition journey today."}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="login-body">

            {/* Mode toggle */}
            <div className="mode-toggle">
              {[{val:"login",label:"Log In"},{val:"signup",label:"Sign Up"}].map(m => (
                <button
                  key={m.val}
                  className={`mode-btn ${mode===m.val?"active":"inactive"}`}
                  onClick={() => { setMode(m.val); setError(""); setSuccess(""); }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Name (signup only) */}
            {mode === "signup" && (
              <div className="field">
                <div className="field-label">Full Name</div>
                <input
                  type="text" value={name} placeholder="Atharva Lawale"
                  onChange={e => setName(e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}

            {/* Email */}
            <div className="field">
              <div className="field-label">Email Address</div>
              <input
                type="email" value={email} placeholder="you@example.com"
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div className="field">
              <div className="field-label">Password</div>
              <input
                type="password" value={password} placeholder="••••••••"
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                style={inputStyle}
              />
              {mode === "signup" && (
                <div style={{ fontSize:10, color:D.t3, marginTop:4 }}>
                  Minimum 6 characters
                </div>
              )}
            </div>

            {/* Forgot password */}
            {mode === "login" && (
              <div style={{ textAlign:"right", marginBottom:16, marginTop:-4 }}>
                <span style={{ fontSize:11, color:D.t3, cursor:"pointer" }}>
                  Forgot password?
                </span>
              </div>
            )}

            {mode === "signup" && <div style={{ marginBottom:16 }} />}

            {/* Error message */}
            {error && <div className="error-box">⚠️ {error}</div>}

            {/* Success message (shown after signup) */}
            {success && <div className="success-box">{success}</div>}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width:"100%", padding:"13px 0",
                background:D.yellow, color:D.bg,
                border:"none", borderRadius:10,
                fontWeight:700, fontSize:13,
                cursor:"pointer", fontFamily:"'Inter',sans-serif",
                opacity:loading ? 0.6 : 1,
                marginBottom:0,
                transition:"opacity 0.15s",
              }}
              onMouseEnter={e => { if(!loading) e.currentTarget.style.opacity=".85"; }}
              onMouseLeave={e => { if(!loading) e.currentTarget.style.opacity="1"; }}
            >
              {loading
                ? "Please wait…"
                : mode === "login" ? "🚀 Log In"
                : "🎉 Create Account"}
            </button>

            {/* Divider */}
            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">or</span>
              <div className="divider-line" />
            </div>

            {/* Demo login */}
            <button
              onClick={demoLogin}
              style={{
                width:"100%", padding:"13px 0",
                background:D.s2, color:D.t1,
                border:`1px solid ${D.border2}`,
                borderRadius:10, fontWeight:700,
                fontSize:13, cursor:"pointer",
                fontFamily:"'Inter',sans-serif",
                marginBottom:16,
                transition:"border-color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor=`${D.yellow}44`}
              onMouseLeave={e => e.currentTarget.style.borderColor=D.border2}
            >
              ⚡ Try Demo — No Account Needed
            </button>

            {/* Features */}
            <div className="features-card">
              <div className="features-title">What you get with FoodMood</div>
              {[
                "📷 AI food detection from photos",
                "📊 Personalized calorie & macro goals",
                "📍 Nearby restaurant discovery",
                "🤖 AI-powered recommendations",
                "🔥 Streak tracking & weekly reports",
              ].map(f => (
                <div key={f} className="feature-row">{f}</div>
              ))}
            </div>

            {/* Back */}
            <div className="back-link">
              <span onClick={() => navigate("/")}>← Back to Home</span>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}