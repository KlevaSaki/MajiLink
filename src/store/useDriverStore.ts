import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  DriverProfile,
  DriverStatus,
  ActiveDelivery,
  CompletedTrip,
  DriverEarnings,
  RatingBreakdown,
} from "../types/driver";
import {
  MOCK_DRIVER_PROFILE,
  MOCK_ACTIVE_DELIVERY,
  MOCK_COMPLETED_TRIPS,
  MOCK_DRIVER_EARNINGS,
  MOCK_RATING_BREAKDOWN,
} from "../data/driverMockData";

interface DriverStore {
  // State
  profile: DriverProfile;
  activeDelivery: ActiveDelivery | null;
  trips: CompletedTrip[];
  earnings: DriverEarnings;
  ratingBreakdown: RatingBreakdown;

  // Computed
  getTodayTrips: () => CompletedTrip[];
  getHistoryTrips: () => CompletedTrip[];

  // Delivery actions
  markPickedUp: () => void;
  markDelivered: () => void;
  reportIssue: (reason: string) => void;

  // Status actions
  toggleOnline: () => void;
  setStatus: (status: DriverStatus) => void;

  // Profile
  updateProfile: (updates: Partial<DriverProfile>) => void;
}

function isToday(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

export const useDriverStore = create<DriverStore>()(
  persist(
    (set, get) => ({
      profile: MOCK_DRIVER_PROFILE,
      activeDelivery: MOCK_ACTIVE_DELIVERY,
      trips: MOCK_COMPLETED_TRIPS,
      earnings: MOCK_DRIVER_EARNINGS,
      ratingBreakdown: MOCK_RATING_BREAKDOWN,

      // ── Computed ──────────────────────────────────────────────────────────

      getTodayTrips: () =>
        get()
          .trips.filter((t) => isToday(t.completedAt))
          .sort(
            (a, b) =>
              new Date(b.completedAt).getTime() -
              new Date(a.completedAt).getTime()
          ),

      getHistoryTrips: () =>
        get()
          .trips.filter((t) => !isToday(t.completedAt))
          .sort(
            (a, b) =>
              new Date(b.completedAt).getTime() -
              new Date(a.completedAt).getTime()
          ),

      // ── Delivery actions ──────────────────────────────────────────────────

      markPickedUp: () => {
        // In real app: update order status to en_route via Supabase
        // For now just a no-op — ETA could start counting here
      },

      markDelivered: () => {
        set((state) => {
          if (!state.activeDelivery) return state;

          const trip: CompletedTrip = {
            id: `trip_${Date.now()}`,
            orderId: state.activeDelivery.vendorOrderId,
            customerName: state.activeDelivery.customerName,
            customerInitials: state.activeDelivery.customerInitials,
            fromName: state.activeDelivery.pickup.name,
            toName: state.activeDelivery.customerName,
            toAddress: state.activeDelivery.dropoff.address,
            distanceKm: state.activeDelivery.distanceKm,
            durationMinutes: state.activeDelivery.estimatedMinutes,
            earnings: state.activeDelivery.earningsForTrip,
            status: "delivered",
            completedAt: new Date().toISOString(),
          };

          return {
            activeDelivery: null,
            trips: [trip, ...state.trips],
            profile: { ...state.profile, status: "online" },
            earnings: {
              ...state.earnings,
              todayEarnings:
                state.earnings.todayEarnings +
                state.activeDelivery.earningsForTrip,
              todayTrips: state.earnings.todayTrips + 1,
              weekEarnings:
                state.earnings.weekEarnings +
                state.activeDelivery.earningsForTrip,
              weekTrips: state.earnings.weekTrips + 1,
            },
          };
        });
      },

      reportIssue: (_reason: string) => {
        // Placeholder — in production: create a support ticket in Supabase
        set((state) => {
          if (!state.activeDelivery) return state;
          const trip: CompletedTrip = {
            id: `trip_${Date.now()}`,
            orderId: state.activeDelivery.vendorOrderId,
            customerName: state.activeDelivery.customerName,
            customerInitials: state.activeDelivery.customerInitials,
            fromName: state.activeDelivery.pickup.name,
            toName: state.activeDelivery.customerName,
            toAddress: state.activeDelivery.dropoff.address,
            distanceKm: state.activeDelivery.distanceKm,
            durationMinutes: 0,
            earnings: 0,
            status: "cancelled",
            completedAt: new Date().toISOString(),
          };
          return {
            activeDelivery: null,
            trips: [trip, ...state.trips],
            profile: { ...state.profile, status: "online" },
          };
        });
      },

      // ── Status actions ────────────────────────────────────────────────────

      toggleOnline: () => {
        set((state) => ({
          profile: {
            ...state.profile,
            status:
              state.profile.status === "offline" ? "online" : "offline",
          },
        }));
      },

      setStatus: (status: DriverStatus) => {
        set((state) => ({ profile: { ...state.profile, status } }));
      },

      // ── Profile ───────────────────────────────────────────────────────────

      updateProfile: (updates: Partial<DriverProfile>) => {
        set((state) => ({ profile: { ...state.profile, ...updates } }));
      },
    }),
    {
      name: "majilink-driver",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
