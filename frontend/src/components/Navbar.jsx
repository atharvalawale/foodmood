import { useLocation, useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────
// COLOUR TOKENS — same as all other pages
// ─────────────────────────────────────────────
const C = {
  surface:  "#FFFFFF",
  text:     "#1C1C1E",
  textSub:  "#8E8E93",
  sep:      "#E5E5EA",
  accent:   "#1C1C1E",
};

const TABS = [
  { path: "/dashboard", icon: "ti-home",    label: "Home"    },
  { path: "/scanner",   icon: "ti-scan",    label: "Scan"    },
  { path: "/places",    icon: "ti-map-pin", label: "Order"   },
  { path: "/profile",   icon: "ti-user",    label: "Profile" },
];

// Hide navbar on public pages — unchanged from original
const HIDE_ON = ["/", "/login", "/onboarding"];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  if (HIDE_ON.includes(location.pathname)) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        .navbar {
          position: fixed; bottom: 0; left: 0; right: 0;
          height: 66px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 0.5px solid ${C.sep};
          display: flex; align-items: center;
          justify-content: space-around;
          z-index: 999;
          padding: 0 8px;
          padding-bottom: env(safe-area-inset-bottom);
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .nav-tab {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 3px; flex: 1; height: 100%;
          border: none; background: none;
          cursor: pointer; padding: 8px 0;
          border-radius: 12px;
          transition: background 0.15s;
          position: relative;
          -webkit-tap-highlight-color: transparent;
        }

        .nav-tab:hover { background: rgba(0,0,0,0.03); }
        .nav-tab:active { background: rgba(0,0,0,0.06); }

        .nav-tab i {
          font-size: 22px;
          color: ${C.textSub};
          transition: color 0.15s, transform 0.15s;
          line-height: 1;
        }

        .nav-tab.active i {
          color: ${C.accent};
          transform: scale(1.05);
        }

        .nav-label {
          font-size: 9px;
          font-weight: 500;
          color: ${C.textSub};
          letter-spacing: 0.3px;
          transition: color 0.15s;
          line-height: 1;
        }

        .nav-tab.active .nav-label {
          color: ${C.accent};
          font-weight: 600;
        }

        /* Active indicator dot */
        .nav-dot {
          position: absolute;
          bottom: 6px;
          width: 4px; height: 4px;
          border-radius: 50%;
          background: ${C.accent};
          opacity: 0;
          transition: opacity 0.15s;
        }

        .nav-tab.active .nav-dot { opacity: 1; }
      `}</style>

      <nav className="navbar">
        {TABS.map(tab => {
          const isActive = location.pathname === tab.path ||
            // Scanner active on any /scanner route including ?slot= params
            (tab.path === "/scanner" && location.pathname.startsWith("/scanner"));
          return (
            <button
              key={tab.path}
              className={`nav-tab ${isActive ? "active" : ""}`}
              onClick={() => navigate(tab.path)}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <i className={`ti ${tab.icon}`} aria-hidden="true" />
              <span className="nav-label">{tab.label}</span>
              <div className="nav-dot" />
            </button>
          );
        })}
      </nav>
    </>
  );
}