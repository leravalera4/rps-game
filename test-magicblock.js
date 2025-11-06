#!/usr/bin/env node

// Simple test script to verify MagicBlock connections
const { Connection } = require('@solana/web3.js');

// MagicBlock endpoints
const BASE_LAYER_URL = 'https://api.devnet.solana.com';
const MAGICBLOCK_DEVNET_URL = 'https://devnet.magicblock.app';
const MAGICBLOCK_ROUTER_URL = 'https://devnet-rpc.magicblock.app';

async function testConnection(url, name) {
  const startTime = Date.now();
  try {
    const connection = new Connection(url, 'confirmed');
    const blockhash = await connection.getLatestBlockhash('confirmed');
    const latency = Date.now() - startTime;
    
    console.log(`✅ ${name}: Connected (${latency}ms)`);
    console.log(`   Blockhash: ${blockhash.blockhash.slice(0, 10)}...`);
    return { healthy: true, latency };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.log(`❌ ${name}: Failed (${latency}ms)`);
    console.log(`   Error: ${error.message}`);
    return { healthy: false, latency };
  }
}

async function testMagicBlockConnections() {
  console.log('🔗 Testing MagicBlock Ephemeral Rollup Connections...\n');
  
  const tests = [
    { url: BASE_LAYER_URL, name: 'Base Layer (Solana Devnet)' },
    { url: MAGICBLOCK_DEVNET_URL, name: 'MagicBlock Ephemeral' },
    { url: MAGICBLOCK_ROUTER_URL, name: 'MagicBlock Router' }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testConnection(test.url, test.name);
    results.push({ ...test, ...result });
  }
  
  console.log('\n📊 Connection Summary:');
  const healthyConnections = results.filter(r => r.healthy);
  console.log(`   Healthy: ${healthyConnections.length}/${results.length} connections`);
  
  if (healthyConnections.length > 0) {
    const fastest = healthyConnections.sort((a, b) => a.latency - b.latency)[0];
    console.log(`   Fastest: ${fastest.name} (${fastest.latency}ms)`);
  }
  
  // Check if ephemeral rollup is available
  const ephemeralResult = results.find(r => r.name.includes('Ephemeral'));
  if (ephemeralResult?.healthy) {
    console.log('\n🚀 MagicBlock Ephemeral Rollup is READY for Phase 2!');
    console.log('   Expected benefits:');
    console.log('   • ~10ms block times (vs ~400ms base layer)');
    console.log('   • Lower transaction costs');
    console.log('   • Enhanced gaming experience');
  } else {
    console.log('\n⚠️  MagicBlock Ephemeral Rollup not available');
    console.log('   Will fallback to base layer for now');
  }
  
  return results;
}

// Run the test
testMagicBlockConnections()
  .then(() => {
    console.log('\n✨ Connection test complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });