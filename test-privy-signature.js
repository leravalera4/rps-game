/**
 * Test script to verify Privy transaction signing
 * 
 * Usage:
 * 1. Make sure you're logged in to Privy
 * 2. Run in browser console: 
 *    - Open DevTools (F12)
 *    - Go to Console tab
 *    - Copy and paste this entire file
 *    - Press Enter
 */

async function testPrivySignature() {
  console.log('🧪 Testing Privy Transaction Signature...')
  
  try {
    // Check if Privy is available
    if (typeof window.privy === 'undefined') {
      throw new Error('Privy not found. Make sure you are logged in.')
    }
    
    console.log('✅ Privy found')
    
    // Get user and wallets
    const user = window.privy.user
    const wallets = window.privy.wallets
    
    console.log('👤 User:', user?.id)
    console.log('💰 Wallets:', wallets?.length || 0)
    
    if (!wallets || wallets.length === 0) {
      throw new Error('No wallets found')
    }
    
    // Find Solana wallet
    const solanaWallet = wallets.find(w => {
      return w.address && !w.address.startsWith('0x') && w.address.length >= 32
    })
    
    if (!solanaWallet) {
      throw new Error('No Solana wallet found')
    }
    
    console.log('✅ Found Solana wallet:', solanaWallet.address.substring(0, 12) + '...')
    
    // Create a simple test transaction
    const { Connection, Transaction, SystemProgram, PublicKey, Keypair } = require('@solana/web3.js')
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    
    // Create a simple transfer transaction (will fail but that's okay - we just want to test signing)
    const fromPubkey = new PublicKey(solanaWallet.address)
    const toPubkey = Keypair.generate().publicKey
    const lamports = 1 // 1 lamport (will fail but allows us to test signing)
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      })
    )
    
    // Get latest blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed')
    transaction.recentBlockhash = blockhash
    transaction.feePayer = fromPubkey
    
    console.log('📝 Transaction created')
    console.log('   From:', fromPubkey.toString().substring(0, 12) + '...')
    console.log('   To:', toPubkey.toString().substring(0, 12) + '...')
    console.log('   Blockhash:', blockhash.substring(0, 12) + '...')
    
    // Serialize transaction to Uint8Array
    const transactionBytes = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    })
    
    console.log('✅ Transaction serialized to Uint8Array')
    console.log('   Bytes length:', transactionBytes.length)
    
    // Test Privy signTransaction
    console.log('🔐 Attempting to sign transaction with Privy...')
    
    // Check if signTransaction method exists on wallet
    if (!solanaWallet.signTransaction) {
      console.log('⚠️  wallet.signTransaction not found, checking for other methods...')
      console.log('Available methods:', Object.keys(solanaWallet))
      throw new Error('wallet.signTransaction method not found')
    }
    
    console.log('✅ Found wallet.signTransaction method')
    
    // Try to sign
    try {
      const signedTx = await solanaWallet.signTransaction(transaction)
      console.log('✅ Transaction signed successfully!')
      console.log('   Signatures:', signedTx.signatures.length)
      console.log('   First signature present:', !!signedTx.signatures[0].signature)
      console.log('✅ TEST PASSED - Transaction signing works!')
      return true
    } catch (error) {
      console.error('❌ Signing failed:', error)
      throw error
    }
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message)
    console.error('Full error:', error)
    return false
  }
}

// Auto-run the test
console.log('🚀 Starting Privy Signature Test...')
testPrivySignature().then(result => {
  console.log('')
  console.log('='.repeat(50))
  if (result) {
    console.log('✅ ALL TESTS PASSED')
  } else {
    console.log('❌ SOME TESTS FAILED')
  }
  console.log('='.repeat(50))
})

// Export for manual testing
window.testPrivySignature = testPrivySignature
console.log('💡 You can also run: testPrivySignature()')
