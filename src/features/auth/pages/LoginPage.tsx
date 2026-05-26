import { Link } from "react-router-dom";
import { Droplets } from "lucide-react";



export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex">
      {/* Left Branding Section */}
      <div className="hidden lg:flex flex-1 bg-[#134E4A] text-black p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent_40%)]" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#4FD1C5] flex items-center justify-center shadow-lg">
            <Droplets className="w-6 h-6 text-[#134E4A]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              MajiLink
            </h1>
            <p className="text-sm text-gray-200">
              Water delivered instantly.
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-5xl font-bold leading-tight mb-6">
            Clean water.
            <br />
            Delivered simply.
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

      {/* Right Login Section */}
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

          <div className="bg-white rounded-3xl shadow-sm border border-[#D6D3D1] p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-[#134E4A] mb-2">
                Welcome Back
              </h2>

              <p className="text-gray-500">
                Sign in to continue to MajiLink.
              </p>
            </div>

            <form className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email or Phone Number
                </label>

                <input
                  type="text"
                  placeholder="Enter your email or phone"
                  className="w-full rounded-2xl border border-[#D6D3D1] px-4 py-3 bg-[#FAFAF8] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-[#D6D3D1] px-4 py-3 bg-[#FAFAF8] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-600">
                  <input type="checkbox" className="rounded" />
                  Remember me
                </label>

                <button
                  type="button"
                  className="text-[#134E4A] font-medium hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-[#134E4A] hover:opacity-90 transition text-white rounded-2xl py-3 font-semibold shadow-md"
              >
                Sign In
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-600">
              Don’t have an account? {" "}
              <Link
                to="/register"
                className="text-[#134E4A] font-semibold hover:underline"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

