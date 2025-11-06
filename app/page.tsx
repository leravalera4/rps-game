"use client"

import { useState, useEffect } from "react"
import confetti from "canvas-confetti"
import { usePrivyWallet as useWallet } from '@/hooks/use-privy-wallet'
import { usePrivy } from '@privy-io/react-auth'
import { useConnection } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useGame } from "@/hooks/use-game"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useLeaderboard } from "@/hooks/use-leaderboard"
import { useStats } from "@/hooks/use-stats"
import { useAnchorProgram } from "@/hooks/use-anchor-program"
import { StyledWalletButton } from "@/components/styled-wallet-button"
import { JoinGameDialog } from "@/components/join-game-dialog"
import { useSimpleMove } from "../hooks/use-simple-move"
import { useReferral } from "@/hooks/use-referral"
import { ReferralCard } from "@/components/referral-card"
import { ReferralInputDialog } from "@/components/referral-input-dialog"
import { ReferralHistory } from "@/components/referral-history"
import { WinningsHistory } from "@/components/winnings-history"
import { DepositSolDialog } from "@/components/deposit-sol-dialog"
import { WithdrawSolDialog } from "@/components/withdraw-sol-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

import {
  Zap,
  Users,
  Trophy,
  Share2,
  Hand,
  Copy,
  Sparkles,
  Wallet,
  Clock,
  GamepadIcon,
  Target,
  Crown,
  Medal,
  Star,
  Search,
  Plus,
  Circle,
  Square,
  X,
  LogOut,
  AlertTriangle,
  Gift,
  Coins,
  TrendingUp,
} from "lucide-react"

interface WalletOption {
  id: string
  name: string
  icon: string
  description: string
}

// GameState interface is now imported from use-game hook

const walletOptions: WalletOption[] = [
  {
    id: "phantom",
    name: "Phantom",
    icon: "/icons/phantom.svg",
    description: "Connect using Phantom wallet",
  },
  {
    id: "solflare",
    name: "Solflare",
    icon: "/icons/solflare.svg",
    description: "Connect using Solflare wallet",
  },
  {
    id: "mew",
    name: "MEW Wallet",
    icon: "/icons/mew.svg",
    description: "Connect using MEW wallet",
  },
  {
    id: "bonk",
    name: "Bonk Wallet",
    icon: "/icons/bonk.svg",
    description: "Connect using Bonk wallet",
  },
  {
    id: "solana",
    name: "Solana Wallet",
    icon: "/icons/solana.svg",
    description: "Connect using Solana wallet",
  },
  {
    id: "backpack",
    name: "Backpack",
    icon: "/icons/backpack.svg",
    description: "Connect using Backpack wallet",
  },
]

// Move icon components
const Rock = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 512 512" className={className}>
    <path d="M243.8,0c-25.9,0-48.7,13.7-61.7,34.3c-10.7-6.1-22.8-9.9-35.8-9.9c-40.1,0-73.1,33-73.1,73.1v89.1l-51,65.5
      c-31.1,40.3-29,98.1,4.6,136.4l57.9,65.5c32.4,36.9,79,57.9,128,57.9h128.8c94,0,170.7-76.7,170.7-170.7V121.9
      c0-40.1-33-73.1-73.1-73.1c-13,0-25.1,3.8-35.8,9.9c-13-20.6-35.8-34.3-61.7-34.3c-13,0-25.1,3.8-35.8,9.9
      C292.5,13.7,269.7,0,243.8,0z M243.8,48.8c13.8,0,24.4,10.6,24.4,24.4v73.1h48.8V97.5c0-13.8,10.6-24.4,24.4-24.4
      c13.8,0,24.4,10.6,24.4,24.4v48.8h48.8v-24.4c0-13.8,10.6-24.4,24.4-24.4c13.8,0,24.4,10.6,24.4,24.4v219.4
      c0,67.6-54.3,121.9-121.9,121.9H212.6c-35,0-68.3-14.8-91.4-41.1l-57.9-66.3c-18.4-21-19.3-51-2.3-73.1l12.2-16v25.9h48.8v-195
      c0-13.8,10.6-24.4,24.4-24.4s24.4,10.6,24.4,24.4v48.8h48.8V73.1C219.4,59.3,230,48.8,243.8,48.8z"/>
  </svg>
)

const Paper = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 512 512" className={className}>
    <path d="M274.3,0C249,0,228,17.7,221.7,41.1c-6.4-2.6-13.2-4.6-20.6-4.6c-30.1,0-54.9,24.8-54.9,54.9V288l-16-16
      c-21.3-21.3-56.4-21.3-77.7,0s-21.3,56.4,0,77.7l124,124c21.5,21.4,51.2,38.3,86.3,38.3h84.6c70.5,0,128-57.5,128-128V164.6
      c0-30.1-24.8-54.9-54.9-54.9c-6.4,0-12.5,1.4-18.3,3.4V91.4c0-30.1-24.8-54.9-54.9-54.9c-7.4,0-14.1,1.9-20.6,4.6
      C320.6,17.7,299.6,0,274.3,0z M274.3,36.6c10.4,0,18.3,7.9,18.3,18.3v182.9h36.6V91.4c0-10.4,7.9-18.3,18.3-18.3
      s18.3,7.9,18.3,18.3v146.3h36.6v-73.1c0-10.4,7.9-18.3,18.3-18.3c10.4,0,18.3,7.9,18.3,18.3V384c0,50.7-40.7,91.4-91.4,91.4h-84.6
      c-23.3,0-43.3-11.4-60-28L78.3,324c-7.3-7.3-7.3-19,0-26.3c7.3-7.3,19-7.3,26.3,0l46.9,47.4l31.4,31.4V91.4
      c0-10.4,7.9-18.3,18.3-18.3s18.3,7.9,18.3,18.3v146.3H256V54.9C256,44.5,263.9,36.6,274.3,36.6z"/>
  </svg>
)

const Scissors = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 512 512" className={className}>
    <path d="M256,0c-70.7,0-128,57.3-128,128v64l-32,32c-17.7,17.7-17.7,46.3,0,64l32,32v64c0,70.7,57.3,128,128,128s128-57.3,128-128
      V320l32-32c17.7-17.7,17.7-46.3,0-64l-32-32V128C384,57.3,326.7,0,256,0z M256,32c53,0,96,43,96,96v64l32,32l-32,32v64
      c0,53-43,96-96,96s-96-43-96-96V256l-32-32l32-32V128C160,75,203,32,256,32z M192,192c8.8,0,16,7.2,16,16s-7.2,16-16,16s-16-7.2-16-16
      S183.2,192,192,192z M320,192c8.8,0,16,7.2,16,16s-7.2,16-16,16s-16-7.2-16-16S311.2,192,320,192z"/>
  </svg>
)

const moves = [
  {
    id: "rock",
    name: "Rock",
    icon: (
      <div className="w-10 h-10 flex items-center justify-center">
        <svg viewBox="0 0 512 512" className="w-8 h-8 fill-current">
          <path d="M243.8,0c-25.9,0-48.7,13.7-61.7,34.3c-10.7-6.1-22.8-9.9-35.8-9.9c-40.1,0-73.1,33-73.1,73.1v89.1l-51,65.5
            c-31.1,40.3-29,98.1,4.6,136.4l57.9,65.5c32.4,36.9,79,57.9,128,57.9h128.8c94,0,170.7-76.7,170.7-170.7V121.9
            c0-40.1-33-73.1-73.1-73.1c-13,0-25.1,3.8-35.8,9.9c-13-20.6-35.8-34.3-61.7-34.3c-13,0-25.1,3.8-35.8,9.9
            C292.5,13.7,269.7,0,243.8,0z M243.8,48.8c13.8,0,24.4,10.6,24.4,24.4v73.1h48.8V97.5c0-13.8,10.6-24.4,24.4-24.4
            c13.8,0,24.4,10.6,24.4,24.4v48.8h48.8v-24.4c0-13.8,10.6-24.4,24.4-24.4c13.8,0,24.4,10.6,24.4,24.4v219.4
            c0,67.6-54.3,121.9-121.9,121.9H212.6c-35,0-68.3-14.8-91.4-41.1l-57.9-66.3c-18.4-21-19.3-51-2.3-73.1l12.2-16v25.9h48.8v-195
            c0-13.8,10.6-24.4,24.4-24.4s24.4,10.6,24.4,24.4v48.8h48.8V73.1C219.4,59.3,230,48.8,243.8,48.8z"/>
        </svg>
      </div>
    ),
    bgColor: "bg-yellow-500/20",
    borderColor: "border-yellow-500/50",
    textColor: "text-yellow-400",
  },
  {
    id: "paper",
    name: "Paper",
    icon: (
      <div className="w-10 h-10 flex items-center justify-center">
        <svg viewBox="0 0 512 512" className="w-8 h-8 fill-current">
          <path d="M274.3,0C249,0,228,17.7,221.7,41.1c-6.4-2.6-13.2-4.6-20.6-4.6c-30.1,0-54.9,24.8-54.9,54.9V288l-16-16
            c-21.3-21.3-56.4-21.3-77.7,0s-21.3,56.4,0,77.7l124,124c21.5,21.4,51.2,38.3,86.3,38.3h84.6c70.5,0,128-57.5,128-128V164.6
            c0-30.1-24.8-54.9-54.9-54.9c-6.4,0-12.5,1.4-18.3,3.4V91.4c0-30.1-24.8-54.9-54.9-54.9c-7.4,0-14.1,1.9-20.6,4.6
            C320.6,17.7,299.6,0,274.3,0z M274.3,36.6c10.4,0,18.3,7.9,18.3,18.3v182.9h36.6V91.4c0-10.4,7.9-18.3,18.3-18.3
            s18.3,7.9,18.3,18.3v146.3h36.6v-73.1c0-10.4,7.9-18.3,18.3-18.3c10.4,0,18.3,7.9,18.3,18.3V384c0,50.7-40.7,91.4-91.4,91.4h-84.6
            c-23.3,0-43.3-11.4-60-28L78.3,324c-7.3-7.3-7.3-19,0-26.3c7.3-7.3,19-7.3,26.3,0l46.9,47.4l31.4,31.4V91.4
            c0-10.4,7.9-18.3,18.3-18.3s18.3,7.9,18.3,18.3v146.3H256V54.9C256,44.5,263.9,36.6,274.3,36.6z"/>
        </svg>
      </div>
    ),
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/50",
    textColor: "text-green-400",
  },
  {
    id: "scissors",
    name: "Scissors",
    icon: (
      <div className="w-10 h-10 flex items-center justify-center translate-x-[2px]">
        <svg viewBox="0 0 512 512" className="w-8 h-8 fill-current">
          <path d="M172,72.9c-15.1-0.3-27.7,2.9-35.4,5.1H136L90.3,92.3C36.6,108.8,0,158.5,0,214.6v96.6c0,70.5,57.5,128,128,128h181.1
            c22.3,0.5,43.9-12.6,52.6-34.3c5.5-13.8,4.7-28.3-0.6-41.1c11.2-5.9,20.7-15.5,25.7-28c5.7-14.4,4.8-29.6-1.1-42.9h71.4
            c30.1,0,54.9-24.8,54.9-54.9s-24.8-54.9-54.9-54.9h-28l7.4-2.3c28.8-8.7,45.3-39.8,36.6-68.6S433.4,67,404.6,75.7l-154.3,47.4
            c-1.4-3.4-2.9-7.1-5.1-10.9C236,97,217.5,79.7,188,74.6C182.5,73.6,177.1,72.9,172,72.9z M422.9,110c7.1,0.8,13.2,5.7,15.4,13.1
            c3,9.9-2.7,19.9-12.6,22.9l-125.1,37.7l6.3,20.6v15.4h150.3c10.4,0,18.3,7.9,18.3,18.3s-7.9,18.3-18.3,18.3H336.6l-48-18.9
            c-6.9-2.8-14.1-4.1-21.1-4l-9.7-74.9l157.7-48C417.9,109.8,420.5,109.7,422.9,110z M171.4,110.6c3.5,0,7.1,0,10.3,0.6
            c19.6,3.4,27.2,12,32,20c4.8,8,5.1,13.7,5.1,13.7v1.1l15.4,117.7l0.6,1.7c2.3,9.6-3.5,18.9-13.1,21.1c-5.9,1.4-8.9,0.6-12-1.1
            c-3.1-1.8-6.9-5.6-9.7-13.7l-22.9-88.6c-1.4-5.4-5.3-9.9-10.4-12.1c-5.1-2.2-11-2-15.9,0.6l-30.3,16.6c-8.9,4.9-12.1,16-7.1,24.9
            c4.9,8.9,16,12.1,24.9,7.1l9.1-5.1l17.7,67.4l0.6,1.7c4.9,14.1,13.4,25.5,25.1,32.6c9.6,5.8,20.9,8,32,6.9
            c-5.8,5.4-10.6,12.2-13.7,20c-8.4,20.9-3.1,43.9,12,58.9H128c-50.7,0-91.4-40.7-91.4-91.4v-96.6c0-40.2,26.1-75.6,64.6-87.4
            l45.7-13.7C150.6,112.3,161,110.6,171.4,110.6z M270.9,270.6l4,0.6l68,27.4c9.6,3.9,14.1,13.9,10.3,23.4s-14.4,14.1-24,10.3
            l-68-26.9l-2.3-1.7C266.1,294.4,270.7,282.7,270.9,270.6z M259.4,346c2.4,0,5,0.2,7.4,1.1l24.6,9.7l24,9.7l2.3,0.6
            c9.6,3.9,14.1,14.4,10.3,24c-2.8,7-9,11.1-16,11.4h-0.6c-2.4,0.1-5-0.2-7.4-1.1l-50.9-20.6c-9.6-3.9-14.1-14.4-10.3-24
            c1.9-4.8,5.4-7.9,9.7-9.7C254.7,346.2,257,346,259.4,346z"/>
        </svg>
      </div>
    ),
    bgColor: "bg-pink-500/20",
    borderColor: "border-pink-500/50",
    textColor: "text-pink-400",
  },
]



