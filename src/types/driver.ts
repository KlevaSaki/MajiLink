export type DriverStatus = "online" | "offline" | "on_delivery";

export type TripStatus = "assigned" | "en_route" | "delivered" | "cancelled";

export interface DriverProfile {
  id: string;
  name: string;
  initials: string;
  phone: string;
  vehicle: string;
  vendorId: string;
  vendorName: string;
  status: DriverStatus;
  rating: number;
  totalReviews: number;
}

export interface DeliveryStop {
  label: "Pickup" | "Drop-off";
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

export interface ActiveDelivery {
  orderId: string;
  vendorOrderId: string;
  customerName: string;
  customerInitials: string;
  customerPhone: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  pickup: DeliveryStop;
  dropoff: DeliveryStop;
  distanceKm: number;
  estimatedMinutes: number;
  earningsForTrip: number;
  assignedAt: string;
}

export interface CompletedTrip {
  id: string;
  orderId: string;
  customerName: string;
  customerInitials: string;
  fromName: string;
  toName: string;
  toAddress: string;
  distanceKm: number;
  durationMinutes: number;
  earnings: number;
  status: TripStatus;
  completedAt: string;
  rating?: number;
}

export interface DriverEarnings {
  todayEarnings: number;
  todayTrips: number;
  weekEarnings: number;
  weekTrips: number;
  pendingPayout: number;
}

export interface RatingBreakdown {
  five: number;
  four: number;
  three: number;
  two: number;
  one: number;
}
