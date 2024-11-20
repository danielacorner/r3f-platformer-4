import { RigidBody } from '@react-three/rapier';
import { Vector3 } from 'three';
import { useGameStore } from '../store/gameStore';

interface PlaceableBoxProps {
  position: Vector3;
  onRemove: () => void;
}

export function PlaceableBox({ position, onRemove }: PlaceableBoxProps) {
  const phase = useGameStore(state => state.phase);

  const handleClick = (e: any) => {
    if (phase === 'prep') {
      e.stopPropagation();
      e.preventDefault(); // Prevent event from reaching other objects
      onRemove();
    }
  };

  return (
    <RigidBody type={phase === 'prep' ? 'fixed' : 'dynamic'} position={position}>
      <mesh
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerDown={(e) => {
          // Stop pointer event from reaching other objects
          if (phase === 'prep') {
            e.stopPropagation();
          }
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
    </RigidBody>
  );
}