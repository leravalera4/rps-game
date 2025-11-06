import { useState, useEffect, useCallback, useRef } from 'react'
import { usePrivyWallet as useWallet } from '@/hooks/use-privy-wallet'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { UserProfile } from '@/lib/database.types'

interface UseUserProfileState {
  profile: UserProfile | null
  loading: boolean
  updating: boolean
  error: string | null
  isConfigured: boolean
}

interface UseUserProfileReturn extends UseUserProfileState {
  refreshProfile: () => Promise<void>
  updatePointsBalance: (newBalance: number) => void
  optimisticPointsUpdate: (pointsChange: number, isWin: boolean) => Promise<void>
  hasEnoughPoints: (required?: number) => boolean
}

export const useUserProfile = (): UseUserProfileReturn => {
  const { publicKey, connected } = useWallet()
  const [state, setState] = useState<UseUserProfileState>({
    profile: null,
    loading: false,
    updating: false,
    error: null,
    isConfigured: isSupabaseConfigured
  })
  
  // Debounce mechanism to prevent rapid calls
  const lastFetchTime = useRef(0)
  const FETCH_DEBOUNCE_MS = 1000 // 1 second minimum between fetches

  const refreshProfile = useCallback(async () => {
    if (!connected || !publicKey || !isSupabaseConfigured) {
      setState(prev => ({ ...prev, profile: null, loading: false, error: null }))
      return
    }

    const walletAddress = publicKey.toString()
    
    // Debounce rapid calls
    const now = Date.now()
    if (now - lastFetchTime.current < FETCH_DEBOUNCE_MS) {
      console.log('🔄 Profile fetch debounced, too soon since last fetch')
      return
    }
    lastFetchTime.current = now
    
    // Prevent duplicate requests
    setState(prev => {
      if (prev.loading) {
        console.log('🔄 Profile already loading, skipping duplicate request')
        return prev
      }
      return { ...prev, loading: true, error: null }
    })

    try {
      console.log('🔍 Fetching user profile for:', walletAddress)
      
      // Call the get_or_create_user_profile function
      const { data, error } = await supabase
        .rpc('get_or_create_user_profile', { user_wallet: walletAddress })

      if (error) {
        console.error('❌ Error fetching user profile:', error)
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message || 'Failed to fetch user profile' 
        }))
        return
      }

      console.log('✅ User profile fetched:', {
        wallet: data.wallet_address,
        points: data.points_balance,
        totalEarned: data.total_points_earned,
        games: data.total_games,
        wins: data.wins
      })

      setState(prev => ({ 
        ...prev, 
        profile: data, 
        loading: false, 
        error: null 
      }))

    } catch (error) {
      // Handle network errors more gracefully
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Don't log network errors on page refresh/navigation
      if (errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
        console.log('🔄 Network error during profile fetch (likely page refresh), retrying...')
        // Retry once after a short delay
        setTimeout(() => {
          if (connected && publicKey && isSupabaseConfigured) {
            refreshProfile()
          }
        }, 1000)
      } else {
        console.error('❌ Error in refreshProfile:', error)
      }
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage.includes('NetworkError') ? null : errorMessage
      }))
    }
  }, [connected, publicKey, isSupabaseConfigured])

  // Optimistic update for points balance
  const updatePointsBalance = useCallback((newBalance: number) => {
    setState(prev => ({
      ...prev,
      profile: prev.profile ? {
        ...prev.profile,
        points_balance: newBalance
      } : null
    }))
  }, [])

  // Optimistic update for game completion
  const optimisticPointsUpdate = useCallback(async (pointsChange: number, isWin: boolean) => {
    if (!state.profile) return

    setState(prev => ({ ...prev, updating: true }))

    // Optimistically update the UI
    const newBalance = Math.max(0, state.profile.points_balance + pointsChange)
    const newTotalEarned = isWin ? state.profile.total_points_earned + 100 : state.profile.total_points_earned
    const newWins = isWin ? state.profile.wins + 1 : state.profile.wins
    const newLosses = !isWin ? state.profile.losses + 1 : state.profile.losses

    setState(prev => ({
      ...prev,
      profile: prev.profile ? {
        ...prev.profile,
        points_balance: newBalance,
        total_points_earned: newTotalEarned,
        total_games: prev.profile.total_games + 1,
        wins: newWins,
        losses: newLosses
      } : null
    }))

    // Then sync with the backend
    try {
      await refreshProfile()
      console.log('✅ Points balance synced with backend after game')
    } catch (error) {
      console.error('❌ Failed to sync points balance:', error)
      // Revert optimistic update on error
      setState(prev => ({ ...prev, profile: state.profile }))
    } finally {
      setState(prev => ({ ...prev, updating: false }))
    }
  }, [state.profile, refreshProfile])

  // Check if user has enough points
  const hasEnoughPoints = useCallback((required: number = 100) => {
    return state.profile ? state.profile.points_balance >= required : false
  }, [state.profile])

  // Fetch profile when wallet connects
  useEffect(() => {
    if (connected && publicKey && isSupabaseConfigured) {
      refreshProfile()
    } else {
      setState(prev => ({ ...prev, profile: null, loading: false, error: null }))
    }
  }, [connected, publicKey, isSupabaseConfigured]) // Removed refreshProfile from deps to prevent loop

  return {
    ...state,
    refreshProfile,
    updatePointsBalance,
    optimisticPointsUpdate,
    hasEnoughPoints
  }
} 