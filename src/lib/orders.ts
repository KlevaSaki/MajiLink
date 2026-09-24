import { supabase } from "./supabase";
import type { Order, OrderStatus } from "../types/index";
import type { VendorOrder, VendorOrderStatus } from "../types/vendor";

/**
 * All three roles read the same `orders` rows with the same joins, just
 * shaped differently. Keeping the query and the mapping here stops the
 * customer, vendor and driver stores from drifting apart as the schema
 * changes.
 */

// The joined shape every mapper below expects.
export const ORDER_SELECT = `
  *,
  businesses:business_id ( id, business_name, location, latitude, longitude ),
  product:product_id ( id, name, unit, category, image_url ),
  drivers:driver_id ( id, vehicle_type, profiles:profile_id ( name, phone ) )
`;

export type OrderRow = any;

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

// ─── Status mapping ───────────────────────────────────────────────────────
// The DB is the source of truth. Each role collapses it differently.

/** Customer view: "assigned" and "ready_for_pickup" both read as confirmed —
 *  the customer cares that it's accepted and coming, not about the
 *  vendor/driver handoff mechanics. "declined" reads as cancelled. */
export function toCustomerStatus(dbStatus: string): OrderStatus {
  switch (dbStatus) {
    case "pending":
      return "pending";
    case "confirmed":
    case "ready_for_pickup":
    case "assigned":
      return "confirmed";
    case "en_route":
      return "en_route";
    case "delivered":
      return "delivered";
    default:
      return "cancelled"; // cancelled + declined
  }
}

/** Vendor view: "pending" is framed as "incoming" (their inbox). */
export function toVendorStatus(dbStatus: string): VendorOrderStatus {
  switch (dbStatus) {
    case "pending":
      return "incoming";
    case "confirmed":
      return "confirmed";
    case "ready_for_pickup":
      return "ready_for_pickup";
    case "assigned":
      return "assigned";
    case "en_route":
      return "en_route";
    case "delivered":
      return "delivered";
    default:
      return "declined"; // declined + cancelled both land in history
  }
}

// ─── Mappers ──────────────────────────────────────────────────────────────

export function mapCustomerOrder(row: OrderRow): Order {
  const driverRow = row.drivers;
  const driverProfile = driverRow?.profiles;

  return {
    id: String(row.id),
    customerId: row.customer_id,
    item: {
      vendorId: String(row.business_id),
      vendorName: row.businesses?.business_name ?? "Unknown vendor",
      productId: String(row.product_id),
      productName: row.product?.name ?? "Item",
      category: row.product?.category ?? "water",
      quantity: row.quantity,
      unitPrice: row.quantity ? row.total_amount / row.quantity : row.total_amount,
      unit: row.product?.unit ?? "units",
    },
    status: toCustomerStatus(row.status),
    paymentStatus: (row.payment_status as Order["paymentStatus"]) ?? "unpaid",
    driver: driverRow
      ? {
          id: String(driverRow.id),
          name: driverProfile?.name ?? "Driver",
          initials: initials(driverProfile?.name ?? "Driver"),
          phone: driverProfile?.phone ?? "",
          vehicle: driverRow.vehicle_type ?? "",
          // No live ETA yet — there's no tracking feed. Showing a fake
          // number would be worse than showing none, so this stays 0
          // until real location updates exist.
          etaMinutes: 0,
        }
      : undefined,
    totalAmount: row.total_amount,
    createdAt: row.created_at,
    deliveredAt: row.delivered_at ?? undefined,
  };
}

