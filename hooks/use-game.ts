import { useCallback, useEffect, useState, useRef } from 'react'
import { usePrivyWallet as useWallet } from '@/hooks/use-privy-wallet'
import { useConnection } from '@solana/wallet-adapter-react'
import { 
  LAMPORTS_PER_SOL, 
  PublicKey, 
  SystemProgram, 
  Transaction,
  TransactionInstruction,
  Connection
} from '@solana/web3.js'
import { useSocket } from './use-socket'
import { useAnchorProgram } from './use-anchor-program'

// Define types
interface Player {
  id: string | null
  wallet?: string
  wins: number
  currentMove: string | null
  ready: boolean
}

interface GameState {
  gameId: string | null
  gameType: 'private' | 'public'
  currency: 'points' | 'sol'
  player1: Player
  player2: Player | null
  currentRound: number
  gameStatus: 'lobby' | 'waiting' | 'playing' | 'game-over' | 'round-result'
  winner: string | null
  stakeAmount: number
  totalPot: number
  roundResult: string | null
  countdown: number
  inviteLink?: string | null
}

interface UseGameOptions {
  onGameCreated?: (gameId: string, inviteLink: string | null) => void
  onGameJoined?: (gameState: any) => void
  onGameStarted?: () => void
  onMoveSubmitted?: (data: any) => void
  onRoundCompleted?: (data: any) => void
  onGameFinished?: (data: any) => void
  onError?: (message: string) => void
  onCountdownUpdate?: (countdown: number) => void
  onBalanceUpdate?: (balance: number) => void
}

// Program ID from your deployed contract
const PROGRAM_ID = new PublicKey('GstXQkBpu26KABj6YZ3pYKJhQphoQ72YL1zL38NC6D9U')

