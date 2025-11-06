# Privy Integration Setup Guide

This application uses Privy for Solana wallet authentication.

## Setup Steps

### 1. Install Dependencies

```bash
cd web
npm install @privy-io/react-auth@latest
npm install @solana/kit @solana-program/memo @solana-program/system @solana-program/token
```

### 2. Get Privy App ID

1. Go to https://dashboard.privy.io/
2. Create a new app or select an existing one
3. Copy your App ID
4. Add it to your `.env.local` file:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_app_id_here
```

### 3. Configure Solana Network

In `components/privy-provider.tsx`, update the chain configuration:

```typescript
solana: {
  chain: 'devnet', // or 'mainnet-beta'
}
```

### 4. Features

- **Embedded Wallet**: Users can create a wallet without external wallets
- **Web Wallet**: Connect with email, phone, or social login
- **External Wallet**: Connect existing Solana wallets (Phantom, Solflare, etc.)
- **Social Login**: Google, Twitter, etc.

### 5. Webpack Configuration

The `next.config.mjs` file includes webpack externals configuration for Privy's Solana dependencies:

```javascript
webpack: (config) => {
  config.externals['@solana/kit'] = 'commonjs @solana/kit'
  config.externals['@solana-program/memo'] = 'commonjs @solana-program/memo'
  config.externals['@solana-program/system'] = 'commonjs @solana-program/system'
  config.externals['@solana-program/token'] = 'commonjs @solana-program/token'
  return config
}
```

### 6. Components

- **`CustomPrivyProvider`**: Wraps the app with Privy context
- **`PrivyWalletButton`**: Button component for connecting wallet
- **`usePrivyWallet`**: Hook to access Privy wallet interface

### 7. Usage

Replace the old wallet adapter components with Privy components:

```typescript
import { PrivyWalletButton } from '@/components/privy-wallet-button'

// In your component
<PrivyWalletButton />
```

## Migration Notes

The old `WalletContextProvider` has been replaced with `CustomPrivyProvider` in `app/layout.tsx`.

All wallet adapter imports (`@solana/wallet-adapter-*`) should be replaced with Privy hooks:

```typescript
// Old
import { useWallet } from '@solana/wallet-adapter-react'

// New
import { usePrivy, useSolanaWallets } from '@privy-io/react-auth'
```

## Troubleshooting

### Webpack Errors

If you see webpack errors, make sure the webpack configuration in `next.config.mjs` is correct.

### Connection Issues

Check that your Privy App ID is correctly set in the environment variables.

### Solana Chain Issues

Make sure the chain configuration matches your deployment environment (devnet vs mainnet).
