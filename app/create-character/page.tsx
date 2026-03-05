'use client'

import { Suspense, useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { auth, db } from '../../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useJoystickStore } from '../game/store'
import { Loader2 } from 'lucide-react'

/* ── 3D: Rotatable Character ─────────────────────────────── */
function NasakaModel({ rotationY }: { rotationY: number }) {
    const group = useRef<THREE.Group>(null)
    const { scene, animations } = useGLTF('/model/nasaka.glb') as any
    const { actions } = useAnimations(animations, group)

    // Apply toon material once
    useEffect(() => {
        scene.traverse((child: any) => {
            if (child.isMesh) {
                const old = child.material as THREE.MeshStandardMaterial
                const mat = new THREE.MeshToonMaterial({
                    map: old.map,
                    color: old.color,
                    transparent: false,
                    alphaTest: 0.5,
                    side: THREE.DoubleSide,
                })
                if (mat.map) {
                    mat.map.generateMipmaps = false
                    mat.map.minFilter = THREE.NearestFilter
                    mat.map.magFilter = THREE.NearestFilter
                    mat.map.needsUpdate = true
                }
                child.material = mat
                // No shadow casting on the preview model
            }
        })
    }, [scene])

    // Start idle animation
    useEffect(() => {
        const idleKey = Object.keys(actions).find(k => k.toLowerCase().includes('idle'))
        if (idleKey) actions[idleKey]?.reset().fadeIn(0.4).play()
    }, [actions])

    // Smooth target rotation
    const targetY = useRef(0)
    targetY.current = rotationY

    useFrame((_, delta) => {
        if (!group.current) return
        group.current.rotation.y = THREE.MathUtils.lerp(
            group.current.rotation.y,
            targetY.current,
            8 * delta
        )
    })

    return (
        <group ref={group} position={[0, -1.5, 0]} scale={0.8}>
            <primitive object={scene} />
        </group>
    )
}

/* ── Page ─────────────────────────────────────────────────── */
export default function CreateCharacter() {
    const router = useRouter()
    const [characterName, setCharacterName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorText, setErrorText] = useState('')
    const [userId, setUserId] = useState<string | null>(null)

    // Rotation drag state
    const [rotationY, setRotationY] = useState(0)
    const isDragging = useRef(false)
    const lastX = useRef(0)

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, user => {
            if (user) setUserId(user.uid)
            else router.push('/')
        })
        return () => unsub()
    }, [])

    /* Pointer drag handlers */
    const onPointerDown = (e: React.PointerEvent) => {
        isDragging.current = true
        lastX.current = e.clientX
    }
    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current) return
        const dx = e.clientX - lastX.current
        lastX.current = e.clientX
        setRotationY(prev => prev + dx * 0.015)
    }
    const onPointerUp = () => { isDragging.current = false }

    /* Submit */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!characterName.trim() || !userId) return
        setIsSubmitting(true)
        setErrorText('')
        try {
            await setDoc(doc(db, 'players', userId), {
                name: characterName,
                createdAt: serverTimestamp(),
                position: { x: 0, y: 11, z: 0 },
            })
            useJoystickStore.getState().setPlayerProfile(userId, characterName, true)
            useJoystickStore.getState().setMenuState('playing')
            router.push('/')
        } catch {
            setErrorText('Gagal membuat karakter. Coba lagi.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div
            className="relative w-screen h-screen overflow-hidden flex bg-[#87CEEB]"
            style={{ fontFamily: 'var(--font-nanum-pen)' }}
        >

            {/* ── LEFT: 3D Character Viewer ─────────────── */}
            <div
                className="w-1/2 h-full select-none cursor-grab active:cursor-grabbing"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
            >
                <Canvas
                    camera={{ position: [0, 1.2, 7], fov: 38 }}
                >
                    <ambientLight intensity={2} />
                    <directionalLight position={[5, 8, 5]} intensity={1.5} />
                    <Suspense fallback={null}>
                        <NasakaModel rotationY={rotationY} />
                        <Environment preset="sunset" />
                    </Suspense>
                </Canvas>

                {/* Drag hint */}
                <p
                    className="absolute bottom-10 left-1/4 -translate-x-1/2 text-white/70 text-2xl pointer-events-none select-none"
                    style={{ fontFamily: 'var(--font-nanum-pen)', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
                >
                    ← geser untuk putar →
                </p>
            </div>

            {/* ── RIGHT: Form ──────────────────────────── */}
            <div className="w-1/2 h-full flex flex-col items-start justify-center px-12 md:px-20 gap-8">

                <div>
                    {/* Nusaka Logo */}
                    <div className="relative w-52 h-24 mb-4 drop-shadow-xl">
                        <Image src="/Nusaka.svg" alt="Nusaka Logo" fill className="object-contain object-left" priority />
                    </div>
                    <h1
                        className="text-6xl md:text-8xl text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] leading-tight"
                    >
                        Siapa<br />namamu?
                    </h1>
                    <p className="text-white/80 text-2xl mt-3 drop-shadow">
                        Nama ini akan terukir di jurnal Nusaka selamanya.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
                    <input
                        type="text"
                        value={characterName}
                        onChange={e => setCharacterName(e.target.value)}
                        placeholder="namamu..."
                        maxLength={16}
                        className="w-full bg-transparent border-b-4 border-white/80 text-white text-5xl placeholder-white/40 focus:outline-none focus:border-white pb-2 transition-colors"
                        style={{ fontFamily: 'var(--font-nanum-pen)' }}
                        required
                    />

                    {errorText && (
                        <p className="text-red-300 text-xl drop-shadow">{errorText}</p>
                    )}

                    <div className="flex gap-4 mt-4">
                        <button
                            type="button"
                            onClick={() => router.push('/')}
                            className="text-white/70 text-3xl hover:text-white transition-colors"
                        >
                            ← Kembali
                        </button>

                        <button
                            type="submit"
                            disabled={!characterName.trim() || isSubmitting}
                            className="text-white text-4xl border-b-4 border-white/80 hover:border-white pb-1 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
                        >
                            {isSubmitting
                                ? <><Loader2 className="w-7 h-7 animate-spin" /> Menyimpan...</>
                                : 'Mulai Petualangan! →'}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    )
}
