import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import SolarSystem from './SolarSystem';
import UI from './UI';
import { PlanetData, UniverseData } from '../types';

const UniverseSimulator: React.FC = () => {
  const [universeData, setUniverseData] = useState<UniverseData | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [selectedPlanets, setSelectedPlanets] = useState<string[]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUniverseData = async (time?: Date) => {
    try {
      setLoading(true);
      setError(null);
      
      const timeParam = time ? time.toISOString() : '';
      const response = await fetch(`http://localhost:8000/positions${timeParam ? `?time=${timeParam}` : ''}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setUniverseData(data);
    } catch (err) {
      console.error('Error fetching universe data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = async (planet1: string, planet2: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/distance?body1=${planet1}&body2=${planet2}&time=${currentTime.toISOString()}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setDistance(data.distance_au);
    } catch (err) {
      console.error('Error calculating distance:', err);
    }
  };

  useEffect(() => {
    fetchUniverseData();
  }, []);

  useEffect(() => {
    if (selectedPlanets.length === 2) {
      calculateDistance(selectedPlanets[0], selectedPlanets[1]);
    } else {
      setDistance(null);
    }
  }, [selectedPlanets, currentTime]);

  // Animation loop for time progression
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = new Date(prev.getTime() + 24 * 60 * 60 * 1000); // Add 1 day
          return newTime;
        });
      }, 1000); // Update every second
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  // Fetch new data when time changes significantly
  useEffect(() => {
    if (isPlaying) {
      fetchUniverseData(currentTime);
    }
  }, [Math.floor(currentTime.getTime() / (24 * 60 * 60 * 1000))]); // Update when day changes

  const handlePlanetClick = (planetName: string) => {
    setSelectedPlanet(planetName);
    
    // Handle selection for distance calculation
    if (selectedPlanets.includes(planetName)) {
      setSelectedPlanets(prev => prev.filter(p => p !== planetName));
    } else if (selectedPlanets.length < 2) {
      setSelectedPlanets(prev => [...prev, planetName]);
    } else {
      setSelectedPlanets([planetName]);
    }
  };

  const handleSearch = (planetName: string) => {
    setSelectedPlanet(planetName);
    setSelectedPlanets([planetName]);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const resetTime = () => {
    setCurrentTime(new Date());
    setIsPlaying(false);
    fetchUniverseData();
  };

  if (loading && !universeData) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        color: 'white',
        background: '#000011'
      }}>
        Loading universe...
      </div>
    );
  }

  if (error && !universeData) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        color: 'red',
        background: '#000011'
      }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 10, 20], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.1} />
        <pointLight position={[0, 0, 0]} intensity={2} />
        <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade />
        
        {universeData && (
          <SolarSystem
            data={universeData}
            onPlanetClick={handlePlanetClick}
            selectedPlanet={selectedPlanet}
            selectedPlanets={selectedPlanets}
          />
        )}
        
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          minDistance={5}
          maxDistance={100}
        />
      </Canvas>
      
      <UI
        universeData={universeData}
        selectedPlanet={selectedPlanet}
        selectedPlanets={selectedPlanets}
        distance={distance}
        isPlaying={isPlaying}
        currentTime={currentTime}
        onSearch={handleSearch}
        onTogglePlayPause={togglePlayPause}
        onResetTime={resetTime}
        onClosePlanetInfo={() => setSelectedPlanet(null)}
      />
    </div>
  );
};

export default UniverseSimulator;