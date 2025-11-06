import React from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { Badge } from './ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { useMagicBlockConnection } from '../hooks/use-magicblock-connection'

interface NetworkStatusProps {
  className?: string
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ className = '' }) => {
  const { authenticated } = usePrivy()
  const connected = authenticated // Use Privy authentication state
  const magicBlock = useMagicBlockConnection()

  const getNetworkStatus = () => {
    if (!connected) {
      return {
        status: 'disconnected',
        badge: <Badge variant="secondary" className="text-gray-600">🔌 Wallet Disconnected</Badge>,
        details: 'Connect your wallet to see network status'
      }
    }

    const healthyConnections = Object.values(magicBlock.health).filter(h => h.isHealthy).length
    const totalConnections = Object.keys(magicBlock.health).length

    if (healthyConnections === 0) {
      return {
        status: 'error',
        badge: <Badge variant="destructive" className="text-white">❌ Network Error</Badge>,
        details: 'No healthy connections available'
      }
    }

    if (magicBlock.isEphemeralAvailable) {
      return {
        status: 'base',
        badge: <Badge variant="default" className="bg-green-500 text-white">🌐 Connected</Badge>,
        details: `Network ready (${healthyConnections}/${totalConnections} connections healthy)`
      }
    }

    return {
      status: 'base',
      badge: <Badge variant="outline" className="text-blue-600 border-blue-600">🌐 Connected</Badge>,
      details: `Network ready (${healthyConnections}/${totalConnections} connections healthy)`
    }
  }

  const { badge, details } = getNetworkStatus()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={className}>
            {badge}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2">
            <p className="font-medium">{details}</p>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Network:</span>
                <span className={magicBlock.health.base.isHealthy ? 'text-green-400' : 'text-red-400'}>
                  {magicBlock.health.base.isHealthy ? '✅' : '❌'} {magicBlock.health.base.latency}ms
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Network: Devnet
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}