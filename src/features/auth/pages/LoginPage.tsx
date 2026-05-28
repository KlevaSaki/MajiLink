import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Droplets, Eye, EyeOff, Loader2, Phone } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";

type Tab = "email" | "phone";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, signInWithPhone, verifyPhoneOtp, isLoading, error, clearError, profile } =
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
      navigate(profile.role === "vendor" ? "/vendor" : profile.role === "driver" ? "/driver" : "/customer");
    }
  }, [profile, navigate]);

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
    // Browser redirects to Google — nothing to do here
  }

  function getRedirectPath() {
    const p = useAuthStore.getState().profile;
    if (!p) return "/role-select";
    return p.role === "vendor" ? "/vendor" : p.role === "driver" ? "/driver" : "/customer";
  }

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex flex-1 bg-[#134E4A] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent_40%)]" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#4FD1C5] flex items-center justify-center shadow-lg">
            <Droplets className="w-6 h-6 text-[#134E4A]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">MajiLink</h1>
            <p className="text-sm text-gray-200">Water delivered instantly.</p>
          </div>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-5xl font-bold leading-tight mb-6">
            Clean water.<br />Delivered simply.
          </h2>
          <p className="text-lg text-gray-200 leading-relaxed">
            Connecting households, vendors, and delivery partners
            through one seamless water logistics platform.
          </p>
        </div>
        <div className="relative z-10 text-sm text-gray-300">
          Trusted water logistics infrastructure.
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-12 h-12 rounded-2xl bg-[#134E4A] flex items-center justify-center shadow-md">
              <Droplets className="w-6 h-6 text-[#4FD1C5]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#134E4A]">MajiLink</h1>
              <p className="text-sm text-gray-500">Water delivered instantly.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-[#D6D3D1] p-8">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-[#134E4A] mb-1">Welcome back</h2>
              <p className="text-gray-500 text-sm">Sign in to continue to MajiLink.</p>
            </div>

            {/* ── Tab switcher ── */}
            <div className="flex bg-[#FAFAF8] rounded-2xl p-1 mb-6 border border-[#D6D3D1]">
              {(["email", "phone"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setFieldErrors({}); clearError(); }}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
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
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">
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
                    className={`w-full rounded-2xl border px-4 py-3 bg-[#FAFAF8] text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1C5] transition ${
                      fieldErrors.email ? "border-red-400" : "border-[#D6D3D1]"
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
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
                      className={`w-full rounded-2xl border px-4 py-3 pr-11 bg-[#FAFAF8] text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1C5] transition ${
                        fieldErrors.password ? "border-red-400" : "border-[#D6D3D1]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#134E4A]"
                    />
                    Remember me
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-[#134E4A] font-medium hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#134E4A] hover:opacity-90 transition text-white rounded-2xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isLoading ? "Signing in…" : "Sign in"}
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
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400 border-r border-[#D6D3D1] pr-2">+254</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setFieldErrors((f) => ({ ...f, phone: "" })); }}
                      placeholder="712 345 678"
                      disabled={otpSent}
                      className={`w-full rounded-2xl border pl-20 pr-4 py-3 bg-[#FAFAF8] text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1C5] transition disabled:opacity-60 ${
                        fieldErrors.phone ? "border-red-400" : "border-[#D6D3D1]"
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>
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
                      className={`w-full rounded-2xl border px-4 py-3 bg-[#FAFAF8] text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#4FD1C5] transition ${
                        fieldErrors.otp ? "border-red-400" : "border-[#D6D3D1]"
                      }`}
                    />
                    {fieldErrors.otp && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.otp}</p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-400">
                        Code sent to {phone}
                      </p>
                      <button
                        type="button"
                        disabled={otpResendTimer > 0}
                        onClick={handleSendOtp as unknown as React.MouseEventHandler}
                        className="text-xs text-[#134E4A] font-medium disabled:text-gray-400"
                      >
                        {otpResendTimer > 0 ? `Resend in ${otpResendTimer}s` : "Resend code"}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#134E4A] hover:opacity-90 transition text-white rounded-2xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isLoading ? "Please wait…" : otpSent ? "Verify code" : "Send OTP"}
                </button>

                {otpSent && (
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(""); setOtpResendTimer(0); }}
                    className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
                  >
                    ← Use a different number
                  </button>
                )}
              </form>
            )}

            {/* ── Divider ── */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[#D6D3D1]" />
              <span className="text-xs text-gray-400">or continue with</span>
              <div className="flex-1 h-px bg-[#D6D3D1]" />
            </div>

            {/* ── Google OAuth ── */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 border border-[#D6D3D1] rounded-2xl py-3 text-sm font-medium text-gray-700 hover:bg-[#FAFAF8] transition disabled:opacity-60"
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
            <p className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-[#134E4A] font-semibold hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
