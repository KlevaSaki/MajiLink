export type UserRole = "customer" | "vendor" | "driver";

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
          is_open: boolean;
          rating: number;
        };
        Insert: {
          owner_id: string;
          business_name: string;
          location?: string | null;
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
        };
        Insert: {
          business_id: number;
          name: string;
          unit: string;
          price_per_unit: number;
          stock?: number;
          max_stock?: number;
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
          status: "pending" | "confirmed" | "en_route" | "delivered" | "cancelled";
          delivery_address: string;
          delivered_at: string | null;
        };
        Insert: {
          customer_id: string;
          business_id: number;
          product_id: number;
          driver_id?: number | null;
          quantity: number;
          total_amount: number;
          status?: "pending" | "confirmed" | "en_route" | "delivered" | "cancelled";
          delivery_address: string;
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
