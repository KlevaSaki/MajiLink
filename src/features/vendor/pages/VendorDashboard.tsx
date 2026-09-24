import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Droplets,
  Droplet,
  Flame,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  LayoutGrid,
  Package,
  Boxes,
  Settings as SettingsIcon,
  LogOut,
  Loader2,
} from "lucide-react";
import { useVendorStore } from "../../../store/useVendorStore";
import { useAuthStore } from "../../../store/useAuthStore";
import IncomingOrderCard from "./IncomingOrderCard";
import InventoryGrid from "./InventoryGrid";

// ─── Types ────────────────────────────────────────────────────────────────

type TabId = "overview" | "orders" | "inventory" | "settings";

const NAV_ITEMS: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "orders", label: "Orders", icon: Package },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

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

function initialsFrom(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VendorDashboard() {
  const navigate = useNavigate();
  const signOut = useAuthStore((s) => s.signOut);

  const {
    profile,
    inventory,
    businessId,
    isInitialized,
    initializeVendor,
    subscribeToOrderUpdates,
    getEarnings,
    getIncomingOrders,
    getActiveOrders,
    getCompletedOrders,
    acceptOrder,
    declineOrder,
    markReadyForPickup,
    updateInventoryStock,
    updateInventoryPrice,
    addInventoryItem,
    removeInventoryItem,
    toggleOpen,
  } = useVendorStore();

  useEffect(() => {
    initializeVendor();
  }, [initializeVendor]);

  // Orders update live — accept/mark-ready/etc. and a customer placing a
  // new order both show up without a refresh. Only meaningful once a
  // business exists, and needs cleanup on unmount or it leaks a socket.
  useEffect(() => {
    if (!isInitialized || !businessId) return;
    return subscribeToOrderUpdates();
  }, [isInitialized, businessId, subscribeToOrderUpdates]);

  // RoleSelectPage and AuthCallbackPage both route a vendor straight to
  // /vendor on role selection — there's no dedicated route that sends a
  // new vendor to onboarding first. If init finishes and there's still no
  // business row, this is a vendor who hasn't onboarded yet.
  useEffect(() => {
    if (isInitialized && !businessId) {
      navigate("/vendor/onboarding");
    }
  }, [isInitialized, businessId, navigate]);

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [inventoryCategory, setInventoryCategory] = useState<"water" | "lpg">("water");

  const earnings = getEarnings();
  const incomingOrders = getIncomingOrders();
  const activeOrders = getActiveOrders();
  const completedOrders = getCompletedOrders();
  const allActionableOrders = [...incomingOrders, ...activeOrders];
  const newCount = incomingOrders.length;

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  const activeLabel = NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? "";

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-[#134E4A] animate-spin" />
        <p className="text-sm text-gray-500">Loading your store…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] md:flex">
      {/* ── Desktop / tablet sidebar ── */}
      <aside className="hidden md:flex md:w-[76px] lg:w-64 md:flex-col md:shrink-0 bg-[#134E4A] md:sticky md:top-0 md:h-screen">
        <div className="flex items-center gap-3 px-4 lg:px-6 h-16 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-[#4FD1C5] flex items-center justify-center shrink-0">
            <Droplets className="w-5 h-5 text-[#134E4A]" />
          </div>
          <span className="hidden lg:block text-white font-bold text-base tracking-tight">
            MajiLink
          </span>
        </div>

        <nav className="flex-1 px-2 lg:px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#4FD1C5]/15 text-white"
                    : "text-white/55 hover:text-white/85 hover:bg-white/5"
                }`}
              >
                <span
                  className={`relative flex items-center justify-center w-5 h-5 shrink-0 ${
                    active ? "text-[#4FD1C5]" : ""
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {id === "orders" && newCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#C2703D] border border-[#134E4A]" />
                  )}
                </span>
                <span className="hidden lg:block">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-2 lg:px-3 py-4 border-t border-white/10">
          <button
            onClick={() => setActiveTab("settings")}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/55 hover:text-white/85 hover:bg-white/5 transition-colors"
          >
            <span className="w-7 h-7 rounded-full bg-[#4FD1C5]/20 text-[#4FD1C5] text-xs font-semibold flex items-center justify-center shrink-0">
              {initialsFrom(profile.businessName)}
            </span>
            <span className="hidden lg:flex flex-col items-start min-w-0">
              <span className="text-white text-sm truncate max-w-[140px]">
                {profile.businessName}
              </span>
              <span className="text-white/40 text-xs">View settings</span>
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex-1 min-w-0 pb-20 md:pb-0">
        {/* ── Mobile top bar (hidden on desktop/tablet) ── */}
        <div className="md:hidden bg-[#134E4A]">
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

          {activeTab === "overview" && (
            <div className="px-5 pb-6">
              <p className="text-white/60 text-sm">{getGreeting()},</p>
              <p className="text-white text-2xl font-bold mt-0.5 mb-4">
                {profile.businessName}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Today's earnings"
                  value={formatKsh(earnings.todayEarnings)}
                  sub={`${earnings.todayOrders} orders today`}
                />
                <StatCard
                  label="This month"
                  value={formatKsh(earnings.monthEarnings)}
                  sub={`↑ ${earnings.monthGrowthPercent}% vs last month`}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Desktop / tablet header ── */}
        <div className="hidden md:flex items-center justify-between px-8 lg:px-10 h-16 border-b border-[#D6D3D1] bg-white sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-semibold text-[#134E4A]">{activeLabel}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleOpen}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 border text-xs font-medium transition ${
                profile.isOpen
                  ? "bg-[#E1F5EE] border-[#4FD1C5]/40 text-[#0F6E56]"
                  : "bg-gray-100 border-gray-200 text-gray-500"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  profile.isOpen ? "bg-[#0F6E56]" : "bg-gray-400"
                }`}
              />
              {profile.isOpen ? "Open" : "Closed"}
            </button>
            <button
              className="relative w-9 h-9 rounded-full border border-[#D6D3D1] bg-white flex items-center justify-center hover:bg-gray-50 transition"
              aria-label="Notifications"
            >
              <Bell className="w-4.5 h-4.5 text-[#134E4A]" />
              {newCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#C2703D] border border-white" />
              )}
            </button>
          </div>
        </div>

        {/* ── Desktop overview hero (compact stat row, not full teal band) ── */}
        {activeTab === "overview" && (
          <div className="hidden md:block px-8 lg:px-10 pt-6">
            <p className="text-gray-500 text-sm">
              {getGreeting()}, <span className="text-[#134E4A] font-medium">{profile.businessName}</span>
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <StatCard
                label="Today's earnings"
                value={formatKsh(earnings.todayEarnings)}
                sub={`${earnings.todayOrders} orders today`}
                dark
              />
              <StatCard
                label="This month"
                value={formatKsh(earnings.monthEarnings)}
                sub={`↑ ${earnings.monthGrowthPercent}% vs last month`}
                dark
              />
              <StatCard
                label="Pending orders"
                value={String(allActionableOrders.length)}
                sub={newCount > 0 ? `${newCount} awaiting response` : "All caught up"}
                dark
              />
              <StatCard
                label="Awaiting pickup"
                value={String(
                  activeOrders.filter((o) => o.status === "ready_for_pickup").length
                )}
                sub="Released to nearby drivers"
                dark
              />
            </div>
          </div>
        )}

        {/* ── Content ── */}
        <div className="px-5 md:px-8 lg:px-10 py-5 md:py-6 max-w-6xl">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <NewOrdersSection
                incomingOrders={incomingOrders}
                onAccept={acceptOrder}
                onDecline={declineOrder}
              />
              <ActiveOrdersSection
                activeOrders={activeOrders}
                onMarkReady={markReadyForPickup}
              />
              {completedOrders.length > 0 && (
                <CompletedSection completedOrders={completedOrders} />
              )}
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-6">
              <NewOrdersSection
                incomingOrders={incomingOrders}
                onAccept={acceptOrder}
                onDecline={declineOrder}
              />
              <ActiveOrdersSection
                activeOrders={activeOrders}
                onMarkReady={markReadyForPickup}
              />
              {completedOrders.length > 0 && (
                <CompletedSection completedOrders={completedOrders} limit={20} />
              )}
            </div>
          )}

          {activeTab === "inventory" && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500">Inventory</h2>
                <div className="flex bg-white border border-[#D6D3D1] rounded-xl p-1">
                  {(["water", "lpg"] as const).map((cat) => {
                    const Icon = cat === "water" ? Droplet : Flame;
                    return (
                      <button
                        key={cat}
                        onClick={() => setInventoryCategory(cat)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          inventoryCategory === cat
                            ? "bg-[#134E4A] text-white"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {cat === "water" ? "Water" : "LPG"}
                      </button>
                    );
                  })}
                </div>
              </div>
              <InventoryGrid
                category={inventoryCategory}
                inventory={inventory.filter((i) => i.category === inventoryCategory)}
                onUpdateStock={updateInventoryStock}
                onUpdatePrice={updateInventoryPrice}
                onAdd={addInventoryItem}
                onRemove={removeInventoryItem}
              />
            </section>
          )}

          {activeTab === "settings" && (
            <SettingsPanel
              profile={profile}
              onToggleOpen={toggleOpen}
              confirmingSignOut={confirmingSignOut}
              setConfirmingSignOut={setConfirmingSignOut}
              onSignOut={handleSignOut}
            />
          )}
        </div>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#D6D3D1] flex items-stretch z-20">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative"
            >
              <span className="relative">
                <Icon
                  className={`w-5 h-5 ${active ? "text-[#134E4A]" : "text-gray-400"}`}
                />
                {id === "orders" && newCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-1.5 h-1.5 rounded-full bg-[#C2703D]" />
                )}
              </span>
              <span
                className={`text-[10px] font-medium ${
                  active ? "text-[#134E4A]" : "text-gray-400"
                }`}
              >
                {label}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#134E4A]" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  dark = false,
}: {
  label: string;
  value: string;
  sub: string;
  dark?: boolean;
}) {
  if (dark) {
    return (
      <div className="bg-white border border-[#D6D3D1] rounded-2xl p-4">
        <p className="text-gray-400 text-xs mb-1.5">{label}</p>
        <p className="text-[#134E4A] text-2xl font-bold leading-none">{value}</p>
        <p className="text-[#0F6E56] text-xs mt-2 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {sub}
        </p>
      </div>
    );
  }
  return (
    <div className="bg-white/10 border border-white/18 rounded-2xl p-4">
      <p className="text-white/55 text-xs mb-1.5">{label}</p>
      <p className="text-white text-2xl font-bold leading-none">{value}</p>
      <p className="text-[#4FD1C5] text-xs mt-2 flex items-center gap-1">
        <TrendingUp className="w-3 h-3" />
        {sub}
      </p>
    </div>
  );
}

function NewOrdersSection({
  incomingOrders,
  onAccept,
  onDecline,
}: {
  incomingOrders: ReturnType<typeof useVendorStore.getState>["orders"];
  onAccept: (orderId: string) => void;
  onDecline: (orderId: string) => void;
}) {
  if (incomingOrders.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-3">
        New orders
        <span className="bg-[#FFF7ED] text-[#854F0B] text-xs font-medium px-2 py-0.5 rounded-full">
          {incomingOrders.length}
        </span>
      </h2>
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {incomingOrders.map((order) => (
          <IncomingOrderCard
            key={order.id}
            order={order}
            onAccept={onAccept}
            onDecline={onDecline}
            onMarkReady={() => {}}
          />
        ))}
      </div>
    </section>
  );
}

/** Every order the vendor has already accepted, in every stage between
 *  "confirmed" and "en_route" — each new one stacks below the last
 *  rather than replacing what's already there, so several deliveries in
 *  flight at once are all visible together. */
function ActiveOrdersSection({
  activeOrders,
  onMarkReady,
}: {
  activeOrders: ReturnType<typeof useVendorStore.getState>["orders"];
  onMarkReady: (orderId: string) => void;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 mb-3">
        Active orders
        {activeOrders.length > 0 && (
          <span className="ml-2 text-[#134E4A]">({activeOrders.length})</span>
        )}
      </h2>

      {activeOrders.length === 0 ? (
        <div className="bg-white border border-[#D6D3D1] rounded-2xl p-6 text-center">
          <CheckCircle2 className="w-6 h-6 text-[#0F6E56] mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">All caught up!</p>
          <p className="text-xs text-gray-400 mt-1">No orders in progress right now</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeOrders.map((order) => (
            <IncomingOrderCard
              key={order.id}
              order={order}
              onAccept={() => {}}
              onDecline={() => {}}
              onMarkReady={onMarkReady}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CompletedSection({
  completedOrders,
  limit = 4,
}: {
  completedOrders: ReturnType<typeof useVendorStore.getState>["orders"];
  limit?: number;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 mb-3">Completed today</h2>
      <div className="bg-white border border-[#D6D3D1] rounded-2xl divide-y divide-[#F0EFED]">
        {completedOrders.slice(0, limit).map((order) => (
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
                  order.status === "delivered" ? "text-[#0F6E56]" : "text-red-400"
                }`}
              >
                {order.status === "delivered" ? "Delivered" : "Declined"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SettingsPanel({
  profile,
  onToggleOpen,
  confirmingSignOut,
  setConfirmingSignOut,
  onSignOut,
}: {
  profile: ReturnType<typeof useVendorStore.getState>["profile"];
  onToggleOpen: () => void;
  confirmingSignOut: boolean;
  setConfirmingSignOut: (v: boolean) => void;
  onSignOut: () => void;
}) {
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [promoEmails, setPromoEmails] = useState(false);

  return (
    <div className="max-w-xl space-y-6">
      {/* ── Account ── */}
      <section className="bg-white border border-[#D6D3D1] rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#134E4A] text-[#4FD1C5] font-semibold flex items-center justify-center shrink-0">
            {initialsFrom(profile.businessName)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {profile.businessName}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Vendor account</p>
          </div>
        </div>
      </section>

      {/* ── Store status ── */}
      <SettingsGroup title="Store status">
        <SettingsRow
          label="Accepting orders"
          description={profile.isOpen ? "Your store shows as open to customers" : "Your store shows as closed to customers"}
        >
          <ToggleSwitch checked={profile.isOpen} onChange={onToggleOpen} />
        </SettingsRow>
      </SettingsGroup>

      {/* ── Notifications ── */}
      <SettingsGroup title="Notifications">
        <SettingsRow
          label="New order alerts"
          description="Get notified when a customer places an order"
        >
          <ToggleSwitch checked={orderAlerts} onChange={() => setOrderAlerts((v) => !v)} />
        </SettingsRow>
        <SettingsRow
          label="Promotional emails"
          description="Occasional tips and MajiLink product updates"
        >
          <ToggleSwitch checked={promoEmails} onChange={() => setPromoEmails((v) => !v)} />
        </SettingsRow>
      </SettingsGroup>

      {/* ── Account actions ── */}
      <SettingsGroup title="Account">
        {!confirmingSignOut ? (
          <button
            onClick={() => setConfirmingSignOut(true)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors rounded-xl"
          >
            <span className="flex items-center gap-2.5 text-sm font-medium text-[#C2703D]">
              <LogOut className="w-4 h-4" />
              Sign out
            </span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        ) : (
          <div className="px-4 py-3.5">
            <p className="text-sm text-gray-700 mb-3">Sign out of this device?</p>
            <div className="flex gap-2">
              <button
                onClick={onSignOut}
                className="flex-1 bg-[#C2703D] hover:bg-[#A85F31] text-white text-sm font-semibold rounded-xl py-2.5 transition-colors"
              >
                Sign out
              </button>
              <button
                onClick={() => setConfirmingSignOut(false)}
                className="flex-1 border border-[#D6D3D1] text-gray-600 text-sm font-medium rounded-xl py-2.5 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </SettingsGroup>
    </div>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 mb-3">{title}</h2>
      <div className="bg-white border border-[#D6D3D1] rounded-2xl divide-y divide-[#F0EFED]">
        {children}
      </div>
    </section>
  );
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${
        checked ? "bg-[#134E4A]" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
