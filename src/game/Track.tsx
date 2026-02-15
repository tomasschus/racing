import { useMemo } from 'react';
import { RigidBody, CuboidCollider, CoefficientCombineRule } from '@react-three/rapier';
import * as THREE from 'three';
import { useMap } from './MapContext';

/** Genera una curva suave Catmull-Rom a partir de los puntos 2D del circuito */
function buildTrackCurve(points: [number, number][], segments: number) {
  const pts3d = points.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const curve = new THREE.CatmullRomCurve3(pts3d, true, 'catmullrom', 0.5);
  const sampled = curve.getSpacedPoints(segments);
  return { curve, sampled };
}

/** Genera la geometría del asfalto como un ribbon que sigue la curva */
function buildRoadGeometry(sampled: THREE.Vector3[], halfWidth: number) {
  const count = sampled.length;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < count; i++) {
    const curr = sampled[i];
    const next = sampled[(i + 1) % count];
    const dir = new THREE.Vector3().subVectors(next, curr).normalize();
    const right = new THREE.Vector3(-dir.z, 0, dir.x);

    const l = curr.clone().add(right.clone().multiplyScalar(-halfWidth));
    const r = curr.clone().add(right.clone().multiplyScalar(halfWidth));

    positions.push(l.x, 0.01, l.z);
    positions.push(r.x, 0.01, r.z);

    const t = i / count;
    uvs.push(0, t * count * 0.5);
    uvs.push(1, t * count * 0.5);
  }

  for (let i = 0; i < count; i++) {
    const a = i * 2;
    const b = i * 2 + 1;
    const c = ((i + 1) % count) * 2;
    const d = ((i + 1) % count) * 2 + 1;
    indices.push(a, c, b);
    indices.push(b, c, d);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Genera colliders de pared (segmentos de cuboides) a lo largo de un borde */
function wallSegments(
  sampled: THREE.Vector3[],
  offsetSign: number,
  halfWidth: number,
  wallHeight: number,
  wallThickness: number,
) {
  const segs: { pos: [number, number, number]; halfLen: number; rotY: number }[] = [];
  const step = 4;
  for (let i = 0; i < sampled.length; i += step) {
    const curr = sampled[i];
    const next = sampled[(i + step) % sampled.length];
    const dir = new THREE.Vector3().subVectors(next, curr);
    const len = dir.length();
    dir.normalize();
    const right = new THREE.Vector3(-dir.z, 0, dir.x);
    const mid = curr.clone().add(next).multiplyScalar(0.5);
    mid.add(right.clone().multiplyScalar(offsetSign * (halfWidth + wallThickness / 2 + 0.3)));
    const rotY = Math.atan2(dir.x, dir.z);
    segs.push({
      pos: [mid.x, wallHeight / 2, mid.z],
      halfLen: len / 2 + 0.5,
      rotY,
    });
  }
  return segs;
}

// ─── Centro del circuito (para posicionar suelo y collider) ───
function getTrackCenter(sampled: THREE.Vector3[]) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const p of sampled) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }
  return {
    cx: (minX + maxX) / 2,
    cz: (minZ + maxZ) / 2,
    halfW: (maxX - minX) / 2 + 80,
    halfH: (maxZ - minZ) / 2 + 80,
  };
}

// ─── Componentes de decoración ───

function GroundPlane({ cx, cz, w, h }: { cx: number; cz: number; w: number; h: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.05, cz]}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial color="#111114" roughness={0.95} metalness={0} />
    </mesh>
  );
}

function StartFinishLine({ sampled }: { sampled: THREE.Vector3[] }) {
  // Posicionar en el punto 0 del circuito con la orientación correcta
  const p = sampled[0];
  const next = sampled[1];
  const dir = new THREE.Vector3().subVectors(next, p).normalize();
  const rotY = Math.atan2(dir.x, dir.z);
  return (
    <group position={[p.x, 0, p.z]} rotation={[0, rotY, 0]}>
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[(i - 4.5) * 2.8, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[2.8, 5]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#ffffff' : '#111111'} />
        </mesh>
      ))}
    </group>
  );
}

function CurbStripes({ sampled, halfRoad }: { sampled: THREE.Vector3[]; halfRoad: number }) {
  const stripes: JSX.Element[] = [];
  const step = 8;
  for (let i = 0; i < sampled.length; i += step) {
    const curr = sampled[i];
    const next = sampled[(i + 1) % sampled.length];
    const dir = new THREE.Vector3().subVectors(next, curr).normalize();
    const right = new THREE.Vector3(-dir.z, 0, dir.x);
    const rotY = Math.atan2(dir.x, dir.z);

    for (const sign of [-1, 1]) {
      const p = curr.clone().add(right.clone().multiplyScalar(sign * (halfRoad - 1.2)));
      const color = (i / step) % 2 === 0 ? '#cc2222' : '#f0f0f0';
      stripes.push(
        <mesh
          key={`${i}_${sign}`}
          position={[p.x, 0.025, p.z]}
          rotation={[-Math.PI / 2, 0, rotY]}
          receiveShadow
        >
          <planeGeometry args={[2.8, 3.5]} />
          <meshStandardMaterial color={color} />
        </mesh>,
      );
    }
  }
  return <>{stripes}</>;
}

