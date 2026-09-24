import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Droplets, Eye, EyeOff, Loader2, Phone } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";

type Tab = "email" | "phone";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, signInWithPhone, verifyPhoneOtp, isLoading, error, clearError, profile, pendingRoleSelection } =
    useAuthStore();

  const [tab, setTab] = useState<Tab>("email");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Email form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone OTP form
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);

  // Field-level errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Redirect if already logged in
  useEffect(() => {
    if (profile) {
      if (pendingRoleSelection) navigate("/role-select");
      else if (profile.role === "vendor") navigate("/vendor");
      else if (profile.role === "driver") navigate("/driver");
      else navigate("/customer");
    }
  }, [profile, navigate, pendingRoleSelection]);

  // OTP resend countdown
  useEffect(() => {
    if (otpResendTimer <= 0) return;
    const t = setTimeout(() => setOtpResendTimer((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [otpResendTimer]);

  useEffect(() => { clearError(); }, [tab]);

  // ── Validation ─────────────────────────────────────────────────────────────
  function validateEmail(): boolean {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validatePhone(): boolean {
    const errs: Record<string, string> = {};
    if (!phone.trim()) errs.phone = "Phone number is required";
    else if (!/^(\+254|254|0)[17]\d{8}$/.test(phone.replace(/\s/g, "")))
      errs.phone = "Enter a valid Kenyan number (e.g. 0712 345 678)";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEmail()) return;
    const { error } = await signIn({ email, password, rememberMe });
    if (!error) navigate(getRedirectPath());
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!validatePhone()) return;
    const { error } = await signInWithPhone(phone);
    if (!error) { setOtpSent(true); setOtpResendTimer(60); }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) { setFieldErrors({ otp: "Enter the 6-digit code" }); return; }
    const { error } = await verifyPhoneOtp(phone, otp);
    if (!error) navigate(getRedirectPath());
  }

  async function handleGoogleLogin() {
    await signInWithGoogle();
  }

  function getRedirectPath() {
    const s = useAuthStore.getState();
    if (!s.profile) return "/role-select";
    if (s.pendingRoleSelection) return "/role-select";
    if (s.profile.role === "vendor") return "/vendor";
    if (s.profile.role === "driver") return "/driver";
    return "/customer";
  }

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-[#FAFAF8] via-[#F5F2EF] to-[#EFECE8] flex">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex flex-1 bg-[#134E4A] text-white p-8 xl:p-10 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left, rgba(79,209,197,0.15), transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right, rgba(255,255,255,0.06), transparent_40%)]" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4FD1C5] to-[#3BB8AC] flex items-center justify-center shadow-lg shadow-[#4FD1C5]/20">
            <Droplets className="w-6 h-6 text-[#134E4A]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">MajiLink</h1>
            <p className="text-sm text-white/70">Water delivered instantly.</p>
          </div>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
            Clean water.<br />Delivered simply.
          </h2>
          <p className="text-base xl:text-lg text-white/70 leading-relaxed max-w-sm">
            Connecting households, vendors, and delivery partners
            through one seamless water logistics platform.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-sm text-white/50">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4FD1C5]" />
          Trusted water logistics infrastructure
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-10">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#134E4A] to-[#0D3633] flex items-center justify-center shadow-md">
              <Droplets className="w-5 h-5 text-[#4FD1C5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#134E4A]">MajiLink</h1>
              <p className="text-xs text-gray-400">Water delivered instantly.</p>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] border border-[#D6D3D1]/50 p-5 sm:p-6 lg:p-7 transition-shadow duration-300">
            <div className="mb-5">
              <h2 className="text-2xl xl:text-3xl font-bold text-[#134E4A] mb-1">Welcome back</h2>
              <p className="text-gray-500 text-sm">Sign in to continue to MajiLink.</p>
            </div>

            {/* ── Tab switcher ── */}
            <div className="flex bg-[#FAFAF8] rounded-2xl p-1 mb-5 border border-[#D6D3D1]/40">
              {(["email", "phone"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setFieldErrors({}); clearError(); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    tab === t
                      ? "bg-[#134E4A] text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t === "email" ? "Email" : "Phone / OTP"}
                </button>
              ))}
            </div>

            {/* ── Global error ── */}
            {error && (
              <div className="mb-4 bg-red-50/80 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">
                {error}
              </div>
            )}

            {/* ── Email form ── */}
            {tab === "email" && (
              <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setFieldErrors((f) => ({ ...f, email: "" })); }}
                    placeholder="you@example.com"
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]/40 focus:border-[#4FD1C5] transition-all duration-200 ${
                      fieldErrors.email ? "border-red-400" : "border-[#D6D3D1] hover:border-gray-300"
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500" />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setFieldErrors((f) => ({ ...f, password: "" })); }}
                      placeholder="Enter your password"
                      className={`w-full rounded-xl border bg-white px-4 py-3 pr-11 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]/40 focus:border-[#4FD1C5] transition-all duration-200 ${
                        fieldErrors.password ? "border-red-400" : "border-[#D6D3D1] hover:border-gray-300"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500" />
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-[#134E4A] focus:ring-[#134E4A]/30 focus:ring-offset-0 transition"
                    />
                    Remember me
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-[#134E4A] font-medium hover:text-[#0D3633] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#134E4A] hover:bg-[#0D3633] active:scale-[0.98] transition-all duration-200 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm hover:shadow-md"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isLoading ? "Signing in\u2026" : "Sign in"}
                </button>
              </form>
            )}

            {/* ── Phone / OTP form ── */}
            {tab === "phone" && (
              <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4" noValidate>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    M-Pesa / Phone number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400 border-r border-[#D6D3D1] pr-2">+254</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setFieldErrors((f) => ({ ...f, phone: "" })); }}
                      placeholder="712 345 678"
                      disabled={otpSent}
                      className={`w-full rounded-xl border bg-white pl-20 pr-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]/40 focus:border-[#4FD1C5] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                        fieldErrors.phone ? "border-red-400" : "border-[#D6D3D1] hover:border-gray-300"
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500" />
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>

                {otpSent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      6-digit code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setFieldErrors((f) => ({ ...f, otp: "" })); }}
                      placeholder="_ _ _ _ _ _"
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm tracking-[0.5em] text-center focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]/40 focus:border-[#4FD1C5] transition-all duration-200 ${
                        fieldErrors.otp ? "border-red-400" : "border-[#D6D3D1] hover:border-gray-300"
                      }`}
                    />
                    {fieldErrors.otp && (
                      <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-500" />
                        {fieldErrors.otp}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-xs text-gray-400">
                        Code sent to {phone}
                      </p>
                      <button
                        type="button"
                        disabled={otpResendTimer > 0}
                        onClick={handleSendOtp as unknown as React.MouseEventHandler}
                        className="text-xs text-[#134E4A] font-medium hover:text-[#0D3633] transition-colors disabled:text-gray-400 disabled:hover:text-gray-400"
                      >
                        {otpResendTimer > 0 ? `Resend in ${otpResendTimer}s` : "Resend code"}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#134E4A] hover:bg-[#0D3633] active:scale-[0.98] transition-all duration-200 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm hover:shadow-md"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isLoading ? "Please wait\u2026" : otpSent ? "Verify code" : "Send OTP"}
                </button>

                {otpSent && (
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(""); setOtpResendTimer(0); }}
                    className="w-full text-sm text-gray-500 hover:text-gray-700 py-1 transition-colors"
                  >
                    \u2190 Use a different number
                  </button>
                )}
              </form>
            )}

            {/* ── Divider ── */}
            <div className="flex items-center gap-4 my-5">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D6D3D1] to-transparent" />
              <span className="text-xs text-gray-400 font-medium">or continue with</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D6D3D1] to-transparent" />
            </div>

            {/* ── Google OAuth ── */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 border border-[#D6D3D1] rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:shadow-sm hover:border-gray-300 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* ── Footer ── */}
            <p className="mt-5 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-[#134E4A] font-semibold hover:text-[#0D3633] transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
