import { useState, useEffect, useCallback } from 'react'
import { usePrivyWallet as useWallet } from '@/hooks/use-privy-wallet'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { LeaderboardEntry } from '@/lib/database.types'

interface UseLeaderboardState {
  leaderboard: LeaderboardEntry[]
  userRank: LeaderboardEntry | null
  loading: boolean
  error: string | null
  isConfigured: boolean
}

interface UseLeaderboardReturn extends UseLeaderboardState {
  refreshLeaderboard: () => Promise<void>
  getUserRank: () => Promise<LeaderboardEntry | null>
}

export const useLeaderboard = (limit: number = 50): UseLeaderboardReturn => {
  const { publicKey, connected } = useWallet()
  const [state, setState] = useState<UseLeaderboardState>({
    leaderboard: [],
    userRank: null,
    loading: false,
    error: null,
    isConfigured: isSupabaseConfigured
  })

  const refreshLeaderboard = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setState(prev => ({ ...prev, loading: false, error: 'Supabase not configured' }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      console.log('🏆 Fetching leaderboard data...')
      
      // Fetch leaderboard data
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .limit(limit)

      if (error) {
        console.error('❌ Error fetching leaderboard:', error)
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message || 'Failed to fetch leaderboard' 
        }))
        return
      }

      console.log('✅ Leaderboard fetched:', data?.length, 'entries')

      setState(prev => ({ 
        ...prev, 
        leaderboard: data || [], 
        loading: false, 
        error: null 
      }))

    } catch (error) {
      console.error('❌ Error in refreshLeaderboard:', error)
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }))
    }
  }, [isSupabaseConfigured, limit])

  const getUserRank = useCallback(async (): Promise<LeaderboardEntry | null> => {
    if (!connected || !publicKey || !isSupabaseConfigured) {
      return null
    }

    try {
      const walletAddress = publicKey.toString()
      console.log('🔍 Fetching user rank for:', walletAddress)
      
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('❌ Error fetching user rank:', error)
        return null
      }

      if (data) {
        console.log('✅ User rank fetched:', {
          rank: data.rank,
          points: data.total_points_earned,
          winRate: data.win_rate_percentage
        })
        
        setState(prev => ({ ...prev, userRank: data }))
        return data
      }

      return null

    } catch (error) {
      console.error('❌ Error in getUserRank:', error)
      return null
    }
  }, [connected, publicKey, isSupabaseConfigured])

  // Fetch leaderboard on mount and when configuration changes
  useEffect(() => {
    if (isSupabaseConfigured) {
      refreshLeaderboard()
    }
  }, [refreshLeaderboard, isSupabaseConfigured])

  // Fetch user rank when wallet connects
  useEffect(() => {
    if (connected && publicKey && isSupabaseConfigured) {
      getUserRank()
    } else {
      setState(prev => ({ ...prev, userRank: null }))
    }
  }, [connected, publicKey, getUserRank, isSupabaseConfigured])

  return {
    ...state,
    refreshLeaderboard,
    getUserRank
  }
} 