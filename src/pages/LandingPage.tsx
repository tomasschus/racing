import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/useGameStore';
import { getAllMaps } from '../game/maps';
import type { MapDefinition } from '../game/maps';

export function LandingPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const currentMapId = useGameStore((s) => s.currentMapId);
  const setCurrentMapId = useGameStore((s) => s.setCurrentMapId);
  const maps = getAllMaps();

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handlePlay = useCallback(() => {
    navigate('/game');
  }, [navigate]);

  return (
    <div style={styles.root}>
      {/* Animated background stripes */}
      <div style={styles.bgStripes} />

      {/* Content */}
      <div
        style={{
          ...styles.content,
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(30px)',
        }}
      >
        {/* Logo / Title */}
        <h1 style={styles.title}>
          <span style={styles.titleAccent}>TURBO</span>
          <span style={styles.titleMain}>RACING</span>
        </h1>

        <p style={styles.subtitle}>Sentí la velocidad. Dominá la pista.</p>

        {/* Map selector */}
        <div style={styles.mapSection}>
          <span style={styles.mapLabel}>Elegí circuito</span>
          <div style={styles.mapList}>
            {maps.map((m) => (
              <MapCard
                key={m.id}
                map={m}
                selected={currentMapId === m.id}
                onSelect={() => setCurrentMapId(m.id)}
              />
            ))}
          </div>
        </div>

        {/* Play button */}
        <button
          onClick={handlePlay}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            ...styles.playButton,
            ...(hovered ? styles.playButtonHover : {}),
          }}
        >
          <span style={styles.playIcon}>▶</span>
          JUGAR
        </button>

        {/* Info cards */}
        <div style={styles.features}>
          <FeatureCard
            icon="🏎️"
            title="Física Realista"
            desc="Motor de física 3D con Rapier"
          />
          <FeatureCard
            icon="🏁"
            title="3 Vueltas"
            desc="Completá el circuito lo más rápido posible"
          />
          <FeatureCard
            icon="🎮"
            title="Controles"
            desc="WASD o flechas para manejar"
          />
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <span style={styles.footerText}>
          Multijugador online
        </span>
      </div>
    </div>
  );
}

function MapCard({
  map,
  selected,
  onSelect,
}: {
  map: MapDefinition;
  selected: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.mapCard,
        ...(selected ? styles.mapCardSelected : {}),
        ...(hovered && !selected ? styles.mapCardHover : {}),
      }}
    >
      <span style={styles.mapCardName}>{map.name}</span>
      <span style={styles.mapCardLaps}>{map.totalLaps ?? 3} vueltas</span>
    </button>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        ...styles.card,
        ...(hovered ? styles.cardHover : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={styles.cardIcon}>{icon}</span>
      <h3 style={styles.cardTitle}>{title}</h3>
      <p style={styles.cardDesc}>{desc}</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a2e 40%, #16213e 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    fontFamily:
      "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif",
  },

  bgStripes: {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(255,255,255,0.015) 60px, rgba(255,255,255,0.015) 120px)',
    pointerEvents: 'none' as const,
  },

  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '28px',
    zIndex: 1,
    transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
  },

  title: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    lineHeight: 1,
    margin: 0,
    userSelect: 'none' as const,
  },

  titleAccent: {
    fontSize: 'clamp(3rem, 10vw, 7rem)',
    fontWeight: 900,
    letterSpacing: '0.15em',
    background: 'linear-gradient(90deg, #ff6b35, #f7c948, #ff6b35)',
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'shimmer 3s linear infinite',
    textShadow: 'none',
  },

  titleMain: {
    fontSize: 'clamp(1.8rem, 5vw, 3.5rem)',
    fontWeight: 300,
    letterSpacing: '0.5em',
    color: 'rgba(255,255,255,0.85)',
    marginTop: '-4px',
  },

  subtitle: {
    fontSize: 'clamp(0.9rem, 2vw, 1.15rem)',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    margin: 0,
    fontWeight: 400,
  },

  mapSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '10px',
  },

  mapLabel: {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
  },

  mapList: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },

  mapCard: {
    padding: '14px 22px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease',
    outline: 'none',
  },

  mapCardHover: {
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.25)',
  },

  mapCardSelected: {
    background: 'rgba(255, 107, 53, 0.25)',
    border: '2px solid #ff6b35',
  },

  mapCardName: {
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
  },

  mapCardLaps: {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.6)',
  },

  playButton: {
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '18px 56px',
    fontSize: '1.25rem',
    fontWeight: 700,
    letterSpacing: '0.15em',
    color: '#fff',
    background: 'linear-gradient(135deg, #ff6b35, #e8452e)',
    border: 'none',
    borderRadius: '60px',
    cursor: 'pointer',
    boxShadow: '0 8px 32px rgba(255, 107, 53, 0.35)',
    transition: 'all 0.25s ease',
    outline: 'none',
  },

  playButtonHover: {
    transform: 'translateY(-3px) scale(1.03)',
    boxShadow: '0 12px 40px rgba(255, 107, 53, 0.5)',
  },

  playIcon: {
    fontSize: '1rem',
  },

  features: {
    display: 'flex',
    gap: '20px',
    marginTop: '24px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    padding: '0 20px',
  },

  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '24px 28px',
    width: '190px',
    textAlign: 'center' as const,
    transition: 'all 0.25s ease',
    cursor: 'default',
    backdropFilter: 'blur(8px)',
  },

  cardHover: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    transform: 'translateY(-4px)',
  },

  cardIcon: {
    fontSize: '2rem',
    display: 'block',
    marginBottom: '10px',
  },

  cardTitle: {
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: 600,
    margin: '0 0 6px 0',
    letterSpacing: '0.05em',
  },

  cardDesc: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: '0.8rem',
    lineHeight: 1.5,
    margin: 0,
  },

  footer: {
    position: 'absolute' as const,
    bottom: '20px',
    zIndex: 1,
  },

  footerText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
  },
};
