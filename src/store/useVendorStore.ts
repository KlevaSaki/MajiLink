import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";
import { fetchVendorOrders, subscribeVendorOrders, type Unsubscribe } from "../lib/orders";
import type {
  VendorProfile,
  VendorOrder,
  InventoryItem,
  InventoryCategory,
  VendorEarnings,
} from "../types/vendor";

/**
 * Everything here is backed by Supabase: `businesses`, `product` and
 * `orders`.
 *
 * Note there is no driver roster. Drivers are independent — a vendor
 * marks an order ready for pickup and any nearby driver claims it, so a
 * vendor never manages a list of drivers. The driver on an order is
 * read-only information that arrives with the order row.
 */

const EMPTY_PROFILE: VendorProfile = {
  id: "",
  businessName: "",
  ownerName: "",
  phone: "",
  location: "",
  latitude: 0,
  longitude: 0,
  isOpen: false,
  rating: 0,
  avatarInitials: "",
};

const EMPTY_EARNINGS: VendorEarnings = {
  todayEarnings: 0,
  todayOrders: 0,
  monthEarnings: 0,
  monthGrowthPercent: 0,
};

interface VendorStore {
  profile: VendorProfile;
  businessId: number | null;
  isInitialized: boolean;
  orders: VendorOrder[];
  inventory: InventoryItem[];

  initializeVendor: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  /** Starts a realtime subscription for this business's orders and
   *  returns the cleanup function — call it on unmount. */
  subscribeToOrderUpdates: () => Unsubscribe;

  // Computed
  getIncomingOrders: () => VendorOrder[];
  getActiveOrders: () => VendorOrder[];
  getCompletedOrders: () => VendorOrder[];
  getEarnings: () => VendorEarnings;

  // Order actions
  acceptOrder: (orderId: string) => void;
  declineOrder: (orderId: string) => void;
  /** Releases the order to the open driver pool. */
  markReadyForPickup: (orderId: string) => void;

  // Inventory actions
  updateInventoryStock: (itemId: string, newStock: number) => void;
  updateInventoryPrice: (itemId: string, newPrice: number) => void;
  addInventoryItem: (item: InventoryItem) => void;
  removeInventoryItem: (itemId: string) => void;

  // Profile actions
  toggleOpen: () => void;
  updateProfile: (updates: Partial<VendorProfile>) => Promise<void>;
}

function mapProductRow(row: any): InventoryItem {
  return {
    id: String(row.id),
    category: (row.category as InventoryCategory) ?? "water",
    name: row.name,
    stock: row.stock,
    maxStock: row.max_stock,
    pricePerUnit: row.price_per_unit,
    unit: row.unit,
    variant: row.variant ?? undefined,
    brand: row.brand ?? undefined,
    imageUrl: row.image_url ?? undefined,
  };
}

function initialsFrom(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}

/** Optimistically set a status locally, push it, roll back on failure. */
function pushStatus(
  get: () => VendorStore,
  set: (fn: (state: VendorStore) => Partial<VendorStore>) => void,
  orderId: string,
  localStatus: VendorOrder["status"],
  dbStatus: string,
  extraFields: Record<string, unknown> = {}
) {
  const previous = get().orders.find((o) => o.id === orderId);
  set((state) => ({
    orders: state.orders.map((o) => (o.id === orderId ? { ...o, status: localStatus } : o)),
  }));

  supabase
    .from("orders")
    .update({ status: dbStatus, ...extraFields })
    .eq("id", Number(orderId))
    .then(({ error }) => {
      if (error) {
        console.error(`Failed to set order ${orderId} to ${dbStatus}:`, error);
        if (previous) {
          set((state) => ({
            orders: state.orders.map((o) => (o.id === orderId ? previous : o)),
          }));
        }
      }
    });
}

