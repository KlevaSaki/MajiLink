import { useNavigate } from "react-router-dom";
import { User, Store, Truck, Loader2 } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import type { UserRole } from "../../../types/database";

const ROLES: { role: UserRole; icon: React.ElementType; title: string; description: string }[] = [
  {
    role: "customer",
    icon: User,
    title: "Customer",
    description: "Order clean water delivered to your home or business",
  },
  {
    role: "vendor",
    icon: Store,
    title: "Vendor",
    description: "Sell and manage water supply orders from customers",
  },
  {
    role: "driver",
    icon: Truck,
    title: "Driver",
    description: "Deliver water from vendors to customers nearby",
  },
];

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const { updateRole, isLoading, profile } = useAuthStore();

  async function handleSelect(role: UserRole) {
    const { error } = await updateRole(role);
    if (!error) {
      if (role === "customer") navigate("/customer");
      else if (role === "vendor") navigate("/vendor");
      else navigate("/driver");
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#D6D3D1] p-10 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-[#134E4A] mb-2">
          How will you use MajiLink?
        </h1>
        <p className="text-gray-500 mb-10 text-sm">
          {profile?.name ? `Welcome, ${profile.name.split(" ")[0]}! ` : ""}
          Choose your role to get started.
        </p>

        <div className="grid md:grid-cols-3 gap-5">
          {ROLES.map(({ role, icon: Icon, title, description }) => (
            <button
              key={role}
              onClick={() => handleSelect(role)}
              disabled={isLoading}
              className="p-6 rounded-2xl border border-[#D6D3D1] hover:border-[#4FD1C5] hover:shadow-md transition text-left group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-xl bg-[#E1F5EE] flex items-center justify-center mb-3 group-hover:bg-[#134E4A] transition">
                <Icon className="w-5 h-5 text-[#134E4A] group-hover:text-[#4FD1C5] transition" />
              </div>
              <h2 className="font-semibold text-[#134E4A] mb-1">{title}</h2>
              <p className="text-sm text-gray-500">{description}</p>
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving your role…
          </div>
        )}
      </div>
    </div>
  );
}
