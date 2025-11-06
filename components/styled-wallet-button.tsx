"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { usePrivy, useWallets, useCreateWallet } from '@privy-io/react-auth'
import { LogOut } from 'lucide-react'

export function StyledWalletButton() {
  const [mounted, setMounted] = useState(false)
  const { ready, authenticated, login, logout, user } = usePrivy()
  const { wallets } = useWallets()
  const { createWallet } = useCreateWallet()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Debug logging
  useEffect(() => {
    console.log('🔌 StyledWalletButton state:', {
      mounted,
      ready,
      authenticated,
      walletsCount: wallets.length,
      wallets: wallets,
      user: user?.id
    })
  }, [mounted, ready, authenticated, wallets, user])

  const handleConnect = useCallback(() => {
    console.log('🔘 Connect button clicked:', { authenticated, walletsCount: wallets.length })
    
    if (!authenticated) {
      console.log('🔐 Opening Privy login modal...')
      login()
    } else if (wallets.length === 0) {
      console.log('🔧 Creating Solana wallet...')
      createWallet({ chainType: 'solana' })
    } else {
      console.log('ℹ️  Already have wallet(s)')
    }
  }, [authenticated, login, wallets, createWallet])

  const handleDisconnect = useCallback(() => {
    logout()
  }, [logout])

  // Show button even if not ready - Privy will handle it
  if (!mounted) {
    return null
  }
  
  if (!ready) {
    console.log('⏳ Privy not ready yet, showing loading button')
    return (
      <button 
        className="!bg-gradient-to-r !from-purple-600 !via-purple-700 !to-pink-600 hover:!from-purple-700 hover:!via-purple-800 hover:!to-pink-700 !text-white !rounded-lg !px-3 !py-2 sm:!px-4 sm:!py-2 lg:!px-6 lg:!py-3 !font-bold !border-0 !shadow-xl hover:!shadow-2xl !transition-all !duration-300 !transform hover:!scale-105 !text-sm sm:!text-base whitespace-nowrap"
        disabled
        onClick={handleConnect}
      >
        Initializing...
      </button>
    )
  }

  if (!authenticated) {
    console.log('🔓 User not authenticated, showing connect button')
    return (
      <button 
        onClick={handleConnect}
        className="!bg-gradient-to-r !from-purple-600 !via-purple-700 !to-pink-600 hover:!from-purple-700 hover:!via-purple-800 hover:!to-pink-700 !text-white !rounded-lg !px-3 !py-2 sm:!px-4 sm:!py-2 lg:!px-6 lg:!py-3 !font-bold !border-0 !shadow-xl hover:!shadow-2xl !transition-all !duration-300 !transform hover:!scale-105 !text-sm sm:!text-base whitespace-nowrap"
      >
        Connect Wallet
      </button>
    )
  }
  
  console.log('✅ User authenticated, showing wallet info')

  // User is authenticated - show connected state
  // Filter only Solana wallets to avoid showing Ethereum addresses
  const solanaWallets = wallets.filter(w => w.address && !w.address.startsWith('0x'))
  const connectedWallet = solanaWallets[0] || user?.wallet
  let displayText = 'Connected'

  if (connectedWallet?.address) {
    const address = connectedWallet.address
    displayText = `${address.slice(0, 4)}...${address.slice(-4)}`
  } else if (user?.wallet?.address) {
    const address = user.wallet.address
    displayText = `${address.slice(0, 4)}...${address.slice(-4)}`
  } else if (user?.linking?.address) {
    // Try alternative address location
    const address = user.linking.address
    displayText = `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  console.log('🎨 Rendering wallet button:', {
    authenticated,
    walletsCount: wallets.length,
    solanaWalletsCount: solanaWallets.length,
    hasConnectedWallet: !!connectedWallet,
    displayText,
    connectedWalletAddress: connectedWallet?.address?.substring(0, 12) + '...',
    userWallet: user?.wallet,
    userLinking: user?.linking,
    allWallets: wallets.map(w => ({ address: w.address?.substring(0, 12) + '...', isEthereum: w.address?.startsWith('0x') }))
  })

  return (
    <button
      onClick={handleDisconnect}
      className="!bg-gray-700 hover:!bg-gray-600 !text-white !rounded-lg !px-3 !py-2 sm:!px-4 sm:!py-2 lg:!px-6 lg:!py-3 !font-bold !border-0 !shadow-xl !transition-all !duration-300 !text-sm sm:!text-base whitespace-nowrap flex items-center gap-2"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Disconnect</span>
    </button>
  )
} 