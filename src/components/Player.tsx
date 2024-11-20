import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Vector3, Raycaster } from 'three';
import { Html } from '@react-three/drei';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { Projectile } from './Projectile';
import { TargetIndicator } from './TargetIndicator';

const MOVE_SPEED = 8;
const JUMP_FORCE = 10;

export function Player() {
  const playerRef = useRef<any>(null);
  const [projectiles, setProjectiles] = useState<any[]>([]);
  const [projectileId, setProjectileId] = useState(0);
  const [isGrounded, setIsGrounded] = useState(false);
  const [boomerangsLeft, setBoomerangsLeft] = useState(3);
  const [targetPosition, setTargetPosition] = useState<Vector3 | null>(null);
  const { forward, backward, left, right, jump } = useKeyboardControls();
  const { camera, scene } = useThree();
  const raycaster = useRef(new Raycaster());
  const lastShotTime = useRef(0);
  const SHOT_COOLDOWN = 0.3; // seconds

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const mouse = new Vector3(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
        0.5
      );

      raycaster.current.setFromCamera(mouse, camera);
      const intersects = raycaster.current.intersectObjects(scene.children, true);
      
      // Find the first platform intersection
      const platformHit = intersects.find(hit => 
        hit.object.name === 'platform' || 
        hit.object.parent?.name === 'platform'
      );

      if (platformHit) {
        setTargetPosition(platformHit.point);
      } else {
        setTargetPosition(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [camera, scene]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      event.preventDefault();
      if (!playerRef.current || !targetPosition) return;

      const currentTime = performance.now() / 1000;
      if (currentTime - lastShotTime.current < SHOT_COOLDOWN) return;
      lastShotTime.current = currentTime;

      // Check if trying to throw boomerang with no boomerangs left
      if (event.button === 2 && boomerangsLeft <= 0) return;

      const position = playerRef.current.translation();
      const playerPos = new Vector3(position.x, position.y + 0.5, position.z);

      if (event.button === 2) {
        setBoomerangsLeft(prev => prev - 1);
      }

      setProjectiles(prev => [...prev, {
        id: projectileId,
        position: playerPos,
        type: event.button === 0 ? 'bow' : 'boomerang',
        target: targetPosition
      }]);
      setProjectileId(prev => prev + 1);
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, [projectileId, camera, boomerangsLeft, targetPosition]);

  useFrame(() => {
    if (!playerRef.current) return;

    const moveDirection = new Vector3(0, 0, 0);
    if (forward) moveDirection.z -= 1;
    if (backward) moveDirection.z += 1;
    if (left) moveDirection.x -= 1;
    if (right) moveDirection.x += 1;

    const currentVel = playerRef.current.linvel();

    if (moveDirection.lengthSq() > 0) {
      moveDirection.normalize();
      const cameraAngle = -Math.PI / 4;
      const movementVector = new Vector3(
        moveDirection.x * Math.cos(cameraAngle) - moveDirection.z * Math.sin(cameraAngle),
        0,
        moveDirection.x * Math.sin(cameraAngle) + moveDirection.z * Math.cos(cameraAngle)
      );

      playerRef.current.setLinvel({
        x: movementVector.x * MOVE_SPEED,
        y: currentVel.y,
        z: movementVector.z * MOVE_SPEED
      });
    } else {
      playerRef.current.setLinvel({
        x: 0,
        y: currentVel.y,
        z: 0
      });
    }

    if (jump && isGrounded) {
      playerRef.current.setLinvel({
        x: currentVel.x,
        y: JUMP_FORCE,
        z: currentVel.z
      });
      setIsGrounded(false);
    }
  });

  const handleProjectileComplete = (position: Vector3, type: 'bow' | 'boomerang', id: number) => {
    if (type === 'boomerang') {
      const playerPos = playerRef.current?.translation();
      if (playerPos) {
        const distance = position.distanceTo(new Vector3(playerPos.x, playerPos.y, playerPos.z));
        if (distance < 2) {
          setBoomerangsLeft(prev => prev + 1);
        }
      }
    }
    setProjectiles(prev => prev.filter(p => p.id !== id));
  };

  return (
    <>
      <RigidBody
        ref={playerRef}
        position={[0, 5, 0]}
        enabledRotations={[false, false, false]}
        mass={1}
        lockRotations
        colliders="ball"
        onCollisionEnter={() => setIsGrounded(true)}
        onCollisionExit={() => setIsGrounded(false)}
      >
        <mesh castShadow>
          <sphereGeometry args={[0.5]} />
          <meshStandardMaterial color="blue" />
        </mesh>
        <Html position={[0, 1, 0]} center>
          <div style={{ 
            color: 'white', 
            fontSize: '24px',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}>
            {boomerangsLeft}
          </div>
        </Html>
      </RigidBody>

      {targetPosition && <TargetIndicator position={targetPosition} />}

      {projectiles.map(proj => (
        <Projectile
          key={proj.id}
          position={proj.position}
          type={proj.type}
          target={proj.target}
          onComplete={(position) => handleProjectileComplete(position, proj.type, proj.id)}
        />
      ))}
    </>
  );
}