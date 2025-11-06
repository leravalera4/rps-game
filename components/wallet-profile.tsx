"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Wallet, TrendingUp, Trophy, Star } from "lucide-react"
import { usePrivyWallet as useWallet } from "@/hooks/use-privy-wallet"
import { useToast } from "@/hooks/use-toast"
import { DepositSolDialog } from "./deposit-sol-dialog"
import { WithdrawSolDialog } from "./withdraw-sol-dialog"

export function WalletProfile() {
  const { publicKey, connected } = useWallet()
  const { toast } = useToast()
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  const walletAddress = publicKey?.toString() || ""
  const shortAddress = walletAddress ? `${walletAddress.slice(0, 4)}....${walletAddress.slice(-4)}` : ""

  const copyAddress = async () => {
    if (!walletAddress) return
    
    try {
      await navigator.clipboard.writeText(walletAddress)
      toast({
        title: "Address copied!",
        description: "Wallet address copied to clipboard",
      })
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  if (!connected || !publicKey) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Please connect your wallet first</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-green-500 rounded-lg flex items-center justify-center">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium">valeriacher....</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground font-mono">{shortAddress}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAddress}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Balance */}
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">0.00</span>
              <Badge variant="secondary" className="flex items-center gap-1">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                SOL
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={() => setDepositOpen(true)}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Deposit
            </Button>
            <Button
              variant="outline"
              onClick={() => setWithdrawOpen(true)}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4 rotate-180" />
              Withdraw
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Export PK
            </Button>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-center">STATS</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-muted rounded-lg">
                <Trophy className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                <p className="text-sm font-medium">Total Trophy</p>
                <p className="text-lg font-bold">0</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Star className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <p className="text-sm font-medium">Gacha Coin</p>
                <p className="text-lg font-bold">0</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <p className="text-sm font-medium">Global Ranking</p>
                <p className="text-lg font-bold">#3765</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Star className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                <p className="text-sm font-medium">Referral Point</p>
                <p className="text-lg font-bold">0</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <DepositSolDialog open={depositOpen} onOpenChange={setDepositOpen} />
      <WithdrawSolDialog open={withdrawOpen} onOpenChange={setWithdrawOpen} />
    </>
  )
}
