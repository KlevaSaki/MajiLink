export type VendorOrderStatus =
  | "incoming"
  | "confirmed"
  | "assigned"
  | "en_route"
  | "delivered"
  | "declined";

export interface VendorOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerInitials: string;
  customerLocation: string;
  distanceKm: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: VendorOrderStatus;
  assignedDriverId?: string;
  createdAt: string;
  deliveredAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  maxStock: number;
  pricePerUnit: number;
  unit: string;
}

export interface VendorDriver {
  id: string;
  name: string;
  initials: string;
  vehicle: string;
  rating: number;
  status: "available" | "on_delivery" | "offline";
  currentOrderId?: string;
}

export interface VendorProfile {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  location: string;
  isOpen: boolean;
  rating: number;
  avatarInitials: string;
}

export interface VendorEarnings {
  todayEarnings: number;
  todayOrders: number;
  monthEarnings: number;
  monthGrowthPercent: number;
}
