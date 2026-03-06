'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';

function Model() {
  const { scene } = useGLTF('/model/nasaka.glb');
  return <primitive object={scene} scale={2.8} />;
}

const CharacterViewer = () => {
  return (
    <div className="w-full h-[450px] md:h-[500px] lg:h-[650px]  rounded-[40px] shadow-[0_20px_40px_rgba(23,103,15,0.15)] p-2 relative overflow-hidden group border-4 border-white/40">
      <div className="absolute top-8 left-8 z-10">
        <h2 className="text-[#17670f] font-black text-3xl drop-shadow-sm tracking-tight">Avatar Saya</h2>
      </div>
      <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(255,255,255,0.3)] rounded-[36px] pointer-events-none"></div>

      <div className="w-full h-full cursor-grab active:cursor-grabbing rounded-[32px] overflow-hidden">
        <Canvas shadows camera={{ position: [0, 1.5, 7], fov: 45 }}>
          <Suspense fallback={null}>
            <Environment preset="city" />
            
            {/* By putting the model in a group, we can offset it downwards manually */}
            <group position={[0, -2.5, 0]}>
              <Model />
              {/* Contact shadows give a grounded feeling beneath the character's feet */}
              <ContactShadows 
                position={[0, 0, 0]} 
                opacity={0.6} 
                scale={10} 
                blur={2.5} 
                far={4} 
              />
            </group>

            {/* Orbit target sits a bit above the offset, pushing the character lower visually */}
            <OrbitControls 
              enableZoom={true} 
              enablePan={false} 
              minDistance={3} 
              maxDistance={12} 
              maxPolarAngle={Math.PI / 2 + 0.1} 
              target={[0, 0, 0]}
              makeDefault 
              autoRotate
              autoRotateSpeed={0.5}
            />
          </Suspense>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        </Canvas>
      </div>
      
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
         <span className="bg-white/30 backdrop-blur-md text-[#17670f] text-lg font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-white/50 shadow-md">
           Interact to explore
         </span>
      </div>
    </div>
  );
};

export default CharacterViewer;
