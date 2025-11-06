import { useEffect, useState, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

export interface SocketState {
  connected: boolean
  connecting: boolean
  error: string | null
  socket: Socket | null
}

export interface UseSocketOptions {
  url?: string
  onConnect?: () => void
  onDisconnect?: (reason: string) => void
  onError?: (error: Error) => void
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const {
    url = 'https://last-backend-7d8f5fbc0943.herokuapp.com', // Backend server URL
    onConnect,
    onDisconnect,
    onError,
  } = options

  const [state, setState] = useState<SocketState>({
    connected: false,
    connecting: false,
    error: null,
    socket: null,
  })

  const socketRef = useRef<Socket | null>(null)
  const onConnectRef = useRef(onConnect)
  const onDisconnectRef = useRef(onDisconnect)
  const onErrorRef = useRef(onError)

  // Update refs when callbacks change
  useEffect(() => {
    onConnectRef.current = onConnect
    onDisconnectRef.current = onDisconnect
    onErrorRef.current = onError
  })

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('🔌 Already connected, skipping')
      return
    }

    console.log('🔌 Connecting to WebSocket at:', url)
    setState(prev => ({ ...prev, connecting: true, error: null }))

    try {
      const socket = io(url, {
        transports: ['polling', 'websocket'], // Try polling first, then websocket
        timeout: 10000,
        retries: 5,
        forceNew: false, // Allow socket reuse
        upgrade: true,
        rememberUpgrade: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: 10,
      })

      socketRef.current = socket

      socket.on('connect', () => {
        console.log('🔌 Socket connected:', socket.id)
        console.log('🔌 Previous socket was:', socketRef.current?.id)
        setState(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null,
          socket,
        }))
        onConnectRef.current?.()
      })

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason)
        setState(prev => ({
          ...prev,
          connected: false,
          connecting: false,
          socket: null,
        }))
        onDisconnectRef.current?.(reason)
      })

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        setState(prev => ({
          ...prev,
          connected: false,
          connecting: false,
          error: error.message || 'Connection failed',
          socket: null,
        }))
        onErrorRef.current?.(error)
      })

      socket.on('error', (error) => {
        console.error('Socket error:', error)
        setState(prev => ({
          ...prev,
          error: error.message || 'Socket error',
        }))
        onErrorRef.current?.(error)
      })

      socket.on('reconnect', (attemptNumber) => {
        console.log('🔌 Socket reconnected after', attemptNumber, 'attempts')
        setState(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null,
        }))
        onConnectRef.current?.()
      })

      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('🔌 Reconnection attempt', attemptNumber)
        setState(prev => ({
          ...prev,
          connecting: true,
          error: `Reconnecting... (attempt ${attemptNumber})`,
        }))
      })

      socket.on('reconnect_error', (error) => {
        console.error('🔌 Reconnection error:', error)
        setState(prev => ({
          ...prev,
          error: `Reconnection failed: ${error.message}`,
        }))
      })

      socket.on('reconnect_failed', () => {
        console.error('🔌 Reconnection failed after all attempts')
        setState(prev => ({
          ...prev,
          connected: false,
          connecting: false,
          error: 'Connection lost. Please refresh the page.',
        }))
      })

    } catch (error) {
      console.error('Failed to create socket:', error)
      setState(prev => ({
        ...prev,
        connecting: false,
        error: error instanceof Error ? error.message : 'Failed to create socket',
      }))
    }
  }, [url])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        socket: null,
      }))
    }
  }, [])

  const emit = useCallback((event: string, data?: any) => {
    // Always use the current socket from ref, not state
    const currentSocket = socketRef.current
    if (currentSocket?.connected) {
      console.log(`🔌 Emitting ${event} on socket:`, currentSocket.id, 'Data:', data)
      try {
        currentSocket.emit(event, data)
        console.log(`✅ Event ${event} emitted successfully`)
      } catch (error) {
        console.error(`❌ Error emitting ${event}:`, error)
      }
    } else {
      console.warn(`🔌 Cannot emit ${event} - socket not connected. Socket ref exists:`, !!currentSocket, 'Connected:', currentSocket?.connected)
    }
  }, [])

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
      return () => socketRef.current?.off(event, callback)
    }
    return () => {}
  }, [])

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback)
    }
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    console.log('🔌 useSocket: Initializing with URL:', url)
    connect()
    
    return () => {
      console.log('🔌 useSocket: Cleaning up connection')
      disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  return {
    ...state,
    connect,
    disconnect,
    emit,
    on,
    off,
  }
} 