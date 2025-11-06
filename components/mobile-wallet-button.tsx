"use client"

import React from 'react'
import { usePrivy, useWallets, useCreateWallet } from '@privy-io/react-auth'

interface MobileWalletButtonProps {
  children: React.ReactNode
  className?: string
}

export function MobileWalletButton({ children, className = '' }: MobileWalletButtonProps) {
  const { authenticated, login } = usePrivy()
  const { wallets } = useWallets()
  const { createWallet } = useCreateWallet()

  const handleConnect = () => {
    if (!authenticated) {
      login()
    } else if (wallets.length === 0) {
      createWallet({ chainType: 'solana' })
    }
  }

  // Check if user has a wallet connected
  const hasWallet = authenticated && wallets.length > 0

  if (hasWallet) {
    return <>{children}</>
  }

  return (
    <button
      onClick={handleConnect}
      className={`${className}`}
    >
      {children}
    </button>
  )
}

export default MobileWalletButton