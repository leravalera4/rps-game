'use client'

import { useState, useEffect, useRef } from 'react'
import { Volume2, VolumeX, Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

export function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.3) // Actual volume value (0-1)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (value: number[]) => {
    // Value is already inverted in display, so use it directly
    setVolume(value[0])
    setIsMuted(false)
  }

  return (
    <div className="hidden md:flex fixed bottom-4 right-4 z-50 bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-lg p-3 shadow-lg">
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <Button
          onClick={togglePlay}
          variant="ghost"
          size="sm"
          className="text-white hover:text-purple-400 hover:bg-gray-800/50 transition-all duration-200"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleMute}
            variant="ghost"
            size="sm"
            className="text-white hover:text-purple-400 hover:bg-gray-800/50 transition-all duration-200"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          
          <div className="w-20 relative">
            <div className="[&>div>div>div:nth-child(2)]:scale-x-[-1] [&>div>div>div:nth-child(2)]:origin-right [&>div>div>div:nth-child(2)]:right-0 [&>div>div>div:nth-child(2)]:left-auto [&>div>div:first-child]:!bg-white [&>div>div>div:nth-child(2)]:!bg-black">
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
        className="hidden"
      >
        <source src="/audio/background-music.mp3" type="audio/mpeg" />
        <source src="/audio/background-music.ogg" type="audio/ogg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  )
}
