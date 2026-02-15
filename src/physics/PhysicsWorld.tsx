import { Physics } from '@react-three/rapier';

interface PhysicsWorldProps {
  children: React.ReactNode;
}

export function PhysicsWorld({ children }: PhysicsWorldProps) {
  return (
    <Physics
      gravity={[0, -9.81, 0]}
      timeStep={1 / 60}
      numSolverIterations={16}
      predictionDistance={0.1}
    >
      {children}
    </Physics>
  );
}
