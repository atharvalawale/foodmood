import { useLocation, useNavigate } from "react-router-dom";

const TABS = [
  { path: "/dashboard", emoji: "📊", label: "Home"    },
  { path: "/scanner",   emoji: "📷", label: "Scan"    },
  { path: "/places",    emoji: "📍", label: "Order"   },
  { path: "/profile",   emoji: "👤", label: "Profile" },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show navbar on public pages
  const hide = ["/", "/login", "/onboarding"];
  if (hide.includes(location.pathname)) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Satoshi:wght@500;700&display=swap');

        .navbar {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 70px;
          background: #ffffff;
          border-top: 1px solid #EEEEEE;
          display: flex;
          align-items: center;
          justify-content: space-around;
          z-index: 999;
          padding: 0 8px;
          box-shadow: 0 -4px 24px rgba(0,0,0,0.06);
        }

        .nav-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          flex: 1;
          height: 100%;
          border: none;
          background: none;
          cursor: pointer;
          padding: 8px 0;
          border-radius: 16px;
          transition: all 0.2s;
          font-family: 'Satoshi', sans-serif;
          position: relative;
        }

        .nav-tab:hover {
          background: #F8F8F8;
        }

        .nav-tab.active {
          background: #FFF3B0;
        }

        .nav-emoji {
          font-size: 22px;
          line-height: 1;
          transition: transform 0.2s;
        }

        .nav-tab.active .nav-emoji {
          transform: scale(1.15);
        }

        .nav-label {
          font-size: 10px;
          font-weight: 700;
          color: #999;
          letter-spacing: 0.3px;
        }

        .nav-tab.active .nav-label {
          color: #1A1A1A;
        }

        /* Active indicator dot */
        .nav-dot {
          position: absolute;
          top: 6px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #FFD700;
          display: none;
        }

        .nav-tab.active .nav-dot {
          display: block;
        }
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