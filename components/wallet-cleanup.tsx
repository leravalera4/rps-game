"use client"

import React from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Trash2, Wallet } from 'lucide-react'

export function WalletCleanup() {
  const { authenticated, user } = usePrivy()
  const { wallets } = useWallets()

  if (!authenticated) {
    return null
  }

  const ethereumWallets = wallets.filter(w => w.address?.startsWith('0x'))
  const solanaWallets = wallets.filter(w => w.address && !w.address.startsWith('0x'))
  const userSolanaWallet = user?.wallet?.chainType === 'solana' ? [user.wallet] : []
  const totalWallets = wallets.length
  const hasSolanaWallet = solanaWallets.length > 0 || userSolanaWallet.length > 0

  const handleCleanup = () => {
    console.log('🧹 Wallet cleanup requested')
    console.log('📊 Current wallet stats:', {
      total: totalWallets,
      ethereum: ethereumWallets.length,
      solana: solanaWallets.length
    })
    
    // Show instructions for manual cleanup
    alert(`Для очистки кошельков:

1. Откройте Privy Dashboard: https://dashboard.privy.io
2. Перейдите в раздел "Users" 
3. Найдите пользователя: ${user?.id}
4. Удалите лишние Ethereum кошельки (${ethereumWallets.length} штук)
5. Оставьте только один Solana кошелек

Текущее состояние:
- Всего кошельков в массиве: ${totalWallets}
- Ethereum: ${ethereumWallets.length} (лишние)
- Solana в массиве: ${solanaWallets.length}
- Solana в user.wallet: ${userSolanaWallet.length}

Проблема: Solana кошелек находится в user.wallet, но не в массиве wallets.
Это вызывает ошибки подписи транзакций.`)
  }

  if (totalWallets <= 1) {
    return null
  }

  return (
    <Card className="bg-red-900/20 border-red-700/50 mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-400">
          <AlertTriangle className="h-5 w-5" />
          Проблема с кошельками
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-red-300">
            Создано слишком много кошельков: <strong>{totalWallets}</strong>
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-red-800/30 p-3 rounded">
              <div className="flex items-center gap-2 text-red-400">
                <Wallet className="h-4 w-4" />
                Ethereum: {ethereumWallets.length}
              </div>
              {ethereumWallets.map((w, i) => (
                <div key={i} className="text-red-300 text-xs mt-1">
                  {w.address?.substring(0, 12)}...
                </div>
              ))}
            </div>
            
            <div className="bg-green-800/30 p-3 rounded">
              <div className="flex items-center gap-2 text-green-400">
                <Wallet className="h-4 w-4" />
                Solana: {solanaWallets.length + userSolanaWallet.length}
              </div>
              {solanaWallets.map((w, i) => (
                <div key={i} className="text-green-300 text-xs mt-1">
                  {w.address?.substring(0, 12)}...
                </div>
              ))}
              {userSolanaWallet.map((w, i) => (
                <div key={`user-${i}`} className="text-green-300 text-xs mt-1">
                  {w.address?.substring(0, 12)}... (user.wallet)
                </div>
              ))}
            </div>
          </div>
          
          <Button 
            onClick={handleCleanup}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Инструкции по очистке
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