export const useGame = (options: UseGameOptions = {}) => {
  const wallet = useWallet()
  const { publicKey, connected, sendTransaction } = wallet
  const { connection } = useConnection()
  const socket = useSocket({
    url: 'https://last-backend-7d8f5fbc0943.herokuapp.com',
    onConnect: () => {
      console.log('🔌 WebSocket connected to game server')
    },
    onDisconnect: (reason) => {
      console.log('🔌 WebSocket disconnected:', reason)
    },
    onError: (error) => {
      console.error('🔌 WebSocket error:', error)
    },
  })
  
  const [gameState, setGameState] = useState<GameState>({
    gameId: null,
    gameType: 'private',
    currency: 'points',
    player1: { id: 'you', wins: 0, currentMove: null, ready: false },
    player2: null,
    currentRound: 1,
    gameStatus: 'lobby',
    winner: null,
    stakeAmount: 0,
    totalPot: 0,
    roundResult: null,
    countdown: 0,
  })

  const [isInGame, setIsInGame] = useState(false)

  // Ref to always get the latest gameState in event handlers
  const gameStateRef = useRef(gameState)
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  // Helper functions for PDAs (same as in your working tests)
  const getUserProfilePDA = useCallback((userPublicKey: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('user_profile'), userPublicKey.toBytes()],
      PROGRAM_ID
    )[0]
  }, [])

  const getGamePDA = useCallback((gameId: string) => {
    // Use raw game ID as bytes to match smart contract seeds
    // Contract uses: seeds = [b"game", game_id.as_bytes()]
    // Truncate to max 32 bytes (Solana PDA seed limit)
    const truncatedGameId = gameId.replace(/-/g, '').substring(0, 32)
    return PublicKey.findProgramAddressSync(
      [Buffer.from('game'), Buffer.from(truncatedGameId, 'utf8')],
      PROGRAM_ID
    )[0]
  }, [])

  // Initialize the Anchor program hook for smart contract interactions
  const { finalizeGame: anchorFinalizeGame, createGame: anchorCreateGame, joinGame: anchorJoinGame } = useAnchorProgram({
    onSuccess: (message) => {
      console.log('✅ Smart contract success:', message)
    },
    onError: (error) => {
      console.error('❌ Smart contract error:', error)
    },
    onBalanceUpdate: () => {
      // Refresh balance after SOL transactions
      refreshBalance()
    }
  })

  // Refresh wallet balance after transactions
  const refreshBalance = useCallback(async () => {
    if (connected && publicKey) {
      try {
        // This will trigger a re-render of balance displays
        const balance = await connection.getBalance(publicKey)
        const solBalance = balance / LAMPORTS_PER_SOL
        console.log('💰 Current balance:', solBalance, 'SOL')
        
        // Call callback to update balance in parent component
        options.onBalanceUpdate?.(solBalance)
        
        // Note: Removed forced page reload that was breaking game sessions
        // The wallet adapter and balance components will update naturally
        console.log('✅ Balance refreshed without page reload')
      } catch (error) {
        console.error('Failed to refresh balance:', error)
      }
    }
  }, [connected, publicKey, connection, options])

  // WebSocket event handlers
  useEffect(() => {
    if (!socket.connected) return

    const handleGameCreated = (data: any) => {
      console.log('🎮 Game created:', data)
      setGameState(prev => ({
        ...prev,
        gameId: data.gameId,
        gameType: data.gameState.gameType,
        currency: data.gameState.currency || 'points',
        stakeAmount: data.gameState.stakeAmount,
        totalPot: data.gameState.totalPot,
        gameStatus: 'waiting',
        inviteLink: data.inviteLink,
        player1: {
          ...prev.player1,
          id: data.gameState.player1.id,
          wallet: data.gameState.player1.wallet,
        },
      }))
      setIsInGame(true)
      options.onGameCreated?.(data.gameId, data.inviteLink)
    }

    const handlePlayerJoined = (data: any) => {
      console.log('👥 Player joined:', data)
      const gameStateData = data.gameState || data
      const myPlayerId = publicKey?.toString().slice(0, 8)
      const isPlayer2 = gameStateData.player2?.id === myPlayerId
      
      // For SOL games, when player2 joins, keep status as 'waiting' until transactions are complete
      const shouldKeepWaiting = (prev: GameState) => {
        if (isPlayer2 && prev.currency === 'sol' && prev.gameType === 'private') {
          return 'waiting' // Player2 in SOL private game should stay in waiting until transactions complete
        }
        return gameStateData.gameStatus === 'playing' ? 'playing' : prev.gameStatus
      }
      
      setGameState(prev => ({
        ...prev,
        player2: gameStateData.player2 ? {
          id: gameStateData.player2.id,
          wallet: gameStateData.player2.wallet,
          wins: gameStateData.player2.wins || 0,
          currentMove: null,
          ready: false,
        } : null,
        gameStatus: shouldKeepWaiting(prev),
        currentRound: gameStateData.currentRound || prev.currentRound,
      }))
      options.onGameJoined?.(gameStateData)
    }

    const handleGameJoined = (data: any) => {
      console.log('🎯 Joined game:', data)
      const gameStateData = data.gameState || data
      const myPlayerId = publicKey?.toString().slice(0, 8)
      
      // Determine which player position we are
      const isPlayer1 = gameStateData.player1?.id === myPlayerId
      const isPlayer2 = gameStateData.player2?.id === myPlayerId
      
      setGameState({
        gameId: data.gameId || gameStateData.gameId,
        gameType: gameStateData.gameType,
        currency: gameStateData.currency || 'points',
        player1: {
          id: gameStateData.player1?.id || null,
          wallet: gameStateData.player1?.wallet,
          wins: gameStateData.player1?.wins || 0,
          currentMove: gameStateData.player1?.currentMove,
          ready: gameStateData.player1?.ready ?? false,
        },
        player2: gameStateData.player2 ? {
          id: gameStateData.player2.id,
          wallet: gameStateData.player2.wallet,
          wins: gameStateData.player2.wins || 0,
          currentMove: gameStateData.player2.currentMove,
          ready: gameStateData.player2.ready ?? false,
        } : null,
        currentRound: gameStateData.currentRound || 1,
        gameStatus: (() => {
          // For SOL games, when player2 joins, keep status as 'waiting' until transactions are complete
          if (isPlayer2 && gameStateData.currency === 'sol' && gameStateData.gameType === 'private') {
            return 'waiting' // Player2 in SOL private game should stay in waiting until transactions complete
          }
          return gameStateData.gameStatus === 'playing' ? 'playing' : 'waiting'
        })(),
        winner: gameStateData.winner,
        stakeAmount: gameStateData.stakeAmount,
        totalPot: gameStateData.totalPot,
        roundResult: null,
        countdown: 0,
      })
      setIsInGame(true)
      
      // Log rejoining status
      if (isPlayer1) {
        console.log('🔄 Rejoined as Player 1 (Host)')
      } else if (isPlayer2) {
        console.log('🔄 Rejoined as Player 2')
      }
      
      options.onGameJoined?.(gameStateData)
    }

    const handleGameStarted = (data: any) => {
      console.log('🚀 Game started event received!', data)
      
      // Start countdown before transitioning to playing state
      // This gives players a visual cue that the game is about to begin
      let countdown = 3
      
      // Show initial countdown immediately
      options.onCountdownUpdate?.(countdown)
      
      const countdownInterval = setInterval(() => {
        countdown--
        if (countdown > 0) {
          // Update countdown state via callback
          options.onCountdownUpdate?.(countdown)
        } else {
          clearInterval(countdownInterval)
          // Update state - backend emits this after all on-chain transactions are confirmed
          setGameState(prev => ({
            ...prev,
            gameStatus: 'playing',
            currentRound: data.gameState?.currentRound || prev.currentRound,
          }))
          
          // Clear countdown
          options.onCountdownUpdate?.(0)
          
          // Small delay before calling onGameStarted to ensure UI updates
          setTimeout(() => {
            // Ensure we're in game view
            options.onGameStarted?.()
          }, 100)
        }
      }, 1000)
    }
    
    const handleGameStartedPreTx = async (data: any) => {
      console.log('🚀 Pre-transaction game started event received!', data)
      
      const gameStateData = data.gameState || data
      const myPlayerId = publicKey?.toString().slice(0, 8)
      // Use gameId from event first, then current state
      const gameId = data.gameId || gameStateData.gameId || gameStateRef.current.gameId
      const currency = gameStateData.currency || gameStateRef.current.currency || 'points'
      const stakeAmount = gameStateData.stakeAmount || gameStateRef.current.stakeAmount || 0
      
      // Immediately update gameState with gameId from event to ensure consistency
      // Also reset player moves and ready states since we're starting a new round
      setGameState(prev => ({
        ...prev,
        gameId: gameId || prev.gameId,
        gameType: gameStateData.gameType || prev.gameType,
        currency: currency || prev.currency,
        stakeAmount: stakeAmount || prev.stakeAmount,
        // Clear any previous moves when starting
        player1: {
          ...prev.player1,
          currentMove: null,
          ready: false
        },
        player2: prev.player2 ? {
          ...prev.player2,
          currentMove: null,
          ready: false
        } : null
      }))
      
      console.log('🔍 Game ID check:', {
        fromCurrentState: gameStateRef.current.gameId,
        fromEventGameState: gameStateData.gameId,
        fromEvent: data.gameId,
        finalGameId: gameId
      })
      
      console.log('🔍 Game started pre-tx details:', {
        gameId,
        currency,
        gameType: gameStateData.gameType,
        myPlayerId,
        player1Id: gameStateData.player1?.id,
        player2Id: gameStateData.player2?.id,
        hasPublicKey: !!publicKey
      })
      
      // For private SOL games, both players need to do on-chain transactions
      if (currency === 'sol' && publicKey && gameStateData.gameType === 'private') {
        // Update UI to show waiting state and ensure we're in game view
        setGameState(prev => ({
          ...prev,
          gameStatus: 'waiting' as const
        }))
        
        // Switch to game view immediately to show waiting state
        // Game will start automatically when backend sends game_started event
        options.onGameJoined?.(gameStateData)
        
        try {
          console.log('⏱️ Starting on-chain transactions...')
          const startTime = Date.now()
          
          // Determine which player position we are
          // Use playerType from event if available, otherwise fall back to ID matching
          const playerTypeFromEvent = data.playerType
          const isPlayer1 = playerTypeFromEvent ? playerTypeFromEvent === 'player1' : gameStateData.player1?.id === myPlayerId
          const isPlayer2 = playerTypeFromEvent ? playerTypeFromEvent === 'player2' : gameStateData.player2?.id === myPlayerId
          
          console.log('👤 Player position check:', {
            playerTypeFromEvent,
            isPlayer1,
            isPlayer2,
            myPlayerId,
            player1Id: gameStateData.player1?.id,
            player2Id: gameStateData.player2?.id
          })
          
          if (isPlayer1) {
            console.log('🔗 Player 1: Creating on-chain game with escrow...')
            await anchorCreateGame(gameId, stakeAmount, currency)
            console.log('✅ Player 1: Game created on-chain and confirmed')
            
            // Update UI to show we're waiting for player 2
            setGameState(prev => ({
              ...prev,
              gameStatus: 'waiting' as const
            }))
            
            // Notify backend that on-chain creation is complete
            console.log('📤 Emitting onchain_game_created with gameId:', gameId)
            console.log('📤 Socket connection status:', socket.connected ? 'CONNECTED' : 'DISCONNECTED')
            // Socket ID is not directly accessible from useSocket wrapper
            console.log('📤 Current game state gameId:', gameStateRef.current.gameId)
            
            // Ensure we're using the correct gameId from current state
            const actualGameId = gameStateRef.current.gameId || gameId
            console.log('📤 Sending event with gameId:', actualGameId)
            
            // Use HTTP as primary method for reliability (WebSocket can have connection issues)
            console.log('📤 Sending onchain_game_created via HTTP (primary method)...')
            try {
              const response = await fetch('https://last-backend-7d8f5fbc0943.herokuapp.com/api/games/onchain/created', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId: String(actualGameId) })
              })
              const result = await response.json()
              if (result.success) {
                console.log('✅ HTTP request succeeded for onchain_game_created')
              } else {
                console.error('❌ HTTP request failed:', result.error)
              }
            } catch (error) {
              console.error('❌ HTTP request error:', error)
            }
            
            // Also try WebSocket as backup
            if (socket.connected) {
              try {
                socket.emit('onchain_game_created', { gameId: String(actualGameId) })
                console.log('✅ Also sent onchain_game_created via WebSocket')
              } catch (error) {
                console.warn('⚠️ WebSocket emit failed (HTTP already sent):', error)
              }
            }
            
            // Switch to game view to show waiting state - game will start when both players complete transactions
            console.log('🎮 Switching to game view - waiting for player 2 to complete transaction')
            // Don't call onGameStarted here - wait for backend to send game_started event when both players are ready
          } else if (isPlayer2) {
            console.log('🔗 Player 2: Joining on-chain game with escrow...')
            await anchorJoinGame(gameId)
            console.log('✅ Player 2: Joined game on-chain and confirmed')
            
            // Update UI to show we're waiting for player 1 (if they haven't completed)
            setGameState(prev => ({
              ...prev,
              gameStatus: 'waiting' as const
            }))
            
            // Notify backend that on-chain join is complete
            console.log('📤 Emitting onchain_game_joined with gameId:', gameId)
            console.log('📤 Socket connection status:', socket.connected ? 'CONNECTED' : 'DISCONNECTED')
            // Socket ID is not directly accessible from useSocket wrapper
            console.log('📤 Current game state gameId:', gameStateRef.current.gameId)
            
            // Ensure we're using the correct gameId from current state
            const actualGameId = gameStateRef.current.gameId || gameId
            console.log('📤 Sending event with gameId:', actualGameId)
            
            // Use HTTP as primary method for reliability (WebSocket can have connection issues)
            console.log('📤 Sending onchain_game_joined via HTTP (primary method)...')
            try {
              const response = await fetch('https://last-backend-7d8f5fbc0943.herokuapp.com/api/games/onchain/joined', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId: String(actualGameId) })
              })
              const result = await response.json()
              if (result.success) {
                console.log('✅ HTTP request succeeded for onchain_game_joined')
              } else {
                console.error('❌ HTTP request failed:', result.error)
              }
            } catch (error) {
              console.error('❌ HTTP request error:', error)
            }
            
            // Also try WebSocket as backup
            if (socket.connected) {
              try {
                socket.emit('onchain_game_joined', { gameId: String(actualGameId) })
                console.log('✅ Also sent onchain_game_joined via WebSocket')
              } catch (error) {
                console.warn('⚠️ WebSocket emit failed (HTTP already sent):', error)
              }
            }
            
            // Switch to game view to show waiting state - game will start when both players complete transactions
            console.log('🎮 Switching to game view - waiting for player 1 to complete transaction')
            // Don't call onGameStarted here - wait for backend to send game_started event when both players are ready
          } else {
            console.error('❌ Could not determine player position!', {
              myPlayerId,
              player1Id: gameStateData.player1?.id,
              player2Id: gameStateData.player2?.id
            })
          }
          
          const endTime = Date.now()
          console.log(`⏱️ On-chain transaction completed in ${endTime - startTime}ms`)
        } catch (error) {
          console.error('❌ Failed to create/join on-chain game:', error)
          options.onError?.('Failed to stake SOL: ' + (error as Error).message)
        }
      } else {
        console.log('⚠️ Skipping on-chain setup:', {
          currency,
          hasPublicKey: !!publicKey,
          gameType: gameStateData.gameType
        })
      }
    }
    
    const handleCreateOnchainGame = async (data: any) => {
      console.log('🔗 Received create_onchain_game event:', data)
      const gameStateData = data.gameState || data
      const gameId = data.gameId || gameStateData.gameId
      const currency = gameStateData.currency || 'points'
      const stakeAmount = data.stakeAmount || gameStateData.stakeAmount || 0
      
      if (currency === 'sol' && publicKey) {
        try {
          console.log('🔗 Player 1: Creating on-chain game with escrow...')
          await anchorCreateGame(gameId, stakeAmount, currency)
          console.log('✅ Player 1: Game created on-chain')
          
          // Notify backend that on-chain creation is complete
          socket.emit('onchain_game_created', { gameId })
        } catch (error) {
          console.error('❌ Failed to create on-chain game:', error)
          options.onError?.('Failed to stake SOL: ' + (error as Error).message)
        }
      }
    }
    
    const handleJoinOnchainGame = async (data: any) => {
      console.log('🔗 Received join_onchain_game event:', data)
      const gameStateData = data.gameState || data
      const gameId = data.gameId || gameStateData.gameId
      const currency = gameStateData.currency || 'points'
      
      if (currency === 'sol' && publicKey) {
        try {
          console.log('🔗 Player 2: Joining on-chain game with escrow...')
          await anchorJoinGame(gameId)
          console.log('✅ Player 2: Joined game on-chain')
          
          // Notify backend that on-chain join is complete
          socket.emit('onchain_game_joined', { gameId })
        } catch (error) {
          console.error('❌ Failed to join on-chain game:', error)
          options.onError?.('Failed to stake SOL: ' + (error as Error).message)
        }
      }
    }

    const handleMoveSubmitted = (data: any) => {
      console.log('✅ Move submitted:', data)
      
      // Use the playerId from the backend to determine which player made the move
      const moveMakerPlayerId = data.playerId;
      
      // Update the correct player's move state based on who actually made the move
      // Use prev state instead of external gameState to avoid stale closures
      setGameState(prev => {
        const isPlayer1Move = prev.player1?.id === moveMakerPlayerId;
        const isPlayer2Move = prev.player2?.id === moveMakerPlayerId;
        
        return {
          ...prev,
          player1: isPlayer1Move ? {
            ...prev.player1,
            currentMove: data.move,
            ready: true
          } : prev.player1,
          player2: isPlayer2Move && prev.player2 ? {
            ...prev.player2,
            currentMove: data.move,
            ready: true
          } : prev.player2
        }
      })
      options.onMoveSubmitted?.(data)
    }

    const handleRoundCompleted = (data: any) => {
      console.log('🏁 Round completed:', data)
      console.log('🏁 Round result details:', {
        roundWinner: data.roundResult?.roundWinner,
        player1Wallet: data.gameState?.player1?.wallet,
        player2Wallet: data.gameState?.player2?.wallet,
        currentUserWallet: publicKey?.toString(),
        scores: data.roundResult?.scores
      })
      
      // Determine the round result message
      let roundResultMessage = "It's a draw!"
      
      if (data.roundResult?.roundWinner === 'player1') {
        const isCurrentUserPlayer1 = data.gameState?.player1?.wallet === publicKey?.toString()
        roundResultMessage = isCurrentUserPlayer1 ? 'You won this round!' : 'You lost this round!'
        console.log('🏁 Player 1 won, current user is player 1:', isCurrentUserPlayer1)
      } else if (data.roundResult?.roundWinner === 'player2') {
        const isCurrentUserPlayer2 = data.gameState?.player2?.wallet === publicKey?.toString()
        roundResultMessage = isCurrentUserPlayer2 ? 'You won this round!' : 'You lost this round!'
        console.log('🏁 Player 2 won, current user is player 2:', isCurrentUserPlayer2)
      }
      
      console.log('🏁 Final round result message:', roundResultMessage)
      console.log('🎯 Setting game status to round-result')
      
      setGameState(prev => {
        console.log('🎯 Previous game state:', prev.gameStatus)
        console.log('🎯 Round result scores:', data.roundResult.scores)
        const newState = {
          ...prev,
          player1: {
            ...prev.player1,
            wins: data.roundResult.scores.player1,
            // Do not clear currentMove here, keep it for round result UI
            currentMove: data.gameState.player1?.currentMove ?? prev.player1.currentMove,
            ready: false,
          },
          player2: prev.player2 ? {
            ...prev.player2,
            wins: data.roundResult.scores.player2,
            // Do not clear currentMove here, keep it for round result UI
            currentMove: data.gameState.player2?.currentMove ?? prev.player2.currentMove,
            ready: false,
          } : null,
          currentRound: data.gameState.currentRound || prev.currentRound,
          roundResult: roundResultMessage,
          gameStatus: "round-result" as const,
        }
        console.log('🎯 New game state:', newState.gameStatus)
        return newState
      })
      options.onRoundCompleted?.(data)
    }

    const handleNextRound = (data: any) => {
      console.log('🔄 Next round:', data)
      
      // Add delay to allow round result to be displayed
      setTimeout(() => {
        console.log('🎯 Transitioning from round-result to playing')
        setGameState(prev => {
          console.log('🎯 Previous game state:', prev.gameStatus)
          const newState = {
            ...prev,
            currentRound: data.round,
            roundResult: null,
            gameStatus: "playing" as const,
            // Now clear currentMove for both players for the new round
            // Ready is derived from currentMove, so when cleared, ready is false
            player1: {
              ...prev.player1,
              currentMove: null,
              ready: false,
            },
            player2: prev.player2
              ? {
                  ...prev.player2,
                  currentMove: null,
                  ready: false,
                }
              : null,
          }
          console.log('🎯 New game state:', newState.gameStatus)
          return newState
        })
      }, 3000) // 3 second delay to show round result
    }

    const handlePlayerLeft = (data: any) => {
      console.log('👋 Player left:', data)
      
      // If the game was in progress, handle as a forfeit
      if (gameStateRef.current.gameStatus === 'playing') {
      const myPlayerId = publicKey?.toString().slice(0, 8)
      
        setGameState(prev => ({
          ...prev,
          gameStatus: 'game-over',
          winner: myPlayerId || null, // Ensure null as fallback, not undefined
          roundResult: 'You won! Your opponent left the game.',
        }))
        
        options.onGameFinished?.({
          gameId: data.gameId,
          winner: {
            playerId: myPlayerId,
            reason: 'opponent_quit'
          },
          quitReason: 'opponent_left'
        })
      } else {
        // If game was in waiting state, just reset
        setGameState({
          gameId: null,
          gameType: 'private',
          currency: 'points',
          player1: { id: 'you', wins: 0, currentMove: null, ready: false },
          player2: null,
          currentRound: 1,
          gameStatus: 'lobby',
          winner: null,
          stakeAmount: 0,
          totalPot: 0,
          roundResult: null,
          countdown: 0,
        })
        setIsInGame(false)
      }
    }

    const handlePlayerDeclinedInvitation = (data: any) => {
      console.log('❌ Player declined invitation:', data)
      const myPlayerId = publicKey?.toString().slice(0, 8)
      const gameStateData = gameStateRef.current
      
      // Only handle if we are the game creator (player1) and game is still waiting
      // Check both 'waiting' and 'waiting_for_player' statuses
      const isWaiting = gameStateData.gameStatus === 'waiting' || (gameStateData.gameStatus as any) === 'waiting_for_player'
      
      console.log('🔍 Checking decline invitation:', {
        gameType: gameStateData.gameType,
        player1Id: gameStateData.player1?.id,
        myPlayerId,
        gameStatus: gameStateData.gameStatus,
        isWaiting,
        gameId: data.gameId,
        currentGameId: gameStateData.gameId,
        isPrivate: gameStateData.gameType === 'private',
        isPlayer1: gameStateData.player1?.id === myPlayerId,
        gameIdMatch: data.gameId === gameStateData.gameId
      })
      
      if (gameStateData.gameType === 'private' && 
          gameStateData.player1?.id === myPlayerId && 
          isWaiting &&
          data.gameId === gameStateData.gameId) {
        console.log('📢 Invitation declined - showing error message and resetting game')
        
        // IMPORTANT: Set error message BEFORE resetting game state
        // This ensures the error is visible on the waiting screen
        options.onError?.('Player declined your invitation. Returning to lobby.')
        
        // Wait a bit before resetting to show the message
        setTimeout(() => {
          // Reset game state
          setGameState({
            gameId: null,
            gameType: 'private',
            currency: 'points',
            player1: { id: 'you', wins: 0, currentMove: null, ready: false },
            player2: null,
            currentRound: 1,
            gameStatus: 'lobby',
            winner: null,
            stakeAmount: 0,
            totalPot: 0,
            roundResult: null,
            countdown: 0,
          })
          setIsInGame(false)
        }, 3000) // Wait 3 seconds before resetting
      } else {
        console.log('⚠️ Decline invitation not handled:', {
          reason: gameStateData.gameType !== 'private' ? 'not private' :
                  gameStateData.player1?.id !== myPlayerId ? 'not player1' :
                  !isWaiting ? 'not waiting' :
                  data.gameId !== gameStateData.gameId ? 'gameId mismatch' : 'unknown'
        })
      }
    }

    const handleGameFinished = (data: any) => {
      console.log('🏁 Game finished:', data)
      
      setGameState(prev => {
        // Determine if current user is the winner
        let isUserWinner = false;
        if (
          data.winner?.playerId &&
          ((data.gameState?.player1?.wallet && publicKey && data.gameState.player1.wallet === publicKey.toString() && data.winner.position === 'player1') ||
           (data.gameState?.player2?.wallet && publicKey && data.gameState.player2.wallet === publicKey.toString() && data.winner.position === 'player2'))
        ) {
          isUserWinner = true;
        }
        return {
          ...prev,
          gameStatus: 'game-over',
          winner: data.winner?.playerId || null,
          winnerPosition: data.winner?.position || null,
          finalScores: data.finalScores || {
            player1: prev.player1.wins,
            player2: prev.player2?.wins || 0
          },
          payout: data.payout || {
            totalPot: prev.totalPot,
            winnerPayout: prev.totalPot,
            platformFee: 0
          },
          roundResult: isUserWinner
            ? 'You won the game!'
            : (data.winner?.playerId
                ? 'You lost the game! But you won 50 points as consolation.'
                : prev.roundResult)
        };
      })
      
      // For SOL games, winner must manually finalize to claim winnings
                  if (gameStateRef.current.currency === 'sol' && gameStateRef.current.gameId && data.gameState) {
              console.log('🚀 SOL game finished - AUTOMATIC winner distribution enabled')
              console.log('🏆 Modern standard: Winner receives winnings automatically')
              console.log('💰 Backend will handle smart contract finalization (0 popups for winner)')
              
              // Trigger automatic finalization for winner
              console.log('⚡ Triggering auto-finalization service...')
              
              // Refresh balance after auto-finalization completes
              // Wait a bit for the transaction to be confirmed
              setTimeout(() => {
                console.log('💰 Refreshing balance after game finalization...')
                refreshBalance()
              }, 3000) // Wait 3 seconds for finalization to complete
            }
      
      options.onGameFinished?.(data)
    }

    const handleGameError = (data: any) => {
      console.error('⚠️ Game error received:', {
        errorData: data,
        errorMessage: data?.message,
        errorGameId: data?.gameId,
        currentGameId: gameStateRef.current.gameId,
        gameStatus: gameStateRef.current.gameStatus
      })
      
      // Ignore errors from old games that we're no longer in
      if (data?.gameId && gameStateRef.current.gameId && data.gameId !== gameStateRef.current.gameId) {
        console.log('🔇 Ignoring error from old game:', data.gameId, '(current:', gameStateRef.current.gameId, ')')
        return
      }
      
      // Ignore errors when we're not in a game (lobby state)
      if (gameStateRef.current.gameStatus === 'lobby' || !gameStateRef.current.gameId) {
        console.log('🔇 Ignoring error - not in active game (status:', gameStateRef.current.gameStatus, ')')
        return
      }
      
      // Only show error if it's for the current game
      if (data?.message) {
        options.onError?.(data.message)
      }
    }

    const handleCountdownUpdate = (data: any) => {
      setGameState(prev => ({
        ...prev,
        countdown: data.countdown,
      }))
    }

    const handleMatchFound = async (data: any) => {
      console.log('🎯 Random match found:', data)
      const gameStateData = data.gameState || data
      const myPlayerId = publicKey?.toString().slice(0, 8)
      const gameId = data.gameId || gameStateData.gameId
      const currency = gameStateData.currency || 'points'
      const stakeAmount = gameStateData.stakeAmount || 0
      
      // Determine which player position we are
      const isPlayer1 = gameStateData.player1?.id === myPlayerId
      const isPlayer2 = gameStateData.player2?.id === myPlayerId
      
      // Don't create on-chain game here - wait for game_started event
      // This prevents SOL from being deducted before the second player joins
      
      setGameState({
        gameId,
        gameType: gameStateData.gameType || 'public',
        currency,
        player1: {
          id: gameStateData.player1?.id || null,
          wallet: gameStateData.player1?.wallet,
          wins: gameStateData.player1?.wins || 0,
          currentMove: gameStateData.player1?.currentMove,
          ready: !!gameStateData.player1?.currentMove,
        },
        player2: gameStateData.player2 ? {
          id: gameStateData.player2.id,
          wallet: gameStateData.player2.wallet,
          wins: gameStateData.player2.wins || 0,
          currentMove: gameStateData.player2.currentMove,
          ready: !!gameStateData.player2.currentMove,
        } : null,
        currentRound: gameStateData.currentRound || 1,
        gameStatus: gameStateData.gameStatus === 'playing' ? 'playing' : 'waiting',
        winner: gameStateData.winner,
        stakeAmount: gameStateData.stakeAmount,
        totalPot: gameStateData.totalPot,
        roundResult: null,
        countdown: 0,
      })
      setIsInGame(true)
      
      // Log match status
      if (isPlayer1) {
        console.log('🎯 Random match found - you are Player 1 (Host)')
      } else if (isPlayer2) {
        console.log('🎯 Random match found - you are Player 2')
      }
      
      options.onGameJoined?.(gameStateData)
    }

    const handlePlayerDisconnected = (data: any) => {
      console.log('🔌 Player disconnected:', data)
      
      const myPlayerId = publicKey?.toString().slice(0, 8)
      const disconnectedPlayerId = data.disconnectedPlayerId
      
      if (disconnectedPlayerId !== myPlayerId && gameStateRef.current.gameStatus === 'playing') {
        console.log('🏆 Opponent disconnected during active game - I win by forfeit!')
        
        setGameState(prev => ({
          ...prev,
          gameStatus: 'game-over',
          winner: myPlayerId || null, // Ensure null as fallback, not undefined
          roundResult: 'You won! Your opponent disconnected.',
        }))
        
        options.onGameFinished?.({
          gameId: data.gameId,
          winner: {
            playerId: myPlayerId,
            reason: 'opponent_disconnect'
          },
          gameState: data.gameState,
          quitReason: 'opponent_disconnected'
        })
      }
    }

    // Register event listeners
    const unsubscribers = [
      socket.on('game_created', handleGameCreated),
      socket.on('player_joined', handlePlayerJoined),
      socket.on('game_joined', handleGameJoined),
      socket.on('match_found', handleMatchFound),
      socket.on('game_started', handleGameStarted),
      socket.on('game_started_pre_tx', handleGameStartedPreTx),
      socket.on('create_onchain_game', handleCreateOnchainGame),
      socket.on('join_onchain_game', handleJoinOnchainGame),
      socket.on('move_submitted', handleMoveSubmitted),
      socket.on('round_completed', handleRoundCompleted),
      socket.on('game_finished', handleGameFinished),
      socket.on('player_left', handlePlayerLeft),
      socket.on('player_disconnected', handlePlayerDisconnected),
      socket.on('player_declined_invitation', handlePlayerDeclinedInvitation),
      socket.on('error', handleGameError),
      socket.on('countdown_update', handleCountdownUpdate),
      socket.on('next_round', handleNextRound),
    ]

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [socket.connected, socket.on, options, publicKey])

  // Game actions with proper error handling
  const createGame = useCallback(async (stakeAmount: number, gameType: 'private' | 'public' = 'private', currency: 'points' | 'sol' = 'points') => {
    if (!connected || !publicKey) {
      options.onError?.('Please connect your wallet first')
      return
    }

    try {
      console.log('Creating game with stake:', stakeAmount, 'currency:', currency)
      
      // Generate a unique game ID
      const gameId = `${Math.floor(Math.random() * 1000000)}`
      
      // Don't create on-chain game for private SOL games yet
      // Wait for second player to join, then handle it
      if (currency === 'sol' && gameType === 'private') {
        console.log('🔗 Private SOL game - will create on-chain when second player joins')
        // Skip on-chain creation for now
      }
      
      // Create game on backend (for both points and SOL games)
      socket.emit('create_game', {
        gameId,
        stakeAmount: currency === 'sol' ? stakeAmount : 100,
        gameType,
        currency,
        playerId: publicKey.toString().slice(0, 8),
        playerWallet: publicKey.toString(),
      })
      
      console.log('✅ Game creation request sent to backend')
    } catch (error) {
      console.error('❌ Failed to create game:', error)
      options.onError?.(error instanceof Error ? error.message : 'Failed to create game')
      throw error
    }
  }, [connected, publicKey, socket.emit, options, anchorCreateGame])

  const joinGame = useCallback(async (gameId?: string, currency: 'points' | 'sol' = 'points', stakeAmount: number = 100) => {
    console.log('🎮 joinGame called with:', { gameId, currency, stakeAmount })
    
    if (!publicKey || !socket.emit) {
      console.error('❌ No wallet or socket available for joining game')
      return
    }

    const currentPlayerId = publicKey.toString().slice(0, 8)
    console.log('👤 Current player ID:', currentPlayerId)

    try {
      if (gameId) {
        console.log('🔍 Joining specific game:', gameId)
        
        // First, get the game details to check if it's a SOL game
        console.log('📡 Fetching game details from backend...')
        const response = await fetch(`https://last-backend-7d8f5fbc0943.herokuapp.com/api/games/${gameId}`)
        const gameData = await response.json()
        
        console.log('📦 Game data received:', gameData)
        
        if (!gameData.success || !gameData.game) {
          console.error('❌ Game not found')
          options.onError?.('Game not found')
          return
        }
        
        const actualCurrency = gameData.game.currency
        const actualStakeAmount = gameData.game.stakeAmount
        
        console.log('💰 Game details:', { currency: actualCurrency, stakeAmount: actualStakeAmount })
        
      // For private SOL games, the on-chain setup happens in handlePlayerJoined
      // Don't stake SOL here
      if (actualCurrency === 'sol') {
        console.log('🔗 SOL game detected - on-chain setup handled in player_joined event')
      }
        
        // Now join the backend game
        socket.emit('join_game', {
          gameId,
          playerWallet: publicKey.toString(),
          playerId: currentPlayerId,
          currency: actualCurrency
        })
      } else {
        console.log('Finding random game with stake amount:', stakeAmount, 'currency:', currency)
        
        socket.emit('find_random_match', {
          stakeAmount,
          currency,
          playerId: currentPlayerId,
          playerWallet: publicKey.toString(),
        })
      }
      console.log('✅ Game join request sent')
    } catch (error) {
      console.error('❌ Failed to join game:', error)
      options.onError?.(error instanceof Error ? error.message : 'Failed to join game')
      throw error
    }
  }, [publicKey, socket.emit, options, anchorJoinGame, anchorCreateGame])

  const makeMove = useCallback(async (move: 'rock' | 'paper' | 'scissors') => {
    if (!publicKey || !gameStateRef.current.gameId || !socket.emit) {
      console.error('Cannot make move: missing requirements')
      return
    }

    const currentPlayerId = publicKey.toString().slice(0, 8)
    console.log('🎯 Making move:', move, 'for player:', currentPlayerId)

    try {
      console.log('Making move:', move)
      socket.emit('submit_move', {
        gameId: gameStateRef.current.gameId,
        playerId: currentPlayerId,
        move,
      })
      console.log('✅ Move submitted successfully')
    } catch (error) {
      console.error('❌ Failed to submit move:', error)
      throw error
    }
  }, [publicKey, socket.emit])

  const startGame = useCallback(async () => {
    if (!publicKey || !gameStateRef.current.gameId || !socket.emit) {
      console.error('Cannot start game: missing requirements')
      return
    }

    try {
      console.log('🚀 Host starting game:', gameStateRef.current.gameId)
      socket.emit('start_game', {
        gameId: gameStateRef.current.gameId,
      })
      console.log('✅ Game start request sent')
    } catch (error) {
      console.error('❌ Failed to start game:', error)
      throw error
    }
  }, [publicKey, socket.emit])

  const leaveGame = useCallback(async () => {
    if (!publicKey || !gameStateRef.current.gameId || !socket.emit) {
      console.error('Cannot leave game: missing requirements')
      return
    }

    try {
      console.log('🚪 Leaving game...')
      
      // Use critical event with acknowledgment to ensure the server receives it
      socket.emit('leave_game', {
        gameId: gameStateRef.current.gameId,
        playerId: publicKey?.toString().slice(0, 8),
      })
      console.log('✅ Leave game request sent')
    } catch (error) {
      console.error('Failed to leave game properly:', error)
      // Even if the leave event fails, we should still clean up locally
      console.log('⚠️ Proceeding with local cleanup despite server error')
    }
    
    // Always reset local state
    setGameState({
      gameId: null,
      gameType: 'private',
      currency: 'points',
      player1: { id: 'you', wins: 0, currentMove: null, ready: false },
      player2: null,
      currentRound: 1,
      gameStatus: 'lobby',
      winner: null,
      stakeAmount: 0,
      totalPot: 0,
      roundResult: null,
      countdown: 0,
    })
    setIsInGame(false)
  }, [publicKey, socket])

  const resetGameState = useCallback(() => {
    console.log('🔄 Resetting game state in hook...')
    setGameState({
      gameId: null,
      gameType: 'private',
      currency: 'points',
      player1: { id: 'you', wins: 0, currentMove: null, ready: false },
      player2: null,
      currentRound: 1,
      gameStatus: 'lobby',
      winner: null,
      stakeAmount: 0,
      totalPot: 0,
      roundResult: null,
      countdown: 0,
    })
    setIsInGame(false)
  }, [])

  return {
    gameState,
    isInGame,
    createGame,
    joinGame,
    makeMove,
    startGame,
    leaveGame,
    resetGameState,
    isConnected: socket.connected,
    socket, // Expose socket for advanced operations
  }
} 