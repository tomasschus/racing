import { createContext, useContext, useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { getMap } from './maps';
import type { MapDefinition } from './maps';

const MapContext = createContext<MapDefinition | null>(null);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const currentMapId = useGameStore((s) => s.currentMapId);
  const map = useMemo(
    () => getMap(currentMapId) ?? getMap('gp1')!,
    [currentMapId],
  );
  return (
    <MapContext.Provider value={map}>
      {children}
    </MapContext.Provider>
  );
}

export function useMap(): MapDefinition {
  const map = useContext(MapContext);
  if (!map) throw new Error('useMap must be used within MapProvider');
  return map;
}
