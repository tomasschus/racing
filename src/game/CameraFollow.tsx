import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useGameStore } from "../store/useGameStore";

const LERP_FACTOR = 0.12;
const HEIGHT_OFFSET = 3.5;
const DISTANCE_OFFSET = 10;
const MOUSE_SENSITIVITY = 0.004;
const VERTICAL_MIN = 0.15;
const VERTICAL_MAX = Math.PI * 0.45;
const ZOOM_MIN = 4;
const ZOOM_MAX = 60;
const ZOOM_SENSITIVITY = 0.001;

export function CameraFollow() {
  const { camera, gl } = useThree();
  const targetPos = useRef(
    new THREE.Vector3(0, HEIGHT_OFFSET, DISTANCE_OFFSET),
  );
  const currentPos = useRef(
    new THREE.Vector3(0, HEIGHT_OFFSET, DISTANCE_OFFSET),
  );

  // Órbita con el ratón: ángulo horizontal, vertical y distancia
  const orbitTheta = useRef(0);
  const orbitPhi = useRef(Math.PI * 0.2);
  const orbitDistance = useRef(DISTANCE_OFFSET);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 0) {
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      orbitTheta.current -= dx * MOUSE_SENSITIVITY;
      orbitPhi.current = THREE.MathUtils.clamp(
        orbitPhi.current + dy * MOUSE_SENSITIVITY,
        VERTICAL_MIN,
        VERTICAL_MAX,
      );
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.button === 0) isDragging.current = false;
    };

    const onPointerLeave = () => {
      isDragging.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbitDistance.current = THREE.MathUtils.clamp(
        orbitDistance.current + e.deltaY * ZOOM_SENSITIVITY * orbitDistance.current,
        ZOOM_MIN,
        ZOOM_MAX,
      );
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [gl]);

  useFrame(() => {
    const [px, py, pz] = useGameStore.getState().playerPosition;
    const [vx, , vz] = useGameStore.getState().velocity;

    const speed = Math.sqrt(vx * vx + vz * vz);

    if (isDragging.current) {
      // Modo órbita: posición esférica alrededor del coche
      const r = orbitDistance.current;
      targetPos.current.set(
        px + r * Math.sin(orbitPhi.current) * Math.sin(orbitTheta.current),
        py + HEIGHT_OFFSET + r * Math.cos(orbitPhi.current),
        pz + r * Math.sin(orbitPhi.current) * Math.cos(orbitTheta.current),
      );
    } else {
      // Modo follow: detrás del coche según la velocidad
      const dir =
        speed > 0.1
          ? new THREE.Vector3(-vx, 0, -vz).normalize()
          : new THREE.Vector3(
              Math.sin(orbitTheta.current),
              0,
              Math.cos(orbitTheta.current),
            );
      dir.normalize();

      // Sincronizar ángulo horizontal con la dirección del coche cuando no arrastramos
      if (speed > 0.1) {
        orbitTheta.current = Math.atan2(-vx, -vz);
      }

      targetPos.current.set(
        px + dir.x * orbitDistance.current,
        py + Math.min(HEIGHT_OFFSET + speed * 0.2, 12),
        pz + dir.z * orbitDistance.current,
      );
    }

    currentPos.current.lerp(targetPos.current, LERP_FACTOR);
    camera.position.copy(currentPos.current);
    camera.lookAt(px, py + 0.8, pz);
  });

  return null;
}
