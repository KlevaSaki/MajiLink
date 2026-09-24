export type DriverStatus = "available" | "offline" | "on_delivery";

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
  // Drives which action the UI shows: "assigned" needs a pickup
  // confirmation before it can be marked delivered; "en_route" is past
  // that point.
  status: "assigned" | "en_route";
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

// No per-star breakdown exists anywhere in the schema — nothing writes
// five/four/three/two/one counts. Kept as a type for when a real rating
// system exists, but RatingCard now treats it as optional rather than
// any component inventing percentages to fill it.
export interface RatingBreakdown {
  five: number;
  four: number;
  three: number;
  two: number;
  one: number;
}