export function mapVendorOrder(row: OrderRow, customerName = "Customer"): VendorOrder {
  return {
    id: String(row.id),
    customerId: row.customer_id,
    customerName,
    customerInitials: initials(customerName),
    customerLocation: row.delivery_address ?? "",
    // Real distance needs the customer's delivery coords and the
    // business coords; null-safe because delivery_lat/lng are only
    // populated once the order flow collects a location.
    distanceKm: 0,
    productName: row.product?.name ?? "Item",
    quantity: row.quantity,
    unitPrice: row.quantity ? row.total_amount / row.quantity : row.total_amount,
    totalAmount: row.total_amount,
    status: toVendorStatus(row.status),
    assignedDriverId: row.driver_id ? String(row.driver_id) : undefined,
    paymentStatus: (row.payment_status as VendorOrder["paymentStatus"]) ?? "unpaid",
    vendorPayout: row.vendor_payout ?? undefined,
    createdAt: row.created_at,
    deliveredAt: row.delivered_at ?? undefined,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────

export async function fetchCustomerOrders(customerId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load customer orders:", error);
    return [];
  }
  return (data ?? []).map(mapCustomerOrder);
}

export async function fetchVendorOrders(businessId: number): Promise<VendorOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load vendor orders:", error);
    return [];
  }

  // Customer names live on `profiles`, which the order row can't join
  // directly (customer_id → profiles isn't a declared FK relationship in
  // the schema). Fetch them in one batch rather than N+1.
  const customerIds = Array.from(new Set((data ?? []).map((r: any) => r.customer_id)));
  const nameById = new Map<string, string>();

  if (customerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", customerIds);
    (profiles ?? []).forEach((p: any) => nameById.set(p.id, p.name));
  }

  return (data ?? []).map((row: any) =>
    mapVendorOrder(row, nameById.get(row.customer_id) ?? "Customer")
  );
}

/** The open pool: ready for pickup, nobody has claimed it yet. */
export async function fetchAvailableOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("status", "ready_for_pickup")
    .is("driver_id", null)
    .order("ready_at", { ascending: true });

  if (error) {
    console.error("Failed to load available orders:", error);
    return [];
  }
  return data ?? [];
}

export interface DriverActiveOrderRow extends OrderRow {
  customerName: string;
  customerPhone: string;
}

export async function fetchDriverActiveOrder(
  driverId: number
): Promise<DriverActiveOrderRow | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("driver_id", driverId)
    .in("status", ["assigned", "en_route"])
    .maybeSingle();

  if (error) {
    console.error("Failed to load active delivery:", error);
    return null;
  }
  if (!data) return null;

  // Same reason as fetchVendorOrders: customer_id → profiles isn't a
  // declared FK the select embed can follow, so it's a second lookup.
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, phone")
    .eq("id", data.customer_id)
    .maybeSingle();

  return {
    ...data,
    customerName: profile?.name ?? "Customer",
    customerPhone: profile?.phone ?? "",
  };
}

/** Driver reports a problem with an in-progress delivery. Cancels the
 *  order (rather than re-pooling it) and records why, so a vendor
 *  reviewing cancelled orders can tell it wasn't the customer backing
 *  out. */
export async function reportDriverIssue(
  orderId: string,
  reason: string
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      issue_reason: reason,
      cancelled_by: "driver",
    })
    .eq("id", Number(orderId));

  if (error) console.error("Failed to report issue:", error);
  return { error };
}

// ─── Realtime ──────────────────────────────────────────────────────────────
//
// postgres_changes payloads only carry the raw row — no joined vendor,
// product or driver data — so every subscription below just triggers a
// refetch through the functions above rather than trying to hand-merge a
// partial row into state. Simpler, and it can't drift from what a plain
// reload would show.
//
// Requires enable_realtime_orders.sql to have been run — without it
// these subscribe successfully but silently never fire.

export type Unsubscribe = () => void;

function subscribeToOrderChanges(
  channelName: string,
  filter: string,
  onChange: () => void
): Unsubscribe {
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders", filter },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeCustomerOrders(customerId: string, onChange: () => void): Unsubscribe {
  return subscribeToOrderChanges(
    `orders-customer-${customerId}`,
    `customer_id=eq.${customerId}`,
    onChange
  );
}

export function subscribeVendorOrders(businessId: number, onChange: () => void): Unsubscribe {
  return subscribeToOrderChanges(
    `orders-business-${businessId}`,
    `business_id=eq.${businessId}`,
    onChange
  );
}

/** New arrivals in the open pool. Won't fire when an order LEAVES the
 *  pool via another driver's claim (Postgres change filters match on
 *  the new row, and a claimed order's status is no longer
 *  "ready_for_pickup" so it stops matching) — that's fine here, because
 *  claim_order() is atomic and claimJob() already handles a driver
 *  tapping a job someone else just took: it fails gracefully and drops
 *  it from their list at that point instead of before. */
export function subscribeDriverPool(onChange: () => void): Unsubscribe {
  return subscribeToOrderChanges(
    "orders-pool-ready-for-pickup",
    "status=eq.ready_for_pickup",
    onChange
  );
}

export function subscribeDriverActive(driverId: number, onChange: () => void): Unsubscribe {
  return subscribeToOrderChanges(
    `orders-driver-${driverId}`,
    `driver_id=eq.${driverId}`,
    onChange
  );
}
