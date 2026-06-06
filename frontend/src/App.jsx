import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home       from "./pages/Home";
import Login      from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard  from "./pages/Dashboard";
import Scanner    from "./pages/Scanner";
import Places     from "./pages/Places";
import Profile    from "./pages/Profile";

// ─── Protected Route ──────────────────────────────────────────────────────────
// If user not logged in → redirect to /login
function ProtectedRoute({ children }) {
  const user = localStorage.getItem("foodmood_user");
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
// NOTE: Navbar is built into each page (fixed bottom nav in Dashboard, Scanner,
// Places, Profile). No separate Navbar component needed — removes the duplicate.
export default function App() {
  return (
    <BrowserRouter future={{
      v7_startTransition:   true,   // removes React Router v7 warning 1
      v7_relativeSplatPath: true,   // removes React Router v7 warning 2
    }}>
      <Routes>

        {/* ── Public pages — no auth required ── */}
        <Route path="/"           element={<Home />} />
        <Route path="/login"      element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* ── Protected pages — redirect to /login if not logged in ── */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/scanner" element={
          <ProtectedRoute><Scanner /></ProtectedRoute>
        } />
        <Route path="/places" element={
          <ProtectedRoute><Places /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />

        {/* ── Fallback — unknown routes go to home ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}