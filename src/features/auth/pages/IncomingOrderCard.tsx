import { MapPin, Truck } from "lucide-react";
import type { VendorOrder } from "../../../types/vendor";

interface Props {
  order: VendorOrder;
  onAccept: (orderId: string) => void;
  onDecline: (orderId: string) => void;
  onMarkReady: (orderId: string) => void;
}

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

const STATUS_LABEL: Record<string, string> = {
  incoming: "New",
  confirmed: "Preparing",
  ready_for_pickup: "Waiting for a driver",
  assigned: "Driver on the way",
  en_route: "Out for delivery",
  delivered: "Delivered",
  declined: "Declined",
};

const STATUS_STYLE: Record<string, string> = {
  incoming: "bg-[#FFF7ED] text-[#854F0B]",
  confirmed: "bg-[#E1F5EE] text-[#0F6E56]",
  ready_for_pickup: "bg-[#FFF7ED] text-[#854F0B]",
  assigned: "bg-[#EEF2FF] text-[#4338CA]",
  en_route: "bg-[#EEF2FF] text-[#4338CA]",
  delivered: "bg-[#E1F5EE] text-[#0F6E56]",
  declined: "bg-red-50 text-red-600",
};

export default function IncomingOrderCard({
  order,
  onAccept,
  onDecline,
  onMarkReady,
}: Props) {
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
            {order.customerLocation && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{order.customerLocation}</span>
              </p>
            )}
          </div>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
            STATUS_STYLE[order.status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {STATUS_LABEL[order.status] ?? order.status}
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

      {/* Actions by stage */}
      {order.status === "incoming" && (
        <div className="flex gap-2">
          <button
            onClick={() => onDecline(order.id)}
            className="flex-1 py-2 rounded-2xl border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition"
          >
            Decline
          </button>
          <button
            onClick={() => onAccept(order.id)}
            className="flex-[2] py-2 rounded-2xl bg-[#134E4A] text-white text-sm font-medium hover:opacity-90 transition"
          >
            Accept order
          </button>
        </div>
      )}

      {order.status === "confirmed" && (
        <button
          onClick={() => onMarkReady(order.id)}
          className="w-full py-2 rounded-2xl bg-[#4FD1C5] text-[#134E4A] text-sm font-semibold hover:opacity-90 transition"
        >
          Mark ready for pickup
        </button>
      )}

      {/* From here on the vendor has no action — a driver claims it from
          the open pool, so this is status only. */}
      {order.status === "ready_for_pickup" && (
        <p className="text-xs text-gray-500 flex items-center gap-1.5 px-1">
          <Truck className="w-3.5 h-3.5 shrink-0" />
          Visible to nearby drivers — waiting for one to accept
        </p>
      )}

      {(order.status === "assigned" || order.status === "en_route") && (
        <p className="text-xs text-[#4338CA] flex items-center gap-1.5 px-1">
          <Truck className="w-3.5 h-3.5 shrink-0" />
          {order.status === "assigned"
            ? "A driver is heading to you for pickup"
            : "On the way to the customer"}
        </p>
      )}
    </div>
  );
}
