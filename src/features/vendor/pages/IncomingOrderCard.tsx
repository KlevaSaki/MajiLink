import { MapPin } from "lucide-react";
import type { VendorOrder, VendorDriver } from "../../../types/vendor";

interface Props {
  order: VendorOrder;
  availableDrivers: VendorDriver[];
  onAccept: (orderId: string, driverId: string) => void;
  onDecline: (orderId: string) => void;
}

// const INITIALS_COLORS: Record<string, string> = {
//   A: "bg-purple-100 text-purple-700",
//   B: "bg-blue-100 text-blue-700",
//   C: "bg-green-100 text-green-700",
// };

function initialsColor(initials: string): string {
  const code = initials.charCodeAt(0) % 5;
  const palette = [
    "bg-[#E1F5EE] text-[#0F6E56]",
    "bg-[#EEF2FF] text-[#4338CA]",
    "bg-[#FFF7ED] text-[#854F0B]",
    "bg-[#FEF2F2] text-[#B91C1C]",
    "bg-[#F0FDF4] text-[#166534]",
  ];
  return palette[code];
}

export default function IncomingOrderCard({
  order,
  availableDrivers,
  onAccept,
  onDecline,
}: Props) {
  const isIncoming = order.status === "incoming";
  const isActive =
    order.status === "confirmed" ||
    order.status === "assigned" ||
    order.status === "en_route";

  const statusLabel: Record<string, string> = {
    incoming: "New",
    confirmed: "Confirmed",
    assigned: "Driver assigned",
    en_route: "En route",
  };

  const statusStyle: Record<string, string> = {
    incoming: "bg-[#FFF7ED] text-[#854F0B]",
    confirmed: "bg-[#E1F5EE] text-[#0F6E56]",
    assigned: "bg-[#E1F5EE] text-[#0F6E56]",
    en_route: "bg-[#EEF2FF] text-[#4338CA]",
  };

  // Default to first available driver when accepting
  const defaultDriver = availableDrivers[0]?.id ?? "";

  return (
    <div className="bg-white rounded-3xl border border-[#D6D3D1] p-4 space-y-3">
      {/* Customer row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${initialsColor(order.customerInitials)}`}
          >
            {order.customerInitials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {order.customerName}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />
              {order.customerLocation} · {order.distanceKm} km
            </p>
          </div>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
            statusStyle[order.status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {statusLabel[order.status] ?? order.status}
        </span>
      </div>

      {/* Order detail */}
      <div className="flex items-center justify-between bg-[#FAFAF8] rounded-2xl px-3 py-2.5">
        <span className="text-sm text-gray-600">
          {order.quantity} × {order.productName}
        </span>
        <span className="text-sm font-semibold text-[#134E4A]">
          KSh {order.totalAmount.toLocaleString()}
        </span>
      </div>

      {/* Actions */}
      {isIncoming && (
        <div className="flex gap-2">
          <button
            onClick={() => onDecline(order.id)}
            className="flex-1 py-2 rounded-2xl border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition"
          >
            Decline
          </button>
          <button
            onClick={() => onAccept(order.id, defaultDriver)}
            className="flex-2 py-2 rounded-2xl bg-[#134E4A] text-white text-sm font-medium hover:opacity-90 transition"
          >
            Accept & Assign Driver
          </button>
        </div>
      )}

      {isActive && (
        <div className="flex gap-2">
          <button className="flex-1 py-2 rounded-2xl border border-[#D6D3D1] text-[#134E4A] text-sm font-medium hover:border-[#4FD1C5] transition">
            Re-assign
          </button>
          <button
            onClick={() => {/* track */}}
            className="flex-2 py-2 rounded-2xl bg-[#4FD1C5] text-[#134E4A] text-sm font-semibold hover:opacity-90 transition"
          >
            Track delivery
          </button>
        </div>
      )}
    </div>
  );
}
