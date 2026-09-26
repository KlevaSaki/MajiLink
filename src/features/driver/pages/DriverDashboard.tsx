import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Droplets,
  TrendingUp,
  Wallet,
  ChevronRight,
  Loader2,
  MapPin,
  Package,
  Radar,
  Moon,
  LayoutGrid,
  ListChecks,
  Settings as SettingsIcon,
  LogOut,
  Truck,
} from "lucide-react";
import { useDriverStore } from "../../../store/useDriverStore";
import { useAuthStore } from "../../../store/useAuthStore";
import ActiveDeliveryCard from "./ActiveDeliveryCard";
import TripHistoryList from "./TripHistory";
import RatingCard from "./RatingCard";

// ─── Types ────────────────────────────────────────────────────────────────

type TabId = "overview" | "trips" | "settings";

const NAV_ITEMS: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "trips", label: "Trips", icon: ListChecks },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

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
  const navigate = useNavigate();
  const signOut = useAuthStore((s) => s.signOut);

  const {
    profile,
    isInitialized,
    initializeDriver,
    subscribeToJobUpdates,
    availableJobs,
    activeDelivery,
    trips,
    getTodayTrips,
    getHistoryTrips,
    getEarnings,
    claimJob,
    markPickedUp,
    markDelivered,
    reportIssue,
    toggleOnline,
    updateLocation,
    updateVehicle,
  } = useDriverStore();

  useEffect(() => {
    initializeDriver();
  }, [initializeDriver]);

  // Pool arrivals and this driver's active-delivery status both update
  // live — a new ready-for-pickup order shows up, and a claim (from
  // another tab/device) or a delivery completing reflects here without
  // a refresh.
  useEffect(() => {
    if (!isInitialized) return;
    return subscribeToJobUpdates();
  }, [isInitialized, subscribeToJobUpdates]);

  // Keep the driver's position current while online — the pool's
  // distances and the active delivery's distance are only as good as
  // this. Off when offline, since there's nothing to be near for.
  useEffect(() => {
    if (profile.status === "offline" || typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude),
      (err) => console.error("Location watch failed:", err),
      { enableHighAccuracy: true, maximumAge: 30000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [profile.status, updateLocation]);

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  const earnings = getEarnings();
  const todayTrips = getTodayTrips();
  const historyTrips = getHistoryTrips();
  const isOnline = profile.status !== "offline";
  const firstName = profile.name.split(" ")[0] || "there";

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  const activeLabel = NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? "";

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-[#134E4A] animate-spin" />
        <p className="text-sm text-gray-500">Loading your account…</p>
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
              {profile.initials}
            </span>
            <span className="hidden lg:flex flex-col items-start min-w-0">
              <span className="text-white text-sm truncate max-w-[140px]">
                {profile.name || "Driver"}
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
                  Driver
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={toggleOnline}
                disabled={!!activeDelivery}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 border text-xs font-medium transition disabled:opacity-60 ${
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
                onClick={() => setActiveTab("overview")}
                className="relative w-9 h-9 rounded-full border border-white/20 bg-white/10 flex items-center justify-center"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-white" />
                {isOnline && availableJobs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#4FD1C5] border border-[#134E4A]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className="w-9 h-9 rounded-full bg-[#4FD1C5] flex items-center justify-center text-[#134E4A] text-xs font-bold"
                aria-label="Settings"
              >
                {profile.initials}
              </button>
            </div>
          </div>

          {activeTab === "overview" && (
            <div className="px-5 pb-6">
              <p className="text-white/60 text-sm">{getGreeting()},</p>
              <p className="text-white text-2xl font-bold mt-0.5 mb-4">{firstName}</p>
              <div className="grid grid-cols-3 gap-2.5">
                <EarningsStat label="Today" value={formatKsh(earnings.todayEarnings)} sub={`${earnings.todayTrips} trips`} />
                <EarningsStat label="This week" value={formatKsh(earnings.weekEarnings)} sub={`${earnings.weekTrips} trips`} />
                <EarningsStat label="Payout" value={formatKsh(earnings.pendingPayout)} sub="Pending" icon={Wallet} />
              </div>
            </div>
          )}
        </div>

        {/* ── Desktop / tablet header ── */}
        <div className="hidden md:flex items-center justify-between px-8 lg:px-10 h-16 border-b border-[#D6D3D1] bg-white sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-[#134E4A]">{activeLabel}</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleOnline}
              disabled={!!activeDelivery}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 border text-xs font-medium transition disabled:opacity-60 ${
                isOnline
                  ? "bg-[#E1F5EE] border-[#4FD1C5]/40 text-[#0F6E56]"
                  : "bg-gray-100 border-gray-200 text-gray-500"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-[#0F6E56]" : "bg-gray-400"}`} />
              {isOnline ? "Online" : "Offline"}
            </button>
            <button
              onClick={() => setActiveTab("overview")}
              className="relative w-9 h-9 rounded-full border border-[#D6D3D1] bg-white flex items-center justify-center hover:bg-gray-50 transition"
              aria-label="Notifications"
            >
              <Bell className="w-4.5 h-4.5 text-[#134E4A]" />
              {isOnline && availableJobs.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#4FD1C5] border border-white" />
              )}
            </button>
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="hidden md:block px-8 lg:px-10 pt-6">
            <p className="text-gray-500 text-sm mb-4">
              {getGreeting()}, <span className="text-[#134E4A] font-medium">{firstName}</span>
            </p>
            <div className="grid grid-cols-3 gap-4">
              <EarningsStat label="Today" value={formatKsh(earnings.todayEarnings)} sub={`${earnings.todayTrips} trips`} dark />
              <EarningsStat label="This week" value={formatKsh(earnings.weekEarnings)} sub={`${earnings.weekTrips} trips`} dark />
              <EarningsStat label="Payout" value={formatKsh(earnings.pendingPayout)} sub="Pending" icon={Wallet} dark />
            </div>
          </div>
        )}

        {/* ── Content ── */}
        <div className="px-5 md:px-8 lg:px-10 py-5 md:py-6 max-w-6xl">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <DeliveryOrPoolSection
                activeDelivery={activeDelivery}
                isOnline={isOnline}
                availableJobs={availableJobs}
                onToggleOnline={toggleOnline}
                onClaim={claimJob}
                onConfirmPickup={markPickedUp}
                onMarkDelivered={markDelivered}
                onReportIssue={reportIssue}
              />
              <section>
                <h2 className="text-sm font-semibold text-gray-500 mb-3">Today's trips</h2>
                <TripHistoryList trips={todayTrips} />
              </section>
              <section>
                <h2 className="text-sm font-semibold text-gray-500 mb-3">My rating</h2>
                <RatingCard rating={profile.rating} totalReviews={profile.totalReviews} />
              </section>
            </div>
          )}

          {activeTab === "trips" && (
            <div className="space-y-6">
              <section>
                <h2 className="text-sm font-semibold text-gray-500 mb-3">
                  Today
                  {todayTrips.length > 0 && (
                    <span className="ml-2 text-[#134E4A]">({todayTrips.length})</span>
                  )}
                </h2>
                <TripHistoryList trips={todayTrips} showAll />
              </section>
              {historyTrips.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-gray-500 mb-3">Previous</h2>
                  <TripHistoryList trips={historyTrips} showAll />
                </section>
              )}
              {trips.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-10">
                  No trips yet — accept a delivery to get started
                </p>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <SettingsPanel
              profile={profile}
              onUpdateVehicle={updateVehicle}
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
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function EarningsStat({
  label,
  value,
  sub,
  icon: Icon = TrendingUp,
  dark = false,
}: {
  label: string;
  value: string;
  sub: string;
  icon?: typeof TrendingUp;
  dark?: boolean;
}) {
  if (dark) {
    return (
      <div className="bg-white border border-[#D6D3D1] rounded-2xl p-4">
        <p className="text-gray-400 text-xs mb-1.5">{label}</p>
        <p className="text-[#134E4A] text-lg font-bold leading-none">{value}</p>
        <p className="text-[#0F6E56] text-xs mt-2 flex items-center gap-1">
          <Icon className="w-3 h-3" />
          {sub}
        </p>
      </div>
    );
  }
  return (
    <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5">
      <p className="text-white/50 text-xs mb-1.5">{label}</p>
      <p className="text-white text-lg font-bold leading-none">{value}</p>
      <p className="text-[#4FD1C5] text-xs mt-1.5 flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {sub}
      </p>
    </div>
  );
}

function DeliveryOrPoolSection({
  activeDelivery,
  isOnline,
  availableJobs,
  onToggleOnline,
  onClaim,
  onConfirmPickup,
  onMarkDelivered,
  onReportIssue,
}: {
  activeDelivery: ReturnType<typeof useDriverStore.getState>["activeDelivery"];
  isOnline: boolean;
  availableJobs: ReturnType<typeof useDriverStore.getState>["availableJobs"];
  onToggleOnline: () => void;
  onClaim: (orderId: string) => void;
  onConfirmPickup: () => void;
  onMarkDelivered: () => void;
  onReportIssue: (reason: string) => void;
}) {
  if (activeDelivery) {
    return (
      <section>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">Active delivery</h2>
        <ActiveDeliveryCard
          delivery={activeDelivery}
          onConfirmPickup={onConfirmPickup}
          onMarkDelivered={onMarkDelivered}
          onReportIssue={onReportIssue}
        />
      </section>
    );
  }

  if (!isOnline) {
    return (
      <div className="rounded-3xl p-6 text-center border bg-white border-dashed border-[#C5C3BB]">
        <Moon className="w-7 h-7 text-gray-300 mx-auto mb-2" />
        <p className="text-sm font-semibold text-gray-700">You're offline</p>
        <p className="text-xs text-gray-400 mt-1">Go online to see delivery jobs near you</p>
        <button
          onClick={onToggleOnline}
          className="mt-4 bg-[#134E4A] text-white text-sm font-semibold px-5 py-2.5 rounded-2xl hover:opacity-90 transition"
        >
          Go online
        </button>
      </div>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
          <Radar className="w-4 h-4 text-[#4FD1C5]" />
          Available nearby
        </h2>
        {availableJobs.length > 0 && (
          <span className="text-xs text-[#134E4A] font-medium">{availableJobs.length} waiting</span>
        )}
      </div>

      {availableJobs.length === 0 ? (
        <div className="bg-white border border-[#D6D3D1] rounded-3xl p-6 text-center">
          <p className="text-sm font-medium text-gray-700">You're available</p>
          <p className="text-xs text-gray-400 mt-1">Waiting for a delivery to come up nearby</p>
        </div>
      ) : (
        <div className="space-y-3">
          {availableJobs.map((job) => (
            <div key={job.orderId} className="bg-white border border-[#D6D3D1] rounded-3xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{job.vendorName}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{job.vendorAddress}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-[#134E4A]">
                    {job.pickupDistanceKm != null ? `${job.pickupDistanceKm.toFixed(1)} km` : "—"}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {job.pickupDistanceKm != null ? "to pickup" : "distance unknown"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-[#FAFAF8] rounded-2xl px-3 py-2.5">
                <span className="text-sm text-gray-600 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-gray-400" />
                  {job.quantity} × {job.productName}
                </span>
                <span className="text-sm font-semibold text-[#134E4A]">
                  KSh {job.totalAmount.toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => onClaim(job.orderId)}
                className="w-full py-2.5 rounded-2xl bg-[#134E4A] text-white text-sm font-semibold hover:opacity-90 transition"
              >
                Accept delivery
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SettingsPanel({
  profile,
  onUpdateVehicle,
  confirmingSignOut,
  setConfirmingSignOut,
  onSignOut,
}: {
  profile: ReturnType<typeof useDriverStore.getState>["profile"];
  onUpdateVehicle: (vehicle: string) => void;
  confirmingSignOut: boolean;
  setConfirmingSignOut: (v: boolean) => void;
  onSignOut: () => void;
}) {
  const [vehicle, setVehicle] = useState(profile.vehicle);
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [promoNotifs, setPromoNotifs] = useState(false);

  return (
    <div className="max-w-xl space-y-6">
      {/* ── Account ── */}
      <section className="bg-white border border-[#D6D3D1] rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#134E4A] text-[#4FD1C5] font-semibold flex items-center justify-center shrink-0">
            {profile.initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {profile.name || "Driver"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{profile.phone}</p>
          </div>
        </div>
      </section>

      {/* ── Vehicle ── */}
      <SettingsGroup title="Vehicle">
        <div className="px-4 py-3.5 flex items-center gap-3">
          <Truck className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            onBlur={() => vehicle !== profile.vehicle && onUpdateVehicle(vehicle)}
            placeholder="e.g. Boda boda, Motorbike, Bicycle"
            className="flex-1 text-sm border-0 focus:outline-none focus:ring-0 placeholder:text-gray-400"
          />
        </div>
      </SettingsGroup>

      {/* ── Notifications ── */}
      <SettingsGroup title="Notifications">
        <SettingsRow label="New job alerts" description="Get notified when a nearby delivery opens up">
          <ToggleSwitch checked={orderAlerts} onChange={() => setOrderAlerts((v) => !v)} />
        </SettingsRow>
        <SettingsRow label="Promotions" description="Occasional offers and MajiLink product updates">
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
