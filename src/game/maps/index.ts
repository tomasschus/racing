export type { MapDefinition, MapLapConfig, LapCrossingContext } from './types';
export { gp1Map } from './gp1';
export { ovalMap } from './oval';
export { sprintMap } from './sprint';

import type { MapDefinition } from './types';
import { gp1Map } from './gp1';
import { ovalMap } from './oval';
import { sprintMap } from './sprint';

const maps: Map<string, MapDefinition> = new Map([
  [gp1Map.id, gp1Map],
  [ovalMap.id, ovalMap],
  [sprintMap.id, sprintMap],
]);

export function getMap(id: string): MapDefinition | undefined {
  return maps.get(id);
}

export function getAllMaps(): MapDefinition[] {
  return Array.from(maps.values());
}

export function getCurrentMap(): MapDefinition {
  return gp1Map;
}

export function registerMap(map: MapDefinition): void {
  maps.set(map.id, map);
}
