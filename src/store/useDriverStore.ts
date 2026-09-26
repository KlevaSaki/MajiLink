import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "../lib/supabase";
import {
  fetchAvailableOrders,
  fetchDriverActiveOrder,
  subscribeDriverPool,
  subscribeDriverActive,
  reportDriverIssue,
  type OrderRow,
  type DriverActiveOrderRow,
  type Unsubscribe,
} from "../lib/orders";
import { haversineKm } from "../lib/geo";
import { showError, showSuccess } from "../lib/toast";
import type {
  DriverProfile,
  ActiveDelivery,
  CompletedTrip,
  DriverEarnings,
} from "../types/driver";

/**
 * Drivers are independent, not employed by a vendor. A vendor marks an
 * order ready for pickup; every online driver sees it in an open pool and
 * the first to claim it gets it. Claiming goes through the claim_order()
 * Postgres function because two drivers can tap Accept simultaneously and
 * only one can win — that has to be decided in the database.
 */

const EMPTY_PROFILE: DriverProfile = {
  id: "",
  name: "",
  initials: "",
  phone: "",
  vehicle: "",
  vendorId: "",
  vendorName: "",
  status: "offline",
  rating: 0,
  totalReviews: 0,
};

function initials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}

/** An order in the open pool, with the distance from this driver. */
export interface AvailableJob {
  orderId: string;
  vendorName: string;
  vendorAddress: string;
  dropoffAddress: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  pickupDistanceKm: number | null;
  readyAt: string | null;
}

function mapAvailableJob(
  row: OrderRow,
  driverLat: number | null,
  driverLng: number | null
): AvailableJob {
  const bizLat = row.businesses?.latitude;
  const bizLng = row.businesses?.longitude;

  // Distance is genuinely unknown when either side has no coordinates —
  // vendor onboarding doesn't geocode addresses yet, so this is common.
  // Returning null lets the UI say "distance unknown" rather than
  // rendering a confident zero.
  const pickupDistanceKm =
    driverLat != null && driverLng != null && bizLat != null && bizLng != null
      ? haversineKm(driverLat, driverLng, bizLat, bizLng)
      : null;

  return {
    orderId: String(row.id),
    vendorName: row.businesses?.business_name ?? "Vendor",
    vendorAddress: row.businesses?.location ?? "",
    dropoffAddress: row.delivery_address ?? "",
    productName: row.product?.name ?? "Item",
    quantity: row.quantity,
    totalAmount: row.total_amount,
    pickupDistanceKm,
    readyAt: row.ready_at ?? null,
  };
}

// Rough average speed for a boda/motorbike delivery in urban Kenyan
// traffic, used only to turn a known distance into an approximate ETA.
// This is a formula-based estimate, not real routing/traffic data — it
// should read as "roughly" to the driver, not a promise.
const ASSUMED_KMH = 20;

// Fare: 50 KSh per 4.5km block, rounded up — 0–4.5km is 50, 4.5–9km is
// 100, and so on. This is computed server-side only, in the
// mpesa-callback Edge Function, at the moment payment succeeds — never
// here. A client-side copy of this formula would let a driver's
// earnings display run ahead of an actual payment, which is exactly
// the "fake numbers" problem this file used to have. See
// mpesa-callback.ts for the real (and only) implementation.

function mapActiveDelivery(row: DriverActiveOrderRow): ActiveDelivery {
  const pickupLat = row.businesses?.latitude;
  const pickupLng = row.businesses?.longitude;
  const dropLat = row.delivery_lat;
  const dropLng = row.delivery_lng;

  const hasRoute =
    pickupLat != null && pickupLng != null && dropLat != null && dropLng != null;
  const distanceKm = hasRoute ? haversineKm(pickupLat, pickupLng, dropLat, dropLng) : 0;
  const estimatedMinutes = hasRoute ? Math.round((distanceKm / ASSUMED_KMH) * 60) : 0;

  // The real payout, computed server-side by the M-Pesa callback once
  // the customer actually pays. Showing a computed estimate here
  // regardless of payment_status would mean a driver sees "earnings"
  // for a delivery nobody has paid for yet — 0 until payment_status is
  // "paid", not an estimate.
  const earningsForTrip =
    row.payment_status === "paid" && row.driver_payout != null ? row.driver_payout : 0;

  return {
    orderId: String(row.id),
    vendorOrderId: String(row.id),
    customerName: row.customerName,
    customerInitials: initials(row.customerName),
    customerPhone: row.customerPhone,
    productName: row.product?.name ?? "Item",
    quantity: row.quantity,
    totalAmount: row.total_amount,
    pickup: {
      label: "Pickup",
      name: row.businesses?.business_name ?? "Vendor",
      address: row.businesses?.location ?? "",
      lat: pickupLat ?? undefined,
      lng: pickupLng ?? undefined,
    },
    dropoff: {
      label: "Drop-off",
      name: row.customerName,
      address: row.delivery_address ?? "",
      lat: dropLat ?? undefined,
      lng: dropLng ?? undefined,
    },
    distanceKm,
    estimatedMinutes,
    earningsForTrip,
    assignedAt: row.claimed_at ?? row.created_at,
    status: row.status === "en_route" ? "en_route" : "assigned",
  };
}

