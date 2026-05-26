import { useState } from "react";
import { Phone, MapPin, AlertTriangle, X, CheckCircle } from "lucide-react";
import type { ActiveDelivery } from "../../../types/driver";

interface Props {
  delivery: ActiveDelivery;
  onMarkDelivered: () => void;
  onReportIssue: (reason: string) => void;
}

const ISSUE_REASONS = [
  "Customer not available",
  "Wrong address provided",
  "Vehicle breakdown",
  "Customer refused delivery",
  "Other",
];

export default function ActiveDeliveryCard({
  delivery,
  onMarkDelivered,
  onReportIssue,
}: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");

  const minutesElapsed = Math.floor(
    (Date.now() - new Date(delivery.assignedAt).getTime()) / 60000
  );
  const eta = Math.max(0, delivery.estimatedMinutes - minutesElapsed);

  function handleIssue() {
    if (!selectedReason) return;
    onReportIssue(selectedReason);
    setShowIssue(false);
  }

  // ── Delivery confirmed overlay ────────────────────────────────────────────
  if (showConfirm) {
    return (
      <div className="bg-[#134E4A] rounded-3xl p-5 space-y-4">
        <div className="text-center py-2">
          <CheckCircle className="w-12 h-12 text-[#4FD1C5] mx-auto mb-3" />
          <p className="text-white font-bold text-lg">Confirm delivery?</p>
          <p className="text-white/60 text-sm mt-1">
            Make sure the customer has received all{" "}
            {delivery.quantity} × {delivery.productName}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 py-3 rounded-2xl border border-white/20 text-white text-sm font-medium"
          >
            Go back
          </button>
          <button
            onClick={() => { onMarkDelivered(); setShowConfirm(false); }}
            className="flex-2 py-3 rounded-2xl bg-[#4FD1C5] text-[#134E4A] text-sm font-semibold"
          >
            Yes, delivered ✓
          </button>
        </div>
      </div>
    );
  }

  // ── Report issue overlay ──────────────────────────────────────────────────
  if (showIssue) {
    return (
      <div className="bg-[#134E4A] rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-white font-semibold">Report an issue</p>
          <button onClick={() => setShowIssue(false)}>
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>
        <div className="space-y-2">
          {ISSUE_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelectedReason(reason)}
              className={`w-full text-left px-4 py-3 rounded-2xl text-sm border transition ${
                selectedReason === reason
                  ? "bg-red-500/20 border-red-400/50 text-white"
                  : "border-white/15 text-white/70 hover:border-white/30"
              }`}
            >
              {reason}
            </button>
          ))}
        </div>
        <button
          onClick={handleIssue}
          disabled={!selectedReason}
          className="w-full py-3 rounded-2xl bg-red-500 text-white text-sm font-semibold disabled:opacity-40"
        >
          Submit report
        </button>
      </div>
    );
  }

  // ── Main delivery card ────────────────────────────────────────────────────
  return (
    <div className="bg-[#134E4A] rounded-3xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/55 text-xs">Order #{delivery.vendorOrderId}</p>
          <p className="text-white font-semibold text-sm mt-0.5">Active delivery</p>
        </div>
        <div className="text-right">
          <span className="bg-[#4FD1C5] text-[#134E4A] text-xs font-semibold px-3 py-1 rounded-full">
            En route
          </span>
          {eta > 0 && (
            <p className="text-white/55 text-xs mt-1">~{eta} min left</p>
          )}
        </div>
      </div>

      {/* Route */}
      <div className="flex gap-3">
        {/* Visual line */}
        <div className="flex flex-col items-center pt-1 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#4FD1C5]" />
          <div className="w-px flex-1 bg-white/20 my-1" style={{ minHeight: 28 }} />
          <div className="w-2.5 h-2.5 rounded-full border-2 border-white/50" />
        </div>
        {/* Stops */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          <div>
            <p className="text-white/45 text-[10px] uppercase tracking-wide mb-0.5">
              Pickup
            </p>
            <p className="text-white font-medium text-sm leading-snug">
              {delivery.pickup.name}
            </p>
            <p className="text-white/50 text-xs mt-0.5">
              {delivery.pickup.address}
            </p>
          </div>
          <div>
            <p className="text-white/45 text-[10px] uppercase tracking-wide mb-0.5">
              Drop-off
            </p>
            <p className="text-white font-medium text-sm leading-snug">
              {delivery.dropoff.name}
            </p>
            <p className="text-white/50 text-xs mt-0.5">
              {delivery.dropoff.address}
            </p>
          </div>
        </div>
        {/* Distance chip */}
        <div className="flex flex-col items-end justify-center gap-1 shrink-0">
          <div className="bg-white/10 rounded-xl px-2.5 py-1.5 text-center">
            <p className="text-white font-semibold text-sm">{delivery.distanceKm} km</p>
            <p className="text-white/50 text-[10px]">away</p>
          </div>
        </div>
      </div>

      {/* Customer strip */}
      <div className="bg-white/10 border border-white/15 rounded-2xl px-3 py-2.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#4FD1C5] flex items-center justify-center text-[#134E4A] text-xs font-bold shrink-0">
          {delivery.customerInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {delivery.customerName}
          </p>
          <p className="text-white/50 text-xs mt-0.5">
            {delivery.quantity} × {delivery.productName} ·{" "}
            KSh {delivery.totalAmount.toLocaleString()}
          </p>
        </div>
        <a
          href={`tel:${delivery.customerPhone}`}
          className="w-8 h-8 rounded-full bg-white/12 flex items-center justify-center shrink-0"
          aria-label={`Call ${delivery.customerName}`}
        >
          <Phone className="w-4 h-4 text-[#4FD1C5]" />
        </a>
      </div>

      {/* Earnings chip */}
      <div className="flex items-center justify-between px-1">
        <p className="text-white/50 text-xs">Your earnings for this trip</p>
        <p className="text-[#4FD1C5] font-semibold text-sm">
          KSh {delivery.earningsForTrip.toLocaleString()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(delivery.dropoff.address + ', Eldoret, Kenya')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-3 rounded-2xl bg-white/12 border border-white/20 text-white text-sm font-medium flex items-center justify-center gap-2"
        >
          <MapPin className="w-4 h-4 text-[#4FD1C5]" />
          Navigate
        </a>
        <button
          onClick={() => setShowConfirm(true)}
          className="flex-2 py-3 rounded-2xl bg-[#4FD1C5] text-[#134E4A] text-sm font-bold"
        >
          Mark as delivered
        </button>
      </div>

      {/* Report issue */}
      <button
        onClick={() => setShowIssue(true)}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition py-1"
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        Report an issue
      </button>
    </div>
  );
}
