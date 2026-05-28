import { useState } from "react";
import { Link } from "react-router-dom";
import { Droplets, Loader2, ArrowLeft, Check } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";

export default function ForgotPasswordPage() {
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setFieldError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setFieldError("Enter a valid email address"); return; }
    clearError();

    const { error } = await forgotPassword(email.trim());
    if (!error) setSent(true);
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-[#D6D3D1] p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#E1F5EE] flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-[#0F6E56]" />
          </div>
          <h2 className="text-2xl font-bold text-[#134E4A] mb-2">Reset link sent</h2>
          <p className="text-gray-500 text-sm mb-1">We sent a password reset link to</p>
          <p className="font-semibold text-gray-800 mb-4">{email}</p>
          <p className="text-gray-500 text-sm mb-6">
            Open the email and click the link. It expires in 1 hour.
          </p>
          <Link
            to="/"
            className="block w-full bg-[#134E4A] text-white rounded-2xl py-3 font-semibold text-sm hover:opacity-90 transition text-center"
          >
            Back to sign in
          </Link>
          <button
            onClick={() => setSent(false)}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700 w-full py-1"
          >
            Try a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-11 h-11 rounded-2xl bg-[#134E4A] flex items-center justify-center">
            <Droplets className="w-6 h-6 text-[#4FD1C5]" />
          </div>
          <h1 className="text-xl font-bold text-[#134E4A]">MajiLink</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-[#D6D3D1] p-8">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 w-fit"
          >
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#134E4A] mb-1">Forgot password?</h2>
            <p className="text-gray-500 text-sm">
              No worries — enter your email and we'll send a reset link.
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldError(""); }}
                placeholder="you@example.com"
                className={`w-full rounded-2xl border px-4 py-3 bg-[#FAFAF8] text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1C5] transition ${
                  fieldError ? "border-red-400" : "border-[#D6D3D1]"
                }`}
              />
              {fieldError && <p className="text-xs text-red-500 mt-1">{fieldError}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#134E4A] hover:opacity-90 transition text-white rounded-2xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isLoading ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Remembered it?{" "}
            <Link to="/" className="text-[#134E4A] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
