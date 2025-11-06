import { useCallback, useEffect, useState, useMemo } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { usePrivyWallet as useWallet } from './use-privy-wallet'

// MagicBlock endpoints
const MAGICBLOCK_DEVNET_URL = process.env.NEXT_PUBLIC_MAGICBLOCK_DEVNET_URL || 'https://devnet.magicblock.app'
const MAGICBLOCK_ROUTER_URL = process.env.NEXT_PUBLIC_MAGICBLOCK_ROUTER_URL || 'https://devnet-rpc.magicblock.app'
const BASE_LAYER_URL = 'https://api.devnet.solana.com' // Force devnet

export type ConnectionType = 'base' | 'ephemeral' | 'router'

interface ConnectionHealth {
  isHealthy: boolean
  latency: number
  lastChecked: number
}

interface MagicBlockConnectionState {
  baseConnection: Connection
  ephemeralConnection: Connection
  routerConnection: Connection
  activeConnection: Connection
  activeType: ConnectionType
  health: Record<ConnectionType, ConnectionHealth>
  isConnecting: boolean
  error: string | null
}

export const useMagicBlockConnection = () => {
  const wallet = useWallet()
  
  // Initialize connections
  const baseConnection = useMemo(() => new Connection(BASE_LAYER_URL, 'confirmed'), [])
  const ephemeralConnection = useMemo(() => new Connection(MAGICBLOCK_DEVNET_URL, 'confirmed'), [])
  const routerConnection = useMemo(() => new Connection(MAGICBLOCK_ROUTER_URL, 'confirmed'), [])
  
  const [state, setState] = useState<MagicBlockConnectionState>({
    baseConnection,
    ephemeralConnection,
    routerConnection,
    activeConnection: baseConnection,
    activeType: 'base',
    health: {
      base: { isHealthy: false, latency: 0, lastChecked: 0 },
      ephemeral: { isHealthy: false, latency: 0, lastChecked: 0 },
      router: { isHealthy: false, latency: 0, lastChecked: 0 }
    },
    isConnecting: false,
    error: null
  })

  // Health check function
  const checkConnectionHealth = useCallback(async (
    connection: Connection,
    type: ConnectionType
  ): Promise<ConnectionHealth> => {
    const startTime = Date.now()
    try {
      await connection.getLatestBlockhash('confirmed')
      const latency = Date.now() - startTime
      
      return {
        isHealthy: true,
        latency,
        lastChecked: Date.now()
      }
    } catch (error) {
      return {
        isHealthy: false,
        latency: Date.now() - startTime,
        lastChecked: Date.now()
      }
    }
  }, [])

  // Check all connection health
  const checkAllConnections = useCallback(async () => {
    try {
      const [baseHealth, ephemeralHealth, routerHealth] = await Promise.all([
        checkConnectionHealth(baseConnection, 'base'),
        checkConnectionHealth(ephemeralConnection, 'ephemeral'),
        checkConnectionHealth(routerConnection, 'router')
      ])

      setState(prev => ({
        ...prev,
        health: {
          base: baseHealth,
          ephemeral: ephemeralHealth,
          router: routerHealth
        },
        error: null
      }))

      return { baseHealth, ephemeralHealth, routerHealth }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Connection health check failed'
      }))
      throw error
    }
  }, [baseConnection, ephemeralConnection, routerConnection, checkConnectionHealth])

  // Switch active connection
  const switchConnection = useCallback((type: ConnectionType) => {
    setState(prev => {
      let newConnection: Connection
      
      switch (type) {
        case 'ephemeral':
          newConnection = prev.ephemeralConnection
          break
        case 'router':
          newConnection = prev.routerConnection
          break
        default:
          newConnection = prev.baseConnection
      }

      return {
        ...prev,
        activeConnection: newConnection,
        activeType: type
      }
    })
  }, [])

  // Get best available connection based on health
  const getBestConnection = useCallback((): { connection: Connection; type: ConnectionType } => {
    const healthyConnections = Object.entries(state.health)
      .filter(([_, health]) => health.isHealthy)
      .sort(([_, a], [__, b]) => a.latency - b.latency)

    if (healthyConnections.length === 0) {
      // Fallback to base layer if no healthy connections
      return { connection: state.baseConnection, type: 'base' }
    }

    const [bestType] = healthyConnections[0]
    const type = bestType as ConnectionType

    switch (type) {
      case 'ephemeral':
        return { connection: state.ephemeralConnection, type: 'ephemeral' }
      case 'router':
        return { connection: state.routerConnection, type: 'router' }
      default:
        return { connection: state.baseConnection, type: 'base' }
    }
  }, [state.health, state.baseConnection, state.ephemeralConnection, state.routerConnection])

  // Auto-switch to best connection
  const switchToBestConnection = useCallback(() => {
    const { connection, type } = getBestConnection()
    
    if (type !== state.activeType) {
      setState(prev => ({
        ...prev,
        activeConnection: connection,
        activeType: type
      }))
    }
  }, [getBestConnection, state.activeType])

  // Initialize connections and health checks
  useEffect(() => {
    let mounted = true
    let healthCheckInterval: NodeJS.Timeout

    const initialize = async () => {
      if (!mounted) return

      setState(prev => ({ ...prev, isConnecting: true }))

      try {
        // Initial health check
        await checkAllConnections()
        
        // Set up periodic health checks (every 30 seconds)
        healthCheckInterval = setInterval(() => {
          if (mounted) {
            checkAllConnections().catch(console.error)
          }
        }, 30000)

        setState(prev => ({ ...prev, isConnecting: false }))
      } catch (error) {
        if (mounted) {
          setState(prev => ({
            ...prev,
            isConnecting: false,
            error: error instanceof Error ? error.message : 'Failed to initialize connections'
          }))
        }
      }
    }

    initialize()

    return () => {
      mounted = false
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval)
      }
    }
  }, [checkAllConnections])

  // Utility functions for specific operations
  const getConnectionForOperation = useCallback((preferEphemeral = false): Connection => {
    if (preferEphemeral && state.health.ephemeral.isHealthy) {
      return state.ephemeralConnection
    }
    
    if (state.health.router.isHealthy) {
      return state.routerConnection
    }
    
    return state.baseConnection
  }, [state.health, state.ephemeralConnection, state.routerConnection, state.baseConnection])

  const isEphemeralAvailable = useCallback((): boolean => {
    return state.health.ephemeral.isHealthy
  }, [state.health.ephemeral.isHealthy])

  const getConnectionStatus = useCallback(() => {
    const healthyCount = Object.values(state.health).filter(h => h.isHealthy).length
    const totalConnections = Object.keys(state.health).length
    
    return {
      healthy: healthyCount,
      total: totalConnections,
      isFullyHealthy: healthyCount === totalConnections,
      activeType: state.activeType,
      latency: state.health[state.activeType].latency
    }
  }, [state.health, state.activeType])

  return {
    // Connections
    baseConnection: state.baseConnection,
    ephemeralConnection: state.ephemeralConnection,
    routerConnection: state.routerConnection,
    activeConnection: state.activeConnection,
    
    // State
    activeType: state.activeType,
    health: state.health,
    isConnecting: state.isConnecting,
    error: state.error,
    
    // Actions
    switchConnection,
    switchToBestConnection,
    checkAllConnections,
    
    // Utilities
    getConnectionForOperation,
    getBestConnection,
    isEphemeralAvailable,
    getConnectionStatus,
    
    // Computed properties
    isHealthy: Object.values(state.health).some(h => h.isHealthy),
    bestLatency: Math.min(...Object.values(state.health).filter(h => h.isHealthy).map(h => h.latency)) || 0
  }
}