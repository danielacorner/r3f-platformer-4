import { Vector3, BoxGeometry } from 'three';

interface GhostBoxProps {
  position: Vector3;
}

export function GhostBox({ position }: GhostBoxProps) {
  return (
    <mesh position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color="#00ff00"
        transparent
        opacity={0.5}
        depthWrite={false}
      />
      {/* Wireframe outline */}
      <lineSegments>
        <edgesGeometry args={[new BoxGeometry(1.01, 1.01, 1.01)]} />
        <lineBasicMaterial color="#00ff00" />
      </lineSegments>
    </mesh>
  );
}