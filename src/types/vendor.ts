// VendorOrderStatus maps onto the DB order status as follows:
//   "incoming"         ↔ DB "pending"   (renamed for the vendor's inbox framing)
//   "confirmed"        ↔ DB "confirmed" (accepted, still preparing)
//   "ready_for_pickup" ↔ DB "ready_for_pickup" (visible to the driver pool)
//   "assigned"         ↔ DB "assigned"  (a driver claimed it)
//   "en_route"         ↔ DB "en_route"
//   "delivered"        ↔ DB "delivered"
//   "declined"         ↔ DB "declined", and also DB "cancelled" — both
//                        surface in the vendor's history list.
export type VendorOrderStatus =
  | "incoming"
  | "confirmed"
  | "ready_for_pickup"
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
  paymentStatus: "unpaid" | "pending" | "paid" | "failed";
  /** Only meaningful once paymentStatus is "paid" — set server-side by
   *  the M-Pesa callback, never computed client-side. */
  vendorPayout?: number;
  createdAt: string;
  deliveredAt?: string;
}

export type InventoryCategory = "water" | "lpg";

export interface InventoryItem {
  id: string;
  category: InventoryCategory;
  name: string;
  stock: number;
  maxStock: number;
  pricePerUnit: number;
  unit: string;
  // Only meaningful for category "lpg" — e.g. "Refill" or "New cylinder + gas"
  variant?: string;
  // Brand/product line from the shared catalog, e.g. "K-gas", "Dasani", "Accessories"
  brand?: string;
  // Path/URL to the shared catalog image for this product — consistent across vendors
  imageUrl?: string;
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
  latitude: number;
  longitude: number;
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
