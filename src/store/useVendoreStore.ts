import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  VendorProfile,
  VendorOrder,
  VendorOrderStatus,
  InventoryItem,
  VendorDriver,
  VendorEarnings,
} from "../types/vendor";
import {
  MOCK_VENDOR_PROFILE,
  MOCK_VENDOR_EARNINGS,
  MOCK_VENDOR_ORDERS,
  MOCK_INVENTORY,
  MOCK_VENDOR_DRIVERS,
} from "../data/vendorMockData";

interface VendorStore {
  // State
  profile: VendorProfile;
  earnings: VendorEarnings;
  orders: VendorOrder[];
  inventory: InventoryItem[];
  drivers: VendorDriver[];

  // Computed
  getIncomingOrders: () => VendorOrder[];
  getActiveOrders: () => VendorOrder[];
  getCompletedOrders: () => VendorOrder[];
  getAvailableDrivers: () => VendorDriver[];

  // Order actions
  acceptOrder: (orderId: string, driverId: string) => void;
  declineOrder: (orderId: string) => void;
  reassignDriver: (orderId: string, driverId: string) => void;
  markDelivered: (orderId: string) => void;

  // Inventory actions
  updateInventoryStock: (itemId: string, newStock: number) => void;
  updateInventoryPrice: (itemId: string, newPrice: number) => void;
  addInventoryItem: (item: InventoryItem) => void;
  removeInventoryItem: (itemId: string) => void;

  // Driver actions
  addDriver: (driver: VendorDriver) => void;
  removeDriver: (driverId: string) => void;
  updateDriverStatus: (driverId: string, status: VendorDriver["status"]) => void;

  // Profile actions
  toggleOpen: () => void;
  updateProfile: (updates: Partial<VendorProfile>) => void;
}

export const useVendorStore = create<VendorStore>()(
  persist(
    (set, get) => ({
      profile: MOCK_VENDOR_PROFILE,
      earnings: MOCK_VENDOR_EARNINGS,
      orders: MOCK_VENDOR_ORDERS,
      inventory: MOCK_INVENTORY,
      drivers: MOCK_VENDOR_DRIVERS,

      // ── Computed ──────────────────────────────────────────────────────────

      getIncomingOrders: () =>
        get().orders.filter((o) => o.status === "incoming"),

      getActiveOrders: () =>
        get().orders.filter(
          (o) =>
            o.status === "confirmed" ||
            o.status === "assigned" ||
            o.status === "en_route"
        ),

      getCompletedOrders: () =>
        get()
          .orders.filter(
            (o) => o.status === "delivered" || o.status === "declined"
          )
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),

      getAvailableDrivers: () =>
        get().drivers.filter((d) => d.status === "available"),

      // ── Order actions ─────────────────────────────────────────────────────

      acceptOrder: (orderId: string, driverId: string) => {
        set((state) => {
          const newStatus: VendorOrderStatus = driverId ? "assigned" : "confirmed";
          return {
            orders: state.orders.map((o) =>
              o.id === orderId
                ? { ...o, status: newStatus, assignedDriverId: driverId || undefined }
                : o
            ),
            drivers: state.drivers.map((d) =>
              d.id === driverId
                ? { ...d, status: "on_delivery" as const, currentOrderId: orderId }
                : d
            ),
            earnings: {
              ...state.earnings,
              todayOrders: state.earnings.todayOrders + 1,
            },
          };
        });
      },

      declineOrder: (orderId: string) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: "declined" as const } : o
          ),
        }));
      },

      reassignDriver: (orderId: string, driverId: string) => {
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId);
          const oldDriverId = order?.assignedDriverId;
          return {
            orders: state.orders.map((o) =>
              o.id === orderId ? { ...o, assignedDriverId: driverId } : o
            ),
            drivers: state.drivers.map((d) => {
              if (d.id === oldDriverId)
                return { ...d, status: "available" as const, currentOrderId: undefined };
              if (d.id === driverId)
                return { ...d, status: "on_delivery" as const, currentOrderId: orderId };
              return d;
            }),
          };
        });
      },

      markDelivered: (orderId: string) => {
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId);
          const driverId = order?.assignedDriverId;
          return {
            orders: state.orders.map((o) =>
              o.id === orderId
                ? { ...o, status: "delivered" as const, deliveredAt: new Date().toISOString() }
                : o
            ),
            drivers: state.drivers.map((d) =>
              d.id === driverId
                ? { ...d, status: "available" as const, currentOrderId: undefined }
                : d
            ),
            earnings: {
              ...state.earnings,
              todayEarnings: state.earnings.todayEarnings + (order?.totalAmount ?? 0),
              monthEarnings: state.earnings.monthEarnings + (order?.totalAmount ?? 0),
            },
          };
        });
      },

      // ── Inventory actions ─────────────────────────────────────────────────

      updateInventoryStock: (itemId: string, newStock: number) => {
        set((state) => ({
          inventory: state.inventory.map((i) =>
            i.id === itemId ? { ...i, stock: Math.max(0, newStock) } : i
          ),
        }));
      },

      updateInventoryPrice: (itemId: string, newPrice: number) => {
        set((state) => ({
          inventory: state.inventory.map((i) =>
            i.id === itemId ? { ...i, pricePerUnit: Math.max(1, newPrice) } : i
          ),
        }));
      },

      addInventoryItem: (item: InventoryItem) => {
        set((state) => ({ inventory: [...state.inventory, item] }));
      },

      removeInventoryItem: (itemId: string) => {
        set((state) => ({
          inventory: state.inventory.filter((i) => i.id !== itemId),
        }));
      },

      // ── Driver actions ────────────────────────────────────────────────────

      addDriver: (driver: VendorDriver) => {
        set((state) => ({ drivers: [...state.drivers, driver] }));
      },

      removeDriver: (driverId: string) => {
        set((state) => ({
          drivers: state.drivers.filter((d) => d.id !== driverId),
        }));
      },

      updateDriverStatus: (driverId: string, status: VendorDriver["status"]) => {
        set((state) => ({
          drivers: state.drivers.map((d) =>
            d.id === driverId ? { ...d, status } : d
          ),
        }));
      },

      // ── Profile actions ───────────────────────────────────────────────────

      toggleOpen: () => {
        set((state) => ({
          profile: { ...state.profile, isOpen: !state.profile.isOpen },
        }));
      },

      updateProfile: (updates: Partial<VendorProfile>) => {
        set((state) => ({ profile: { ...state.profile, ...updates } }));
      },
    }),
    {
      name: "majilink-vendor",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