function CenterLine({ sampled }: { sampled: THREE.Vector3[] }) {
  const dashes: JSX.Element[] = [];
  for (let i = 0; i < sampled.length; i++) {
    if (i % 10 >= 5) continue; // discontinua
    const p = sampled[i];
    const next = sampled[(i + 1) % sampled.length];
    const dir = new THREE.Vector3().subVectors(next, p).normalize();
    const rotY = Math.atan2(dir.x, dir.z);
    dashes.push(
      <mesh key={i} position={[p.x, 0.025, p.z]} rotation={[-Math.PI / 2, 0, rotY]} receiveShadow>
        <planeGeometry args={[0.4, 2.5]} />
        <meshStandardMaterial color="#dddddd" />
      </mesh>,
    );
  }
  return <>{dashes}</>;
}

function Obstacles({ sampled, halfRoad }: { sampled: THREE.Vector3[]; halfRoad: number }) {
  const obstacles: { pos: [number, number, number]; size: [number, number, number]; color: string }[] = [];
  const spots = [40, 100, 180, 260, 340, 420, 500, 580, 660, 740, 820, 900];
  for (const idx of spots) {
    if (idx >= sampled.length) continue;
    const p = sampled[idx % sampled.length];
    const next = sampled[(idx + 1) % sampled.length];
    const dir = new THREE.Vector3().subVectors(next, p).normalize();
    const right = new THREE.Vector3(-dir.z, 0, dir.x);
    const offset = Math.sin(idx * 5.7) * halfRoad * 0.5;
    const pos = p.clone().add(right.clone().multiplyScalar(offset));
    obstacles.push({
      pos: [pos.x, 0.5, pos.z],
      size: [1.8, 1, 2.5],
      color: idx % 3 === 0 ? '#9ca3af' : idx % 3 === 1 ? '#6b7280' : '#ef4444',
    });
  }

  // Collider mucho más grande que la malla: el auto rebota antes de llegar al modelo visible
  const COLLIDER_PADDING = 0.9;
  // Malla a escala reducida para que quede dentro del collider y nunca se vea incrustado
  const VISUAL_SCALE = 0.72;
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        {obstacles.map((o, i) => (
          <CuboidCollider
            key={i}
            args={[
              o.size[0] / 2 + COLLIDER_PADDING,
              o.size[1] / 2 + COLLIDER_PADDING,
              o.size[2] / 2 + COLLIDER_PADDING,
            ]}
            position={o.pos}
            friction={0.4}
            restitution={0.55}
          />
        ))}
      </RigidBody>
      {obstacles.map((o, i) => (
        <mesh key={i} position={o.pos} scale={[VISUAL_SCALE, VISUAL_SCALE, VISUAL_SCALE]} castShadow receiveShadow>
          <boxGeometry args={o.size} />
          <meshStandardMaterial color={o.color} metalness={0.85} roughness={0.25} envMapIntensity={1.2} />
        </mesh>
      ))}
    </>
  );
}

// ─── Track principal ───

export function Track() {
  const map = useMap();
  const SEGMENTS = 1000;
  const halfRoad = map.roadWidth / 2;
  const wallHeight = map.wallHeight ?? 3;
  const wallThickness = map.wallThickness ?? 1.2;

  const { sampled, roadGeo, leftWall, rightWall, center } = useMemo(() => {
    const { sampled } = buildTrackCurve(map.trackPoints, SEGMENTS);
    const roadGeo = buildRoadGeometry(sampled, halfRoad);
    const leftWall = wallSegments(sampled, -1, halfRoad, wallHeight, wallThickness);
    const rightWall = wallSegments(sampled, 1, halfRoad, wallHeight, wallThickness);
    const center = getTrackCenter(sampled);
    return { sampled, roadGeo, leftWall, rightWall, center };
  }, [map.id, map.trackPoints, halfRoad, wallHeight, wallThickness]);

  return (
    <group>
      <GroundPlane cx={center.cx} cz={center.cz} w={center.halfW * 2.5} h={center.halfH * 2.5} />

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[center.halfW * 1.5, 0.1, center.halfH * 1.5]}
          position={[center.cx, -0.1, center.cz]}
          friction={0.92}
          restitution={0}
          frictionCombineRule={CoefficientCombineRule.Average}
        />
      </RigidBody>

      <mesh geometry={roadGeo} receiveShadow position={[0, 0, 0]}>
        <meshStandardMaterial color="#1a1a1e" roughness={0.92} metalness={0} />
      </mesh>

      <CenterLine sampled={sampled} />
      <StartFinishLine sampled={sampled} />
      <CurbStripes sampled={sampled} halfRoad={halfRoad} />

      <RigidBody type="fixed" colliders={false}>
        {leftWall.map((w, i) => (
          <CuboidCollider
            key={`l${i}`}
            args={[wallThickness / 2, wallHeight / 2, w.halfLen]}
            position={w.pos}
            rotation={[0, w.rotY, 0]}
            friction={0.5}
            restitution={0.15}
          />
        ))}
        {rightWall.map((w, i) => (
          <CuboidCollider
            key={`r${i}`}
            args={[wallThickness / 2, wallHeight / 2, w.halfLen]}
            position={w.pos}
            rotation={[0, w.rotY, 0]}
            friction={0.5}
            restitution={0.15}
          />
        ))}
      </RigidBody>

      {[...leftWall, ...rightWall].map((w, i) => (
        <mesh key={i} position={w.pos} rotation={[0, w.rotY, 0]} receiveShadow>
          <boxGeometry args={[wallThickness, wallHeight, w.halfLen * 2]} />
          <meshStandardMaterial color="#8a8f98" metalness={0.88} roughness={0.22} envMapIntensity={1.2} />
        </mesh>
      ))}

      <Obstacles sampled={sampled} halfRoad={halfRoad} />
    </group>
  );
}
