import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Droplets,
  Droplet,
  Search,
  ArrowRight,
  LayoutGrid,
  Package,
  Settings as SettingsIcon,
  LogOut,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useCustomerStore } from "../../../store/useCustomerStore";
import { useAuthStore } from "../../../store/useAuthStore";
import type { OrderStatus } from "../../../types/index";
import OrderTracker from "./OrderTracker";
import SupplierSearch from "./SupplierSearch";

// ─── Types ────────────────────────────────────────────────────────────────

type TabId = "overview" | "orders" | "settings";

const NAV_ITEMS: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "orders", label: "Orders", icon: Package },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  en_route: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

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

function initialsFrom(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const signOut = useAuthStore((s) => s.signOut);

  const {
    user,
    orders,
    isInitialized,
    initializeCustomer,
    subscribeToOrderUpdates,
    getActiveOrder,
    getRecentOrders,
    placeOrder,
    cancelOrder,
  } = useCustomerStore();

  useEffect(() => {
    initializeCustomer();
  }, [initializeCustomer]);

  // Order status updates live — vendor accepting, marking ready, a
  // driver claiming/delivering — without needing a refresh.
  useEffect(() => {
    if (!isInitialized || !user.id) return;
    return subscribeToOrderUpdates();
  }, [isInitialized, user.id, subscribeToOrderUpdates]);

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showSearch, setShowSearch] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  const activeOrder = getActiveOrder();
  const recentOrders = getRecentOrders();
  const firstName = user.fullName.split(" ")[0];

  // Same condition OrderTracker uses to show its "Pay now" prompt — the
  // bell should only ever count something the customer can actually
  // act on, not an arbitrary always-on dot.
  const needsAttentionCount = orders.filter(
    (o) => o.status === "delivered" && o.paymentStatus !== "paid"
  ).length;

  const orderHistory = [...orders]
    .filter((o) => o.status === "delivered" || o.status === "cancelled")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-[#134E4A] animate-spin" />
        <p className="text-sm text-gray-500">Loading your account…</p>
      </div>
    );
  }

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  const activeLabel = NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? "";

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
                <span className={`flex items-center justify-center w-5 h-5 shrink-0 ${active ? "text-[#4FD1C5]" : ""}`}>
                  <Icon className="w-5 h-5" />
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
              {user.avatarInitials}
            </span>
            <span className="hidden lg:flex flex-col items-start min-w-0">
              <span className="text-white text-sm truncate max-w-[140px]">
                {user.fullName}
              </span>
              <span className="text-white/40 text-xs">View settings</span>
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex-1 min-w-0 pb-20 md:pb-0">
        {/* ── Mobile top bar (hidden on desktop/tablet) ── */}
        <div className="md:hidden bg-[#134E4A] px-5 pt-safe-top">
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
                onClick={() => setActiveTab("orders")}
                className="relative w-9 h-9 rounded-full border border-white/20 bg-white/10 flex items-center justify-center"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-white" />
                {needsAttentionCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#4FD1C5] border border-[#134E4A]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className="w-9 h-9 rounded-full bg-[#4FD1C5] flex items-center justify-center text-[#134E4A] text-xs font-bold"
                aria-label="Settings"
              >
                {user.avatarInitials}
              </button>
            </div>
          </div>

          {activeTab === "overview" && (
            <div className="pb-6">
              <p className="text-white/60 text-sm">{getGreeting()},</p>
              <p className="text-white text-2xl font-bold mt-0.5 mb-4">
                {firstName}
              </p>
              <SearchEntryButton onClick={() => setShowSearch(true)} location={user.location} variant="dark" />
            </div>
          )}
        </div>

        {/* ── Desktop / tablet header ── */}
        <div className="hidden md:flex items-center justify-between px-8 lg:px-10 h-16 border-b border-[#D6D3D1] bg-white sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-[#134E4A]">{activeLabel}</h1>
          <button
            onClick={() => setActiveTab("orders")}
            className="relative w-9 h-9 rounded-full border border-[#D6D3D1] bg-white flex items-center justify-center hover:bg-gray-50 transition"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5 text-[#134E4A]" />
            {needsAttentionCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#4FD1C5] border border-white" />
            )}
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="hidden md:block px-8 lg:px-10 pt-6">
            <p className="text-gray-500 text-sm mb-4">
              {getGreeting()}, <span className="text-[#134E4A] font-medium">{firstName}</span>
            </p>
            <div className="max-w-xl">
              <SearchEntryButton onClick={() => setShowSearch(true)} location={user.location} variant="light" />
            </div>
          </div>
        )}

        {/* ── Content ── */}
        <div className="px-5 md:px-8 lg:px-10 py-5 md:py-6 max-w-6xl">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {activeOrder ? (
                <section>
                  <h2 className="text-sm font-semibold text-gray-500 mb-3">Active order</h2>
                  <OrderTracker order={activeOrder} onCancel={cancelOrder} />
                </section>
              ) : (
                <div className="bg-white border border-[#D6D3D1] rounded-2xl p-5 text-center">
                  <Droplet className="w-7 h-7 text-[#4FD1C5] mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">No active orders</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Tap "Find water & LPG suppliers" above to get started
                  </p>
                </div>
              )}

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-500">Recent orders</h2>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="text-xs text-[#134E4A] font-medium flex items-center gap-0.5"
                  >
                    See all <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <RecentOrdersList orders={recentOrders} />
              </section>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-6">
              {activeOrder && (
                <section>
                  <h2 className="text-sm font-semibold text-gray-500 mb-3">Active order</h2>
                  <OrderTracker order={activeOrder} onCancel={cancelOrder} />
                </section>
              )}
              <section>
                <h2 className="text-sm font-semibold text-gray-500 mb-3">Order history</h2>
                <RecentOrdersList orders={orderHistory} emptyLabel="No past orders yet" />
              </section>
            </div>
          )}

          {activeTab === "settings" && (
            <SettingsPanel
              user={user}
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
              <Icon className={`w-5 h-5 ${active ? "text-[#134E4A]" : "text-gray-400"}`} />
              <span className={`text-[10px] font-medium ${active ? "text-[#134E4A]" : "text-gray-400"}`}>
                {label}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#134E4A]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Supplier search / order flow ── */}
      {showSearch && (
        <SupplierSearch
          onClose={() => setShowSearch(false)}
          onPlace={placeOrder}
          customerId={user.id}
          customerLat={user.latitude}
          customerLng={user.longitude}
        />
      )}
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function SearchEntryButton({
  onClick,
  location,
  variant,
}: {
  onClick: () => void;
  location: string;
  variant: "dark" | "light";
}) {
  if (variant === "light") {
    return (
      <button
        onClick={onClick}
        className="w-full bg-white border border-[#D6D3D1] rounded-2xl p-4 flex items-center justify-between hover:border-[#4FD1C5] transition"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-[#134E4A] flex items-center justify-center shrink-0">
            <Search className="w-5 h-5 text-[#4FD1C5]" />
          </div>
          <div>
            <p className="text-[#134E4A] font-semibold text-sm">Find water & LPG suppliers</p>
            <p className="text-gray-400 text-xs mt-0.5">Nearest to {location.split(",")[0]}</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-[#134E4A] shrink-0" />
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 flex items-center justify-between hover:bg-white/15 transition"
    >
      <div className="flex items-center gap-3 text-left">
        <div className="w-10 h-10 rounded-xl bg-[#4FD1C5] flex items-center justify-center shrink-0">
          <Search className="w-5 h-5 text-[#134E4A]" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm">Find water & LPG suppliers</p>
          <p className="text-white/60 text-xs mt-0.5">Nearest to {location.split(",")[0]}</p>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-[#4FD1C5] shrink-0" />
    </button>
  );
}

function RecentOrdersList({
  orders,
  emptyLabel = "No completed orders yet",
}: {
  orders: ReturnType<typeof useCustomerStore.getState>["orders"];
  emptyLabel?: string;
}) {
  if (orders.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">{emptyLabel}</p>;
  }
  return (
    <div className="bg-white border border-[#D6D3D1] rounded-2xl divide-y divide-[#F0EFED]">
      {orders.map((order) => (
        <div key={order.id} className="flex items-center gap-3 px-4 py-3.5">
          <div className="w-9 h-9 rounded-xl bg-[#FAFAF8] border border-[#D6D3D1] flex items-center justify-center shrink-0">
            <Droplet className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {order.item.vendorName}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {order.item.quantity} × {order.item.productName} · {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-gray-800">
              KSh {order.totalAmount.toLocaleString()}
            </p>
            <p
              className={`text-xs mt-0.5 ${
                order.status === "delivered" ? "text-[#0F6E56]" : "text-red-500"
              }`}
            >
              {STATUS_LABELS[order.status]}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingsPanel({
  user,
  confirmingSignOut,
  setConfirmingSignOut,
  onSignOut,
}: {
  user: ReturnType<typeof useCustomerStore.getState>["user"];
  confirmingSignOut: boolean;
  setConfirmingSignOut: (v: boolean) => void;
  onSignOut: () => void;
}) {
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promoNotifs, setPromoNotifs] = useState(false);

  return (
    <div className="max-w-xl space-y-6">
      {/* ── Account ── */}
      <section className="bg-white border border-[#D6D3D1] rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#134E4A] text-[#4FD1C5] font-semibold flex items-center justify-center shrink-0">
            {initialsFrom(user.fullName)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{user.fullName}</p>
            <p className="text-xs text-gray-400 mt-0.5">{user.location}</p>
          </div>
        </div>
      </section>

      {/* ── Notifications ── */}
      <SettingsGroup title="Notifications">
        <SettingsRow
          label="Order updates"
          description="Get notified when your order status changes"
        >
          <ToggleSwitch checked={orderUpdates} onChange={() => setOrderUpdates((v) => !v)} />
        </SettingsRow>
        <SettingsRow
          label="Promotions"
          description="Occasional offers and MajiLink product updates"
        >
          <ToggleSwitch checked={promoNotifs} onChange={() => setPromoNotifs((v) => !v)} />
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
