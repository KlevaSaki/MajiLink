import type { InventoryCategory } from "./vendor";
import type { Database } from "./database";

// Defined here, not imported from database.ts — that file is now
// regenerated wholesale by the Supabase CLI (supabase gen types
// typescript), which only knows the raw schema. Postgres has role as a
// plain text column, not an enum, so this union is an app-level
// constraint the generated type can't express — hand-maintained here
// is correct, not a workaround.
export type UserRole = "customer" | "vendor" | "driver";
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Customer-facing subset of the full DB order status (OrderStatusDB in
// database.ts). The DB also has "assigned" and "declined" — the customer
// view collapses "assigned" into "confirmed" and never shows "declined"
// distinctly from "cancelled" (both read as the order not going ahead).
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "en_route"
  | "delivered"
  | "cancelled";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarInitials: string;
  location: string;
  latitude: number;
  longitude: number;
}

export interface OrderItem {
  vendorId: string;
  vendorName: string;
  productId: string;
  productName: string;
  category: InventoryCategory;
  quantity: number;
  unitPrice: number;
  unit: string;
}

export interface Driver {
  id: string;
  name: string;
  initials: string;
  phone: string;
  vehicle: string;
  etaMinutes: number;
}

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed";

export interface Order {
  id: string;
  customerId: string;
  item: OrderItem;
  status: OrderStatus;
  driver?: Driver;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  deliveredAt?: string;
}

export interface MonthlyStats {
  totalItems: number;
  totalOrders: number;
  totalSpent: number;
}