export const useVendorStore = create<VendorStore>()(
  persist(
    (set, get) => ({
      profile: EMPTY_PROFILE,
      businessId: null,
      isInitialized: false,
      orders: [],
      inventory: [],

      // ── Init ──────────────────────────────────────────────────────────────

      initializeVendor: async () => {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (!user) {
          set({
            isInitialized: true,
            businessId: null,
            profile: EMPTY_PROFILE,
            inventory: [],
            orders: [],
          });
          return;
        }

        const { data: biz, error: bizError } = await supabase
          .from("businesses")
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (bizError) {
          console.error("Failed to load business:", bizError);
          set({ isInitialized: true });
          return;
        }

        if (!biz) {
          // No business row — either genuinely new (hasn't onboarded)
          // or the row was deleted directly in Supabase. Either way, any
          // profile/inventory left over from persist's localStorage
          // hydration must not stay on screen — leaving it was the bug:
          // deleting data in the DB didn't clear what was still cached
          // client-side.
          set({
            isInitialized: true,
            businessId: null,
            profile: EMPTY_PROFILE,
            inventory: [],
            orders: [],
          });
          return;
        }

        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("name, phone")
          .eq("id", user.id)
          .maybeSingle();

        set({
          businessId: biz.id,
          profile: {
            id: String(biz.id),
            businessName: biz.business_name,
            ownerName: ownerProfile?.name ?? "",
            phone: ownerProfile?.phone ?? "",
            location: biz.location ?? "",
            latitude: biz.latitude ?? 0,
            longitude: biz.longitude ?? 0,
            isOpen: biz.is_open,
            rating: biz.rating,
            avatarInitials: initialsFrom(biz.business_name),
          },
        });

        const { data: products, error: productError } = await supabase
          .from("product")
          .select("*")
          .eq("business_id", biz.id);

        if (productError) {
          console.error("Failed to load inventory:", productError);
        } else if (products) {
          set({ inventory: products.map(mapProductRow) });
        }

        set({ orders: await fetchVendorOrders(biz.id), isInitialized: true });
      },

      refreshOrders: async () => {
        const businessId = get().businessId;
        if (!businessId) return;
        set({ orders: await fetchVendorOrders(businessId) });
      },

      subscribeToOrderUpdates: () => {
        const businessId = get().businessId;
        if (!businessId) return () => {};
        return subscribeVendorOrders(businessId, () => {
          get().refreshOrders();
        });
      },

      // ── Computed ──────────────────────────────────────────────────────────

      getIncomingOrders: () => get().orders.filter((o) => o.status === "incoming"),

      getActiveOrders: () =>
        get().orders.filter(
          (o) =>
            o.status === "confirmed" ||
            o.status === "ready_for_pickup" ||
            o.status === "assigned" ||
            o.status === "en_route"
        ),

      getCompletedOrders: () =>
        get()
          .orders.filter((o) => o.status === "delivered" || o.status === "declined")
          .sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),

      // Real figures from delivered orders, rather than a stored counter
      // that could drift out of sync with the orders themselves.
      getEarnings: (): VendorEarnings => {
        // Delivered AND paid — a delivered-but-unpaid order (M-Pesa
        // failed, or the customer chose "pay later") is not revenue yet.
        // Using vendorPayout (set by the M-Pesa callback, total minus
        // the driver's cut) rather than totalAmount, since the vendor
        // never actually receives the driver's share.
        const delivered = get().orders.filter(
          (o) => o.status === "delivered" && o.paymentStatus === "paid"
        );
        if (delivered.length === 0) return EMPTY_EARNINGS;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const dateOf = (o: VendorOrder) => new Date(o.deliveredAt ?? o.createdAt);

        const today = delivered.filter((o) => dateOf(o) >= startOfToday);
        const thisMonth = delivered.filter((o) => dateOf(o) >= startOfMonth);
        const lastMonth = delivered.filter(
          (o) => dateOf(o) >= startOfLastMonth && dateOf(o) < startOfMonth
        );

        // vendorPayout is only ever set once payment_status is "paid",
        // so it's safe here — but fall back to 0, not totalAmount, if
        // it's somehow still missing rather than overstating revenue.
        const sum = (list: VendorOrder[]) =>
          list.reduce((total, o) => total + (o.vendorPayout ?? 0), 0);

        const thisMonthTotal = sum(thisMonth);
        const lastMonthTotal = sum(lastMonth);

        return {
          todayEarnings: sum(today),
          todayOrders: today.length,
          monthEarnings: thisMonthTotal,
          // No baseline to compare against in the first month of trading,
          // so growth stays 0 rather than reporting a meaningless 100%.
          monthGrowthPercent:
            lastMonthTotal > 0
              ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
              : 0,
        };
      },

      // ── Order actions ─────────────────────────────────────────────────────

      // Accepting no longer assigns a driver — that happens later, when a
      // driver claims the order from the open pool.
      acceptOrder: (orderId) => {
        pushStatus(get, set, orderId, "confirmed", "confirmed");
      },

      declineOrder: (orderId) => {
        pushStatus(get, set, orderId, "declined", "declined");
      },

      markReadyForPickup: (orderId) => {
        pushStatus(get, set, orderId, "ready_for_pickup", "ready_for_pickup", {
          ready_at: new Date().toISOString(),
        });
      },

      // ── Inventory actions ─────────────────────────────────────────────────

      updateInventoryStock: (itemId, newStock) => {
        const previous = get().inventory.find((i) => i.id === itemId)?.stock;
        const clamped = Math.max(0, newStock);
        set((state) => ({
          inventory: state.inventory.map((i) =>
            i.id === itemId ? { ...i, stock: clamped } : i
          ),
        }));
        supabase
          .from("product")
          .update({ stock: clamped })
          .eq("id", Number(itemId))
          .then(({ error }) => {
            if (error) {
              console.error("Failed to update stock:", error);
              if (previous !== undefined) {
                set((state) => ({
                  inventory: state.inventory.map((i) =>
                    i.id === itemId ? { ...i, stock: previous } : i
                  ),
                }));
              }
            }
          });
      },

      updateInventoryPrice: (itemId, newPrice) => {
        const previous = get().inventory.find((i) => i.id === itemId)?.pricePerUnit;
        const clamped = Math.max(1, newPrice);
        set((state) => ({
          inventory: state.inventory.map((i) =>
            i.id === itemId ? { ...i, pricePerUnit: clamped } : i
          ),
        }));
        supabase
          .from("product")
          .update({ price_per_unit: clamped })
          .eq("id", Number(itemId))
          .then(({ error }) => {
            if (error) {
              console.error("Failed to update price:", error);
              if (previous !== undefined) {
                set((state) => ({
                  inventory: state.inventory.map((i) =>
                    i.id === itemId ? { ...i, pricePerUnit: previous } : i
                  ),
                }));
              }
            }
          });
      },

      addInventoryItem: (item) => {
        const tempId = item.id;
        set((state) => ({ inventory: [...state.inventory, item] }));

        const businessId = get().businessId;
        if (!businessId) {
          console.error("Cannot save inventory item: no business loaded yet");
          set((state) => ({ inventory: state.inventory.filter((i) => i.id !== tempId) }));
          return;
        }

        supabase
          .from("product")
          .insert({
            business_id: businessId,
            name: item.name,
            unit: item.unit,
            price_per_unit: item.pricePerUnit,
            stock: item.stock,
            max_stock: item.maxStock,
            category: item.category,
            brand: item.brand ?? null,
            variant: item.variant ?? null,
            image_url: item.imageUrl ?? null,
          })
          .select()
          .single()
          .then(({ data, error }) => {
            if (error || !data) {
              console.error("Failed to save inventory item:", error);
              set((state) => ({ inventory: state.inventory.filter((i) => i.id !== tempId) }));
              return;
            }
            set((state) => ({
              inventory: state.inventory.map((i) =>
                i.id === tempId ? mapProductRow(data) : i
              ),
            }));
          });
      },

      removeInventoryItem: (itemId) => {
        const removed = get().inventory.find((i) => i.id === itemId);
        set((state) => ({
          inventory: state.inventory.filter((i) => i.id !== itemId),
        }));
        supabase
          .from("product")
          .delete()
          .eq("id", Number(itemId))
          .then(({ error }) => {
            if (error) {
              console.error("Failed to delete inventory item:", error);
              if (removed) set((state) => ({ inventory: [...state.inventory, removed] }));
            }
          });
      },

      // ── Profile actions ───────────────────────────────────────────────────

      toggleOpen: () => {
        const next = !get().profile.isOpen;
        set((state) => ({ profile: { ...state.profile, isOpen: next } }));
        persistProfile(get, set, { isOpen: next });
      },

      updateProfile: async (updates) => {
        set((state) => ({ profile: { ...state.profile, ...updates } }));
        await persistProfile(get, set, updates);
      },
    }),
    {
      name: "majilink-vendor",
      storage: createJSONStorage(() => localStorage),
      // Orders and inventory are server state — persisting them would
      // show stale data on load.
      partialize: (state) => ({ profile: state.profile, businessId: state.businessId }),
    }
  )
);

