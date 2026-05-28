import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Droplets, Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { supabase } from "../../../lib/supabase";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "One number", test: (pw: string) => /\d/.test(pw) },
];

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { resetPassword, isLoading, error, clearError } = useAuthStore();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase sends a RECOVERY event after the magic link is clicked;
  // we must wait for it before calling updateUser
  useEffect(() => {
    clearError();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const strength: "weak" | "fair" | "strong" =
    passed < 2 ? "weak" : passed < 3 ? "fair" : "strong";

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!password) errs.password = "Password is required";
    else if (strength !== "strong") errs.password = "Password must meet all requirements";
    if (!confirm) errs.confirm = "Please confirm your password";
    else if (password !== confirm) errs.confirm = "Passwords do not match";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const { error } = await resetPassword(password);
    if (!error) setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-[#D6D3D1] p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#E1F5EE] flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-[#0F6E56]" />
          </div>
          <h2 className="text-2xl font-bold text-[#134E4A] mb-2">Password updated</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your password has been reset successfully. Sign in with your new password.
          </p>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-[#134E4A] text-white rounded-2xl py-3 font-semibold text-sm hover:opacity-90 transition"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-11 h-11 rounded-2xl bg-[#134E4A] flex items-center justify-center">
            <Droplets className="w-6 h-6 text-[#4FD1C5]" />
          </div>
          <h1 className="text-xl font-bold text-[#134E4A]">MajiLink</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-[#D6D3D1] p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#134E4A] mb-1">Set new password</h2>
            <p className="text-gray-500 text-sm">Choose a strong password for your account.</p>
          </div>

          {!sessionReady && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-2xl px-4 py-3">
              Waiting for your reset link to be verified…
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((f) => ({ ...f, password: "" })); }}
                  placeholder="Create a strong password"
                  className={`w-full rounded-2xl border px-4 py-3 pr-11 bg-[#FAFAF8] text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1C5] transition ${
                    fieldErrors.password ? "border-red-400" : "border-[#D6D3D1]"
                  }`}
                />
                <button type="button" onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2 space-y-1">
                  {PASSWORD_RULES.map((rule) => (
                    <div key={rule.label} className="flex items-center gap-1.5">
                      {rule.test(password)
                        ? <Check className="w-3 h-3 text-[#0F6E56]" />
                        : <X className="w-3 h-3 text-gray-300" />}
                      <span className={`text-xs ${rule.test(password) ? "text-[#0F6E56]" : "text-gray-400"}`}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setFieldErrors((f) => ({ ...f, confirm: "" })); }}
                  placeholder="Re-enter your password"
                  className={`w-full rounded-2xl border px-4 py-3 pr-11 bg-[#FAFAF8] text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1C5] transition ${
                    fieldErrors.confirm ? "border-red-400" : "border-[#D6D3D1]"
                  }`}
                />
                <button type="button" onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirm && password === confirm && (
                <p className="text-xs text-[#0F6E56] mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Passwords match
                </p>
              )}
              {fieldErrors.confirm && <p className="text-xs text-red-500 mt-1">{fieldErrors.confirm}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading || !sessionReady}
              className="w-full bg-[#134E4A] hover:opacity-90 transition text-white rounded-2xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isLoading ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
