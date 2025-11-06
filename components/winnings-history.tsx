'use client'

import React from 'react'
import { useState } from 'react'
import { Trophy, Coins, Clock, User, ExternalLink, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWinnings } from '@/hooks/use-winnings'

// Inline Solana SVG icon
function SolanaIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 398 312" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <defs>
        <linearGradient id="solana-gradient" x1="9.5%" y1="0%" x2="90.5%" y2="100%">
          <stop stopColor="#00FFA3" offset="0%" />
          <stop stopColor="#DC1FFF" offset="100%" />
        </linearGradient>
      </defs>
      <path fill="url(#solana-gradient)" d="M64.5 52.4c2.9-2.9 6.8-4.4 10.8-4.4h304.5c9.1 0 13.7 11 7.2 17.5L333.5 119c-2.9 2.9-6.8 4.4-10.8 4.4H18.2c-9.1 0-13.7-11-7.2-17.5L64.5 52.4ZM64.5 192.5c2.9-2.9 6.8-4.4 10.8-4.4h304.5c9.1 0 13.7 11 7.2 17.5l-53.5 53.5c-2.9 2.9-6.8 4.4-10.8 4.4H18.2c-9.1 0-13.7-11-7.2-17.5l53.5-53.5ZM64.5 122.5c2.9-2.9 6.8-4.4 10.8-4.4h304.5c9.1 0 13.7 11 7.2 17.5L333.5 189c-2.9 2.9-6.8 4.4-10.8 4.4H18.2c-9.1 0-13.7-11-7.2-17.5l53.5-53.5Z"/>
    </svg>
  )
}

interface WinningsHistoryProps {
  className?: string
}

export function WinningsHistory({ className = '' }: WinningsHistoryProps) {
  const { winnings, loading, error, hasMore, refreshWinnings, loadMore } = useWinnings(100)
  const [refreshing, setRefreshing] = useState(false)
  
  console.log('🎯 WinningsHistory render:', {
    winnings: winnings.length,
    loading,
    error,
    hasMore,
    solWinnings: winnings.filter(win => win.currency === 'sol').length
  })
  
  // Auto-load more if we have less than 10 SOL winnings and there's more data
  React.useEffect(() => {
    const solWinnings = winnings.filter(win => win.currency === 'sol')
    if (solWinnings.length < 10 && hasMore && !loading) {
      console.log('🔄 Auto-loading more winnings to find SOL games...')
      loadMore()
    }
  }, [winnings, hasMore, loading, loadMore])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshWinnings()
    setRefreshing(false)
  }

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`
  }

  const formatAmount = (amount: number, currency: string) => {
    if (currency === 'sol') {
      return `${amount.toFixed(3)} SOL`
    }
    return `${amount} points`
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const getCurrencyColor = (currency: string) => {
    return currency === 'sol' ? 'text-green-400' : 'text-purple-400'
  }

  const formatSolWinnings = (stakeAmount: number) => {
    // Winner always gets the same amount regardless of referrer presence
    // Platform fee is split between platform and referrer when referrer exists
    const totalPot = stakeAmount * 2
    const totalFeeRate = stakeAmount <= 0.01 ? 0.05 : stakeAmount <= 0.05 ? 0.03 : 0.02
    const winnerAmount = totalPot * (1 - totalFeeRate)
    return `${winnerAmount.toFixed(3)} SOL`
  }

  if (error) {
    return (
      <Card className={`bg-gray-900/80 border-gray-700/50 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Recent Winnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">Failed to load winnings</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-gray-900/80 border-gray-700/50 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Recent Winnings
            </CardTitle>
            <CardDescription className="text-gray-400">
              See who's winning SOL in the arena
            </CardDescription>
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
            className="border-gray-600 text-gray-300 hover:bg-gray-800/50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && winnings.length === 0 ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-24"></div>
                      <div className="h-3 bg-gray-700 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-20"></div>
                    <div className="h-3 bg-gray-700 rounded w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : winnings.filter(win => win.currency === 'sol').length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No SOL winnings yet</p>
            <p className="text-sm text-gray-500">Be the first to win SOL!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {winnings
              .filter(win => win.currency === 'sol')
              .map((win, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {formatWallet(win.winnerWallet)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatTimeAgo(win.createdAt)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-2 text-lg font-bold text-green-400">
                    <SolanaIcon className="h-4 w-4" />
                    {formatSolWinnings(win.stakeAmount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Stake: {win.stakeAmount} SOL
                  </div>
                </div>
              </div>
            ))}
            
            {hasMore && (
              <div className="text-center pt-4">
                <Button 
                  onClick={() => {
                    console.log('🔄 Load More clicked', { loading, hasMore, winningsCount: winnings.length })
                    loadMore()
                  }} 
                  variant="outline" 
                  disabled={loading}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800/50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
