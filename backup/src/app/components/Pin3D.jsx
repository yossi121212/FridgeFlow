'use client';

import React, { useRef } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';

// Updated 3D pushpin with a top-down view - small circle above a larger one
function PushPin({ color }) {
  // Convert color to THREE.Color and create material variations
  const baseColor = new THREE.Color(color);
  
  return (
    <group position={[0, 0.2, 0]} rotation={[0.25, 0.2, 0.1]} scale={0.65}>
      {/* Dome-shaped head */}
      <mesh castShadow position={[0, 0.25, 0]}>
        <sphereGeometry 
          args={[0.48, 64, 64, 0, Math.PI * 2, 0, Math.PI * 0.7]} 
        />
        <meshPhysicalMaterial
          color={baseColor}
          roughness={0.4}
          metalness={0.05}
          clearcoat={0.3}
          clearcoatRoughness={0.4}
          envMapIntensity={0.7}
          sheen={0.1}
          sheenRoughness={0.9}
        />
      </mesh>

      {/* Cylindrical base */}
      <mesh castShadow position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.42, 0.38, 0.18, 32, 2]} />
        <meshPhysicalMaterial
          color={baseColor}
          roughness={0.5}
          metalness={0.05}
          clearcoat={0.2}
          clearcoatRoughness={0.5}
          envMapIntensity={0.6}
        />
      </mesh>

      {/* Subtle highlight */}
      <mesh position={[0.12, 0.45, 0.12]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial
          color="white"
          transparent={true}
          opacity={0.08}
        />
      </mesh>

      {/* Ground shadow */}
      <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 2.5]} />
        <shadowMaterial transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

export default function Pin3D({ color }) {
  // Modern, matte color palette
  let pinColorHex;
  switch (color) {
    case 'orange': pinColorHex = '#FF7755'; break; // Warmer, softer orange
    case 'blue': pinColorHex = '#4C8BF5'; break;   // Modern blue
    case 'purple': pinColorHex = '#9B6DFF'; break;  // Softer purple
    case 'green': pinColorHex = '#2ECE9D'; break;   // Fresh mint green
    case 'black': pinColorHex = '#2D3436'; break;   // Soft black
    default: pinColorHex = '#2D3436';
  }
  
  return (
    <div className="pin-wrapper" style={{ width: '60px', height: '60px', position: 'relative', top: '-20px' }}>
      <Canvas 
        className="pin-canvas"
        camera={{ position: [0, 1, 3.5], fov: 28 }}
        shadows
      >
        {/* Soft ambient light */}
        <ambientLight intensity={0.5} />
        
        {/* Main directional light for shadows */}
        <directionalLight
          position={[4, 6, 4]}
          intensity={0.7}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        
        {/* Fill light for subtle highlights */}
        <directionalLight
          position={[-2, 3, -2]}
          intensity={0.25}
        />
        
        {/* Rim light for edge definition */}
        <directionalLight
          position={[-1, 2, 4]}
          intensity={0.3}
        />

        <PushPin color={pinColorHex} />
      </Canvas>
    </div>
  );
} 