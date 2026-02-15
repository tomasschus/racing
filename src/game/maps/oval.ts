import type { MapDefinition } from './types';

// Óvalo: línea de meta en x ≈ 0. Lado A = x < 0, B = x >= 0. Vuelta válida si minX < -20.
const LINE_X = 0;
const MIN_X_BEFORE_LAP = -20;

function ovalPoints(radiusX: number, radiusZ: number, segments: number): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    points.push([Math.cos(t) * radiusX, Math.sin(t) * radiusZ]);
  }
  return points;
}

export const ovalMap: MapDefinition = {
  id: 'oval',
  name: 'Óvalo',
  trackPoints: ovalPoints(120, 80, 48),
  roadWidth: 28,
  wallHeight: 3,
  wallThickness: 1.2,
  lap: {
    getSideOfLine: (position) => (position[0] < LINE_X ? 'a' : 'b'),
    isValidLapCrossing: (ctx) =>
      ctx.minX !== null && ctx.minX < MIN_X_BEFORE_LAP,
  },
  spawnPosition: [5, 0.55, 0],
  spawnRotation: [0, -Math.PI / 2, 0],
  totalLaps: 5,
};
