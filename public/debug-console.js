// Browser Console Debug Script
// Run this in the browser console to debug Privy wallet issues

console.log('🔍 Starting Privy Wallet Debug...');

// Function to check Privy availability
function checkPrivyAvailability() {
  console.log('\n📋 Checking Privy Availability:');
  
  if (typeof window.privy !== 'undefined') {
    console.log('✅ Privy is available globally');
    console.log('Privy object:', window.privy);
  } else {
    console.log('❌ Privy not available globally');
  }
  
  // Check for React context (this would be available in React components)
  console.log('ℹ️ Note: Privy hooks are only available in React components');
  console.log('ℹ️ Use: const { ready, authenticated, user, wallets } = usePrivy();');
}

// Function to check localStorage for Privy data
function checkPrivyData() {
  console.log('\n📋 Checking Privy Data:');
  
  // Check localStorage
  const privyUser = localStorage.getItem('privy:user');
  if (privyUser) {
    console.log('✅ Privy user data found in localStorage');
    try {
      const userData = JSON.parse(privyUser);
      console.log('User data:', userData);
      console.log('User ID:', userData.id);
      console.log('Wallets count:', userData.wallets?.length || 0);
      
      if (userData.wallets) {
        userData.wallets.forEach((wallet, index) => {
          console.log(`Wallet ${index}:`, {
            address: wallet.address?.substring(0, 12) + '...',
            chainType: wallet.chainType,
            walletClientType: wallet.walletClientType
          });
        });
      }
    } catch (error) {
      console.log('❌ Could not parse Privy user data:', error);
    }
  } else {
    console.log('❌ No Privy user data in localStorage');
  }
  
  // Check sessionStorage
  const privySession = sessionStorage.getItem('privy:session');
  if (privySession) {
    console.log('✅ Privy session data found');
    console.log('Session data:', privySession);
  } else {
    console.log('❌ No Privy session data');
  }
}

// Function to check wallet methods (if wallet is available)
function checkWalletMethods(wallet) {
  console.log('\n📋 Checking Wallet Methods:');
  
  if (!wallet) {
    console.log('❌ No wallet provided');
    return;
  }
  
  console.log('Wallet object:', wallet);
  console.log('Wallet type:', typeof wallet);
  console.log('Wallet constructor:', wallet.constructor?.name);
  console.log('Available methods:', Object.keys(wallet));
  console.log('Available properties:', Object.getOwnPropertyNames(wallet));
  
  // Check for signing methods
  const signingMethods = ['signTransaction', 'sign', 'signMessage', 'signingFunction', 'signTx'];
  signingMethods.forEach(method => {
    if (typeof wallet[method] === 'function') {
      console.log(`✅ Found signing method: ${method}`);
    } else {
      console.log(`❌ Signing method not found: ${method}`);
    }
  });
}

// Function to test transaction creation
function testTransactionCreation() {
  console.log('\n📋 Testing Transaction Creation:');
  
  try {
    // Check if Solana Web3.js is available
    if (typeof window.solana !== 'undefined') {
      console.log('✅ Solana Web3.js available');
    } else {
      console.log('❌ Solana Web3.js not available');
    }
    
    // This would normally be done with proper imports
    console.log('ℹ️ Transaction creation requires proper Solana Web3.js imports');
    console.log('ℹ️ Use: import { Transaction, SystemProgram } from "@solana/web3.js"');
    
  } catch (error) {
    console.log('❌ Error testing transaction creation:', error);
  }
}

// Function to simulate the signing process
function simulateSigningProcess() {
  console.log('\n📋 Simulating Signing Process:');
  
  console.log('1. ✅ User authenticates with Privy');
  console.log('2. ✅ Privy creates embedded Solana wallet');
  console.log('3. ✅ Wallet appears in wallets array');
  console.log('4. ❓ Transaction creation (requires Solana Web3.js)');
  console.log('5. ❓ Transaction signing (this is where we have issues)');
  console.log('6. ❓ Transaction sending');
  
  console.log('\n🔍 Common issues:');
  console.log('- Wallet does not have signTransaction method');
  console.log('- Transaction serialization fails before signing');
  console.log('- Privy API expects different format');
  console.log('- Wallet structure is different than expected');
}

// Function to run all debug checks
function runFullDebug() {
  console.log('🚀 Running Full Privy Wallet Debug...\n');
  
  checkPrivyAvailability();
  checkPrivyData();
  testTransactionCreation();
  simulateSigningProcess();
  
  console.log('\n📊 Debug Summary:');
  console.log('1. Check if Privy is loaded and user is authenticated');
  console.log('2. Check if Solana wallet is created and available');
  console.log('3. Check wallet methods and structure');
  console.log('4. Try different signing approaches');
  console.log('5. Check console logs when creating SOL game');
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Open the main app (http://localhost:3000)');
  console.log('2. Connect wallet and authenticate');
  console.log('3. Open browser console');
  console.log('4. Try to create a SOL game');
  console.log('5. Watch for detailed logs starting with 🔐');
  console.log('6. Copy any error messages and share them');
}

// Auto-run debug on script load
runFullDebug();

// Export functions for manual use
window.debugPrivy = {
  checkPrivyAvailability,
  checkPrivyData,
  checkWalletMethods,
  testTransactionCreation,
  simulateSigningProcess,
  runFullDebug
};

console.log('\n✅ Debug functions available as window.debugPrivy');
console.log('Usage: window.debugPrivy.runFullDebug()');
console.log('Usage: window.debugPrivy.checkWalletMethods(wallet)');
