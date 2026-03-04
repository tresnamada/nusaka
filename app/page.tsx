'use client'

import { useState } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Joystick } from 'react-joystick-component'
import { useJoystickStore } from './game/store'

const GameScene = dynamic(() => import('./game/GameScene'), { ssr: false })

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false)

  // Joystick event handlers
  const handleJoystickMove = (e: any) => {
    // e.x and e.y are mapped between -1 and 1
    // Player.tsx expects forward for W/Up (+1) and right for A/D (+/-1)
    useJoystickStore.getState().setMovement(e.y, e.x);
  }

  const handleJoystickStop = () => {
    useJoystickStore.getState().setMovement(0, 0);
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#87CEEB]">
      {/* 3D Canvas Background */}
      <div className="absolute inset-0 z-0">
        <GameScene />
      </div>

      {/* Main Menu UI Overlay */}
      <div
        className={`absolute inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-1000 bg-white/30 backdrop-blur-sm cursor-pointer
          ${isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        onClick={() => setIsPlaying(true)}
      >
        <div className="relative w-64 h-24 mb-8 md:w-96 md:h-32 drop-shadow-lg">
          <Image
            src="/Nusaka.svg"
            alt="Nusaka Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        <p className="text-xl font-bold tracking-widest text-white uppercase md:text-2xl drop-shadow-md animate-pulse">
          Click to Start
        </p>
      </div>

      {/* Mobile Controls Overlay (Visible only when playing) */}
      <div
        className={`absolute bottom-10 left-1/2 -translate-x-1/2 z-40 transition-opacity duration-1000 md:hidden
          ${isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <Joystick
          size={120}
          sticky={false}
          baseColor="rgba(255,255,255,0.3)"
          stickColor="rgba(255,255,255,0.8)"
          move={handleJoystickMove}
          stop={handleJoystickStop}
        />
      </div>

    </div>
  )
}

