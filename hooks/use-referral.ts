import { useState, useEffect, useCallback } from 'react'
import { usePrivyWallet as useWallet } from '@/hooks/use-privy-wallet'
import { supabase } from '@/lib/supabase'
import type { ReferralStats, Referral, ReferralReward } from '@/lib/database.types'

interface UseReferralState {
  stats: ReferralStats | null
  referrals: Referral[]
  rewards: ReferralReward[]
  solEarnings: number // Total SOL earned in lamports
  loading: boolean
  error: string | null
}

interface UseReferralReturn extends UseReferralState {
  refreshStats: () => Promise<void>
  validateReferralCode: (code: string) => Promise<{ valid: boolean; error?: string }>
  createReferral: (code: string) => Promise<{ success: boolean; error?: string; signupBonus?: number; referrerBonus?: number }>
  copyReferralLink: () => Promise<void>
  getReferralUrl: () => string | null
  lamportsToSol: (lamports: number) => number
  getFormattedSolEarnings: () => string
}

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://last-backend-7d8f5fbc0943.herokuapp.com' 
  : 'https://last-backend-7d8f5fbc0943.herokuapp.com'

export const useReferral = (): UseReferralReturn => {
  const { publicKey, connected } = useWallet()
  const [state, setState] = useState<UseReferralState>({
    stats: null,
    referrals: [],
    rewards: [],
    solEarnings: 0,
    loading: false,
    error: null
  })

  const walletAddress = publicKey?.toString()

  const refreshStats = useCallback(async () => {
    if (!connected || !walletAddress) {
      setState(prev => ({ ...prev, stats: null, referrals: [], rewards: [], solEarnings: 0, error: null }))
      return
    }

    // Don't show loading if we already have some data
    setState(prev => ({ ...prev, loading: !prev.stats, error: null }))

    try {
      console.log('🔍 Fetching referral stats for:', walletAddress)

      // First ensure user profile exists (this will create referral code if needed)
      const { data: profileData, error: profileError } = await supabase
        .rpc('get_or_create_user_profile', { user_wallet: walletAddress })

      if (profileError) {
        console.error('❌ Error creating/fetching user profile:', profileError)
        setState(prev => ({ ...prev, loading: false, error: profileError.message }))
        return
      }

      console.log('✅ User profile ensured:', {
        wallet: profileData?.wallet_address,
        referralCode: profileData?.referral_code,
        referralCount: profileData?.referral_count,
        referralEarnings: profileData?.referral_earnings
      })

      // Check if referral code exists, if not try to generate one manually
      if (!profileData?.referral_code) {
        console.log('⚠️ No referral code in profile data, trying to generate manually...')
        
        // Try to generate referral code manually
        const { data: updatedProfile, error: updateError } = await supabase
          .rpc('generate_referral_code', { user_wallet: walletAddress })
        
        if (updateError || !updatedProfile) {
          console.log('⚠️ Database generation failed, using client-side generation...')
          // Generate a simple referral code on client side as fallback
          const clientCode = walletAddress.slice(0, 4).toUpperCase() + Math.floor(Math.random() * 10000).toString().padStart(4, '0')
          
          // Update user profile with the client-generated code
          const { error: clientUpdateError } = await supabase
            .from('user_profiles')
            .update({ referral_code: clientCode })
            .eq('wallet_address', walletAddress)
            
          if (clientUpdateError) {
            console.error('❌ Failed to update profile with client-generated code:', clientUpdateError)
            setState(prev => ({ ...prev, loading: false, error: 'Failed to generate referral code' }))
            return
          } else {
            console.log('✅ Client-generated referral code updated:', clientCode)
            profileData.referral_code = clientCode
          }
        } else {
          // Update user profile with the database-generated code
          const { error: profileUpdateError } = await supabase
            .from('user_profiles')
            .update({ referral_code: updatedProfile })
            .eq('wallet_address', walletAddress)
            
          if (profileUpdateError) {
            console.error('❌ Failed to update profile with referral code:', profileUpdateError)
          } else {
            console.log('✅ Referral code generated and updated:', updatedProfile)
            profileData.referral_code = updatedProfile
          }
        }
      }

      // Always use profile data as primary source for consistency
      const primaryStats = {
        wallet_address: walletAddress,
        referral_code: profileData.referral_code,
        referral_count: profileData.referral_count || 0,
        referral_earnings: profileData.referral_earnings || 0,
        active_referrals: 0,
        pending_referrals: 0
      }

      // Try to get additional stats from referral_stats view for active/pending counts
      const { data: statsData, error: statsError } = await supabase
        .from('referral_stats')
        .select('active_referrals, pending_referrals')
        .eq('wallet_address', walletAddress)
        .single()

      // Merge view data if available, but always use profile data as base
      if (statsData && !statsError) {
        primaryStats.active_referrals = statsData.active_referrals || 0
        primaryStats.pending_referrals = statsData.pending_referrals || 0
      }

      // Get user's referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_wallet', walletAddress)
        .order('created_at', { ascending: false })

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError)
      }

      // Get user's referral rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('referrer_wallet', walletAddress)
        .order('created_at', { ascending: false })

      if (rewardsError) {
        console.error('Error fetching referral rewards:', rewardsError)
      }

      // Calculate total SOL earnings from sol_commission rewards
      const totalSolEarnings = rewardsData?.reduce((total, reward) => {
        if (reward.reward_type === 'sol_commission' && reward.sol_amount) {
          return total + (reward.sol_amount * 1e9) // Convert SOL to lamports
        }
        return total
      }, 0) || 0

      console.log('✅ Referral data fetched:', {
        stats: primaryStats,
        referralsCount: referralsData?.length || 0,
        rewardsCount: rewardsData?.length || 0,
        totalSolEarnings
      })

      setState(prev => ({
        ...prev,
        stats: primaryStats,
        referrals: referralsData || [],
        rewards: rewardsData || [],
        solEarnings: totalSolEarnings,
        loading: false,
        error: null
      }))

    } catch (error) {
      console.error('Error in refreshStats:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
    }
  }, [connected, walletAddress])

  const validateReferralCode = useCallback(async (code: string): Promise<{ valid: boolean; error?: string }> => {
    try {
      console.log('🔍 Validating referral code:', code)

      const response = await fetch(`${API_BASE_URL}/api/games/referral/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referralCode: code }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        return { valid: false, error: result.error || 'Validation failed' }
      }

      console.log('✅ Referral code validation result:', result)
      return result

    } catch (error) {
      console.error('Error validating referral code:', error)
      return { valid: false, error: 'Network error' }
    }
  }, [])

  const createReferral = useCallback(async (code: string): Promise<{ success: boolean; error?: string; signupBonus?: number; referrerBonus?: number }> => {
    if (!walletAddress) {
      return { success: false, error: 'Wallet not connected' }
    }

    try {
      console.log('🔗 Creating referral with code:', code)

      const response = await fetch(`${API_BASE_URL}/api/games/referral/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          referralCode: code,
          userWallet: walletAddress 
        }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to create referral' }
      }

      console.log('✅ Referral created successfully:', result)
      
      // Refresh stats after successful referral creation
      setTimeout(() => refreshStats(), 1000)
      
      return result

    } catch (error) {
      console.error('Error creating referral:', error)
      return { success: false, error: 'Network error' }
    }
  }, [walletAddress, refreshStats])

  const getReferralUrl = useCallback((): string | null => {
    // Try to get referral code from stats first, then from any available source
    const referralCode = state.stats?.referral_code
    if (!referralCode) return null
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}?ref=${referralCode}`
  }, [state.stats?.referral_code])

  const copyReferralLink = useCallback(async (): Promise<void> => {
    const url = getReferralUrl()
    if (!url) return

    try {
      await navigator.clipboard.writeText(url)
      console.log('✅ Referral link copied to clipboard')
    } catch (error) {
      console.error('Failed to copy referral link:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }, [getReferralUrl])

  // Utility function to convert lamports to SOL
  const lamportsToSol = useCallback((lamports: number): number => {
    return lamports / 1e9
  }, [])

  // Get formatted SOL earnings
  const getFormattedSolEarnings = useCallback((): string => {
    const solAmount = lamportsToSol(state.solEarnings)
    return solAmount.toFixed(4)
  }, [state.solEarnings, lamportsToSol])

  // Fetch referral stats when wallet connects
  useEffect(() => {
    if (connected && walletAddress) {
      // Immediate refresh without loading state if we have cached data
      refreshStats()
    } else {
      setState(prev => ({ ...prev, stats: null, referrals: [], rewards: [], solEarnings: 0, error: null }))
    }
  }, [connected, walletAddress]) // Removed refreshStats from deps to prevent loop

  // Preload data on mount if wallet is already connected
  useEffect(() => {
    if (connected && walletAddress && !state.stats) {
      refreshStats()
    }
  }, [connected, walletAddress, state.stats]) // Removed refreshStats from deps to prevent loop

  return {
    ...state,
    refreshStats,
    validateReferralCode,
    createReferral,
    copyReferralLink,
    getReferralUrl,
    lamportsToSol,
    getFormattedSolEarnings
  }
}
