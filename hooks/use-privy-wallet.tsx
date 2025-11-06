"use client"

import { usePrivy, useCreateWallet } from '@privy-io/react-auth'
import { useSignTransaction, useSignAndSendTransaction, useWallets } from '@privy-io/react-auth/solana'
import { ConnectionProvider, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, clusterApiUrl } from '@solana/web3.js'
import { createSolanaRpc } from '@solana/kit'
import { useMemo } from 'react'

// Simple hook according to Privy documentation
export function usePrivyWallet() {
  const { ready, authenticated, user } = usePrivy()
  const { wallets } = useWallets() // Solana wallets from @privy-io/react-auth/solana
  const { signTransaction: privySignTransaction } = useSignTransaction()
  const { signAndSendTransaction } = useSignAndSendTransaction()
  const { createWallet } = useCreateWallet()
  const { connection } = useConnection()

  // Find Solana wallet - moved before conditional return
  const solanaWallet = useMemo(() => {
    if (!ready) return null
    
    // Use wallets[0] from @privy-io/react-auth/solana (contains Solana wallets)
    if (wallets && wallets.length > 0) {
      console.log('🔍 Found Solana wallet in wallets array:', wallets[0].address)
      return wallets[0]
    }
    
    // Fallback to user.wallet if it's Solana
    if (user?.wallet && (user.wallet as any).chainType === 'solana') {
      console.log('🔍 Using user.wallet as Solana wallet:', user.wallet.address)
      return user.wallet
    }
    
    console.log('🔍 No Solana wallet found')
    return null
  }, [wallets, user?.wallet?.address, ready]) // Fixed dependencies


  // Create Solana-only wallets array
  const solanaWallets = useMemo(() => {
    if (!ready) return []
    
    const solanaOnly = []
    
    // Add user.wallet if it's Solana
    if (user?.wallet && (user.wallet as any).chainType === 'solana') {
      console.log('🔍 Adding user.wallet to solanaWallets:', user.wallet.address)
      solanaOnly.push(user.wallet as any)
    }
    
    return solanaOnly
  }, [user?.wallet?.address, ready]) // Fixed dependencies

  // Create wallet object - moved before conditional return
  const wallet = useMemo(() => {
    if (!ready || !solanaWallet) return null

    const publicKey = new PublicKey(solanaWallet.address)

    return {
      publicKey,
      connected: authenticated && !!solanaWallet,
      disconnect: async () => {
        console.log('Disconnect requested - use logout instead')
      },
      adapter: {
        name: 'Privy',
        url: 'https://privy.io',
        icon: '/icons/privy.svg',
        supportedTransactionVersions: new Set(['legacy', 0])
      },
      signTransaction: async (transaction: any) => {
        console.log('🔐 Privy signTransaction called')
        
        if (!solanaWallet) {
          throw new Error('No Solana wallet available for signing')
        }
        
        console.log('🔍 Using solanaWallet for signing:', solanaWallet.address)
        
        // Ensure recentBlockhash and feePayer are set using createSolanaRpc
        if (!transaction.recentBlockhash) {
          const { getLatestBlockhash } = createSolanaRpc('https://api.devnet.solana.com')
          const { value: latestBlockhash } = await getLatestBlockhash().send()
          transaction.recentBlockhash = latestBlockhash.blockhash
        }
        
        // Ensure feePayer is set
        if (!transaction.feePayer && solanaWallet) {
          transaction.feePayer = new PublicKey(solanaWallet.address)
        }

        // Convert to Uint8Array for Privy
        let transactionBytes: Uint8Array
        if (transaction instanceof Uint8Array) {
          transactionBytes = transaction
        } else if (transaction.serialize) {
          transactionBytes = transaction.serialize({ requireAllSignatures: false })
        } else {
          throw new Error('Cannot serialize transaction')
        }

        console.log('🔐 Calling Privy signTransaction with solanaWallet:', solanaWallet.address)
        const result = await privySignTransaction({
          transaction: transactionBytes,
          wallet: solanaWallet as any
        })

        console.log('✅ Transaction signed successfully')
        console.log('🔍 Signed transaction type:', typeof result.signedTransaction)
        return result.signedTransaction
      },
      signAllTransactions: async (transactions: any[]) => {
        console.log('🔐 Privy signAllTransactions called')
        const signedTxs = []
        for (const tx of transactions) {
          signedTxs.push(await wallet?.signTransaction(tx))
        }
        return signedTxs
      },
      signMessage: async (message: Uint8Array) => {
        console.log('🔐 Privy signMessage called')
        if ((solanaWallet as any).signMessage) {
          return (solanaWallet as any).signMessage(message)
        }
        throw new Error('Message signing not supported')
      }
    }
  }, [solanaWallet?.address, authenticated, ready]) // Fixed dependencies - only use stable values

  // Send transaction
  const sendTransaction = async (transaction: any, signers: any[] = [], options?: any) => {
    console.log('🔗 Privy sendTransaction called')
    console.log('🔍 Transaction type:', typeof transaction)
    console.log('🔍 Transaction constructor:', transaction?.constructor?.name)
    console.log('🔍 Transaction has serialize:', !!transaction?.serialize)
    console.log('🔍 Transaction feePayer:', transaction?.feePayer?.toString())
    console.log('🔍 Transaction recentBlockhash:', transaction?.recentBlockhash?.substring(0, 8) + '...')
    console.log('🔍 Transaction instructions count:', transaction?.instructions?.length)
    
    if (!solanaWallet) {
      console.error('❌ No Solana wallet available for signing')
      throw new Error('No Solana wallet available for signing')
    }
    
    console.log('🔍 Solana wallet found:', solanaWallet.address)
    
    // Ensure recentBlockhash and feePayer are set using createSolanaRpc
    if (!transaction.recentBlockhash) {
      const { getLatestBlockhash } = createSolanaRpc('https://api.devnet.solana.com')
      const { value: latestBlockhash } = await getLatestBlockhash().send()
      transaction.recentBlockhash = latestBlockhash.blockhash
    }
    
    // Ensure feePayer is set
    if (!transaction.feePayer && solanaWallet) {
      transaction.feePayer = new PublicKey(solanaWallet.address)
    }

    console.log('🔍 Transaction before serialization:', {
      feePayer: transaction.feePayer?.toString(),
      recentBlockhash: transaction.recentBlockhash?.substring(0, 8) + '...',
      hasInstructions: transaction.instructions?.length > 0
    })

    // Convert to Uint8Array for Privy
    let transactionBytes: Uint8Array
    if (transaction instanceof Uint8Array) {
      transactionBytes = transaction
    } else if (transaction.serialize) {
      transactionBytes = transaction.serialize({ requireAllSignatures: false })
    } else {
      throw new Error('Cannot serialize transaction')
    }

    console.log('🔍 Using solanaWallet for signing:', solanaWallet.address)
    
    try {
      const result = await signAndSendTransaction({
        transaction: transactionBytes,
        wallet: solanaWallet as any
      })

      console.log('🔍 signAndSendTransaction result:', result)
      console.log('🔍 result.signature:', result.signature)
      
      if (!result.signature) {
        throw new Error('Transaction failed: no signature returned')
      }

      // According to Privy docs, signature should be a string
      let signatureString: string
      if (typeof result.signature === 'string') {
        signatureString = result.signature
        console.log('🔍 Signature is already a string:', signatureString)
      } else if (result.signature instanceof Uint8Array) {
        // Convert Uint8Array to base58 string
        const base58Alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
        let num = BigInt('0x' + Array.from(result.signature).map(b => b.toString(16).padStart(2, '0')).join(''))
        let encoded = ''
        while (num > 0) {
          encoded = base58Alphabet[Number(num % BigInt(58))] + encoded
          num = num / BigInt(58)
        }
        signatureString = encoded
        console.log('🔍 Converted signature to base58:', signatureString)
      } else {
        throw new Error('Invalid signature format')
      }

      console.log('✅ Transaction sent successfully:', signatureString)
      return signatureString
    } catch (error: any) {
      console.error('❌ signAndSendTransaction error:', error)
      console.error('❌ Error name:', error.name)
      console.error('❌ Error message:', error.message)
      console.error('❌ Error stack:', error.stack)
      throw error
    }
  }

  // Wait for Privy to be ready according to documentation
  if (!ready) {
    return {
      wallet: null,
      connected: false,
      publicKey: null,
      sendTransaction: null,
      ready: false,
      authenticated: false,
      user: null
    }
  }

  return {
    wallet,
    connected: authenticated && !!wallet,
    publicKey: wallet?.publicKey || null,
    sendTransaction,
    ready,
    authenticated,
    user
  }
}

// Connection provider wrapper
export function PrivyConnectionProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => clusterApiUrl('devnet'), [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      {children}
    </ConnectionProvider>
  )
}

