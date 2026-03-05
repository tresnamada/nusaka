import { useRef, useState, useEffect, useMemo, useLayoutEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useAnimations, Hud, OrthographicCamera } from '@react-three/drei'
import * as THREE from 'three'
import { PLANET_RADIUS, TREES_DATA, KOMODO_DATA, ORANGUTAN_DATA, RAJAWALI_DATA } from './Planet'
import { useJoystickStore } from './store'

function MinimapGlobe({ playerPosition }: { playerPosition: React.MutableRefObject<THREE.Vector3> }) {
    const globeRef = useRef<THREE.Mesh>(null)
    const blipRef = useRef<THREE.Mesh>(null)

    // Instanced mesh refs for performance
    const treeMeshRef = useRef<THREE.InstancedMesh>(null);
    const animalMeshRef = useRef<THREE.InstancedMesh>(null);
    const { camera } = useThree();

    // Compute instanced positions exactly once
    useLayoutEffect(() => {
        const dummy = new THREE.Object3D();

        if (treeMeshRef.current) {
            const visibleTrees = TREES_DATA.filter((_, i) => i % 5 === 0);
            visibleTrees.forEach((tree, i) => {
                dummy.position.copy(tree.position.clone().normalize());
                dummy.updateMatrix();
                treeMeshRef.current!.setMatrixAt(i, dummy.matrix);
            });
            treeMeshRef.current.instanceMatrix.needsUpdate = true;
        }

        if (animalMeshRef.current) {
            const animals = [...KOMODO_DATA, ...ORANGUTAN_DATA, ...RAJAWALI_DATA];
            animals.forEach((animal, i) => {
                dummy.position.copy(animal.position.clone().normalize());
                dummy.updateMatrix();
                animalMeshRef.current!.setMatrixAt(i, dummy.matrix);
            });
            animalMeshRef.current.instanceMatrix.needsUpdate = true;
        }
    }, [])

    useFrame(() => {
        if (!globeRef.current || !blipRef.current) return;

        // The globe itself rotates to always show the player at the center closest to the camera (+Z)
        // The globe rotating logic needs to be rock-solid to avoid spinning at poles
        const playerDir = playerPosition.current.clone().normalize();

        // 1. Get the direction the camera is looking, projected FLAT onto the planet's surface at the player's position
        let camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        camForward.projectOnPlane(playerDir).normalize();

        // Handle pole singularity just in case
        if (camForward.lengthSq() < 0.001) camForward.set(1, 0, 0);

        // 2. Calculate the perpendicular 'right' vector on the planet's surface
        const camRight = new THREE.Vector3().crossVectors(camForward, playerDir).normalize();

        // 3. Construct a rotation matrix that represents the globe mapping perfectly into the UI space
        // In the UI space: 
        // +X (Right on screen) = camRight
        // +Y (Up on screen)    = camForward (because camera forward goes UP on the 2D map)
        // +Z (Towards user)    = playerDir (because we look top-down down the player's normal)
        const m = new THREE.Matrix4().makeBasis(camRight, camForward, playerDir);

        // We invert it, because we are rotating the GLOBE in the opposite direction 
        // to keep the player stationary at the top-down +Z center
        globeRef.current.quaternion.setFromRotationMatrix(m).invert();

        // Player pin always hovers exactly in the center of the minimap
        blipRef.current.position.set(0, 0, 1.15);
        // Point the cone forwards
        blipRef.current.rotation.set(-Math.PI / 2, 0, 0);
    })

    return (
        <Hud>
            <OrthographicCamera makeDefault position={[0, 0, 5]} zoom={50} />
            <ambientLight intensity={1} />
            <directionalLight position={[2, 5, 2]} intensity={2} />

            <group position={[-window.innerWidth / 100 + 1.5, window.innerHeight / 100 - 1.5, 0]}>
                {/* Background Globe representing the planet */}
                <mesh ref={globeRef}>
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshStandardMaterial color="#8BC34A" />

                    {/* Simplified Trees as instanced dots on the globe */}
                    <instancedMesh ref={treeMeshRef} args={[undefined as any, undefined as any, Math.ceil(TREES_DATA.length / 5)]}>
                        <boxGeometry args={[0.05, 0.05, 0.05]} />
                        <meshBasicMaterial color="#2d6a4f" />
                    </instancedMesh>

                    {/* Simplified Animals as instanced dots on the globe */}
                    <instancedMesh ref={animalMeshRef} args={[undefined as any, undefined as any, KOMODO_DATA.length + ORANGUTAN_DATA.length + RAJAWALI_DATA.length]}>
                        <boxGeometry args={[0.08, 0.08, 0.08]} />
                        <meshBasicMaterial color="#FF5722" />
                    </instancedMesh>
                </mesh>

                {/* Player Blip (static at center, pointing UP representing forward) */}
                <mesh ref={blipRef}>
                    <coneGeometry args={[0.08, 0.25, 16]} />
                    <meshBasicMaterial color="#FFEB3B" />
                </mesh>

                {/* Outline ring */}
                <mesh>
                    <ringGeometry args={[1.1, 1.15, 64]} />
                    <meshBasicMaterial color="rgba(255,255,255,0.5)" transparent />
                </mesh>
            </group>
        </Hud>
    )
}

