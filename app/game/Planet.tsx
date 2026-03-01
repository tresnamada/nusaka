import { useRef } from 'react'
import * as THREE from 'three'

export const PLANET_RADIUS = 150;

export default function Planet() {
    const planetRef = useRef<THREE.Mesh>(null)

    return (
        <mesh ref={planetRef} position={[0, 0, 0]} receiveShadow>
            <sphereGeometry args={[PLANET_RADIUS, 128, 128]} />
            <meshToonMaterial color="#8BC34A" />
        </mesh>
    )
}

