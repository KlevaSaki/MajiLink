import { Link } from "react-router-dom";
import { Droplets } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex">
      {/* Left Branding Section */}
      <div className="hidden lg:flex flex-1 bg-[#134E4A] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent_40%)]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#4FD1C5] flex items-center justify-center shadow-lg">
            <Droplets className="w-6 h-6 text-[#134E4A]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              MajiLink
            </h1>

            <p className="text-sm text-gray-200">
              Fresh Water delivered instantly.
            </p>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-md">
          <h2 className="text-5xl font-bold leading-tight mb-6">
            Join the future
            <br />
            of water logistics.
          </h2>

          <p className="text-lg text-gray-200 leading-relaxed">
            Order clean water, supply customers, or deliver
            seamlessly through one connected platform.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-sm text-gray-300">
          Reliable water logistics infrastructure.
        </div>
      </div>

      {/* Right Register Section */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-12 h-12 rounded-2xl bg-[#134E4A] flex items-center justify-center shadow-md">
              <Droplets className="w-6 h-6 text-[#4FD1C5]" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#134E4A]">
                MajiLink
              </h1>

              <p className="text-sm text-gray-500">
                Water delivered instantly.
              </p>
            </div>
          </div>

          {/* Register Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-[#D6D3D1] p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-[#134E4A] mb-2">
                Create Account
              </h2>

              <p className="text-gray-500">
                Get started with MajiLink today.
              </p>
            </div>

            <form className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>

                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full rounded-2xl border border-[#D6D3D1] px-4 py-3 bg-[#FAFAF8] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>

                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-2xl border border-[#D6D3D1] px-4 py-3 bg-[#FAFAF8] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>

                <input
                  type="tel"
                  placeholder="e.g. +254712345678"
                  className="w-full rounded-2xl border border-[#D6D3D1] px-4 py-3 bg-[#FAFAF8] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Create a password"
                  className="w-full rounded-2xl border border-[#D6D3D1] px-4 py-3 bg-[#FAFAF8] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>

                <input
                  type="password"
                  placeholder="Confirm your password"
                  className="w-full rounded-2xl border border-[#D6D3D1] px-4 py-3 bg-[#FAFAF8] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]"
                />
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="mt-1 rounded"
                />

                <p>
                  I agree to the{" "}
                  <button
                    type="button"
                    className="text-[#134E4A] font-medium hover:underline"
                  >
                    Terms & Conditions
                  </button>
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-[#134E4A] hover:opacity-90 transition text-white rounded-2xl py-3 font-semibold shadow-md"
              >
                Create Account
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/"
                className="text-[#134E4A] font-semibold hover:underline"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}