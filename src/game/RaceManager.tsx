import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';

export function RaceManager() {
  const { raceState, setRaceState, currentLap, totalLaps } = useGameStore();

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
      <div>Vuelta: {currentLap} / {totalLaps}</div>
      <div style={{ marginTop: 8, opacity: 0.8 }}>Haz clic en la pantalla para dar foco, luego W / S / A / D (o flechas)</div>
    </div>
  );
}
