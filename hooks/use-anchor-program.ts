import { useCallback } from 'react'
import { usePrivyWallet as useWallet } from './use-privy-wallet'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, Connection } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import { useMagicBlockConnection } from './use-magicblock-connection'

// Import the IDL
import idlJson from '../lib/idl/rps_game.json'

// Program ID from Anchor.toml
const PROGRAM_ID = new PublicKey('GstXQkBpu26KABj6YZ3pYKJhQphoQ72YL1zL38NC6D9U')

// Blockhash cache to reduce RPC calls
let blockhashCache: { blockhash: string; timestamp: number } | null = null
const BLOCKHASH_CACHE_DURATION = 30000 // 30 seconds

// Helper function to get cached blockhash
const getCachedBlockhash = async (connection: Connection) => {
  const now = Date.now()
  
  // Use cache if it's still valid (less than 30 seconds old)
  if (blockhashCache && (now - blockhashCache.timestamp) < BLOCKHASH_CACHE_DURATION) {
    console.log('🔍 Using cached blockhash:', blockhashCache.blockhash.substring(0, 8) + '...')
    return blockhashCache.blockhash
  }
  
  // Fetch new blockhash
  console.log('🔍 Fetching new blockhash from RPC...')
  const { blockhash } = await connection.getLatestBlockhash('confirmed')
  
  // Update cache
  blockhashCache = { blockhash, timestamp: now }
  console.log('🔍 Cached new blockhash:', blockhash.substring(0, 8) + '...')
  
  return blockhash
}

// Helper: wait for a transaction to be available and log fees/balance deltas
const waitAndLogTx = async (
  connection: Connection,
  signature: string,
  labels: { feePayer?: PublicKey; gamePda?: PublicKey; tag: string }
) => {
  try {
    // Poll for transaction until available
    let tx: any | null = null
    for (let i = 0; i < 20; i++) {
      tx = await connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      } as any)
      if (tx) break
      await new Promise(r => setTimeout(r, 500))
    }

    if (!tx) {
      console.warn(`⚠️ [${labels.tag}] Could not fetch transaction meta for`, signature)
      return
    }

    const meta = tx.meta
    if (!meta) {
      console.warn(`⚠️ [${labels.tag}] No meta in transaction`, signature)
      return
    }

    const feeLamports = meta.fee ?? 0
    console.log(`🧾 [${labels.tag}] Tx fee: ${(feeLamports / LAMPORTS_PER_SOL).toFixed(9)} SOL (${feeLamports} lamports)`) 

    if (meta.preBalances && meta.postBalances && tx.transaction?.message?.accountKeys) {
      const keys: PublicKey[] = (tx.transaction.message.accountKeys as any).map((k: any) => new PublicKey(k))

      const logDelta = (who: string, pk?: PublicKey) => {
        if (!pk) return
        const idx = keys.findIndex(k => k.equals(pk))
        if (idx === -1) return
        const pre = meta.preBalances[idx] ?? 0
        const post = meta.postBalances[idx] ?? 0
        const deltaLamports = (post as number) - (pre as number)
        const deltaSol = deltaLamports / LAMPORTS_PER_SOL
        console.log(`🔎 [${labels.tag}] ${who} delta: ${deltaSol.toFixed(9)} SOL (${deltaLamports} lamports)`) 
      }

      logDelta('Fee payer', labels.feePayer)
      logDelta('Game PDA', labels.gamePda)
    }
  } catch (e) {
    console.warn(`⚠️ [${labels.tag}] Failed to log tx meta:`, (e as Error).message)
  }
}

// Create proper IDL type conversion
const createIdl = (): anchor.Idl => {
  return {
    address: idlJson.address,
    metadata: {
      name: idlJson.metadata.name,
      version: idlJson.metadata.version,
      spec: idlJson.metadata.spec,
      description: idlJson.metadata.description,
    },
    instructions: idlJson.instructions,
    accounts: idlJson.accounts,
    errors: idlJson.errors,
    types: idlJson.types,
  } as anchor.Idl
}

interface UseAnchorProgramOptions {
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
  onBalanceUpdate?: () => void
}

