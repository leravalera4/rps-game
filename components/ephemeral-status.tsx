import React from 'react'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { useEphemeralGame } from '../hooks/use-ephemeral-game'

interface EphemeralStatusProps {
  gameId: string | null
  className?: string
  showDetails?: boolean
}

export const EphemeralStatus: React.FC<EphemeralStatusProps> = ({
  gameId,
  className = '',
  showDetails = false
}) => {
  const ephemeral = useEphemeralGame(gameId)

  if (!ephemeral.isEphemeralAvailable) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="secondary" className={className}>
              Base Layer
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ephemeral rollup unavailable - using base layer</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const getStatusBadge = () => {
    switch (ephemeral.status) {
      case 'delegated':
        return <Badge variant="default" className="bg-green-500 text-white">⚡ {ephemeral.benefits?.blockTimeImprovement}</Badge>
      case 'ready':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">🚀 Ephemeral Ready</Badge>
      case 'waiting':
        return <Badge variant="secondary" className="text-gray-600">⏳ Waiting</Badge>
      case 'unavailable':
        return <Badge variant="secondary" className="text-orange-600">⚠️ Base Layer</Badge>
      default:
        return <Badge variant="secondary" className="text-gray-600">❓ Unknown</Badge>
    }
  }

  const getLifetimeProgress = () => {
    if (!ephemeral.isDelegated || !ephemeral.delegationStartTime) return 0
    
    const elapsed = Date.now() - ephemeral.delegationStartTime
    const maxLifetime = 300000 // 5 minutes default
    return Math.min((elapsed / maxLifetime) * 100, 100)
  }

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className={className}>
              {getStatusBadge()}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{ephemeral.statusMessage}</p>
              {ephemeral.benefits && (
                <>
                  <p>Block time: {ephemeral.benefits.estimatedBlockTime}</p>
                  <p>Commits: {ephemeral.benefits.totalCommits}</p>
                </>
              )}
              {ephemeral.error && (
                <p className="text-red-400">Error: {ephemeral.error}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          MagicBlock Ephemeral Rollup
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ephemeral.isDelegated && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Session Lifetime</span>
              <span>{Math.round(getLifetimeProgress())}%</span>
            </div>
            <Progress value={getLifetimeProgress()} className="h-1" />
          </div>
        )}
        
        {ephemeral.benefits && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Block Time</div>
              <div className="font-medium text-green-600">
                {ephemeral.benefits.estimatedBlockTime}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Speed Boost</div>
              <div className="font-medium text-green-600">
                {ephemeral.benefits.blockTimeImprovement}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">State Commits</div>
              <div className="font-medium">
                {ephemeral.benefits.totalCommits}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Avg Commit</div>
              <div className="font-medium">
                {ephemeral.benefits.avgCommitTime}
              </div>
            </div>
          </div>
        )}

        {ephemeral.isCommitting && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            Committing state to base layer...
          </div>
        )}

        {ephemeral.error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {ephemeral.error}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          {ephemeral.statusMessage}
        </div>
      </CardContent>
    </Card>
  )
}