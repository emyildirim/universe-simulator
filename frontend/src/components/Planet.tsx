import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { PlanetData } from '../types';

interface PlanetProps {
  name: string;
  data: PlanetData;
  onClick: () => void;
  isSelected: boolean;
  isSelectedForDistance: boolean;
}

const PLANET_COLORS: { [key: string]: string } = {
  sun: '#FDB813',
  mercury: '#8C7853',
  venus: '#FFC649',
  earth: '#6B93D6',
  mars: '#CD5C5C',
  jupiter: '#D8CA9D',
  saturn: '#FAD5A5',
  uranus: '#4FD0E7',
  neptune: '#4B70DD'
};

const PLANET_SCALES: { [key: string]: number } = {
  sun: 0.8,
  mercury: 0.1,
  venus: 0.15,
  earth: 0.16,
  mars: 0.12,
  jupiter: 0.6,
  saturn: 0.5,
  uranus: 0.3,
  neptune: 0.3
};

const Planet: React.FC<PlanetProps> = ({
  name,
  data,
  onClick,
  isSelected,
  isSelectedForDistance
}) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Rotate planet
      meshRef.current.rotation.y += delta * 0.5;
      
      // Pulse effect for selected planets
      if (isSelected || isSelectedForDistance) {
        const scale = PLANET_SCALES[name] * (1 + Math.sin(state.clock.elapsedTime * 3) * 0.1);
        meshRef.current.scale.setScalar(scale);
      }
    }
  });

  const scale = PLANET_SCALES[name] || 0.2;
  const color = PLANET_COLORS[name] || '#FFFFFF';
  
  // Scale positions for better visibility (AU is huge!)
  const scaledPosition = [
    data.position.x * 2,
    data.position.y * 2,
    data.position.z * 2
  ] as [number, number, number];

  return (
    <mesh
      ref={meshRef}
      position={scaledPosition}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      scale={hovered ? scale * 1.2 : scale}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <meshPhongMaterial
        color={color}
        emissive={name === 'sun' ? color : '#000000'}
        emissiveIntensity={name === 'sun' ? 0.3 : 0}
        shininess={name === 'sun' ? 0 : 100}
      />
      
      {/* Highlight ring for selected planets */}
      {(isSelected || isSelectedForDistance) && (
        <mesh>
          <ringGeometry args={[1.2, 1.4, 32]} />
          <meshBasicMaterial
            color={isSelectedForDistance ? '#ff6b6b' : '#4ecdc4'}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
      
      {/* Planet name label */}
      {(hovered || isSelected) && (
        <mesh position={[0, 1.5, 0]}>
          {/* This would typically use HTML overlay or text geometry */}
          {/* For now, we'll handle this in the UI component */}
        </mesh>
      )}
    </mesh>
  );
};

export default Planet;