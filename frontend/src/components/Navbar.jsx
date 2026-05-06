import { useLocation, useNavigate } from "react-router-dom";

const TABS = [
  { path:"/dashboard", emoji:"🏠", label:"Home"    },
  { path:"/scanner",   emoji:"📷", label:"Scan"    },
  { path:"/places",    emoji:"🍽️", label:"Order"   },
  { path:"/profile",   emoji:"👤", label:"Profile" },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const hide = ["/", "/login", "/onboarding"];
  if (hide.includes(location.pathname)) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@600;700;800&display=swap');
        .navbar {
          position: fixed; bottom: 0; left: 0; right: 0;
          height: 72px;
          background: rgba(0,0,0,0.92);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-around;
          z-index: 999; padding: 0 8px 8px;
        }
        .nav-tab {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 4px; flex: 1; height: 100%;
          border: none; background: none; cursor: pointer;
          padding: 8px 0; border-radius: 14px;
          transition: all 0.2s; font-family: 'DM Sans', system-ui;
          position: relative;
        }
        .nav-tab:hover { background: rgba(255,255,255,0.04); }
        .nav-tab.active { background: rgba(167,139,250,0.08); }
        .nav-emoji { font-size: 21px; line-height: 1; transition: transform 0.2s; }
        .nav-tab.active .nav-emoji { transform: scale(1.12); }
        .nav-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.2); letter-spacing: 0.3px; }
        .nav-tab.active .nav-label { color: #A78BFA; }
        .nav-dot {
          position: absolute; top: 7px;
          width: 4px; height: 4px; border-radius: 50%;
          background: #A78BFA; display: none;
          box-shadow: 0 0 6px #A78BFA;
        }
        .nav-tab.active .nav-dot { display: block; }
      `}</style>

      <nav className="navbar">
        {TABS.map(tab => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              className={`nav-tab ${isActive ? "active" : ""}`}
              onClick={() => navigate(tab.path)}
            >
              <div className="nav-dot" />
              <span className="nav-emoji">{tab.emoji}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}