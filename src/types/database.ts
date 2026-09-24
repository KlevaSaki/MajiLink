export type UserRole = "customer" | "vendor" | "driver";

export type OrderStatusDB =
  | "pending"
  | "confirmed"
  | "assigned"
  | "en_route"
  | "delivered"
  | "cancelled"
  | "declined";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          email: string;
          name: string;
          phone: string;
          role: UserRole;
          avatar_url: string | null;
          wallet_balance: number;
          is_active: boolean;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          phone: string;
          role: UserRole;
          avatar_url?: string | null;
          wallet_balance?: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      businesses: {
        Row: {
          id: number;
          created_at: string;
          owner_id: string;
          business_name: string;
          location: string | null;
          latitude: number | null;
          longitude: number | null;
          is_open: boolean;
          rating: number;
        };
        Insert: {
          owner_id: string;
          business_name: string;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_open?: boolean;
          rating?: number;
        };
        Update: Partial<Database["public"]["Tables"]["businesses"]["Insert"]>;
      };
      drivers: {
        Row: {
          id: number;
          created_at: string;
          profile_id: string;
          business_id: number;
          vehicle_type: string;
          // Canonical status vocabulary — matches VendorDriver in types/vendor.ts.
          // driver.ts's own DriverStatus should be aligned to this set too
          // ("online" → "available") rather than kept as a separate enum.
          status: "available" | "on_delivery" | "offline";
          rating: number;
          total_reviews: number;
        };
        Insert: {
          profile_id: string;
          business_id: number;
          vehicle_type: string;
          status?: "available" | "on_delivery" | "offline";
          rating?: number;
          total_reviews?: number;
        };
        Update: Partial<Database["public"]["Tables"]["drivers"]["Insert"]>;
      };
      product: {
        Row: {
          id: number;
          created_at: string;
          business_id: number;
          name: string;
          unit: string;
          price_per_unit: number;
          stock: number;
          max_stock: number;
          category: "water" | "lpg" | null;
          brand: string | null;
          variant: string | null;
          image_url: string | null;
        };
        Insert: {
          business_id: number;
          name: string;
          unit: string;
          price_per_unit: number;
          stock?: number;
          max_stock?: number;
          category?: "water" | "lpg" | null;
          brand?: string | null;
          variant?: string | null;
          image_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["product"]["Insert"]>;
      };
      orders: {
        Row: {
          id: number;
          created_at: string;
          customer_id: string;
          business_id: number;
          product_id: number;
          driver_id: number | null;
          quantity: number;
          total_amount: number;
          status: OrderStatusDB;
          delivery_address: string;
          delivery_lat: number | null;
          delivery_lng: number | null;
          delivered_at: string | null;
        };
        Insert: {
          customer_id: string;
          business_id: number;
          product_id: number;
          driver_id?: number | null;
          quantity: number;
          total_amount: number;
          status?: OrderStatusDB;
          delivery_address: string;
          delivery_lat?: number | null;
          delivery_lng?: number | null;
          delivered_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      addresses: {
        Row: {
          id: number;
          created_at: string;
          profile_id: string;
          label: string;
          address_line: string;
          lat: number | null;
          lng: number | null;
          is_default: boolean;
        };
        Insert: {
          profile_id: string;
          label: string;
          address_line: string;
          lat?: number | null;
          lng?: number | null;
          is_default?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["addresses"]["Insert"]>;
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
