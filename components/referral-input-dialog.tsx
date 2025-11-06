'use client'

import { useState, useEffect } from 'react'
import { Gift, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useReferral } from '@/hooks/use-referral'
import { useUserProfile } from '@/hooks/use-user-profile'

interface ReferralInputDialogProps {
  trigger?: React.ReactNode | null
  onSuccess?: (bonus: number) => void
  initialCode?: string
  autoOpen?: boolean
}

export function ReferralInputDialog({ trigger, onSuccess, initialCode, autoOpen }: ReferralInputDialogProps) {
  const [open, setOpen] = useState(autoOpen || false)
  const [code, setCode] = useState(initialCode || '')
  const [validating, setValidating] = useState(false)
  const [creating, setCreating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [bonusPoints, setBonusPoints] = useState(0)
  
  const { validateReferralCode, createReferral } = useReferral()
  const { toast } = useToast()
  const { profile } = useUserProfile()
  
  // Check if user already has a referral code applied
  const hasReferralCode = profile?.referred_by !== null && profile?.referred_by !== undefined

  // Reset success state when dialog opens
  useEffect(() => {
    if (open && !autoOpen) {
      setSuccess(false)
      setBonusPoints(0)
    }
  }, [open, autoOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if user already has a referral code
    if (hasReferralCode) {
      toast({
        title: 'Already Applied',
        description: 'You have already used a referral code. Each user can only apply one code.',
        variant: 'destructive',
      })
      setOpen(false)
      return
    }
    
    if (!code.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a referral code',
        variant: 'destructive',
      })
      return
    }

    setValidating(true)

    try {
      // First validate the code
      const validation = await validateReferralCode(code.trim().toUpperCase())
      
      if (!validation.valid) {
        toast({
          title: 'Invalid Code',
          description: validation.error || 'Referral code not found',
          variant: 'destructive',
        })
        setValidating(false)
        return
      }

      setValidating(false)
      setCreating(true)

      // Create the referral relationship
      const result = await createReferral(code.trim().toUpperCase())
      
      if (!result.success) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to apply referral code',
          variant: 'destructive',
        })
        setCreating(false)
        return
      }

      // Set success state to show success message in dialog
      setBonusPoints(result.signupBonus || 100)
      setSuccess(true)
      setCreating(false)

      // Show success toast with more details
      toast({
        title: '🎉 Referral Code Applied Successfully!',
        description: `You received ${result.signupBonus || 100} bonus points! Your friend also received ${result.referrerBonus || 50} points.`,
        duration: 5000,
      })

      // Call success callback
      onSuccess?.(result.signupBonus || 100)
      
      // Close dialog after showing success message
      setTimeout(() => {
        setOpen(false)
        setCode('')
        setSuccess(false)
        setBonusPoints(0)
      }, 3000)
      
    } catch (error) {
      console.error('Error processing referral:', error)
      toast({
        title: 'Error',
        description: 'An error occurred while processing the referral code',
        variant: 'destructive',
      })
    } finally {
      setValidating(false)
      setCreating(false)
    }
  }

  const isLoading = validating || creating

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:text-white">
              <Gift className="h-4 w-4 mr-2" />
              I have a referral code
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px] bg-gray-900/95 border-gray-700/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Gift className="h-5 w-5 text-purple-400" />
            Referral Code
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {success ? 'Code applied successfully!' : hasReferralCode ? 'You already have a referral code applied' : 'Enter your friend\'s referral code to get bonus points'}
          </DialogDescription>
        </DialogHeader>
        
        {hasReferralCode && !success ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/50 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-blue-500/30 rounded-full flex items-center justify-center border-2 border-blue-500/50">
                  <Gift className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-blue-400 mb-2">Referral Code Already Applied</h3>
              <p className="text-blue-200 text-lg mb-1">
                You have already used a referral code
              </p>
              <p className="text-gray-300 text-sm">
                Each user can only apply one referral code
              </p>
            </div>
            <Button
              onClick={() => setOpen(false)}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold"
            >
              Close
            </Button>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-green-500/30 rounded-full flex items-center justify-center border-2 border-green-500/50">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-green-400 mb-2">Success!</h3>
              <p className="text-green-200 text-lg mb-1">
                You received <span className="font-bold text-green-300">{bonusPoints} bonus points</span>
              </p>
              <p className="text-gray-300 text-sm">
                The referral code has been applied successfully!
              </p>
            </div>
            <Button
              onClick={() => {
                setOpen(false)
                setSuccess(false)
                setCode('')
                setBonusPoints(0)
              }}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="referral-code" className="text-gray-300">Referral Code</Label>
              <Input
                id="referral-code"
                placeholder="Enter 8-character code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={8}
                disabled={isLoading}
                className="font-mono bg-gray-800/80 border-gray-600 text-white focus:border-purple-500 focus:ring-purple-500/20"
              />
            </div>
            
            <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg">
              <h4 className="font-medium text-purple-100 mb-2">
                What you'll get:
              </h4>
              <ul className="text-sm text-purple-200 space-y-1">
                <li>• +100 points immediately upon signup</li>
                <li>• Your friend gets +50 points</li>
                <li>• +25 points to friend for your first game</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  setCode('')
                  setSuccess(false)
                }}
                disabled={isLoading}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800/50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !code.trim()}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {validating ? 'Validating...' : creating ? 'Applying...' : 'Apply Code'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
