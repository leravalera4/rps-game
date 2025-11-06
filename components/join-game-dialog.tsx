'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trophy, Wallet, AlertTriangle, Users } from 'lucide-react'

interface JoinGameDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  gameData: {
    gameId: string
    currency: 'points' | 'sol'
    stakeAmount: number
    totalPot: number
    gameType: 'private' | 'public'
  } | null
  userBalance: {
    points: number
    sol: number
  }
  loading?: boolean
}

export function JoinGameDialog({ 
  open, 
  onClose, 
  onConfirm, 
  gameData, 
  userBalance, 
  loading = false 
}: JoinGameDialogProps) {
  const [confirming, setConfirming] = useState(false)

  if (!gameData) return null

  const hasEnoughBalance = gameData.currency === 'points' 
    ? userBalance.points >= gameData.stakeAmount 
    : userBalance.sol >= gameData.stakeAmount

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      console.log('🎯 Join game dialog - confirming join')
      await onConfirm()
      // Don't reset confirming here - let the parent component close the dialog
      console.log('🎯 Join game dialog - join confirmed, waiting for parent to close')
    } catch (error) {
      console.error('❌ Join game dialog - error during join:', error)
      setConfirming(false)
    }
  }

  const handleClose = () => {
    console.log('🚪 Join dialog closing - Cancel button clicked')
    setConfirming(false) // Reset confirming state on close
    onClose()
  }

  const isProcessing = confirming || loading

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-purple-400" />
            Join Game
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Review the game details before joining
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Game Details - Compact Layout */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Game Type</div>
              <div className="text-purple-400 font-medium capitalize">{gameData.gameType}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Currency</div>
              <div className={`font-medium ${gameData.currency === 'points' ? 'text-purple-400' : 'text-green-400'}`}>
                {gameData.currency === 'points' ? 'Points' : 'SOL'}
              </div>
            </div>
          </div>

          {/* Stakes and Prize */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Entry Cost:</span>
              <span className={`font-bold ${gameData.currency === 'points' ? 'text-purple-400' : 'text-green-400'}`}>
                {gameData.currency === 'points' ? `${gameData.stakeAmount} Points` : `${gameData.stakeAmount} SOL`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Prize Pool:</span>
              <span className="text-yellow-400 font-bold flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                {gameData.currency === 'points' ? `${gameData.totalPot} Points` : `${gameData.totalPot} SOL`}
              </span>
            </div>
          </div>

          {/* Your Balance - Compact */}
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300 font-medium text-sm">Your Balance</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">
                {gameData.currency === 'points' ? 'Points:' : 'SOL:'}
              </span>
              <span className={`font-medium ${gameData.currency === 'points' ? 'text-purple-400' : 'text-green-400'}`}>
                {gameData.currency === 'points' ? userBalance.points : userBalance.sol.toFixed(3)}
              </span>
            </div>
          </div>

          {/* Insufficient Balance Warning */}
          {!hasEnoughBalance && (
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                Insufficient balance! You need {gameData.currency === 'points' ? `${gameData.stakeAmount} points` : `${gameData.stakeAmount} SOL`} to join this game.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('🚪 Cancel button clicked directly')
                handleClose()
              }}
              variant="outline"
              className="flex-1 bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/80 hover:text-white hover:border-gray-500 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!hasEnoughBalance || isProcessing}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Joining...
                </div>
              ) : (
                'Join Game'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
