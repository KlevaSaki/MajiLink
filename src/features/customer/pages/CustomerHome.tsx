// import { MapPin, Bell, ShoppingCart, Droplets } from "lucide-react";

// const vendors = [
//   {
//     id: 1,
//     name: "AquaFresh Supplies",
//     distance: "1.2 km away",
//     price: "KES 150",
//   },
// ];

// export default function CustomerHome() {
//   return (
//     <div className="min-h-screen bg-[#FAFAF8] pb-24">
//       <div className="bg-[#134E4A] text-white px-6 pt-10 pb-8 rounded-b-[2rem]">
//         <div className="flex items-center justify-between mb-8">
//           <div>
//             <p className="text-sm text-gray-200">Delivery Location</p>
//             <div className="flex items-center gap-2 mt-1">
//               <MapPin size={18} />
//               <h1 className="font-semibold text-lg">Eldoret, Kenya</h1>
//             </div>
//           </div>

//           <button className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
//             <Bell size={20} />
//           </button>
//         </div>

//         <div className="bg-white rounded-3xl p-5 text-[#134E4A]">
//           <h2 className="text-2xl font-bold mb-4">
//             Order clean water instantly.
//           </h2>

//           <button className="bg-[#134E4A] text-white px-5 py-3 rounded-2xl font-medium">
//             Start Order
//           </button>
//         </div>
//       </div>

//       <div className="px-6 mt-8 space-y-4">
//         {vendors.map((vendor) => (
//           <div
//             key={vendor.id}
//             className="bg-white border border-[#D6D3D1] rounded-3xl p-5 shadow-sm"
//           >
//             <div className="flex items-start justify-between mb-4">
//               <div>
//                 <h3 className="font-semibold text-[#134E4A] text-lg">
//                   {vendor.name}
//                 </h3>

//                 <p className="text-sm text-gray-500 mt-1">
//                   {vendor.distance}
//                 </p>
//               </div>

//               <div className="w-14 h-14 rounded-2xl bg-[#4FD1C5]/20 flex items-center justify-center">
//                 <Droplets className="text-[#134E4A]" />
//               </div>
//             </div>

//             <div className="flex items-center justify-between">
//               <p className="font-semibold text-[#134E4A]">
//                 Starting from {vendor.price}
//               </p>

//               <button className="bg-[#134E4A] text-white px-4 py-2 rounded-2xl text-sm font-medium">
//                 Order Now
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#D6D3D1] px-6 py-4 flex items-center justify-between">
//         <button className="flex flex-col items-center text-[#134E4A]">
//           <Droplets size={20} />
//           <span className="text-xs mt-1">Home</span>
//         </button>

