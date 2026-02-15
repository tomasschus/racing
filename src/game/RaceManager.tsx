import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { useMap } from './MapContext';

export function RaceManager() {
  const { raceState, setRaceState, currentLap } = useGameStore();
  const map = useMap();
  const totalLaps = map.totalLaps ?? 3;

  useEffect(() => {
    setRaceState('racing');
  }, [setRaceState]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: 16,
        color: 'white',
        fontFamily: 'monospace',
        fontSize: 14,
        zIndex: 1000,
        textShadow: '1px 1px 2px black',
      }}
    >
      <div>Estado: {raceState}</div>
      <div>Vuelta: {currentLap + 1} / {totalLaps}</div>
      <div style={{ marginTop: 8, opacity: 0.8 }}>Haz clic en la pantalla para dar foco, luego W / S / A / D (o flechas)</div>
    </div>
  );
}
