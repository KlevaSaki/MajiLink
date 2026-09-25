export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line: string
          created_at: string
          id: number
          is_default: boolean
          label: string
          lat: number | null
          lng: number | null
          profile_id: string
        }
        Insert: {
          address_line?: string
          created_at?: string
          id?: number
          is_default?: boolean
          label?: string
          lat?: number | null
          lng?: number | null
          profile_id: string
        }
        Update: {
          address_line?: string
          created_at?: string
          id?: number
          is_default?: boolean
          label?: string
          lat?: number | null
          lng?: number | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      businesses: {
        Row: {
          business_name: string
          created_at: string
          id: number
          is_open: boolean
          latitude: number | null
          location: string | null
          longitude: number | null
          owner_id: string
          rating: number
        }
        Insert: {
          business_name?: string
          created_at?: string
          id?: number
          is_open?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          owner_id: string
          rating?: number
        }
        Update: {
          business_name?: string
          created_at?: string
          id?: number
          is_open?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          owner_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          business_id: number | null
          created_at: string
          id: number
          is_online: boolean
          latitude: number | null
          location_updated_at: string | null
          longitude: number | null
          profile_id: string
          rating: number
          status: string
          total_reviews: number
          vehicle_type: string
        }
        Insert: {
          business_id?: number | null
          created_at?: string
          id?: number
          is_online?: boolean
          latitude?: number | null
          location_updated_at?: string | null
          longitude?: number | null
          profile_id: string
          rating?: number
          status?: string
          total_reviews?: number
          vehicle_type?: string
        }
        Update: {
          business_id?: number | null
          created_at?: string
          id?: number
          is_online?: boolean
          latitude?: number | null
          location_updated_at?: string | null
          longitude?: number | null
          profile_id?: string
          rating?: number
          status?: string
          total_reviews?: number
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "vendor_payouts_due"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "drivers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mpesa_transactions: {
        Row: {
          amount: number
          checkout_request_id: string
          created_at: string
          id: number
          merchant_request_id: string | null
          mpesa_receipt: string | null
          order_id: number
          phone: string
          raw_callback: Json | null
          result_code: number | null
          result_desc: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          checkout_request_id: string
          created_at?: string
          id?: never
          merchant_request_id?: string | null
          mpesa_receipt?: string | null
          order_id: number
          phone: string
          raw_callback?: Json | null
          result_code?: number | null
          result_desc?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          checkout_request_id?: string
          created_at?: string
          id?: never
          merchant_request_id?: string | null
          mpesa_receipt?: string | null
          order_id?: number
          phone?: string
          raw_callback?: Json | null
          result_code?: number | null
          result_desc?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mpesa_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          business_id: number
          cancelled_by: string | null
          claimed_at: string | null
          created_at: string
          customer_id: string
          delivered_at: string | null
          delivery_address: string
          delivery_lat: number | null
          delivery_lng: number | null
          driver_id: number | null
          driver_paid_out_at: string | null
          driver_payout: number | null
          id: number
          issue_reason: string | null
          mpesa_checkout_request_id: string | null
          mpesa_receipt: string | null
          paid_at: string | null
          payment_status: string
          picked_up_at: string | null
          platform_commission: number | null
          product_id: number
          quantity: number
          ready_at: string | null
          status: string
          tax_reserved: number
          total_amount: number
          vendor_paid_out_at: string | null
          vendor_payout: number | null
        }
        Insert: {
          business_id: number
          cancelled_by?: string | null
          claimed_at?: string | null
          created_at?: string
          customer_id: string
          delivered_at?: string | null
          delivery_address?: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          driver_id?: number | null
          driver_paid_out_at?: string | null
          driver_payout?: number | null
          id?: number
          issue_reason?: string | null
          mpesa_checkout_request_id?: string | null
          mpesa_receipt?: string | null
          paid_at?: string | null
          payment_status?: string
          picked_up_at?: string | null
          platform_commission?: number | null
          product_id: number
          quantity?: number
          ready_at?: string | null
          status?: string
          tax_reserved?: number
          total_amount?: number
          vendor_paid_out_at?: string | null
          vendor_payout?: number | null
        }
        Update: {
          business_id?: number
          cancelled_by?: string | null
          claimed_at?: string | null
          created_at?: string
          customer_id?: string
          delivered_at?: string | null
          delivery_address?: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          driver_id?: number | null
          driver_paid_out_at?: string | null
          driver_payout?: number | null
          id?: number
          issue_reason?: string | null
          mpesa_checkout_request_id?: string | null
          mpesa_receipt?: string | null
          paid_at?: string | null
          payment_status?: string
          picked_up_at?: string | null
          platform_commission?: number | null
          product_id?: number
          quantity?: number
          ready_at?: string | null
          status?: string
          tax_reserved?: number
          total_amount?: number
          vendor_paid_out_at?: string | null
          vendor_payout?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "vendor_payouts_due"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_payouts_due"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_queue: {
        Row: {
          amount: number
          attempts: number
          claimed_at: string | null
          conversation_id: string | null
          created_at: string
          id: number
          last_error: string | null
          max_attempts: number
          mpesa_receipt: string | null
          order_ids: number[]
          originator_conversation_id: string | null
          phone: string
          processed_at: string | null
          recipient_id: number
          recipient_type: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          attempts?: number
          claimed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: never
          last_error?: string | null
          max_attempts?: number
          mpesa_receipt?: string | null
          order_ids: number[]
          originator_conversation_id?: string | null
          phone: string
          processed_at?: string | null
          recipient_id: number
          recipient_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          attempts?: number
          claimed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: never
          last_error?: string | null
          max_attempts?: number
          mpesa_receipt?: string | null
          order_ids?: number[]
          originator_conversation_id?: string | null
          phone?: string
          processed_at?: string | null
          recipient_id?: number
          recipient_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      product: {
        Row: {
          brand: string | null
          business_id: number
          category: string | null
          created_at: string
          id: number
          image_url: string | null
          max_stock: number
          name: string
          price_per_unit: number
          stock: number
          unit: string
          variant: string | null
        }
        Insert: {
          brand?: string | null
          business_id: number
          category?: string | null
          created_at?: string
          id?: number
          image_url?: string | null
          max_stock?: number
          name?: string
          price_per_unit?: number
          stock?: number
          unit?: string
          variant?: string | null
        }
        Update: {
          brand?: string | null
          business_id?: number
          category?: string | null
          created_at?: string
          id?: number
          image_url?: string | null
          max_stock?: number
          name?: string
          price_per_unit?: number
          stock?: number
          unit?: string
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "vendor_payouts_due"
            referencedColumns: ["business_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          phone: string
          role: string
          wallet_balance: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          phone: string
          role: string
          wallet_balance?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string
          role?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
    }
    Views: {
      driver_payouts_due: {
        Row: {
          driver_id: number | null
          driver_name: string | null
          driver_phone: string | null
          order_ids: number[] | null
          orders_count: number | null
          total_due: number | null
        }
        Relationships: []
      }
      vendor_payouts_due: {
        Row: {
          business_id: number | null
          business_name: string | null
          order_ids: number[] | null
          orders_count: number | null
          owner_id: string | null
          owner_phone: string | null
          total_due: number | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      claim_order: {
        Args: { p_order_id: number }
        Returns: {
          business_id: number
          cancelled_by: string | null
          claimed_at: string | null
          created_at: string
          customer_id: string
          delivered_at: string | null
          delivery_address: string
          delivery_lat: number | null
          delivery_lng: number | null
          driver_id: number | null
          driver_paid_out_at: string | null
          driver_payout: number | null
          id: number
          issue_reason: string | null
          mpesa_checkout_request_id: string | null
          mpesa_receipt: string | null
          paid_at: string | null
          payment_status: string
          picked_up_at: string | null
          platform_commission: number | null
          product_id: number
          quantity: number
          ready_at: string | null
          status: string
          tax_reserved: number
          total_amount: number
          vendor_paid_out_at: string | null
          vendor_payout: number | null
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_payout_batch: {
        Args: { p_batch_size?: number }
        Returns: {
          amount: number
          attempts: number
          claimed_at: string | null
          conversation_id: string | null
          created_at: string
          id: number
          last_error: string | null
          max_attempts: number
          mpesa_receipt: string | null
          order_ids: number[]
          originator_conversation_id: string | null
          phone: string
          processed_at: string | null
          recipient_id: number
          recipient_type: string
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "payout_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
