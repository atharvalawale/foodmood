import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home              from "./pages/Home";
import Login             from "./pages/Login";
import Onboarding        from "./pages/Onboarding";
import Dashboard         from "./pages/Dashboard";
import Scanner           from "./pages/Scanner";
import Places            from "./pages/Places";
import Profile           from "./pages/Profile";
import MealPlan          from "./pages/MealPlan";
import ProviderDashboard from "./pages/ProviderDashboard";
import Navbar            from "./components/Navbar";

function ProtectedRoute({ children }) {
  const user = localStorage.getItem("foodmood_user");
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public */}
        <Route path="/"           element={<Home />} />
        <Route path="/login"      element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Protected */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/scanner"   element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
        <Route path="/places"    element={<ProtectedRoute><Places /></ProtectedRoute>} />
        <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/meal-plan" element={<ProtectedRoute><MealPlan /></ProtectedRoute>} />
        <Route path="/provider"  element={<ProtectedRoute><ProviderDashboard /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Navbar />
    </BrowserRouter>
  );
}