interface DriverStore {
  profile: DriverProfile;
  driverId: number | null;
  isInitialized: boolean;

  availableJobs: AvailableJob[];
  activeDelivery: ActiveDelivery | null;
  trips: CompletedTrip[];

  initializeDriver: () => Promise<void>;
  refreshAvailableJobs: () => Promise<void>;
  /** Starts realtime subscriptions for the open pool and this driver's
   *  active delivery. Returns one combined cleanup function — call it
   *  on unmount. */
  subscribeToJobUpdates: () => Unsubscribe;

  getTodayTrips: () => CompletedTrip[];
  getHistoryTrips: () => CompletedTrip[];
  /** Computed from real completed trips rather than a stored counter —
   *  pendingPayout is every delivered trip's fare, since there's no
   *  payout mechanism yet to have paid any of it out. */
  getEarnings: () => DriverEarnings;

  /** Race-safe. Resolves true if this driver won the order, false if
   *  another driver claimed it first. */
  claimJob: (orderId: string) => Promise<boolean>;
  markPickedUp: () => Promise<void>;
  markDelivered: () => Promise<void>;
  /** Cancels the active delivery with a reason and returns the driver
   *  to the open pool. */
  reportIssue: (reason: string) => Promise<void>;

  goOnline: () => Promise<void>;
  goOffline: () => Promise<void>;
  /** Convenience wrapper around goOnline/goOffline for a single toggle
   *  control in the UI. */
  toggleOnline: () => Promise<void>;
  updateLocation: (lat: number, lng: number) => Promise<void>;
  updateVehicle: (vehicle: string) => Promise<void>;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function startOfWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
  return monday;
}

