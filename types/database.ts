// Auto-generated Supabase types — run: npx supabase gen types typescript --project-id tlefiyfkhlufkxojqebt > types/database.ts
// For now, use this manual version that matches our schema exactly.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          plan_type: 'individual' | 'business' | 'planner'
          is_admin: boolean
          referral_code: string | null
          referred_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      events: {
        Row: {
          id: string
          host_id: string
          name: string
          event_date: string | null
          hashtag: string | null
          plan: 'free' | 'flex' | 'pro'
          status: 'active' | 'expired' | 'paused'
          qr_url: string | null
          gallery_url: string | null
          upload_limit: number
          upload_count: number
          page_expires_at: string | null
          storage_expires_at: string | null
          custom_color: string | null
          custom_logo: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'upload_count'>
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }
      uploads: {
        Row: {
          id: string
          event_id: string
          original_url: string
          display_url: string | null
          type: 'photo' | 'video'
          size_bytes: number | null
          duration_secs: number | null
          status: 'processing' | 'ready' | 'flagged' | 'deleted'
          moderation_ok: boolean | null
          guest_ip_hash: string | null
          flagged_for_reel: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['uploads']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['uploads']['Insert']>
      }
      reels: {
        Row: {
          id: string
          event_id: string
          type: 'basic' | 'advanced'
          status: 'queued' | 'processing' | 'complete' | 'failed'
          output_url: string | null
          formats: Json | null
          music_track: string | null
          upload_ids: string[]
          retry_count: number
          error_msg: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['reels']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reels']['Insert']>
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: string
          status: 'active' | 'paused' | 'cancelled'
          paystack_sub_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
      affiliates: {
        Row: {
          id: string
          type: string | null
          referral_code: string
          commission_rate: number
          total_referrals: number
          total_earned: number
          total_paid: number
          bank_account: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['affiliates']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['affiliates']['Insert']>
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
          status: 'pending' | 'confirmed' | 'paid'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['referrals']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['referrals']['Insert']>
      }
      payments: {
        Row: {
          id: string
          user_id: string | null
          paystack_ref: string
          amount_kobo: number
          plan: string | null
          type: 'one_time' | 'subscription' | 'addon'
          status: 'pending' | 'success' | 'failed'
          metadata: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
    }
  }
}
