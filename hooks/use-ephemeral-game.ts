import { useCallback, useEffect, useState, useRef } from 'react'
import { usePrivyWallet as useWallet } from '@/hooks/use-privy-wallet'
import { useMagicBlockConnection } from './use-magicblock-connection'
import { useAnchorProgram } from './use-anchor-program'

export interface EphemeralGameConfig {
  autoDelegate: boolean
  autoCommit: boolean
  autoUndelegate: boolean
  commitIntervalMs: number
  maxLifetimeMs: number
  blockTimeMs: number
}

export interface EphemeralGameState {
  isDelegated: boolean
  isCommitting: boolean
  lastCommitTime: number | null
  delegationStartTime: number | null
  commitCount: number
  error: string | null
  performance: {
    delegationLatency: number
    avgCommitLatency: number
    estimatedBlockTime: number
  }
}

const DEFAULT_CONFIG: EphemeralGameConfig = {
  autoDelegate: true,      // ENABLED - MagicBlock ephemeral rollup for ultra-fast gameplay
  autoCommit: true,       // ENABLED - Auto-commit game state to base layer
  autoUndelegate: true,   // ENABLED - Auto-undelegate when game ends
  commitIntervalMs: 30000, // Commit every 30 seconds to base layer
  maxLifetimeMs: 300000,   // 5 minutes max delegation
  blockTimeMs: 10          // Expected 10ms block time (vs 400ms on base layer)
}

