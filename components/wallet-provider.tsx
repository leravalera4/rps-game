"use client"

import React, { useMemo, createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { PrivyProvider } from './privy-provider'
import { usePrivy, useWallets, useCreateWallet } from '@privy-io/react-auth'
import { useSignTransaction } from '@privy-io/react-auth'
import { ConnectionProvider, useConnection } from '@solana/wallet-adapter-react'
import { clusterApiUrl } from '@solana/web3.js'
import { PublicKey } from '@solana/web3.js'

// Create a context for wallet adapter compatibility
interface WalletAdapterContextType {
  wallet: any
  publicKey: PublicKey | null
  connected: boolean
  disconnect: () => Promise<void>
  sendTransaction?: any
}

const WalletAdapterContext = createContext<WalletAdapterContextType | null>(null)

function WalletAdapterProvider({ children }: { children: ReactNode }) {
  const privyData = usePrivy()
  console.log('🔧 usePrivy() returned:', privyData)
  const { authenticated, logout, ready, user } = privyData
  const { wallets: originalWallets } = useWallets()
  const { createWallet } = useCreateWallet()
  const { signTransaction: privySignTransaction } = useSignTransaction()
  const [isInitialized, setIsInitialized] = useState(false)
  const { connection } = useConnection() // Get connection for sendTransaction
  
  // Extend wallets array to include user.wallet if it's not already there
  const wallets = useMemo(() => {
    console.log('🔧 Creating wallets array:', {
      originalWalletsLength: originalWallets.length,
      originalWallets: originalWallets,
      hasUserWallet: !!user?.wallet,
      userWalletChainType: (user?.wallet as any)?.chainType,
      userWalletAddress: user?.wallet?.address?.substring(0, 12) + '...'
    })
    
    const extendedWallets = [...originalWallets]
    
    // Add user.wallet if it's Solana and not already in the array
    if (user?.wallet && (user.wallet as any).chainType === 'solana') {
      const isAlreadyInArray = originalWallets.some(w => w.address === user.wallet?.address)
      console.log('🔧 Checking if user.wallet is already in array:', {
        isAlreadyInArray,
        userWalletAddress: user.wallet.address?.substring(0, 12) + '...',
        originalWalletsAddresses: originalWallets.map(w => w.address?.substring(0, 12) + '...')
      })
      
      if (!isAlreadyInArray) {
        console.log('🔧 Adding user.wallet to wallets array:', user.wallet.address?.substring(0, 12) + '...')
        extendedWallets.push(user.wallet as any)
      } else {
        console.log('🔧 user.wallet already in array, not adding')
      }
    } else {
      console.log('🔧 user.wallet not added:', {
        hasUserWallet: !!user?.wallet,
        chainType: (user?.wallet as any)?.chainType,
        reason: !user?.wallet ? 'no user.wallet' : 'not solana'
      })
    }
    
    console.log('🔧 Final wallets array:', {
      length: extendedWallets.length,
      addresses: extendedWallets.map(w => w.address?.substring(0, 12) + '...')
    })
    
    return extendedWallets
  }, [originalWallets, user?.wallet])
  
  // Debug Privy state - log on every render
  console.log('🔐 Privy state (render):', {
    ready,
    authenticated,
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email?.address,
    walletsCount: wallets.length,
    allWallets: wallets
  })
  
  // Filter Solana wallets from extended wallets array
  const solanaWallets = useMemo(() => {
    console.log('🔍 All wallets (including user.wallet):', wallets.length, wallets)
    wallets.forEach((w, i) => {
      console.log(`  Wallet ${i}:`, { 
        address: w.address?.substring(0, 20) + '...',
        type: w.walletClientType, 
        chain: (w as any).chainType,
        caipType: (w as any).caipType,
        connectorType: w.connectorType,
        isEthereum: w.address?.startsWith('0x'),
        length: w.address?.length,
        source: w === (user?.wallet as any) ? 'user.wallet' : 'original wallets'
      })
    })
    
    // Filter Solana wallets from extended wallets array
    const filteredSolanaWallets = wallets.filter(w => {
      if (!w.address) return false
      return !w.address.startsWith('0x') && w.address.length >= 32 && w.address.length <= 44
    })
    
    console.log('✅ Total Solana wallets found:', filteredSolanaWallets.length)
    console.log('🔍 Solana wallets details:', filteredSolanaWallets.map(w => ({
      address: w.address?.substring(0, 12) + '...',
      type: w.walletClientType,
      chain: (w as any).chainType,
      source: w === (user?.wallet as any) ? 'user.wallet' : 'original wallets'
    })))
    return filteredSolanaWallets
  }, [wallets, user?.wallet])

  // Auto-create Solana wallet when user authenticates and doesn't have one
  useEffect(() => {
    const initializeWallet = async () => {
      console.log('🔍 Initializing wallet:', { ready, authenticated, isInitialized, solanaWalletsCount: solanaWallets.length, totalWallets: wallets.length })
      
      // Wait for Privy to be ready and user to be authenticated
      if (!ready || !authenticated || isInitialized) {
        console.log('⏸️  Skipping wallet initialization:', { ready, authenticated, isInitialized })
        return
      }

      try {
        // Check if user has any Solana wallets
        if (solanaWallets.length === 0) {
          console.log('🔧 No Solana wallets found')
          console.log('💡 User needs to create a wallet manually or through Privy Dashboard')
          console.log('💡 To create wallet: Privy Dashboard → Users → Create wallet')
        } else {
          console.log('✅ User already has Solana wallet(s):', solanaWallets.length)
          solanaWallets.forEach((w, i) => {
            console.log(`  Wallet ${i}:`, { address: w.address, type: w.walletClientType, chain: (w as any).chainType })
          })
        }
        
        // Log warning about Ethereum wallets
        const ethereumWallets = wallets.filter(w => w.address?.startsWith('0x'))
        if (ethereumWallets.length > 0) {
          console.warn('⚠️  Found Ethereum wallets (will be ignored):', ethereumWallets.length)
          ethereumWallets.forEach((w, i) => {
            console.log(`  Ethereum Wallet ${i}:`, { address: w.address?.substring(0, 12) + '...', type: w.walletClientType })
          })
          console.log('💡 To fix: Configure Privy Dashboard to only create Solana wallets')
        }
        
        // Log warning about too many wallets
        if (wallets.length > 2) {
          console.warn('🚨 TOO MANY WALLETS CREATED:', wallets.length)
          console.log('💡 This can cause transaction signing issues')
          console.log('💡 Consider cleaning up wallets in Privy Dashboard')
        }
        
        setIsInitialized(true)
      } catch (error) {
        console.error('❌ Failed to create Solana wallet:', error)
        // Don't block the app if wallet creation fails
        setIsInitialized(true)
      }
    }

    initializeWallet()
  }, [ready, authenticated, solanaWallets.length, isInitialized, createWallet, solanaWallets, privyData, wallets.length])

  const wallet = useMemo(() => {
    console.log('💰 Creating wallet object - all data:', {
      authenticated,
      solanaWalletsCount: solanaWallets.length,
      solanaWallets,
      allWallets: wallets,
      user: user?.id,
      userWallet: user?.wallet
    })
    
    // Try to find a Solana wallet - prioritize user.wallet
    let connectedWallet: any = null
    
    // First try user.wallet if it's Solana
    if (user?.wallet && (user.wallet as any).chainType === 'solana') {
      connectedWallet = user.wallet
      console.log('💰 Using user.wallet:', {
        hasWallet: !!connectedWallet,
        address: connectedWallet?.address,
        type: connectedWallet?.walletClientType,
        chain: (connectedWallet as any)?.chainType,
        source: 'user.wallet'
      })
    }
    // Fallback to solanaWallets[0]
    else if (solanaWallets[0]) {
      connectedWallet = solanaWallets[0]
      console.log('💰 Using solanaWallets[0]:', {
        hasWallet: !!connectedWallet,
        address: connectedWallet?.address,
        type: connectedWallet?.walletClientType,
        chain: (connectedWallet as any)?.chainType,
        source: 'solanaWallets[0]'
      })
    }
    
    if (!connectedWallet || !authenticated) {
      console.log('⚠️  No wallet object created:', { 
        hasWallet: !!connectedWallet, 
        authenticated,
        hasUserWallet: !!user?.wallet,
        userWalletChain: (user?.wallet as any)?.chainType,
        solanaWalletsCount: solanaWallets.length,
        reason: !connectedWallet ? 'no wallet' : 'not authenticated'
      })
      return null
    }

    try {
      const publicKey = new PublicKey(connectedWallet.address)
      console.log('✅ Wallet object created successfully:', publicKey.toString())
      
      // Use Privy's signTransaction API with user.wallet
      const signTransactionFn = async (transaction: any) => {
        console.log('🔐 signTransaction called with Privy API')
        console.log('🔐 Transaction details:', {
          type: transaction?.constructor?.name,
          hasSerialize: !!transaction?.serialize,
          hasRecentBlockhash: !!transaction?.recentBlockhash,
          feePayer: transaction?.feePayer?.toString()
        })
        
        // Use user.wallet for signing (this is the correct Privy wallet)
        const walletForSigning = user?.wallet
        console.log('🔐 Using user.wallet for signing:', {
          address: walletForSigning?.address?.substring(0, 12) + '...',
          walletType: walletForSigning?.walletClientType,
          chainType: (walletForSigning as any)?.chainType,
          hasWallet: !!walletForSigning
        })
        
        if (!walletForSigning) {
          throw new Error('No user wallet available for signing')
        }
        
        // Ensure recentBlockhash is set before encoding
        if (transaction.serialize && !transaction.recentBlockhash) {
          console.log('⚠️  Transaction missing recentBlockhash, fetching latest...')
          const { blockhash } = await connection.getLatestBlockhash('confirmed')
          transaction.recentBlockhash = blockhash
        }
        
        // Use Privy's signTransaction API
        try {
          console.log('🔐 Converting transaction to Uint8Array for Privy API')
          
          // Convert transaction to Uint8Array for Privy API
          let transactionBytes: Uint8Array
          if (transaction instanceof Uint8Array) {
            transactionBytes = transaction
          } else if ((transaction as any).serialize) {
            try {
              transactionBytes = (transaction as any).serialize({ requireAllSignatures: false })
            } catch (serializeError) {
              transactionBytes = (transaction as any).serialize()
            }
          } else {
            throw new Error('Transaction cannot be serialized')
          }
          
          console.log('🔐 Transaction bytes length:', transactionBytes.length)
          
          const result = await privySignTransaction({
            transaction: transactionBytes,
            wallet: walletForSigning as any
          })
          
          console.log('🔐 Privy API result:', result)
          
          if (result.signedTransaction) {
            console.log('🔐 Privy API successful')
            return result.signedTransaction
          } else {
            throw new Error('Privy API did not return signed transaction')
          }
          
        } catch (privyError) {
          console.error('❌ Privy API failed:', privyError)
          throw new Error(`Privy API signing failed: ${privyError.message}`)
        }
      }
      
      const signAllTransactionsFn = async (transactions: any[]) => {
        console.log('🔐 signAllTransactions called with Privy API')
        
        // Sign each transaction individually using Privy API
        const signedTxs = []
        for (const tx of transactions) {
          signedTxs.push(await signTransactionFn(tx))
        }
        return signedTxs
      }
      
      const signMessage = async (message: Uint8Array) => {
        console.log('🔐 signMessage called with Privy API')
        
        // Use Privy's signMessage API
        try {
          const signature = await privyData.signMessage(message)
          console.log('🔐 Privy signMessage successful')
          return signature
        } catch (error) {
          console.error('❌ Privy signMessage failed:', error)
          throw new Error(`Message signing failed: ${error.message}`)
        }
      }
      
      console.log('🔐 Signing methods created:', {
        hasSignTransaction: !!signTransactionFn,
        hasSignAllTransactions: !!signAllTransactionsFn,
        hasSignMessage: !!signMessage
      })
      
      return {
        publicKey,
        connected: true,
        disconnect: async () => {
          await logout()
        },
        adapter: {
          name: connectedWallet.walletClientType || 'Privy',
        },
        signTransaction: signTransactionFn,
        signAllTransactions: signAllTransactionsFn,
        signMessage,
      }
    } catch (error) {
      console.error('❌ Error creating wallet object:', error)
      return null
    }
  }, [solanaWallets, wallets, authenticated, logout, user?.wallet, user?.id, privyData.signMessage, privyData.signTransaction, connection])

  const publicKey = useMemo(() => {
    if (!wallet) return null
    return wallet.publicKey
  }, [wallet])

  const contextValue = useMemo(() => {
    // Create sendTransaction function that uses wallet.signTransaction + connection.sendRawTransaction
    const sendTransaction = async (transaction: any, signers: any[] = [], options?: any) => {
      if (!wallet?.signTransaction) {
        throw new Error('Wallet does not support transaction signing')
      }
      
      console.log('🔗 sendTransaction called:', { 
        hasWallet: !!wallet,
        hasSignTransaction: !!wallet.signTransaction,
        transactionType: transaction?.constructor?.name 
      })
      
        try {
          // Sign the transaction using wallet.signTransaction
          console.log('🔗 About to call wallet.signTransaction')
          const signedTx = await wallet.signTransaction(transaction)
          console.log('🔗 wallet.signTransaction completed, signedTx type:', typeof signedTx)
          console.log('🔗 Signed transaction constructor:', signedTx?.constructor?.name)
          
          // Handle signed transaction - should be a Transaction object
          let transactionBytes: Uint8Array
          if (signedTx instanceof Uint8Array) {
            console.log('🔗 Signed transaction is Uint8Array, using directly')
            transactionBytes = signedTx
          } else if (signedTx && (signedTx as any).serialize) {
            console.log('🔗 Signed transaction is Transaction object, serializing')
            transactionBytes = (signedTx as any).serialize()
          } else {
            console.error('❌ Invalid signed transaction format:', typeof signedTx)
            throw new Error('Invalid signed transaction format')
          }
          
          // Add additional signers if provided (only for Transaction objects)
          if (signers && signers.length > 0 && signedTx && (signedTx as any).partialSign) {
            console.log('🔗 Adding additional signers:', signers.length)
            (signedTx as any).partialSign(...signers)
            transactionBytes = (signedTx as any).serialize()
          }
          
          // Send the transaction
          console.log('🔗 Sending transaction bytes length:', transactionBytes.length)
          const signature = await connection.sendRawTransaction(transactionBytes, {
            skipPreflight: options?.skipPreflight ?? false,
            maxRetries: options?.maxRetries ?? 3,
            preflightCommitment: options?.preflightCommitment ?? 'confirmed',
          })
          
          console.log('✅ Transaction sent successfully, signature:', signature)
          return signature
      } catch (error) {
        console.error('❌ sendTransaction error:', error)
        throw error
      }
    }
    
    const ctx = {
      wallet,
      publicKey,
      connected: authenticated && !!wallet && !!publicKey, // Must be authenticated, have wallet AND publicKey
      disconnect: wallet?.disconnect || (async () => {}),
      sendTransaction,
    }
    
    console.log('🎯 Wallet context value (FINAL):', {
      hasWallet: !!wallet,
      hasPublicKey: !!publicKey,
      publicKey: publicKey?.toString(),
      connected: ctx.connected,
      authenticated,
      reasonNotConnected: !authenticated ? 'not authenticated' : !wallet ? 'no wallet' : !publicKey ? 'no public key' : 'OK'
    })
    
    return ctx
  }, [wallet, publicKey, authenticated, connection, solanaWallets, wallets, user?.wallet])

  return (
    <WalletAdapterContext.Provider value={contextValue}>
      {children}
    </WalletAdapterContext.Provider>
  )
}

// Export a hook that mimics useWallet from wallet adapter
export function useWallet() {
  const context = useContext(WalletAdapterContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletContextProvider')
  }
  return context
}

// Export useConnection for compatibility
export { useConnection } from '@solana/wallet-adapter-react'

export function WalletContextProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => clusterApiUrl('devnet'), [])

  return (
    <PrivyProvider>
    <ConnectionProvider endpoint={endpoint}>
        <WalletAdapterProvider>
          {children}
        </WalletAdapterProvider>
    </ConnectionProvider>
    </PrivyProvider>
  )
} 