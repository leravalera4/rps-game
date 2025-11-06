"use client"

import { usePrivy, useSolana, useSolanaWallets } from '@privy-io/react-auth'
import { useCallback } from 'react'

export function PrivyWalletButton() {
  const { ready, authenticated, login, logout } = usePrivy()
  const { selectWallet, sendTransaction, signMessage } = useSolana()
  const { wallets } = useSolanaWallets()

  const handleConnect = useCallback(() => {
    if (!authenticated) {
      login()
    } else if (wallets.length > 0) {
      selectWallet(wallets[0])
    }
  }, [authenticated, login, wallets, selectWallet])

  const handleDisconnect = useCallback(() => {
    logout()
  }, [logout])

  if (!ready) {
    return (
      <button className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 hover:from-purple-700 hover:via-purple-800 hover:to-pink-700 text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2 lg:px-6 lg:py-3 font-bold border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base whitespace-nowrap opacity-50">
        Loading...
      </button>
    )
  }

  if (!authenticated) {
    return (
      <button
        onClick={handleConnect}
        className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 hover:from-purple-700 hover:via-purple-800 hover:to-pink-700 text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2 lg:px-6 lg:py-3 font-bold border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base whitespace-nowrap"
      >
        Connect Wallet
      </button>
    )
  }

  // Show connected state
  // Filter only Solana wallets to avoid showing Ethereum addresses
  const solanaWallets = wallets.filter(w => w.address && !w.address.startsWith('0x'))
  const connectedWallet = solanaWallets[0]
  
  if (connectedWallet) {
    const address = connectedWallet.address
    const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`

    return (
      <button
        onClick={handleDisconnect}
        className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2 lg:px-6 lg:py-3 font-bold border-0 shadow-xl transition-all duration-300 text-sm sm:text-base whitespace-nowrap"
      >
        {shortAddress}
      </button>
    )
  }

  return (
    <button
      onClick={handleConnect}
      className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 hover:from-purple-700 hover:via-purple-800 hover:to-pink-700 text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2 lg:px-6 lg:py-3 font-bold border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base whitespace-nowrap"
    >
      Connect
    </button>
  )
}
