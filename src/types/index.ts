export type UserRole = "customer" | "vendor" | "driver";

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
}

export interface Vendor {
  id: string;
  name: string;
  location: string;
  rating: number;
  pricePerJerrican: number;
  available: boolean;
}

export interface OrderItem {
  vendorId: string;
  vendorName: string;
  quantity: number;
  unitPrice: number;
}

export interface Driver {
  id: string;
  name: string;
  initials: string;
  phone: string;
  vehicle: string;
  etaMinutes: number;
}

export interface Order {
  id: string;
  customerId: string;
  item: OrderItem;
  status: OrderStatus;
  driver?: Driver;
  totalAmount: number;
  createdAt: string;
  deliveredAt?: string;
}

export interface WalletState {
  balance: number;
  bonusCredit: number;
}

export interface MonthlyStats {
  totalLitres: number;
  totalOrders: number;
  totalSpent: number;
}
