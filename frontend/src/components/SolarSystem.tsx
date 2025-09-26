import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import Planet from './Planet';
import { UniverseData } from '../types';

interface SolarSystemProps {
  data: UniverseData;
  onPlanetClick: (planetName: string) => void;
  selectedPlanet: string | null;
  selectedPlanets: string[];
}

const SolarSystem: React.FC<SolarSystemProps> = ({
  data,
  onPlanetClick,
  selectedPlanet,
  selectedPlanets
}) => {
  const systemRef = useRef<Mesh>(null);

  // Optional: rotate the entire system slowly
  useFrame((state, delta) => {
    if (systemRef.current) {
      systemRef.current.rotation.y += delta * 0.01;
    }
  });

  return (
    <group ref={systemRef}>
      {Object.entries(data.positions).map(([planetName, planetData]) => (
        <Planet
          key={planetName}
          name={planetName}
          data={planetData}
          onClick={() => onPlanetClick(planetName)}
          isSelected={selectedPlanet === planetName}
          isSelectedForDistance={selectedPlanets.includes(planetName)}
        />
      ))}
    </group>
  );
};

export default SolarSystem;