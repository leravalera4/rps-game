import { useState, useEffect, useCallback, useRef } from 'react'

interface WinningsEntry {
  id: string
  gameId: string
  winnerWallet: string
  winnerUsername: string
  currency: 'sol' | 'points'
  stakeAmount: number
  pointsWon: number
  winningsAmount: number
  createdAt: string
}

interface UseWinningsState {
  winnings: WinningsEntry[]
  loading: boolean
  error: string | null
  hasMore: boolean
}

interface UseWinningsReturn extends UseWinningsState {
  refreshWinnings: () => Promise<void>
  loadMore: () => Promise<void>
}

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://last-backend-7d8f5fbc0943.herokuapp.com'
  : 'https://last-backend-7d8f5fbc0943.herokuapp.com'

export const useWinnings = (limit: number = 20): UseWinningsReturn => {
  const [state, setState] = useState<UseWinningsState>({
    winnings: [],
    loading: false,
    error: null,
    hasMore: true
  })

  const offsetRef = useRef(0)
  const isInitializedRef = useRef(false)

  const fetchWinnings = useCallback(async (reset = false) => {
    if (state.loading) return // Prevent multiple simultaneous requests

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null 
    }))

    try {
      const currentOffset = reset ? 0 : offsetRef.current
      console.log('🔍 Fetching winnings...', { limit, offset: currentOffset, reset })
      
      const response = await fetch(`${API_BASE_URL}/api/games/winnings?limit=${limit}&offset=${currentOffset}`)
      
      console.log('📡 API Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch winnings: ${response.status}`)
      }

      const data = await response.json()
      console.log('📊 API Response data:', data)
      console.log('📊 SOL winnings count:', data.winnings?.filter((w: any) => w.currency === 'sol').length || 0)
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch winnings')
      }

      const newWinnings = data.winnings || []
      
      // Temporary fix: if hasMore is not provided, calculate it
      if (data.hasMore === undefined && data.total !== undefined) {
        console.log('⚠️ Backend returned total instead of hasMore, calculating hasMore...')
        data.hasMore = data.total > (currentOffset + newWinnings.length)
      }
      
      setState(prev => ({
        ...prev,
        winnings: reset ? newWinnings : [...prev.winnings, ...newWinnings],
        loading: false,
        hasMore: data.hasMore !== undefined ? data.hasMore : newWinnings.length === limit
      }))

      // Update offset after successful fetch
      if (reset) {
        offsetRef.current = limit
      } else {
        offsetRef.current += limit
      }

      console.log(`✅ Fetched ${newWinnings.length} winnings entries`, {
        hasMore: data.hasMore,
        newWinningsLength: newWinnings.length,
        limit,
        reset,
        finalHasMore: data.hasMore !== undefined ? data.hasMore : newWinnings.length === limit,
        solCount: newWinnings.filter((w: any) => w.currency === 'sol').length
      })

    } catch (error) {
      console.error('Error fetching winnings:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }, [limit, state.loading])

  const refreshWinnings = useCallback(async () => {
    offsetRef.current = 0
    await fetchWinnings(true)
  }, [fetchWinnings])

  const loadMore = useCallback(async () => {
    if (!state.loading && state.hasMore) {
      await fetchWinnings(false)
    }
  }, [fetchWinnings, state.loading, state.hasMore])

  // Load initial data only once
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true
      refreshWinnings()
    }
  }, [refreshWinnings])

  return {
    ...state,
    refreshWinnings,
    loadMore
  }
}