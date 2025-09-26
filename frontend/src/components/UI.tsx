import React, { useState } from 'react';
import { UniverseData } from '../types';
import './UI.css';

interface UIProps {
  universeData: UniverseData | null;
  selectedPlanet: string | null;
  selectedPlanets: string[];
  distance: number | null;
  isPlaying: boolean;
  currentTime: Date;
  onSearch: (planetName: string) => void;
  onTogglePlayPause: () => void;
  onResetTime: () => void;
  onClosePlanetInfo: () => void;
}

const UI: React.FC<UIProps> = ({
  universeData,
  selectedPlanet,
  selectedPlanets,
  distance,
  isPlaying,
  currentTime,
  onSearch,
  onTogglePlayPause,
  onResetTime,
  onClosePlanetInfo
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const planetNames = universeData ? Object.keys(universeData.positions) : [];
  
  const filteredPlanets = planetNames.filter(name =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchSelect = (planetName: string) => {
    onSearch(planetName);
    setSearchTerm('');
  };

  const formatDistance = (distanceAU: number) => {
    const distanceKm = distanceAU * 149597870.7;
    if (distanceKm > 1000000) {
      return `${(distanceKm / 1000000).toFixed(2)} million km`;
    } else if (distanceKm > 1000) {
      return `${(distanceKm / 1000).toFixed(0)} thousand km`;
    } else {
      return `${distanceKm.toFixed(0)} km`;
    }
  };

  return (
    <div className="ui-overlay">
      {/* Header */}
      <div className="ui-header">
        <h1>Universe Simulator</h1>
        <div className="time-display">
          {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}
        </div>
      </div>

      {/* Search Panel */}
      <div className="ui-panel search-panel">
        <h3>Search Planets</h3>
        <input
          type="text"
          placeholder="Search for a planet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && filteredPlanets.length > 0 && (
          <div className="search-results">
            {filteredPlanets.map(planet => (
              <div
                key={planet}
                className="search-result"
                onClick={() => handleSearchSelect(planet)}
              >
                {planet.charAt(0).toUpperCase() + planet.slice(1)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline Controls */}
      <div className="ui-panel timeline-panel">
        <h3>Timeline</h3>
        <div className="timeline-controls">
          <button onClick={onTogglePlayPause} className="timeline-button">
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          <button onClick={onResetTime} className="timeline-button">
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Distance Calculator */}
      {selectedPlanets.length > 0 && (
        <div className="ui-panel distance-panel">
          <h3>Distance Calculator</h3>
          <div className="selected-planets">
            {selectedPlanets.map((planet, index) => (
              <span key={planet} className="selected-planet">
                {planet.charAt(0).toUpperCase() + planet.slice(1)}
                {index === 0 && selectedPlanets.length === 2 && ' ↔ '}
              </span>
            ))}
          </div>
          {distance !== null && selectedPlanets.length === 2 && (
            <div className="distance-result">
              <strong>Distance: {distance.toFixed(3)} AU</strong>
              <br />
              <small>({formatDistance(distance)})</small>
            </div>
          )}
          {selectedPlanets.length === 1 && (
            <div className="distance-hint">
              Click another planet to calculate distance
            </div>
          )}
        </div>
      )}

      {/* Planet Info Panel */}
      {selectedPlanet && universeData && (
        <div className="ui-panel planet-info-panel">
          <div className="panel-header">
            <h3>{selectedPlanet.charAt(0).toUpperCase() + selectedPlanet.slice(1)}</h3>
            <button onClick={onClosePlanetInfo} className="close-button">×</button>
          </div>
          <div className="planet-details">
            <p><strong>Type:</strong> {universeData.positions[selectedPlanet].info.type}</p>
            <p><strong>Radius:</strong> {universeData.positions[selectedPlanet].info.radius.toLocaleString()} km</p>
            <p><strong>Position (AU):</strong></p>
            <ul>
              <li>X: {universeData.positions[selectedPlanet].position.x.toFixed(3)}</li>
              <li>Y: {universeData.positions[selectedPlanet].position.y.toFixed(3)}</li>
              <li>Z: {universeData.positions[selectedPlanet].position.z.toFixed(3)}</li>
            </ul>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="ui-panel instructions-panel">
        <h3>Instructions</h3>
        <ul>
          <li>🖱️ Click and drag to rotate view</li>
          <li>🔍 Scroll to zoom in/out</li>
          <li>🪐 Click planets for info</li>
          <li>📏 Select 2 planets for distance</li>
          <li>⏰ Use timeline to advance time</li>
        </ul>
      </div>
    </div>
  );
};

export default UI;