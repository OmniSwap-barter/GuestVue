// Auto-generated from live Supabase schema — do not edit by hand.
// Regenerate: npx supabase gen types typescript --project-id tlefiyfkhlufkxojqebt > types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
      affiliates: {
        Row: {
          bank_account: Json | null
          commission_rate: number
          created_at: string
          id: string
          referral_code: string
          total_earned: number
          total_paid: number
          total_referrals: number
          type: string | null
        }
        Insert: {
          bank_account?: Json | null
          commission_rate?: number
          created_at?: string
          id?: string
          referral_code: string
          total_earned?: number
          total_paid?: number
          total_referrals?: number
          type?: string | null
        }
        Update: {
          bank_account?: Json | null
          commission_rate?: number
          created_at?: string
          id?: string
          referral_code?: string
          total_earned?: number
          total_paid?: number
          total_referrals?: number
          type?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          custom_color: string | null
          custom_logo: string | null
          event_date: string | null
          gallery_url: string | null
          hashtag: string | null
          host_id: string
          id: string
          name: string
          page_expires_at: string | null
          plan: string
          qr_url: string | null
          status: string
          storage_expires_at: string | null
          upload_count: number
          upload_limit: number
        }
        Insert: {
          created_at?: string
          custom_color?: string | null
          custom_logo?: string | null
          event_date?: string | null
          gallery_url?: string | null
          hashtag?: string | null
          host_id: string
          id?: string
          name: string
          page_expires_at?: string | null
          plan?: string
          qr_url?: string | null
          status?: string
          storage_expires_at?: string | null
          upload_count?: number
          upload_limit?: number
        }
        Update: {
          created_at?: string
          custom_color?: string | null
          custom_logo?: string | null
          event_date?: string | null
          gallery_url?: string | null
          hashtag?: string | null
          host_id?: string
          id?: string
          name?: string
          page_expires_at?: string | null
          plan?: string
          qr_url?: string | null
          status?: string
          storage_expires_at?: string | null
          upload_count?: number
          upload_limit?: number
        }
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_kobo: number
          created_at: string
          id: string
          metadata: Json | null
          paystack_ref: string
          plan: string | null
          status: string
          type: string
          user_id: string | null
        }
        Insert: {
          amount_kobo: number
          created_at?: string
          id?: string
          metadata?: Json | null
          paystack_ref: string
          plan?: string | null
          status?: string
          type: string
          user_id?: string | null
        }
        Update: {
          amount_kobo?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          paystack_ref?: string
          plan?: string | null
          status?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_admin: boolean
          phone: string | null
          plan_type: string
          referral_code: string | null
          referred_by: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_admin?: boolean
          phone?: string | null
          plan_type?: string
          referral_code?: string | null
          referred_by?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean
          phone?: string | null
          plan_type?: string
          referral_code?: string | null
          referred_by?: string | null
        }
        Relationships: []
      }
      reels: {
        Row: {
          completed_at: string | null
          created_at: string
          error_msg: string | null
          event_id: string
          formats: Json | null
          id: string
          music_track: string | null
          output_url: string | null
          retry_count: number
          status: string
          type: string
          upload_ids: string[]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_msg?: string | null
          event_id: string
          formats?: Json | null
          id?: string
          music_track?: string | null
          output_url?: string | null
          retry_count?: number
          status?: string
          type: string
          upload_ids?: string[]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_msg?: string | null
          event_id?: string
          formats?: Json | null
          id?: string
          music_track?: string | null
          output_url?: string | null
          retry_count?: number
          status?: string
          type?: string
          upload_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "reels_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          affiliate_id: string
          amount_kobo: number
          commission_kobo: number
          created_at: string
          event_id: string | null
          id: string
          referred_user_id: string | null
          status: string
          subscription_id: string | null
        }
        Insert: {
          affiliate_id: string
          amount_kobo: number
          commission_kobo: number
          created_at?: string
          event_id?: string | null
          id?: string
          referred_user_id?: string | null
          status?: string
          subscription_id?: string | null
        }
        Update: {
          affiliate_id?: string
          amount_kobo?: number
          commission_kobo?: number
          created_at?: string
          event_id?: string | null
          id?: string
          referred_user_id?: string | null
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          paystack_sub_id: string | null
          plan: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          paystack_sub_id?: string | null
          plan: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          paystack_sub_id?: string | null
          plan?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      uploads: {
        Row: {
          created_at: string
          display_url: string | null
          duration_secs: number | null
          event_id: string
          flagged_for_reel: boolean
          guest_ip_hash: string | null
          id: string
          moderation_ok: boolean | null
          original_url: string
          size_bytes: number | null
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          display_url?: string | null
          duration_secs?: number | null
          event_id: string
          flagged_for_reel?: boolean
          guest_ip_hash?: string | null
          id?: string
          moderation_ok?: boolean | null
          original_url: string
          size_bytes?: number | null
          status?: string
          type: string
        }
        Update: {
          created_at?: string
          display_url?: string | null
          duration_secs?: number | null
          event_id?: string
          flagged_for_reel?: boolean
          guest_ip_hash?: string | null
          id?: string
          moderation_ok?: boolean | null
          original_url?: string
          size_bytes?: number | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_affiliate_earnings:
        | {
            Args: { affiliate_id_input: string; commission_input: number }
            Returns: undefined
          }
        | {
            Args: { affiliate_id_input: string; commission_input: number }
            Returns: undefined
          }
      increment_upload_count: {
        Args: { event_id_input: string }
        Returns: undefined
      }
      increment_upload_limit: {
        Args: { amount: number; event_id: string }
        Returns: undefined
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
