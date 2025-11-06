/**
 * Database Types for RPS MagicBlock Game
 * Generated types based on Supabase schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          wallet_address: string
          points_balance: number
          total_points_earned: number
          total_games: number
          wins: number
          losses: number
          referral_code: string | null
          referred_by: string | null
          referral_count: number
          referral_earnings: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          points_balance?: number
          total_points_earned?: number
          total_games?: number
          wins?: number
          losses?: number
          referral_code?: string | null
          referred_by?: string | null
          referral_count?: number
          referral_earnings?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          points_balance?: number
          total_points_earned?: number
          total_games?: number
          wins?: number
          losses?: number
          referral_code?: string | null
          referred_by?: string | null
          referral_count?: number
          referral_earnings?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_history: {
        Row: {
          id: string
          game_id: string
          player1_wallet: string
          player2_wallet: string
          winner_wallet: string | null
          currency_used: 'points' | 'sol'
          amount_bet: number
          pot_amount: number | null
          platform_fee: number | null
          winner_payout: number | null
          game_status: 'completed' | 'abandoned' | 'error'
          started_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player1_wallet: string
          player2_wallet: string
          winner_wallet?: string | null
          currency_used: 'points' | 'sol'
          amount_bet: number
          pot_amount?: number | null
          platform_fee?: number | null
          winner_payout?: number | null
          game_status?: 'completed' | 'abandoned' | 'error'
          started_at: string
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          player1_wallet?: string
          player2_wallet?: string
          winner_wallet?: string | null
          currency_used?: 'points' | 'sol'
          amount_bet?: number
          pot_amount?: number | null
          platform_fee?: number | null
          winner_payout?: number | null
          game_status?: 'completed' | 'abandoned' | 'error'
          started_at?: string
          completed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          id: string
          referrer_wallet: string
          referred_wallet: string
          referral_code: string
          status: 'pending' | 'active' | 'rewarded'
          activation_game_id: string | null
          created_at: string
          activated_at: string | null
          rewarded_at: string | null
        }
        Insert: {
          id?: string
          referrer_wallet: string
          referred_wallet: string
          referral_code: string
          status?: 'pending' | 'active' | 'rewarded'
          activation_game_id?: string | null
          created_at?: string
          activated_at?: string | null
          rewarded_at?: string | null
        }
        Update: {
          id?: string
          referrer_wallet?: string
          referred_wallet?: string
          referral_code?: string
          status?: 'pending' | 'active' | 'rewarded'
          activation_game_id?: string | null
          created_at?: string
          activated_at?: string | null
          rewarded_at?: string | null
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          id: string
          referral_id: string
          referrer_wallet: string
          referred_wallet: string
          reward_type: 'signup_bonus' | 'first_game_bonus' | 'game_commission' | 'sol_commission'
          points_awarded: number
          sol_amount: number
          game_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          referral_id: string
          referrer_wallet: string
          referred_wallet: string
          reward_type: 'signup_bonus' | 'first_game_bonus' | 'game_commission'
          points_awarded: number
          game_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          referral_id?: string
          referrer_wallet?: string
          referred_wallet?: string
          reward_type?: 'signup_bonus' | 'first_game_bonus' | 'game_commission'
          points_awarded?: number
          game_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard: {
        Row: {
          rank: number
          wallet_address: string
          total_points_earned: number
          wins: number
          losses: number
          total_games: number
          win_rate_percentage: number
          points_balance: number
          created_at: string
        }
        Relationships: []
      }
      referral_stats: {
        Row: {
          wallet_address: string
          referral_code: string
          referral_count: number
          referral_earnings: number
          active_referrals: number
          pending_referrals: number
        }
        Relationships: []
      }
    }
    Functions: {
      get_or_create_user_profile: {
        Args: {
          user_wallet: string
        }
        Returns: Database['public']['Tables']['user_profiles']['Row']
      }
      update_user_game_stats: {
        Args: {
          user_wallet: string
          won: boolean
          points_change?: number
          game_currency?: string
          game_id?: string
        }
        Returns: Database['public']['Tables']['user_profiles']['Row']
      }
      create_referral: {
        Args: {
          referrer_code: string
          new_user_wallet: string
        }
        Returns: Json
      }
      activate_referral: {
        Args: {
          user_wallet: string
          game_id: string
        }
        Returns: Json
      }
      process_referral_commission: {
        Args: {
          winner_wallet: string
          game_id: string
          points_won: number
        }
        Returns: Json
      }
      generate_referral_code: {
        Args: {
          user_wallet: string
        }
        Returns: string
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

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type GameHistory = Database['public']['Tables']['game_history']['Row']
export type LeaderboardEntry = Database['public']['Views']['leaderboard']['Row']
export type Referral = Database['public']['Tables']['referrals']['Row']
export type ReferralReward = Database['public']['Tables']['referral_rewards']['Row']
export type ReferralStats = Database['public']['Views']['referral_stats']['Row']

export type GameCurrency = 'points' | 'sol'
export type GameStatus = 'completed' | 'abandoned' | 'error'
export type ReferralStatus = 'pending' | 'active' | 'rewarded'
export type RewardType = 'signup_bonus' | 'first_game_bonus' | 'game_commission' 