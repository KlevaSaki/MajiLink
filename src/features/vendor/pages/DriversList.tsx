import { Star, UserPlus, Trash2 } from "lucide-react";
import type { VendorDriver } from "../../../types/vendor";

interface Props {
  drivers: VendorDriver[];
  onRemove: (id: string) => void;
  onUpdateStatus: (id: string, status: VendorDriver["status"]) => void;
}

const STATUS_CONFIG: Record<
  VendorDriver["status"],
  { label: string; className: string }
> = {
  available: { label: "Available", className: "text-[#0F6E56]" },
  on_delivery: { label: "On delivery", className: "text-[#854F0B]" },
  offline: { label: "Offline", className: "text-gray-400" },
};

const AVATAR_COLORS = [
  "bg-[#4FD1C5] text-[#134E4A]",
  "bg-[#E1F5EE] text-[#0F6E56]",
  "bg-[#EEF2FF] text-[#4338CA]",
  "bg-[#FFF7ED] text-[#854F0B]",
];

export default function DriversList({ drivers, onRemove, onUpdateStatus }: Props) {
  if (drivers.length === 0) {
    return (
      <div className="bg-white border border-[#D6D3D1] rounded-2xl p-6 text-center">
        <UserPlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No drivers yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Add drivers to start assigning deliveries
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {drivers.map((driver, i) => {
        const { label, className } = STATUS_CONFIG[driver.status];
        const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];

        return (
          <div
            key={driver.id}
            className="bg-white border border-[#D6D3D1] rounded-2xl px-4 py-3 flex items-center gap-3"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColor}`}
            >
              {driver.initials}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {driver.name}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <span>{driver.vehicle}</span>
                <span>·</span>
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />
                <span>{driver.rating.toFixed(1)}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-medium ${className}`}>{label}</span>
              <button
                onClick={() => onRemove(driver.id)}
                className="w-7 h-7 rounded-xl border border-[#D6D3D1] flex items-center justify-center hover:border-red-300 transition"
                aria-label={`Remove ${driver.name}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
