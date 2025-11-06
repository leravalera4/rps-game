"use client"

import { useState, useMemo } from 'react'
import { usePrivyWallet } from "@/hooks/use-privy-wallet"
import { useConnection } from '@solana/wallet-adapter-react'
import { useWallets } from '@privy-io/react-auth/solana'
import { useCreateWallet } from '@privy-io/react-auth'
import { createSolanaRpc } from '@solana/kit'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function DebugPanel() {
  const { wallet, connected, publicKey, ready, authenticated, user } = usePrivyWallet()
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  
  // Get connection and wallets from hooks
  const { connection } = useConnection()
  const { wallets } = useWallets() // Solana wallets from @privy-io/react-auth/solana
  const { createWallet } = useCreateWallet()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    setDebugLogs(prev => [...prev, logEntry])
    console.log(logEntry)
  }

  const clearLogs = () => {
    setDebugLogs([])
  }

  const checkStatus = () => {
    addLog('🔍 Checking Privy Status...')
    addLog(`Ready: ${ready}`)
    addLog(`Authenticated: ${authenticated}`)
    addLog(`User ID: ${user?.id || 'none'}`)
    addLog(`Wallet connected: ${connected}`)
    addLog(`Public key: ${publicKey?.toString() || 'none'}`)
    
    // Check Solana wallets array from @privy-io/react-auth/solana
    addLog(`Solana wallets count: ${wallets.length}`)
    wallets.forEach((w, index) => {
      addLog(`  Solana Wallet ${index}: ${w.address}`)
    })
    
    // Check user wallet
    if (user?.wallet) {
      addLog(`User wallet: ${user.wallet.address} (${(user.wallet as any).chainType || 'unknown'})`)
    }
  }

  const createSolanaWallet = async () => {
    addLog('🔧 Creating Solana wallet...')
    try {
      // Try different approaches to create Solana wallet
      const newWallet = await createWallet({ 
        chainType: 'solana',
        walletClientType: 'privy'
      })
      addLog(`✅ Created new Solana wallet: ${newWallet.address}`)
    } catch (error: any) {
      addLog(`❌ Failed to create Solana wallet: ${error.message}`)
      addLog('🔍 Trying alternative approach...')
      
      try {
        // Alternative approach - create without specifying chainType
        const newWallet = await createWallet()
        addLog(`✅ Created wallet (alternative): ${newWallet.address}`)
        addLog(`🔍 Wallet details: ${JSON.stringify({
          address: newWallet.address,
          chainType: (newWallet as any).chainType,
          walletClientType: (newWallet as any).walletClientType,
          connectorType: (newWallet as any).connectorType
        })}`)
        
        // Check if it's Solana
        if ((newWallet as any).chainType === 'solana') {
          addLog('✅ Created wallet is Solana!')
        } else {
          addLog(`❌ Created wallet is not Solana: ${(newWallet as any).chainType}`)
        }
      } catch (error2: any) {
        addLog(`❌ Alternative approach also failed: ${error2.message}`)
      }
    }
  }

  const testTransaction = async () => {
    addLog('🎮 Testing transaction signing...')
    if (!wallet || !publicKey) {
      addLog('❌ No wallet or public key available')
      return
    }

    try {
      // Create a simple transaction
      const { Transaction, SystemProgram, LAMPORTS_PER_SOL } = await import('@solana/web3.js')
      
      const transaction = new Transaction()
      
      // Set fee payer (required for Solana transactions)
      transaction.feePayer = publicKey
      
      // Get recent blockhash using createSolanaRpc
      const { getLatestBlockhash } = createSolanaRpc('https://api.devnet.solana.com')
      const { value: latestBlockhash } = await getLatestBlockhash().send()
      transaction.recentBlockhash = latestBlockhash.blockhash
      
      // Add a simple transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey, // Send to self for testing
          lamports: 0.001 * LAMPORTS_PER_SOL,
        })
      )

      addLog('🔐 Attempting to sign transaction...')
      addLog(`📝 Transaction details: feePayer=${transaction.feePayer?.toString()}, blockhash=${transaction.recentBlockhash?.substring(0, 8)}...`)
      
      const signedTx = await wallet.signTransaction(transaction)
      addLog('✅ Transaction signed successfully!')
      
    } catch (error: any) {
      addLog(`❌ Transaction signing failed: ${error.message}`)
    }
  }

  return (
    <Card className="bg-gray-900/80 border-purple-500/30 backdrop-blur-xl shadow-xl">
      <CardHeader>
        <CardTitle className="text-purple-400">Debug Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Indicators */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={ready ? "default" : "destructive"}>
              Ready: {ready ? "✅" : "❌"}
            </Badge>
            <Badge variant={authenticated ? "default" : "destructive"}>
              Authenticated: {authenticated ? "✅" : "❌"}
            </Badge>
            <Badge variant={connected ? "default" : "destructive"}>
              Connected: {connected ? "✅" : "❌"}
            </Badge>
            <Badge variant={publicKey ? "default" : "destructive"}>
              Public Key: {publicKey ? "✅" : "❌"}
            </Badge>
          </div>

          {/* Debug Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={checkStatus}>
              Check Status
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={createSolanaWallet}
              disabled={!authenticated}
            >
              Create Wallet
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testTransaction}
              disabled={!connected || !wallet}
            >
              Test Transaction
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              Clear Logs
            </Button>
          </div>

          {/* Debug Logs */}
          <div className="bg-black/50 p-4 rounded-lg max-h-60 overflow-y-auto">
            <div className="text-sm font-mono space-y-1">
              {debugLogs.map((log, index) => (
                <div key={index} className="text-green-400">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}