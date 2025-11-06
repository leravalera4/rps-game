import type { Metadata, Viewport } from 'next'
import { Orbitron } from 'next/font/google'
import './globals.css'
import { PrivyProvider } from "@/components/privy-provider"
import { PrivyConnectionProvider } from "@/hooks/use-privy-wallet"
import { BackgroundMusic } from "@/components/background-music"

const orbitron = Orbitron({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Rock Paper Scissors Game',
  description: 'Play Rock Paper Scissors with Solana',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#9333ea',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={orbitron.className}>
      <body>
        <PrivyProvider>
          <PrivyConnectionProvider>
            {children}
            <BackgroundMusic />
          </PrivyConnectionProvider>
        </PrivyProvider>
        
        {/* Microsoft Clarity Analytics */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "kz8xqjqjqj");
            `,
          }}
        />
      </body>
    </html>
  )
}