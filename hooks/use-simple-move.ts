import { useCallback } from 'react'
import { io } from 'socket.io-client'

export const useSimpleMove = () => {
  const submitMove = useCallback((gameId: string, playerId: string, move: string) => {
    console.log('🔥 Using simple move fallback for:', { gameId, playerId, move })
    
    // Create a fresh socket connection just for this move
    const socket = io('https://last-backend-7d8f5fbc0943.herokuapp.com', {
      transports: ['polling', 'websocket'],
      timeout: 5000,
      forceNew: true, // Always create a new connection
    })

    socket.on('connect', () => {
      console.log('🔥 Simple move socket connected:', socket.id)
      
      // Submit the move immediately upon connection
      socket.emit('submit_move', {
        gameId,
        playerId,
        move,
      })
      
      console.log('🔥 Simple move submitted via fresh socket')
      
      // Disconnect after a short delay to ensure the message is sent
      setTimeout(() => {
        socket.disconnect()
      }, 1000)
    })

    socket.on('connect_error', (error) => {
      console.error('🔥 Simple move socket error:', error)
      socket.disconnect()
    })

  }, [])

  const leaveGame = useCallback((gameId: string, playerId: string) => {
    console.log('🚪 Using fresh socket to leave game:', { gameId, playerId })
    
    // Create a fresh socket connection just for leaving
    const socket = io('https://last-backend-7d8f5fbc0943.herokuapp.com', {
      transports: ['polling', 'websocket'],
      timeout: 5000,
      forceNew: true, // Always create a new connection
    })

    socket.on('connect', () => {
      console.log('🚪 Leave game socket connected:', socket.id)
      
      // Send leave_game event immediately upon connection
      socket.emit('leave_game', {
        gameId,
        playerId,
      })
      
      console.log('🚪 Leave game event sent via fresh socket')
      
      // Disconnect after a short delay to ensure the message is sent
      setTimeout(() => {
        socket.disconnect()
      }, 1000)
    })

    socket.on('connect_error', (error) => {
      console.error('🚪 Leave game socket error:', error)
      socket.disconnect()
    })

  }, [])

  return {
    submitMove,
    leaveGame
  }
} 