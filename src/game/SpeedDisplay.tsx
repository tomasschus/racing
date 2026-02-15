import { useGameStore } from "../store/useGameStore";

/** Factor para pasar velocidad del juego a km/h (unidades/s → km/h) */
const TO_KMH = 2;

export function SpeedDisplay() {
  const velocity = useGameStore((s) => s.velocity);
  const [vx, , vz] = velocity;
  const speed = Math.sqrt(vx * vx + vz * vz);
  const kmh = Math.round(speed * TO_KMH);

  return (
    <div
      style={{
        position: "absolute",
        top: 12 + 140 + 8,
        right: 12,
        zIndex: 10,
        padding: "6px 12px",
        borderRadius: 8,
        background: "rgba(0,0,0,0.6)",
        border: "2px solid rgba(255,255,255,0.4)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        color: "#fff",
        fontFamily: "monospace",
        fontSize: 18,
        fontWeight: 600,
      }}
    >
      {kmh} km/h
    </div>
  );
}