/** Clears in-memory state AND its localStorage entry. Called on sign-out
 *  so the next person to use this browser — or this account after its
 *  data is deleted directly in Supabase — never sees a stale cached
 *  business/inventory. */
export function resetVendorStore() {
  useVendorStore.setState({
    profile: EMPTY_PROFILE,
    businessId: null,
    isInitialized: false,
    orders: [],
    inventory: [],
  });
  useVendorStore.persist.clearStorage();
}

// ─── Persist profile changes, creating the business row on first save ────────

async function persistProfile(
  get: () => VendorStore,
  set: (partial: any) => void,
  updates: Partial<VendorProfile>
) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  const dbUpdates: Database["public"]["Tables"]["businesses"]["Update"] = {};
  if (updates.businessName !== undefined) dbUpdates.business_name = updates.businessName;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.latitude !== undefined) dbUpdates.latitude = updates.latitude;
  if (updates.longitude !== undefined) dbUpdates.longitude = updates.longitude;
  if (updates.isOpen !== undefined) dbUpdates.is_open = updates.isOpen;

  const businessId = get().businessId;

  if (businessId) {
    const { error } = await supabase.from("businesses").update(dbUpdates).eq("id", businessId);
    if (error) console.error("Failed to update business:", error);
    return;
  }

  const { data, error } = await supabase
    .from("businesses")
    .insert({
      owner_id: user.id,
      business_name:
        (dbUpdates.business_name as string) ?? get().profile.businessName ?? "New business",
      location: (dbUpdates.location as string) ?? null,
      latitude: (dbUpdates.latitude as number) ?? null,
      longitude: (dbUpdates.longitude as number) ?? null,
      is_open: (dbUpdates.is_open as boolean) ?? true,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to create business:", error);
    return;
  }

  set({
    businessId: data.id,
    profile: { ...get().profile, id: String(data.id) },
  });
}
