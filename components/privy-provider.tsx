"use client";

import { PrivyProvider as PrivyProviderComponent } from "@privy-io/react-auth";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  const appId =
    process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clzqyv10q00ehf40qgqyozrdy";

  return (
    <PrivyProviderComponent
      appId={appId}
      config={{
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
        // Configure Solana RPC for both mainnet and devnet
        solana: {
          rpcs: {
            "solana:mainnet": {
              rpc: createSolanaRpc("https://api.devnet.solana.com"),
              rpcSubscriptions: createSolanaRpcSubscriptions(
                "wss://api.devnet.solana.com"
              ),
            },
            "solana:devnet": {
              rpc: createSolanaRpc("https://api.devnet.solana.com"),
              rpcSubscriptions: createSolanaRpcSubscriptions(
                "wss://api.devnet.solana.com"
              ),
            },
          },
        },
        loginMethods: ["sms", "email", "wallet", "google"],
        appearance: {
          theme: "dark",
          accentColor: "#9333ea",
        },
      }}
    >
      {children}
    </PrivyProviderComponent>
  );
}
