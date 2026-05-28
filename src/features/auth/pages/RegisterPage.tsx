import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Droplets, Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";

// ── Password strength checker ─────────────────────────────────────────────────
interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One number", test: (pw) => /\d/.test(pw) },
];

function passwordStrength(pw: string): "weak" | "fair" | "strong" {
  const passed = PASSWORD_RULES.filter((r) => r.test(pw)).length;
  if (passed < 2) return "weak";
  if (passed < 3) return "fair";
  return "strong";
}

const STRENGTH_CONFIG = {
  weak: { label: "Weak", color: "bg-red-400", width: "w-1/3" },
  fair: { label: "Fair", color: "bg-yellow-400", width: "w-2/3" },
  strong: { label: "Strong", color: "bg-[#4FD1C5]", width: "w-full" },
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, isLoading, error, clearError, profile } = useAuthStore();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreed: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const strength = form.password ? passwordStrength(form.password) : null;

  useEffect(() => {
    if (profile) navigate("/role-select");
  }, [profile, navigate]);

  useEffect(() => { clearError(); }, []);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
      setFieldErrors((f) => ({ ...f, [field]: "" }));
    };
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!form.name.trim()) errs.name = "Full name is required";
    else if (form.name.trim().split(" ").length < 2)
      errs.name = "Enter your first and last name";

    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email";

    if (!form.phone.trim()) errs.phone = "Phone number is required";
    else if (!/^(\+254|254|0)[17]\d{8}$/.test(form.phone.replace(/\s/g, "")))
      errs.phone = "Enter a valid Kenyan number (e.g. 0712 345 678)";

    if (!form.password) errs.password = "Password is required";
    else if (strength !== "strong") errs.password = "Password must meet all requirements";

    if (!form.confirmPassword) errs.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords do not match";

    if (!form.agreed) errs.agreed = "You must agree to the terms";

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const { error } = await signUp({
      email: form.email.trim(),
      password: form.password,
      name: form.name.trim(),
      phone: form.phone.trim(),
    });

    if (!error) {
      setSubmitted(true);
    }
  }

  async function handleGoogle() {
    await signInWithGoogle();
  }

  // ── Post-signup: email verification notice ────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-[#D6D3D1] p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#E1F5EE] flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-[#0F6E56]" />
          </div>
          <h2 className="text-2xl font-bold text-[#134E4A] mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm mb-1">
            We sent a verification link to
          </p>
          <p className="font-semibold text-gray-800 mb-4">{form.email}</p>
          <p className="text-gray-500 text-sm mb-6">
            Click the link in the email to verify your account, then come back to sign in.
          </p>
          <Link
            to="/"
            className="block w-full bg-[#134E4A] text-white rounded-2xl py-3 font-semibold text-sm hover:opacity-90 transition"
          >
            Back to sign in
          </Link>
          <p className="text-xs text-gray-400 mt-4">
            Didn't receive it? Check your spam folder or{" "}
            <button
              onClick={() => setSubmitted(false)}
              className="text-[#134E4A] font-medium hover:underline"
            >
              try again
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Main register form ────────────────────────────────────────────────────
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
            <p className="text-sm text-gray-200">Fresh water delivered instantly.</p>
          </div>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-5xl font-bold leading-tight mb-6">
            Join the future<br />of water logistics.
          </h2>
          <p className="text-lg text-gray-200 leading-relaxed">
            Order clean water, supply customers, or deliver
            seamlessly through one connected platform.
          </p>
        </div>
        <div className="relative z-10 text-sm text-gray-300">
          Reliable water logistics infrastructure.
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-8">

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
              <h2 className="text-3xl font-bold text-[#134E4A] mb-1">Create account</h2>
              <p className="text-gray-500 text-sm">Get started with MajiLink today.</p>
            </div>

            {/* Global error */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 flex items-start gap-2">
                <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Full name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                <input
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={update("name")}
                  placeholder="Jane Muthoni"
                  className={`w-full rounded-2xl border px-4 py-3 bg-[#FAFAF8] text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1C5] transition ${
                    fieldErrors.name ? "border-red-400" : "border-[#D6D3D1]"
                  }`}
                />
                {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={update("email")}
                  placeholder="you@example.com"
                  className={`w-full rounded-2xl border px-4 py-3 bg-[#FAFAF8] text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1C5] transition ${
                    fieldErrors.email ? "border-red-400" : "border-[#D6D3D1]"
                  }`}
                />
                {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 border-r border-[#D6D3D1] pr-3">
                    +254
                  </span>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={update("phone")}
                    placeholder="712 345 678"
                    className={`w-full rounded-2xl border pl-16 pr-4 py-3 bg-[#FAFAF8] text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1C5] transition ${
                      fieldErrors.phone ? "border-red-400" : "border-[#D6D3D1]"
                    }`}
                  />
                </div>
                {fieldErrors.phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={update("password")}
                    placeholder="Create a strong password"
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

                {/* Strength bar */}
                {form.password && strength && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#E8E6E0] rounded-full overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all ${STRENGTH_CONFIG[strength].color} ${STRENGTH_CONFIG[strength].width}`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        strength === "weak" ? "text-red-500"
                        : strength === "fair" ? "text-yellow-600"
                        : "text-[#0F6E56]"
                      }`}>
                        {STRENGTH_CONFIG[strength].label}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {PASSWORD_RULES.map((rule) => (
                        <div key={rule.label} className="flex items-center gap-1.5">
                          {rule.test(form.password) ? (
                            <Check className="w-3 h-3 text-[#0F6E56]" />
                          ) : (
                            <X className="w-3 h-3 text-gray-300" />
                          )}
                          <span className={`text-xs ${rule.test(form.password) ? "text-[#0F6E56]" : "text-gray-400"}`}>
                            {rule.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={update("confirmPassword")}
                    placeholder="Re-enter your password"
                    className={`w-full rounded-2xl border px-4 py-3 pr-11 bg-[#FAFAF8] text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1C5] transition ${
                      fieldErrors.confirmPassword ? "border-red-400" : "border-[#D6D3D1]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <p className="text-xs text-[#0F6E56] mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Passwords match
                  </p>
                )}
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {/* Terms */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.agreed}
                    onChange={update("agreed")}
                    className="mt-0.5 w-4 h-4 rounded accent-[#134E4A]"
                  />
                  <span className="text-sm text-gray-600">
                    I agree to MajiLink's{" "}
                    <button type="button" className="text-[#134E4A] font-medium hover:underline">
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button type="button" className="text-[#134E4A] font-medium hover:underline">
                      Privacy Policy
                    </button>
                  </span>
                </label>
                {fieldErrors.agreed && <p className="text-xs text-red-500 mt-1">{fieldErrors.agreed}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#134E4A] hover:opacity-90 transition text-white rounded-2xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isLoading ? "Creating account…" : "Create account"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[#D6D3D1]" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-[#D6D3D1]" />
            </div>

            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 border border-[#D6D3D1] rounded-2xl py-3 text-sm font-medium text-gray-700 hover:bg-[#FAFAF8] transition disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/" className="text-[#134E4A] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
