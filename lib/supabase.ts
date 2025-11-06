/**
 * Supabase Configuration
 * Frontend Supabase client setup for RPS MagicBlock Game
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_project_url_here'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your_supabase_anon_key_here'

if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url_here') {
  console.warn('⚠️  SUPABASE_URL not configured. Please set environment variable.')
}

if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here') {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not configured. Please set environment variable.')
}

// Create Supabase client with TypeScript support
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export const isSupabaseConfigured = supabaseUrl !== 'your_supabase_project_url_here' && supabaseAnonKey !== 'your_supabase_anon_key_here' 