export const useEphemeralGame = (
  gameId: string | null,
  config: Partial<EphemeralGameConfig> = {}
) => {
  const wallet = useWallet()
  const magicBlock = useMagicBlockConnection()
  const anchorProgram = useAnchorProgram()
  
  const fullConfig = { ...DEFAULT_CONFIG, ...config }
  const commitIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const performanceRef = useRef<number[]>([])
  
  const [state, setState] = useState<EphemeralGameState>({
    isDelegated: false,
    isCommitting: false,
    lastCommitTime: null,
    delegationStartTime: null,
    commitCount: 0,
    error: null,
    performance: {
      delegationLatency: 0,
      avgCommitLatency: 0,
      estimatedBlockTime: fullConfig.blockTimeMs
    }
  })

  // Clear commit interval when component unmounts or gameId changes
  useEffect(() => {
    return () => {
      if (commitIntervalRef.current) {
        clearInterval(commitIntervalRef.current)
      }
    }
  }, [gameId])

  // Monitor delegation lifetime and auto-undelegate if needed
  useEffect(() => {
    if (!state.isDelegated || !state.delegationStartTime) return

    const checkLifetime = () => {
      const elapsed = Date.now() - state.delegationStartTime!
      if (elapsed > fullConfig.maxLifetimeMs) {
        console.log('⏰ Delegation lifetime exceeded, auto-undelegating...')
        undelegateGame()
      }
    }

    const lifetimeCheck = setInterval(checkLifetime, 30000) // Check every 30s
    return () => clearInterval(lifetimeCheck)
  }, [state.isDelegated, state.delegationStartTime, fullConfig.maxLifetimeMs])

  // Auto-delegate game when gameId is available and wallet connected
  const autoDelegate = useCallback(async () => {
    if (!gameId || !wallet.connected || !fullConfig.autoDelegate) return
    if (state.isDelegated || !magicBlock.isEphemeralAvailable()) return

    try {
      console.log('🚀 Auto-delegating game to ephemeral rollup:', gameId)
      
      const startTime = Date.now()
      const success = await anchorProgram.delegateGame(gameId, {
        lifetimeMs: fullConfig.maxLifetimeMs,
        updateFrequencyMs: fullConfig.commitIntervalMs,
        expectedBlockTime: fullConfig.blockTimeMs
      })
      
      if (success) {
        const latency = Date.now() - startTime
        setState(prev => ({
          ...prev,
          isDelegated: true,
          delegationStartTime: Date.now(),
          error: null,
          performance: {
            ...prev.performance,
            delegationLatency: latency
          }
        }))

        // Start auto-commit if enabled
        if (fullConfig.autoCommit) {
          startAutoCommit()
        }
      }
    } catch (error) {
      console.error('Failed to auto-delegate game:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Auto-delegation failed'
      }))
    }
  }, [gameId, wallet.connected, fullConfig, state.isDelegated, magicBlock, anchorProgram])

  // Manual delegation
  const delegateGame = useCallback(async () => {
    if (!gameId || !wallet.connected) return false

    try {
      setState(prev => ({ ...prev, error: null }))
      
      const startTime = Date.now()
      const success = await anchorProgram.delegateGame(gameId, {
        lifetimeMs: fullConfig.maxLifetimeMs,
        updateFrequencyMs: fullConfig.commitIntervalMs,
        expectedBlockTime: fullConfig.blockTimeMs
      })
      
      if (success) {
        const latency = Date.now() - startTime
        setState(prev => ({
          ...prev,
          isDelegated: true,
          delegationStartTime: Date.now(),
          performance: {
            ...prev.performance,
            delegationLatency: latency
          }
        }))

        if (fullConfig.autoCommit) {
          startAutoCommit()
        }
      }
      
      return success
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Delegation failed'
      }))
      return false
    }
  }, [gameId, wallet.connected, anchorProgram, fullConfig])

  // Start automatic state commits
  const startAutoCommit = useCallback(() => {
    if (!fullConfig.autoCommit || commitIntervalRef.current) return

    console.log(`⚡ Starting auto-commit every ${fullConfig.commitIntervalMs}ms`)
    
    commitIntervalRef.current = setInterval(async () => {
      if (!state.isDelegated || state.isCommitting) return

      try {
        setState(prev => ({ ...prev, isCommitting: true }))
        
        const startTime = Date.now()
        const success = await anchorProgram.commitGameState(gameId!)
        
        if (success) {
          const latency = Date.now() - startTime
          performanceRef.current.push(latency)
          
          // Keep only last 10 measurements for average
          if (performanceRef.current.length > 10) {
            performanceRef.current = performanceRef.current.slice(-10)
          }
          
          const avgLatency = performanceRef.current.reduce((a, b) => a + b, 0) / performanceRef.current.length
          
          setState(prev => ({
            ...prev,
            isCommitting: false,
            lastCommitTime: Date.now(),
            commitCount: prev.commitCount + 1,
            performance: {
              ...prev.performance,
              avgCommitLatency: avgLatency
            }
          }))
        } else {
          setState(prev => ({ ...prev, isCommitting: false }))
        }
      } catch (error) {
        console.error('Auto-commit failed:', error)
        setState(prev => ({
          ...prev,
          isCommitting: false,
          error: error instanceof Error ? error.message : 'Auto-commit failed'
        }))
      }
    }, fullConfig.commitIntervalMs)
  }, [fullConfig.autoCommit, fullConfig.commitIntervalMs, state.isDelegated, state.isCommitting, anchorProgram, gameId])

  // Stop automatic commits
  const stopAutoCommit = useCallback(() => {
    if (commitIntervalRef.current) {
      clearInterval(commitIntervalRef.current)
      commitIntervalRef.current = null
      console.log('⏹️ Stopped auto-commit')
    }
  }, [])

  // Manual commit
  const commitGameState = useCallback(async () => {
    if (!gameId || !state.isDelegated) return false

    try {
      setState(prev => ({ ...prev, isCommitting: true, error: null }))
      
      const startTime = Date.now()
      const success = await anchorProgram.commitGameState(gameId)
      
      if (success) {
        const latency = Date.now() - startTime
        setState(prev => ({
          ...prev,
          isCommitting: false,
          lastCommitTime: Date.now(),
          commitCount: prev.commitCount + 1
        }))
      } else {
        setState(prev => ({ ...prev, isCommitting: false }))
      }
      
      return success
    } catch (error) {
      setState(prev => ({
        ...prev,
        isCommitting: false,
        error: error instanceof Error ? error.message : 'Commit failed'
      }))
      return false
    }
  }, [gameId, state.isDelegated, anchorProgram])

  // Undelegate game
  const undelegateGame = useCallback(async () => {
    if (!gameId || !state.isDelegated) return false

    try {
      setState(prev => ({ ...prev, error: null }))
      
      // Stop auto-commits first
      stopAutoCommit()
      
      const success = await anchorProgram.undelegateGame(gameId)
      
      if (success) {
        setState(prev => ({
          ...prev,
          isDelegated: false,
          isCommitting: false,
          delegationStartTime: null,
          lastCommitTime: null,
          commitCount: 0
        }))
      }
      
      return success
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Undelegation failed'
      }))
      return false
    }
  }, [gameId, state.isDelegated, anchorProgram, stopAutoCommit])

  // Auto-undelegate when game ends
  const autoUndelegateOnEnd = useCallback(async () => {
    if (!fullConfig.autoUndelegate || !state.isDelegated) return

    console.log('🏁 Game ended, auto-undelegating...')
    await undelegateGame()
  }, [fullConfig.autoUndelegate, state.isDelegated, undelegateGame])

  // Enhanced move submission using ephemeral rollup
  const submitMoveEphemeral = useCallback(async (move: number, nonce: number) => {
    if (!gameId) return null

    try {
      const startTime = Date.now()
      const signature = await anchorProgram.submitMoveEphemeral(gameId, move, nonce)
      const latency = Date.now() - startTime
      
      // Update estimated block time based on actual performance
      setState(prev => ({
        ...prev,
        performance: {
          ...prev.performance,
          estimatedBlockTime: Math.min(latency, prev.performance.estimatedBlockTime)
        }
      }))
      
      return signature
    } catch (error) {
      console.error('Ephemeral move submission failed:', error)
      throw error
    }
  }, [gameId, anchorProgram])

  // Enhanced move revelation using ephemeral rollup
  const revealMoveEphemeral = useCallback(async (move: { rock?: {} } | { paper?: {} } | { scissors?: {} }, nonce: any) => {
    if (!gameId) return null

    try {
      const signature = await anchorProgram.revealMoveEphemeral(gameId, move, nonce)
      return signature
    } catch (error) {
      console.error('Ephemeral move revelation failed:', error)
      throw error
    }
  }, [gameId, anchorProgram])

  // Auto-delegate when conditions are met (DISABLED - prevents mainnet error)
  // useEffect(() => {
  //   if (gameId && wallet.connected && magicBlock.isEphemeralAvailable()) {
  //     autoDelegate()
  //   }
  // }, [gameId, wallet.connected, magicBlock.isEphemeralAvailable(), autoDelegate])

  // Status helpers
  const getStatus = useCallback(() => {
    if (!magicBlock.isEphemeralAvailable()) return 'unavailable'
    if (state.isDelegated) return 'delegated'
    if (gameId && wallet.connected) return 'ready'
    return 'waiting'
  }, [magicBlock.isEphemeralAvailable(), state.isDelegated, gameId, wallet.connected])

  const getStatusMessage = useCallback(() => {
    const status = getStatus()
    switch (status) {
      case 'unavailable': return 'Ephemeral rollup unavailable'
      case 'delegated': return `Ephemeral mode active (${state.commitCount} commits)`
      case 'ready': return 'Ready for ephemeral delegation'
      case 'waiting': return 'Waiting for game and wallet'
      default: return 'Unknown status'
    }
  }, [getStatus, state.commitCount])

  const getBenefits = useCallback(() => {
    if (!state.isDelegated) return null
    
    const baseBlockTime = 400 // Base layer ~400ms
    const improvement = Math.round((baseBlockTime - state.performance.estimatedBlockTime) / baseBlockTime * 100)
    
    return {
      blockTimeImprovement: `${improvement}% faster`,
      estimatedBlockTime: `~${state.performance.estimatedBlockTime}ms`,
      totalCommits: state.commitCount,
      avgCommitTime: `${Math.round(state.performance.avgCommitLatency)}ms`
    }
  }, [state.isDelegated, state.performance, state.commitCount])

  return {
    // State
    ...state,
    status: getStatus(),
    statusMessage: getStatusMessage(),
    benefits: getBenefits(),
    
    // Actions
    delegateGame,
    undelegateGame,
    commitGameState,
    autoUndelegateOnEnd,
    
    // Enhanced gaming functions
    submitMoveEphemeral,
    revealMoveEphemeral,
    
    // Control
    startAutoCommit,
    stopAutoCommit,
    
    // Connection info
    magicBlockHealth: magicBlock.health,
    isEphemeralAvailable: magicBlock.isEphemeralAvailable()
  }
}