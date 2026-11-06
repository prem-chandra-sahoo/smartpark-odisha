export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_code: string
          cancelled_at: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          duration_hours: number
          end_at: string
          estimated_amount: number | null
          facility_id: string
          id: string
          slot_id: string
          start_at: string
          status: Database["public"]["Enums"]["booking_status"]
          user_id: string
          vehicle_number: string
          vehicle_type: Database["public"]["Enums"]["vehicle_kind"]
        }
        Insert: {
          booking_code: string
          cancelled_at?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          duration_hours: number
          end_at: string
          estimated_amount?: number | null
          facility_id: string
          id?: string
          slot_id: string
          start_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          user_id: string
          vehicle_number: string
          vehicle_type: Database["public"]["Enums"]["vehicle_kind"]
        }
        Update: {
          booking_code?: string
          cancelled_at?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          duration_hours?: number
          end_at?: string
          estimated_amount?: number | null
          facility_id?: string
          id?: string
          slot_id?: string
          start_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          user_id?: string
          vehicle_number?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_kind"]
        }
        Relationships: [
          {
            foreignKeyName: "bookings_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "parking_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "parking_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      parking_facilities: {
        Row: {
          address: string
          cancellation_cutoff_hours: number
          city: string
          closes_at: string
          contact_email: string | null
          contact_phone: string
          created_at: string
          description: string | null
          google_maps_url: string | null
          id: string
          images: string[]
          is_covered: boolean
          is_demo: boolean
          latitude: number
          longitude: number
          name: string
          open_24h: boolean
          opens_at: string
          operator_name: string
          operator_type: Database["public"]["Enums"]["operator_type"]
          owner_id: string
          rate_2w_daily: number | null
          rate_2w_hourly: number | null
          rate_4w_daily: number | null
          rate_4w_hourly: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rules: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          vehicle_types: Database["public"]["Enums"]["vehicle_kind"][]
        }
        Insert: {
          address: string
          cancellation_cutoff_hours?: number
          city: string
          closes_at?: string
          contact_email?: string | null
          contact_phone: string
          created_at?: string
          description?: string | null
          google_maps_url?: string | null
          id?: string
          images?: string[]
          is_covered?: boolean
          is_demo?: boolean
          latitude: number
          longitude: number
          name: string
          open_24h?: boolean
          opens_at?: string
          operator_name: string
          operator_type?: Database["public"]["Enums"]["operator_type"]
          owner_id: string
          rate_2w_daily?: number | null
          rate_2w_hourly?: number | null
          rate_4w_daily?: number | null
          rate_4w_hourly?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rules?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          vehicle_types?: Database["public"]["Enums"]["vehicle_kind"][]
        }
        Update: {
          address?: string
          cancellation_cutoff_hours?: number
          city?: string
          closes_at?: string
          contact_email?: string | null
          contact_phone?: string
          created_at?: string
          description?: string | null
          google_maps_url?: string | null
          id?: string
          images?: string[]
          is_covered?: boolean
          is_demo?: boolean
          latitude?: number
          longitude?: number
          name?: string
          open_24h?: boolean
          opens_at?: string
          operator_name?: string
          operator_type?: Database["public"]["Enums"]["operator_type"]
          owner_id?: string
          rate_2w_daily?: number | null
          rate_2w_hourly?: number | null
          rate_4w_daily?: number | null
          rate_4w_hourly?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rules?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          vehicle_types?: Database["public"]["Enums"]["vehicle_kind"][]
        }
        Relationships: []
      }
      parking_slots: {
        Row: {
          created_at: string
          facility_id: string
          floor_label: string
          id: string
          last_state_change: string
          sensor_id: string | null
          slot_code: string
          sort_order: number
          state: Database["public"]["Enums"]["slot_state"]
          vehicle_type: Database["public"]["Enums"]["vehicle_kind"]
        }
        Insert: {
          created_at?: string
          facility_id: string
          floor_label?: string
          id?: string
          last_state_change?: string
          sensor_id?: string | null
          slot_code: string
          sort_order?: number
          state?: Database["public"]["Enums"]["slot_state"]
          vehicle_type: Database["public"]["Enums"]["vehicle_kind"]
        }
        Update: {
          created_at?: string
          facility_id?: string
          floor_label?: string
          id?: string
          last_state_change?: string
          sensor_id?: string | null
          slot_code?: string
          sort_order?: number
          state?: Database["public"]["Enums"]["slot_state"]
          vehicle_type?: Database["public"]["Enums"]["vehicle_kind"]
        }
        Relationships: [
          {
            foreignKeyName: "parking_slots_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "parking_facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_facilities: {
        Row: {
          created_at: string
          facility_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          facility_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          facility_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_facilities_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "parking_facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_documents: {
        Row: {
          created_at: string
          document_number: string
          document_type: string
          expiry_date: string | null
          facility_id: string
          file_name: string | null
          file_path: string
          id: string
          issue_date: string | null
          issuing_authority: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_number: string
          document_type: string
          expiry_date?: string | null
          facility_id: string
          file_name?: string | null
          file_path: string
          id?: string
          issue_date?: string | null
          issuing_authority: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_number?: string
          document_type?: string
          expiry_date?: string | null
          facility_id?: string
          file_name?: string | null
          file_path?: string
          id?: string
          issue_date?: string | null
          issuing_authority?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "parking_facilities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_facility: { Args: { _facility_id: string }; Returns: boolean }
      cancel_booking: {
        Args: { _booking_id: string }
        Returns: {
          booking_code: string
          cancelled_at: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          duration_hours: number
          end_at: string
          estimated_amount: number | null
          facility_id: string
          id: string
          slot_id: string
          start_at: string
          status: Database["public"]["Enums"]["booking_status"]
          user_id: string
          vehicle_number: string
          vehicle_type: Database["public"]["Enums"]["vehicle_kind"]
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_booking: {
        Args: {
          _customer_email: string
          _customer_name: string
          _customer_phone: string
          _duration_hours: number
          _slot_id: string
          _start_at: string
          _vehicle_number: string
        }
        Returns: {
          booking_code: string
          cancelled_at: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          duration_hours: number
          end_at: string
          estimated_amount: number | null
          facility_id: string
          id: string
          slot_id: string
          start_at: string
          status: Database["public"]["Enums"]["booking_status"]
          user_id: string
          vehicle_number: string
          vehicle_type: Database["public"]["Enums"]["vehicle_kind"]
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      facility_stats: {
        Args: { _facility_ids: string[] }
        Returns: {
          available_2w: number
          available_4w: number
          available_slots: number
          facility_id: string
          occupied_slots: number
          reserved_slots: number
          total_2w: number
          total_4w: number
          total_slots: number
          unavailable_slots: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reserved_slot_ids: {
        Args: { _end: string; _facility_id: string; _start: string }
        Returns: string[]
      }
    }
    Enums: {
      app_role: "admin" | "owner" | "user"
      booking_status: "confirmed" | "cancelled" | "completed"
      operator_type:
        | "municipal"
        | "railway"
        | "airport"
        | "mall"
        | "hospital"
        | "private"
        | "other"
      slot_state: "available" | "occupied" | "unavailable"
      vehicle_kind: "two_wheeler" | "four_wheeler"
      verification_status: "pending" | "verified" | "rejected"
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
    Enums: {
      app_role: ["admin", "owner", "user"],
      booking_status: ["confirmed", "cancelled", "completed"],
      operator_type: [
        "municipal",
        "railway",
        "airport",
        "mall",
        "hospital",
        "private",
        "other",
      ],
      slot_state: ["available", "occupied", "unavailable"],
      vehicle_kind: ["two_wheeler", "four_wheeler"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
