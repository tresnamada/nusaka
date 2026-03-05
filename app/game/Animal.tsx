import React, { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF, useAnimations } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'

interface AnimalProps {
    path: string
    position: THREE.Vector3
    normal: THREE.Vector3
    rotationY: number
    scale?: number
}

export function Animal({ path, position, normal, rotationY, scale = 1 }: AnimalProps) {
    const { scene, animations } = useGLTF(path) as any
    // Clone scene to allow multiple instances of the same model with distinct animations
    const clone = useMemo(() => {
        const clonedScene = SkeletonUtils.clone(scene)
        clonedScene.traverse((node: any) => {
            if (node.isMesh) {
                const oldMat = node.material as THREE.MeshStandardMaterial;
                if (oldMat) {
                    const newMat = new THREE.MeshToonMaterial({
                        map: oldMat.map,
                        color: oldMat.color,
                        transparent: oldMat.transparent,
                        opacity: oldMat.opacity,
                        alphaTest: 0.5,
                        side: THREE.DoubleSide
                    });

                    if (newMat.map) {
                        newMat.map.generateMipmaps = false;
                        newMat.map.minFilter = THREE.NearestFilter;
                        newMat.map.magFilter = THREE.NearestFilter;
                        newMat.map.anisotropy = 1;
                        newMat.map.needsUpdate = true;
                    }
                    node.material = newMat;
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            }
        });
        return clonedScene
    }, [scene])
    const { ref, actions, names } = useAnimations(animations)

    useEffect(() => {
        // Log available animations for debugging in the browser console
        if (names.length > 0 && Math.random() < 0.05) { // Log occasionally to avoid spam
            console.log(`Animations for ${path}:`, names);
        }

        // Play an animation that includes "idle" in its name, or fallback to the first animation
        const actionName = names.find((n: string) => n.toLowerCase().includes('idle')) || names[0]
        if (actionName && actions[actionName]) {
            actions[actionName]?.reset().fadeIn(0.5).play()
        }
        return () => {
            if (actionName && actions[actionName]) {
                actions[actionName]?.fadeOut(0.5)
            }
        }
    }, [actions, names, path])

    const quaternion = useMemo(() => {
        const q = new THREE.Quaternion()
        q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
        return q
    }, [normal])

    return (
        <group position={position} quaternion={quaternion}>
            <group rotation-y={rotationY} scale={scale}>
                <primitive ref={ref} object={clone} />
            </group>
        </group>
    )
}
