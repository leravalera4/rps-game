"use client"

import { useState, useEffect, useCallback } from 'react'

interface Stats {
  totalGames: number
  activeGames: number
  waitingGames: number
  finishedGames: number
  totalPlayers: number
  totalUsers?: number
  totalPointsGames?: number
  totalSolGames?: number
}

interface UseStatsReturn {
  stats: Stats | null
  loading: boolean
  error: string | null
  refreshStats: () => Promise<void>
}

export const useStats = (): UseStatsReturn => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/games/stats')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
      } else {
        throw new Error(data.error || 'Failed to fetch stats')
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshStats()
  }, [refreshStats])

  return {
    stats,
    loading,
    error,
    refreshStats
  }
} 