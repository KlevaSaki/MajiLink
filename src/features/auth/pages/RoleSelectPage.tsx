import { useNavigate } from "react-router-dom";
import {
  User,
  Store,
  Truck,
  ArrowRight,
  Droplets,
} from "lucide-react";

export default function RoleSelectPage() {
  const navigate = useNavigate();

  const selectRole = (
    role: "customer" | "vendor" | "driver"
  ) => {
    // TODO: Save role to Supabase

    if (role === "customer") navigate("/customer-home");
    if (role === "vendor") navigate("/vendor");
    if (role === "driver") navigate("/driver");
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] relative overflow-hidden">

      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-125 h-125 bg-[#4FD1C5]/10 rounded-full blur-3xl" />

      <div className="absolute bottom-0 left-0 w-100 h-100 bg-[#134E4A]/5 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-10">

        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-10 items-center">

          {/* Left Side Branding */}
          <div className="hidden lg:flex flex-col justify-center">

            {/* Logo */}
            <div className="flex items-center gap-4 mb-10">

              <div className="w-16 h-16 rounded-3xl bg-[#134E4A] flex items-center justify-center shadow-xl">
                <Droplets className="w-8 h-8 text-[#4FD1C5]" />
              </div>

              <div>
                <h1 className="text-4xl font-bold tracking-tight text-[#134E4A]">
                  MajiLink
                </h1>

                <p className="text-gray-500 text-lg mt-1">
                  Water delivered instantly.
                </p>
              </div>
            </div>

            {/* Hero */}
            <div className="max-w-lg">

              <h2 className="text-6xl font-bold leading-tight text-[#134E4A] mb-8">
                One platform.
                <br />
                Three powerful roles.
              </h2>

              <p className="text-lg text-gray-600 leading-relaxed">
                MajiLink connects households, water suppliers,
                and delivery partners through one seamless
                water logistics infrastructure.
              </p>
            </div>

            {/* Feature Tags */}
            <div className="flex flex-wrap gap-4 mt-10">

              <div className="px-5 py-3 rounded-2xl bg-white border border-[#D6D3D1] text-sm font-medium text-[#134E4A] shadow-sm">
                Real-time Delivery
              </div>

              <div className="px-5 py-3 rounded-2xl bg-white border border-[#D6D3D1] text-sm font-medium text-[#134E4A] shadow-sm">
                Secure Payments
              </div>

              <div className="px-5 py-3 rounded-2xl bg-white border border-[#D6D3D1] text-sm font-medium text-[#134E4A] shadow-sm">
                Verified Vendors
              </div>

            </div>
          </div>

          {/* Right Side Cards */}
          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-4xl p-8 md:p-10 shadow-2xl">

            {/* Mobile Logo */}
            <div className="lg:hidden flex flex-col items-center text-center mb-10">

              <div className="w-16 h-16 rounded-3xl bg-[#134E4A] flex items-center justify-center shadow-lg mb-4">
                <Droplets className="w-8 h-8 text-[#4FD1C5]" />
              </div>

              <h1 className="text-3xl font-bold text-[#134E4A]">
                MajiLink
              </h1>

              <p className="text-gray-500 mt-2">
                Water delivered instantly.
              </p>
            </div>

            {/* Header */}
            <div className="mb-10">

              <h2 className="text-4xl font-bold text-[#134E4A] mb-3">
                Choose Your Role
              </h2>

              <p className="text-gray-500 text-lg">
                Select how you want to use the platform.
              </p>

            </div>

            {/* Role Cards */}
            <div className="space-y-5">

              {/* Customer */}
              <button
                onClick={() => selectRole("customer")}
                className="group w-full bg-[#FAFAF8] hover:bg-white border border-[#D6D3D1] hover:border-[#4FD1C5] rounded-3xl p-6 transition-all duration-300 hover:shadow-xl text-left"
              >
                <div className="flex items-center justify-between">

                  <div className="flex items-start gap-5">

                    <div className="w-16 h-16 rounded-2xl bg-[#134E4A] flex items-center justify-center shadow-sm">
                      <User className="text-[#4FD1C5]" size={28} />
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-[#134E4A] mb-2">
                        Customer
                      </h3>

                      <p className="text-gray-500 leading-relaxed max-w-sm">
                        Order clean water to your home,
                        apartment, office, or business instantly.
                      </p>
                    </div>

                  </div>

                  <ArrowRight className="text-[#134E4A] opacity-0 group-hover:opacity-100 transition" />

                </div>
              </button>

              {/* Vendor */}
              <button
                onClick={() => selectRole("vendor")}
                className="group w-full bg-[#FAFAF8] hover:bg-white border border-[#D6D3D1] hover:border-[#4FD1C5] rounded-3xl p-6 transition-all duration-300 hover:shadow-xl text-left"
              >
                <div className="flex items-center justify-between">

                  <div className="flex items-start gap-5">

                    <div className="w-16 h-16 rounded-2xl bg-[#134E4A] flex items-center justify-center shadow-sm">
                      <Store className="text-[#4FD1C5]" size={28} />
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-[#134E4A] mb-2">
                        Vendor
                      </h3>

                      <p className="text-gray-500 leading-relaxed max-w-sm">
                        Manage inventory, receive orders,
                        and supply water across your area.
                      </p>
                    </div>

                  </div>

                  <ArrowRight className="text-[#134E4A] opacity-0 group-hover:opacity-100 transition" />

                </div>
              </button>

              {/* Driver */}
              <button
                onClick={() => selectRole("driver")}
                className="group w-full bg-[#FAFAF8] hover:bg-white border border-[#D6D3D1] hover:border-[#4FD1C5] rounded-3xl p-6 transition-all duration-300 hover:shadow-xl text-left"
              >
                <div className="flex items-center justify-between">

                  <div className="flex items-start gap-5">

                    <div className="w-16 h-16 rounded-2xl bg-[#134E4A] flex items-center justify-center shadow-sm">
                      <Truck className="text-[#4FD1C5]" size={28} />
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-[#134E4A] mb-2">
                        Driver
                      </h3>

                      <p className="text-gray-500 leading-relaxed max-w-sm">
                        Accept nearby delivery requests
                        and earn through deliveries.
                      </p>
                    </div>

                  </div>

                  <ArrowRight className="text-[#134E4A] opacity-0 group-hover:opacity-100 transition" />

                </div>
              </button>

            </div>

            {/* Footer */}
            <div className="mt-10 text-center text-sm text-gray-500">
              Trusted water logistics infrastructure for Kenya.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}