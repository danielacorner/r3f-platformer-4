import { useRef, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { Vector3, Raycaster } from 'three';
import { useGameStore } from '../store/gameStore';
import { GhostBox } from './GhostBox';
import { PlaceableBox } from './PlaceableBox';
import { StaticBox } from './StaticBox';

const LEVEL_CONFIGS = {
  1: {
    platforms: [
      { position: [0, 0, 0], scale: [20, 1, 20] },
      { position: [-8, 1, -8], scale: [4, 0.5, 4] },
      { position: [8, 1, 8], scale: [4, 0.5, 4] },
    ],
    spawnerPosition: [-8, 2, -8],
    portalPosition: [8, 2, 8],
    gridSize: 1,
    initialBoxes: generateFibonacciBoxes(20)
  },
  2: {
    platforms: [
      { position: [0, 0, 0], scale: [30, 1, 30] },
      { position: [-12, 1, -12], scale: [6, 0.5, 6] },
      { position: [12, 1, 12], scale: [6, 0.5, 6] },
      { position: [0, 2, 0], scale: [4, 0.5, 4] },
    ],
    spawnerPosition: [-12, 2, -12],
    portalPosition: [12, 2, 12],
    gridSize: 1,
    initialBoxes: generateFibonacciBoxes(30)
  },
};

function generateFibonacciBoxes(count: number) {
  const boxes = [];
  const phi = (1 + Math.sqrt(5)) / 2;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const radius = Math.sqrt(i) * 0.8;
    const angle = i * goldenAngle;
    
    boxes.push({
      position: new Vector3(
        radius * Math.cos(angle),
        1,
        radius * Math.sin(angle)
      )
    });
  }
  return boxes;
}

export function Level() {
  const { currentLevel, phase, placedBoxes, addBox, removeBox } = useGameStore();
  const { camera, scene } = useThree();
  const raycaster = useRef(new Raycaster());
  const [ghostBoxPosition, setGhostBoxPosition] = useState<Vector3 | null>(null);
  
  const config = LEVEL_CONFIGS[currentLevel as keyof typeof LEVEL_CONFIGS];

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (phase !== 'prep' || placedBoxes.length >= 20) return;

      const mouse = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1
      };

      raycaster.current.setFromCamera(mouse, camera);
      const intersects = raycaster.current.intersectObjects(scene.children, true);
      
      const platformHit = intersects.find(hit => 
        hit.object.name === 'platform' || 
        hit.object.parent?.name === 'platform'
      );

      if (platformHit) {
        const { x, z } = platformHit.point;
        const gridSize = config.gridSize;
        const snappedPosition = new Vector3(
          Math.round(x / gridSize) * gridSize,
          1,
          Math.round(z / gridSize) * gridSize
        );
        setGhostBoxPosition(snappedPosition);
      } else {
        setGhostBoxPosition(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [phase, camera, scene, config.gridSize, placedBoxes.length]);

  const handleClick = (event: MouseEvent) => {
    if (phase !== 'prep' || !ghostBoxPosition || placedBoxes.length >= 20) return;
    
    event.stopPropagation();
    addBox(ghostBoxPosition);
  };

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [phase, ghostBoxPosition, placedBoxes.length]);

  return (
    <group>
      {/* Platforms */}
      {config.platforms.map((platform, index) => (
        <RigidBody key={index} type="fixed" colliders="cuboid">
          <mesh 
            position={new Vector3(...platform.position)}
            name="platform"
            receiveShadow
          >
            <boxGeometry args={platform.scale} />
            <meshStandardMaterial color="cornflowerblue" />
          </mesh>
        </RigidBody>
      ))}
      
      {/* Initial Static Boxes */}
      {config.initialBoxes.map((box, index) => (
        <StaticBox key={`static-${index}`} position={box.position} />
      ))}

      {/* Placeable Boxes */}
      {placedBoxes.map((box) => (
        <PlaceableBox
          key={box.id}
          position={box.position}
          onRemove={() => removeBox(box.id)}
        />
      ))}

      {/* Ghost Box */}
      {phase === 'prep' && ghostBoxPosition && placedBoxes.length < 20 && (
        <GhostBox position={ghostBoxPosition} />
      )}

      {/* Spawner */}
      <mesh position={new Vector3(...config.spawnerPosition)}>
        <sphereGeometry args={[0.5]} />
        <meshStandardMaterial color="red" />
      </mesh>

      {/* Portal */}
      <mesh position={new Vector3(...config.portalPosition)}>
        <torusGeometry args={[1, 0.2, 16, 32]} />
        <meshStandardMaterial 
          color="purple" 
          emissive="purple" 
          emissiveIntensity={0.5} 
        />
      </mesh>
    </group>
  );
}