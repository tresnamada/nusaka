'use client'

import { Canvas } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import Planet from './Planet'
import Player from './Player'

import { Suspense } from 'react'

export default function GameScene() {
    return (
        <Canvas shadows camera={{ position: [0, 30, 40], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true }}>
            <Suspense fallback={null}>
                {/* Lights */}
                <ambientLight intensity={1.5} />
                <hemisphereLight args={["#b1e1ff", "#8BC34A", 1]} />

                {/* Environment */}
                <Sky
                    distance={450000}
                    sunPosition={[0, 10, -5]}
                    inclination={0}
                    azimuth={0.25}
                    mieCoefficient={0} // Remove Mie scattering (halo around sun)
                    mieDirectionalG={0} // Remove Mie directionality
                    rayleigh={0.15} // Lower rayleigh for clearer sky
                    turbidity={0.1} // Remove haze completely
                />

                {/* World */}
                <Planet />

                {/* Player */}
                <Player />
            </Suspense>
        </Canvas>
    )
}