export const useDriverStore = create<DriverStore>()(
  persist(
    (set, get) => ({
      profile: EMPTY_PROFILE,
      driverId: null,
      isInitialized: false,
      availableJobs: [],
      activeDelivery: null,
      trips: [],

      // ── Init ────────────────────────────────────────────────────────────

      initializeDriver: async () => {
        const { data: userData } = await supabase.auth.getUser();
        const authUser = userData.user;
        if (!authUser) {
          set({ isInitialized: true });
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("name, phone")
          .eq("id", authUser.id)
          .maybeSingle();

        let { data: driver } = await supabase
          .from("drivers")
          .select("*")
          .eq("profile_id", authUser.id)
          .maybeSingle();

        // A driver record is created on first load rather than in a
        // separate onboarding step — signing up with role="driver" is
        // the whole signup, so there's nothing else to collect yet.
        // vehicle_type is blank until they set it in settings.
        if (!driver) {
          const { data: created, error } = await supabase
            .from("drivers")
            .insert({
              profile_id: authUser.id,
              business_id: null,
              vehicle_type: "",
              status: "offline",
              is_online: false,
            })
            .select()
            .single();

          if (error) {
            console.error("Failed to create driver record:", error);
            set({ isInitialized: true });
            return;
          }
          driver = created;
        }

        set({
          driverId: driver.id,
          profile: {
            id: String(driver.id),
            name: profile?.name ?? "",
            initials: initials(profile?.name ?? ""),
            phone: profile?.phone ?? "",
            vehicle: driver.vehicle_type ?? "",
            // Independent drivers have no owning vendor. These fields
            // remain on DriverProfile only because the driver UI still
            // references them; they should come out when that UI is
            // reworked for the marketplace model.
            vendorId: "",
            vendorName: "",
            status: driver.is_online ? "available" : "offline",
            rating: driver.rating ?? 0,
            totalReviews: driver.total_reviews ?? 0,
          },
        });

        const activeRow = await fetchDriverActiveOrder(driver.id);
        set({
          activeDelivery: activeRow ? mapActiveDelivery(activeRow) : null,
          isInitialized: true,
        });

        if (driver.is_online) await get().refreshAvailableJobs();
      },

      refreshAvailableJobs: async () => {
        // Don't show the pool to a driver already mid-delivery.
        if (get().activeDelivery) {
          set({ availableJobs: [] });
          return;
        }
        const rows = await fetchAvailableOrders();
        const { latitude, longitude } = {
          latitude: get().profile.status === "offline" ? null : lastKnownLat,
          longitude: get().profile.status === "offline" ? null : lastKnownLng,
        };
        set({
          availableJobs: rows.map((r) => mapAvailableJob(r, latitude, longitude)),
        });
      },

      subscribeToJobUpdates: () => {
        const driverId = get().driverId;
        const unsubPool = subscribeDriverPool(() => {
          get().refreshAvailableJobs();
        });
        const unsubActive = driverId
          ? subscribeDriverActive(driverId, async () => {
              const activeRow = await fetchDriverActiveOrder(driverId);
              set({ activeDelivery: activeRow ? mapActiveDelivery(activeRow) : null });
              // Delivery finishing or falling through frees the driver
              // up to see the pool again.
              if (!activeRow) await get().refreshAvailableJobs();
            })
          : () => {};

        return () => {
          unsubPool();
          unsubActive();
        };
      },

      // ── Computed ────────────────────────────────────────────────────────

      getTodayTrips: () =>
        get()
          .trips.filter((t) => isToday(t.completedAt))
          .sort(
            (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
          ),

      getHistoryTrips: () =>
        get()
          .trips.filter((t) => !isToday(t.completedAt))
          .sort(
            (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
          ),

      getEarnings: (): DriverEarnings => {
        const delivered = get().trips.filter((t) => t.status === "delivered");
        const weekStart = startOfWeek();

        const today = delivered.filter((t) => isToday(t.completedAt));
        const thisWeek = delivered.filter((t) => new Date(t.completedAt) >= weekStart);

        const sum = (list: CompletedTrip[]) =>
          list.reduce((total, t) => total + t.earnings, 0);

        return {
          todayEarnings: sum(today),
          todayTrips: today.length,
          weekEarnings: sum(thisWeek),
          weekTrips: thisWeek.length,
          // No payout mechanism exists yet, so nothing has ever been
          // paid out — every delivered trip's fare is still pending.
          pendingPayout: sum(delivered),
        };
      },

      // ── Claiming ────────────────────────────────────────────────────────

      claimJob: async (orderId) => {
        const { data, error } = await supabase.rpc("claim_order", {
          p_order_id: Number(orderId),
        });

        if (error) {
          console.error("Failed to claim order:", error);
          showError("Couldn't claim that delivery. Please try again.");
          return false;
        }

        // claim_order returns null when another driver won the race.
        if (!data) {
          // Drop it from this driver's list so the UI reflects reality.
          set((state) => ({
            availableJobs: state.availableJobs.filter((j) => j.orderId !== orderId),
          }));
          showError("Someone else already claimed that delivery.");
          return false;
        }

        // Re-fetch with joins — the RPC returns the bare row.
        const driverId = get().driverId;
        if (driverId) {
          const activeRow = await fetchDriverActiveOrder(driverId);
          set({
            activeDelivery: activeRow ? mapActiveDelivery(activeRow) : null,
            availableJobs: [],
          });
        }
        return true;
      },

      markPickedUp: async () => {
        const active = get().activeDelivery;
        if (!active) return;

        // Optimistic — the "confirm pickup" button should disappear
        // immediately rather than waiting on the realtime round trip.
        set({ activeDelivery: { ...active, status: "en_route" } });

        const { error } = await supabase
          .from("orders")
          .update({ status: "en_route", picked_up_at: new Date().toISOString() })
          .eq("id", Number(active.orderId));

        if (error) {
          console.error("Failed to mark picked up:", error);
          showError("Couldn't confirm pickup. Please try again.");
          set({ activeDelivery: active }); // roll back
        }
      },

      markDelivered: async () => {
        const active = get().activeDelivery;
        if (!active) return;

        const completedAt = new Date().toISOString();
        const { error } = await supabase
          .from("orders")
          .update({ status: "delivered", delivered_at: completedAt })
          .eq("id", Number(active.orderId));

        if (error) {
          console.error("Failed to mark delivered:", error);
          showError("Couldn't mark this delivered. Please try again.");
          return;
        }

        const durationMinutes = Math.max(
          0,
          Math.round(
            (new Date(completedAt).getTime() - new Date(active.assignedAt).getTime()) / 60000
          )
        );

        const trip: CompletedTrip = {
          id: `trip_${active.orderId}`,
          orderId: active.orderId,
          customerName: active.customerName,
          customerInitials: active.customerInitials,
          fromName: active.pickup.name,
          toName: active.customerName,
          toAddress: active.dropoff.address,
          distanceKm: active.distanceKm,
          durationMinutes,
          earnings: active.earningsForTrip,
          status: "delivered",
          completedAt,
        };

        set((state) => ({
          activeDelivery: null,
          trips: [trip, ...state.trips],
          profile: { ...state.profile, status: "available" },
        }));

        showSuccess("Delivery completed");
        await get().refreshAvailableJobs();
      },

      reportIssue: async (reason) => {
        const active = get().activeDelivery;
        if (!active) return;

        const { error } = await reportDriverIssue(active.orderId, reason);
        if (error) {
          showError("Couldn't submit that report. Please try again.");
          return; // reportDriverIssue already logged it
        }

        const trip: CompletedTrip = {
          id: `trip_${active.orderId}`,
          orderId: active.orderId,
          customerName: active.customerName,
          customerInitials: active.customerInitials,
          fromName: active.pickup.name,
          toName: active.customerName,
          toAddress: active.dropoff.address,
          distanceKm: active.distanceKm,
          durationMinutes: 0,
          earnings: 0,
          status: "cancelled",
          completedAt: new Date().toISOString(),
        };

        set((state) => ({
          activeDelivery: null,
          trips: [trip, ...state.trips],
          profile: { ...state.profile, status: "available" },
        }));

        showSuccess("Issue reported");
        await get().refreshAvailableJobs();
      },

      // ── Availability ────────────────────────────────────────────────────

      goOnline: async () => {
        const driverId = get().driverId;
        if (!driverId) return;
        set((state) => ({ profile: { ...state.profile, status: "available" } }));

        const { error } = await supabase
          .from("drivers")
          .update({ is_online: true, status: "available" })
          .eq("id", driverId);
        if (error) {
          console.error("Failed to go online:", error);
          showError("Couldn't go online. Please try again.");
          set((state) => ({ profile: { ...state.profile, status: "offline" } }));
          return;
        }
        await get().refreshAvailableJobs();
      },

      toggleOnline: async () => {
        if (get().profile.status === "offline") {
          await get().goOnline();
        } else {
          await get().goOffline();
        }
      },

      goOffline: async () => {
        const driverId = get().driverId;
        if (!driverId) return;
        set((state) => ({
          profile: { ...state.profile, status: "offline" },
          availableJobs: [],
        }));

        const { error } = await supabase
          .from("drivers")
          .update({ is_online: false, status: "offline" })
          .eq("id", driverId);
        if (error) {
          console.error("Failed to go offline:", error);
          showError("Couldn't go offline. Please try again.");
        }
      },

      updateLocation: async (lat, lng) => {
        // No toast here, deliberately — this fires continuously in the
        // background while online (every geolocation update), so
        // surfacing every transient failure would spam the driver with
        // errors for something they didn't directly initiate.
        lastKnownLat = lat;
        lastKnownLng = lng;
        const driverId = get().driverId;
        if (!driverId) return;

        const { error } = await supabase
          .from("drivers")
          .update({
            latitude: lat,
            longitude: lng,
            location_updated_at: new Date().toISOString(),
          })
          .eq("id", driverId);
        if (error) console.error("Failed to update location:", error);

        // Distances in the pool are relative to where the driver is now.
        await get().refreshAvailableJobs();
      },

      updateVehicle: async (vehicle) => {
        const driverId = get().driverId;
        set((state) => ({ profile: { ...state.profile, vehicle } }));
        if (!driverId) return;

        const { error } = await supabase
          .from("drivers")
          .update({ vehicle_type: vehicle })
          .eq("id", driverId);
        if (error) {
          console.error("Failed to update vehicle:", error);
          showError("Couldn't save your vehicle. Please try again.");
        } else {
          showSuccess("Vehicle updated");
        }
      },
    }),
    {
      name: "majilink-driver",
      storage: createJSONStorage(() => localStorage),
      // Everything else is server state; persisting it would show stale
      // jobs and deliveries on load.
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);

/** Clears in-memory state AND its localStorage entry. Called on sign-out
 *  so the next person to use this browser — or this account after its
 *  data is deleted directly in Supabase — never sees a stale cached
 *  profile, job pool, or active delivery. */
export function resetDriverStore() {
  useDriverStore.setState({
    profile: EMPTY_PROFILE,
    driverId: null,
    isInitialized: false,
    availableJobs: [],
    activeDelivery: null,
    trips: [],
  });
  useDriverStore.persist.clearStorage();
  lastKnownLat = null;
  lastKnownLng = null;
}

// Driver coordinates come from the browser's geolocation API rather than
// the database, so they live outside the persisted store — writing them
// to localStorage would mean showing distances from a stale position.
let lastKnownLat: number | null = null;
let lastKnownLng: number | null = null;
