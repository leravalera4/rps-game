'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Clock, Trophy, Users, Gift } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useReferral } from '@/hooks/use-referral'

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Active</Badge>
    case 'pending':
      return <Badge variant="outline" className="border-yellow-500/30 text-yellow-300">Pending</Badge>
    case 'rewarded':
      return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Rewarded</Badge>
    default:
      return <Badge variant="secondary" className="bg-gray-500/20 text-gray-300">{status}</Badge>
  }
}

const getRewardIcon = (type: string) => {
  switch (type) {
    case 'signup_bonus':
      return <Users className="h-4 w-4 text-blue-500" />
    case 'first_game_bonus':
      return <Trophy className="h-4 w-4 text-green-500" />
    case 'game_commission':
      return <Gift className="h-4 w-4 text-purple-500" />
    case 'sol_commission':
      return <Gift className="h-4 w-4 text-purple-500" />
    default:
      return <Gift className="h-4 w-4" />
  }
}

const getRewardLabel = (type: string) => {
  switch (type) {
    case 'signup_bonus':
      return 'Signup Bonus'
    case 'first_game_bonus':
      return 'First Game Bonus'
    case 'game_commission':
      return 'Game Commission'
    case 'sol_commission':
      return 'SOL Commission'
    default:
      return type
  }
}

export function ReferralHistory() {
  const { referrals, rewards, loading } = useReferral()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900/80 border-gray-700/50">
      <CardHeader>
        <CardTitle className="text-white">Referral History</CardTitle>
        <CardDescription className="text-gray-400">
          Your invitations and earned rewards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="referrals" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 text-xs sm:text-sm">
            <TabsTrigger value="referrals" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Users className="h-4 w-4" />
              Referrals ({referrals.length})
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Gift className="h-4 w-4" />
              Rewards ({rewards.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="referrals" className="space-y-4 mt-4">
            {referrals.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>You haven't referred anyone yet</p>
                <p className="text-sm">Share your referral link with friends!</p>
              </div>
            ) : (
              referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border border-gray-700/50 rounded-lg bg-gray-800/30 gap-3 sm:gap-0"
                >
                  <div className="flex-1 w-full sm:w-auto">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white text-sm sm:text-base">
                          {referral.referred_wallet.slice(0, 8)}...{referral.referred_wallet.slice(-8)}
                        </p>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                          <Clock className="h-3 w-3" />
                          {format(new Date(referral.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    {getStatusBadge(referral.status)}
                    {referral.activated_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        Activated {format(new Date(referral.activated_at), 'dd.MM.yyyy', { locale: ru })}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="rewards" className="space-y-4 mt-4">
            {rewards.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No rewards yet</p>
                <p className="text-sm">Invite friends to start earning bonuses!</p>
              </div>
            ) : (
              rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border border-gray-700/50 rounded-lg bg-gray-800/30 gap-3 sm:gap-0"
                >
                  <div className="flex-1 w-full sm:w-auto">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        {getRewardIcon(reward.reward_type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white text-sm sm:text-base">{getRewardLabel(reward.reward_type)}</p>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                          <Clock className="h-3 w-3" />
                          {format(new Date(reward.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                        </div>
                        {reward.referred_wallet && (
                          <p className="text-xs text-gray-400">
                            From: {reward.referred_wallet.slice(0, 8)}...{reward.referred_wallet.slice(-8)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    {reward.reward_type === 'sol_commission' ? (
                      <>
                        <span className="text-lg font-bold text-purple-400">
                          +{reward.sol_amount?.toFixed(6) || '0.000000'}
                        </span>
                        <p className="text-xs text-gray-400">SOL</p>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-bold text-green-400">
                          +{reward.points_awarded}
                        </span>
                        <p className="text-xs text-gray-400">points</p>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
