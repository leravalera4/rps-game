"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wifi, WifiOff, RotateCcw, AlertCircle } from "lucide-react"
import { SocketState } from "@/hooks/use-socket"

interface ConnectionStatusProps {
  socketState: SocketState
  onReconnect?: () => void
}

export function ConnectionStatus({ socketState, onReconnect }: ConnectionStatusProps) {
  const { connected, connecting, error } = socketState

  if (connected) {
    return (
      <Badge variant="outline" className="bg-green-500/10 border-green-500/50 text-green-400">
        <Wifi className="w-3 h-3 mr-1" />
        Connected
      </Badge>
    )
  }

  if (connecting) {
    return (
      <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/50 text-yellow-400">
        <RotateCcw className="w-3 h-3 mr-1 animate-spin" />
        Connecting...
      </Badge>
    )
  }

  return (
    <div className="space-y-2">
      <Badge variant="outline" className="bg-red-500/10 border-red-500/50 text-red-400">
        <WifiOff className="w-3 h-3 mr-1" />
        Disconnected
      </Badge>
      
      {error && (
        <Alert className="bg-red-500/10 border-red-500/50">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {onReconnect && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onReconnect}
          className="border-gray-600 hover:bg-gray-800 text-gray-300 hover:text-white"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reconnect
        </Button>
      )}
    </div>
  )
} 