import { useRef, Suspense } from 'react';
import { RigidBody, RapierRigidBody, CuboidCollider } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import { useKeyboardRef } from '../hooks/useKeyboard';
import { useGameStore } from '../store/useGameStore';
import { Lamborghini } from './Lamborghini.tsx';
import * as THREE from 'three';

// ── Tunables ──
const ACCELERATION = 80;
const BRAKE_DECEL = 60;
const MAX_SPEED = 110;
const REVERSE_MAX = 40;
const ROLLING_FRICTION = 0.985;
const MASS = 2;

// Dirección
const STEER_MAX_LOW = 3.6;        // rad/s de giro a baja velocidad (ágil)
const STEER_MAX_HIGH = 1.4;       // rad/s de giro a alta velocidad (estable)
const STEER_SPEED_BLEND = 30;     // velocidad a la que se interpola entre LOW y HIGH
const STEER_INPUT_LERP = 10;      // suavizado del input (mayor = más directo)
const STEER_RETURN_SPEED = 4;     // velocidad a la que el volante regresa al centro

// Agarre
const GRIP_LOW_SPEED = 0.97;      // agarre lateral a baja velocidad (casi total)
const GRIP_HIGH_SPEED = 0.82;     // agarre lateral a alta velocidad (permite drift)
const GRIP_SPEED_BLEND = 50;      // velocidad a la que baja el agarre
const DRIFT_THRESHOLD = 15;       // velocidad lateral a partir de la que "sientes" el drift

export function Car() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const keysRef = useKeyboardRef();
  const { setPlayerPosition, setVelocity, setSteerInput } = useGameStore();
  const steerAngle = useRef(-Math.PI / 2); // mirando +X (dirección de la recta de meta)
  const smoothSteer = useRef(0);   // input suavizado -1..+1

  useFrame((_, delta) => {
    const rb = rigidBodyRef.current;
    if (!rb) return;

    const dt = Math.min(delta, 0.05);
    const linvel = rb.linvel();
    const speed = Math.sqrt(linvel.x * linvel.x + linvel.z * linvel.z);

    // ── Input de dirección suavizado ──
    const k = keysRef.current;
    let rawSteer = 0;
    if (k.left) rawSteer = 1;
    if (k.right) rawSteer = -1;

    // Lerp suave hacia el input
    smoothSteer.current += (rawSteer - smoothSteer.current) * Math.min(STEER_INPUT_LERP * dt, 1);
    // Umbral para evitar micro-drift
    if (Math.abs(smoothSteer.current) < 0.01) smoothSteer.current = 0;

    setSteerInput(smoothSteer.current);

    // Calcular forward provisional para saber si vamos hacia adelante o atrás
    const prevQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      steerAngle.current,
    );
    const prevFwd = new THREE.Vector3(0, 0, 1).applyQuaternion(prevQuat);
    prevFwd.y = 0; prevFwd.normalize();
    const fwdSpeed = prevFwd.x * linvel.x + prevFwd.z * linvel.z;
    const goingBackward = fwdSpeed < -0.5;

    // ── Velocidad de giro dependiente de la velocidad ──
    const speedT = Math.min(speed / STEER_SPEED_BLEND, 1);
    const steerRate = STEER_MAX_LOW + (STEER_MAX_HIGH - STEER_MAX_LOW) * speedT;

    // No gira si está quieto
    const moveFactor = Math.min(speed / 3, 1);

    // En reversa el giro se invierte (como un auto real)
    const steerDir = goingBackward ? -1 : 1;

    if (Math.abs(smoothSteer.current) > 0.01) {
      steerAngle.current += steerRate * dt * smoothSteer.current * moveFactor * steerDir;
    } else if (speed > 0.5 && !goingBackward) {
      // Auto-centrar: solo cuando vamos HACIA ADELANTE y no giramos
      const returnRate = STEER_RETURN_SPEED * dt;
      const velAngle = Math.atan2(linvel.x, linvel.z);
      let angleDiff = velAngle - steerAngle.current;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      steerAngle.current += angleDiff * Math.min(returnRate, 1);
    }

    // Aplicar rotación
    const quat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      steerAngle.current,
    );
    rb.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w }, true);
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true);

    // Vectores locales
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
    forward.y = 0; forward.normalize();
    right.y = 0; right.normalize();

    let targetAccel = 0;
    if (k.forward) {
      // Reducir aceleración progresivamente a mayor velocidad
      const accelFalloff = 1 - Math.pow(speed / MAX_SPEED, 2) * 0.6;
      targetAccel = ACCELERATION * Math.max(accelFalloff, 0.3);
    }
    if (k.backward) {
      if (fwdSpeed > 0.5) {
        targetAccel = -BRAKE_DECEL;
      } else {
        targetAccel = -ACCELERATION * 0.5;
      }
    }

    let vx = linvel.x + forward.x * targetAccel * dt;
    let vy = linvel.y;
    let vz = linvel.z + forward.z * targetAccel * dt;

    // ── Agarre lateral dinámico ──
    const gripT = Math.min(speed / GRIP_SPEED_BLEND, 1);
    const grip = GRIP_LOW_SPEED + (GRIP_HIGH_SPEED - GRIP_LOW_SPEED) * gripT;

    const fwd = forward.x * vx + forward.z * vz;
    const lat = right.x * vx + right.z * vz;

    // Efecto drift: si hay mucha velocidad lateral y estamos girando,
    // dejar un poco más de deslizamiento para que se sienta el drift
    let effectiveGrip = grip;
    if (Math.abs(lat) > DRIFT_THRESHOLD && Math.abs(smoothSteer.current) > 0.3) {
      effectiveGrip *= 0.85; // un poco menos de agarre en drift
    }

    const correctedLat = lat * (1 - effectiveGrip);
    vx = forward.x * fwd + right.x * correctedLat;
    vz = forward.z * fwd + right.z * correctedLat;

    // Fricción de rodadura
    vx *= ROLLING_FRICTION;
    vz *= ROLLING_FRICTION;

    // Limitar velocidades
    const horizSpeed = Math.sqrt(vx * vx + vz * vz);
    if (horizSpeed > MAX_SPEED) {
      const s = MAX_SPEED / horizSpeed;
      vx *= s;
      vz *= s;
    }
    const newFwd = forward.x * vx + forward.z * vz;
    if (newFwd < -REVERSE_MAX) {
      const s = REVERSE_MAX / Math.abs(newFwd);
      vx *= s;
      vz *= s;
    }

    rb.setLinvel({ x: vx, y: vy, z: vz }, true);

    const pos = rb.translation();
    const vel = rb.linvel();
    setPlayerPosition([pos.x, pos.y, pos.z]);
    setVelocity([vel.x, vel.y, vel.z]);
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={false}
      position={[30, 0.55, 0]}
      rotation={[0, -Math.PI / 2, 0]}
      mass={MASS}
      restitution={0.15}
      friction={0.9}
      linearDamping={0}
      angularDamping={0.3}
      enabledRotations={[false, true, false]}
      canSleep={false}
    >
      <CuboidCollider args={[0.6, 0.25, 1.2]} position={[0, 0, 0]} />
      <Suspense fallback={null}>
        <Lamborghini scale={[0.015, 0.015, 0.015]} position={[0, 0.75, 0]} rotation={[0, 0, 0]} />
      </Suspense>
    </RigidBody>
  );
}
