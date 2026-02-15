/**
 * Contexto que el coche mantiene mientras está en el "lado A" de la línea de meta.
 * Se usa para validar si un cruce A→B cuenta como vuelta completa.
 */
export interface LapCrossingContext {
  /** Mínimo X alcanzado mientras estaba en lado A (null si no ha estado en A) */
  minX: number | null;
  /** Mínimo Z alcanzado mientras estaba en lado A */
  minZ: number | null;
  /** Máximo X alcanzado en lado A (opcional, para mapas que lo usen) */
  maxX?: number | null;
  /** Máximo Z alcanzado en lado A (opcional) */
  maxZ?: number | null;
}

/**
 * Lógica de detección de vueltas por mapa.
 * Cada mapa define su propia línea de meta y cuándo un cruce cuenta como vuelta.
 */
export interface MapLapConfig {
  /** Dado la posición [x, y, z], devuelve en qué lado de la línea de meta está ('a' = antes, 'b' = después en dirección de carrera) */
  getSideOfLine: (position: [number, number, number]) => 'a' | 'b';

  /**
   * Valida si el cruce A→B actual debe contar como vuelta completa.
   * Se llama con el contexto acumulado mientras el coche estaba en lado A.
   * Ej: en un óvalo con línea en x=0, devolver true solo si minX < -5 (dio la vuelta).
   */
  isValidLapCrossing: (context: LapCrossingContext) => boolean;
}

/**
 * Definición de un mapa/circuito.
 * Centraliza geometría, spawn y lógica de vueltas para poder cargar varios mapas.
 */
export interface MapDefinition {
  id: string;
  name: string;
  /** Puntos centrales del circuito [x, z] (sentido horario desde arriba) */
  trackPoints: [number, number][];
  roadWidth: number;
  wallHeight?: number;
  wallThickness?: number;
  /** Configuración de la línea de meta y conteo de vueltas */
  lap: MapLapConfig;
  /** Posición inicial del coche [x, y, z] */
  spawnPosition: [number, number, number];
  /** Rotación inicial del coche [x, y, z] en radianes (e.g. mirando hacia la recta) */
  spawnRotation: [number, number, number];
  /** Vueltas totales de la carrera (opcional, default 3) */
  totalLaps?: number;
}