function CartoonSmoke({ playerPosition, isMoving }: { playerPosition: React.MutableRefObject<THREE.Vector3>, isMoving: boolean }) {
    const COUNT = 25;
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Store particle data
    const particles = useRef([...Array(COUNT)].map(() => ({
        active: false,
        progress: 0,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        scaleMod: Math.random() * 0.5 + 0.5,
        speed: Math.random() * 0.5 + 1.0
    })));

    const spawnTimer = useRef(0);
    const particleIndex = useRef(0);

    useFrame((_, delta) => {
        if (!meshRef.current) return;

        // Spawning
        spawnTimer.current += delta;
        if (isMoving && spawnTimer.current > 0.01) {
            spawnTimer.current = 0;
            const p = particles.current[particleIndex.current];
            p.active = true;
            p.progress = 0;

            // Spawn at player feet with jitter
            const jitter = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ).normalize();

            const up = playerPosition.current.clone().normalize();

            p.position.copy(playerPosition.current).addScaledVector(jitter, 0.5).addScaledVector(up, 0.2);

            // Safety initialization for React hot-reloading (since useRef persists old state)
            if (!p.velocity) p.velocity = new THREE.Vector3();

            // Give outward and upward velocity so they drift apart naturally instead of clustering
            p.velocity.copy(jitter).multiplyScalar(1.5).addScaledVector(up, 1.0);

            p.scaleMod = Math.random() * 0.5 + 0.5;
            p.speed = Math.random() * 2.0 + 2.0;

            particleIndex.current = (particleIndex.current + 1) % COUNT;
        }

        // Updating
        particles.current.forEach((p, i) => {
            if (p.active) {
                p.progress += delta * p.speed;

                if (p.progress >= 1) {
                    p.active = false;
                    dummy.scale.set(0, 0, 0);
                    dummy.updateMatrix();
                    meshRef.current!.setMatrixAt(i, dummy.matrix);
                } else {
                    if (p.velocity) {
                        p.position.addScaledVector(p.velocity, delta);
                        // Slow down velocity over time (air drag)
                        p.velocity.multiplyScalar(0.95);
                    }

                    const scale = Math.sin(p.progress * Math.PI) * 0.4 * p.scaleMod;

                    dummy.position.copy(p.position);
                    dummy.scale.setScalar(scale);
                    dummy.updateMatrix();
                    meshRef.current!.setMatrixAt(i, dummy.matrix);
                }
            } else {
                dummy.scale.set(0, 0, 0);
                dummy.updateMatrix();
                meshRef.current!.setMatrixAt(i, dummy.matrix);
            }
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, COUNT]} frustumCulled={false}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshToonMaterial color="#dddddd" transparent opacity={1} depthWrite={false} />
        </instancedMesh>
    );
}

