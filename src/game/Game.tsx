import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { MapProvider } from './MapContext';
import { Car } from './Car';
import { Track } from './Track';
import { CameraFollow } from './CameraFollow';
import { RaceManager } from './RaceManager';
import { Minimap } from './Minimap';
import { SpeedDisplay } from './SpeedDisplay';
import { useGameStore } from '../store/useGameStore';

// Offset fijo del sol (dirección de la luz)
const SUN_DIR = new THREE.Vector3(1, 0.7, 0.6).normalize();
const SHADOW_SIZE = 80; // frustum ±80 unidades alrededor del coche

/** Luz direccional que sigue al jugador para sombras de alta calidad */
function SunLight() {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    const light = lightRef.current;
    if (!light) return;
    const [px, , pz] = useGameStore.getState().playerPosition;
    light.position.set(px + SUN_DIR.x * 200, SUN_DIR.y * 200, pz + SUN_DIR.z * 200);
    light.target.position.set(px, 0, pz);
    light.target.updateMatrixWorld();
  });

  return (
    <directionalLight
      ref={lightRef}
      intensity={2}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-near={10}
      shadow-camera-far={500}
      shadow-camera-left={-SHADOW_SIZE}
      shadow-camera-right={SHADOW_SIZE}
      shadow-camera-top={SHADOW_SIZE}
      shadow-camera-bottom={-SHADOW_SIZE}
      shadow-bias={0}
      shadow-normalBias={2}
    />
  );
}

export function Game() {
  const containerRef = useRef<HTMLDivElement>(null);
  const resetRace = useGameStore((s) => s.resetRace);

  useEffect(() => {
    resetRace();
    containerRef.current?.focus();
  }, [resetRace]);

  return (
    <MapProvider>
      <RaceManager />
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <Minimap />
        <SpeedDisplay />
        <div
          ref={containerRef}
          tabIndex={0}
          autoFocus
          style={{ width: '100%', height: '100%', outline: 'none', cursor: 'pointer' }}
          onClick={() => containerRef.current?.focus()}
          onPointerDown={() => containerRef.current?.focus()}
        >
          <Canvas
          shadows="soft"
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          camera={{ fov: 50, near: 0.1, far: 2000 }}
        >
          <color attach="background" args={['#87CEEB']} />
          <Sky
            distance={450000}
            sunPosition={[500, 180, 300]}
            inclination={0.49}
            azimuth={0.15}
            turbidity={3}
            rayleigh={1}
            mieCoefficient={0.003}
            mieDirectionalG={0.8}
          />
          <PhysicsWorld>
            <ambientLight intensity={0.5} />
            <hemisphereLight args={['#b1e1ff', '#44a33a', 0.4]} />
            <SunLight />
            <Environment preset="sunset" />
          <Car />
          <Track />
          <CameraFollow />
        </PhysicsWorld>
        </Canvas>
        </div>
      </div>
    </MapProvider>
  );
}
