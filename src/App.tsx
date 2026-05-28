import './App.css'
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";

// Auth pages
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import ForgotPasswordPage from "./features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/pages/ResetPasswordPage";
import AuthCallbackPage from "./features/auth/pages/AuthCallbackPage";
import RoleSelectPage from "./features/auth/pages/RoleSelectPage";
import ProtectedRoute from "./features/auth/routes/ProtectedRoute";

// Dashboard pages (your existing components)
import CustomerDashboard from "./features/customer/pages/CustomerHome";
import VendorDashboard from "./features/vendor/pages/VendorDashboard";
import DriverDashboard from "./features/driver/pages/DriverDashboard";

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  // Bootstrap auth session on first load
  useEffect(() => { initialize(); }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public routes ── */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/role-select" element={<RoleSelectPage />} />

        {/* ── Protected routes ── */}
        <Route path="/customer" element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/vendor" element={
          <ProtectedRoute allowedRoles={["vendor"]}>
            <VendorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/driver" element={
          <ProtectedRoute allowedRoles={["driver"]}>
            <DriverDashboard />
          </ProtectedRoute>
        } />

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
