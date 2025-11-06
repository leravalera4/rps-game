"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, QrCode, Wallet } from "lucide-react"
import { usePrivyWallet as useWallet } from "@/hooks/use-privy-wallet"
import { useToast } from "@/hooks/use-toast"

interface DepositSolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  balance?: number
}

export function DepositSolDialog({ open, onOpenChange, balance = 0 }: DepositSolDialogProps) {
  const { publicKey } = useWallet()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const walletAddress = publicKey?.toString() || ""

  const copyToClipboard = async () => {
    if (!walletAddress) return
    
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      toast({
        title: "Address copied!",
        description: "Wallet address copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
      toast({
        title: "Copy failed",
        description: "Failed to copy address to clipboard",
        variant: "destructive",
      })
    }
  }

  const generateQRCode = (text: string) => {
    // Generate QR code for wallet address
    // This creates a QR code that can be scanned to get the wallet address
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`
    return qrUrl
  }

  if (!walletAddress) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Deposit SOL
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
            Deposit SOL
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Scan the code or copy your address to add SOL.
            </p>
            
            {/* QR Code */}
            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-lg">
                <img 
                  src={generateQRCode(walletAddress)} 
                  alt="QR Code for wallet address"
                  className="w-48 h-48"
                />
              </div>
            </div>
            
            {/* Wallet Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">
                Your Address
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="address"
                  value={walletAddress}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
            
            {/* Balance Info */}
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Current Balance: <span className="font-medium">{balance.toFixed(4)} SOL Available</span>
              </p>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">How to deposit:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Copy your wallet address above</li>
              <li>Send SOL from another wallet or exchange</li>
              <li>Wait for confirmation (usually 1-2 minutes)</li>
              <li>Your balance will update automatically</li>
            </ol>
          </div>
          
          {/* Close Button */}
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full"
            variant="outline"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