export default function RockPaperScissorsGame() {
  const { wallet, publicKey, connected } = useWallet()
  const { logout } = usePrivy()
  const { connection } = useConnection()
  
  // Silence console logs in production (client-side)
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // @ts-ignore
      console.log = () => {}
      // @ts-ignore
      console.warn = () => {}
      // Keep console.error to surface critical issues or silence it too if requested
      // @ts-ignore
      console.error = () => {}
    }
  }, [])
  
  const [stakeAmount, setStakeAmount] = useState("0.01")
  const [randomGameStakeSelected, setRandomGameStakeSelected] = useState(false)
  
  // Referral system
  const referralHook = useReferral()
  const [showReferralInput, setShowReferralInput] = useState(false)
  const [referralCodeFromUrl, setReferralCodeFromUrl] = useState<string | null>(null)

  // Function to calculate platform fee based on stake amount
  const getPlatformFeeRate = (stake: string | number) => {
    const amount = typeof stake === 'string' ? parseFloat(stake) : stake
    if (amount <= 0.01) return 0.05  // 5% for 0.01 SOL
    if (amount <= 0.05) return 0.03  // 3% for 0.05 SOL
    return 0.02  // 2% for 0.1 SOL and above
  }

  // Function to get platform fee percentage text
  const getPlatformFeeText = (stake: string | number) => {
    const amount = typeof stake === 'string' ? parseFloat(stake) : stake
    if (amount <= 0.01) return "5%"
    if (amount <= 0.05) return "3%"
    return "2%"
  }
  const [walletBalance, setWalletBalance] = useState(0)
  const [currentView, setCurrentView] = useState<"lobby" | "game" | "leaderboard" | "referrals">("lobby")
  const [selectedCurrency, setSelectedCurrency] = useState<"points" | "sol">("points")
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false)
  const [depositDialogOpen, setDepositDialogOpen] = useState(false)
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false)
  const [showRoundResult, setShowRoundResult] = useState(true)
  const [roundResultCountdown, setRoundResultCountdown] = useState(3)
  const [showRevealScreen, setShowRevealScreen] = useState(false)
  const [startCountdown, setStartCountdown] = useState<number | null>(null)
  const [prevCountdown, setPrevCountdown] = useState<number | null>(null)
  
  // Sound functions for countdown
  const playCountdownSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800 // Higher pitch for countdown
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (error) {
      console.log('Could not play countdown sound:', error)
    }
  }
  
  const playGameStartSound = () => {
    try {
      // Create a longer, more exciting sound for game start
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.3)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.log('Could not play game start sound:', error)
    }
  }
  
  const playTimerTickSound = () => {
    try {
      // Create a subtle tick sound for timer countdown
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 600
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      console.log('Could not play timer tick sound:', error)
    }
  }
  
  const playTimerWarningSound = () => {
    try {
      // Create a more urgent sound when time is running low
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 1000
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.25, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.15)
    } catch (error) {
      console.log('Could not play timer warning sound:', error)
    }
  }
  
  const playVictorySound = () => {
    try {
      // Create an exciting victory sound with ascending notes
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Play a sequence of ascending notes for victory
      const notes = [523.25, 659.25, 783.99, 1046.50] // C, E, G, C (C major chord)
      
      notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = freq
        oscillator.type = 'sine'
        
        const startTime = audioContext.currentTime + (index * 0.15)
        const duration = 0.3
        
        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05)
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration)
        
        oscillator.start(startTime)
        oscillator.stop(startTime + duration)
      })
    } catch (error) {
      console.log('Could not play victory sound:', error)
    }
  }
  
  const playDefeatSound = () => {
    try {
      // Create a descending sad sound for defeat
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Play a sequence of descending notes for defeat
      const notes = [523.25, 440, 349.23, 261.63] // C, A, F, C (descending)
      
      notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = freq
        oscillator.type = 'sine'
        
        const startTime = audioContext.currentTime + (index * 0.2)
        const duration = 0.4
        
        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.05)
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration)
        
        oscillator.start(startTime)
        oscillator.stop(startTime + duration)
      })
    } catch (error) {
      console.log('Could not play defeat sound:', error)
    }
  }

  const [gameError, setGameError] = useState<string | null>(null)
  const [matchmakingTimeout, setMatchmakingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isCreatingGame, setIsCreatingGame] = useState(false)
  const [creatingGameType, setCreatingGameType] = useState<'private' | 'public'>('private')
  const [isRestoringSession, setIsRestoringSession] = useState(false)
  const [ignoreSocketEvents, setIgnoreSocketEvents] = useState(false)
  // NOTE: isFinalizingGame state removed - SOL games now use automatic distribution

  // Confetti function for victory celebration with emoji
  const triggerVictoryConfetti = () => {
    try {
      const scalar = 2
      // @ts-ignore
      const trophy = confetti.shapeFromText({ text: '🏆', scalar })
      
      const defaults = {
        spread: 360,
        ticks: 100,
        gravity: 0.8,
        decay: 0.94,
        startVelocity: 30,
        shapes: [trophy],
        scalar
      }
      
      function shoot() {
        confetti({
          ...defaults,
          particleCount: 50,
        })
        
        confetti({
          ...defaults,
          particleCount: 20,
        })
        
        confetti({
          ...defaults,
          particleCount: 30,
          scalar: scalar / 2,
          shapes: ['circle']
        })
      }
      
      shoot()
      setTimeout(shoot, 100)
      setTimeout(shoot, 200)
    } catch (error) {
      console.error('Failed to load confetti:', error)
    }
  }
  
  // Defeat emoji animation function
  const triggerDefeatAnimation = () => {
    try {
      const scalar = 2
      // @ts-ignore
      const sadEmoji = confetti.shapeFromText({ text: '😢', scalar })
      
      const defaults = {
        spread: 360,
        ticks: 200,
        gravity: 1,
        decay: 0.92,
        startVelocity: 15,
        shapes: [sadEmoji],
        scalar
      }
      
      function shoot() {
        confetti({
          ...defaults,
          particleCount: 40
        })
      }
      
      shoot()
      setTimeout(shoot, 100)
      setTimeout(shoot, 200)
      setTimeout(shoot, 300)
    } catch (error) {
      console.error('Failed to load confetti:', error)
    }
  }


  // Join game dialog state
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [pendingJoinGameId, setPendingJoinGameId] = useState<string | null>(null)
  const [joinGameLoading, setJoinGameLoading] = useState(false)
  const [joinDialogOpenTime, setJoinDialogOpenTime] = useState<number | null>(null)
  
  // Quit game confirmation dialog state
  const [showQuitDialog, setShowQuitDialog] = useState(false)
  
  // Opponent found state
  const [opponentFound, setOpponentFound] = useState(false)

  // User profile and points management
  const { profile, loading: profileLoading, updating: profileUpdating, error: profileError, refreshProfile, optimisticPointsUpdate, hasEnoughPoints } = useUserProfile()

  // Leaderboard data
  const { leaderboard, userRank, loading: leaderboardLoading, error: leaderboardError, refreshLeaderboard } = useLeaderboard(50)

  // Stats data
  const { stats, loading: statsLoading, error: statsError, refreshStats } = useStats()

  // Auto-switch to SOL if insufficient points - but only when not actively creating/joining games
  useEffect(() => {
    if (profile && selectedCurrency === "points" && !hasEnoughPoints(100) && 
        !isCreatingGame && !joinGameLoading) {
      console.log('🔄 Auto-switching to SOL due to insufficient points:', profile.points_balance)
      setSelectedCurrency("sol")
    }
  }, [profile?.points_balance, selectedCurrency, hasEnoughPoints, isCreatingGame, joinGameLoading]) // Fixed dependencies

  // Game management with real WebSocket integration
  const {
    gameState,
    isInGame,
    createGame,
    joinGame,
    makeMove,
    startGame,
    leaveGame,
    resetGameState,
    isConnected,
    socket,
  } = useGame({
    onGameCreated: (gameId, inviteLink) => {
      console.log('🎮 Game created callback:', gameId, 'inviteLink:', inviteLink)
      
      // Only ignore if we're restoring a session
      if (isRestoringSession) {
        console.log('🚫 Ignoring game_created event - restoring session')
        return
      }
      
      // Update game link and clear creating state
      const gameUrl = `${window.location.origin}/game/${gameId}`
      setGameLink(gameUrl)
      setIsCreatingGame(false)
      setGameError(null)
      
      // Switch to game view
      console.log('🎯 Switching to game view after successful creation')
        setCurrentView("game")
    },
    onGameJoined: (gameState) => {
      console.log('✅ Joined game successfully:', gameState)
      
      // Only ignore if we're restoring a session
      if (isRestoringSession) {
        console.log('🚫 Ignoring game_joined event - restoring session')
        return
      }
      
      // Clear any matchmaking timeout
      if (matchmakingTimeout) {
        clearTimeout(matchmakingTimeout)
        setMatchmakingTimeout(null)
      }
      
      // Clear any errors
      setGameError(null)
      
      // Close join dialog if it's open
      if (joinDialogOpen) {
        console.log('🚪 Closing join dialog after successful join')
        setJoinDialogOpen(false)
        setPendingJoinGameId(null)
        setJoinGameLoading(false)
        setJoinDialogOpenTime(null)
        setGameIdInput('')
      }
      
      // Switch to game view - this shows waiting state until game actually starts
      console.log('🎮 Switching to game view after joining (game may be in waiting state)')
      setCurrentView("game")
    },
    onCountdownUpdate: (countdown: number) => {
      console.log('⏱️ Start countdown:', countdown)
      setStartCountdown(countdown)
      
      // Play sound for countdown
      if (countdown > 0) {
        playCountdownSound()
      } else {
        playGameStartSound()
      }
    },
    onBalanceUpdate: (balance: number) => {
      console.log('💰 Balance updated:', balance, 'SOL')
      setWalletBalance(balance)
    },
    onGameStarted: () => {
      console.log('Game has started!')
      setStartCountdown(null) // Clear countdown when game starts
      
      // Only ignore if we're restoring a session
      if (isRestoringSession) {
        console.log('🚫 Ignoring game_started event - restoring session')
        return
      }
      
      // Switch to game view
      setCurrentView("game")
    },
    onGameFinished: (gameData) => {
      console.log('Game finished! Updating points balance...', gameData)
      
      // Check if this was a points game
      if (selectedCurrency === "points" && profile) {
        const myPlayerId = publicKey?.toString().slice(0, 8)
        
        // Handle different winner data formats
        let winnerPlayerId = null
        if (gameData.winner?.playerId) {
          winnerPlayerId = gameData.winner.playerId
        } else {
          winnerPlayerId = gameData.winner
        }
        
        const didIWin = winnerPlayerId === myPlayerId
        
        console.log('🎮 Points game finished:', {
          myPlayerId,
          winnerPlayerId,
          didIWin,
          currentBalance: profile.points_balance
        })
        
        // For points games, wait a moment for backend to process the completion,
        // then refresh profile to get accurate database state
        setTimeout(() => {
          console.log('🔄 Refreshing profile after backend processing...')
          refreshProfile()
          refreshLeaderboard()
        }, 1500) // Give backend time to process the game completion
      } else if (selectedCurrency === "sol" && gameState.gameId && connected) {
        // For SOL games, the finalization happens automatically on the blockchain
        console.log('🔗 SOL game completed - finalization handled on-chain')
        
        // Just refresh profile to get any updates
        setTimeout(() => {
          refreshProfile()
          refreshLeaderboard()
        }, 3000) // Wait 3 seconds for potential blockchain updates
      } else {
        // For other cases, just refresh profile to get any updates
        refreshProfile()
        refreshLeaderboard()
      }
    },
    onError: (error) => {
      console.error('Game error:', error)
      
      // If error is about declined invitation, show message directly on game screen and reset to lobby
      if (error && typeof error === 'string' && (error.includes('declined') || error.includes('отклонил'))) {
        console.log('🔄 Invitation declined - showing error message on screen')
        console.log('🔄 Current game state:', {
          gameStatus: gameState.gameStatus,
          gameType: gameState.gameType,
          gameId: gameState.gameId
        })
        // Set a special state to show the decline message on screen
        // Keep the game in 'waiting' status so the error message shows on the waiting screen
        setGameError('Player declined your invitation. Returning to lobby.')
        console.log('✅ gameError set to:', 'Player declined your invitation. Returning to lobby.')
        
        // Reset and return to lobby after a short delay to show the message
        setTimeout(() => {
          console.log('🔄 Resetting game and returning to lobby')
          resetGame()
          setCurrentView('lobby')
          setGameError(null) // Clear error state after returning to lobby
        }, 3000) // Show message for 3 seconds
      } else {
        // For other errors, show as normal
        setGameError(error)
      }
    },
  })

  // Anchor program hook for on-chain operations
  const { finalizeGame: anchorFinalizeGame, createGame: anchorCreateGame, cancelGame: anchorCancelGame } = useAnchorProgram({
    onSuccess: (message) => {
      console.log('✅ Smart contract success:', message)
      // Refresh balance and profile after successful finalization
      setTimeout(() => {
        refreshProfile()
        refreshLeaderboard()
      }, 2000)
    },
    onError: (error) => {
      console.error('❌ Smart contract error:', error)
      // NOTE: setIsFinalizingGame removed - SOL games now use automatic distribution
    }
  })

  // Add effect to handle round result visibility and countdown
  useEffect(() => {
    console.log('🎯 Round result effect triggered:', {
      gameStatus: gameState.gameStatus,
      showRoundResult,
      roundResult: gameState.roundResult
    })
    
    if (gameState.gameStatus === "round-result") {
      console.log('🎯 Setting round result to visible')
      setShowRoundResult(true)
      setRoundResultCountdown(3)
      let interval: NodeJS.Timeout | null = null
      const timer = setTimeout(() => {
        console.log('🎯 Round result timeout - hiding result')
        setShowRoundResult(false)
        if (interval) clearInterval(interval)
      }, 3000)
      interval = setInterval(() => {
        setRoundResultCountdown((prev) => (prev > 1 ? prev - 1 : 1))
      }, 1000)
      return () => {
        clearTimeout(timer)
        if (interval) clearInterval(interval)
      }
    } else {
      // Reset showRoundResult when game status changes away from round-result
      console.log('🎯 Game status changed away from round-result, hiding result')
      setShowRoundResult(false)
    }
  }, [gameState.gameStatus, gameState.roundResult])

  // Effect to manage reveal screen before victory (when someone reaches 3 wins)
  useEffect(() => {
    const bothMovesSubmitted = gameState.player1?.currentMove && gameState.player2?.currentMove;
    const someoneWon = (gameState.player1?.wins ?? 0) === 3 || (gameState.player2?.wins ?? 0) === 3;
    
    if (gameState.gameStatus === "round-result" && bothMovesSubmitted && someoneWon) {
      console.log('🎯 Showing reveal screen before victory (3 wins)')
      setShowRevealScreen(true)
      
      // Hide reveal screen after 3 seconds and show round result
      const timer = setTimeout(() => {
        console.log('🎯 Hiding reveal screen, showing round result')
        setShowRevealScreen(false)
        setShowRoundResult(true)
      }, 3000)
      
      return () => clearTimeout(timer)
    } else {
      setShowRevealScreen(false)
    }
  }, [gameState.gameStatus, gameState.player1?.currentMove, gameState.player2?.currentMove, gameState.player1?.wins, gameState.player2?.wins])

  // Play sound effects for game timer countdown
  useEffect(() => {
    if (gameState.gameStatus === "playing" && gameState.countdown !== undefined) {
      const currentCountdown = gameState.countdown
      
      // Only play sound when countdown changes (not on initial render)
      if (prevCountdown !== null && prevCountdown !== currentCountdown) {
        if (currentCountdown <= 3 && currentCountdown > 0) {
          // Play warning sound when time is running low
          playTimerWarningSound()
        } else if (currentCountdown > 3 && currentCountdown <= 10) {
          // Play tick sound for remaining seconds
          playTimerTickSound()
        }
      }
      
      setPrevCountdown(currentCountdown)
    } else {
      setPrevCountdown(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.countdown, gameState.gameStatus])

  // Round results - no sounds for individual rounds, only for final game result

  // Add effect to trigger confetti when player wins the game or show defeat animation
  useEffect(() => {
    if (gameState.gameStatus === "game-over" && gameState.winner && publicKey) {
      const currentUserId = publicKey.toString().slice(0, 8)
      const isCurrentUserWinner = gameState.winner === currentUserId
      
      if (isCurrentUserWinner) {
        console.log('🎉 Player won the game! Triggering victory confetti!')
        // Play victory sound immediately
        playVictorySound()
        // Small delay to let the game over UI render first
        setTimeout(() => {
          triggerVictoryConfetti()
        }, 500)
      } else {
        console.log('😢 Player lost the game! Showing sad emoji animation!')
        // Play defeat sound immediately
        playDefeatSound()
        setTimeout(() => {
          triggerDefeatAnimation()
        }, 500)
      }
    }
  }, [gameState.gameStatus, gameState.winner, publicKey])


  const [gameLink, setGameLink] = useState("")
  const [gameIdInput, setGameIdInput] = useState("")

  const disconnectWallet = () => {
    logout()
    setWalletBalance(0)
    setIsDisconnectModalOpen(false)
  }

  // Real game state from WebSocket integration
  // Gamestate now comes from useGame hook above

  // Countdown timer is now handled by the backend WebSocket events

  // Fetch wallet balance when connected
  useEffect(() => {
    const fetchBalance = async () => {
      console.log('🔍 Checking wallet state:')
      console.log('   - connected:', connected)
      console.log('   - publicKey:', publicKey?.toString())
      
      if (connected && publicKey) {
        try {
          console.log('📡 Fetching balance from devnet...')
          const balance = await connection.getBalance(publicKey)
          const solBalance = balance / LAMPORTS_PER_SOL
          setWalletBalance(solBalance)
          console.log('💰 Fetched real devnet balance:', solBalance, 'SOL')
          console.log('   - Raw balance (lamports):', balance)
        } catch (error) {
          // Graceful network error handling
          const errMsg = (error && (error as any).message) ? (error as any).message : String(error);
          if (error instanceof TypeError && errMsg.includes('NetworkError')) {
            console.warn('⚠️ Network unavailable: could not fetch wallet balance. Showing 0 SOL.')
          } else {
            console.warn('⚠️ Failed to fetch wallet balance:', errMsg)
          }
          setWalletBalance(0)
        }
      } else {
        console.log('❌ Not connected or no publicKey, setting balance to 0')
        setWalletBalance(0)
    }
    }
    fetchBalance()
  }, [connected, publicKey?.toString(), connection]) // Fixed dependencies - use stable publicKey string

  // Function to refresh balance manually
  const refreshBalance = async () => {
    if (connected && publicKey) {
      try {
        console.log('🔄 Manually refreshing balance...')
        const balance = await connection.getBalance(publicKey)
        const solBalance = balance / LAMPORTS_PER_SOL
        setWalletBalance(solBalance)
        console.log('💰 Refreshed balance:', solBalance, 'SOL')
      } catch (error) {
        console.error('❌ Failed to refresh balance:', error)
      }
    }
  }

  // Track successful wallet connections for auto-connect feature
  useEffect(() => {
    if (connected && publicKey) {
      // Mark that user has connected before for future auto-connect
      localStorage.setItem('wallet_has_connected_before', 'true')
      console.log('✅ Wallet connected successfully, enabled auto-connect for future visits')
      
      // Refresh profile when wallet connects to ensure latest data
      refreshProfile()
    } else if (!connected) {
      // Clear any updating state when wallet disconnects
      console.log('🔌 Wallet disconnected, clearing profile state')
    }
  }, [connected, publicKey?.toString()]) // Fixed dependencies - use stable publicKey string

  // Refresh profile when WebSocket reconnects (in case we missed updates)
  // Only refresh once when reconnecting, not on every render
  const [hasReconnected, setHasReconnected] = useState(false)
  useEffect(() => {
    if (isConnected && connected && publicKey && !hasReconnected) {
      console.log('🔌 WebSocket reconnected, refreshing profile to sync latest data')
      refreshProfile()
      setHasReconnected(true)
    } else if (!isConnected) {
      setHasReconnected(false)
    }
  }, [isConnected, connected, publicKey?.toString()]) // Fixed dependencies - use stable publicKey string

  // Auto-join game from URL redirect - ONLY when not creating new games
  useEffect(() => {
    // Simple check, only skip if creating a new game
    if (isCreatingGame) {
      console.log('🚫 Skipping auto-join check - creating new game')
      return
    }

    const checkAutoJoin = () => {
      const autoJoinGameId = sessionStorage.getItem('autoJoinGameId')
      const skipConfirmation = sessionStorage.getItem('autoJoinSkipConfirmation')
      
      if (autoJoinGameId) {
        console.log('🔗 Found auto-join game from URL:', autoJoinGameId)
        console.log('   - Skip confirmation:', skipConfirmation === 'true')
        
        // Clear the session storage flags
        sessionStorage.removeItem('autoJoinGameId')
        sessionStorage.removeItem('autoJoinSkipConfirmation')
        
        // Set the game ID input
        setGameIdInput(autoJoinGameId)
        
        if (skipConfirmation === 'true') {
          console.log('   - Will auto-join when wallet connects (skip confirmation)')
        } else {
          console.log('   - Will show join dialog when wallet connects')
        }
      }
    }

    // Check on mount and when connection status changes
    checkAutoJoin()
  }, [connected, isConnected, isCreatingGame])

  // Auto-join game when wallet and game socket connect (for URL redirects)
  useEffect(() => {
    // Simple check, only skip if creating a new game
    if (isCreatingGame) {
      console.log('🚫 Skipping auto-join on connect - creating new game')
      return
    }

    if (connected && isConnected && gameIdInput && !isInGame && !joinDialogOpen && currentView === "lobby") {
      const skipConfirmation = sessionStorage.getItem('autoJoinSkipConfirmation')
      
      if (skipConfirmation === 'true') {
        console.log('🔗 Wallet and game connected, auto-joining game:', gameIdInput)
        // Auto-join directly without confirmation for shared links
        sessionStorage.removeItem('autoJoinSkipConfirmation') // Clean up
      joinGame(gameIdInput)
        setGameIdInput('') // Clear the input
      } else {
        console.log('🔗 Wallet and game connected, showing join dialog for:', gameIdInput)
        // Show the confirmation dialog for manual joins
        setPendingJoinGameId(gameIdInput)
        setJoinDialogOpen(true)
      }
    }
  }, [connected, isConnected, gameIdInput, isInGame, joinDialogOpen, currentView, joinGame, isCreatingGame])

  // Clear session if user manually navigates to lobby or other views
  useEffect(() => {
    if (currentView === "lobby" || currentView === "leaderboard" || currentView === "referrals") {
      const savedSession = localStorage.getItem('rps_game_session')
      if (savedSession && !isRestoringSession) {
        console.log('🗑️ User navigated away from game, clearing session')
        localStorage.removeItem('rps_game_session')
      }
      

    }
  }, [currentView, isRestoringSession])

  // Immediately clear session if user is starting fresh (e.g., from URL)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const freshStart = urlParams.get('fresh') === 'true' || window.location.pathname === '/'
    
    // Also check if this is a direct navigation to root (no referrer indicates fresh browser load)
    const isDirectNavigation = !document.referrer || document.referrer.indexOf(window.location.hostname) === -1
    
    if ((freshStart || isDirectNavigation) && localStorage.getItem('rps_game_session')) {
      console.log('🗑️ Clearing existing session for fresh start or direct navigation')
      localStorage.removeItem('rps_game_session')
      sessionStorage.removeItem('autoJoinGameId')
      sessionStorage.removeItem('autoJoinSkipConfirmation')
      
      // Reset any restoration state immediately
      setIsRestoringSession(false)
      setIgnoreSocketEvents(false)
    }
  }, [])

  // Session persistence - save game state to localStorage (only for active games)
  useEffect(() => {
    if (gameState.gameId && 
        currentView === "game" && 
        (gameState.gameStatus === "playing" || 
         gameState.gameStatus === "waiting" || 
         gameState.gameStatus === "round-result")) {
      const sessionData = {
        gameState,
        currentView,
        gameLink,
        timestamp: Date.now()
      }
      localStorage.setItem('rps_game_session', JSON.stringify(sessionData))
      console.log('💾 Saved active game session to localStorage')
    } else if (gameState.gameStatus === "game-over" || gameState.gameStatus === "lobby") {
      // Clear session when game ends or we're in lobby
      localStorage.removeItem('rps_game_session')
      console.log('🗑️ Cleared game session - game ended or in lobby')
    }
  }, [gameState, currentView, gameLink])

  // Session persistence - check for saved session immediately on mount
  useEffect(() => {
    const checkSavedSession = () => {
      try {
        // Simple check, only skip if creating a new game
        if (isCreatingGame) {
          console.log('🚫 Skipping session restoration - creating new game')
          return null
        }

        // Also check for URL parameters that indicate fresh start
        const urlParams = new URLSearchParams(window.location.search)
        const freshStart = urlParams.get('fresh') === 'true' || window.location.pathname === '/'
        
        if (freshStart) {
          console.log('🗑️ Fresh start detected, clearing any existing session')
          localStorage.removeItem('rps_game_session')
          return null
        }

        const savedSession = localStorage.getItem('rps_game_session')
        if (savedSession) {
          const sessionData = JSON.parse(savedSession)
          
          // Check if session is not too old (24 hours)
          const sessionAge = Date.now() - sessionData.timestamp
          const maxAge = 24 * 60 * 60 * 1000 // 24 hours
          
          if (sessionAge < maxAge && sessionData.gameState.gameId) {
            console.log('🔄 Found saved game session, checking if game is still active...')
            console.log('   - Game ID:', sessionData.gameState.gameId)
            console.log('   - Saved View:', sessionData.currentView)
            console.log('   - Session Age:', Math.round(sessionAge / 1000 / 60), 'minutes')
            
            // Only restore if we have a valid game ID and the game was actually active
            if (sessionData.gameState.gameId && 
                sessionData.currentView === "game" && 
                (sessionData.gameState.gameStatus === "playing" || 
                 sessionData.gameState.gameStatus === "waiting" ||
                 sessionData.gameState.gameStatus === "round-result")) {
              
              console.log('🔄 Session appears valid, will attempt to restore...')
            setIsRestoringSession(true)
            
            // Restore basic state immediately
            setGameLink(sessionData.gameLink || '')
            
            return sessionData.gameState.gameId
          } else {
              console.log('🗑️ Session invalid - game was not in active state')
              localStorage.removeItem('rps_game_session')
            }
          } else {
            console.log('🗑️ Clearing old or invalid session data')
            localStorage.removeItem('rps_game_session')
          }
        }
      } catch (error) {
        console.error('❌ Error checking saved session:', error)
        localStorage.removeItem('rps_game_session')
      }
      return null
    }

    checkSavedSession()
  }, [isCreatingGame])

  // Handle referral code from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const refCode = urlParams.get('ref')
    
    if (refCode && connected && profile) {
      console.log('🔗 Referral code found in URL:', refCode)
      
      // Only show referral input if user hasn't been referred yet
      if (!profile.referred_by) {
        console.log('✅ User not yet referred, showing referral dialog')
        setReferralCodeFromUrl(refCode)
        setShowReferralInput(true)
      } else {
        console.log('⚠️ User already has a referrer:', profile.referred_by)
      }
      
      // Clean URL without refreshing
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('ref')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [connected, profile])

  // Auto-rejoin game when wallet and socket connect and we have a saved session
  useEffect(() => {
    const attemptRejoin = async () => {
      try {
        // Simple check, only skip if creating a new game
        if (isCreatingGame) {
          console.log('🚫 Skipping auto-rejoin - creating new game')
          setIsRestoringSession(false)
          return
        }

        // Skip if user has clicked any game creation/joining buttons recently
        const urlParams = new URLSearchParams(window.location.search)
        const isFreshPageLoad = !urlParams.get('restored') && window.location.pathname === '/'
        
        if (isFreshPageLoad && !isRestoringSession) {
          console.log('🏠 Fresh page load detected, skipping auto-rejoin to let user choose')
          return
        }

        const savedSession = localStorage.getItem('rps_game_session')
        if (savedSession && connected && isConnected && !isInGame && isRestoringSession) {
          const sessionData = JSON.parse(savedSession)
          
          if (sessionData.gameState.gameId) {
            console.log('🔗 Attempting to rejoin saved game:', sessionData.gameState.gameId)
            
            // First, validate the game still exists on the server
            try {
              const response = await fetch(`https://last-backend-7d8f5fbc0943.herokuapp.com/api/games/${sessionData.gameState.gameId}`)
              const data = await response.json()
              
              if (data.success && data.game) {
                console.log('✅ Game still exists on server, rejoining...')
                // For session restoration, we can auto-join since user was already in the game
            await joinGame(sessionData.gameState.gameId)
                setCurrentView("game")
              } else {
                console.log('❌ Game no longer exists on server')
                localStorage.removeItem('rps_game_session')
                setCurrentView("lobby")
              }
            } catch (error) {
              console.error('❌ Error validating game on server:', error)
              localStorage.removeItem('rps_game_session')
              setCurrentView("lobby")
            }
            
            setIsRestoringSession(false)
          }
        }
      } catch (error) {
        console.error('❌ Error rejoining game:', error)
        setIsRestoringSession(false)
        localStorage.removeItem('rps_game_session')
        setCurrentView("lobby")
      }
    }

    // Set a timeout to stop restoring if it takes too long
    const timeout = setTimeout(() => {
      if (isRestoringSession) {
        console.log('⏰ Session restoration timeout, going to lobby...')
        setIsRestoringSession(false)
        setCurrentView("lobby")
        localStorage.removeItem('rps_game_session')
      }
    }, 10000) // 10 seconds timeout

    attemptRejoin()

    return () => clearTimeout(timeout)
  }, [connected, isConnected, isInGame, isRestoringSession, joinGame, isCreatingGame])

  const handleFloatingWalletClick = () => {
    // Floating wallet icons are now decorative only
    // Actual connection happens through the StyledWalletButton
  }



  const handleCreateGame = () => {
    console.log('🎮 CREATE GAME CLICKED')
    console.log('   - Socket connected:', isConnected)
    console.log('   - Wallet connected:', connected)
    console.log('   - Current view:', currentView)
    console.log('   - Is creating game:', isCreatingGame)
    
    // Basic validation
    if (!connected || !publicKey) {
      setGameError('Please connect your wallet first')
      return
    }
    
    if (!isConnected) {
      setGameError('Not connected to game server. Please wait and try again.')
      return
    }
    
    if (selectedCurrency === "points" && !hasEnoughPoints(100)) {
        setGameError('Insufficient points. You need 100 points to play.')
      return
  }
    
    if (selectedCurrency === "sol") {
    const stake = Number.parseFloat(stakeAmount)
      if (isNaN(stake) || stake < 0) {
      setGameError('Please enter a valid stake amount')
      return
      }
    }
    
    console.log('✅ All validation passed')
    
    // Clear errors and set creating state
    setGameError(null)
    setIsCreatingGame(true)
    
    // Create the game
    const stake = selectedCurrency === "points" ? 100 : Number.parseFloat(stakeAmount)
    console.log('🎮 Calling createGame with:', { 
      stake, 
      stakeAmount: stakeAmount, 
      parsedStake: Number.parseFloat(stakeAmount),
      type: creatingGameType, 
      currency: selectedCurrency 
    })
    
    createGame(stake, creatingGameType, selectedCurrency)
  }

  const joinGameById = () => {
    console.log('🎯 Joining game by ID:', gameIdInput)
    
    if (!gameIdInput.trim()) {
      setGameError('Please enter a game ID')
      return
    }
    
    // Clear error and show join dialog for confirmation
    setGameError(null)
    setPendingJoinGameId(gameIdInput.trim())
    setJoinDialogOpen(true)
    setJoinDialogOpenTime(Date.now()) // Track when dialog was opened
  }

  const joinRandomGame = async () => {
    console.log('🎯 Starting random match')
    
    // Validate FIRST
    if (!connected || !publicKey) {
      setGameError('Please connect your wallet first')
      return
    }

    if (selectedCurrency === "points" && !hasEnoughPoints(100)) {
        setGameError('Insufficient points. You need 100 points to play.')
        return
      }

    const stake = selectedCurrency === "points" ? 100 : Number.parseFloat(stakeAmount)
    if (selectedCurrency === "sol" && (isNaN(stake) || stake <= 0)) {
      setGameError('Please select a valid stake amount')
      return
    }

    // Validate SOL stake amounts for random games
    if (selectedCurrency === "sol") {
      const validStakes = [0.01, 0.05, 0.1]
      if (!validStakes.includes(stake)) {
        setGameError('Please select 0.01, 0.05, or 0.1 SOL for random games')
        return
      }
    }
    
    // Clear storage and reset states
    localStorage.removeItem('rps_game_session')
    sessionStorage.removeItem('autoJoinGameId')
    sessionStorage.removeItem('autoJoinSkipConfirmation')
    setGameError(null)
    
    // Clear any existing timeout
    if (matchmakingTimeout) {
      clearTimeout(matchmakingTimeout)
      setMatchmakingTimeout(null)
    }
    
    // Reset states for clean matchmaking
    setOpponentFound(false)
    setShowQuitDialog(false)
    setJoinDialogOpen(false)
    setPendingJoinGameId(null)
    setJoinGameLoading(false)
    setGameIdInput('')
    setGameLink('')
    setIgnoreSocketEvents(false)
    setIsRestoringSession(false)

    console.log('🎯 Starting random matchmaking with stake:', stake, 'currency:', selectedCurrency)
    
    // For random matchmaking, backend will create the game and provide gameId
    // Both players will then create on-chain escrow after match is found
    // (This happens in use-game.ts when match_found event is received)
    
    // Start matchmaking
    joinGame(undefined, selectedCurrency, stake)
    
    // Switch to game view to show waiting state
    setCurrentView("game")
    
    // Set timeout for matchmaking
    const timeout = setTimeout(() => {
      if (currentView === "game" && gameState.gameStatus === "waiting") {
        console.log('🕒 Matchmaking timeout')
        setGameError('Matchmaking timeout. Please try again.')
        resetGame()
      }
    }, 30000)
    setMatchmakingTimeout(timeout)
  }

  const { submitMove, leaveGame: simpleLeaveGame } = useSimpleMove()

  // NOTE: Manual finalization removed - SOL games now use automatic distribution
  // Winner receives proper winnings automatically when game completes (modern standard)

  const handleMakeMove = (move: string) => {
    console.log('🎯 Move button clicked:', move)
    console.log('🔍 Debug info:')
    console.log('   - gameState.gameId:', gameState.gameId)
    console.log('   - gameState.gameStatus:', gameState.gameStatus)
    console.log('   - isConnected:', isConnected)
    console.log('   - connected (wallet):', connected)
    console.log('   - publicKey:', publicKey?.toString())
    console.log('   - player1.currentMove:', gameState.player1?.currentMove)
    console.log('   - isInGame:', isInGame)
    
    // Use only the main game socket (now reliable)
    makeMove(move as 'rock' | 'paper' | 'scissors')
    
    // Also use simple move as fallback safety net
    if (gameState.gameId && publicKey) {
      const playerId = publicKey.toString().slice(0, 8)
      console.log('🔥 Using simple move fallback as safety net')
      submitMove(gameState.gameId, playerId, move)
    }
  }

  const handleQuitGame = async () => {
    console.log('🚪 Player quitting game with confirmation')
    setShowQuitDialog(false) // Close dialog
    
    if (!gameState.gameId || !publicKey) {
      console.error('Cannot quit: missing game ID or wallet')
      resetGame()
      return
    }

    const playerId = publicKey.toString().slice(0, 8)
    
    try {
      // For SOL games that haven't started yet (waiting), refund SOL
      if (gameState.currency === 'sol' && gameState.gameStatus === 'waiting') {
        console.log('💰 Refunding SOL for cancelled game...')
        try {
          await anchorCancelGame(gameState.gameId)
          console.log('✅ SOL refunded successfully')
        } catch (cancelError) {
          console.error('⚠️ Failed to refund SOL:', cancelError)
          // Continue with quit even if refund fails
        }
      }
      
      // Use the reliable fresh socket method FIRST
      console.log('🚪 Using fresh socket to leave game (primary)')
      simpleLeaveGame(gameState.gameId, playerId)
      
      console.log('✅ Successfully quit game')
      
      // For points games, the backend will handle the database updates automatically
      // when processing the quit/abandonment. We just need to refresh after a delay.
      if (gameState.currency === 'points' && profile) {
        setTimeout(() => {
          console.log('🔄 Refreshing profile after quit processing...')
          refreshProfile()
          refreshLeaderboard()
        }, 1500) // Give backend time to process the quit
      }
      
      // Use resetGame for proper cleanup
      resetGame()
    } catch (error) {
      console.error('⚠️ Error quitting game:', error)
      // Still reset even if server communication failed
      resetGame()
    }
  }

  const determineWinner = (move1: string, move2: string) => {
    if (move1 === move2) return "draw"
    if (
      (move1 === "rock" && move2 === "scissors") ||
      (move1 === "paper" && move2 === "rock") ||
      (move1 === "scissors" && move2 === "paper")
    ) {
      return "player1"
    }
    return "player2"
  }

  const copyGameLink = () => {
    navigator.clipboard.writeText(gameLink)
  }

  const getConnectedWalletName = () => {
    return wallet?.adapter.name || "Wallet"
  }

  // Handle join game confirmation
  const handleJoinGameConfirm = async () => {
    if (!pendingJoinGameId) return
    
    // Extract gameId from URL if a full URL was pasted
    let gameId = pendingJoinGameId
    if (gameId.includes('/game/')) {
      gameId = gameId.split('/game/').pop() || gameId
    }
    
    setJoinGameLoading(true)
    try {
      console.log('🎯 Confirmed joining game:', gameId)
      await joinGame(gameId)
      // Note: Don't close dialog here - let onGameJoined callback handle it
      console.log('🎯 Join game request sent, waiting for response...')
    } catch (error) {
      console.error('❌ Error joining game:', error)
      setGameError('Failed to join game. Please try again.')
      setJoinGameLoading(false)
    }
    // Don't set loading to false here - let the game joined callback handle cleanup
  }

  // Handle join game dialog close
  const handleJoinGameClose = () => {
    console.log('🚪 handleJoinGameClose called - clearing all game join state')
    console.log('🔍 Debug info:', {
      pendingJoinGameId,
      socketConnected: socket?.connected,
      joinDialogOpenTime,
      dialogOpenDuration: joinDialogOpenTime ? Date.now() - joinDialogOpenTime : null
    })
    
    // If user closes dialog without joining, notify the game creator (for private games) that invitation was declined
    if (pendingJoinGameId && socket && socket.connected) {
      console.log('📤 Notifying game creator that player declined invitation:', pendingJoinGameId)
      try {
        socket.emit('player_declined_invitation', { 
          gameId: pendingJoinGameId 
        })
        console.log('✅ Decline notification sent successfully')
      } catch (error) {
        console.error('❌ Failed to send decline notification:', error)
      }
    } else {
      console.log('⚠️ Cannot send decline notification:', {
        hasPendingGameId: !!pendingJoinGameId,
        hasSocket: !!socket,
        isConnected: socket?.connected
      })
    }
    
    setJoinDialogOpen(false)
    setPendingJoinGameId(null)
    setJoinGameLoading(false)
    setJoinDialogOpenTime(null)
    setGameIdInput('') // Clear game ID to prevent auto-join from triggering again
  }

  const handleExportPrivateKey = async () => {
    if (!publicKey) return
    
    try {
      // For Privy embedded wallets, we can't export the actual private key
      // Instead, we'll show a message explaining this limitation
      alert('Private key export is not available for Privy embedded wallets. For security reasons, embedded wallets do not expose private keys directly.')
    } catch (error) {
      console.error('Error exporting private key:', error)
      alert('Failed to export private key')
    }
  }

  // Get game data for join dialog
  const getJoinGameData = async () => {
    if (!pendingJoinGameId) return null
    
    // Extract gameId from URL if a full URL was pasted
    let gameId = pendingJoinGameId
    if (gameId.includes('/game/')) {
      gameId = gameId.split('/game/').pop() || gameId
    }
    
    try {
      const response = await fetch(`https://last-backend-7d8f5fbc0943.herokuapp.com/api/games/${gameId}`)
      const data = await response.json()
      
      if (data.success && data.game) {
        return {
          gameId: data.game.gameId,
          currency: data.game.currency,
          stakeAmount: data.game.stakeAmount,
          totalPot: data.game.totalPot,
          gameType: data.game.gameType
        }
      }
    } catch (error) {
      console.error('Error fetching game data for dialog:', error)
    }
    
    return null
  }

  // Get join game data for dialog
  const [joinGameData, setJoinGameData] = useState<any>(null)
  
  useEffect(() => {
    if (joinDialogOpen && pendingJoinGameId) {
      getJoinGameData().then(setJoinGameData)
    } else {
      setJoinGameData(null)
    }
  }, [joinDialogOpen, pendingJoinGameId])

  const resetGame = () => {
    console.log('🔄 RESET GAME - Back to lobby')
    
    // 1. Clear timeouts
    if (matchmakingTimeout) {
      clearTimeout(matchmakingTimeout)
      setMatchmakingTimeout(null)
    }
    
    // 2. First leave the game (if in one) to clean up server state
    if (gameState.gameId) {
      leaveGame()
    }
    
    // 3. Disconnect and reconnect socket to clear all server state
    socket.disconnect()
    
    // 4. Use a short timeout to ensure disconnect completes before reconnect
    setTimeout(() => {
      socket.connect()
      
      // 5. Clear storage
      localStorage.removeItem('rps_game_session')
      sessionStorage.removeItem('autoJoinGameId')
      sessionStorage.removeItem('autoJoinSkipConfirmation')
      
      // 6. Reset game state (this clears gameId)
      resetGameState()
      
      // 7. Reset ALL UI state
      setCurrentView("lobby")
      setGameError(null)
      setIsRestoringSession(false)
      setIsCreatingGame(false)
      setCreatingGameType('private')
      setGameLink("")
      setGameIdInput("")
      setJoinDialogOpen(false)
      setPendingJoinGameId(null)
      setJoinGameLoading(false)
      setJoinGameData(null)
      setRandomGameStakeSelected(false)
      setOpponentFound(false)
      setShowQuitDialog(false)
      setIgnoreSocketEvents(false)
      
      console.log('✅ RESET COMPLETE - Ready for new game')
    }, 300)
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-400" />
    return <Star className="w-5 h-5 text-purple-400" />
  }

  // Share on X helper functions
  const shareLeaderboardAchievement = () => {
    if (!userRank || !connected) return
    
    const rank = userRank.rank
    const wins = userRank.wins
    const points = userRank.total_points_earned
    const winRate = userRank.win_rate_percentage
    
    const getText = () => {
      if (rank === 1) {
        return `🏆 I'm #1 on the RPS MagicBlock leaderboard! ${wins} wins, ${points} points earned with ${winRate}% win rate! 🎯`
      } else if (rank <= 3) {
        return `🥉 Ranked #${rank} on the RPS MagicBlock leaderboard! ${wins} wins, ${points} points earned with ${winRate}% win rate! 🎮`
      } else if (rank <= 10) {
        return `⭐ Top 10 player on RPS MagicBlock! Ranked #${rank} with ${wins} wins and ${winRate}% win rate! 🚀`
      } else {
        return `🎯 Climbing the RPS MagicBlock leaderboard! Ranked #${rank} with ${wins} wins and ${winRate}% win rate! 🎮`
      }
    }
    
    const shareText = getText() + "\n\nPlay Rock Paper Scissors on Solana blockchain! ⚡\n\n#RPS #Solana #Web3Gaming #MagicBlock"
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    window.open(shareUrl, '_blank')
  }

  const shareGameResult = (isVictory: boolean) => {
    if (!connected || !profile) return
    
    const currency = gameState.currency || selectedCurrency
    const stake = gameState.stakeAmount || stakeAmount
    
    const getText = () => {
      if (isVictory) {
        if (currency === 'points') {
          return `🎉 Victory! Just won an RPS game and earned 100 points! 💪\n\nTotal wins: ${profile.wins + 1} | Win rate: ${Math.round(((profile.wins + 1) / (profile.total_games + 1)) * 100)}% 🔥`
                 } else {
           const winnings = (parseFloat(String(stake)) * 2 * (1 - getPlatformFeeRate(stake))).toFixed(3)
           return `🎉 Victory! Just won ${winnings} SOL in RPS MagicBlock! 💰\n\nTotal wins: ${profile.wins + 1} | Win rate: ${Math.round(((profile.wins + 1) / (profile.total_games + 1)) * 100)}% 🔥`
         }
      } else {
        if (currency === 'points') {
          return `😤 Lost this round but I'm not giving up! 100 points down but still fighting! 💪\n\nCurrent stats: ${profile.wins} wins | ${profile.total_games + 1} games played 🎮`
        } else {
          return `😤 Lost ${stake} SOL this round but the comeback starts now! 💪\n\nCurrent stats: ${profile.wins} wins | ${profile.total_games + 1} games played 🎮`
        }
      }
    }
    
    const shareText = getText() + "\n\nJoin me on RPS MagicBlock - Rock Paper Scissors on Solana! ⚡\n\n#RPS #Solana #Web3Gaming #MagicBlock"
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    window.open(shareUrl, '_blank')
  }

  // Show loading screen while restoring session
  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-purple-400 mb-2">Restoring Game Session...</h2>
          <p className="text-gray-400 mb-6">Please wait while we reconnect you to your game</p>
          
          {/* Emergency escape button */}
          <Button
            onClick={() => {
              console.log('🚨 Emergency session clear requested by user')
              setIsRestoringSession(false)
              resetGame()
            }}
            variant="outline"
            className="border-red-500/50 text-red-300 hover:bg-red-500/10 hover:border-red-400 bg-transparent"
          >
            Cancel & Go to Lobby
          </Button>
        </div>
      </div>
    )
  }

  if (currentView === "leaderboard") {
    return (
      <div
        className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative flex flex-col"
        style={{
          overscrollBehavior: "none",
          overscrollBehaviorY: "none",
          touchAction: "pan-y",
          overflow: "hidden",
        }}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10" />
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Header */}
        <header className="relative z-30 backdrop-blur-xl bg-gray-900/20 border-b border-gray-700/40 p-2 sm:p-4 flex-shrink-0">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="w-16 sm:w-32"></div>

            <div className="flex items-center gap-2 sm:gap-6">
            <Button
              onClick={() => {
                console.log('🏠 Leaderboard back to lobby clicked')
                resetGame()
              }}
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200 rounded-lg px-2 sm:px-4 py-2 text-sm sm:text-base"
            >
              <span className="hidden sm:inline">← Back to Lobby</span>
              <span className="sm:hidden">←</span>
            </Button>

            <div className="text-center">
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Leaderboard
              </h1>
            </div>

            <Button
              onClick={refreshLeaderboard}
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200 rounded-lg px-2 sm:px-4 py-2 text-sm sm:text-base"
              disabled={leaderboardLoading}
            >
              {leaderboardLoading ? 'Loading...' : 'Refresh'}
            </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 relative z-20 overflow-y-auto" style={{ overscrollBehavior: "none" }}>
          <div className="p-2 sm:p-6 max-w-4xl mx-auto">
            {/* Tabs for Leaderboard and Referrals */}
            <Tabs defaultValue="leaderboard" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 bg-gray-800/50">
                <TabsTrigger value="leaderboard" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </TabsTrigger>
                <TabsTrigger value="winnings" className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  <Coins className="h-4 w-4" />
                  Winnings
                </TabsTrigger>
                <TabsTrigger value="referrals" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                  <Gift className="h-4 w-4" />
                  Referrals
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="leaderboard" className="space-y-4 pb-8">
              {/* Loading State */}
              {leaderboardLoading && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading leaderboard...</p>
                </div>
              )}

              {/* Error State */}
              {leaderboardError && (
                <div className="text-center py-8">
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-red-200">Failed to load leaderboard</p>
                    <Button 
                      onClick={refreshLeaderboard}
                      className="mt-2 bg-red-600 hover:bg-red-700"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              {/* Top 3 Podium - Desktop */}
              {!leaderboardLoading && !leaderboardError && leaderboard.length > 0 && (
              <div className="hidden sm:flex items-end justify-center gap-6 mb-6 relative min-h-[400px]">
                {/* Second Place (Left) */}
                {leaderboard[1] && (
                  <div className="flex flex-col items-center justify-end">
                    <Card className="bg-gray-900/80 backdrop-blur-xl shadow-xl transition-all duration-300 hover:scale-105 border-gray-500/50 w-60 mb-4">
                      <CardContent className="p-4 text-center">
                        <div className="space-y-3">
                          <div className="flex items-center justify-center">{getRankIcon(leaderboard[1].rank)}</div>
                          <div>
                            <h3 className="text-lg font-bold text-white">
                              {leaderboard[1].wallet_address.slice(0, 6)}...{leaderboard[1].wallet_address.slice(-4)}
                            </h3>
                            <div className="text-sm text-gray-400">Rank #{leaderboard[1].rank}</div>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Wins:</span>
                              <span className="text-white font-bold">{leaderboard[1].wins}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Points:</span>
                              <span className="text-green-400 font-bold">{leaderboard[1].total_points_earned}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Win Rate:</span>
                              <span className="text-purple-400 font-bold">{leaderboard[1].win_rate_percentage}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    {/* Podium Base */}
                    <div className="w-60 h-16 bg-gradient-to-t from-gray-600 to-gray-500 rounded-t-lg shadow-lg flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">2</span>
                    </div>
                  </div>
                )}

                {/* First Place (Center, Higher) */}
                {leaderboard[0] && (
                  <div className="flex flex-col items-center justify-end">
                    <Card className="bg-gray-900/80 backdrop-blur-xl shadow-xl transition-all duration-300 hover:scale-105 border-yellow-500/50 w-64 mb-4">
                      <CardContent className="p-5 text-center">
                        <div className="space-y-3">
                          <div className="flex items-center justify-center">{getRankIcon(leaderboard[0].rank)}</div>
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {leaderboard[0].wallet_address.slice(0, 6)}...{leaderboard[0].wallet_address.slice(-4)}
                            </h3>
                            <div className="text-sm text-gray-400">Rank #{leaderboard[0].rank}</div>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Wins:</span>
                              <span className="text-white font-bold">{leaderboard[0].wins}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Points:</span>
                              <span className="text-green-400 font-bold">{leaderboard[0].total_points_earned}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Win Rate:</span>
                              <span className="text-purple-400 font-bold">{leaderboard[0].win_rate_percentage}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    {/* Podium Base - Higher */}
                    <div className="w-64 h-24 bg-gradient-to-t from-yellow-600 to-yellow-500 rounded-t-lg shadow-lg flex items-center justify-center">
                      <span className="text-white font-bold text-3xl">1</span>
                    </div>
                  </div>
                )}

                {/* Third Place (Right) */}
                {leaderboard[2] && (
                  <div className="flex flex-col items-center justify-end">
                    <Card className="bg-gray-900/80 backdrop-blur-xl shadow-xl transition-all duration-300 hover:scale-105 border-orange-500/50 w-60 mb-4">
                      <CardContent className="p-4 text-center">
                        <div className="space-y-3">
                          <div className="flex items-center justify-center">{getRankIcon(leaderboard[2].rank)}</div>
                          <div>
                            <h3 className="text-lg font-bold text-white">
                              {leaderboard[2].wallet_address.slice(0, 6)}...{leaderboard[2].wallet_address.slice(-4)}
                            </h3>
                            <div className="text-sm text-gray-400">Rank #{leaderboard[2].rank}</div>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Wins:</span>
                              <span className="text-white font-bold">{leaderboard[2].wins}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Points:</span>
                              <span className="text-green-400 font-bold">{leaderboard[2].total_points_earned}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Win Rate:</span>
                              <span className="text-purple-400 font-bold">{leaderboard[2].win_rate_percentage}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    {/* Podium Base */}
                    <div className="w-60 h-12 bg-gradient-to-t from-orange-600 to-orange-500 rounded-t-lg shadow-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xl">3</span>
                    </div>
                </div>
              )}
            </div>
          )}

              {/* Top 3 in List Style - Mobile */}
              {!leaderboardLoading && !leaderboardError && leaderboard.length > 0 && (
              <Card className="sm:hidden bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 shadow-xl mb-6">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* First Place */}
                    {leaderboard[0] && (
                      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/30 hover:bg-gray-800/70 transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-gray-700/50 rounded-full">
                            {getRankIcon(leaderboard[0].rank)}
                          </div>
                          <div>
                            <div className="font-bold text-white">
                              {leaderboard[0].wallet_address.slice(0, 6)}...{leaderboard[0].wallet_address.slice(-4)}
                            </div>
                            <div className="text-sm text-gray-400">Rank #{leaderboard[0].rank}</div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-8 text-sm">
                          <div className="text-center">
                            <div className="text-gray-400">Wins</div>
                            <div className="text-white font-bold">{leaderboard[0].wins}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400">Points</div>
                            <div className="text-green-400 font-bold">{leaderboard[0].total_points_earned}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400">Win Rate</div>
                            <div className="text-purple-400 font-bold">{leaderboard[0].win_rate_percentage}%</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Second Place */}
                    {leaderboard[1] && (
                      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/30 hover:bg-gray-800/70 transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-gray-700/50 rounded-full">
                            {getRankIcon(leaderboard[1].rank)}
                          </div>
                          <div>
                            <div className="font-bold text-white">
                              {leaderboard[1].wallet_address.slice(0, 6)}...{leaderboard[1].wallet_address.slice(-4)}
                            </div>
                            <div className="text-sm text-gray-400">Rank #{leaderboard[1].rank}</div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-8 text-sm">
                          <div className="text-center">
                            <div className="text-gray-400">Wins</div>
                            <div className="text-white font-bold">{leaderboard[1].wins}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400">Points</div>
                            <div className="text-green-400 font-bold">{leaderboard[1].total_points_earned}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400">Win Rate</div>
                            <div className="text-purple-400 font-bold">{leaderboard[1].win_rate_percentage}%</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Third Place */}
                    {leaderboard[2] && (
                      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/30 hover:bg-gray-800/70 transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-gray-700/50 rounded-full">
                            {getRankIcon(leaderboard[2].rank)}
                          </div>
                          <div>
                            <div className="font-bold text-white">
                              {leaderboard[2].wallet_address.slice(0, 6)}...{leaderboard[2].wallet_address.slice(-4)}
                            </div>
                            <div className="text-sm text-gray-400">Rank #{leaderboard[2].rank}</div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-8 text-sm">
                          <div className="text-center">
                            <div className="text-gray-400">Wins</div>
                            <div className="text-white font-bold">{leaderboard[2].wins}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400">Points</div>
                            <div className="text-green-400 font-bold">{leaderboard[2].total_points_earned}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400">Win Rate</div>
                            <div className="text-purple-400 font-bold">{leaderboard[2].win_rate_percentage}%</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              )}

              {/* User Rank Display - After Top 3 */}
              {connected && userRank && (
                <Card className="bg-gradient-to-r from-purple-900/80 via-pink-900/80 to-purple-900/80 backdrop-blur-xl border border-purple-500/50 shadow-xl mb-6">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full flex items-center justify-center">
                          {getRankIcon(userRank.rank)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm sm:text-base">Your Rank</div>
                          <div className="text-xs sm:text-sm text-purple-200">#{userRank.rank} on the leaderboard</div>
                        </div>
                      </div>
                      <div className="flex flex-row items-center gap-4 sm:gap-6 text-sm w-full sm:w-auto justify-between sm:justify-start">
                        <div className="text-center">
                          <div className="text-white text-xs sm:text-sm mb-1">Wins</div>
                          <div className="text-white font-bold text-sm sm:text-base">{userRank.wins}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white text-xs sm:text-sm mb-1">Points</div>
                          <div className="text-green-400 font-bold text-sm sm:text-base">{userRank.total_points_earned}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white text-xs sm:text-sm mb-1">Win Rate</div>
                          <div className="text-purple-400 font-bold text-sm sm:text-base">{userRank.win_rate_percentage}%</div>
                        </div>
                        <Button
                          onClick={shareLeaderboardAchievement}
                          size="sm"
                          variant="ghost"
                          className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-200 px-3 py-2 text-xs sm:text-sm ml-auto"
                        >
                          <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">Share on X</span>
                          <span className="sm:hidden">Share</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* MagicBlock Description - Desktop */}

              {/* Rest of Leaderboard */}
              {!leaderboardLoading && !leaderboardError && leaderboard.length > 3 && (
              <Card className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 shadow-xl">
                <CardContent className="p-6">
                  <div className="space-y-4">
                      {leaderboard.slice(3).map((player) => (
                      <div
                          key={player.wallet_address}
                        className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/30 hover:bg-gray-800/70 transition-all duration-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-gray-700/50 rounded-full">
                            {getRankIcon(player.rank)}
                          </div>
                          <div>
                              <div className="font-bold text-white">
                                {player.wallet_address.slice(0, 6)}...{player.wallet_address.slice(-4)}
                              </div>
                            <div className="text-sm text-gray-400">Rank #{player.rank}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 sm:gap-8 text-sm mt-4 sm:mt-0">
                          <div className="text-center">
                            <div className="text-gray-400">Wins</div>
                            <div className="text-white font-bold">{player.wins}</div>
                          </div>
                          <div className="text-center">
                              <div className="text-gray-400">Points</div>
                              <div className="text-green-400 font-bold">{player.total_points_earned}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400">Win Rate</div>
                              <div className="text-purple-400 font-bold">{player.win_rate_percentage}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Empty State */}
              {!leaderboardLoading && !leaderboardError && leaderboard.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 mb-2">No players on the leaderboard yet</p>
                  <p className="text-sm text-gray-500">Be the first to play and claim your spot!</p>
                </div>
              )}

              {/* Stats Summary */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 shadow-xl">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-purple-400 mb-2">
                      {statsLoading ? '...' : statsError ? '0' : (stats?.totalGames || 0).toLocaleString()}
                    </div>
                    <div className="text-gray-300">Total games</div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/80 backdrop-blur-xl border border-green-500/30 shadow-xl">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-green-400 mb-2">
                      {leaderboard.length.toLocaleString()}
                    </div>
                    <div className="text-gray-300">Registered players</div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/80 backdrop-blur-xl border border-blue-500/30 shadow-xl">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-blue-400 mb-2">
                      {statsLoading ? '...' : statsError ? '0' : (stats?.activeGames || 0)}
                    </div>
                    <div className="text-gray-300">Active games</div>
                  </CardContent>
                </Card>
              </div>
              </TabsContent>
              
              <TabsContent value="winnings" className="space-y-6 pb-8">
                <WinningsHistory />
              </TabsContent>
              
              <TabsContent value="referrals" className="space-y-6 pb-8">
                {connected ? (
                  <div className="grid gap-6">
                    <ReferralCard />
                    <ReferralHistory />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Gift className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-400 mb-2">Connect Wallet</p>
                    <p className="text-sm text-gray-500">To access the referral program</p>
                  </div>
                )}
              </TabsContent>

            </Tabs>
          </div>
        </main>
      </div>
    )
  }

  if (currentView === "referrals") {
    return (
      <div
        className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative flex flex-col"
        style={{
          overscrollBehavior: "none",
          overscrollBehaviorY: "none",
          touchAction: "pan-y",
          overflow: "hidden",
        }}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10" />
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Header */}
        <header className="relative z-30 backdrop-blur-xl bg-gray-900/20 border-b border-gray-700/40 p-2 sm:p-4 flex-shrink-0">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="w-16 sm:w-32"></div>

            <div className="flex items-center gap-2 sm:gap-6">
            <Button
              onClick={() => {
                console.log('🏠 Referrals back to lobby clicked')
                resetGame()
              }}
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200 rounded-lg px-2 sm:px-4 py-2 text-sm sm:text-base"
            >
              <span className="hidden sm:inline">← Back to Lobby</span>
              <span className="sm:hidden">←</span>
            </Button>

            <div className="text-center">
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
                <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
                Referrals
              </h1>
            </div>

            <Button
              onClick={referralHook.refreshStats}
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200 rounded-lg px-2 sm:px-4 py-2 text-sm sm:text-base"
              disabled={referralHook.loading}
            >
              {referralHook.loading ? 'Loading...' : 'Refresh'}
            </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 relative z-20 overflow-y-auto" style={{ overscrollBehavior: "none" }}>
          <div className="p-2 sm:p-6 max-w-4xl mx-auto">
            {connected ? (
              <div className="grid gap-6">
                <ReferralCard />
                <ReferralHistory />
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Gift className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                <p className="text-gray-400 mb-6">To access the referral program and start earning rewards</p>
                <StyledWalletButton />
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  if (currentView === "game") {
    return (
      <div
        className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative flex flex-col"
        style={{
          overscrollBehavior: "none",
          overscrollBehaviorY: "none",
          touchAction: "pan-y",
          overflow: "hidden",
        }}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10" />
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Header */}
        <header className="relative z-30 backdrop-blur-xl bg-gray-900/20 border-b border-gray-700/40 p-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            {/* Back to Lobby button - show different buttons based on game state */}
            {(gameState.gameStatus === 'playing' || gameState.gameStatus === 'round-result') ? (
              // Show "Quit Game" button during active gameplay
            <Button
                onClick={() => setShowQuitDialog(true)}
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 rounded-lg px-4 py-2 border border-red-500/20 hover:border-red-500/40"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Quit Game</span>
              </Button>
            ) : (
              // Show "Back to Lobby" button for waiting states
              <Button
                onClick={() => {
                  console.log('🏠 Game back to lobby clicked')
                  resetGame()
                }}
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200 rounded-lg px-2 sm:px-4 py-2 text-sm sm:text-base"
            >
              <span className="hidden sm:inline">← Back to Lobby</span>
              <span className="sm:hidden">←</span>
            </Button>
            )}
            
            {/* Game Info */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-center bg-gray-800/50 rounded-lg px-2 sm:px-3 py-1 border border-gray-700/50">
                <div className="text-xs text-gray-400">Game ID</div>
                <div className="text-xs sm:text-sm font-mono text-gray-300">{gameState.gameId}</div>
              </div>
              
              {gameState.stakeAmount > 0 && (
                <div className="text-center bg-purple-800/50 rounded-lg px-2 sm:px-3 py-1 border border-purple-700/50">
                  <div className="text-xs text-purple-400">Stake</div>
                  <div className="text-xs sm:text-sm font-bold text-purple-300">
                    {gameState.currency === 'points' ? `${gameState.stakeAmount} pts` : `${gameState.stakeAmount} SOL`}
              </div>
                </div>
              )}
              
              <div className="text-center bg-blue-800/50 rounded-lg px-2 sm:px-3 py-1 border border-blue-700/50">
                <div className="text-xs text-blue-400">Round</div>
                <div className="text-xs sm:text-sm font-bold text-blue-300">{gameState.currentRound}</div>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-xs text-gray-400 hidden sm:inline">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </header>

        {/* Quit Game Confirmation Dialog */}
        <Dialog open={showQuitDialog} onOpenChange={setShowQuitDialog}>
          <DialogContent className="bg-gray-900 border border-gray-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2 text-xl font-bold">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                Quit Game
              </DialogTitle>
                <DialogDescription className="text-gray-300">
                  {gameState.gameStatus === 'waiting' ? 
                    'Are you sure you want to leave this game?' : 
                    'Are you sure you want to quit this game?'
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {gameState.gameStatus === 'waiting' ? (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
                    <p className="text-blue-400 font-semibold text-base">Game Not Started:</p>
                    <ul className="text-sm text-blue-200 space-y-1 pl-2">
                      <li>Your stake will be refunded to you</li>
                      {gameState.currency === 'points' ? (
                        <li>Your {gameState.stakeAmount} points will be returned</li>
                      ) : (
                        <li>Your {gameState.stakeAmount} SOL will be returned</li>
                      )}
                      <li>No opponent has joined yet, so no penalties apply</li>
                      <li>You can join a new game immediately</li>
                    </ul>
                  </div>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-2">
                    <p className="text-red-400 font-semibold text-base">Warning:</p>
                    <ul className="text-sm text-red-200 space-y-1 pl-2">
                      <li>You will automatically lose this game</li>
                      <li>Your opponent will be declared the winner</li>
                      {gameState.currency === 'points' ? (
                        <li>You will lose your {gameState.stakeAmount} points</li>
                      ) : (
                        <li>You will lose your {gameState.stakeAmount} SOL stake</li>
                      )}
                      <li>Your opponent will be notified that you left</li>
                    </ul>
                  </div>
                )}
            </div>
            <DialogFooter className="gap-2 mt-2">
              <Button
                variant="outline"
                onClick={() => setShowQuitDialog(false)}
                className="border border-gray-700 bg-gray-800 text-gray-300 hover:bg-purple-900/40 hover:text-white hover:border-purple-500/40 transition-all duration-200 shadow-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleQuitGame}
                className={gameState.gameStatus === 'waiting' ? 
                  "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg px-6" :
                  "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold shadow-lg px-6"
                }
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{gameState.gameStatus === 'waiting' ? 'Leave Game' : 'Quit Game'}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Main Game Area */}
        <main className="flex-1 relative z-20 overflow-y-auto p-4 max-w-6xl mx-auto w-full flex flex-col justify-center">
          {/* Game Status */}
          <div className="text-center mb-8">
            {gameState.gameStatus === "playing" && (
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-xl rounded-xl p-6 border border-yellow-500/20 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-yellow-400" />
                  <h2 className="text-2xl font-bold text-yellow-400">Choose Your Move</h2>
                </div>
                <div className="flex items-center justify-center gap-3 bg-gray-800/50 rounded-lg p-3">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span className="text-2xl font-bold text-yellow-400">{gameState.countdown}s</span>
                </div>
              </div>
            )}

            {/* Round result UI moved to the large centered card */}
            {/* Show a single large result card during round result */}
            {(() => {
              console.log('🎯 Round result render check:', {
                gameStatus: gameState.gameStatus,
                showRoundResult,
                roundResult: gameState.roundResult,
                shouldShow: gameState.gameStatus === "round-result" && showRoundResult,
                player1Wins: gameState.player1?.wins,
                player2Wins: gameState.player2?.wins,
                currentRound: gameState.currentRound
              })
              return null
            })()}
            {gameState.gameStatus === "round-result" && showRoundResult && !showRevealScreen && (
              <div className="flex justify-center items-center my-8">
                <div className="w-full max-w-2xl">
            {(() => {
              const currentUserId = publicKey?.toString().slice(0, 8);
              const isCurrentUserPlayer1 = gameState.player1?.id === currentUserId;
              const currentPlayerData = isCurrentUserPlayer1 ? gameState.player1 : gameState.player2;
                    const opponentPlayerData = isCurrentUserPlayer1 ? gameState.player2 : gameState.player1;
                    const isVictory = gameState.roundResult?.includes('You won');
                    const isDraw = gameState.roundResult?.toLowerCase().includes('draw');
                    const isDefeat = !isVictory && !isDraw;
                    return (
                      <div
                        className={`backdrop-blur-xl rounded-2xl p-4 sm:p-8 border-2 ${
                          isVictory ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50' :
                          isDraw ? 'bg-gradient-to-r from-yellow-400/20 to-amber-700/40 border-yellow-400/60' :
                          'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/50'
                        }`}
                      >
                        {/* Round Winner Announcement */}
                        <div className="text-center mb-6">
                          <h2 className={`text-2xl sm:text-4xl font-bold ${
                            isVictory ? 'text-green-400' :
                            isDraw ? 'text-yellow-400 drop-shadow-[0_1px_8px_rgba(255,200,0,0.25)]' :
                            'text-red-400'
                          }`}>
                            {isVictory ? 'ROUND WON!' : isDraw ? 'DRAW!' : '😢 ROUND LOST!'}
                          </h2>
                          <p className="text-lg text-gray-200 mt-2">
                            {isVictory && 'You won this round!'}
                            {isDefeat && 'Opponent won this round!'}
                            {isDraw && 'It was a draw!'}
                          </p>
                        </div>

                        {/* Move Comparison */}
                        <div className="flex items-center justify-center gap-8 sm:gap-16 mb-6 sm:mb-8">
                          {/* Your Move */}
                          <div className="flex flex-col items-center w-32 sm:w-40">
                            <span className="text-base font-semibold mb-2 text-purple-300 text-center">Your Move</span>
                            <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center border-2 text-3xl sm:text-5xl bg-gray-900/70 ${
                              isVictory ? 'border-green-400' : isDefeat ? 'border-red-400' : 'border-yellow-400'
                            }`}>{moves.find(m => m.id === currentPlayerData?.currentMove)?.icon}</div>
                            <span className="mt-2 text-gray-300 text-sm sm:text-lg font-medium capitalize text-center">{currentPlayerData?.currentMove}</span>
                          </div>
                          <div className="text-xl sm:text-3xl text-gray-400 font-bold">VS</div>
                          {/* Opponent Move */}
                          <div className="flex flex-col items-center w-32 sm:w-40">
                            <span className="text-base font-semibold mb-2 text-blue-300 text-center">Opponent Move</span>
                            <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center border-2 text-3xl sm:text-5xl bg-gray-900/70 ${
                              isDefeat ? 'border-green-400' : isVictory ? 'border-red-400' : 'border-yellow-400'
                            }`}>{moves.find(m => m.id === opponentPlayerData?.currentMove)?.icon}</div>
                            <span className="mt-2 text-gray-300 text-sm sm:text-lg font-medium capitalize text-center">{opponentPlayerData?.currentMove}</span>
                          </div>
                        </div>

                        {/* Score Update */}
                        <div className="text-center">
                          <div className="text-gray-400 text-sm mb-3 font-semibold">Round Result</div>
                          <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50 mb-4">
                            <div className="flex items-center justify-center gap-6">
                              <div className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-purple-400" />
                                <span className="text-2xl font-bold text-purple-300">{currentPlayerData?.wins || 0}</span>
                                <span className="text-gray-400">You</span>
                              </div>
                              <div className="text-2xl text-gray-500">-</div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">Opponent</span>
                                <span className="text-2xl font-bold text-blue-300">{opponentPlayerData?.wins || 0}</span>
                                <Trophy className="w-5 h-5 text-blue-300" />
                              </div>
                            </div>
                          </div>
                          <div className={`mt-4 text-lg ${isDraw ? 'text-yellow-200' : 'text-gray-200'}`}>
                            Next round in <span className="font-bold text-white">{roundResultCountdown}s</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {gameState.gameStatus === "game-over" && (
              <div
                  className={`backdrop-blur-xl rounded-xl p-8 border max-w-md mx-auto ${(() => {
                    const currentUserId = publicKey?.toString().slice(0, 8);
                    const didCurrentUserWin = gameState.winner === currentUserId;
                    return didCurrentUserWin ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20" : "bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-500/20";
                  })()}`}
                >
                  <div className="flex items-center justify-center gap-3 mb-4">
                    {(() => {
                      const currentUserId = publicKey?.toString().slice(0, 8);
                      const didCurrentUserWin = gameState.winner === currentUserId;
                      
                      return didCurrentUserWin ? (
                      <>
                        <Trophy className="w-8 h-8 text-green-400" />
                        <h2 className="text-3xl font-bold text-green-400">Victory!</h2>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl">😢</span>
                        <h2 className="text-3xl font-bold text-red-400">Defeat</h2>
                      </>
                    );
                    })()}
                  </div>
                <div className="text-lg text-gray-300 mb-6">
                  {gameState.roundResult || 'Game finished!'}
                </div>
                <div className="flex flex-col gap-3">
                <Button
                  onClick={resetGame}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 rounded-lg shadow-lg transition-all duration-200"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Play Again
                </Button>
                
                {/* SOL games - AUTOMATIC distribution (modern standard) */}
                {gameState.currency === 'sol' && (
                  <div className="space-y-3">
                    {(() => {
                      const currentUserId = publicKey?.toString().slice(0, 8);
                      const didCurrentUserWin = gameState.winner === currentUserId;
                      
                      if (didCurrentUserWin) {
                        return (
                          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-4 text-sm text-green-300">
                            <div className="flex items-center gap-2 mb-2">
                              <Trophy className="w-5 h-5 flex-shrink-0 text-green-400" />
                              <span className="font-semibold text-green-200">Victory!</span>
                            </div>
                            <div className="text-green-300 mb-2">
                              {`You have received ${(Number(gameState.stakeAmount) * 2 * (1 - getPlatformFeeRate(gameState.stakeAmount))).toFixed(3)} SOL as your winnings.`}
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-300 flex items-center gap-2">
                            <Wallet className="w-4 h-4 flex-shrink-0" />
                            <span>{`Game complete. Your SOL stake was awarded to the winner.`}</span>
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}

                {/* Legacy message for reference */}
                {false && gameState.currency === 'sol' && (
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-sm text-green-300 mb-2 flex items-center gap-2">
                    <Wallet className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {gameState.winner === publicKey?.toString().slice(0, 8) 
                        ? "You won! SOL will be transferred to your wallet automatically via the smart contract."
                        : "Game complete. SOL settlement is handled automatically on-chain."}
                    </span>
                  </div>
                )}
                
                  <Button
                    onClick={() => {
                      const currentUserId = publicKey?.toString().slice(0, 8);
                      const didCurrentUserWin = gameState.winner === currentUserId;
                      shareGameResult(didCurrentUserWin);
                    }}
                    variant="outline"
                    className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-200 px-8 py-3"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Share on X
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Players Section - Only show when game is actually playing or finished, but NOT during suspense */}
          {(() => {
            const currentUserId = publicKey?.toString().slice(0, 8);
            const bothMovesSubmitted = gameState.player1?.currentMove && gameState.player2?.currentMove;
            // Show reveal screen only when someone reaches 3 wins (victory)
            const someoneWon = (gameState.player1?.wins ?? 0) === 3 || (gameState.player2?.wins ?? 0) === 3;
            const isSuspenseMode = bothMovesSubmitted && someoneWon;
            
            return gameState.gameStatus === "playing" && !isSuspenseMode && !showRevealScreen;
          })() && (
          <div className="grid grid-cols-2 gap-2 sm:gap-8 mb-8">
            {(() => {
              // Determine which player is the current user
              const currentUserId = publicKey?.toString().slice(0, 8);
              const isCurrentUserPlayer1 = gameState.player1?.id === currentUserId;
              const isCurrentUserPlayer2 = gameState.player2?.id === currentUserId;
              
              // Determine which player data to show as "You" and "Opponent"
              const currentPlayerData = isCurrentUserPlayer1 ? gameState.player1 : gameState.player2;
              const opponentPlayerData = isCurrentUserPlayer1 ? gameState.player2 : gameState.player1;
              
              return (
                <>
                  {/* Current User */}
            <Card className="bg-gray-900/80 border-purple-500/30 backdrop-blur-xl shadow-xl">
              <CardContent className="p-2 sm:p-6 text-center">
                <div className="space-y-2 sm:space-y-4">
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 rounded-full"></div>
                    <h3 className="text-sm sm:text-xl font-bold text-purple-400">You</h3>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                          <span className="text-2xl font-bold text-yellow-400">{currentPlayerData?.wins || 0}</span>
                    <span className="text-gray-400">wins</span>
                  </div>

                  <div className="space-y-3">
                          {currentPlayerData?.currentMove ? (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-bold border-2 transition-all duration-300 shadow-lg">
                        <div
                                className={`w-full h-full rounded-xl flex items-center justify-center ${moves.find((m) => m.id === currentPlayerData?.currentMove)?.bgColor} ${moves.find((m) => m.id === currentPlayerData?.currentMove)?.borderColor} ${moves.find((m) => m.id === currentPlayerData?.currentMove)?.textColor} border-2`}
                        >
                                {moves.find((m) => m.id === currentPlayerData?.currentMove)?.icon}
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-bold border-2 border-gray-600/30 bg-gray-800/30 text-gray-500">
                        <Hand className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                    )}

                    <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${currentPlayerData?.ready ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-gray-700/50 text-gray-400"}`}
                    >
                      <div
                              className={`w-2 h-2 rounded-full ${currentPlayerData?.ready ? "bg-green-400" : "bg-gray-400"}`}
                      ></div>
                            {currentPlayerData?.ready ? "Ready" : "Waiting"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

                  {/* Opponent */}
            <Card className="bg-gray-900/80 border-blue-500/30 backdrop-blur-xl shadow-xl">
              <CardContent className="p-2 sm:p-6 text-center">
                <div className="space-y-2 sm:space-y-4">
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
                    <h3 className="text-sm sm:text-xl font-bold text-blue-400">Opponent</h3>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                          <span className="text-2xl font-bold text-yellow-400">{opponentPlayerData?.wins || 0}</span>
                    <span className="text-gray-400">wins</span>
                  </div>

                  <div className="space-y-3">
                          {opponentPlayerData?.currentMove && currentPlayerData?.currentMove ? (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-bold border-2 transition-all duration-300 shadow-lg">
                        <div
                                className={`w-full h-full rounded-xl flex items-center justify-center ${moves.find((m) => m.id === opponentPlayerData?.currentMove)?.bgColor} ${moves.find((m) => m.id === opponentPlayerData?.currentMove)?.borderColor} ${moves.find((m) => m.id === opponentPlayerData?.currentMove)?.textColor} border-2`}
                        >
                                {moves.find((m) => m.id === opponentPlayerData?.currentMove)?.icon}
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-bold border-2 border-gray-600/30 bg-gray-800/30 text-gray-500">
                        <Users className="w-8 h-8" />
                      </div>
                    )}

                    <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${opponentPlayerData?.ready ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-gray-700/50 text-gray-400"}`}
                    >
                      <div
                              className={`w-2 h-2 rounded-full ${opponentPlayerData?.ready ? "bg-green-400" : "bg-gray-400"}`}
                      ></div>
                            {opponentPlayerData?.ready ? "Ready" : "Waiting"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
                </>
              );
            })()}
          </div>
          )}

          {/* Show suspense screen for final round when both players submitted moves */}
          {(() => {
            const currentUserId = publicKey?.toString().slice(0, 8);
            const bothMovesSubmitted = gameState.player1?.currentMove && gameState.player2?.currentMove;
            // Show reveal screen only when both players have 2 wins (2:2 score)
            const someoneWon = (gameState.player1?.wins ?? 0) === 3 || (gameState.player2?.wins ?? 0) === 3;
            const isGameOver = gameState.gameStatus === "game-over";
            
            console.log('🎯 Both moves check:', {
              player1Move: gameState.player1?.currentMove,
              player2Move: gameState.player2?.currentMove,
              bothMovesSubmitted,
              player1Wins: gameState.player1?.wins,
              player2Wins: gameState.player2?.wins,
              someoneWon
            });
            
            // Show suspense screen if:
            // 1. Both players submitted moves in tied score (2:2), OR
            // 2. Game is over but winner not yet determined (during suspense delay)
            const shouldShowSuspense = ((gameState.gameStatus === "playing" || gameState.gameStatus === "round-result") && bothMovesSubmitted && someoneWon) || 
                                     (isGameOver && !gameState.winner);
            
            // Debug logging - always log when game is playing
            if (gameState.gameStatus === "playing") {
              console.log('🎯 Suspense Screen Debug:', {
                gameStatus: gameState.gameStatus,
                currentRound: gameState.currentRound,
                player1Wins: gameState.player1?.wins,
                player2Wins: gameState.player2?.wins,
                player1Move: gameState.player1?.currentMove,
                player2Move: gameState.player2?.currentMove,
                bothMovesSubmitted,
                someoneWon,
                isGameOver,
                winner: gameState.winner,
                shouldShowSuspense,
                condition1: gameState.gameStatus === "playing",
                condition2: bothMovesSubmitted,
                condition3: someoneWon
              });
            }
            
            return shouldShowSuspense || showRevealScreen;
          })() && (
            <div className="flex flex-col items-center justify-center w-full mb-8 animate-pulse">
              <div className="bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-orange-500/30 border-2 border-purple-500/50 rounded-2xl p-12 shadow-2xl max-w-2xl w-full">
                <div className="text-center">
                  <div className="flex justify-center gap-8 mb-8">
                    <div className="w-32 h-32 bg-gray-900/80 rounded-xl border-2 border-purple-400/50 flex items-center justify-center text-6xl animate-bounce">
                      {moves.find(m => m.id === gameState.player1?.currentMove)?.icon}
                    </div>
                    <div className="flex items-center">
                      <div className="text-5xl font-bold text-white animate-pulse">VS</div>
                    </div>
                    <div className="w-32 h-32 bg-gray-900/80 rounded-xl border-2 border-blue-400/50 flex items-center justify-center text-6xl animate-bounce" style={{animationDelay: '0.2s'}}>
                      {moves.find(m => m.id === gameState.player2?.currentMove)?.icon}
                    </div>
                  </div>
                  
                  {/* Score Display */}
                  <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50 mb-6">
                    <div className="flex items-center justify-center gap-6">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-purple-400" />
                        <span className="text-2xl font-bold text-purple-300">{gameState.player1?.wins || 0}</span>
                        <span className="text-gray-400">Player 1</span>
                      </div>
                      <div className="text-2xl text-gray-500">-</div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Player 2</span>
                        <span className="text-2xl font-bold text-blue-300">{gameState.player2?.wins || 0}</span>
                        <Trophy className="w-5 h-5 text-blue-300" />
                      </div>
                    </div>
                  </div>
                  
                  <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 mb-4 animate-pulse">
                    Final Result...
                  </h2>
                  <p className="text-xl text-gray-300 mb-6">
                    Determining the winner!
                  </p>
                  <div className="flex justify-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                    <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show when move is submitted but opponent hasn't - Now positioned below player cards */}
          {(() => {
            const currentUserId = publicKey?.toString().slice(0, 8);
            const isCurrentUserPlayer1 = gameState.player1?.id === currentUserId;
            const currentPlayerData = isCurrentUserPlayer1 ? gameState.player1 : gameState.player2;
            const opponentData = isCurrentUserPlayer1 ? gameState.player2 : gameState.player1;
            const bothMovesSubmitted = gameState.player1?.currentMove && gameState.player2?.currentMove;
            // Show reveal screen only when someone reaches 3 wins (victory)
            const someoneWon = (gameState.player1?.wins ?? 0) === 3 || (gameState.player2?.wins ?? 0) === 3;
            const isSuspenseMode = bothMovesSubmitted && someoneWon;
            return gameState.gameStatus === "playing" && currentPlayerData?.currentMove && !bothMovesSubmitted && !isSuspenseMode;
          })() && (
            <div className="flex flex-col items-center justify-center w-full mb-8">
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6 shadow-xl">
                {(() => {
                  const currentUserId = publicKey?.toString().slice(0, 8);
                  const isCurrentUserPlayer1 = gameState.player1?.id === currentUserId;
                  const currentPlayerData = isCurrentUserPlayer1 ? gameState.player1 : gameState.player2;
                  return (
                    <>
                      <div className="text-green-200 mb-2 flex items-center justify-center gap-2">Move submitted: {moves.find(m => m.id === currentPlayerData?.currentMove)?.icon} <span className="capitalize">{currentPlayerData?.currentMove}</span></div>
                      <div className="text-sm text-gray-400">Waiting for opponent...</div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Move Selection - Only show when player hasn't made move AND it's not suspense mode */}
          {(() => {
            const currentUserId = publicKey?.toString().slice(0, 8);
            const isCurrentUserPlayer1 = gameState.player1?.id === currentUserId;
            const currentPlayerData = isCurrentUserPlayer1 ? gameState.player1 : gameState.player2;
            const bothMovesSubmitted = gameState.player1?.currentMove && gameState.player2?.currentMove;
            // Show reveal screen only when both players have 2 wins (2:2 score)
            const someoneWon = (gameState.player1?.wins ?? 0) === 3 || (gameState.player2?.wins ?? 0) === 3;
            
            // Show move selection only if:
            // 1. Game is playing (not round-result)
            // 2. Player hasn't made a move yet
            // 3. It's not tied score with both moves submitted (suspense mode)
            const shouldShow = gameState.gameStatus === "playing" && 
                              !currentPlayerData?.currentMove && 
                              !(bothMovesSubmitted && someoneWon);
            
            return shouldShow;
          })() && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-white">Choose Your Move!</h3>
                <p className="text-gray-400">Click on Rock, Paper, or Scissors</p>
              </div>
              <div className="grid grid-cols-3 gap-1 sm:gap-6">
                {moves.map((move) => (
                  <Button
                    key={move.id}
                    onClick={() => handleMakeMove(move.id)}
                    className={`h-16 sm:h-32 text-lg sm:text-2xl font-bold border-2 transition-all duration-300 hover:scale-105 rounded-xl ${move.bgColor} ${move.borderColor} ${move.textColor} bg-gray-900/50 backdrop-blur-sm`}
                  >
                    <div className="text-center">
                      <div className="mb-1 sm:mb-2 scale-100 sm:scale-150">{move.icon}</div>
                      <div className="text-xs sm:text-sm">{move.name}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Host-controlled start removed - games now start automatically when both players join */}

          {/* Show when waiting for both players */}
          {gameState.gameStatus === "waiting" && (
            <div className="max-w-2xl mx-auto text-center">
              {/* DEBUG: Show gameError if it exists */}
              {gameError && (
                <div className="max-w-md mx-auto mb-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-200 text-sm">
                  DEBUG: gameError = {gameError}
                </div>
              )}
              
              {/* Show decline message FIRST if player declined invitation */}
              {gameError && typeof gameError === 'string' && (gameError.includes('declined') || gameError.includes('отклонил')) && gameState.gameType === 'private' && gameState.player1?.id === publicKey?.toString().slice(0, 8) ? (
                // Show decline message screen for player1 when invitation was declined
                <div className="max-w-md mx-auto text-center space-y-6">
                  <div className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-8 text-center space-y-6">
                    <div className="flex items-center justify-center">
                      <div className="w-20 h-20 bg-red-500/30 rounded-full flex items-center justify-center border-2 border-red-500/50">
                        <AlertTriangle className="w-10 h-10 text-red-400" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-2xl font-bold text-red-300">Player Declined Your Invitation</h2>
                      <p className="text-red-200 text-lg">Returning to lobby...</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      <span>Redirecting in a few seconds</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Regular waiting screen content */}
                  {/* Countdown Display - Show when countdown is active for player1 */}
              {startCountdown !== null && startCountdown > 0 && gameState.player1?.id === publicKey?.toString().slice(0, 8) ? (
                <div className="max-w-md mx-auto text-center space-y-6">
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="w-32 h-32 mx-auto bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center border-4 border-green-500/50 animate-pulse">
                        <div className="text-6xl font-bold text-green-400">
                          {startCountdown}
                        </div>
                      </div>
                      <div className="absolute inset-0 w-32 h-32 mx-auto border-4 border-green-500/30 rounded-full animate-ping"></div>
                    </div>
                    
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-green-400 animate-pulse">
                        Game Starting...
                      </h2>
                      <p className="text-gray-300">
                        All transactions confirmed!
                      </p>
                    </div>
                  </div>
                </div>
              ) : gameState.player2 && !gameState.player1?.id ? (
                <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center border border-orange-500/30">
                      <Users className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-orange-200">Waiting for Host</div>
                      <div className="text-sm text-orange-300">The game creator needs to rejoin</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="text-orange-100 mb-2">
                      <span className="font-semibold">Game Status:</span> Host has left the game
                    </div>
                    <div className="text-sm text-gray-400 mb-3">
                      The person who created this game needs to return for the match to begin.
                      Ask them to rejoin using the same game link.
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Game ID: {gameState.gameId}</span>
                      <span className="text-gray-500">You joined as Player 2</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-4">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    <span>Waiting for host to reconnect...</span>
                  </div>

                  <Button
                    onClick={() => {
                      const gameUrl = `${window.location.origin}/game/${gameState.gameId}`
                      navigator.clipboard.writeText(gameUrl)
                      // Could add a toast notification here
                    }}
                    variant="outline"
                    className="w-full border-orange-500/50 text-orange-300 hover:bg-orange-500/10 hover:border-orange-400 bg-transparent font-medium py-2 rounded-lg transition-all duration-200 hover:text-orange-200"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Game Link to Share with Host
                  </Button>
                </div>
              ) : gameState.gameType === 'private' && gameState.player1?.id === publicKey?.toString().slice(0, 8) ? (
                // Only show "Private Game Created!" screen for player1 (game creator)
                <div className="max-w-md mx-auto text-center space-y-6">
                  {/* Countdown Display - Show when countdown is active for player1 */}
                  {startCountdown !== null && startCountdown > 0 ? (
                    <div className="space-y-6">
                      <div className="relative">
                        <div className="w-32 h-32 mx-auto bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center border-4 border-green-500/50 animate-pulse">
                          <div className="text-6xl font-bold text-green-400">
                            {startCountdown}
                          </div>
                        </div>
                        <div className="absolute inset-0 w-32 h-32 mx-auto border-4 border-green-500/30 rounded-full animate-ping"></div>
                      </div>
                      
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-green-400 animate-pulse">
                          Game Starting...
                        </h2>
                        <p className="text-gray-300">
                          All transactions confirmed!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Success Icon */}
                      <div className="relative">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg font-bold">✓</span>
                          </div>
                        </div>
                      </div>

                      {/* Game Created Message */}
                      <div className="space-y-2">
                        <h2 className="text-xl font-bold text-green-400">Private Game Created!</h2>
                        <p className="text-gray-300">Share the link below with your opponent</p>
                      </div>

                  {/* Game Details */}
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Stake Amount:</span>
                        <span className="text-green-400 font-bold">
                          {gameState.currency === 'points' ? `${gameState.stakeAmount} Points` : `${gameState.stakeAmount} SOL`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Prize Pool:</span>
                        <span className="text-green-400 font-bold">
                          {gameState.currency === 'points' ? `${gameState.totalPot} Points` : `${(gameState.stakeAmount * 2 * (1 - getPlatformFeeRate(gameState.stakeAmount))).toFixed(3)} SOL`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Game Type:</span>
                        <span className="text-purple-400 font-bold">Private Game</span>
                      </div>
                    </div>
                  </div>

                  {/* Game Link */}
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="text-purple-200 font-medium">Game Link:</div>
                      <div className="bg-gray-800/70 rounded-lg p-3 border border-gray-600/30">
                        <div className="text-sm text-gray-200 font-mono break-all">{gameLink}</div>
                      </div>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(gameLink)
                          // Could show a toast here
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2 rounded-lg transition-all duration-200"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Game Link
                      </Button>
                    </div>
                  </div>
                  </>
                  )}

                  {/* Back to Lobby button removed - we already have one in the header */}
                  {/* <Button
                    onClick={() => {
                      console.log('🏠 Going back to lobby...')
                      resetGame()
                    }}
                    variant="outline"
                    className="w-full border-gray-600/50 text-gray-400 hover:bg-gray-800/50 hover:border-gray-500/50 hover:text-white bg-gray-800/20 font-medium py-2 rounded-lg transition-all duration-200"
                  >
                    ← Back to Lobby
                  </Button> */}
                </div>
              ) : gameState.gameType === 'private' && gameState.player2?.id === publicKey?.toString().slice(0, 8) ? (
                // Show "Waiting for game to start" screen for player2 (invited player)
                <div className="max-w-md mx-auto text-center space-y-6">
                  {/* Countdown Display - Show when countdown is active */}
                  {startCountdown !== null && startCountdown > 0 ? (
                    <div className="space-y-6">
                      <div className="relative">
                        <div className="w-32 h-32 mx-auto bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center border-4 border-green-500/50 animate-pulse">
                          <div className="text-6xl font-bold text-green-400">
                            {startCountdown}
                          </div>
                        </div>
                        <div className="absolute inset-0 w-32 h-32 mx-auto border-4 border-green-500/30 rounded-full animate-ping"></div>
                      </div>
                      
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-green-400 animate-pulse">
                          Game Starting...
                        </h2>
                        <p className="text-gray-300">
                          All transactions confirmed!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Waiting Icon */}
                      <div className="relative">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                            {gameState.currency === 'sol' ? (
                              <Wallet className="w-6 h-6 text-white" />
                            ) : (
                              <Users className="w-6 h-6 text-white" />
                            )}
                          </div>
                        </div>
                        <div className="absolute inset-0 w-24 h-24 mx-auto border-2 border-blue-500/30 rounded-full animate-pulse"></div>
                      </div>

                      {/* Waiting Message */}
                      <div className="space-y-2">
                        <h2 className="text-xl font-bold text-blue-400">
                          {gameState.currency === 'sol' 
                            ? 'Waiting for Transaction Signature' 
                            : 'Waiting for Game to Start'}
                        </h2>
                        <p className="text-gray-300">
                          {gameState.currency === 'sol' 
                            ? 'Waiting for Player 1 to sign their transaction...' 
                            : 'Both players need to complete their transactions'}
                        </p>
                      </div>

                      {/* Game Details */}
                      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Stake Amount:</span>
                            <span className="text-green-400 font-bold">
                              {gameState.currency === 'points' ? `${gameState.stakeAmount} Points` : `${gameState.stakeAmount} SOL`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Prize Pool:</span>
                            <span className="text-green-400 font-bold">
                              {gameState.currency === 'points' ? `${gameState.totalPot} Points` : `${(gameState.stakeAmount * 2 * (1 - getPlatformFeeRate(gameState.stakeAmount))).toFixed(3)} SOL`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Game Type:</span>
                            <span className="text-purple-400 font-bold">Private Game</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Message */}
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <div className="flex items-center justify-center gap-2 text-sm text-blue-300">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <span>
                            {gameState.currency === 'sol' 
                              ? 'Your transaction is complete. Waiting for Player 1...' 
                              : 'Waiting for both players to stake...'}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="max-w-md mx-auto text-center space-y-6">
                  {/* Animated Searching Icon or Found State */}
                  <div className="relative">
                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center border transition-all duration-500 ${
                      opponentFound 
                        ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-green-500/50' 
                        : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30'
                    }`}>
                      {opponentFound ? (
                        <span className="text-2xl">✓</span>
                      ) : (
                        <Users className="w-10 h-10 text-blue-400 animate-pulse" />
                      )}
                    </div>
                    {!opponentFound && (
                      <>
                        <div className="absolute inset-0 w-20 h-20 mx-auto border-2 border-blue-500/30 rounded-full animate-spin border-t-blue-500"></div>
                        <div className="absolute inset-0 w-24 h-24 mx-auto border border-purple-500/20 rounded-full animate-ping"></div>
                      </>
                    )}
                  </div>

                  {/* Matchmaking Info */}
                  <div className="space-y-4">
                    <h2 className={`text-lg font-bold transition-colors duration-500 ${
                      opponentFound ? 'text-green-400' : 'text-white'
                    }`}>
                      {opponentFound ? 'Opponent Found!' : 'Waiting for Opponent...'}
                    </h2>
                    <p className="text-gray-300 text-sm">
                      {opponentFound ? 'Starting game...' : 'Your public game is ready for players to join'}
                    </p>
                    
                    {/* Search Details */}
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Your Stake:</span>
                          <span className="text-blue-400 font-bold">
                            {gameState.currency === 'points' ? `${gameState.stakeAmount} Points` : `${gameState.stakeAmount} SOL`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Prize Pool:</span>
                          <span className="text-green-400 font-bold">
                            {gameState.currency === 'points' ? `${gameState.totalPot} Points` : `${(gameState.stakeAmount * 2 * (1 - getPlatformFeeRate(gameState.stakeAmount))).toFixed(3)} SOL`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Game Status:</span>
                          <span className={`font-bold flex items-center gap-2 ${
                            opponentFound ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              opponentFound ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'
                            }`}></div>
                            {opponentFound ? 'Match Found' : 'Open to Join'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Matchmaking Progress */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <div className="space-y-2">
                        <div className="text-blue-200 font-medium text-sm">Game Progress:</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                            <span className="text-green-200">Public game created successfully</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              opponentFound 
                                ? 'bg-green-500' 
                                : 'border border-blue-400 animate-spin border-t-transparent'
                            }`}>
                              {opponentFound && <span className="text-white text-xs">✓</span>}
                          </div>
                            <span className={opponentFound ? 'text-green-200' : 'text-blue-200'}>
                              {opponentFound ? 'Opponent found!' : 'Waiting for opponent to join...'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border ${
                              opponentFound 
                                ? 'border-blue-400 animate-spin border-t-transparent' 
                                : 'border-gray-600'
                            }`}></div>
                            <span className={opponentFound ? 'text-blue-200' : 'text-gray-400'}>
                              {opponentFound ? 'Starting game...' : 'Match found & game starts'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {!opponentFound && (
                      <>
                    {/* Create New Game */}
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                          <div className="space-y-2">
                            <div className="text-orange-200 font-medium text-sm">Want to start over?</div>
                        <Button
                          onClick={() => {
                            console.log('🏠 Going back to lobby to create new game...')
                            resetGame()
                          }}
                          variant="outline"
                              className="w-full border-2 border-orange-500/50 text-orange-300 hover:bg-orange-500/10 hover:border-orange-400 bg-transparent font-medium py-2 rounded-lg transition-all duration-200 hover:text-orange-200 text-sm"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create New Game
                        </Button>
                      </div>
                    </div>

                    {/* Tips */}
                        <div className="text-xs text-gray-400 bg-gray-800/30 rounded-lg p-2 border border-gray-700/30">
                      💡 Players can find your game through random matchmaking or use your game link to join directly!
                    </div>
                      </>
                    )}
                  </div>
                </div>
              )}
                </>
              )}
            </div>
          )}


        </main>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-x-hidden h-screen"
      style={{
        overscrollBehavior: "none",
        overscrollBehaviorY: "none",
        touchAction: "pan-y",
        height: "100vh",
        overflowY: "auto",
      }}
    >
      {/* Enhanced Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10 pointer-events-none" />

        <div className="absolute top-20 left-20 w-16 h-16 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-xl animate-pulse pointer-events-none" />
        <div className="absolute top-40 right-32 w-12 h-12 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-full blur-lg animate-bounce pointer-events-none" />
        <div className="absolute bottom-40 left-16 w-20 h-20 bg-gradient-to-r from-green-500/25 to-emerald-500/25 rounded-full blur-xl animate-pulse delay-1000 pointer-events-none" />
        <div className="absolute bottom-20 right-20 w-14 h-14 bg-gradient-to-r from-orange-500/25 to-red-500/25 rounded-full blur-lg animate-bounce delay-500 pointer-events-none" />

        <div className="absolute top-10 right-10 w-24 h-24 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-2xl animate-bounce delay-700 pointer-events-none" />
        <div className="absolute top-60 left-10 w-8 h-8 bg-gradient-to-r from-pink-500/35 to-purple-500/35 rounded-full blur-md animate-pulse delay-300 pointer-events-none" />
        <div className="absolute bottom-60 right-40 w-16 h-16 bg-gradient-to-r from-emerald-500/25 to-teal-500/25 rounded-full blur-lg animate-bounce delay-1200 pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-20 h-20 bg-gradient-to-r from-rose-500/20 to-pink-500/20 rounded-full blur-xl animate-bounce delay-2200 pointer-events-none" />
        <div className="absolute top-1/4 right-5 w-6 h-6 bg-gradient-to-r from-amber-500/40 to-yellow-500/40 rounded-full blur-sm animate-pulse delay-900 pointer-events-none" />
        <div className="absolute bottom-1/3 left-5 w-14 h-14 bg-gradient-to-r from-sky-500/25 to-blue-500/25 rounded-full blur-lg animate-bounce delay-1600 pointer-events-none" />

        {/* Interactive Wallet Icons */}
        <div
          onClick={handleFloatingWalletClick}
          className="absolute top-[30%] left-[15%] w-12 h-12 opacity-40 hover:opacity-100 hover:scale-110 transition-all duration-500 ease-in-out cursor-pointer animate-float z-50 group hidden md:block transform hover:rotate-3 hover:shadow-2xl"
          title="Phantom Wallet"
        >
          <img
            src="/icons/phantom.svg"
            alt="Phantom"
            className="w-full h-full rounded-full group-hover:drop-shadow-lg pointer-events-none"
          />
        </div>

        <div
          onClick={handleFloatingWalletClick}
          className="absolute top-[33%] right-[28%] w-12 h-12 opacity-40 hover:opacity-100 hover:scale-110 transition-all duration-500 ease-in-out cursor-pointer animate-float delay-1000 z-50 group hidden md:block transform hover:rotate-3 hover:shadow-2xl"
          title="Solflare Wallet"
        >
          <img
            src="/icons/solflare.svg"
            alt="Solflare"
            className="w-full h-full rounded-full group-hover:drop-shadow-lg pointer-events-none transition-all duration-500"
          />
        </div>

        <div
          onClick={handleFloatingWalletClick}
          className="absolute top-[29%] right-[18%] w-12 h-12 opacity-40 hover:opacity-100 hover:scale-110 transition-all duration-500 ease-in-out cursor-pointer animate-float delay-500 z-50 group hidden md:block transform hover:rotate-3 hover:shadow-2xl"
          title="Backpack Wallet"
        >
          <img
            src="/icons/backpack.svg"
            alt="Backpack"
            className="w-full h-full rounded-full group-hover:drop-shadow-lg pointer-events-none transition-all duration-500"
          />
        </div>

        <div
          onClick={handleFloatingWalletClick}
          className="absolute top-[27%] left-[8%] w-12 h-12 opacity-40 hover:opacity-100 hover:scale-110 transition-all duration-500 ease-in-out cursor-pointer animate-float delay-2000 z-50 group hidden md:block transform hover:rotate-3 hover:shadow-2xl"
          title="MEW Wallet"
        >
          <img
            src="/icons/mew.svg"
            alt="MEW"
            className="w-full h-full rounded-full group-hover:drop-shadow-lg pointer-events-none"
          />
        </div>
        
        <div
          onClick={handleFloatingWalletClick}
          className="absolute top-[35%] left-[25%] w-12 h-12 opacity-40 hover:opacity-100 hover:scale-110 transition-all duration-500 ease-in-out cursor-pointer animate-float delay-3000 z-50 group hidden md:block transform hover:rotate-3 hover:shadow-2xl"
          title="Bonk Wallet"
        >
          <img
            src="/icons/bonk.svg"
            alt="Bonk"
            className="w-full h-full rounded-full group-hover:drop-shadow-lg pointer-events-none"
          />
        </div>
        
        <div
          onClick={handleFloatingWalletClick}
          className="absolute top-[25%] right-[35%] w-12 h-12 opacity-40 hover:opacity-100 hover:scale-110 transition-all duration-500 ease-in-out cursor-pointer animate-float delay-4000 z-50 group hidden md:block transform hover:rotate-3 hover:shadow-2xl"
          title="Solana Wallet"
        >
          <img
            src="/icons/solana.svg"
            alt="Solana"
            className="w-full h-full rounded-full group-hover:drop-shadow-lg pointer-events-none"
          />
        </div>
      </div>



      {/* Disconnect Confirmation Modal */}
      <Dialog open={isDisconnectModalOpen} onOpenChange={setIsDisconnectModalOpen}>
        <DialogContent className="bg-gradient-to-br from-gray-900/95 via-gray-900/98 to-black/95 backdrop-blur-xl border border-gray-700/50 text-white max-w-md shadow-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2 text-white">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              Disconnect Wallet
            </DialogTitle>
          </DialogHeader>
          <div className="mt-6 text-center">
            <p className="text-gray-300 mb-6">
              Are you sure you want to disconnect your{" "}
              <span className="text-white font-semibold">{getConnectedWalletName()}</span> wallet?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setIsDisconnectModalOpen(false)}
                variant="outline"
                className="flex-1 border-gray-600/50 text-gray-300 hover:bg-gray-800/50 hover:border-gray-500/50 bg-gray-800/20 hover:text-white transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                onClick={disconnectWallet}
                className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold shadow-lg transition-all duration-200"
              >
                Disconnect
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Game Confirmation Dialog */}
      <JoinGameDialog
        open={joinDialogOpen}
        onClose={handleJoinGameClose}
        onConfirm={handleJoinGameConfirm}
        gameData={joinGameData}
        userBalance={{
          points: profile?.points_balance || 0,
          sol: walletBalance
        }}
        loading={joinGameLoading}
      />







      {/* Enhanced Header with Balance */}
      <header className="relative z-30 flex items-center justify-between p-2 sm:p-4 lg:p-6 border-b border-gray-700/40 backdrop-blur-md bg-gray-900/20">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-shrink">
          {/* Back to Lobby button - show when not in lobby and not in active game session */}
          {currentView !== "lobby" && gameState.gameStatus !== "playing" && gameState.gameStatus !== "round-result" && (
            <Button
              onClick={() => {
                console.log('🏠 Header back to lobby clicked from:', currentView)
                resetGame()
              }}
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200 rounded-lg px-2 sm:px-3 py-2 text-sm sm:text-base shrink-0"
            >
              <span className="hidden sm:inline">← Back to Lobby</span>
              <span className="sm:hidden">←</span>
            </Button>
          )}
          
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl"></div>
            <div className="relative">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white/90 rounded-sm rotate-45 shadow-sm"></div>
            </div>
          </div>
          <span className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent truncate min-w-0">
            RPS Arena
          </span>
          {/* <Badge
            variant="secondary"
            className="hidden sm:inline-flex bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/15 hover:text-purple-300 hover:border-purple-500/30 transition-all duration-200 shadow-sm text-xs whitespace-nowrap"
          >
            MagicBlock Powered
          </Badge> */}
        </div>

        {/* Centered Navigation */}
        <nav className="hidden lg:flex items-center justify-center space-x-3 xl:space-x-6 absolute left-1/2 transform -translate-x-1/2 max-w-md">
        <button
            onClick={() => {
              console.log('🏠 Navigation Play button clicked')
              resetGame()
            }}
            className={`font-medium relative group transition-colors text-sm xl:text-base whitespace-nowrap ${
              (currentView as string) === "lobby" ? "text-purple-300" : "text-gray-300 hover:text-purple-300"
            }`}
          >
            Play
            <div
              className={`absolute -bottom-1 left-0 h-0.5 bg-purple-400 transition-all duration-200 ${
                (currentView as string) === "lobby" ? "w-full" : "w-0 group-hover:w-full"
              }`}
            ></div>
          </button>
          <button
            onClick={() => setCurrentView("leaderboard")}
            className={`font-medium relative group transition-colors text-sm xl:text-base whitespace-nowrap ${
              (currentView as string) === "leaderboard" ? "text-purple-300" : "text-gray-300 hover:text-purple-300"
            }`}
          >
            Leaderboard
            <div
              className={`absolute -bottom-1 left-0 h-0.5 bg-purple-400 transition-all duration-200 ${
                (currentView as string) === "leaderboard" ? "w-full" : "w-0 group-hover:w-full"
              }`}
            ></div>
          </button>
          {connected && (
            <button
              onClick={() => setCurrentView("referrals")}
              className={`font-medium relative group transition-colors text-xs xl:text-sm whitespace-nowrap ${
                (currentView as string) === "referrals" ? "text-purple-300" : "text-gray-400 hover:text-purple-300"
              }`}
            >
              Referrals
              <div
                className={`absolute -bottom-1 left-0 h-0.5 bg-purple-400 transition-all duration-200 ${
                  (currentView as string) === "referrals" ? "w-full" : "w-0 group-hover:w-full"
                }`}
              ></div>
            </button>
          )}
          <a
            href="#how-to-play"
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById("how-to-play")
              if (element) {
                element.scrollIntoView({ behavior: "smooth" })
              }
            }}
            className="text-gray-300 hover:text-purple-300 transition-colors font-medium relative group text-sm xl:text-base whitespace-nowrap"
          >
            How to Play
            <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-400 transition-all duration-200 group-hover:w-full"></div>
          </a>
        </nav>

        {/* Wallet Section with Balance */}
        <div className="flex flex-col items-end space-y-1 min-w-0 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 min-w-0 flex-shrink-0">
            {connected && (
              <div className="hidden xl:flex items-center space-x-3">
                {/* Points Balance */}
                <div className="flex items-center space-x-2 bg-purple-500/10 rounded-lg px-3 py-2 border border-purple-500/20">
                  <div className="w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs text-white font-bold">P</span>
                  </div>
                  <div className="text-right min-w-0">
                    <div className="text-sm font-bold text-purple-400 flex items-center gap-1">
                      <span className="truncate">{profile ? profile.points_balance.toLocaleString() : profileLoading ? '...' : '0'}</span>
                      <span className="whitespace-nowrap">Points</span>
                      {profileUpdating && (
                        <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap">
                      {profile ? `${profile.wins}W / ${profile.losses}L` : 'New Player'}
                    </div>
                  </div>
                </div>

                {/* SOL Balance */}
                <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700/50">
                  <Wallet className="w-4 h-4 text-green-400 shrink-0" />
                  <div className="text-right min-w-0">
                    <div className="text-sm font-bold text-green-400 whitespace-nowrap">
                      {walletBalance.toFixed(3)} SOL
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="text-xs text-gray-400 font-mono cursor-pointer hover:text-gray-300 transition-colors">
                          {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setDepositDialogOpen(true)} className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Deposit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setWithdrawDialogOpen(true)} className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 rotate-180" />
                          Withdraw
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportPrivateKey} disabled={!connected} className="flex items-center gap-2">
                          <Copy className="h-4 w-4" />
                          Export PK
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            )}

            {connected && (
              <div className="flex xl:hidden items-center space-x-2">
                {/* Compact mobile balances */}
                <div className="flex items-center space-x-1 bg-purple-500/10 rounded-lg px-2 py-1 border border-purple-500/20">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">P</span>
                  </div>
                  <span className="text-xs font-bold text-purple-400">
                    {profile ? (profile.points_balance > 999 ? `${Math.floor(profile.points_balance/1000)}k` : profile.points_balance) : '0'}
                  </span>
                </div>
                <div className="flex items-center space-x-1 bg-gray-800/50 rounded-lg px-2 py-1 border border-gray-700/50">
                  <Wallet className="w-3 h-3 text-green-400" />
                  <span className="text-xs font-bold text-green-400">
                    {walletBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="shrink-0">
              <StyledWalletButton />
            </div>
          </div>

        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="lg:hidden relative z-30 border-b border-gray-700/40 backdrop-blur-md bg-gray-900/20">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => {
              console.log('🏠 Mobile Play button clicked')
              resetGame()
            }}
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
              (currentView as string) === "lobby" ? "text-purple-300 bg-purple-500/10" : "text-gray-300 hover:text-purple-300"
            }`}
          >
            <GamepadIcon className="w-5 h-5" />
            <span className="text-xs font-medium">Play</span>
          </button>
          <button
            onClick={() => setCurrentView("leaderboard")}
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
              (currentView as string) === "leaderboard" ? "text-purple-300 bg-purple-500/10" : "text-gray-300 hover:text-purple-300"
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span className="text-xs font-medium">Leaderboard</span>
          </button>
          <button
            onClick={() => setCurrentView("referrals")}
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
              (currentView as string) === "referrals" ? "text-purple-300 bg-purple-500/10" : "text-gray-300 hover:text-purple-300"
            }`}
          >
            <Gift className="w-5 h-5" />
            <span className="text-xs font-medium">Referrals</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-20 container mx-auto px-4 sm:px-6 py-8 sm:py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          {/* <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight">
            Play anytime,
            <br />
            anywhere
          </h1> */}
          {/* Mobile: Simple text */}
          <p className="sm:hidden text-lg text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed text-center">
            Rock Paper Scissors on Solana.
            Select the bet and play. Now.
          </p>
          
          {/* Desktop: Full description */}
          <p className="hidden sm:block text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            The ultimate Rock Paper Scissors betting game powered by MagicBlock's lightning-fast rollups. 
            Choose your stake and find an opponent instantly for instant SOL payouts.
          </p>
        </div>

        {/* Error Display */}
        {gameError && (
          <div className="max-w-md mx-auto mb-6">
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200 text-center">
              {gameError}
            </div>
          </div>
        )}




        {/* Random Game Interface */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800/20 to-gray-900/40 rounded-2xl blur-xl"></div>

            <Card className="relative bg-gray-900/95 border border-gray-700/80 backdrop-blur-xl shadow-2xl rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5 p-1">
                <div className="bg-gray-900/90 rounded-t-lg p-4 backdrop-blur-sm border-b border-gray-800/50">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-orange-400 animate-pulse'}`}></div>
                    <span className="text-sm font-medium text-gray-300">
                      {isConnected ? 'Random Matchmaking - Connected' : 'Random Matchmaking - Connecting...'}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-orange-400 animate-pulse'}`}></div>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 bg-gradient-to-b from-gray-900/60 to-gray-900/90">
                 {/* Main Game Options */}
                 <div className="space-y-6">
                  <Tabs defaultValue="private" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-800/70 backdrop-blur-sm rounded-lg p-1 border border-gray-700/60">
                      <TabsTrigger
                        value="private"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:shadow-lg data-[state=active]:text-white rounded-md transition-all duration-200 font-medium text-xs sm:text-sm"
                      >
                        <GamepadIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Private Game</span>
                        <span className="sm:hidden">Private Game</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="random"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:shadow-lg data-[state=active]:text-white rounded-md transition-all duration-200 font-medium text-xs sm:text-sm"
                      >
                        <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Find Random Opponent</span>
                        <span className="sm:hidden">Random Opponent</span>
                      </TabsTrigger>
                    </TabsList>

                  <TabsContent value="private" className="space-y-5 mt-6">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Private Games</h3>
                        <p className="text-gray-400 text-sm">Create your own game or join by link</p>
                      </div>

                    {/* Sub-tabs for Private Game options */}
                    <Tabs defaultValue="create" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 backdrop-blur-sm rounded-lg p-1 border border-gray-700/40">
                        <TabsTrigger
                          value="create"
                          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:shadow-lg data-[state=active]:text-white rounded-md transition-all duration-200 font-medium text-sm"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Game
                        </TabsTrigger>
                        <TabsTrigger
                          value="join"
                          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:shadow-lg data-[state=active]:text-white rounded-md transition-all duration-200 font-medium text-sm"
                        >
                          <Search className="w-4 h-4 mr-2" />
                          Join Game
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="create" className="space-y-4 mt-4">

                    {connected && (
                      <>
                        {/* Currency Selector */}
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                            <Circle className="w-4 h-4 text-purple-400" />
                            Choose Currency
                          </Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                              onClick={() => {
                                if (!isCreatingGame && !joinGameLoading) {
                                  setSelectedCurrency("sol")
                                  setGameError(null)
                                }
                              }}
                              disabled={!connected || isCreatingGame || joinGameLoading}
                              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                selectedCurrency === "sol"
                                  ? "border-green-500 bg-green-500/20 text-green-300"
                                  : connected && !isCreatingGame && !joinGameLoading
                                  ? "border-gray-600 bg-gray-800/50 text-gray-300 hover:border-green-500/50"
                                  : "border-gray-700 bg-gray-800/20 text-gray-500 cursor-not-allowed"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Wallet className="w-8 h-8 text-green-400" />
                                <div className="text-left">
                                  <div className="font-bold text-sm">SOL</div>
                                  <div className="text-xs opacity-75">
                                    {connected ? `${walletBalance.toFixed(3)} available` : 'Connect wallet'}
                                  </div>
                                </div>
                              </div>
                            </button>

                            <button
                              onClick={() => {
                                if (!isCreatingGame && !joinGameLoading) {
                                  setSelectedCurrency("points")
                                  setGameError(null)
                                }
                              }}
                              disabled={!connected || !hasEnoughPoints(100) || isCreatingGame || joinGameLoading}
                              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                selectedCurrency === "points"
                                  ? "border-purple-500 bg-purple-500/20 text-purple-300"
                                  : connected && hasEnoughPoints(100) && !isCreatingGame && !joinGameLoading
                                  ? "border-gray-600 bg-gray-800/50 text-gray-300 hover:border-purple-500/50"
                                  : "border-gray-700 bg-gray-800/20 text-gray-500 cursor-not-allowed"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                                  <span className="text-sm text-white font-bold">P</span>
                                </div>
                                <div className="text-left">
                                  <div className="font-bold text-sm">Points</div>
                                  <div className="text-xs opacity-75">
                                    {connected ? (profile ? `${profile.points_balance} available` : 'Loading...') : 'Connect wallet'}
                                  </div>
                                </div>
                              </div>
                              {connected && !hasEnoughPoints(100) && (
                                <div className="text-xs text-red-400 mt-2">Insufficient points</div>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Stake Amount */}
                    <div className="space-y-3">
                      <Label htmlFor="stake" className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                            {selectedCurrency === "points" ? "Game Cost (Points)" : "Stake Amount (SOL)"}
                      </Label>
                      <div className="relative">
                            {selectedCurrency === "points" ? (
                              <>
                                <div className="bg-gray-800/80 border border-gray-600 text-white rounded-lg p-4 text-center">
                                  <div className="text-2xl font-bold text-purple-400">100 Points</div>
                                  <div className="text-sm text-gray-400 mt-1">Fixed cost per game</div>
                                </div>
                              </>
                            ) : (
                              <>
                        <Input
                          id="stake"
                          type="number"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          className="bg-gray-800/80 border-gray-600 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 pl-4 pr-12 py-3 rounded-lg font-medium"
                          placeholder="0.01"
                          step="0.01"
                          min="0.01"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                          SOL
                        </div>
                              </>
                            )}
                      </div>
                    </div>

                        {/* Game Info */}
                    <div className="space-y-3">
                          {selectedCurrency === "points" ? (
                            <>
                              <div className="flex items-center justify-between text-sm bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-lg border border-green-500/20">
                                <span className="text-gray-200 flex items-center gap-2 font-medium">
                                  <Trophy className="w-4 h-4 text-green-400" />
                                  Winner Receives
                                </span>
                                <span className="text-green-400 font-bold text-lg">
                                  200 Points
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                      <div className="flex items-center justify-between text-sm bg-gradient-to-r from-orange-500/10 to-red-500/10 p-4 rounded-lg border border-orange-500/20">
                        <span className="text-gray-300 flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                          Platform Fee ({getPlatformFeeText(stakeAmount || "0")})
                        </span>
                        <span className="text-orange-400 font-bold">
                          {(Number.parseFloat(stakeAmount || "0") * 2 * getPlatformFeeRate(stakeAmount || "0")).toFixed(3)} SOL
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-lg border border-green-500/20">
                        <span className="text-gray-200 flex items-center gap-2 font-medium">
                          <Trophy className="w-4 h-4 text-green-400" />
                          Winner Takes
                        </span>
                        <span className="text-green-400 font-bold text-lg">
                          {(Number.parseFloat(stakeAmount || "0") * 2 * (1 - getPlatformFeeRate(stakeAmount || "0"))).toFixed(3)} SOL
                        </span>
                      </div>
                            </>
                          )}
                    </div>
                      </>
                    )}

                    {!gameLink ? (
                      <Button
                        onClick={handleCreateGame}
                        disabled={!connected || (selectedCurrency === "points" && !hasEnoughPoints(100))}
                        className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 font-bold py-4 shadow-lg transition-all duration-200 rounded-lg text-lg relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        {!connected ? (
                          "Connect Wallet First"
                        ) : selectedCurrency === "points" && !hasEnoughPoints(100) ? (
                          "Insufficient Points"
                        ) : (
                          <>
                            <Zap className="w-5 h-5 mr-2" />
                            Create {selectedCurrency === "points" ? "Points" : "SOL"} Game
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        {/* Success Message */}
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm">✓</span>
                            </div>
                            <span className="text-green-400 font-bold">Game Created Successfully!</span>
                          </div>
                          <p className="text-green-200 text-sm">Share the link below with your opponent</p>
                        </div>

                        {/* Game Link */}
                        <div className="p-4 bg-gradient-to-r from-gray-800/80 to-gray-800/60 rounded-lg border border-gray-600/50 backdrop-blur-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 mr-3">
                              <div className="text-xs text-gray-400 mb-1">Game Link</div>
                              <span className="text-sm text-gray-200 font-mono break-all">{gameLink}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={copyGameLink}
                              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg p-2"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Start Game Button */}
                        <Button
                          onClick={handleCreateGame}
                          disabled={!connected || isCreatingGame}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg font-bold py-4 rounded-lg text-lg disabled:opacity-50"
                        >
                          <GamepadIcon className="w-5 h-5 mr-2" />
                          {isCreatingGame ? 'Creating Game...' : 'Create Private Game'}
                        </Button>
                      </div>
                    )}
                      </TabsContent>

                      <TabsContent value="join" className="space-y-4 mt-4">
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-gray-200">Game Link or ID</Label>
                          <Input
                            type="text"
                            value={gameIdInput}
                            onChange={(e) => {
                              setGameIdInput(e.target.value)
                              setGameError(null)
                            }}
                            disabled={!connected || isCreatingGame || joinGameLoading}
                            placeholder="Enter game link or ID"
                            className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <Button
                            onClick={joinGameById}
                            disabled={!connected || !gameIdInput.trim() || isCreatingGame || joinGameLoading}
                            className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-700 hover:via-cyan-700 hover:to-blue-700 font-bold py-4 shadow-lg rounded-lg text-lg relative overflow-hidden group disabled:opacity-50"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                            {joinGameLoading ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Joining Game...
                              </>
                            ) : connected ? (
                              <>
                                <Zap className="w-5 h-5 mr-2" />
                                Join Game
                              </>
                            ) : (
                              "Connect Wallet First"
                            )}
                          </Button>
                        
                        {/* Referral Code Input - Only show if user hasn't applied a code yet */}
                        {!profile?.referred_by && (
                          <div className="pt-4 border-t border-gray-700/50">
                            <div className="mb-2 text-center">
                              <p className="text-sm text-gray-400">Have a referral code?</p>
                            </div>
                            <ReferralInputDialog 
                              onSuccess={(bonus) => {
                                // Refresh user profile to show new points
                                refreshProfile()
                              }}
                            />
                          </div>
                        )}
                        </div>
                      </TabsContent>
                    </Tabs>
                    </TabsContent>

                  <TabsContent value="random" className="space-y-5 mt-6">
                      {/* Coming Soon Screen - Random Matchmaking is under development */}
                      <div className="max-w-md mx-auto text-center space-y-6 py-12">
                        <div className="bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/20 border-2 border-purple-500/50 rounded-xl p-12 text-center space-y-6">
                          <div className="flex items-center justify-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full flex items-center justify-center border-2 border-purple-500/50">
                              <Clock className="w-12 h-12 text-purple-300 animate-pulse" />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300">
                              Coming Soon...
                            </h2>
                            {/* <p className="text-gray-300 text-lg">
                              Random matchmaking is currently under development
                            </p> */}
                            <p className="text-gray-400 text-sm">
                              Stay tuned for updates!
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* COMMENTED OUT: Original stake selection UI - uncomment when ready
                        <div className="text-center mb-4">
                          <h3 className="text-lg font-semibold text-white mb-2">Quick Random Match</h3>
                          <p className="text-gray-400 text-sm">Choose your stake and find an opponent instantly</p>
                        </div>

                        Stake Selection for Random Games
                        <div className="space-y-4">
                          <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2 justify-center">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            Select Your Bet
                          </Label>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          0.01 SOL Stake
                          <button
                            onClick={() => {
                              if (!isCreatingGame && !joinGameLoading) {
                                setSelectedCurrency("sol")
                                setStakeAmount("0.01")
                                setRandomGameStakeSelected(true)
                                setGameError(null)
                              }
                            }}
                            disabled={!connected || isCreatingGame || joinGameLoading}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                              randomGameStakeSelected && selectedCurrency === "sol" && stakeAmount === "0.01"
                                ? "border-green-500 bg-green-500/20 text-green-300 shadow-lg shadow-green-500/20"
                                : connected && !isCreatingGame && !joinGameLoading
                                  ? "border-gray-600 bg-gray-800/50 text-gray-300 hover:border-green-500/50 hover:bg-green-500/10"
                                  : "border-gray-700 bg-gray-800/20 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-2xl font-bold mb-1">0.01</div>
                              <div className="text-sm opacity-75">SOL</div>
                              <div className="text-xs mt-2 text-gray-400">Win: {(0.01 * 2 * (1 - getPlatformFeeRate(0.01))).toFixed(3)} SOL</div>
                            </div>
                          </button>

                          0.05 SOL Stake
                          <button
                            onClick={() => {
                              if (!isCreatingGame && !joinGameLoading) {
                                setSelectedCurrency("sol")
                                setStakeAmount("0.05")
                                setRandomGameStakeSelected(true)
                                setGameError(null)
                              }
                            }}
                            disabled={!connected || isCreatingGame || joinGameLoading}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                              randomGameStakeSelected && selectedCurrency === "sol" && stakeAmount === "0.05"
                                ? "border-blue-500 bg-blue-500/20 text-blue-300 shadow-lg shadow-blue-500/20"
                                : connected && !isCreatingGame && !joinGameLoading
                                  ? "border-gray-600 bg-gray-800/50 text-gray-300 hover:border-blue-500/50 hover:bg-blue-500/10"
                                  : "border-gray-700 bg-gray-800/20 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-2xl font-bold mb-1">0.05</div>
                              <div className="text-sm opacity-75">SOL</div>
                              <div className="text-xs mt-2 text-gray-400">Win: {(0.05 * 2 * (1 - getPlatformFeeRate(0.05))).toFixed(3)} SOL</div>
                            </div>
                          </button>

                          0.1 SOL Stake
                          <button
                            onClick={() => {
                              if (!isCreatingGame && !joinGameLoading) {
                                setSelectedCurrency("sol")
                                setStakeAmount("0.1")
                                setRandomGameStakeSelected(true)
                                setGameError(null)
                              }
                            }}
                            disabled={!connected || isCreatingGame || joinGameLoading}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                              randomGameStakeSelected && selectedCurrency === "sol" && stakeAmount === "0.1"
                                ? "border-purple-500 bg-purple-500/20 text-purple-300 shadow-lg shadow-purple-500/20"
                                : connected && !isCreatingGame && !joinGameLoading
                                  ? "border-gray-600 bg-gray-800/50 text-gray-300 hover:border-purple-500/50 hover:bg-purple-500/10"
                                  : "border-gray-700 bg-gray-800/20 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-2xl font-bold mb-1">0.1</div>
                              <div className="text-sm opacity-75">SOL</div>
                              <div className="text-xs mt-2 text-gray-400">Win: {(0.1 * 2 * (1 - getPlatformFeeRate(0.1))).toFixed(3)} SOL</div>
                            </div>
                          </button>
                        </div>
                      </div>

                      Game Info
                      {randomGameStakeSelected && selectedCurrency === "sol" && stakeAmount && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm bg-gradient-to-r from-orange-500/10 to-red-500/10 p-4 rounded-lg border border-orange-500/20">
                            <span className="text-gray-300 flex items-center gap-2">
                              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                              Platform Fee ({getPlatformFeeText(stakeAmount)})
                            </span>
                            <span className="text-orange-400 font-bold">
                              {(Number.parseFloat(stakeAmount) * 2 * getPlatformFeeRate(stakeAmount)).toFixed(3)} SOL
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-lg border border-green-500/20">
                            <span className="text-gray-200 flex items-center gap-2 font-medium">
                              <Trophy className="w-4 h-4 text-green-400" />
                              Winner Takes
                            </span>
                            <span className="text-green-400 font-bold text-lg">
                              {(Number.parseFloat(stakeAmount) * 2 * (1 - getPlatformFeeRate(stakeAmount))).toFixed(3)} SOL
                            </span>
                          </div>
                        </div>
                      )}

                      Play Button
                      <Button
                        onClick={() => {
                          if (randomGameStakeSelected && selectedCurrency === "sol" && stakeAmount) {
                            joinRandomGame()
                          }
                        }}
                        disabled={!connected || !randomGameStakeSelected || isCreatingGame || joinGameLoading}
                        className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 font-bold py-4 shadow-lg transition-all duration-200 rounded-lg text-lg relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        {!connected ? (
                          "Connect Wallet First"
                        ) : !randomGameStakeSelected ? (
                          "Select Your Bet"
                        ) : (
                          <>
                            <Zap className="w-5 h-5 mr-2" />
                            Find Random Opponent
                          </>
                        )}
                      </Button>
                      */}
                    </TabsContent>

                </Tabs>
                </div>
              </CardContent>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
            </Card>
          </div>
        </div>

        {/* Referral Dialog for URL codes */}
        {showReferralInput && referralCodeFromUrl && (
          <ReferralInputDialog 
            trigger={null}
            initialCode={referralCodeFromUrl}
            autoOpen={true}
            onSuccess={(bonus) => {
              setShowReferralInput(false)
              setReferralCodeFromUrl(null)
              refreshProfile()
            }}
          />
        )}

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-gray-900/80 border-purple-500/30 backdrop-blur-xl shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Lightning Fast</h3>
              <p className="text-gray-300">10ms block times with MagicBlock's ephemeral rollups for instant gameplay</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/80 border-blue-500/30 backdrop-blur-xl shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Trophy className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Instant Payouts</h3>
              <p className="text-gray-300">Winners receive up to 98% of the pot immediately after each game</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/80 border-green-500/30 backdrop-blur-xl shadow-2xl hover:shadow-green-500/20 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Share2 className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Easy Sharing</h3>
              <p className="text-gray-300">Share game links to challenge friends or find random opponents</p>
            </CardContent>
          </Card>
        </div>

        {/* How to Play Section - Updated with Points System */}
        <div id="how-to-play" className="max-w-4xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            How to Play
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6 text-center hover:border-purple-500/40 transition-all duration-300 hover:scale-105 h-full">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <div className="text-lg font-bold text-white mb-2">Connect Wallet</div>
                <div className="text-sm text-gray-300">Link your Solana wallet to start playing with points or SOL</div>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                1
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6 text-center hover:border-blue-500/40 transition-all duration-300 hover:scale-105 h-full">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <GamepadIcon className="w-8 h-8 text-white" />
                </div>
                <div className="text-lg font-bold text-white mb-2">Create or Join</div>
                <div className="text-sm text-gray-300">Start a new game or join an existing match using points or SOL</div>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                2
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6 text-center hover:border-green-500/40 transition-all duration-300 hover:scale-105 h-full">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div className="text-lg font-bold text-white mb-2">Battle It Out</div>
                <div className="text-sm text-gray-300">Choose Rock, Paper, or Scissors each round. First to 3 wins takes it all!</div>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                3
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-xl p-6 text-center hover:border-orange-500/40 transition-all duration-300 hover:scale-105 h-full">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div className="text-lg font-bold text-white mb-2">Win & Earn</div>
                <div className="text-sm text-gray-300">Winner gets 100 points or up to 98% SOL pot + 100 bonus points!</div>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                4
              </div>
            </div>
          </div>

          {/* Points System Info */}
          <div className="mt-8 space-y-4">
            <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-gray-800/50 rounded-full px-6 py-3 border border-gray-700/50">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-medium">
                Rock beats Scissors • Paper beats Rock • Scissors beats Paper
              </span>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-center">
                <div className="text-purple-400 font-bold mb-1">Points System</div>
                <div className="text-sm text-gray-300">100 points per game • Winners gain 100 points • Earn points or play with SOL</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <div className="text-green-400 font-bold mb-1">SOL Games</div>
                <div className="text-sm text-gray-300">Real SOL betting • Winner gets up to 98% of pot + 100 bonus points • 2-5% platform fee</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Live Game Statistics
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-gray-900/50 p-6 rounded-xl backdrop-blur-sm border border-gray-800/50 hover:border-purple-500/30 transition-all duration-300">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {statsLoading ? '...' : statsError ? '0' : (stats?.totalGames || 0).toLocaleString()}
              </div>
              <div className="text-gray-300">Total games</div>
            </div>
            <div className="bg-gray-900/50 p-6 rounded-xl backdrop-blur-sm border border-gray-800/50 hover:border-blue-500/30 transition-all duration-300">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {statsLoading ? '...' : statsError ? '0' : (stats?.activeGames || 0)}
              </div>
              <div className="text-gray-300">Active games</div>
            </div>
            <div className="bg-gray-900/50 p-6 rounded-xl backdrop-blur-sm border border-gray-800/50 hover:border-green-500/30 transition-all duration-300">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {statsLoading ? '...' : statsError ? '0' : (stats?.totalPlayers || 0)}
            </div>
              <div className="text-gray-300">Active players</div>
            </div>
            <div className="bg-gray-900/50 p-6 rounded-xl backdrop-blur-sm border border-gray-800/50 hover:border-orange-500/30 transition-all duration-300">
              <div className="text-3xl font-bold text-orange-400 mb-2">
                {statsLoading ? '...' : statsError ? '0' : (stats?.waitingGames || 0)}
              </div>
              <div className="text-gray-300">Waiting for players</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800/50 py-8 backdrop-blur-sm">
        <div className="container mx-auto px-6 text-center text-gray-400">
          <p>Powered by MagicBlock • Built on Solana</p>
        </div>
      </footer>

      {/* Wallet Dialogs */}
      <DepositSolDialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen} balance={walletBalance} />
      <WithdrawSolDialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen} />
    </div>
  )
}


