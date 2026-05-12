export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      affiliates: {
        Row: {
          id: string
          type: string
          referral_code: string
          commission_rate: number
          total_referrals: number
          total_earned: number
          total_paid: number
          bank_account: Json | null
          created_at: string
        }
        Insert: {
          id: string
          type?: string
          referral_code: string
          commission_rate?: number
          total_referrals?: number
          total_earned?: number
          total_paid?: number
          bank_account?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          referral_code?: string
          commission_rate?: number
          total_referrals?: number
          total_earned?: number
          total_paid?: number
          bank_account?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'affiliates_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      affiliate_program: {
        Row: {
          user_id: string
          referral_code: string
          commission_rate_percentage: number
          paid_referrals_count: number
          total_earnings_kobo: number
          created_at: string
        }
        Insert: {
          user_id: string
          referral_code: string
          commission_rate_percentage?: number
          paid_referrals_count?: number
          total_earnings_kobo?: number
          created_at?: string
        }
        Update: {
          user_id?: string
          referral_code?: string
          commission_rate_percentage?: number
          paid_referrals_count?: number
          total_earnings_kobo?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'affiliate_program_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      event_analytics: {
        Row: {
          id: string
          event_id: string | null
          metric: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          metric: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          metric?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'event_analytics_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          }
        ]
      }
      events: {
        Row: {
          id: string
          host_id: string
          name: string
          event_date: string | null
          hashtag: string | null
          plan: string
          status: string
          qr_url: string | null
          gallery_url: string | null
          upload_count: number
          upload_limit: number
          page_expires_at: string | null
          storage_expires_at: string | null
          custom_color: string | null
          custom_logo: string | null
          landing_config: Json | null
          // Added by migration
          event_status: string | null
          is_permanent_qr: boolean | null
          active_page_expiry: string | null
          storage_expiry: string | null
          upload_limit_total: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          host_id: string
          name: string
          event_date?: string | null
          hashtag?: string | null
          plan?: string
          status?: string
          qr_url?: string | null
          gallery_url?: string | null
          upload_count?: number
          upload_limit?: number
          page_expires_at?: string | null
          storage_expires_at?: string | null
          custom_color?: string | null
          custom_logo?: string | null
          landing_config?: Json | null
          event_status?: string | null
          is_permanent_qr?: boolean | null
          active_page_expiry?: string | null
          storage_expiry?: string | null
          upload_limit_total?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          host_id?: string
          name?: string
          event_date?: string | null
          hashtag?: string | null
          plan?: string
          status?: string
          qr_url?: string | null
          gallery_url?: string | null
          upload_count?: number
          upload_limit?: number
          page_expires_at?: string | null
          storage_expires_at?: string | null
          custom_color?: string | null
          custom_logo?: string | null
          landing_config?: Json | null
          event_status?: string | null
          is_permanent_qr?: boolean | null
          active_page_expiry?: string | null
          storage_expiry?: string | null
          upload_limit_total?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'events_host_id_fkey'
            columns: ['host_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      payments: {
        Row: {
          id: string
          user_id: string | null
          paystack_ref: string | null
          amount_kobo: number
          plan: string | null
          type: string
          status: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          paystack_ref?: string | null
          amount_kobo: number
          plan?: string | null
          type?: string
          status?: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          paystack_ref?: string | null
          amount_kobo?: number
          plan?: string | null
          type?: string
          status?: string
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          plan_type: string
          referral_code: string | null
          referred_by: string | null
          is_unlimited: boolean | null
          onboarding_complete: boolean | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          plan_type?: string
          referral_code?: string | null
          referred_by?: string | null
          is_unlimited?: boolean | null
          onboarding_complete?: boolean | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          plan_type?: string
          referral_code?: string | null
          referred_by?: string | null
          is_unlimited?: boolean | null
          onboarding_complete?: boolean | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      reels: {
        Row: {
          id: string
          event_id: string
          url: string | null
          status: string
          // Extended columns (in DB but not in original schema.sql)
          type: string | null
          upload_ids: string[] | null
          music_track: string | null
          published_to_gallery: boolean | null
          formats: Json | null
          output_url: string | null
          draft_url: string | null
          completed_at: string | null
          shotstack_render_id: string | null
          // Added by migration
          error_msg: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          url?: string | null
          status?: string
          type?: string | null
          upload_ids?: string[] | null
          music_track?: string | null
          published_to_gallery?: boolean | null
          formats?: Json | null
          output_url?: string | null
          draft_url?: string | null
          completed_at?: string | null
          shotstack_render_id?: string | null
          error_msg?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          url?: string | null
          status?: string
          type?: string | null
          upload_ids?: string[] | null
          music_track?: string | null
          published_to_gallery?: boolean | null
          formats?: Json | null
          output_url?: string | null
          draft_url?: string | null
          completed_at?: string | null
          shotstack_render_id?: string | null
          error_msg?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reels_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          }
        ]
      }
      referrals: {
        Row: {
          id: string
          affiliate_id: string
          referred_user_id: string | null
          event_id: string | null
          subscription_id: string | null
          amount_kobo: number
          commission_kobo: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          affiliate_id: string
          referred_user_id?: string | null
          event_id?: string | null
          subscription_id?: string | null
          amount_kobo?: number
          commission_kobo?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          affiliate_id?: string
          referred_user_id?: string | null
          event_id?: string | null
          subscription_id?: string | null
          amount_kobo?: number
          commission_kobo?: number
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'referrals_affiliate_id_fkey'
            columns: ['affiliate_id']
            isOneToOne: false
            referencedRelation: 'affiliates'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'referrals_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'referrals_referred_user_id_fkey'
            columns: ['referred_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string | null
          plan: string
          status: string
          paystack_sub_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          plan: string
          status?: string
          paystack_sub_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          plan?: string
          status?: string
          paystack_sub_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      uploads: {
        Row: {
          id: string
          event_id: string
          original_url: string
          display_url: string | null
          type: string
          size_bytes: number | null
          duration_secs: number | null
          status: string
          moderation_ok: boolean | null
          guest_ip_hash: string | null
          flagged_for_reel: boolean
          // Added by migration
          guest_name: string | null
          guest_session_id: string | null
          approved: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          original_url: string
          display_url?: string | null
          type: string
          size_bytes?: number | null
          duration_secs?: number | null
          status?: string
          moderation_ok?: boolean | null
          guest_ip_hash?: string | null
          flagged_for_reel?: boolean
          guest_name?: string | null
          guest_session_id?: string | null
          approved?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          original_url?: string
          display_url?: string | null
          type?: string
          size_bytes?: number | null
          duration_secs?: number | null
          status?: string
          moderation_ok?: boolean | null
          guest_ip_hash?: string | null
          flagged_for_reel?: boolean
          guest_name?: string | null
          guest_session_id?: string | null
          approved?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'uploads_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          }
        ]
      }
      user_entitlements: {
        Row: {
          user_id: string
          current_plan_id: string
          event_credits: number
          is_unlimited_events: boolean
          subscription_status: string
          payment_customer_id: string | null
          plan_expiry_date: string | null
          ai_reel_generations_remaining: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          current_plan_id?: string
          event_credits?: number
          is_unlimited_events?: boolean
          subscription_status?: string
          payment_customer_id?: string | null
          plan_expiry_date?: string | null
          ai_reel_generations_remaining?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          current_plan_id?: string
          event_credits?: number
          is_unlimited_events?: boolean
          subscription_status?: string
          payment_customer_id?: string | null
          plan_expiry_date?: string | null
          ai_reel_generations_remaining?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_entitlements_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_upload_count: {
        Args: { event_id_input: string }
        Returns: undefined
      }
      increment_upload_limit: {
        Args: { event_id: string; amount: number }
        Returns: undefined
      }
      increment_affiliate_earnings: {
        Args: {
          affiliate_id_input: string
          commission_input: number
        }
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

type DefaultSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never
