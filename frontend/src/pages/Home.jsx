import { useNavigate } from "react-router-dom";

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

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        html,body { background:${D.bg}; color:${D.t1}; }

        .home {
          font-family:'Inter',sans-serif;
          background:${D.bg};
          min-height:100vh;
          font-size:13px;
          color:${D.t1};
        }

        ::-webkit-scrollbar { display:none; }

        @keyframes shimmer { 0%,100%{opacity:.3} 50%{opacity:.6} }
        @keyframes up { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes scanLine { 0%{top:10%} 100%{top:90%} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

        .card {
          background:${D.s1};
          border:1px solid ${D.border};
          border-radius:12px;
        }
        .tag {
          display:inline-flex; align-items:center;
          padding:3px 10px; border-radius:99px;
          font-size:10px; font-weight:600;
          font-family:'DM Mono',monospace;
          background:${D.yellowDim};
          color:${D.yellow};
          border:1px solid rgba(255,214,10,0.2);
          margin-bottom:12px;
        }
        .row { display:flex; align-items:center; }

        /* ── SCROLL PROGRESS ── */
        .scroll-progress {
          position:fixed; top:0; left:0; height:2px;
          background:${D.yellow}; z-index:300;
          transition:width 0.1s;
        }

        /* ── NAV ── */
        .nav {
          position:fixed; top:0; left:0; right:0; z-index:200;
          display:flex; align-items:center; justify-content:space-between;
          padding:12px 16px;
          background:rgba(15,15,15,0.92);
          backdrop-filter:blur(12px);
          border-bottom:1px solid ${D.border};
        }
        .logo {
          display:flex; align-items:center; gap:8px;
          font-family:'Inter',sans-serif; font-size:15px; font-weight:700; color:${D.t1};
        }
        .logo-icon {
          width:30px; height:30px; background:${D.yellow};
          border-radius:8px; display:flex; align-items:center;
          justify-content:center; font-size:16px;
        }
        .nav-cta {
          background:${D.yellow}; color:${D.bg};
          border:none; padding:7px 16px; border-radius:99px;
          font-size:11px; font-weight:700; cursor:pointer;
          font-family:'Inter',sans-serif; transition:opacity 0.15s;
        }
        .nav-cta:hover { opacity:.85; }

        /* ── HERO ── */
        .hero {
          min-height:100vh;
          background:${D.bg};
          display:flex; align-items:center;
          padding:100px 16px 80px;
          position:relative; overflow:hidden;
          border-bottom:1px solid ${D.border};
        }
        .hero::before {
          content:''; position:absolute; top:-120px; right:-120px;
          width:480px; height:480px;
          background:${D.yellowDim};
          border-radius:50%; pointer-events:none;
        }
        .hero::after {
          content:''; position:absolute; bottom:-150px; left:-60px;
          width:320px; height:320px;
          background:rgba(77,158,255,0.05);
          border-radius:50%; pointer-events:none;
        }
        .hero-content { max-width:520px; z-index:1; animation:fadeUp 0.6s both; }
        .hero h1 {
          font-size:clamp(32px,7vw,58px);
          font-weight:700; line-height:1.05;
          letter-spacing:-1px;
          color:${D.t1};
          margin-bottom:16px;
        }
        .hero h1 span { color:${D.yellow}; font-style:italic; }
        .hero p {
          font-size:15px; color:${D.t2};
          line-height:1.6; margin-bottom:28px; max-width:420px;
        }
        .hero-btns { display:flex; gap:10px; flex-wrap:wrap; }
        .btn-primary {
          background:${D.yellow}; color:${D.bg};
          padding:11px 22px; border-radius:99px; border:none;
          font-size:12px; font-weight:700; cursor:pointer;
          font-family:'Inter',sans-serif; transition:opacity 0.15s;
        }
        .btn-primary:hover { opacity:.85; }
        .btn-secondary {
          background:transparent; color:${D.t1};
          padding:11px 22px; border-radius:99px;
          border:1px solid ${D.border2};
          font-size:12px; font-weight:600; cursor:pointer;
          font-family:'Inter',sans-serif; transition:border-color 0.15s;
        }
        .btn-secondary:hover { border-color:${D.yellow}44; }

        /* ── PHONE MOCKUPS ── */
        .hero-phones {
          position:absolute; right:32px; bottom:0;
          display:flex; gap:16px; align-items:flex-end; z-index:1;
        }
        .phone {
          width:190px; background:${D.s1};
          border-radius:28px; overflow:hidden;
          box-shadow:0 20px 60px rgba(0,0,0,0.6);
          border:1px solid ${D.border2};
          animation:float 4s ease-in-out infinite;
        }
        .phone.tall { transform:translateY(-40px); animation-delay:0.5s; }
        .phone-screen { padding:12px; min-height:360px; }
        .phone-notch {
          width:52px; height:16px;
          background:${D.s3}; border-radius:0 0 9px 9px;
          margin:0 auto 10px;
        }

        /* home screen */
        .screen-home { background:${D.s1}; }
        .ph-greeting { font-size:9px; color:${D.t2}; margin-bottom:2px; }
        .ph-name { font-size:13px; font-weight:700; color:${D.t1}; margin-bottom:8px; }
        .ph-food-card {
          background:${D.yellow}; border-radius:12px;
          padding:10px; margin-bottom:8px; position:relative; overflow:hidden;
        }
        .ph-food-card h3 { font-size:10px; font-weight:700; margin-bottom:2px; color:${D.bg}; }
        .ph-food-card p  { font-size:8px; color:rgba(0,0,0,0.55); margin-bottom:6px; }
        .ph-food-card .emoji { position:absolute; right:6px; top:6px; font-size:30px; }
        .ph-food-card .btn-sm {
          background:${D.bg}; color:${D.t1};
          border:none; padding:4px 10px; border-radius:99px;
          font-size:8px; font-weight:700; cursor:pointer;
        }
        .ph-meal-lbl { font-size:9px; font-weight:700; color:${D.t1}; margin-bottom:5px; }
        .ph-meal-item {
          display:flex; align-items:center; gap:6px;
          padding:6px; background:${D.s2};
          border-radius:8px; margin-bottom:4px;
          border:1px solid ${D.border};
        }
        .ph-meal-img {
          width:24px; height:24px; border-radius:6px;
          background:${D.yellowDim}; display:flex;
          align-items:center; justify-content:center; font-size:13px;
        }
        .ph-meal-name { font-size:9px; font-weight:600; color:${D.t1}; }
        .ph-meal-cal  { font-size:8px; color:${D.t2}; }
        .ph-meal-score { font-size:8px; font-weight:700; color:${D.green}; margin-left:auto; }

        /* scan screen */
        .screen-scan { background:${D.bg}; }
        .scan-title { color:${D.t1}; font-size:11px; font-weight:700; margin-bottom:8px; }
        .scan-box {
          aspect-ratio:1; background:${D.s2};
          border:1px dashed ${D.border2};
          border-radius:12px; display:flex; align-items:center;
          justify-content:center; margin-bottom:8px;
          position:relative; overflow:hidden;
        }
        .scan-emoji { font-size:40px; }
        .scan-line {
          position:absolute; left:0; right:0; height:2px;
          background:${D.yellow}; animation:scanLine 2s ease-in-out infinite;
        }
        .scan-tabs { display:flex; gap:4px; justify-content:center; }
        .scan-tab {
          background:${D.s2}; color:${D.t2};
          border:1px solid ${D.border};
          padding:4px 8px; border-radius:99px;
          font-size:8px; font-weight:600; cursor:pointer;
        }
        .scan-tab.active { background:${D.yellow}; color:${D.bg}; border-color:${D.yellow}; }

        @media(max-width:768px){ .hero-phones{display:none;} }

        /* ── STATS BAR ── */
        .stats-bar {
          background:${D.s1};
          border-bottom:1px solid ${D.border};
          padding:20px 16px;
          display:flex; justify-content:space-around; flex-wrap:wrap; gap:16px;
        }
        .stat-item { text-align:center; }
        .stat-number {
          font-size:26px; font-weight:700;
          color:${D.yellow};
          font-family:'DM Mono',monospace;
          letter-spacing:-0.5px;
        }
        .stat-label { font-size:10px; color:${D.t2}; margin-top:3px; }

        /* ── SECTIONS ── */
        section { padding:48px 16px; }

        .section-title {
          font-size:clamp(22px,4vw,36px);
          font-weight:700; line-height:1.1;
          letter-spacing:-0.5px;
          color:${D.t1}; margin-bottom:10px;
        }
        .section-sub {
          font-size:13px; color:${D.t2};
          line-height:1.6; max-width:480px; margin-bottom:28px;
        }

        /* ── FEATURES ── */
        .features { background:${D.bg}; border-top:1px solid ${D.border}; }
        .features-grid {
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
          gap:10px;
        }
        .feature-card {
          background:${D.s1}; border:1px solid ${D.border};
          border-radius:12px; padding:20px;
          transition:border-color 0.15s;
          animation:up 0.4s both;
        }
        .feature-card:hover { border-color:${D.yellow}44; }
        .feature-icon {
          width:40px; height:40px; border-radius:10px;
          display:flex; align-items:center;
          justify-content:center; font-size:20px; margin-bottom:12px;
        }
        .feature-card h3 { font-size:13px; font-weight:700; color:${D.t1}; margin-bottom:6px; }
        .feature-card p  { font-size:11px; color:${D.t2}; line-height:1.6; }

        /* ── HOW IT WORKS ── */
        .how { background:${D.s1}; border-top:1px solid ${D.border}; border-bottom:1px solid ${D.border}; }
        .steps { display:flex; flex-direction:column; gap:20px; max-width:520px; }
        .step  { display:flex; gap:14px; align-items:flex-start; }
        .step-num {
          width:32px; height:32px; background:${D.yellowDim};
          border:1px solid ${D.yellow}44;
          border-radius:9px; display:flex;
          align-items:center; justify-content:center;
          font-family:'DM Mono',monospace; font-size:13px;
          font-weight:700; color:${D.yellow}; flex-shrink:0;
        }
        .step h3 { font-size:12px; font-weight:700; color:${D.t1}; margin-bottom:3px; }
        .step p  { font-size:11px; color:${D.t2}; line-height:1.5; }

        /* tracker demo */
        .tracker-demo {
          background:${D.s1}; border:1px solid ${D.border};
          border-radius:12px; padding:20px; max-width:380px;
        }
        .tracker-header {
          display:flex; justify-content:space-between;
          align-items:center; margin-bottom:16px;
        }
        .tracker-header-title { font-size:12px; font-weight:700; color:${D.t1}; }
        .tracker-header-date  { font-size:10px; color:${D.t2}; font-family:'DM Mono',monospace; }
        .calorie-ring {
          width:120px; height:120px; border-radius:50%;
          background:conic-gradient(${D.yellow} 0% 72%, ${D.s3} 72% 100%);
          display:flex; align-items:center; justify-content:center;
          margin:0 auto 16px; position:relative;
        }
        .calorie-ring::before {
          content:''; position:absolute;
          width:86px; height:86px;
          background:${D.s1}; border-radius:50%;
        }
        .calorie-inner { position:relative; z-index:1; text-align:center; }
        .calorie-num {
          font-family:'DM Mono',monospace; font-size:20px;
          font-weight:700; color:${D.t1};
        }
        .calorie-lbl { font-size:9px; color:${D.t2}; }
        .macro-bars { display:flex; flex-direction:column; gap:8px; }
        .macro-bar-row { display:flex; align-items:center; gap:8px; }
        .macro-bar-lbl { font-size:10px; font-weight:600; color:${D.t1}; width:48px; }
        .macro-bar-track {
          flex:1; height:5px; background:${D.s3};
          border-radius:99px; overflow:hidden;
        }
        .macro-bar-fill { height:100%; border-radius:99px; transition:width 1s; }
        .macro-bar-val {
          font-size:9px; color:${D.t2};
          font-family:'DM Mono',monospace; width:56px; text-align:right;
        }

        /* ── CATEGORIES ── */
        .categories { background:${D.bg}; border-top:1px solid ${D.border}; }
        .categories-scroll {
          display:flex; gap:10px;
          overflow-x:auto; padding-bottom:8px; scrollbar-width:none;
        }
        .categories-scroll::-webkit-scrollbar { display:none; }
        .cat-card {
          flex-shrink:0; width:130px;
          border-radius:12px; overflow:hidden;
          background:${D.s1}; border:1px solid ${D.border};
          cursor:pointer; transition:border-color 0.15s;
        }
        .cat-card:hover { border-color:${D.yellow}44; }
        .cat-img {
          height:90px; display:flex; align-items:center;
          justify-content:center; font-size:44px;
          background:${D.s2};
        }
        .cat-name { font-size:11px; font-weight:700; color:${D.t1}; padding:8px 10px 3px; }
        .cat-count { font-size:9px; color:${D.t2}; padding:0 10px 8px; font-family:'DM Mono',monospace; }

        /* ── CTA ── */
        .cta {
          background:${D.yellowDim};
          border:1px solid ${D.yellow}22;
          border-radius:12px;
          margin:0 16px 48px;
          padding:36px 20px;
          text-align:center;
        }
        .cta h2 { font-size:clamp(20px,4vw,32px); font-weight:700; color:${D.t1}; margin-bottom:10px; letter-spacing:-0.5px; }
        .cta p  { font-size:13px; color:${D.t2}; margin-bottom:24px; }
        .cta-btns { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }

        /* ── FOOTER ── */
        footer {
          background:${D.s1};
          border-top:1px solid ${D.border};
          color:${D.t2}; padding:28px 16px;
          display:flex; justify-content:space-between;
          flex-wrap:wrap; gap:16px;
        }
        .footer-logo { color:${D.t1}; font-size:14px; font-weight:700; margin-bottom:4px; }
        .footer-links { display:flex; gap:16px; flex-wrap:wrap; align-items:center; }
        .footer-links a {
          color:${D.t2}; text-decoration:none;
          font-size:11px; transition:color 0.15s;
        }
        .footer-links a:hover { color:${D.yellow}; }
        .footer-copy { font-size:10px; font-family:'DM Mono',monospace; }

        /* fade-up for scroll animation */
        .fade-up { opacity:0; transform:translateY(20px); transition:opacity 0.5s,transform 0.5s; }
        .fade-up.visible { opacity:1; transform:translateY(0); }
      `}</style>

      <div className="scroll-progress" id="scrollProgress" />

      {/* ── NAV ── */}
      <nav className="nav">
        <div className="logo">
          <div className="logo-icon">🍱</div>
          FoodMood
        </div>
        <button className="nav-cta" onClick={() => navigate("/login")}>Get Started Free</button>
      </nav>

      <div className="home">

        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-content">
            <div className="tag">🤖 AI-Powered Nutrition</div>
            <h1>Your Personal <span>Nutrition</span> Coach</h1>
            <p>Track meals with AI, scan products, discover healthy restaurants, and order food — all in one app with guaranteed macro accuracy.</p>
            <div className="hero-btns">
              <button className="btn-primary" onClick={() => navigate("/login")}>
                🚀 Get Started Free →
              </button>
              <button className="btn-secondary" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior:"smooth" })}>
                See Features
              </button>
            </div>
          </div>

          <div className="hero-phones">
            <div className="phone">
              <div className="phone-screen screen-home">
                <div className="phone-notch" />
                <div className="ph-greeting">Good morning!</div>
                <div className="ph-name">Atharva 👋</div>
                <div className="ph-food-card">
                  <h3>Healthy Food<br/>ready for you</h3>
                  <p>Track with AI · Order fresh</p>
                  <button className="btn-sm">Shop Now</button>
                  <div className="emoji">🥗</div>
                </div>
                <div className="ph-meal-lbl">Today's Meals</div>
                <div className="ph-meal-item">
                  <div className="ph-meal-img">🍳</div>
                  <div>
                    <div className="ph-meal-name">Oats + Eggs</div>
                    <div className="ph-meal-cal">420 kcal</div>
                  </div>
                  <div className="ph-meal-score">92/100</div>
                </div>
                <div className="ph-meal-item">
                  <div className="ph-meal-img">🍛</div>
                  <div>
                    <div className="ph-meal-name">Dal Rice</div>
                    <div className="ph-meal-cal">580 kcal</div>
                  </div>
                  <div className="ph-meal-score">78/100</div>
                </div>
              </div>
            </div>

            <div className="phone tall">
              <div className="phone-screen screen-scan">
                <div className="phone-notch" />
                <div className="scan-title">🔍 AI Scanner</div>
                <div className="scan-box">
                  <div className="scan-emoji">🍜</div>
                  <div className="scan-line" />
                </div>
                <div className="scan-tabs">
                  <div className="scan-tab active">Photo</div>
                  <div className="scan-tab">Barcode</div>
                  <div className="scan-tab">Voice</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <div className="stats-bar">
          {[
            { num:"300K+", label:"Foods in Database" },
            { num:"5",     label:"Input Methods"     },
            { num:"100%",  label:"Macro Accuracy"    },
            { num:"AI",    label:"Powered Engine"    },
          ].map(s => (
            <div key={s.label} className="stat-item">
              <div className="stat-number">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── FEATURES ── */}
        <section className="features fade-up" id="features">
          <div className="tag">✨ Features</div>
          <h2 className="section-title">Everything you need<br/>to eat better</h2>
          <p className="section-sub">From tracking to ordering, FoodMood handles your complete nutrition journey with AI precision.</p>
          <div className="features-grid">
            {[
              { icon:"📷", bg:D.yellowDim,  title:"AI Photo Detection",    desc:"Take a photo of any meal and our AI instantly identifies every food item, estimates portions, and calculates exact macros." },
              { icon:"📦", bg:D.blueDim,    title:"Smart Barcode Scanner", desc:"Scan any product barcode and get instant nutrition info, health warnings, and allergen alerts." },
              { icon:"📍", bg:D.greenDim,   title:"Restaurant Discovery",  desc:"Find nearby restaurants with full menu nutrition data. Order food and have it automatically logged." },
              { icon:"🎯", bg:D.coralDim,   title:"Personalized Goals",    desc:"Set weight loss, muscle gain, or maintenance goals. Get personalized calorie targets based on your BMI and TDEE." },
              { icon:"✅", bg:"rgba(155,127,255,0.12)", title:"Verified Meals", desc:"Our verified meal system ensures macro accuracy from restaurant partners. Every meal gets a confidence score." },
              { icon:"🤖", bg:D.amberDim,   title:"AI Recommendations",   desc:"Get personalized nutrition advice based on your daily intake, goals, and eating patterns." },
            ].map((f, i) => (
              <div key={f.title} className="feature-card" style={{ animationDelay:`${i*0.06}s` }}>
                <div className="feature-icon" style={{ background:f.bg }}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="how fade-up">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:40, alignItems:"center" }}>
            <div>
              <div className="tag">🚀 How it works</div>
              <h2 className="section-title">Simple steps to<br/>better nutrition</h2>
              <div className="steps">
                {[
                  { n:1, title:"Create your profile",  desc:"Enter age, weight, height and goals. We calculate your BMI and daily calorie needs automatically." },
                  { n:2, title:"Log your meals",        desc:"Take a photo, type text, scan barcode, record voice, or upload video. AI handles the rest." },
                  { n:3, title:"Get AI insights",       desc:"See your health score, macro breakdown, and personalized AI recommendations every day." },
                  { n:4, title:"Order healthy food",    desc:"Discover nearby restaurants, view nutrition-verified menus, and order food that fits your goals." },
                ].map(s => (
                  <div key={s.n} className="step">
                    <div className="step-num">{s.n}</div>
                    <div>
                      <h3>{s.title}</h3>
                      <p>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="tracker-demo">
              <div className="tracker-header">
                <div className="tracker-header-title">Today's Nutrition</div>
                <div className="tracker-header-date">Apr 26, 2026</div>
              </div>
              <div className="calorie-ring">
                <div className="calorie-inner">
                  <div className="calorie-num">1,472</div>
                  <div className="calorie-lbl">of 2,000 kcal</div>
                </div>
              </div>
              <div className="macro-bars">
                {[
                  { label:"Protein", pct:68, color:D.blue,   val:"68g / 100g"  },
                  { label:"Carbs",   pct:55, color:D.green,  val:"138g / 250g" },
                  { label:"Fat",     pct:42, color:D.amber,  val:"27g / 65g"   },
                  { label:"Fiber",   pct:80, color:D.purple, val:"20g / 25g"   },
                ].map(m => (
                  <div key={m.label} className="macro-bar-row">
                    <div className="macro-bar-lbl">{m.label}</div>
                    <div className="macro-bar-track">
                      <div className="macro-bar-fill" style={{ width:`${m.pct}%`, background:m.color }} />
                    </div>
                    <div className="macro-bar-val">{m.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CATEGORIES ── */}
        <section className="categories fade-up">
          <div className="tag">🍽️ Food Categories</div>
          <h2 className="section-title">Explore all<br/>food categories</h2>
          <p className="section-sub">From Indian classics to international cuisine — we track nutrition for every food worldwide.</p>
          <div className="categories-scroll">
            {[
              { emoji:"🍛", name:"Indian",      count:"500+ dishes" },
              { emoji:"🍔", name:"Fast Food",   count:"200+ items"  },
              { emoji:"🥗", name:"Healthy",     count:"300+ recipes"},
              { emoji:"🍣", name:"Japanese",    count:"150+ dishes" },
              { emoji:"🍝", name:"Italian",     count:"180+ items"  },
              { emoji:"🥙", name:"Middle East", count:"120+ dishes" },
              { emoji:"🍜", name:"Chinese",     count:"250+ items"  },
              { emoji:"🥩", name:"BBQ & Grill", count:"90+ dishes"  },
            ].map(c => (
              <div key={c.name} className="cat-card">
                <div className="cat-img">{c.emoji}</div>
                <div className="cat-name">{c.name}</div>
                <div className="cat-count">{c.count}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <div className="cta fade-up">
          <h2>Start eating smarter today</h2>
          <p>Join thousands of users who transformed their nutrition with FoodMood's AI-powered tracking.</p>
          <div className="cta-btns">
            <button className="btn-primary" onClick={() => navigate("/login")}>🚀 Get Started Free</button>
            <button className="btn-secondary" onClick={() => navigate("/login")}>Try Web App</button>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer>
          <div>
            <div className="footer-logo">🍱 FoodMood</div>
            <div style={{ fontSize:11 }}>AI-Powered Nutrition Assistant</div>
          </div>
          <div className="footer-links">
            {["Features","How it works","Privacy","Terms","Contact"].map(l => (
              <a key={l} href="#">{l}</a>
            ))}
          </div>
          <div className="footer-copy">© 2026 FoodMood. All rights reserved.</div>
        </footer>

      </div>

      <script dangerouslySetInnerHTML={{ __html:`
        window.addEventListener('scroll', () => {
          const total = document.body.scrollHeight - window.innerHeight;
          const p = (window.scrollY / total) * 100;
          const el = document.getElementById('scrollProgress');
          if(el) el.style.width = p + '%';
        });
        const obs = new IntersectionObserver((entries) => {
          entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
        }, { threshold:0.1 });
        document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
      `}} />
    </>
  );
}