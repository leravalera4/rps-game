"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Send, Wallet } from "lucide-react"
import { usePrivyWallet as useWallet } from "@/hooks/use-privy-wallet"
import { useToast } from "@/hooks/use-toast"
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"

interface WithdrawSolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WithdrawSolDialog({ open, onOpenChange }: WithdrawSolDialogProps) {
  const { publicKey, sendTransaction } = useWallet()
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleWithdraw = async () => {
    if (!publicKey || !sendTransaction) {
      toast({
        title: "Error",
        description: "Wallet not connected",
        variant: "destructive",
      })
      return
    }

    if (!amount || !recipientAddress) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // Validate recipient address
      try {
        new PublicKey(recipientAddress)
      } catch {
        toast({
          title: "Error",
          description: "Invalid recipient address",
          variant: "destructive",
        })
        return
      }

      // Convert amount to lamports
      const amountInSol = parseFloat(amount)
      if (amountInSol <= 0) {
        toast({
          title: "Error",
          description: "Amount must be greater than 0",
          variant: "destructive",
        })
        return
      }

      const lamports = Math.floor(amountInSol * LAMPORTS_PER_SOL)

      // Create transfer transaction
      const { Transaction, SystemProgram } = await import("@solana/web3.js")
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(recipientAddress),
          lamports,
        })
      )

      // Send transaction
      const signature = await sendTransaction(transaction)
      
      toast({
        title: "Success!",
        description: `SOL sent successfully! Signature: ${signature.substring(0, 8)}...`,
      })

      // Reset form
      setAmount("")
      setRecipientAddress("")
      onOpenChange(false)

    } catch (error: any) {
      console.error("Withdraw error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send SOL",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMaxAmount = async () => {
    // Get actual wallet balance
    try {
      const { Connection } = await import("@solana/web3.js")
      const connection = new Connection('https://api.devnet.solana.com')
      const balance = await connection.getBalance(publicKey)
      const solBalance = balance / LAMPORTS_PER_SOL
      setAmount(solBalance.toString())
    } catch (error) {
      console.error("Failed to get balance:", error)
      // Fallback to a default amount
      setAmount("1.0")
    }
  }

  const handlePasteAddress = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setRecipientAddress(text)
    } catch (error) {
      console.error("Failed to paste:", error)
    }
  }

  if (!publicKey) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Withdraw SOL
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Please connect your wallet first</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Withdraw SOL
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Safely transfer your SOL to an external wallet. Enter the amount and confirm for a secure transaction.
            </p>
          </div>
          
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Input Amount</Label>
            <div className="flex items-center gap-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="Input SOL amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleMaxAmount}
              >
                MAX
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">0 SOL Available</p>
          </div>
          
          {/* Recipient Address */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <div className="flex items-center gap-2">
              <Input
                id="recipient"
                placeholder="Enter recipient address"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="flex-1 font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handlePasteAddress}
              >
                Paste
              </Button>
            </div>
          </div>
          
          {/* Send Button */}
          <Button 
            onClick={handleWithdraw}
            disabled={isLoading || !amount || !recipientAddress}
            className="w-full"
            size="lg"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? "Sending..." : "Send SOL"}
          </Button>
          
          {/* Warning */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              ⚠️ Double-check the recipient address. Transactions cannot be reversed.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
