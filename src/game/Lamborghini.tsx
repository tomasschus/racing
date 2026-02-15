import { useGLTF } from "@react-three/drei";
import { applyProps, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "../store/useGameStore";

useGLTF.preload("/lambo.glb");

interface LamborghiniProps {
  scale?: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
}

const MAX_FRONT_STEER = 0.4; // radianes máx giro visual delanteras
const WHEEL_CIRCUMFERENCE = 2; // factor de velocidad de spin (ajustar a gusto)

// Nombres exactos de los nodos de ruedas en el GLB
const WHEEL_NAMES: { name: string; isFront: boolean; side: "L" | "R" }[] = [
  { name: "FL", isFront: true, side: "L" },
  { name: "FR", isFront: true, side: "R" },
  { name: "RL", isFront: false, side: "L" },
  { name: "RR", isFront: false, side: "R" },
];

// Sacar las ruedas hacia fuera para que no se vean incrustadas en la carrocería
const WHEEL_OUTWARD_OFFSET = 0.48;

interface WheelData {
  obj: THREE.Object3D;
  isFront: boolean;
  origQuat: THREE.Quaternion;
  localSpinAxis: THREE.Vector3; // eje local del axle (calculado)
  localSteerAxis: THREE.Vector3; // eje local de dirección (calculado)
}

export function Lamborghini({
  scale = [1, 1, 1],
  position,
  rotation,
}: LamborghiniProps) {
  const { scene, nodes, materials } = useGLTF("/lambo.glb") as unknown as {
    scene: THREE.Group;
    nodes: Record<string, THREE.Object3D & { isMesh?: boolean; geometry?: THREE.BufferGeometry; material?: THREE.Material }>;
    materials: Record<string, THREE.Material>;
  };

  const wheels = useRef<WheelData[]>([]);
  const spinAngle = useRef(0);

  useMemo(() => {
    // ── Materiales ──
    Object.values(nodes).forEach((node) => {
      if (node.isMesh && node.geometry) {
        if (node.name.startsWith("glass")) node.geometry.computeVertexNormals();
        if (node.name === "silver_001_BreakDiscs_0" && materials.BreakDiscs)
          node.material = applyProps(materials.BreakDiscs.clone(), {
            color: "#ddd",
          });
      }
    });
    if (nodes["glass_003"]) nodes["glass_003"].scale.setScalar(2.7);
    if (materials.FrameBlack)
      applyProps(materials.FrameBlack, {
        metalness: 0.75,
        roughness: 0,
        color: "black",
      });
    if (materials.Chrome)
      applyProps(materials.Chrome, {
        metalness: 1,
        roughness: 0,
        color: "#333",
      });
    if (materials.BreakDiscs)
      applyProps(materials.BreakDiscs, {
        metalness: 0.2,
        roughness: 0.2,
        color: "#555",
      });
    if (materials.TiresGum)
      applyProps(materials.TiresGum, {
        metalness: 0,
        roughness: 0.4,
        color: "#181818",
      });
    if (materials.GreyElements)
      applyProps(materials.GreyElements, { metalness: 0, color: "#292929" });
    if (materials.emitbrake)
      applyProps(materials.emitbrake, {
        emissiveIntensity: 3,
        toneMapped: false,
      });
    if (materials.LightsFrontLed)
      applyProps(materials.LightsFrontLed, {
        emissiveIntensity: 3,
        toneMapped: false,
      });
    const yellow = nodes.yellow_WhiteCar_0;
    if (yellow && "material" in yellow) {
      yellow.material = new THREE.MeshPhysicalMaterial({
        roughness: 0.35,
        metalness: 0.15,
        color: "#444",
        envMapIntensity: 1,
        clearcoatRoughness: 0.1,
        clearcoat: 1,
      });
    }

    // ── Detectar ruedas por nombre exacto ──
    // Necesitamos updateMatrixWorld para obtener las orientaciones reales
    scene.updateMatrixWorld(true);

    const found: WheelData[] = [];
    for (const { name, isFront, side } of WHEEL_NAMES) {
      const obj = nodes[name];
      if (!obj) continue;

      // Sacar la rueda hacia fuera para que no quede incrustada en la carrocería
      if (side === "L") obj.position.x -= WHEEL_OUTWARD_OFFSET;
      else obj.position.x += WHEEL_OUTWARD_OFFSET;

      // Guardar quaternion original
      const origQuat = obj.quaternion.clone();

      // Calcular el eje local que corresponde al eje del axle (world X)
      // y el eje de dirección (world Y) en el espacio local de la rueda
      const worldQuat = new THREE.Quaternion();
      obj.getWorldQuaternion(worldQuat);
      const invWorldQuat = worldQuat.clone().invert();

      // Eje del axle en world space es X (izquierda-derecha)
      const localSpinAxis = new THREE.Vector3(1, 0, 0)
        .applyQuaternion(invWorldQuat)
        .normalize();

      // Eje de dirección en world space es Y (arriba)
      const localSteerAxis = new THREE.Vector3(0, 1, 0)
        .applyQuaternion(invWorldQuat)
        .normalize();

      found.push({ obj, isFront, origQuat, localSpinAxis, localSteerAxis });
    }

    wheels.current = found;
  }, [scene, nodes, materials]);

  // ── Girar ruedas cada frame ──
  useFrame((_, delta) => {
    if (wheels.current.length === 0) return;

    const [vx, , vz] = useGameStore.getState().velocity;
    const currentSteer = useGameStore.getState().steerInput;
    const speed = Math.sqrt(vx * vx + vz * vz);

    // Ángulo acumulado
    spinAngle.current += speed * delta * WHEEL_CIRCUMFERENCE;

    const spinQ = new THREE.Quaternion();
    const steerQ = new THREE.Quaternion();
    const composed = new THREE.Quaternion();

    for (const { obj, isFront, origQuat, localSpinAxis, localSteerAxis } of wheels.current) {
      // Spin alrededor del eje local del axle
      spinQ.setFromAxisAngle(localSpinAxis, spinAngle.current);

      if (isFront) {
        // Giro de dirección alrededor del eje local vertical
        steerQ.setFromAxisAngle(localSteerAxis, currentSteer * MAX_FRONT_STEER);
        // Componer: original → steer → spin
        composed.copy(origQuat).multiply(steerQ).multiply(spinQ);
      } else {
        // Solo spin
        composed.copy(origQuat).multiply(spinQ);
      }

      obj.quaternion.copy(composed);
    }
  });

  return (
    <group scale={scale} position={position} rotation={rotation}>
      <primitive object={scene} castShadow receiveShadow />
    </group>
  );
}