export const useAnchorProgram = (options: UseAnchorProgramOptions = {}) => {
  const wallet = useWallet()
  const { publicKey, connected, sendTransaction } = wallet
  const { connection } = useConnection()
  const magicBlock = useMagicBlockConnection()

  // Helper function to find PDAs
  const findGamePDA = useCallback((gameId: string) => {
    // Use raw game ID as bytes to match smart contract seeds
    // Contract uses: seeds = [b"game", game_id.as_bytes()]
    // Truncate to max 32 bytes (Solana PDA seed limit)
    const truncatedGameId = gameId.replace(/-/g, '').substring(0, 32)
    return PublicKey.findProgramAddressSync(
      [Buffer.from('game'), Buffer.from(truncatedGameId, 'utf8')],
      PROGRAM_ID
    )[0]
  }, [])

  const findUserProfilePDA = useCallback((walletPublicKey: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('user_profile'), walletPublicKey.toBuffer()],
      PROGRAM_ID
    )[0]
  }, [])

  // Function to finalize a game on-chain
  const finalizeGame = useCallback(async (gameId: string, onComplete?: () => void) => {
    if (!gameId || !publicKey || !connected || !sendTransaction) {
      options.onError?.('Cannot finalize game: wallet not connected')
      onComplete?.()
      return false
    }

    try {
      console.log('🔗 Finalizing game on-chain:', gameId)
      
      // Get the game PDA
      const gamePDA = findGamePDA(gameId)
      
      // Create an AnchorProvider
      const provider = new anchor.AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      )
      
      // Create the program interface
      const idl = createIdl()
      idl.address = PROGRAM_ID.toString()
      const program = new anchor.Program(idl, provider)
      
      try {
        // Fetch the game account using the connection directly since we have account coder issues
        console.log('Fetching game account:', gamePDA.toString())
        const gameAccountInfo = await connection.getAccountInfo(gamePDA)
        
        if (!gameAccountInfo) {
          console.error('Game account not found on-chain')
          options.onError?.('Game not found on-chain')
          onComplete?.()
          return false
        }
        
        // Decode the account manually using the program's coder
        let gameAccount
        try {
          gameAccount = program.coder.accounts.decode('game', gameAccountInfo.data)
        } catch (decodeError) {
          console.error('Error decoding game account:', decodeError)
          options.onError?.('Failed to decode game account')
          onComplete?.()
          return false
        }
        
        console.log('Game exists on-chain:', gameAccount)
        
        // Log detailed game status for debugging
        console.log('🔍 On-chain game status details:', {
          gameStatus: gameAccount.gameStatus,
          winner: gameAccount.winner,
          player1MoveCommitment: gameAccount.player1MoveCommitment,
          player2MoveCommitment: gameAccount.player2MoveCommitment,
          player1RevealedMove: gameAccount.player1RevealedMove,
          player2RevealedMove: gameAccount.player2RevealedMove,
          player1RoundsWon: gameAccount.player1RoundsWon,
          player2RoundsWon: gameAccount.player2RoundsWon,
          roundsToWin: gameAccount.roundsToWin
        })
        
        // Check if game is already finalized
        if (gameAccount.gameStatus.finished) {
          console.log('Game is already finalized on-chain')
          options.onSuccess?.('Game is already finalized on-chain')
          onComplete?.()
          return true
        }
        
        // CRITICAL FIX: Handle off-chain completed games
        // If game is not finished on-chain but we know it finished off-chain,
        // we need to determine the winner and update the on-chain state
        const gameNotFinishedOnChain = !gameAccount.gameStatus.finished && !gameAccount.winner
        
        if (gameNotFinishedOnChain) {
          console.log('🚨 OFF-CHAIN GAME DETECTED - IMPLEMENTING FIX')
          console.log('⚡ Completing game on-chain before finalization...')
          
          const isPlayer1 = gameAccount.player1.equals(publicKey)
          console.log(`📊 Current player: ${publicKey.toString()}, isPlayer1: ${isPlayer1}`)
          
          try {
            // STEP 1: Submit winning move for current player
            console.log('🎯 Step 1: Submitting winning move commitment...')
            
            // Create proper move commitment using smart contract hash function
            const winningMove = 0 // Rock = 0, Paper = 1, Scissors = 2
            const nonce = Math.floor(Math.random() * 1000000)
            
            // Recreate the hash_move function from smart contract:
            // hash(move_byte + nonce_le_bytes)
            const moveData = new Uint8Array(9)
            moveData[0] = winningMove // Rock
            const nonceBytes = new ArrayBuffer(8)
            new DataView(nonceBytes).setBigUint64(0, BigInt(nonce), true) // little endian
            moveData.set(new Uint8Array(nonceBytes), 1)
            
            // Create hash using native crypto
            const hashBuffer = await crypto.subtle.digest('SHA-256', moveData)
            const moveCommitment = Array.from(new Uint8Array(hashBuffer))
            
            console.log('📝 Submitting move commitment for winner...')
            
            // Submit move commitment
            const submitTx = await program.methods
              .submitMove(gameId, moveCommitment)
              .accounts({
                game: gamePDA,
                user: publicKey,
                systemProgram: SystemProgram.programId
              })
              .transaction()
            
            const submitSig = await sendTransaction(submitTx)
            await connection.confirmTransaction(submitSig, 'confirmed')
            console.log('✅ Move commitment submitted:', submitSig)
            
            // STEP 2: Reveal winning move to trigger game completion
            console.log('🎯 Step 2: Revealing winning move...')
            
            const revealTx = await program.methods
              .revealMoves(gameId, { rock: {} }, new anchor.BN(nonce))
              .accounts({
                game: gamePDA,
                user: publicKey,
                systemProgram: SystemProgram.programId
              })
              .transaction()
            
            const revealSig = await sendTransaction(revealTx)
            await connection.confirmTransaction(revealSig, 'confirmed')
            console.log('✅ Winning move revealed:', revealSig)
            
            console.log('🏆 Single-player move submitted! Checking game state...')
            
            // Check if the game state changed after our move submission
            try {
              const updatedGameAccount = await connection.getAccountInfo(gamePDA)
              if (updatedGameAccount) {
                const updatedGameData = program.coder.accounts.decode('game', updatedGameAccount.data)
                console.log('🔍 Updated game state after move submission:', {
                  gameStatus: updatedGameData.gameStatus,
                  winner: updatedGameData.winner?.toString() || 'null',
                  player1Rounds: updatedGameData.player1RoundsWon,
                  player2Rounds: updatedGameData.player2RoundsWon,
                  player1Move: updatedGameData.player1RevealedMove,
                  player2Move: updatedGameData.player2RevealedMove
                })
                
                // If game is now finished, skip abandon pathway
                if (updatedGameData.gameStatus.finished && updatedGameData.winner) {
                  console.log('🎉 Game is now completed on-chain! Proceeding with normal finalization...')
                  // Skip abandon pathway and go straight to finalization
                } else {
                  console.log('⚠️ Game still not finished, trying abandon pathway...')
                  throw new Error('Game not finished, trying abandon pathway')
                }
              }
            } catch (stateCheckError) {
              console.log('📋 Could not verify game completion, trying abandon pathway...')
            
              // Since we can't submit for both players, try the abandon pathway
              // This should work for single-player finalization scenarios
              try {
                console.log('🔄 Step 3/4: Marking game as complete...')
                
                const abandonTx = await program.methods
                  .abandonGame(gameId)
                  .accounts({
                    game: gamePDA,
                    user: publicKey,
                    systemProgram: SystemProgram.programId
                  })
                  .transaction()
                
                const abandonSig = await sendTransaction(abandonTx)
                await connection.confirmTransaction(abandonSig, 'confirmed')
                              console.log('✅ Step 3/4 Complete: Game marked as complete')
              
              console.log('📋 Step 4/4: Transferring SOL back to your wallet...')
              
              // Now finalize and transfer SOL
              const finalizeAbandonTx = await program.methods
                  .finalizeAbandonedGame(gameId)
                  .accounts({
                    game: gamePDA,
                    player1Profile: findUserProfilePDA(gameAccount.player1),
                    player2Profile: findUserProfilePDA(gameAccount.player2 || gameAccount.player1),
                    player1: gameAccount.player1,
                    player2: gameAccount.player2 || gameAccount.player1,
                    systemProgram: SystemProgram.programId
                  })
                  .transaction()
                
                const finalizeAbandonSig = await sendTransaction(finalizeAbandonTx)
                await connection.confirmTransaction(finalizeAbandonSig, 'confirmed')
                              console.log('✅ Step 4/4 Complete: SOL transferred to your wallet!')
              
              console.log('🎉 SOL GAME FINALIZATION COMPLETE!')
              console.log('💰 Your SOL has been safely returned to your wallet')
              console.log('📊 Note: This process recovered your stake safely')
              
              // CRITICAL FIX: Calculate expected vs actual winnings
              const stakeInSol = gameAccount.stakeAmount / LAMPORTS_PER_SOL
              const feeRate = stakeInSol <= 0.01 ? 0.05 : stakeInSol <= 0.05 ? 0.03 : 0.02
              const expectedWinnings = stakeInSol * 2 * (1 - feeRate) // Both stakes minus dynamic platform fee
              
              console.log(`⚠️ PAYOUT ISSUE: Got ${stakeInSol} SOL refund, should be ${expectedWinnings.toFixed(3)} SOL winnings`)
              
              options.onSuccess?.(`⚠️ SOL recovered! BUT: You got ${stakeInSol} SOL (refund) instead of ${expectedWinnings.toFixed(3)} SOL (winnings). This needs fixing.`)
              
              // CRITICAL: Fix loading state immediately
              console.log('🔄 Clearing loading state immediately...')
              try {
                onComplete?.()
                console.log('✅ Loading state cleared successfully')
              } catch (loadingError) {
                console.error('❌ Failed to clear loading state:', loadingError)
                // Force clear after a moment if direct call fails
                setTimeout(() => {
                  console.log('🔄 Force clearing loading state...')
                  onComplete?.()
                }, 500)
              }
              
              return true
                
              } catch (abandonError) {
                console.log('⚠️ Abandon pathway also failed:', abandonError)
                console.log('🚀 Proceeding with normal finalization attempt anyway...')
              }
            }
            
          } catch (completionError) {
            console.log('⚠️ Game completion failed:', completionError)
            
            const errorMsg = completionError instanceof Error ? completionError.message : String(completionError)
            
            if (errorMsg.includes('MoveAlreadySubmitted')) {
              console.log('💡 Move already submitted, trying finalization...')
            } else if (errorMsg.includes('GameNotInProgress')) {
              console.log('💡 Game may already be completed, trying finalization...')
            } else {
              console.log('🚧 Completion attempt failed, but will try finalization anyway...')
              console.log('📋 Error:', errorMsg)
            }
            
            // Continue to finalization attempt even if completion fails
          }
        }
        
        // Get player PDAs
        const player1ProfilePDA = findUserProfilePDA(gameAccount.player1)
        const player2ProfilePDA = findUserProfilePDA(gameAccount.player2)
        
        console.log('Finalizing game with accounts:', {
          game: gamePDA.toString(),
          player1Profile: player1ProfilePDA.toString(),
          player2Profile: player2ProfilePDA.toString(),
          player1: gameAccount.player1.toString(),
          player2: gameAccount.player2.toString()
        })
        
        // Finalize the game
        const tx = await program.methods
          .finalizeGame(gameId)
          .accounts({
            game: gamePDA,
            player1Profile: player1ProfilePDA,
            player2Profile: player2ProfilePDA,
            player1: gameAccount.player1,
            player2: gameAccount.player2,
            systemProgram: SystemProgram.programId
          })
          .transaction()
        
        // Send the transaction
        const signature = await sendTransaction(tx)
        
        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(signature, 'confirmed')
        
        if (confirmation.value.err) {
          console.error('Transaction confirmed but failed:', confirmation.value.err)
          options.onError?.('Failed to finalize game on-chain')
          onComplete?.()
          throw new Error('Transaction failed: ' + confirmation.value.err)
        }
        
        console.log('Game finalized on-chain:', signature)
        options.onSuccess?.('Game finalized successfully! Winnings transferred.')
        
        onComplete?.()
        return true
      } catch (txError) {
        console.error('Transaction creation or sending failed:', txError)
        
        // FALLBACK: Try a simpler approach for off-chain completed games
        console.log('🔧 Attempting fallback finalization method...')
        
        try {
          // Check if this is a case where the game finished off-chain but smart contract constraints are failing
          // For now, we'll provide a clear error message and suggest manual intervention
          
          const errorMessage = txError instanceof Error ? txError.message : String(txError)
          
          if (errorMessage.includes('account') || errorMessage.includes('constraint') || errorMessage.includes('seeds')) {
            console.error('❌ Smart contract account constraint failed - likely off-chain/on-chain state mismatch')
            options.onError?.('Game completed off-chain but cannot finalize on-chain. The funds are safely escrowed.')
          } else {
            console.error('❌ Transaction failed with error:', errorMessage)
            options.onError?.(errorMessage || 'Failed to finalize game on-chain. Please try again later.')
          }
          
          onComplete?.()
          throw txError
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError)
          options.onError?.('Failed to finalize game on-chain. Please try again later.')
          onComplete?.()
          throw fallbackError
        }
      }
    } catch (error) {
      console.error('Error in finalizeGame:', error)
      options.onError?.('Failed to finalize game on-chain')
      onComplete?.()
      throw error // Re-throw the error
    }
  }, [publicKey, connected, sendTransaction, connection, wallet, findGamePDA, findUserProfilePDA, options])

  // Function to initialize a user profile
  const initializeUserProfile = useCallback(async () => {
    if (!publicKey || !connected || !sendTransaction) {
      options.onError?.('Cannot initialize profile: wallet not connected')
      return false
    }

    try {
      console.log('🔗 Initializing user profile for wallet:', publicKey.toString())
      
      // Get the user profile PDA
      const userProfilePDA = findUserProfilePDA(publicKey)
      
      // Create an AnchorProvider
      const provider = new anchor.AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      )
      
      // Create the program interface
      const idl = createIdl()
      idl.address = PROGRAM_ID.toString()
      const program = new anchor.Program(idl, provider)
      
      try {
        // Check if profile already exists
        try {
          const profileAccount = await connection.getAccountInfo(userProfilePDA)
          if (profileAccount) {
            console.log('User profile already exists')
            options.onSuccess?.('User profile already exists')
            return true
          }
        } catch (e) {
          // Profile doesn't exist, continue with initialization
          console.log('User profile does not exist, creating...')
        }
        
        // Initialize user profile
        const tx = await program.methods
          .initializeUserProfile()
          .accounts({
            userProfile: userProfilePDA,
            user: publicKey,
            systemProgram: SystemProgram.programId
          })
          .transaction()
        
        // Set recent blockhash before sending
        // Get recent blockhash using cache
        const blockhash = await getCachedBlockhash(connection)
        tx.recentBlockhash = blockhash
        tx.feePayer = publicKey
        
        // Send the transaction
        const signature = await sendTransaction(tx)
        
        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(signature, 'confirmed')
        
        if (confirmation.value.err) {
          console.error('Transaction confirmed but failed:', confirmation.value.err)
          options.onError?.('Failed to initialize user profile')
          return false
        }
        
        console.log('User profile initialized:', signature)
        options.onSuccess?.('User profile initialized successfully!')
        return true
      } catch (error) {
        console.error('Error initializing user profile:', error)
        options.onError?.('Failed to initialize user profile. Please try again later.')
        return false
      }
    } catch (error) {
      console.error('Error in initializeUserProfile:', error)
      options.onError?.('Failed to initialize user profile')
      return false
    }
  }, [publicKey, connected, sendTransaction, connection, wallet, findUserProfilePDA, options])

  // Function to create a game on-chain
  const createGame = useCallback(async (gameId: string, stakeAmount: number, currency: 'sol' | 'points', onComplete?: () => void) => {
    console.log('🔍 createGame called with:', { 
      publicKey: publicKey?.toString(), 
      connected, 
      hasSendTransaction: !!sendTransaction,
      wallet: wallet ? 'exists' : 'null'
    })
    
    if (!publicKey || !connected || !sendTransaction) {
      console.log('❌ Cannot create game: wallet not connected')
      options.onError?.('Cannot create game: wallet not connected')
      onComplete?.()
      return false
    }

    try {
      console.log('🔗 Creating game on-chain:', { gameId, stakeAmount, currency })
      
      // Get PDAs
      const gamePDA = findGamePDA(gameId)
      const userProfilePDA = findUserProfilePDA(publicKey)
      
      // Create an AnchorProvider
      const provider = new anchor.AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      )
      
      // Create the program interface
      const idl = createIdl()
      idl.address = PROGRAM_ID.toString()
      const program = new anchor.Program(idl, provider)
      
      // Initialize user profile if it doesn't exist
      console.log('🔍 Checking if user profile exists...')
      try {
        const profileAccount = await connection.getAccountInfo(userProfilePDA)
        if (!profileAccount) {
          console.log('🔍 User profile does not exist, initializing...')
          await initializeUserProfile()
          console.log('✅ User profile initialized')
        } else {
          console.log('✅ User profile already exists')
        }
      } catch (profileError) {
        console.log('🔍 Profile check error, initializing anyway...')
        await initializeUserProfile()
      }
      
      // Convert stake amount to BN (for SOL, keep in lamports; for points, use raw amount)
      console.log('💰 createGame stakeAmount input:', stakeAmount, 'currency:', currency)
      const stakeAmountBN = currency === 'sol' 
        ? new anchor.BN(stakeAmount * LAMPORTS_PER_SOL)
        : new anchor.BN(stakeAmount)
      console.log('💰 createGame stakeAmountBN:', stakeAmountBN.toString(), 'lamports')
      
      // Define currency type
      const currencyType = currency === 'sol' ? { sol: {} } : { points: {} }
      
      console.log('Creating game with accounts:', {
        game: gamePDA.toString(),
        userProfile: userProfilePDA.toString(),
        user: publicKey.toString()
      })
      
      // Create the game
      const tx = await program.methods
        .createGame(gameId, stakeAmountBN, currencyType, 3) // 3 rounds to win (best of 5)
        .accounts({
          game: gamePDA,
          userProfile: userProfilePDA,
          user: publicKey,
          systemProgram: SystemProgram.programId
        })
        .transaction()
      
      // Note: Anchor program handles SOL transfer internally, no need to add transfer instruction
      // The createGame instruction will transfer SOL from user to game PDA
      console.log('💰 Anchor program will handle SOL transfer for stake:', stakeAmount, 'SOL')
      
      // LOG BALANCE BEFORE createGame
      console.log('💰 ===== BALANCE LOGGING (createGame) =====');
      const createBalanceBefore = await connection.getBalance(publicKey);
      const createGamePDABalanceBefore = await connection.getBalance(gamePDA);
      console.log(`  Player balance BEFORE createGame: ${(createBalanceBefore / LAMPORTS_PER_SOL).toFixed(9)} SOL`);
      console.log(`  Game PDA balance BEFORE createGame: ${(createGamePDABalanceBefore / LAMPORTS_PER_SOL).toFixed(9)} SOL`);
      
      // Send the transaction
      const signature = await sendTransaction(tx)
      
      console.log('✅ Game creation transaction sent, signature:', signature)
      
      // Wait for confirmation to ensure transaction is processed
      console.log('⏳ Waiting for transaction confirmation...')
      const confirmation = await connection.confirmTransaction(signature, 'confirmed')
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed: ' + confirmation.value.err)
      }
      
      console.log('✅ Game creation transaction confirmed on-chain')

      // LOG BALANCE AFTER createGame
      await new Promise(resolve => setTimeout(resolve, 1000));
      const createBalanceAfter = await connection.getBalance(publicKey);
      const createGamePDABalanceAfter = await connection.getBalance(gamePDA);
      console.log(`  Player balance AFTER createGame: ${(createBalanceAfter / LAMPORTS_PER_SOL).toFixed(9)} SOL (delta: ${((createBalanceAfter - createBalanceBefore) / LAMPORTS_PER_SOL).toFixed(9)} SOL)`);
      console.log(`  Game PDA balance AFTER createGame: ${(createGamePDABalanceAfter / LAMPORTS_PER_SOL).toFixed(9)} SOL (delta: ${((createGamePDABalanceAfter - createGamePDABalanceBefore) / LAMPORTS_PER_SOL).toFixed(9)} SOL)`);

      // Log fee and balance deltas for createGame as well
      await waitAndLogTx(connection as Connection, signature, {
        feePayer: publicKey,
        gamePda: gamePDA,
        tag: 'createGame'
      })
      
      console.log('💰 ===== END BALANCE LOGGING (createGame) =====');
      console.log('Game created on-chain:', signature)
      
      // Verify game was created on-chain
      console.log('🔍 Verifying game exists on-chain...')
      try {
        const gameAccount = await connection.getAccountInfo(gamePDA)
        if (gameAccount) {
          console.log('✅ Game verified on-chain at PDA:', gamePDA.toString())
        } else {
          console.error('❌ Game not found on-chain after creation!')
          throw new Error('Game creation failed - game not found on-chain')
        }
      } catch (verifyError) {
        console.error('❌ Failed to verify game on-chain:', verifyError)
        throw verifyError
      }
      
      options.onSuccess?.(`Game created successfully! ${currency === 'sol' ? 'SOL staked' : 'Points deducted'} automatically.`)
      
      // Refresh balance after successful transaction (wait a bit for network to process)
      if (currency === 'sol') {
        console.log('💰 Scheduling balance refresh after createGame transaction...')
        setTimeout(() => {
          console.log('💰 Refreshing balance after createGame transaction...')
          options.onBalanceUpdate?.()
        }, 2000) // Wait 2 seconds for transaction to be fully processed
      }
      
      onComplete?.()
      return true
    } catch (error) {
      console.error('Error creating game on-chain:', error)
      options.onError?.('Failed to create game on-chain. Please try again later.')
      onComplete?.()
      throw error // Re-throw the error so it can be caught by the caller
    }
  }, [publicKey, connected, sendTransaction, connection, wallet, findGamePDA, findUserProfilePDA, options])

  // Function to join a game on-chain
  const joinGame = useCallback(async (gameId: string, onComplete?: () => void) => {
    if (!publicKey || !connected || !sendTransaction) {
      options.onError?.('Cannot join game: wallet not connected')
      onComplete?.()
      return false
    }
    
    // Check wallet state
    console.log('🔍 Checking wallet state:', {
      hasWallet: !!wallet,
      hasPublicKey: !!wallet?.publicKey,
      walletName: 'Privy Wallet'
    })
    
    console.log('✅ Wallet connected, proceeding...')

    try {
      console.log('🔗 Joining game on-chain:', gameId)
      
      // Get PDAs
      const gamePDA = findGamePDA(gameId)
      const userProfilePDA = findUserProfilePDA(publicKey)
      
      // Create an AnchorProvider (same as createGame does)
      const provider = new anchor.AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      )
      
      // Create the program interface
      const idl = createIdl()
      idl.address = PROGRAM_ID.toString()
      const program = new anchor.Program(idl, provider)
      
      // Initialize user profile if it doesn't exist
      console.log('🔍 Checking if user profile exists before joining...')
      try {
        const profileAccount = await connection.getAccountInfo(userProfilePDA)
        if (!profileAccount) {
          console.log('🔍 User profile does not exist, initializing...')
          await initializeUserProfile()
          console.log('✅ User profile initialized before joining')
        } else {
          console.log('✅ User profile already exists')
        }
      } catch (profileError) {
        console.log('🔍 Profile check error, initializing anyway...')
        await initializeUserProfile()
      }
      
      console.log('Joining game with correct accounts (no player1/player1_profile):')
      console.log('  - game:', gamePDA.toString())
      console.log('  - userProfile:', userProfilePDA.toString())
      console.log('  - user:', publicKey.toString())
      
      // Build the transaction instruction with CORRECT accounts (matching updated IDL)
      console.log('Building join game instruction...')
      
      const instruction = await program.methods
        .joinGame(gameId)
        .accountsStrict({
          game: gamePDA,
          userProfile: userProfilePDA,
          user: publicKey,
          systemProgram: SystemProgram.programId
        })
        .instruction()
      
      console.log('Instruction built, creating transaction...')
      
      // LOG BALANCE BEFORE joinGame
      console.log('💰 ===== BALANCE LOGGING (joinGame) =====');
      const balanceBefore = await connection.getBalance(publicKey);
      const gamePDABalanceBefore = await connection.getBalance(gamePDA);
      console.log(`  Player balance BEFORE joinGame: ${(balanceBefore / LAMPORTS_PER_SOL).toFixed(9)} SOL`);
      console.log(`  Game PDA balance BEFORE joinGame: ${(gamePDABalanceBefore / LAMPORTS_PER_SOL).toFixed(9)} SOL`);
      
      // Use simple Transaction instead of VersionedTransaction
      const { Transaction, ComputeBudgetProgram } = await import('@solana/web3.js')
      
      // Get recent blockhash using cache
      const blockhash = await getCachedBlockhash(connection)
      
      // Create transaction
      const tx = new Transaction()
      tx.feePayer = publicKey
      tx.recentBlockhash = blockhash
      
      // REMOVED ComputeBudget instructions to minimize fees
      // Transaction will use default compute units (not limited)
      tx.add(instruction)
      
      // Note: Anchor program handles SOL transfer internally when joining a game
      // The joinGame instruction will transfer SOL from user to game PDA
      console.log('💰 Anchor program will handle SOL transfer when joining game')
      
      console.log('✅ Transaction created with instructions (ComputeBudget + JoinGame + Transfer)')
      
      // Send transaction using Privy
      console.log('Requesting wallet to sign and send transaction...')
      
      let signature: string
      try {
        signature = await sendTransaction(tx)
        console.log('✅ Transaction sent successfully via sendTransaction, signature:', signature)
      } catch (sendError: any) {
        console.error('❌ SendTransaction error:', sendError)
        console.error('Error name:', sendError.name)
        console.error('Error message:', sendError.message)
        console.error('Error stack:', sendError.stack)
        console.error('Error object keys:', Object.keys(sendError))
        console.error('Full error object:', JSON.stringify(sendError, null, 2))
        
        // Try to extract more details
        if (sendError.logs) {
          console.error('Transaction logs:', sendError.logs)
        }
        if (sendError.err) {
          console.error('Transaction error details:', sendError.err)
        }
        if (sendError.error) {
          console.error('Inner error:', sendError.error)
        }
        
        // Check wallet error
        console.error('Wallet name:', 'Privy Wallet')
        
        throw sendError
      }
      
      console.log('✅ Game joined on-chain, transaction signature:', signature)
      console.log('⏱️ Transaction sent, proceeding immediately without waiting...')

      // LOG BALANCE AFTER joinGame (no artificial delay)
      const balanceAfter = await connection.getBalance(publicKey);
      const gamePDABalanceAfter = await connection.getBalance(gamePDA);
      console.log(`  Player balance AFTER joinGame: ${(balanceAfter / LAMPORTS_PER_SOL).toFixed(9)} SOL (delta: ${((balanceAfter - balanceBefore) / LAMPORTS_PER_SOL).toFixed(9)} SOL)`);
      console.log(`  Game PDA balance AFTER joinGame: ${(gamePDABalanceAfter / LAMPORTS_PER_SOL).toFixed(9)} SOL (delta: ${((gamePDABalanceAfter - gamePDABalanceBefore) / LAMPORTS_PER_SOL).toFixed(9)} SOL)`);

      // Log fee and balance deltas (no extra fees)
      await waitAndLogTx(connection as Connection, signature, {
        feePayer: publicKey,
        gamePda: findGamePDA(gameId),
        tag: 'joinGame'
      })
      
      console.log('💰 ===== END BALANCE LOGGING (joinGame) =====');

      options.onSuccess?.('Game joined successfully! Stake transferred automatically.')
      
      // Refresh balance after successful transaction (wait a bit for network to process)
      console.log('💰 Scheduling balance refresh after joinGame transaction...')
      setTimeout(() => {
        console.log('💰 Refreshing balance after joinGame transaction...')
        options.onBalanceUpdate?.()
      }, 2000) // Wait 2 seconds for transaction to be fully processed
      
      onComplete?.()
      return true
    } catch (error: any) {
      console.error('❌ Error joining game on-chain:', error)
      console.error('Error type:', typeof error)
      console.error('Error constructor:', error?.constructor?.name)
      
      let errorMessage = 'Unknown error'
      
      if (error?.message) {
        errorMessage = error.message
      }
      
      if (error?.logs) {
        console.error('Program logs:', error.logs)
        errorMessage += '\nCheck console for program logs'
      }
      
      console.error('Final error message:', errorMessage)
      options.onError?.(`Failed to join game on-chain: ${errorMessage}`)
      onComplete?.()
      throw error // Re-throw the error
    }
  }, [publicKey, connected, sendTransaction, connection, wallet, findGamePDA, findUserProfilePDA, options])

  // Ephemeral rollup delegation functions
  const delegateGame = useCallback(async (gameId: string, config?: {
    lifetimeMs?: number
    updateFrequencyMs?: number
    expectedBlockTime?: number
  }) => {
    if (!publicKey || !connected || !sendTransaction) {
      options.onError?.('Cannot delegate game: wallet not connected')
      return false
    }

    if (!magicBlock.isEphemeralAvailable()) {
      options.onError?.('Ephemeral rollup not available')
      return false
    }

    try {
      console.log('🚀 Delegating game to ephemeral rollup:', gameId)
      
      const gamePDA = findGamePDA(gameId)
      
      // Use ephemeral connection for delegation
      const provider = new anchor.AnchorProvider(
        magicBlock.ephemeralConnection,
        wallet as any,
        { commitment: 'confirmed' }
      )
      
      const idl = createIdl()
      idl.address = PROGRAM_ID.toString()
      const program = new anchor.Program(idl, provider)
      
      // Default delegation config
      const delegateConfig = {
        lifetimeMs: config?.lifetimeMs || 300000, // 5 minutes
        updateFrequencyMs: config?.updateFrequencyMs || 10000, // 10 seconds
        expectedBlockTime: config?.expectedBlockTime || 10 // 10ms
      }
      
      const tx = await program.methods
        .delegateGame(gameId, delegateConfig)
        .accounts({
          game: gamePDA,
          user: publicKey,
          systemProgram: SystemProgram.programId
        })
        .transaction()
      
      const signature = await sendTransaction(tx)
      await magicBlock.ephemeralConnection.confirmTransaction(signature, 'confirmed')
      
      console.log('✅ Game delegated to ephemeral rollup:', signature)
      options.onSuccess?.('Game delegated to ephemeral rollup for ultra-fast gameplay!')
      
      return true
    } catch (error) {
      console.error('Error delegating game:', error)
      options.onError?.('Failed to delegate game to ephemeral rollup')
      return false
    }
  }, [publicKey, connected, sendTransaction, magicBlock, findGamePDA, options])

  const commitGameState = useCallback(async (gameId: string) => {
    if (!publicKey || !connected || !sendTransaction) {
      options.onError?.('Cannot commit game state: wallet not connected')
      return false
    }

    try {
      console.log('💾 Committing game state to base layer:', gameId)
      
      const gamePDA = findGamePDA(gameId)
      
      // Use router connection for state commits
      const provider = new anchor.AnchorProvider(
        magicBlock.routerConnection,
        wallet as any,
        { commitment: 'confirmed' }
      )
      
      const idl = createIdl()
      idl.address = PROGRAM_ID.toString()
      const program = new anchor.Program(idl, provider)
      
      const tx = await program.methods
        .commitGameState(gameId)
        .accounts({
          game: gamePDA,
          user: publicKey,
          systemProgram: SystemProgram.programId
        })
        .transaction()
      
      const signature = await sendTransaction(tx)
      await magicBlock.routerConnection.confirmTransaction(signature, 'confirmed')
      
      console.log('✅ Game state committed to base layer:', signature)
      options.onSuccess?.('Game state committed to base layer')
      
      return true
    } catch (error) {
      console.error('Error committing game state:', error)
      options.onError?.('Failed to commit game state')
      return false
    }
  }, [publicKey, connected, sendTransaction, magicBlock, findGamePDA, options])

  const undelegateGame = useCallback(async (gameId: string) => {
    if (!publicKey || !connected || !sendTransaction) {
      options.onError?.('Cannot undelegate game: wallet not connected')
      return false
    }

    try {
      console.log('🔄 Undelegating game from ephemeral rollup:', gameId)
      
      const gamePDA = findGamePDA(gameId)
      
      // Use base connection for undelegation
      const provider = new anchor.AnchorProvider(
        magicBlock.baseConnection,
        wallet as any,
        { commitment: 'confirmed' }
      )
      
      const idl = createIdl()
      idl.address = PROGRAM_ID.toString()
      const program = new anchor.Program(idl, provider)
      
      const tx = await program.methods
        .undelegateGame(gameId)
        .accounts({
          game: gamePDA,
          user: publicKey,
          systemProgram: SystemProgram.programId
        })
        .transaction()
      
      const signature = await sendTransaction(tx)
      await magicBlock.baseConnection.confirmTransaction(signature, 'confirmed')
      
      console.log('✅ Game undelegated from ephemeral rollup:', signature)
      options.onSuccess?.('Game returned to base layer')
      
      return true
    } catch (error) {
      console.error('Error undelegating game:', error)
      options.onError?.('Failed to undelegate game')
      return false
    }
  }, [publicKey, connected, sendTransaction, magicBlock, findGamePDA, options])

  // Enhanced move submission with ephemeral support
  const submitMoveEphemeral = useCallback(async (gameId: string, move: number, nonce: number) => {
    if (!publicKey || !connected || !sendTransaction) {
      options.onError?.('Cannot submit move: wallet not connected')
      return false
    }

    try {
      console.log('⚡ Submitting move on ephemeral rollup:', { gameId, move })
      
      const gamePDA = findGamePDA(gameId)
      
      // Create move commitment
      const moveData = new Uint8Array(9)
      moveData[0] = move
      const nonceBytes = new ArrayBuffer(8)
      new DataView(nonceBytes).setBigUint64(0, BigInt(nonce), true)
      moveData.set(new Uint8Array(nonceBytes), 1)
      
      const hashBuffer = await crypto.subtle.digest('SHA-256', moveData)
      const moveCommitment = Array.from(new Uint8Array(hashBuffer))
      
      // Use ephemeral connection for fast move submission
      const connection = magicBlock.getConnectionForOperation(true)
      const provider = new anchor.AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      )
      
      const idl = createIdl()
      idl.address = PROGRAM_ID.toString()
      const program = new anchor.Program(idl, provider)
      
      const tx = await program.methods
        .submitMove(gameId, moveCommitment)
        .accounts({
          game: gamePDA,
          user: publicKey,
          systemProgram: SystemProgram.programId
        })
        .transaction()
      
      const signature = await sendTransaction(tx)
      await connection.confirmTransaction(signature, 'confirmed')
      
      console.log('✅ Move submitted on ephemeral rollup:', signature)
      return signature
    } catch (error) {
      console.error('Error submitting move on ephemeral rollup:', error)
      throw error
    }
  }, [publicKey, connected, sendTransaction, magicBlock, findGamePDA])

  // Enhanced move revelation with ephemeral support
  const revealMoveEphemeral = useCallback(async (gameId: string, move: { rock?: {} } | { paper?: {} } | { scissors?: {} }, nonce: anchor.BN) => {
    if (!publicKey || !connected || !sendTransaction) {
      options.onError?.('Cannot reveal move: wallet not connected')
      return false
    }

    try {
      console.log('🎭 Revealing move on ephemeral rollup:', gameId)
      
      const gamePDA = findGamePDA(gameId)
      
      // Use ephemeral connection for fast reveal
      const connection = magicBlock.getConnectionForOperation(true)
      const provider = new anchor.AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      )
      
      const idl = createIdl()
      idl.address = PROGRAM_ID.toString()
      const program = new anchor.Program(idl, provider)
      
      const tx = await program.methods
        .revealMoves(gameId, move, nonce)
        .accounts({
          game: gamePDA,
          user: publicKey,
          systemProgram: SystemProgram.programId
        })
        .transaction()
      
      const signature = await sendTransaction(tx)
      await connection.confirmTransaction(signature, 'confirmed')
      
      console.log('✅ Move revealed on ephemeral rollup:', signature)
      return signature
    } catch (error) {
      console.error('Error revealing move on ephemeral rollup:', error)
      throw error
    }
  }, [publicKey, connected, sendTransaction, magicBlock, findGamePDA])

  // Function to cancel a game and refund SOL (when game hasn't started)
  const cancelGame = useCallback(async (gameId: string, onComplete?: () => void) => {
    if (!publicKey || !connected || !sendTransaction) {
      console.log('❌ Cannot cancel game: wallet not connected')
      options.onError?.('Cannot cancel game: wallet not connected')
      onComplete?.()
      return false
    }

    try {
      console.log('🔗 Cancelling game on-chain:', gameId)
      
      // Get PDAs
      const gamePDA = findGamePDA(gameId)
      
      // Create an AnchorProvider
      const provider = new anchor.AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      )
      
      // Create the program interface
      const idl = createIdl()
      idl.address = PROGRAM_ID.toString()
      const program = new anchor.Program(idl, provider)
      
      // Create the cancel game transaction
      const tx = await program.methods
        .cancelGame(gameId)
        .accounts({
          game: gamePDA,
          user: publicKey,
          systemProgram: SystemProgram.programId
        })
        .transaction()
      
      console.log('💰 Sending cancel game transaction...')
      
      // Send the transaction
      const signature = await sendTransaction(tx)
      
      console.log('✅ Game cancelled on-chain, signature:', signature)
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed')
      
      console.log('✅ Game cancellation confirmed')
      
      options.onSuccess?.('Game cancelled and SOL refunded successfully!')
      
      onComplete?.()
      return true
    } catch (error) {
      console.error('Error cancelling game on-chain:', error)
      options.onError?.('Failed to cancel game on-chain. Please try again later.')
      onComplete?.()
      return false
    }
  }, [publicKey, connected, sendTransaction, connection, wallet, findGamePDA, options])

  return {
    // Original functions
    finalizeGame,
    initializeUserProfile,
    createGame,
    joinGame,
    cancelGame,
    
    // Ephemeral rollup functions
    delegateGame,
    commitGameState,
    undelegateGame,
    submitMoveEphemeral,
    revealMoveEphemeral,
    
    // Connection info
    isConnected: connected,
    wallet: publicKey?.toString(),
    
    // MagicBlock connection state
    magicBlock: {
      isEphemeralAvailable: magicBlock.isEphemeralAvailable(),
      activeType: magicBlock.activeType,
      health: magicBlock.health,
      latency: magicBlock.bestLatency
    }
  }
} 