export default function Player() {
    const group = useRef<THREE.Group>(null)
    const lightGroupRef = useRef<THREE.Group>(null)

    // Load model and animations
    const { scene, animations } = useGLTF('/model/nasaka.glb')
    const { actions } = useAnimations(animations, group)

    // Movement state
    const [movement, setMovement] = useState({ forward: 0, right: 0 })
    const { forward: jF, right: jR, menuState } = useJoystickStore()

    // Track player position on sphere
    const playerPosition = useRef(new THREE.Vector3(0, PLANET_RADIUS, 0))
    // Track continuous camera direction to prevent gimbal lock / sudden flips at poles
    const cameraForward = useRef(new THREE.Vector3(0, 0, -1))
    // Target rotation for smooth turning
    const targetRotation = useRef(new THREE.Quaternion())

    // Handle keyboard
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (menuState !== 'playing') return;
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
    }, [menuState])

    // Animation logic
    const currentAction = useRef<string | null>(null)

    useEffect(() => {
        const isRunning = (movement.forward !== 0 || movement.right !== 0 || jF !== 0 || jR !== 0) && menuState === 'playing';

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
                // Speed up the animation slightly for a snappier feel
                targetAction.setEffectiveTimeScale(1.3);
            }

            currentAction.current = targetActionName;
        }
    }, [movement, jF, jR, actions, menuState])

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

                // Prevent WebGL texture atlas bleeding (red background leaking into UV seams)
                if (oldMat.map) {
                    oldMat.map.generateMipmaps = false;
                    oldMat.map.minFilter = THREE.NearestFilter; // Point filtering entirely stops sub-pixel bleeding
                    oldMat.map.magFilter = THREE.NearestFilter; // Point filtering entirely stops sub-pixel bleeding
                    oldMat.map.anisotropy = 1; // Disable anisotropic filtering to prevent wider sampling footprints
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

        const { menuState } = useJoystickStore.getState();
        const speed = 12;

        // Combine Keyboard and Joystick inputs
        const joystick = useJoystickStore.getState();
        const combinedForward = movement.forward + joystick.forward;
        const combinedRight = movement.right + joystick.right;

        const isMoving = combinedForward !== 0 || combinedRight !== 0;

        // 1. Calculate input direction relative to the camera
        // Camera's forward vector projected onto the tangent plane of the sphere at player's position
        const surfaceNormal = playerPosition.current.clone().normalize();
        const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        camForward.projectOnPlane(surfaceNormal).normalize();
        const camRight = new THREE.Vector3().crossVectors(camForward, surfaceNormal).normalize();

        const inputDir = new THREE.Vector3()
            .addScaledVector(camForward, combinedForward)
            .addScaledVector(camRight, combinedRight);

        if (inputDir.lengthSq() > 0) {
            inputDir.normalize();
        }

        // 2. Move player position along the sphere
        if (isMoving && menuState === 'playing') {
            const nextPos = playerPosition.current.clone().addScaledVector(inputDir, speed * delta);
            nextPos.normalize().multiplyScalar(PLANET_RADIUS);

            // Check collisions against a unified list of solid objects
            const colliders = [
                ...TREES_DATA.map(t => ({ pos: t.position, radius: t.scale * 0.8 })),
                ...KOMODO_DATA.map(k => ({ pos: k.position, radius: 2.5 })), // Reduced Komodo
                ...ORANGUTAN_DATA.map(o => ({ pos: o.position, radius: 2.5 })), // Reduced OrangUtan
                ...RAJAWALI_DATA.map(r => ({ pos: r.position, radius: 1.5 })) // Reduced Rajawali heavily
            ];

            for (let i = 0; i < colliders.length; i++) {
                const col = colliders[i];
                // Ignore height diffs for simple sphere pushing
                const p1 = nextPos.clone().normalize();
                const p2 = col.pos.clone().normalize();
                const distSq = p1.distanceToSquared(p2) * PLANET_RADIUS * PLANET_RADIUS;

                if (distSq < col.radius * col.radius) {
                    const slideDir = nextPos.clone().sub(col.pos).normalize();
                    nextPos.addScaledVector(slideDir, speed * delta);
                    nextPos.normalize().multiplyScalar(PLANET_RADIUS);
                    break;
                }
            }

            playerPosition.current.copy(nextPos);

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
        const IsCreating = menuState === 'create_character';

        // Camera stays at a fixed orientation relative to the world, just moving along the sphere surface
        const offsetDistance = IsCreating ? 6 : 15; // Pulled closer for character creation
        const offsetHeight = IsCreating ? 1.5 : 10;   // Lower angle for character creation

        const pUp = playerPosition.current.clone().normalize();

        // Smooth camera rotation using parallel transport to avoid 180-degree flips at the poles
        let currentCamForward = cameraForward.current.clone().projectOnPlane(pUp).normalize();

        // Edge case fallback
        if (currentCamForward.lengthSq() < 0.001) {
            currentCamForward = new THREE.Vector3(1, 0, 0).projectOnPlane(pUp).normalize();
        }

        // Only rotate the camera slightly when moving to follow behind the player organically
        if (isMoving && !IsCreating) {
            currentCamForward.lerp(inputDir, 1 * delta).normalize();
        }

        cameraForward.current.copy(currentCamForward);

        const idealCameraPos = playerPosition.current.clone()
            .addScaledVector(currentCamForward, -offsetDistance) // Move behind the player (South)
            .addScaledVector(pUp, offsetHeight);        // Move up away from the surface

        camera.position.lerp(idealCameraPos, 5 * delta);

        // Camera smoothly looks at the player (slightly above)
        // Adjust look target so player is centered in character creation
        const lookTarget = playerPosition.current.clone()
            .addScaledVector(pUp, IsCreating ? 1.5 : 1)
            .addScaledVector(currentCamForward, IsCreating ? 0 : 4);

        const tempMatrix = new THREE.Matrix4().lookAt(camera.position, lookTarget, pUp);
        const targetCamQuat = new THREE.Quaternion().setFromRotationMatrix(tempMatrix);
        camera.quaternion.slerp(targetCamQuat, 5 * delta);

        // 4. Update dynamic sun light for shadows
        if (lightGroupRef.current) {
            lightGroupRef.current.position.copy(playerPosition.current);
            // Align local Y axis to the surface normal, so the light always shines down
            lightGroupRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pUp);
        }
    })

    return (
        <>
            {/* Dynamic Sun Light that follows the player on the sphere */}
            <group ref={lightGroupRef}>
                <directionalLight
                    position={[30, 40, 20]}
                    intensity={2.5}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                    shadow-camera-left={-40}
                    shadow-camera-right={40}
                    shadow-camera-top={40}
                    shadow-camera-bottom={-40}
                    shadow-camera-near={0.1}
                    shadow-camera-far={100}
                    shadow-bias={-0.001}
                />
            </group>

            <group ref={group}>
                <primitive object={scene} scale={2} position={[0, 0, 0]} />
            </group>

            <CartoonSmoke
                playerPosition={playerPosition}
                isMoving={menuState === 'playing' && (movement.forward !== 0 || movement.right !== 0 || useJoystickStore.getState().forward !== 0 || useJoystickStore.getState().right !== 0)}
            />

            {menuState === 'playing' && <MinimapGlobe playerPosition={playerPosition} />}
        </>
    )
}

useGLTF.preload('/model/nasaka.glb')
