import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home       from "./pages/Home";
import Login      from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard  from "./pages/Dashboard";
import Scanner    from "./pages/Scanner";
import Places     from "./pages/Places";
import Profile    from "./pages/Profile";
import Navbar     from "./components/Navbar";

// ─── Protected Route ──────────────────────────────────────────────────────────
// If user not logged in → redirect to /login
function ProtectedRoute({ children }) {
  const user = localStorage.getItem("foodmood_user");
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ─── App Shell — shows Navbar only on app pages, not on Home/Login/Onboarding
function AppShell({ children }) {
  return (
    <div style={{ paddingBottom: 70 }}>
      {children}
      <Navbar />
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages — no navbar */}
        <Route path="/"           element={<Home />} />
        <Route path="/login"      element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Protected pages — with bottom navbar */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppShell><Dashboard /></AppShell>
          </ProtectedRoute>
        } />
        <Route path="/scanner" element={
          <ProtectedRoute>
            <AppShell><Scanner /></AppShell>
          </ProtectedRoute>
        } />
        <Route path="/places" element={
          <ProtectedRoute>
            <AppShell><Places /></AppShell>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <AppShell><Profile /></AppShell>
          </ProtectedRoute>
        } />

        {/* Fallback — redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}