//         <button className="flex flex-col items-center text-gray-400">
//           <ShoppingCart size={20} />
//           <span className="text-xs mt-1">Orders</span>
//         </button>
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import { Bell, Droplets, Plus, ArrowRight, Droplet, Receipt, Coins } from "lucide-react";
import { useCustomerStore } from "../../../store/useCustomerStore";
import type { OrderStatus } from "../../../types/index";
import OrderTracker from "./OrderTracker";
import TopUpModal from "./TopUpModal";
import PlaceOrderModal from "./PlaceOrderModal";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
  });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  en_route: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function CustomerDashboard() {
  const {
    user,
    wallet,
    getActiveOrder,
    getRecentOrders,
    getMonthlyStats,
    topUpWallet,
    placeOrder,
    cancelOrder,
  } = useCustomerStore();

  const [showTopUp, setShowTopUp] = useState(false);
  const [showOrder, setShowOrder] = useState(false);

  const activeOrder = getActiveOrder();
  const recentOrders = getRecentOrders();
  const stats = getMonthlyStats();

  const firstName = user.fullName.split(" ")[0];

  return (
    <div className="min-h-screen bg-[#FAFAF8]">

      {/* ── Top bar ── */}
      <div className="bg-[#134E4A] px-5 pt-safe-top">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#4FD1C5] flex items-center justify-center">
              <Droplets className="w-5 h-5 text-[#134E4A]" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">
              MajiLink
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative w-9 h-9 rounded-full border border-white/20 bg-white/10 flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#4FD1C5] border border-[#134E4A]" />
            </button>
            <div
              className="w-9 h-9 rounded-full bg-[#4FD1C5] flex items-center justify-center text-[#134E4A] text-xs font-bold"
              aria-label="Profile"
            >
              {user.avatarInitials}
            </div>
          </div>
        </div>

        {/* ── Wallet hero ── */}
        <div className="pb-6">
          <p className="text-white/60 text-sm">{getGreeting()},</p>
          <p className="text-white text-2xl font-bold mt-0.5 mb-4">
            {firstName} 👋
          </p>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white/60 text-xs mb-1">Wallet Balance</p>
              <p className="text-white text-2xl font-bold leading-none">
                KSh {wallet.balance.toLocaleString()}
              </p>
              {wallet.bonusCredit > 0 && (
                <p className="text-[#4FD1C5] text-xs mt-1.5">
                  + KSh {wallet.bonusCredit.toLocaleString()} bonus credit
                </p>
              )}
            </div>
            <button
              onClick={() => setShowTopUp(true)}
              className="bg-[#4FD1C5] text-[#134E4A] rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-1.5 hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" />
              Top Up
            </button>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="px-5 py-5 space-y-6">

        {/* ── Order CTA ── */}
        <button
          onClick={() => setShowOrder(true)}
          className="w-full bg-[#134E4A] rounded-2xl p-4 flex items-center justify-between hover:opacity-95 transition active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4FD1C5]/20 flex items-center justify-center">
              <Droplet className="w-5 h-5 text-[#4FD1C5]" />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold text-sm">Order Water</p>
              <p className="text-white/60 text-xs mt-0.5">
                Vendors near {user.location.split(",")[0]} available now
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-[#4FD1C5]" />
          </div>
        </button>

        {/* ── Active order ── */}
        {activeOrder ? (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-3">
              Active order
            </h2>
            <OrderTracker order={activeOrder} onCancel={cancelOrder} />
          </section>
        ) : (
          <div className="bg-white border border-[#D6D3D1] rounded-2xl p-5 text-center">
            <p className="text-2xl mb-2">💧</p>
            <p className="text-sm font-medium text-gray-700">No active orders</p>
            <p className="text-xs text-gray-400 mt-1">
              Tap "Order Water" above to get started
            </p>
          </div>
        )}

        {/* ── Monthly stats ── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">
            This month
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-[#D6D3D1] rounded-2xl p-3.5 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#E1F5EE] flex items-center justify-center">
                <Droplet className="w-4 h-4 text-[#0F6E56]" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#134E4A] leading-none">
                  {stats.totalLitres}L
                </p>
                <p className="text-[11px] text-gray-500 mt-1">Ordered</p>
              </div>
            </div>
            <div className="bg-white border border-[#D6D3D1] rounded-2xl p-3.5 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                <Receipt className="w-4 h-4 text-[#4338CA]" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#134E4A] leading-none">
                  {stats.totalOrders}
                </p>
                <p className="text-[11px] text-gray-500 mt-1">Orders</p>
              </div>
            </div>
            <div className="bg-white border border-[#D6D3D1] rounded-2xl p-3.5 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FFF7ED] flex items-center justify-center">
                <Coins className="w-4 h-4 text-[#C2410C]" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#134E4A] leading-none">
                  {stats.totalSpent >= 1000
                    ? `${(stats.totalSpent / 1000).toFixed(1)}k`
                    : stats.totalSpent}
                </p>
                <p className="text-[11px] text-gray-500 mt-1">KSh spent</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Recent orders ── */}
        <section className="pb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500">
              Recent orders
            </h2>
            <button className="text-xs text-[#134E4A] font-medium">
              See all
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No completed orders yet
            </p>
          ) : (
            <div className="bg-white border border-[#D6D3D1] rounded-2xl divide-y divide-[#F0EFED]">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FAFAF8] border border-[#D6D3D1] flex items-center justify-center shrink-0">
                    <Droplet className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {order.item.vendorName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.item.quantity} × 20L · {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-800">
                      KSh {order.totalAmount.toLocaleString()}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${
                        order.status === "delivered"
                          ? "text-[#0F6E56]"
                          : "text-red-500"
                      }`}
                    >
                      {STATUS_LABELS[order.status]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Modals ── */}
      {showTopUp && (
        <TopUpModal
          onClose={() => setShowTopUp(false)}
          onTopUp={topUpWallet}
        />
      )}
      {showOrder && (
        <PlaceOrderModal
          onClose={() => setShowOrder(false)}
          onPlace={placeOrder}
          customerId={user.id}
          walletBalance={wallet.balance + wallet.bonusCredit}
        />
      )}
    </div>
  );
}

