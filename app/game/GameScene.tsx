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
            <directionalLight
                position={[20, 30, 20]}
                intensity={2.5}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-left={-30}
                shadow-camera-right={30}
                shadow-camera-top={30}
                shadow-camera-bottom={-30}
            />

            {/* Environment */}
            <Sky distance={450000} sunPosition={[20, 30, 20]} inclination={0} azimuth={0.25} />

            {/* World */}
            <Planet />

            {/* Player */}
            <Player />

        </Canvas>
    )
}
