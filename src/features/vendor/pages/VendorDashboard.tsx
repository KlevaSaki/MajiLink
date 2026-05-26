// import { Package, Clock, Wallet } from "lucide-react";

// export default function VendorDashboard() {
//   return (
//     <div className="min-h-screen bg-[#FAFAF8] p-6">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold text-[#134E4A]">
//           Vendor Dashboard
//         </h1>
//       </div>

//       <div className="grid md:grid-cols-3 gap-5 mb-8">
//         <div className="bg-white rounded-3xl border border-[#D6D3D1] p-6 shadow-sm">
//           <Package className="text-[#134E4A] mb-4" />
//           <h2 className="text-3xl font-bold text-[#134E4A]">24</h2>
//           <p className="text-gray-500 mt-1">Orders Today</p>
//         </div>

//         <div className="bg-white rounded-3xl border border-[#D6D3D1] p-6 shadow-sm">
//           <Clock className="text-[#134E4A] mb-4" />
//           <h2 className="text-3xl font-bold text-[#134E4A]">6</h2>
//           <p className="text-gray-500 mt-1">Pending Orders</p>
//         </div>

//         <div className="bg-white rounded-3xl border border-[#D6D3D1] p-6 shadow-sm">
//           <Wallet className="text-[#134E4A] mb-4" />
//           <h2 className="text-3xl font-bold text-[#134E4A]">KES 12,400</h2>
//           <p className="text-gray-500 mt-1">Revenue Today</p>
//         </div>
//       </div>
//     </div>
//   );
// }

import { Bell, Droplets, TrendingUp, ChevronRight } from "lucide-react";
import { useVendorStore } from "../../../store/useVendoreStore";
import IncomingOrderCard from "./IncomingOrderCard";
import InventoryGrid from "./InventoryGrid";
import DriversList from "./DriversList";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatKsh(amount: number): string {
  if (amount >= 1000) return `KSh ${(amount / 1000).toFixed(1)}k`;
  return `KSh ${amount.toLocaleString()}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VendorDashboard() {
  const {
    profile,
    earnings,
    inventory,
    drivers,
    getIncomingOrders,
    getActiveOrders,
    getCompletedOrders,
    getAvailableDrivers,
    acceptOrder,
    declineOrder,
    updateInventoryStock,
    updateInventoryPrice,
    addInventoryItem,
    removeInventoryItem,
    removeDriver,
    updateDriverStatus,
    toggleOpen,
  } = useVendorStore();

  const incomingOrders = getIncomingOrders();
  const activeOrders = getActiveOrders();
  const completedOrders = getCompletedOrders();
  const availableDrivers = getAvailableDrivers();
  const allActionableOrders = [...incomingOrders, ...activeOrders];
  const newCount = incomingOrders.length;

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
                Vendor
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Open/Closed toggle */}
            <button
              onClick={toggleOpen}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 border text-xs font-medium transition ${
                profile.isOpen
                  ? "bg-[#4FD1C5]/15 border-[#4FD1C5]/30 text-white"
                  : "bg-white/10 border-white/20 text-white/60"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  profile.isOpen ? "bg-[#4FD1C5]" : "bg-white/40"
                }`}
              />
              {profile.isOpen ? "Open" : "Closed"}
            </button>
            <button
              className="relative w-9 h-9 rounded-full border border-white/20 bg-white/10 flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-white" />
              {newCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-400 border border-[#134E4A]" />
              )}
            </button>
          </div>
        </div>

        {/* ── Earnings hero ── */}
        <div className="px-5 pb-6">
          <p className="text-white/60 text-sm">{getGreeting()},</p>
          <p className="text-white text-2xl font-bold mt-0.5 mb-4">
            {profile.businessName} 🏪
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 border border-white/18 rounded-2xl p-4">
              <p className="text-white/55 text-xs mb-1.5">Today's earnings</p>
              <p className="text-white text-2xl font-bold leading-none">
                {formatKsh(earnings.todayEarnings)}
              </p>
              <p className="text-[#4FD1C5] text-xs mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {earnings.todayOrders} orders today
              </p>
            </div>
            <div className="bg-white/10 border border-white/18 rounded-2xl p-4">
              <p className="text-white/55 text-xs mb-1.5">This month</p>
              <p className="text-white text-2xl font-bold leading-none">
                {formatKsh(earnings.monthEarnings)}
              </p>
              <p className="text-[#4FD1C5] text-xs mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                ↑ {earnings.monthGrowthPercent}% vs last month
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="px-5 py-5 space-y-6">

        {/* ── Incoming + active orders ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
              Orders
              {newCount > 0 && (
                <span className="bg-[#FFF7ED] text-[#854F0B] text-xs font-medium px-2 py-0.5 rounded-full">
                  {newCount} new
                </span>
              )}
            </h2>
            <button className="text-xs text-[#134E4A] font-medium flex items-center gap-0.5">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {allActionableOrders.length === 0 ? (
            <div className="bg-white border border-[#D6D3D1] rounded-2xl p-6 text-center">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-sm font-medium text-gray-700">All caught up!</p>
              <p className="text-xs text-gray-400 mt-1">
                No pending orders right now
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allActionableOrders.map((order) => (
                <IncomingOrderCard
                  key={order.id}
                  order={order}
                  availableDrivers={availableDrivers}
                  onAccept={acceptOrder}
                  onDecline={declineOrder}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Completed orders (today) ── */}
        {completedOrders.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-3">
              Completed today
            </h2>
            <div className="bg-white border border-[#D6D3D1] rounded-2xl divide-y divide-[#F0EFED]">
              {completedOrders.slice(0, 4).map((order) => (
                <div key={order.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                      order.status === "delivered"
                        ? "bg-[#E1F5EE] text-[#0F6E56]"
                        : "bg-red-50 text-red-400"
                    }`}
                  >
                    {order.customerInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.quantity} × {order.productName}
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
                          : "text-red-400"
                      }`}
                    >
                      {order.status === "delivered" ? "Delivered" : "Declined"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Inventory ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500">Inventory</h2>
          </div>
          <InventoryGrid
            inventory={inventory}
            onUpdateStock={updateInventoryStock}
            onUpdatePrice={updateInventoryPrice}
            onAdd={addInventoryItem}
            onRemove={removeInventoryItem}
          />
        </section>

        {/* ── Drivers ── */}
        <section className="pb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500">
              My drivers
              <span className="ml-2 text-[#134E4A]">
                ({drivers.filter((d) => d.status === "available").length} available)
              </span>
            </h2>
            <button className="text-xs text-[#134E4A] font-medium">
              Manage
            </button>
          </div>
          <DriversList
            drivers={drivers}
            onRemove={removeDriver}
            onUpdateStatus={updateDriverStatus}
          />
        </section>

      </div>
    </div>
  );
}
