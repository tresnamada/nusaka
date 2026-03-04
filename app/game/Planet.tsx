import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

export const PLANET_RADIUS = 150;

// Simple seeded random to ensure consistent tree positions across files without hydration issues
export function seededRandom(seed: number) {
    return function () {
        seed = Math.sin(seed) * 10000;
        return seed - Math.floor(seed);
    };
}
const rng = seededRandom(42);

export const TREE_COUNT = 1500;
export const TREES_DATA = Array.from({ length: TREE_COUNT }).map(() => {
    const u = rng();
    const v = rng();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);

    const x = PLANET_RADIUS * Math.sin(phi) * Math.cos(theta);
    const y = PLANET_RADIUS * Math.sin(phi) * Math.sin(theta);
    const z = PLANET_RADIUS * Math.cos(phi);

    const position = new THREE.Vector3(x, y, z);
    const normal = position.clone().normalize();
    // Trees grow slightly outward to stay rooted
    position.addScaledVector(normal, 0);

    const scale = 3.0 + rng() * 2.0;
    const rotationY = rng() * Math.PI * 2;

    return { position, normal, scale, rotationY };
}).filter(tree => {
    // Prevent trees from spawning exactly at the player spawn point 
    // Player spawns at (0, PLANET_RADIUS, 0)
    const spawnPoint = new THREE.Vector3(0, PLANET_RADIUS, 0);
    const distanceToSpawn = tree.position.distanceTo(spawnPoint);

    // Clear a safe radius of 80 units around the spawn to keep both player and camera clear
    return distanceToSpawn > 80;
});

function Trees() {
    const { nodes, materials } = useGLTF('/model/pohon.glb') as any;
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const { camera } = useThree();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Find the first mesh geometry in the GLTF
    const treeMesh = useMemo(() => {
        return Object.values(nodes).find((n: any) => n.geometry !== undefined) as THREE.Mesh;
    }, [nodes]);

    const toonMaterial = useMemo(() => {
        if (!treeMesh || !treeMesh.material) return new THREE.MeshToonMaterial({ color: '#2d6a4f' });
        const oldMat = treeMesh.material as THREE.MeshStandardMaterial;

        const newMat = new THREE.MeshToonMaterial({
            map: oldMat.map,
            color: oldMat.color,
            transparent: false,
            depthWrite: true,
            alphaTest: 0.5,
            side: THREE.DoubleSide
        });

        // Disable filtering to prevent pixel bleeding (like on the player model)
        if (newMat.map) {
            newMat.map.generateMipmaps = false;
            newMat.map.minFilter = THREE.NearestFilter;
            newMat.map.magFilter = THREE.NearestFilter;
            newMat.map.anisotropy = 1;
            newMat.map.needsUpdate = true;
        }
        return newMat;
    }, [treeMesh]);

    useFrame(() => {
        if (!meshRef.current || !treeMesh) return;

        TREES_DATA.forEach((tree, i) => {
            // Culling: Only render trees within a safe distance from the camera
            // to save GPU overhead from processing too many shadows
            const dist = camera.position.distanceTo(tree.position);

            if (dist < 180) { // Render radius
                dummy.position.copy(tree.position);
                dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tree.normal);
                dummy.rotateY(tree.rotationY);
                dummy.scale.setScalar(tree.scale);
                dummy.updateMatrix();
                meshRef.current!.setMatrixAt(i, dummy.matrix);
            } else {
                // Shrink to 0 so it's culled by the GPU entirely
                dummy.scale.setScalar(0);
                dummy.updateMatrix();
                meshRef.current!.setMatrixAt(i, dummy.matrix);
            }
        });
        meshRef.current!.instanceMatrix.needsUpdate = true;
    });

    if (!treeMesh) return null;

    return (
        <instancedMesh
            ref={meshRef}
            args={[treeMesh.geometry, toonMaterial, TREE_COUNT]}
            castShadow
            receiveShadow
        />
    );
}

export default function Planet() {
    const planetRef = useRef<THREE.Mesh>(null)

    const grassTexture = useMemo(() => {
        if (typeof document === 'undefined') return null; // SSR safety

        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Base bright green grass color
        ctx.fillStyle = '#8BC34A';
        ctx.fillRect(0, 0, 128, 128);

        // Darker grass pattern (Animal Crossing style triangles)
        ctx.fillStyle = '#7CB342';

        // Helper to draw a small triangle
        const drawTriangle = (x: number, y: number) => {
            ctx.beginPath();
            ctx.moveTo(x, y - 10);
            ctx.lineTo(x - 10, y + 10);
            ctx.lineTo(x + 10, y + 10);
            ctx.fill();
        }

        // Helper to draw a small circle
        const drawCircle = (x: number, y: number) => {
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        drawTriangle(32, 32);
        drawTriangle(96, 96);
        drawCircle(32, 96);
        drawCircle(96, 32);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        // Repeat the pattern many times across the massive 150-radius sphere
        texture.repeat.set(100, 100);

        texture.generateMipmaps = false;
        // Use NearestFilter to strictly keep the pixelated/sharp look preventing blurring
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;

        return texture;
    }, []);

    return (
        <group>
            <mesh ref={planetRef} position={[0, 0, 0]} receiveShadow>
                <sphereGeometry args={[PLANET_RADIUS, 128, 128]} />
                {grassTexture ? (
                    <meshToonMaterial map={grassTexture} color="#ffffff" />
                ) : (
                    <meshToonMaterial color="#8BC34A" />
                )}
            </mesh>
            <Trees />
        </group>
    )
}

useGLTF.preload('/model/pohon.glb');
