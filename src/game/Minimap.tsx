import { useMemo } from 'react';
import { useMap } from './MapContext';
import { useGameStore } from '../store/useGameStore';
import type { MapDefinition } from './maps';

const MINIMAP_SIZE = 140;
const PADDING = 25;

function getBounds(map: MapDefinition) {
  const pts = map.trackPoints;
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, z] of pts) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
  const margin = map.roadWidth + PADDING;
  return {
    minX: minX - margin,
    maxX: maxX + margin,
    minZ: minZ - margin,
    maxZ: maxZ + margin,
    width: maxX - minX + 2 * margin,
    height: maxZ - minZ + 2 * margin,
  };
}

/** Minimapa 2D: circuito + posición del jugador (usa config del mapa) */
export function Minimap() {
  const map = useMap();
  const playerPosition = useGameStore((s) => s.playerPosition);

  const { viewBox, trackPath, playerX, playerY } = useMemo(() => {
    const b = getBounds(map);
    const viewBox = `${b.minX} ${-b.maxZ} ${b.width} ${b.height}`;
    const trackPath = map.trackPoints
      .map(([x, z], i) => `${i === 0 ? 'M' : 'L'} ${x} ${-z}`)
      .join(' ') + ' Z';
    const [px, , pz] = playerPosition;
    return {
      viewBox,
      trackPath,
      playerX: px,
      playerY: -pz,
    };
  }, [map, playerPosition]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        width: MINIMAP_SIZE,
        height: MINIMAP_SIZE,
        borderRadius: 8,
        overflow: 'hidden',
        background: 'rgba(0,0,0,0.6)',
        border: '2px solid rgba(255,255,255,0.4)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
      >
        <path
          d={trackPath}
          fill="none"
          stroke="rgba(80,80,90,0.9)"
          strokeWidth={Math.max(2, map.roadWidth * 0.15)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={playerX}
          cy={playerY}
          r={Math.max(4, map.roadWidth * 0.12)}
          fill="#f59e0b"
          stroke="#fff"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}
