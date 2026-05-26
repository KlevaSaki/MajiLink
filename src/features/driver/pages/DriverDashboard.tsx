// import { Truck, Wallet } from "lucide-react";

// export default function DriverDashboard() {
//   return (
//     <div className="min-h-screen bg-[#FAFAF8] p-6">
//       <div className="flex items-center justify-between mb-8">
//         <div>
//           <h1 className="text-3xl font-bold text-[#134E4A]">
//             Driver Dashboard
//           </h1>
//         </div>

//         <button className="bg-[#134E4A] text-white px-5 py-3 rounded-2xl font-medium">
//           Online
//         </button>
//       </div>

//       <div className="bg-[#134E4A] text-white rounded-3xl p-6 mb-8">
//         <div className="flex items-center justify-between">
//           <div>
//             <p className="text-gray-200 text-sm">Today's Earnings</p>
//             <h2 className="text-4xl font-bold mt-2">KES 3,450</h2>
//           </div>

//           <Wallet size={34} />
//         </div>
//       </div>

//       <div className="bg-white border border-[#D6D3D1] rounded-3xl p-5 shadow-sm">
//         <div className="flex items-center justify-between mb-4">
//           <div>
//             <h3 className="font-semibold text-[#134E4A] text-lg">
//               Delivery #2041
//             </h3>

//             <p className="text-sm text-gray-500 mt-2">
//               AquaFresh Supplies → Langas Estate
//             </p>
//           </div>

//           <Truck className="text-[#134E4A]" />
//         </div>

//         <button className="w-full bg-[#134E4A] text-white py-3 rounded-2xl font-medium">
//           Accept Delivery
//         </button>
//       </div>
//     </div>
//   );
// }

import { Bell, Droplets, TrendingUp, Wallet, ChevronRight } from "lucide-react";
import { useDriverStore } from "../../../store/useDriverStore";
import ActiveDeliveryCard from "./ActiveDeliveryCard";
import TripHistoryList from "./TripHistory";
import RatingCard from "./RatingCard";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatKsh(n: number): string {
  return n >= 1000 ? `KSh ${(n / 1000).toFixed(1)}k` : `KSh ${n}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DriverDashboard() {
  const {
    profile,
    activeDelivery,
    earnings,
    ratingBreakdown,
    getTodayTrips,
    getHistoryTrips,
    markDelivered,
    reportIssue,
    toggleOnline,
  } = useDriverStore();

  const todayTrips = getTodayTrips();
  const historyTrips = getHistoryTrips();
  const isOnline = profile.status !== "offline";
  const firstName = profile.name.split(" ")[0];

  return (
    <div className="min-h-screen bg-[#FAFAF8]">

      {/* ── Top bar ── */}
      <div className="bg-[#134E4A]">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#4FD1C5] flex items-center justify-center">
              <Droplets className="w-5 h-5 text-[#134E4A]" />
            </div>
            <div>
              <span className="text-white font-bold text-base tracking-tight">
                MajiLink
              </span>
              <span className="ml-2 text-[10px] text-[#4FD1C5] bg-[#4FD1C5]/15 border border-[#4FD1C5]/30 rounded-full px-2 py-0.5">
                Driver
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Online / Offline toggle */}
            <button
              onClick={toggleOnline}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 border text-xs font-medium transition ${
                isOnline
                  ? "bg-[#4FD1C5]/15 border-[#4FD1C5]/30 text-white"
                  : "bg-white/10 border-white/20 text-white/50"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  isOnline ? "bg-[#4FD1C5]" : "bg-white/30"
                }`}
              />
              {isOnline ? "Online" : "Offline"}
            </button>
            <button
              className="relative w-9 h-9 rounded-full border border-white/20 bg-white/10 flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-white" />
            </button>
            <div
              className="w-9 h-9 rounded-full bg-[#4FD1C5] flex items-center justify-center text-[#134E4A] text-xs font-bold"
              aria-label="Profile"
            >
              {profile.initials}
            </div>
          </div>
        </div>

        {/* ── Earnings hero ── */}
        <div className="px-5 pb-6">
          <p className="text-white/60 text-sm">{getGreeting()},</p>
          <p className="text-white text-2xl font-bold mt-0.5 mb-4">
            {firstName} 🏍️
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5">
              <p className="text-white/50 text-xs mb-1.5">Today</p>
              <p className="text-white text-lg font-bold leading-none">
                {formatKsh(earnings.todayEarnings)}
              </p>
              <p className="text-[#4FD1C5] text-xs mt-1.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {earnings.todayTrips} trips
              </p>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5">
              <p className="text-white/50 text-xs mb-1.5">This week</p>
              <p className="text-white text-lg font-bold leading-none">
                {formatKsh(earnings.weekEarnings)}
              </p>
              <p className="text-[#4FD1C5] text-xs mt-1.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {earnings.weekTrips} trips
              </p>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5">
              <p className="text-white/50 text-xs mb-1.5">Payout</p>
              <p className="text-white text-lg font-bold leading-none">
                {formatKsh(earnings.pendingPayout)}
              </p>
              <p className="text-[#4FD1C5] text-xs mt-1.5 flex items-center gap-1">
                <Wallet className="w-3 h-3" />
                Pending
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="px-5 py-5 space-y-6">

        {/* ── Active delivery or idle state ── */}
        <section>
          {activeDelivery ? (
            <>
              <h2 className="text-sm font-semibold text-gray-500 mb-3">
                Active delivery
              </h2>
              <ActiveDeliveryCard
                delivery={activeDelivery}
                onMarkDelivered={markDelivered}
                onReportIssue={reportIssue}
              />
            </>
          ) : (
            <div
              className={`rounded-3xl p-6 text-center border ${
                isOnline
                  ? "bg-white border-[#D6D3D1]"
                  : "bg-white border-dashed border-[#C5C3BB]"
              }`}
            >
              <p className="text-3xl mb-2">{isOnline ? "✅" : "💤"}</p>
              <p className="text-sm font-semibold text-gray-700">
                {isOnline ? "You're available" : "You're offline"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {isOnline
                  ? "Waiting for your next delivery assignment from Maji Fresh Vendors"
                  : "Go online to start receiving delivery jobs"}
              </p>
              {!isOnline && (
                <button
                  onClick={toggleOnline}
                  className="mt-4 bg-[#134E4A] text-white text-sm font-semibold px-5 py-2.5 rounded-2xl hover:opacity-90 transition"
                >
                  Go online
                </button>
              )}
            </div>
          )}
        </section>

        {/* ── Today's trips ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500">
              Today's trips
              {todayTrips.length > 0 && (
                <span className="ml-2 text-[#134E4A]">
                  ({todayTrips.length})
                </span>
              )}
            </h2>
            {todayTrips.length > 5 && (
              <button className="text-xs text-[#134E4A] font-medium flex items-center gap-0.5">
                See all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <TripHistoryList trips={todayTrips} />
        </section>

        {/* ── Rating ── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">
            My rating
          </h2>
          <RatingCard
            rating={profile.rating}
            totalReviews={profile.totalReviews}
            breakdown={ratingBreakdown}
          />
        </section>

        {/* ── Past trips ── */}
        {historyTrips.length > 0 && (
          <section className="pb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500">
                Previous trips
              </h2>
            </div>
            <TripHistoryList trips={historyTrips} />
          </section>
        )}
      </div>
    </div>
  );
}
