"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { StyledWalletButton } from '../../../components/styled-wallet-button'
import { Wallet } from 'lucide-react'

interface GamePageProps {
  params: Promise<{ gameId: string }>
}

export default function GamePage({ params }: GamePageProps) {
  const router = useRouter()
  const { authenticated, ready } = usePrivy()
  const connected = authenticated // Use Privy authentication state
  const [gameId, setGameId] = useState<string | null>(null)
  const [gameValidated, setGameValidated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeGame = async () => {
      const { gameId: id } = await params
      setGameId(id)
      
      if (!id) {
        console.error('No game ID provided')
        router.replace('/')
        return
      }

      console.log('🔗 Game page loaded for:', id)
      
      // Validate game exists by calling backend API
      try {
        const response = await fetch(`https://last-backend-7d8f5fbc0943.herokuapp.com/api/games/${id}`)
        const data = await response.json()
        
        if (!data.success || !data.game) {
          console.error('❌ Game not found:', id)
          alert('Game not found or no longer available')
          router.replace('/')
          return
        }

        console.log('✅ Game validated')
        setGameValidated(true)
        setIsLoading(false)
        
        // If wallet is already connected, proceed with auto-join
        if (authenticated) {
          // Store the game ID and mark it for immediate joining (skip confirmation)
          sessionStorage.setItem('autoJoinGameId', id)
          sessionStorage.setItem('autoJoinSkipConfirmation', 'true')
          
          // Use replace instead of push to avoid back button issues and reduce redirect flicker
          router.replace('/')
        } else {
          // Store game ID for later auto-join after wallet connection
          sessionStorage.setItem('autoJoinGameId', id)
          sessionStorage.setItem('autoJoinSkipConfirmation', 'true')
        }
        
      } catch (error) {
        console.error('❌ Error validating game:', error)
        alert('Unable to connect to game server')
        router.replace('/')
      }
    }

    if (ready) {
      initializeGame()
    }
  }, [params, router, ready, authenticated])

  // Monitor wallet connection status
  useEffect(() => {
    if (authenticated && gameValidated && gameId) {
      // Wallet connected, proceed with auto-join
      console.log('✅ Wallet connected, redirecting to game')
      router.replace('/')
    }
  }, [authenticated, gameValidated, gameId, router])

  // Show loading state while validating game
  if (isLoading || !ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-purple-400 mb-2">Loading...</h2>
          <p className="text-gray-400">Please wait</p>
        </div>
      </div>
    )
  }

  // Show wallet connection screen if not connected
  if (!authenticated && gameValidated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-8 shadow-2xl text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border-4 border-purple-500/30">
              <Wallet className="w-10 h-10 text-purple-400" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white">Connect Your Wallet</h2>
            <p className="text-gray-400">
              You need to connect your wallet first to join this game.
            </p>
          </div>

          <div className="pt-4">
            <StyledWalletButton />
          </div>

          <div className="pt-2">
            <button
              onClick={() => router.replace('/')}
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              ← Back to Lobby
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-purple-400 mb-2">Joining Game...</h2>
        <p className="text-gray-400">Please wait while we connect you to the game</p>
      </div>
    </div>
  )
} 