'use client'

import { useState } from 'react'
import { Copy, Users, TrendingUp, Gift, ExternalLink, Share2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useReferral } from '@/hooks/use-referral'
import { useUserProfile } from '@/hooks/use-user-profile'
import { useLeaderboard } from '@/hooks/use-leaderboard'
import { ReferralInputDialog } from './referral-input-dialog'

export function ReferralCard() {
  const { stats, loading, copyReferralLink, getReferralUrl, getFormattedSolEarnings } = useReferral()
  const { profile, refreshProfile } = useUserProfile()
  const { userRank } = useLeaderboard(50)
  const { toast } = useToast()
  const [copying, setCopying] = useState(false)

  const handleCopyLink = async () => {
    setCopying(true)
    try {
      await copyReferralLink()
      toast({
        title: 'Link Copied!',
        description: 'Referral link copied to clipboard',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      })
    } finally {
      setCopying(false)
    }
  }

  const handleShareOnX = () => {
    if (!profile || !stats) return
    
    // Get stats from userRank (leaderboard data) if available, otherwise use profile data
    const playerStats = {
      wins: profile.wins || 0,
      totalPoints: profile.total_points_earned || 0,
      winRate: userRank?.win_rate_percentage || 0,
      rank: userRank?.rank || null
    }
    
    // Calculate win rate if not available from leaderboard
    const calculatedWinRate = playerStats.winRate || (profile.total_games > 0 ? Math.round((playerStats.wins / profile.total_games) * 100) : 0)
    
    // Create dynamic text based on player stats
    let achievementText = ''
    if (playerStats.rank && playerStats.rank <= 10) {
      achievementText = `🏆 Top ${playerStats.rank} player on RPS Arena! Ranked #${playerStats.rank} with ${playerStats.wins} wins and ${calculatedWinRate}% win rate! 🚀`
    } else if (playerStats.wins > 0) {
      const rankText = playerStats.rank ? `#${playerStats.rank}` : 'Unranked'
      achievementText = `🎮 ${playerStats.wins} wins on RPS Arena with ${calculatedWinRate}% win rate! Ranked ${rankText}! 🚀`
    } else {
      achievementText = `🎮 Join me on RPS Arena - Rock Paper Scissors on Solana! 🚀`
    }
    
    const benefitsText = `🎁 Use my referral code for +100 bonus points + get rewarded with up to 50% of the platform fee every time your referral wins!`
    const referralLink = getReferralUrl()
    
    const shareText = `${achievementText}\n\n${benefitsText}\n\nPlay Rock Paper Scissors on Solana blockchain! ⚡\n\n#RPSArena #Solana #Web3Gaming #MagicBlock`
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}${referralLink ? `&url=${encodeURIComponent(referralLink)}` : ''}`

    window.open(shareUrl, '_blank')
  }

  const referralUrl = getReferralUrl()

  // Show full interface even when loading or no stats
  const displayStats = stats || {
    referral_code: loading ? 'CREATING...' : 'CONNECT WALLET',
    referral_count: 0,
    referral_earnings: 0,
    active_referrals: 0,
    pending_referrals: 0
  }

  return (
    <Card className="bg-gray-900/80 border-gray-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Users className="h-5 w-5 text-purple-400" />
          Referral Program
        </CardTitle>
        <CardDescription className="text-gray-400">
          Invite friends and earn points + 1% SOL from their winnings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Code */}
        <div>
          <label className="text-sm font-medium text-gray-300">
            Your Referral Code
          </label>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 px-3 py-2 bg-gray-800/80 border border-gray-600 rounded-md font-mono text-sm text-purple-300">
              {loading ? (
                <div className="animate-pulse bg-gray-600 h-4 rounded w-16"></div>
              ) : (
                displayStats.referral_code
              )}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              disabled={copying || !referralUrl}
              className="shrink-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {loading ? (
                <div className="animate-pulse bg-gray-600 h-8 rounded w-8"></div>
              ) : (
                displayStats.referral_count
              )}
            </div>
            <div className="text-sm text-blue-400/80">
              Referred
            </div>
          </div>

          <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-400">
              {loading ? (
                <div className="animate-pulse bg-gray-600 h-8 rounded w-12"></div>
              ) : (
                displayStats.referral_earnings
              )}
            </div>
            <div className="text-sm text-green-400/80">
              Points
            </div>
          </div>

          <div className="text-center p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {loading ? (
                <div className="animate-pulse bg-gray-600 h-8 rounded w-12"></div>
              ) : (
                getFormattedSolEarnings()
              )}
            </div>
            <div className="text-sm text-purple-400/80">
              SOL Earned
            </div>
          </div>
        </div>

        {/* Active vs Pending */}
        <div className="flex gap-4">
          <Badge variant="secondary" className="flex items-center gap-1 bg-green-500/20 text-green-300 border-green-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            Active: {loading ? (
              <div className="animate-pulse bg-gray-600 h-4 rounded w-4"></div>
            ) : (
              displayStats.active_referrals
            )}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 border-yellow-500/30 text-yellow-300">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            Pending: {loading ? (
              <div className="animate-pulse bg-gray-600 h-4 rounded w-4"></div>
            ) : (
              displayStats.pending_referrals
            )}
          </Badge>
        </div>

        {/* How it works */}
        <div className="border-t border-gray-700/50 pt-4">
          <h4 className="font-medium mb-2 flex items-center gap-2 text-white">
            <Gift className="h-4 w-4 text-purple-400" />
            How it works
          </h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Referred user gets +100 points on signup</li>
            <li>• You get +50 points for each referral</li>
            <li>• +25 points when they play their first game</li>
            <li>• 1% SOL from each of your referrals' SOL game winnings</li>
          </ul>
        </div>

        {/* Wallet connection message or Share Button */}
        {!profile ? (
          <div className="text-center py-4">
            <p className="text-gray-400 text-sm">
              Connect your wallet to access referral features
            </p>
          </div>
        ) : referralUrl && !loading ? (
          <div className="space-y-3">
            <Button 
              onClick={handleCopyLink}
              disabled={copying}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg"
            >
              {copying ? (
                'Copying...'
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Share Referral Link
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleShareOnX}
              disabled={!profile}
              className="w-full bg-black hover:bg-gray-800 text-white font-bold border border-gray-600"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share on X
            </Button>
            
            {/* Show referral input if user wasn't referred by anyone */}
            {profile && !profile.referred_by && !loading && (
              <div className="border-t border-gray-700/50 pt-3">
                <p className="text-sm text-gray-400 mb-2 text-center">
                  Have a referral code?
                </p>
                <ReferralInputDialog 
                  trigger={
                    <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:text-white" size="sm">
                      <Gift className="h-4 w-4 mr-2" />
                      Enter Referral Code
                    </Button>
                  }
                  onSuccess={(bonus) => {
                    refreshProfile()
                    toast({
                      title: 'Code Applied!',
                      description: `You received ${bonus} points`,
                    })
                  }}
                />
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}