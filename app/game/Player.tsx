import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { PLANET_RADIUS } from './Planet'

export default function Player() {
    const group = useRef<THREE.Group>(null)

    // Load model and animations
    const { scene, animations } = useGLTF('/model/nasaka.glb')
    const { actions } = useAnimations(animations, group)

    // Movement state
    const [movement, setMovement] = useState({ forward: 0, right: 0 })

    // Track player position on sphere
    const playerPosition = useRef(new THREE.Vector3(0, PLANET_RADIUS, 0))
    // Target rotation for smooth turning
    const targetRotation = useRef(new THREE.Quaternion())

    // Handle keyboard
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW': case 'ArrowUp': setMovement(m => ({ ...m, forward: 1 })); break;
                case 'KeyS': case 'ArrowDown': setMovement(m => ({ ...m, forward: -1 })); break;
                case 'KeyA': case 'ArrowLeft': setMovement(m => ({ ...m, right: -1 })); break;
                case 'KeyD': case 'ArrowRight': setMovement(m => ({ ...m, right: 1 })); break;
            }
        }
        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW': case 'ArrowUp': setMovement(m => ({ ...m, forward: 0 })); break;
                case 'KeyS': case 'ArrowDown': setMovement(m => ({ ...m, forward: 0 })); break;
                case 'KeyA': case 'ArrowLeft': setMovement(m => ({ ...m, right: 0 })); break;
                case 'KeyD': case 'ArrowRight': setMovement(m => ({ ...m, right: 0 })); break;
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [])

    // Animation logic
    const currentAction = useRef<string | null>(null)

    useEffect(() => {
        const isRunning = movement.forward !== 0 || movement.right !== 0;

        // Attempt to play animations based on what's available
        let runningAction = actions['running'] || actions['Run'] || actions['run'] || actions[Object.keys(actions).find(k => k.toLowerCase().includes('run')) || '']
        let idleAction = actions['idle'] || actions['Idle'] || actions['idle_01'] || actions[Object.keys(actions).find(k => k.toLowerCase().includes('idle')) || '']

        if (!actions || Object.keys(actions).length === 0) return;

        const targetActionName = isRunning ? 'running' : 'idle';
        const targetAction = isRunning ? runningAction : idleAction;

        if (currentAction.current !== targetActionName) {
            // Fade out the old action if it exists
            const prevActionName = currentAction.current;
            const prevAction = prevActionName === 'running' ? runningAction : idleAction;

            if (prevAction) {
                prevAction.fadeOut(0.2);
            }

            // Fade in the new action
            if (targetAction) {
                targetAction.reset().fadeIn(0.2).play();
            }

            currentAction.current = targetActionName;
        }
    }, [movement, actions])

    // Enhance material with shadows and custom Animal Crossing toon shader
    useEffect(() => {
        // Collect primary meshes first to avoid infinite recursion when adding outline meshes
        const meshes: THREE.Mesh[] = [];
        scene.traverse((child) => {
            if (child instanceof THREE.Mesh && !child.userData.isOutline) {
                meshes.push(child);
            }
        });

        meshes.forEach((child) => {
            // Remove any old leftover outlines in the cached GLTF scene graph
            const outlinesToRemove: THREE.Object3D[] = [];
            child.children.forEach(c => {
                if (c.userData && c.userData.isOutline) {
                    outlinesToRemove.push(c);
                }
            });
            outlinesToRemove.forEach(c => child.remove(c));
            child.userData.hasOutline = false;

            child.castShadow = true;
            child.receiveShadow = true;

            // Replace default material with a clean Toon Shading material (Animal Crossing style)
            if (child.material) {
                const oldMat = child.material as THREE.MeshStandardMaterial;

                // Maximize texture sharpness
                if (oldMat.map) {
                    oldMat.map.anisotropy = 16;
                    oldMat.map.minFilter = THREE.LinearMipmapLinearFilter;
                    oldMat.map.magFilter = THREE.LinearFilter;
                    oldMat.map.needsUpdate = true;
                }

                const newMat = new THREE.MeshToonMaterial({
                    map: oldMat.map,
                    color: oldMat.color,
                    // If the model has red lines, it's a transparency sorting issue in WebGL. 
                    // We FORCE alpha clipping (alphaTest) instead of alpha blending (transparent).
                    transparent: false,
                    depthWrite: true,
                    alphaTest: 0.5,
                    side: oldMat.side !== undefined ? oldMat.side : THREE.DoubleSide
                });

                child.material = newMat;
            }
        });
    }, [scene])

    // Update loop
    const { camera } = useThree()

    useFrame((state, delta) => {
        if (!group.current) return;

        const speed = 8;
        const isMoving = movement.forward !== 0 || movement.right !== 0;

        // 1. Calculate input direction relative to the camera
        // Camera's forward vector projected onto the tangent plane of the sphere at player's position
        const surfaceNormal = playerPosition.current.clone().normalize();
        const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        camForward.projectOnPlane(surfaceNormal).normalize();
        const camRight = new THREE.Vector3().crossVectors(camForward, surfaceNormal).normalize();

        const inputDir = new THREE.Vector3()
            .addScaledVector(camForward, movement.forward)
            .addScaledVector(camRight, movement.right);

        if (inputDir.lengthSq() > 0) {
            inputDir.normalize();
        }

        // 2. Move player position along the sphere
        if (isMoving) {
            playerPosition.current.addScaledVector(inputDir, speed * delta);
            playerPosition.current.normalize().multiplyScalar(PLANET_RADIUS);

            // New up vector after moving
            const newUp = playerPosition.current.clone().normalize();

            // To make character look globally towards inputDir while keeping feet on the ground:
            // Calculate a point slightly ahead of player in the direction of movement
            const lookPoint = playerPosition.current.clone().add(inputDir);

            // Recompute orthogonal basis exactly like lookAt does, but manually to maintain control
            const forward = lookPoint.clone().sub(playerPosition.current).normalize();
            const right = new THREE.Vector3().crossVectors(newUp, forward).normalize();
            // recalculate forward to ensure it's perpendicular to newUp
            forward.crossVectors(right, newUp).normalize();

            const matrix = new THREE.Matrix4().makeBasis(right, newUp, forward);
            targetRotation.current.setFromRotationMatrix(matrix);
        } else {
            // When not moving, keep feet on the ground but maintain the same yaw (look direction)
            const currentForward = new THREE.Vector3(0, 0, 1).applyQuaternion(group.current.quaternion);
            const newUp = playerPosition.current.clone().normalize();

            const right = new THREE.Vector3().crossVectors(newUp, currentForward).normalize();
            const forward = new THREE.Vector3().crossVectors(right, newUp).normalize();

            const matrix = new THREE.Matrix4().makeBasis(right, newUp, forward);
            targetRotation.current.setFromRotationMatrix(matrix);
        }

        group.current.position.copy(playerPosition.current);
        group.current.quaternion.slerp(targetRotation.current, 15 * delta);

        // 3. Update camera position to follow player (Animal Crossing style)
        // Camera stays at a fixed orientation relative to the world, just moving along the sphere surface
        const offsetDistance = 15; // Decreased for a closer view
        const offsetHeight = 8;    // Lowered for a closer view

        const pUp = playerPosition.current.clone().normalize();

        // Fix camera rotation to always look from "South" to "North" across the sphere
        // Calculate a "North" direction tangent to the surface at the player's position
        const globalNorth = new THREE.Vector3(0, 0, -1);
        const pForward = globalNorth.clone().projectOnPlane(pUp).normalize();

        // If we are exactly at the poles, pForward might be zero. Handle that edge case:
        if (pForward.lengthSq() < 0.001) {
            pForward.set(1, 0, 0);
        }

        const idealCameraPos = playerPosition.current.clone()
            .addScaledVector(pForward, -offsetDistance) // Move behind the player (South)
            .addScaledVector(pUp, offsetHeight);        // Move up away from the surface

        camera.position.lerp(idealCameraPos, 5 * delta);

        // Camera smoothly looks at the player (slightly above)
        const lookTarget = playerPosition.current.clone()
            .addScaledVector(pUp, 3)          // Look a bit above the feet
            .addScaledVector(pForward, 2);    // Look slightly ahead

        const tempMatrix = new THREE.Matrix4().lookAt(camera.position, lookTarget, pUp);
        const targetCamQuat = new THREE.Quaternion().setFromRotationMatrix(tempMatrix);
        camera.quaternion.slerp(targetCamQuat, 5 * delta);
    })

    return (
        <group ref={group}>
            <primitive object={scene} scale={2} position={[0, 0, 0]} />
        </group>
    )
}

useGLTF.preload('/model/nasaka.glb')
