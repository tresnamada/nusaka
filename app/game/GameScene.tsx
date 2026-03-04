'use client'

import { Canvas } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import Planet from './Planet'
import Player from './Player'

export default function GameScene() {
    return (
        <Canvas shadows camera={{ position: [0, 30, 40], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true }}>
            {/* Lights */}
            <ambientLight intensity={1.5} />
            <hemisphereLight args={["#b1e1ff", "#8BC34A", 1]} />


            {/* Environment */}
            <Sky
                distance={450000}
                sunPosition={[0, 10, -5]} // High noon
                inclination={0}
                azimuth={0.25}
                mieCoefficient={0.001} // Extremely low mie to remove white horizon haze
                mieDirectionalG={0.7}
                rayleigh={0.1} // Lower rayleigh removes atmospheric thickness
                turbidity={0.5} // Less hazy
            />

            {/* World */}
            <Planet />

            {/* Player */}
            <Player />

        </Canvas>
    )
}
