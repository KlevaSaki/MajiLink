import './App.css'
import { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2, Droplets } from "lucide-react";
import { useAuthStore } from "./store/useAuthStore";

// Auth pages — kept eager. These are small, and LoginPage ("/") is the
// very first thing anyone sees; lazy-loading the entry route would add
// a network round-trip before the app can render anything at all.
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import ForgotPasswordPage from "./features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/pages/ResetPasswordPage";
import AuthCallbackPage from "./features/auth/pages/AuthCallbackPage";
import RoleSelectPage from "./features/auth/pages/RoleSelectPage";
import ProtectedRoute from "./features/auth/routes/ProtectedRoute";

// Dashboard pages — lazy-loaded. This is the actual fix for the bundle
// size warning: a customer's browser never has to download the vendor
// or driver dashboards' code (and vice versa), since each of these
// becomes its own chunk that only loads when that route is visited.
const CustomerDashboard = lazy(() => import("./features/customer/pages/CustomerHome"));
const VendorDashboard = lazy(() => import("./features/vendor/pages/VendorDashboard"));
const VendorOnboarding = lazy(() => import("./features/vendor/pages/VendorOnboarding"));
const VendorInvite = lazy(() => import("./features/vendor/pages/VendorInvite"));
const DriverDashboard = lazy(() => import("./features/driver/pages/DriverDashboard"));

// Same visual language as ProtectedRoute's own loading state, so a lazy
// chunk downloading doesn't look like a different, unstyled moment in
// the app — just a continuation of the same loading feel.
function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-[#134E4A] flex items-center justify-center">
        <Droplets className="w-6 h-6 text-[#4FD1C5]" />
      </div>
      <Loader2 className="w-5 h-5 text-[#134E4A] animate-spin" />
    </div>
  );
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  // Bootstrap auth session on first load
  useEffect(() => { initialize(); }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoadingFallback />}>
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
          <Route path="/vendor/onboarding" element={
            <ProtectedRoute allowedRoles={["vendor"]}>
              <VendorOnboarding />
            </ProtectedRoute>
          } />
          <Route path="/vendor/invite" element={
            <ProtectedRoute allowedRoles={["vendor"]}>
              <VendorInvite />
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
      </Suspense>
    </BrowserRouter>
  );
}
