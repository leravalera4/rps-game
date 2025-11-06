// 🔍 Быстрый тест кошелька
// Скопируйте этот код в консоль браузера (F12)

console.log('🧪 Testing wallet detection...')

// Проверяем доступность Privy
if (typeof window.privy === 'undefined') {
  console.error('❌ Privy not found')
} else {
  console.log('✅ Privy found')
  
  // Проверяем пользователя
  const user = window.privy.user
  console.log('👤 User:', user?.id)
  
  // Проверяем кошельки
  const wallets = window.privy.wallets || []
  console.log('💰 Wallets array:', wallets.length)
  
  // Проверяем user.wallet
  const userWallet = user?.wallet
  console.log('🔍 User wallet:', userWallet ? {
    address: userWallet.address?.substring(0, 12) + '...',
    chainType: userWallet.chainType,
    walletClientType: userWallet.walletClientType
  } : 'none')
  
  // Ищем Solana кошелек
  const solanaWallet = wallets.find(w => w.address && !w.address.startsWith('0x'))
  console.log('🔍 Solana wallet in array:', solanaWallet ? {
    address: solanaWallet.address?.substring(0, 12) + '...',
    chainType: solanaWallet.chainType,
    walletClientType: solanaWallet.walletClientType
  } : 'none')
  
  // Определяем итоговый кошелек
  const finalWallet = solanaWallet || (userWallet?.chainType === 'solana' ? userWallet : null)
  console.log('🎯 Final wallet for signing:', finalWallet ? {
    address: finalWallet.address?.substring(0, 12) + '...',
    source: finalWallet === userWallet ? 'user.wallet' : 'wallets array',
    hasSignTransaction: !!finalWallet.signTransaction
  } : 'none')
  
  if (finalWallet) {
    console.log('✅ Wallet found for signing!')
  } else {
    console.log('❌ No wallet found for signing')
  }
}
