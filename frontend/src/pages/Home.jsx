import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

export default function Home() {
  const navigate = useNavigate();

  // Scroll progress + fade-up observer — same logic as original
  useEffect(() => {
    const onScroll = () => {
      const total = document.body.scrollHeight - window.innerHeight;
      const p     = (window.scrollY / total) * 100;
      const el    = document.getElementById("scrollProgress");
      if (el) el.style.width = p + "%";
    };
    window.addEventListener("scroll", onScroll);

    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".fade-up").forEach(el => obs.observe(el));

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${C.bg}; font-family: 'Inter', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { display: none; }

        /* ── SCROLL PROGRESS ── */
        #scrollProgress {
          position: fixed; top: 0; left: 0; height: 2px;
          background: ${C.accent}; z-index: 300; transition: width 0.1s; width: 0%;
        }

        /* ── NAV ── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 24px;
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 0.5px solid ${C.sep};
        }
        .nav-logo {
          display: flex; align-items: center; gap: 8px;
          font-size: 16px; font-weight: 700; color: ${C.text}; letter-spacing: -0.3px;
        }
        .nav-logo-mark {
          width: 30px; height: 30px; background: ${C.accent};
          border-radius: 8px; display: flex; align-items: center;
          justify-content: center;
          font-size: 10px; font-weight: 700; color: #fff; letter-spacing: 0.3px;
        }
        .nav-links { display: flex; align-items: center; gap: 24px; }
        .nav-link {
          font-size: 13px; font-weight: 500; color: ${C.textSub};
          text-decoration: none; cursor: pointer; transition: color 0.15s;
          background: none; border: none; font-family: 'Inter', sans-serif;
        }
        .nav-link:hover { color: ${C.text}; }
        .nav-cta {
          background: ${C.accent}; color: #fff;
          border: none; padding: 8px 18px; border-radius: 20px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: opacity 0.15s;
          letter-spacing: -0.1px;
        }
        .nav-cta:hover { opacity: 0.85; }
        @media (max-width: 600px) { .nav-links { display: none; } }

        /* ── HERO ── */
        .hero {
          min-height: 100vh;
          background: ${C.surface};
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 120px 24px 80px;
          text-align: center;
          border-bottom: 0.5px solid ${C.sep};
          position: relative; overflow: hidden;
        }
        .hero::before {
          content: ''; position: absolute;
          width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(0,122,255,0.04) 0%, transparent 70%);
          top: -100px; right: -100px; pointer-events: none;
        }
        .hero::after {
          content: ''; position: absolute;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(48,209,88,0.04) 0%, transparent 70%);
          bottom: -80px; left: -60px; pointer-events: none;
        }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          background: ${C.bg}; border: 0.5px solid ${C.sep};
          border-radius: 20px; padding: 5px 14px;
          font-size: 12px; font-weight: 600; color: ${C.textSub};
          letter-spacing: 0.2px; margin-bottom: 24px;
        }
        .hero-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: ${C.green}; animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .hero h1 {
          font-size: clamp(34px, 6vw, 64px);
          font-weight: 700; line-height: 1.05;
          letter-spacing: -1.5px; color: ${C.text};
          margin-bottom: 20px; max-width: 700px;
        }
        .hero h1 em {
          font-style: normal;
          background: linear-gradient(135deg, ${C.blue} 0%, ${C.green} 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          font-size: 17px; color: ${C.textSub};
          line-height: 1.65; margin-bottom: 36px;
          max-width: 500px; font-weight: 400;
        }
        .hero-btns { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 56px; }
        .btn-primary {
          background: ${C.accent}; color: #fff;
          padding: 14px 28px; border-radius: 14px; border: none;
          font-size: 15px; font-weight: 700; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: opacity 0.15s;
          letter-spacing: -0.2px;
        }
        .btn-primary:hover { opacity: 0.85; }
        .btn-secondary {
          background: ${C.surface}; color: ${C.text};
          padding: 14px 28px; border-radius: 14px;
          border: 0.5px solid ${C.sep};
          font-size: 15px; font-weight: 600; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: border-color 0.15s;
        }
        .btn-secondary:hover { border-color: ${C.accent}; }

        /* ── HERO APP PREVIEW ── */
        .hero-preview {
          display: grid; grid-template-columns: 1fr 1fr 1fr;
          gap: 12px; max-width: 680px; width: 100%; z-index: 1;
        }
        .preview-card {
          background: ${C.bg}; border: 0.5px solid ${C.sep};
          border-radius: 20px; padding: 16px; text-align: left;
        }
        .preview-card-label {
          font-size: 10px; font-weight: 600; color: ${C.textSub};
          letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 10px;
        }
        .preview-cal {
          font-size: 28px; font-weight: 700; color: ${C.text};
          letter-spacing: -1px; line-height: 1;
        }
        .preview-cal-sub { font-size: 11px; color: ${C.textSub}; margin-top: 3px; }
        .preview-score {
          font-size: 36px; font-weight: 700; color: ${C.green};
          letter-spacing: -1px; line-height: 1;
        }
        .preview-score-sub { font-size: 11px; color: ${C.textSub}; margin-top: 3px; }
        .preview-ai-text {
          font-size: 12px; color: ${C.text}; line-height: 1.5;
          font-weight: 400;
        }
        .preview-ai-tag {
          display: inline-block; background: ${C.accent};
          color: #fff; font-size: 10px; font-weight: 600;
          padding: 2px 8px; border-radius: 6px; margin-bottom: 8px;
        }
        .mini-bar-wrap { margin-top: 8px; }
        .mini-bar-row { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
        .mini-bar-lbl { font-size: 10px; color: ${C.textSub}; width: 44px; }
        .mini-bar-bg { flex: 1; height: 3px; background: ${C.sep}; border-radius: 99px; overflow: hidden; }
        .mini-bar-fg { height: 100%; border-radius: 99px; }
        @media (max-width: 560px) {
          .hero-preview { grid-template-columns: 1fr 1fr; }
          .hero-preview .preview-card:last-child { display: none; }
        }

        /* ── STATS BAR ── */
        .stats-bar {
          background: ${C.surface};
          border-bottom: 0.5px solid ${C.sep};
          padding: 24px;
          display: flex; justify-content: space-around; flex-wrap: wrap; gap: 20px;
        }
        .stat-item { text-align: center; }
        .stat-number {
          font-size: 28px; font-weight: 700; color: ${C.text};
          letter-spacing: -1px; line-height: 1;
        }
        .stat-label { font-size: 12px; color: ${C.textSub}; margin-top: 4px; font-weight: 400; }

        /* ── SECTIONS ── */
        section { padding: 64px 24px; max-width: 900px; margin: 0 auto; }
        .section-eyebrow {
          font-size: 11px; font-weight: 600; color: ${C.textSub};
          letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 10px;
        }
        .section-title {
          font-size: clamp(24px, 4vw, 40px); font-weight: 700;
          line-height: 1.1; letter-spacing: -0.8px;
          color: ${C.text}; margin-bottom: 12px;
        }
        .section-sub {
          font-size: 15px; color: ${C.textSub};
          line-height: 1.65; max-width: 480px; margin-bottom: 36px;
        }

        /* ── PLATFORM PILLARS ── */
        .pillars-section { background: ${C.surface}; border-top: 0.5px solid ${C.sep}; border-bottom: 0.5px solid ${C.sep}; }
        .pillars-inner { max-width: 900px; margin: 0 auto; padding: 64px 24px; }
        .pillars-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
        .pillar-card {
          background: ${C.bg}; border: 0.5px solid ${C.sep};
          border-radius: 20px; padding: 24px;
          transition: border-color 0.15s, transform 0.15s;
        }
        .pillar-card:hover { border-color: ${C.accent}; transform: translateY(-2px); }
        .pillar-icon {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
        }
        .pillar-card h3 { font-size: 15px; font-weight: 700; color: ${C.text}; margin-bottom: 6px; letter-spacing: -0.2px; }
        .pillar-card p  { font-size: 13px; color: ${C.textSub}; line-height: 1.6; }
        .pillar-tag {
          display: inline-block; margin-top: 12px;
          font-size: 11px; font-weight: 600; color: ${C.textSub};
          background: ${C.surface}; border: 0.5px solid ${C.sep};
          border-radius: 6px; padding: 2px 8px;
        }

        /* ── HOW IT WORKS ── */
        .how-section { background: ${C.bg}; }
        .how-inner { max-width: 900px; margin: 0 auto; padding: 64px 24px; }
        .how-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        @media (max-width: 640px) { .how-grid { grid-template-columns: 1fr; } }
        .steps { display: flex; flex-direction: column; gap: 0; }
        .step {
          display: flex; gap: 16px; align-items: flex-start;
          padding: 20px 0; border-bottom: 0.5px solid ${C.sep};
        }
        .step:last-child { border-bottom: none; }
        .step-num {
          width: 32px; height: 32px; flex-shrink: 0;
          border-radius: 10px; background: ${C.surface};
          border: 0.5px solid ${C.sep};
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: ${C.text};
        }
        .step h3 { font-size: 14px; font-weight: 700; color: ${C.text}; margin-bottom: 4px; }
        .step p  { font-size: 13px; color: ${C.textSub}; line-height: 1.55; }

        /* nutrition demo card */
        .nutrition-demo {
          background: ${C.surface}; border: 0.5px solid ${C.sep};
          border-radius: 20px; padding: 22px;
        }
        .demo-header {
          display: flex; justify-content: space-between;
          align-items: baseline; margin-bottom: 18px;
        }
        .demo-title { font-size: 15px; font-weight: 700; color: ${C.text}; }
        .demo-date  { font-size: 12px; color: ${C.textSub}; }
        .demo-ring-wrap { display: flex; align-items: center; gap: 20px; margin-bottom: 18px; }
        .demo-ring {
          width: 90px; height: 90px; border-radius: 50%; flex-shrink: 0;
          position: relative;
          background: conic-gradient(${C.accent} 0% 73%, ${C.bg} 73% 100%);
          display: flex; align-items: center; justify-content: center;
        }
        .demo-ring::before {
          content: ''; position: absolute;
          width: 64px; height: 64px; border-radius: 50%;
          background: ${C.surface};
        }
        .demo-ring-inner { position: relative; z-index: 1; text-align: center; }
        .demo-ring-num { font-size: 16px; font-weight: 700; color: ${C.text}; letter-spacing: -0.5px; }
        .demo-ring-lbl { font-size: 9px; color: ${C.textSub}; }
        .demo-ring-info { flex: 1; }
        .demo-ring-cal { font-size: 22px; font-weight: 700; color: ${C.text}; letter-spacing: -0.5px; line-height: 1; }
        .demo-ring-sub { font-size: 12px; color: ${C.textSub}; margin-top: 3px; margin-bottom: 10px; }
        .demo-remaining {
          display: inline-block; background: "#F0FFF4";
          background: rgba(48,209,88,0.1); color: ${C.green};
          font-size: 12px; font-weight: 600; border-radius: 7px; padding: 3px 10px;
        }
        .demo-bars { display: flex; flex-direction: column; gap: 10px; }
        .demo-bar-row { display: flex; align-items: center; gap: 10px; }
        .demo-bar-lbl { font-size: 12px; font-weight: 500; color: ${C.text}; width: 52px; }
        .demo-bar-bg  { flex: 1; height: 6px; background: ${C.bg}; border-radius: 99px; overflow: hidden; }
        .demo-bar-fg  { height: 100%; border-radius: 99px; transition: width 1s; }
        .demo-bar-val { font-size: 11px; color: ${C.textSub}; width: 64px; text-align: right; }

        /* ── COMPETITOR COMPARISON ── */
        .compare-section { background: ${C.surface}; border-top: 0.5px solid ${C.sep}; border-bottom: 0.5px solid ${C.sep}; }
        .compare-inner { max-width: 900px; margin: 0 auto; padding: 64px 24px; }
        .compare-table {
          width: 100%; border-collapse: collapse; margin-top: 8px;
          border: 0.5px solid ${C.sep}; border-radius: 16px; overflow: hidden;
        }
        .compare-table th {
          background: ${C.bg}; padding: 12px 16px;
          font-size: 12px; font-weight: 600; color: ${C.textSub};
          text-align: left; border-bottom: 0.5px solid ${C.sep};
          letter-spacing: 0.3px;
        }
        .compare-table th.highlight { background: ${C.text}; color: #fff; text-align: center; }
        .compare-table td {
          padding: 13px 16px; font-size: 13px; color: ${C.text};
          border-bottom: 0.5px solid ${C.sep};
        }
        .compare-table td.center { text-align: center; }
        .compare-table td.highlight-col { background: rgba(0,0,0,0.02); text-align: center; }
        .compare-table tr:last-child td { border-bottom: none; }
        .check { color: ${C.green}; font-weight: 700; font-size: 15px; }
        .cross { color: ${C.sep};   font-size: 15px; }
        .partial { color: ${C.amber}; font-size: 12px; font-weight: 600; }
        @media (max-width: 560px) { .compare-table { font-size: 11px; } .compare-table td, .compare-table th { padding: 10px 10px; } }

        /* ── FUTURE ROADMAP ── */
        .roadmap-section { background: ${C.bg}; }
        .roadmap-inner { max-width: 900px; margin: 0 auto; padding: 64px 24px; }
        .roadmap-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
        .roadmap-card {
          background: ${C.surface}; border: 0.5px solid ${C.sep};
          border-radius: 16px; padding: 18px;
        }
        .roadmap-phase {
          font-size: 10px; font-weight: 700; color: ${C.textSub};
          letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 8px;
        }
        .roadmap-card h4 { font-size: 14px; font-weight: 700; color: ${C.text}; margin-bottom: 6px; }
        .roadmap-card p  { font-size: 12px; color: ${C.textSub}; line-height: 1.5; }
        .roadmap-status {
          display: inline-block; margin-top: 10px;
          font-size: 11px; font-weight: 600; padding: 3px 10px;
          border-radius: 6px;
        }
        .status-live    { background: rgba(48,209,88,0.1);  color: ${C.green}; }
        .status-soon    { background: rgba(0,122,255,0.1);  color: ${C.blue};  }
        .status-planned { background: rgba(142,142,147,0.1);color: ${C.textSub}; }

        /* ── CTA ── */
        .cta-section { background: ${C.surface}; border-top: 0.5px solid ${C.sep}; }
        .cta-inner {
          max-width: 600px; margin: 0 auto; padding: 80px 24px;
          text-align: center;
        }
        .cta-inner h2 {
          font-size: clamp(26px, 5vw, 44px); font-weight: 700;
          letter-spacing: -1px; color: ${C.text}; margin-bottom: 14px; line-height: 1.1;
        }
        .cta-inner p { font-size: 16px; color: ${C.textSub}; margin-bottom: 32px; line-height: 1.6; }
        .cta-btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }

        /* ── FOOTER ── */
        .footer {
          background: ${C.bg}; border-top: 0.5px solid ${C.sep};
          padding: 32px 24px;
          display: flex; justify-content: space-between;
          flex-wrap: wrap; gap: 16px; align-items: center;
        }
        .footer-logo { font-size: 14px; font-weight: 700; color: ${C.text}; display: flex; align-items: center; gap: 7px; }
        .footer-logo-mark {
          width: 24px; height: 24px; background: ${C.accent}; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 8px; font-weight: 700; color: #fff;
        }
        .footer-links { display: flex; gap: 20px; flex-wrap: wrap; align-items: center; }
        .footer-link {
          font-size: 12px; color: ${C.textSub}; text-decoration: none;
          transition: color 0.15s; font-weight: 400;
        }
        .footer-link:hover { color: ${C.text}; }
        .footer-copy { font-size: 11px; color: ${C.textSub}; }

        /* ── ANIMATION ── */
        .fade-up { opacity: 0; transform: translateY(20px); transition: opacity 0.55s ease, transform 0.55s ease; }
        .fade-up.visible { opacity: 1; transform: translateY(0); }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>

      {/* Scroll progress */}
      <div id="scrollProgress" />

      {/* ── NAV ── */}
      <nav className="nav">
        <div className="nav-logo">
          <div className="nav-logo-mark">FM</div>
          FoodMood
        </div>
        <div className="nav-links">
          <button className="nav-link" onClick={() => document.getElementById("platform")?.scrollIntoView({ behavior: "smooth" })}>Platform</button>
          <button className="nav-link" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>How it works</button>
          <button className="nav-link" onClick={() => document.getElementById("roadmap")?.scrollIntoView({ behavior: "smooth" })}>Roadmap</button>
        </div>
        <button className="nav-cta" onClick={() => navigate("/login")}>Get Started</button>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-eyebrow">
          <div className="hero-eyebrow-dot" />
          AI Nutrition Platform · Built for India
        </div>

        <h1>
          Not a calorie tracker.<br />
          An <em>AI nutrition</em> platform.
        </h1>

        <p className="hero-sub">
          FoodMood understands what you eat, why it matters, and what to do next.
          Photo detection, barcode scanning, verified restaurant menus, and personalised meal plans — all in one place.
        </p>

        <div className="hero-btns">
          <button className="btn-primary" onClick={() => navigate("/login")}>
            Start for free
          </button>
          <button className="btn-secondary" onClick={() => document.getElementById("platform")?.scrollIntoView({ behavior: "smooth" })}>
            See how it works
          </button>
        </div>

        {/* App preview cards */}
        <div className="hero-preview">
          <div className="preview-card">
            <div className="preview-card-label">Today</div>
            <div className="preview-cal">1,420</div>
            <div className="preview-cal-sub">of 1,920 kcal</div>
            <div className="mini-bar-wrap">
              {[
                { lbl: "Protein", pct: 66, color: C.blue  },
                { lbl: "Carbs",   pct: 76, color: C.green },
                { lbl: "Fat",     pct: 63, color: C.amber },
              ].map(b => (
                <div key={b.lbl} className="mini-bar-row">
                  <div className="mini-bar-lbl">{b.lbl}</div>
                  <div className="mini-bar-bg">
                    <div className="mini-bar-fg" style={{ width: `${b.pct}%`, background: b.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="preview-card">
            <div className="preview-card-label">Health Score</div>
            <div className="preview-score">78</div>
            <div className="preview-score-sub">out of 100 · Healthy</div>
            <div style={{ marginTop: 12, height: 4, background: C.sep, borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: "78%", background: C.green, borderRadius: 99 }} />
            </div>
            <div style={{ fontSize: 11, color: C.textSub, marginTop: 8 }}>+22 Protein · −8 Sugar</div>
          </div>

          <div className="preview-card">
            <div className="preview-ai-tag">AI Coach</div>
            <div className="preview-ai-text">
              You're 48g short on protein. A grilled chicken dinner will close the gap.
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="stats-bar fade-up">
        {[
          { num: "1,700+",  label: "Indian foods in database" },
          { num: "5",       label: "Ways to log a meal"       },
          { num: "4-layer", label: "Nutrition engine"         },
          { num: "AI",      label: "Powered personalisation"  },
        ].map(s => (
          <div key={s.label} className="stat-item">
            <div className="stat-number">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── PLATFORM PILLARS ── */}
      <div className="pillars-section" id="platform">
        <div className="pillars-inner fade-up">
          <div className="section-eyebrow">The Platform</div>
          <h2 className="section-title">
            Four layers that work<br />together for you
          </h2>
          <p className="section-sub">
            FoodMood is not a single feature. It is a complete nutrition intelligence platform — from understanding what you eat to automating what you should eat next.
          </p>

          <div className="pillars-grid">
            {[
              {
                icon: "ti-brain",
                bg: "rgba(0,122,255,0.08)",
                iconColor: C.blue,
                phase: "Layer 1",
                title: "AI Food Intelligence",
                desc: "Photo detection, text parsing, barcode scanning, and voice input. FoodMood identifies any food and calculates exact macros — including 1,700+ Indian dishes.",
                tag: "Live now",
                tagClass: "status-live",
              },
              {
                icon: "ti-chart-bar",
                bg: "rgba(48,209,88,0.08)",
                iconColor: C.green,
                phase: "Layer 2",
                title: "Personalised Tracking",
                desc: "TDEE-based calorie targets, macro goals, health scores, and daily AI recommendations — all adjusted to your body, goal, and activity level.",
                tag: "Live now",
                tagClass: "status-live",
              },
              {
                icon: "ti-map-pin",
                bg: "rgba(255,149,0,0.08)",
                iconColor: C.amber,
                phase: "Layer 3",
                title: "Healthy Food Discovery",
                desc: "Find nearby restaurants with full nutrition data on every menu item. Filter by calories, protein, diet type, or allergy. Order and auto-log in one tap.",
                tag: "Live now",
                tagClass: "status-live",
              },
              {
                icon: "ti-refresh",
                bg: "rgba(142,142,147,0.08)",
                iconColor: C.textSub,
                phase: "Layer 4",
                title: "Subscription Meal Plans",
                desc: "Like Calo — but built for India. Auto-generated weekly plans from verified providers, adjusted daily to your macro targets. Pause, swap, or skip anytime.",
                tag: "Coming soon",
                tagClass: "status-soon",
              },
              {
                icon: "ti-shield-check",
                bg: "rgba(0,122,255,0.08)",
                iconColor: C.blue,
                phase: "Layer 5",
                title: "Verified Meals System",
                desc: "Restaurants submit structured recipes. FoodMood calculates macros automatically and awards verification badges — unverified → calculated → verified → premium.",
                tag: "Coming soon",
                tagClass: "status-soon",
              },
              {
                icon: "ti-robot",
                bg: "rgba(48,209,88,0.08)",
                iconColor: C.green,
                phase: "Layer 6",
                title: "Autonomous Nutrition",
                desc: "The long-term vision: FoodMood learns your preferences, schedule, and progress — and automatically plans, orders, and adjusts your nutrition without you having to think about it.",
                tag: "Planned",
                tagClass: "status-planned",
              },
            ].map((p, i) => (
              <div key={p.title} className="pillar-card fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="pillar-icon" style={{ background: p.bg }}>
                  <i className={`ti ${p.icon}`} style={{ fontSize: 20, color: p.iconColor }} aria-hidden="true" />
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.textSub, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>
                  {p.phase}
                </div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
                <div className={`roadmap-status ${p.tagClass}`}>{p.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="how-section" id="how">
        <div className="how-inner fade-up">
          <div className="section-eyebrow">How it works</div>
          <h2 className="section-title">Simple to start.<br />Powerful over time.</h2>

          <div className="how-grid">
            <div className="steps">
              {[
                {
                  n: "1",
                  title: "Tell us about yourself",
                  desc: "Age, weight, height, goal — we calculate your BMI, TDEE, and personalised calorie and macro targets in seconds.",
                },
                {
                  n: "2",
                  title: "Log food any way you want",
                  desc: "Photo, text, barcode, voice, or manual search across 1,700+ Indian and international foods. AI handles identification and portion estimation.",
                },
                {
                  n: "3",
                  title: "Get your health score",
                  desc: "Every meal and every day gets a 0–100 score based on protein, fiber, sugar, and sodium. Like Yuka — but for your full diet, not just one product.",
                },
                {
                  n: "4",
                  title: "Discover and order healthy food",
                  desc: "Find nearby restaurants with full macro data on every dish. Order food that actually fits your goal — not just food that looks healthy.",
                },
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

            {/* Live nutrition demo */}
            <div className="nutrition-demo">
              <div className="demo-header">
                <div className="demo-title">Today's Nutrition</div>
                <div className="demo-date">Sunday, 25 May</div>
              </div>
              <div className="demo-ring-wrap">
                <div className="demo-ring">
                  <div className="demo-ring-inner">
                    <div className="demo-ring-num">73%</div>
                    <div className="demo-ring-lbl">of goal</div>
                  </div>
                </div>
                <div className="demo-ring-info">
                  <div className="demo-ring-cal">1,420</div>
                  <div className="demo-ring-sub">of 1,920 kcal</div>
                  <div className="demo-remaining">500 remaining</div>
                </div>
              </div>
              <div className="demo-bars">
                {[
                  { label: "Protein", pct: 66, color: C.blue,  val: "92 / 140g" },
                  { label: "Carbs",   pct: 76, color: C.green, val: "168 / 220g"},
                  { label: "Fat",     pct: 63, color: C.amber, val: "38 / 60g"  },
                  { label: "Fiber",   pct: 60, color: "#7C3AED",val: "18 / 30g" },
                ].map(m => (
                  <div key={m.label} className="demo-bar-row">
                    <div className="demo-bar-lbl">{m.label}</div>
                    <div className="demo-bar-bg">
                      <div className="demo-bar-fg" style={{ width: `${m.pct}%`, background: m.color }} />
                    </div>
                    <div className="demo-bar-val">{m.val}</div>
                  </div>
                ))}
              </div>

              {/* AI tip */}
              <div style={{
                marginTop: 16, background: "#F0FFF4",
                borderRadius: 12, padding: "12px 14px",
                display: "flex", gap: 10, alignItems: "flex-start",
              }}>
                <i className="ti ti-bulb" style={{ fontSize: 16, color: C.green, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                <div style={{ fontSize: 12, color: "#0F6E56", lineHeight: 1.5 }}>
                  You're 48g short on protein today. A grilled paneer or chicken dinner will close the gap.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── COMPETITOR COMPARISON ── */}
      <div className="compare-section fade-up">
        <div className="compare-inner">
          <div className="section-eyebrow">Why FoodMood</div>
          <h2 className="section-title">What no other app combines</h2>
          <p className="section-sub" style={{ marginBottom: 24 }}>
            MyFitnessPal tracks. Calo delivers. Yuka scans. FoodMood does all three — with AI personalisation built for India.
          </p>

          <div style={{ overflowX: "auto" }}>
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>MyFitnessPal</th>
                  <th>Calo</th>
                  <th>Yuka</th>
                  <th className="highlight">FoodMood</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["AI photo detection",          "✓", "✗", "✗", "✓"],
                  ["Barcode + health score",       "✓", "✗", "✓", "✓"],
                  ["Indian food database",         "Partial","✗","✗","✓"],
                  ["Restaurant macro discovery",   "✗", "✓", "✗", "✓"],
                  ["Subscription meal plans",      "✗", "✓", "✗", "Soon"],
                  ["Verified meals system",        "✗", "✗", "✗", "Soon"],
                  ["Personalised AI coaching",     "✗", "✗", "✗", "✓"],
                  ["Built for India",              "✗", "✗", "✗", "✓"],
                ].map(([feat, mfp, calo, yuka, fm]) => (
                  <tr key={feat}>
                    <td style={{ fontWeight: 500 }}>{feat}</td>
                    <td className="center">{mfp === "✓" ? <span className="check">✓</span> : mfp === "✗" ? <span className="cross">—</span> : <span className="partial">{mfp}</span>}</td>
                    <td className="center">{calo === "✓" ? <span className="check">✓</span> : calo === "✗" ? <span className="cross">—</span> : <span className="partial">{calo}</span>}</td>
                    <td className="center">{yuka === "✓" ? <span className="check">✓</span> : yuka === "✗" ? <span className="cross">—</span> : <span className="partial">{yuka}</span>}</td>
                    <td className="highlight-col">{fm === "✓" ? <span className="check">✓</span> : fm === "✗" ? <span className="cross">—</span> : <span className="partial">{fm}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── ROADMAP ── */}
      <div className="roadmap-section" id="roadmap">
        <div className="roadmap-inner fade-up">
          <div className="section-eyebrow">Roadmap</div>
          <h2 className="section-title">Where FoodMood is going</h2>
          <p className="section-sub">Built in phases — each one adding a new layer of intelligence on top of the last.</p>

          <div className="roadmap-grid">
            {[
              { phase: "Phase 1 — Live",    title: "AI Tracking",             desc: "Photo, text, barcode, voice logging. 1,700+ Indian foods. TDEE-based goals. Health score.",  status: "Live now",    cls: "status-live"    },
              { phase: "Phase 2 — Live",    title: "Personalisation",         desc: "Goal-based macros, allergy warnings, AI daily recommendations, streak tracking.",             status: "Live now",    cls: "status-live"    },
              { phase: "Phase 3 — Live",    title: "Restaurant Discovery",    desc: "Find healthy restaurants, browse nutrition-tagged menus, order and auto-log.",                status: "Live now",    cls: "status-live"    },
              { phase: "Phase 4 — Next",    title: "Supabase + Real Auth",    desc: "Persistent data, real authentication, order history, cross-device sync.",                    status: "In progress", cls: "status-soon"    },
              { phase: "Phase 5 — Soon",    title: "Verified Meals",          desc: "Provider dashboard. Restaurants submit recipes. FoodMood calculates and badges macros.",      status: "Coming soon", cls: "status-soon"    },
              { phase: "Phase 6 — Planned", title: "Subscription Meal Plans", desc: "Weekly plans from verified providers. Auto-adjusted daily. Pause, swap, skip anytime.",      status: "Planned",     cls: "status-planned" },
              { phase: "Phase 7 — Future",  title: "Mobile App",              desc: "React Native (Expo). Native camera. Push notifications. Barcode scanner. Wearable sync.",    status: "Planned",     cls: "status-planned" },
              { phase: "Phase 8 — Future",  title: "Scale for India",         desc: "Hindi/Marathi support. UPI payments. B2B corporate wellness. Regional food database.",       status: "Planned",     cls: "status-planned" },
            ].map((r, i) => (
              <div key={r.title} className="roadmap-card fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="roadmap-phase">{r.phase}</div>
                <h4>{r.title}</h4>
                <p>{r.desc}</p>
                <div className={`roadmap-status ${r.cls}`}>{r.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="cta-section">
        <div className="cta-inner fade-up">
          <h2>
            Start eating with<br />intelligence.
          </h2>
          <p>
            Join FoodMood and experience nutrition tracking built for how India actually eats — powered by AI, not guesswork.
          </p>
          <div className="cta-btns">
            <button className="btn-primary" onClick={() => navigate("/login")}>
              Get started free
            </button>
            <button className="btn-secondary" onClick={() => navigate("/login")}>
              Try demo — no account needed
            </button>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-logo">
          <div className="footer-logo-mark">FM</div>
          FoodMood
        </div>
        <div className="footer-links">
          {["Platform", "How it works", "Roadmap", "Privacy", "Terms", "Contact"].map(l => (
            <a key={l} href="#" className="footer-link">{l}</a>
          ))}
        </div>
        <div className="footer-copy">© 2026 FoodMood. AI Nutrition Platform.</div>
      </footer>
    </>
  );
}