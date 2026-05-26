import { ArrowRight, Star } from "lucide-react";
import type { CompletedTrip } from "../../../types/driver";

interface Props {
  trips: CompletedTrip[];
  showAll?: boolean;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
}

const INITIALS_PALETTE = [
  "bg-[#E1F5EE] text-[#0F6E56]",
  "bg-[#EEF2FF] text-[#4338CA]",
  "bg-[#FFF7ED] text-[#854F0B]",
  "bg-[#FEF2F2] text-[#B91C1C]",
  "bg-[#F0FDF4] text-[#166534]",
];

export default function TripHistoryList({ trips, showAll = false }: Props) {
  const displayed = showAll ? trips : trips.slice(0, 5);

  if (displayed.length === 0) {
    return (
      <div className="bg-white border border-[#D6D3D1] rounded-2xl p-8 text-center">
        <p className="text-3xl mb-2">🛵</p>
        <p className="text-sm font-medium text-gray-700">No trips yet today</p>
        <p className="text-xs text-gray-400 mt-1">
          Go online to start receiving delivery assignments
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#D6D3D1] rounded-2xl divide-y divide-[#F0EFED]">
      {displayed.map((trip, i) => {
        const palette = INITIALS_PALETTE[i % INITIALS_PALETTE.length];
        const isDelivered = trip.status === "delivered";

        return (
          <div key={trip.id} className="px-4 py-3.5">
            {/* Top row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${palette}`}
                >
                  {trip.customerInitials}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 leading-none">
                    {trip.customerName}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {timeAgo(trip.completedAt)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-semibold ${
                    isDelivered ? "text-[#134E4A]" : "text-gray-400"
                  }`}
                >
                  {isDelivered
                    ? `KSh ${trip.earnings.toLocaleString()}`
                    : "—"}
                </p>
                {trip.rating && isDelivered && (
                  <div className="flex items-center justify-end gap-0.5 mt-0.5">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-500">{trip.rating}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Route */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="truncate max-w-25">{trip.fromName}</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-30 text-[#134E4A] font-medium">
                {trip.toAddress}
              </span>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs text-gray-400">
                {trip.distanceKm} km
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400">
                {trip.durationMinutes} min
              </span>
              <span className="text-gray-300">·</span>
              <span
                className={`text-xs font-medium ${
                  isDelivered ? "text-[#0F6E56]" : "text-red-400"
                }`}
              >
                {isDelivered ? "Delivered" : "Cancelled"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
