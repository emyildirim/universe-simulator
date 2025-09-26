import React, { useState } from 'react';
import './App.css';
import UniverseVisualization from './components/UniverseVisualization';
import SearchPanel from './components/SearchPanel';
import ObjectInfoPanel from './components/ObjectInfoPanel';

interface CelestialObject {
  id: number;
  name: string;
  object_type: string;
  x: number;
  y: number;
  z: number;
  magnitude?: number;
  distance?: number;
  spectral_type?: string;
  ra?: number;
  dec?: number;
  parallax?: number;
  source?: string;
}

function App() {
  const [selectedObject, setSelectedObject] = useState<CelestialObject | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<CelestialObject[]>([]);

  const handleObjectSelect = (object: CelestialObject) => {
    setSelectedObject(object);
    
    // Add to selected objects list if not already there
    if (!selectedObjects.find(obj => obj.id === object.id)) {
      setSelectedObjects(prev => [...prev, object]);
    }
  };

  const handleCloseInfoPanel = () => {
    setSelectedObject(null);
  };

  return (
    <div className="App" style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      <UniverseVisualization 
        selectedObjects={selectedObjects}
        onObjectSelect={handleObjectSelect}
      />
      
      <SearchPanel 
        onObjectSelect={handleObjectSelect}
      />
      
      <ObjectInfoPanel 
        selectedObject={selectedObject}
        onClose={handleCloseInfoPanel}
      />

      {/* Controls Info */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <div><strong>Controls:</strong></div>
        <div>Mouse drag: Rotate view</div>
        <div>Mouse wheel: Zoom in/out</div>
        <div>Click objects: Select and view info</div>
      </div>

      {/* Title */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        fontSize: '24px',
        fontWeight: 'bold',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        zIndex: 1000
      }}>
        Universe Simulator
      </div>
    </div>
  );
}

export default App;
