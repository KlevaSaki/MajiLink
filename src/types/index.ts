import type { InventoryCategory } from "./vendor";
import type { UserRole } from "./database";

export type { UserRole };

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
