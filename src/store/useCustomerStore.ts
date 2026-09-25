import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "../lib/supabase";
import { fetchCustomerOrders, mapCustomerOrder, ORDER_SELECT, subscribeCustomerOrders, type Unsubscribe } from "../lib/orders";
import type { Order, User, MonthlyStats } from "../types/index";

const EMPTY_USER: User = {
  id: "",
  fullName: "",
  email: "",
  phone: "",
  role: "customer",
  avatarInitials: "",
  location: "",
  latitude: 0,
  longitude: 0,
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

interface CustomerStore {
  user: User;
  orders: Order[];
  isInitialized: boolean;
  isNotifOpen: boolean;

  initializeCustomer: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  /** Starts a realtime subscription for this customer's orders and
   *  returns the cleanup function — call it on unmount. */
  subscribeToOrderUpdates: () => Unsubscribe;

  getActiveOrder: () => Order | undefined;
  getRecentOrders: () => Order[];
  getMonthlyStats: () => MonthlyStats;

  /** Accepts the draft Order that PlaceOrderModal builds, writes it to
   *  Supabase, and replaces the optimistic row with the real one. */
  /** Inserts the draft order and returns the real, DB-backed order
   *  (with its real id) — callers need the real id to track payment
   *  status afterward. Throws on failure; the optimistic row is already
   *  rolled back by the time it does. */
  placeOrder: (order: Order) => Promise<Order>;
  cancelOrder: (orderId: string) => void;
  /** Calls the initiate-mpesa-payment Edge Function to trigger an STK
   *  push. Returns an error string on failure (rejected by Daraja, no
   *  network, order already paid, etc.) — the caller should show it
   *  rather than assume the push went out. */
  initiatePayment: (orderId: string, phone: string) => Promise<{ error: string | null }>;
  /** Saves the customer's delivery point to `addresses` as their default,
   *  so supplier search has an origin and orders have a destination. */
  setDeliveryLocation: (
    lat: number,
    lng: number,
    label?: string
  ) => Promise<void>;
  toggleNotif: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      user: EMPTY_USER,
      orders: [],
      isInitialized: false,
      isNotifOpen: false,

      // ── Init ────────────────────────────────────────────────────────────

      initializeCustomer: async () => {
        const { data: userData } = await supabase.auth.getUser();
        const authUser = userData.user;
        if (!authUser) {
          set({ isInitialized: true });
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();

        // Default delivery address, if they've saved one.
        const { data: address } = await supabase
          .from("addresses")
          .select("*")
          .eq("profile_id", authUser.id)
          .eq("is_default", true)
          .maybeSingle();

        if (profile) {
          set({
            user: {
              id: profile.id,
              fullName: profile.name,
              email: profile.email,
              phone: profile.phone,
              role: profile.role as User["role"],
              avatarInitials: initials(profile.name),
              location: address?.address_line ?? "",
              latitude: address?.lat ?? 0,
              longitude: address?.lng ?? 0,
            },
          });
        }

        const orders = await fetchCustomerOrders(authUser.id);
        set({ orders, isInitialized: true });
      },

      refreshOrders: async () => {
        const userId = get().user.id;
        if (!userId) return;
        set({ orders: await fetchCustomerOrders(userId) });
      },

      subscribeToOrderUpdates: () => {
        const userId = get().user.id;
        if (!userId) return () => {};
        return subscribeCustomerOrders(userId, () => {
          get().refreshOrders();
        });
      },

      // ── Computed ────────────────────────────────────────────────────────

      getActiveOrder: () =>
        get().orders.find(
          (o) =>
            o.status === "pending" ||
            o.status === "confirmed" ||
            o.status === "en_route" ||
            // Delivered-but-unpaid stays "active" — otherwise the pay
            // prompt in OrderTracker would never actually be reachable,
            // since it only renders for whatever this function returns.
            (o.status === "delivered" && o.paymentStatus !== "paid")
        ),

      getRecentOrders: () =>
        get()
          .orders.filter(
            (o) =>
              o.status === "cancelled" ||
              // Only once paid does a delivered order move out of the
              // active view and into history — see getActiveOrder.
              (o.status === "delivered" && o.paymentStatus === "paid")
          )
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5),

      getMonthlyStats: (): MonthlyStats => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthly = get().orders.filter(
          (o) =>
            o.status === "delivered" &&
            o.paymentStatus === "paid" &&
            new Date(o.createdAt) >= monthStart
        );
        return {
          totalItems: monthly.reduce((sum, o) => sum + o.item.quantity, 0),
          totalOrders: monthly.length,
          totalSpent: monthly.reduce((sum, o) => sum + o.totalAmount, 0),
        };
      },

      // ── Actions ─────────────────────────────────────────────────────────

      placeOrder: async (order) => {
        const tempId = order.id;
        const user = get().user;

        // Show it immediately; reconcile once the insert returns.
        set((state) => ({ orders: [order, ...state.orders] }));

        const { data, error } = await supabase
          .from("orders")
          .insert({
            customer_id: user.id,
            business_id: Number(order.item.vendorId),
            product_id: Number(order.item.productId),
            quantity: order.item.quantity,
            total_amount: order.totalAmount,
            status: "pending",
            delivery_address: user.location || "Address not set",
            delivery_lat: user.latitude || null,
            delivery_lng: user.longitude || null,
          })
          .select(ORDER_SELECT)
          .single();

        if (error || !data) {
          console.error("Failed to place order:", error);
          set((state) => ({ orders: state.orders.filter((o) => o.id !== tempId) }));
          throw error ?? new Error("Order failed");
        }

        set((state) => ({
          orders: state.orders.map((o) => (o.id === tempId ? mapCustomerOrder(data) : o)),
        }));

        return mapCustomerOrder(data);
      },

      initiatePayment: async (orderId, phone) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) return { error: "Not signed in" };

        try {
          const { data, error } = await supabase.functions.invoke("initiate-mpesa-payment", {
            body: { order_id: Number(orderId), phone },
          });

          if (error) {
            console.error("initiate-mpesa-payment failed:", error);
            return { error: "Couldn't reach M-Pesa. Please try again." };
          }
          if (data?.error) {
            return { error: data.error as string };
          }

          // Reflect "pending" locally right away — the realtime
          // subscription will bring the eventual paid/failed result in,
          // but there's no reason to wait for a round trip just to show
          // that the push was sent.
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId ? { ...o, paymentStatus: "pending" as const } : o
            ),
          }));

          return { error: null };
        } catch (err) {
          console.error("initiate-mpesa-payment threw:", err);
          return { error: "Couldn't reach M-Pesa. Please try again." };
        }
      },

      cancelOrder: (orderId) => {
        const previous = get().orders.find((o) => o.id === orderId);
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: "cancelled" as const } : o
          ),
        }));

        supabase
          .from("orders")
          .update({ status: "cancelled" })
          .eq("id", Number(orderId))
          // Only cancellable before a driver has it — guards against
          // cancelling something already out for delivery.
          .in("status", ["pending", "confirmed", "ready_for_pickup"])
          .then(({ error }) => {
            if (error) {
              console.error("Failed to cancel order:", error);
              if (previous) {
                set((state) => ({
                  orders: state.orders.map((o) => (o.id === orderId ? previous : o)),
                }));
              }
            }
          });
      },

      setDeliveryLocation: async (lat, lng, label = "Delivery location") => {
        const user = get().user;
        if (!user.id) return;

        // Optimistic — search should react immediately.
        set((state) => ({
          user: { ...state.user, latitude: lat, longitude: lng, location: label },
        }));

        const { data: existing } = await supabase
          .from("addresses")
          .select("id")
          .eq("profile_id", user.id)
          .eq("is_default", true)
          .maybeSingle();

        const { error } = existing
          ? await supabase
              .from("addresses")
              .update({ lat, lng, address_line: label })
              .eq("id", existing.id)
          : await supabase.from("addresses").insert({
              profile_id: user.id,
              label: "Default",
              address_line: label,
              lat,
              lng,
              is_default: true,
            });

        if (error) console.error("Failed to save delivery location:", error);
      },

      toggleNotif: () => set((state) => ({ isNotifOpen: !state.isNotifOpen })),

      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
    }),
    {
      name: "majilink-customer",
      storage: createJSONStorage(() => localStorage),
      // Orders always come from the server — persisting them would show
      // stale state on load.
      partialize: (state) => ({ user: state.user }),
    }
  )
);

/** Clears in-memory state AND its localStorage entry. Called on sign-out
 *  so the next person to use this browser — or this account after its
 *  data is deleted directly in Supabase — never sees a stale cached
 *  profile or order list. */
export function resetCustomerStore() {
  useCustomerStore.setState({
    user: EMPTY_USER,
    orders: [],
    isInitialized: false,
    isNotifOpen: false,
  });
  useCustomerStore.persist.clearStorage();
}
