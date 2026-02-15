import { useEffect, useRef } from 'react';

export interface KeyboardInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

/** Ref que se actualiza en cada keydown/keyup; leer en useFrame para no depender de re-renders */
export function useKeyboardRef() {
  const keys = useRef<KeyboardInput>({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current = { ...keys.current, forward: true };
          e.preventDefault();
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.current = { ...keys.current, backward: true };
          e.preventDefault();
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.current = { ...keys.current, left: true };
          e.preventDefault();
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.current = { ...keys.current, right: true };
          e.preventDefault();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current = { ...keys.current, forward: false };
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.current = { ...keys.current, backward: false };
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.current = { ...keys.current, left: false };
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.current = { ...keys.current, right: false };
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('keyup', handleKeyUp, { capture: true });
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
  }, []);

  return keys;
}
