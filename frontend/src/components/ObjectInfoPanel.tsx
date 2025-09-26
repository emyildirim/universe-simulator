import React from 'react';

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

interface ObjectInfoPanelProps {
  selectedObject: CelestialObject | null;
  onClose: () => void;
}

const ObjectInfoPanel: React.FC<ObjectInfoPanelProps> = ({ selectedObject, onClose }) => {
  if (!selectedObject) return null;

  const formatCoordinate = (value: number | undefined, unit: string) => {
    if (value === undefined) return 'N/A';
    return `${value.toFixed(6)} ${unit}`;
  };

  const formatDistance = (distance: number | undefined) => {
    if (!distance) return 'N/A';
    
    const lightYears = distance * 3.26156;
    
    if (distance < 0.001) {
      return `${(distance * 1000).toFixed(3)} milliparsecs`;
    } else if (distance < 1000) {
      return `${distance.toFixed(3)} parsecs (${lightYears.toFixed(2)} light-years)`;
    } else {
      return `${(distance / 1000).toFixed(3)} kiloparsecs (${(lightYears / 1000).toFixed(2)} thousand light-years)`;
    }
  };

  const getObjectTypeDescription = (type: string) => {
    switch (type) {
      case 'planet':
        return 'A celestial body orbiting a star';
      case 'star':
        return 'A luminous celestial body of hot gas';
      case 'galaxy':
        return 'A collection of stars, gas, and dark matter';
      default:
        return 'A celestial object';
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      width: '350px',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      padding: '20px',
      borderRadius: '8px',
      color: 'white',
      zIndex: 1000,
      border: '1px solid #444'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{ margin: 0, fontSize: '20px' }}>{selectedObject.name}</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'inline-block',
          backgroundColor: selectedObject.object_type === 'planet' ? '#4CAF50' : 
                          selectedObject.object_type === 'star' ? '#FFC107' : '#2196F3',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}>
          {selectedObject.object_type}
        </div>
        <p style={{ 
          margin: '8px 0 0 0', 
          fontSize: '14px', 
          color: '#ccc',
          fontStyle: 'italic' 
        }}>
          {getObjectTypeDescription(selectedObject.object_type)}
        </p>
      </div>

      <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
        <div style={{ marginBottom: '12px' }}>
          <strong>Physical Properties:</strong>
          <div style={{ marginLeft: '10px', color: '#ccc' }}>
            {selectedObject.magnitude && (
              <div>Visual Magnitude: {selectedObject.magnitude.toFixed(2)}</div>
            )}
            {selectedObject.spectral_type && (
              <div>Spectral Type: {selectedObject.spectral_type}</div>
            )}
            <div>Distance: {formatDistance(selectedObject.distance)}</div>
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <strong>Coordinates (ICRS):</strong>
          <div style={{ marginLeft: '10px', color: '#ccc' }}>
            {selectedObject.ra !== undefined && selectedObject.dec !== undefined && (
              <>
                <div>RA: {formatCoordinate(selectedObject.ra, '°')}</div>
                <div>Dec: {formatCoordinate(selectedObject.dec, '°')}</div>
              </>
            )}
            {selectedObject.parallax && (
              <div>Parallax: {selectedObject.parallax.toFixed(3)} mas</div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <strong>3D Position (parsecs):</strong>
          <div style={{ marginLeft: '10px', color: '#ccc' }}>
            <div>X: {selectedObject.x.toFixed(6)}</div>
            <div>Y: {selectedObject.y.toFixed(6)}</div>
            <div>Z: {selectedObject.z.toFixed(6)}</div>
          </div>
        </div>

        {selectedObject.source && (
          <div style={{ marginBottom: '12px' }}>
            <strong>Data Source:</strong>
            <div style={{ marginLeft: '10px', color: '#ccc' }}>
              {selectedObject.source}
            </div>
          </div>
        )}
      </div>

      <div style={{
        marginTop: '20px',
        padding: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#ccc'
      }}>
        <strong>Note:</strong> Coordinates are in the International Celestial Reference System (ICRS).
        3D positions are calculated from RA/Dec/parallax data.
      </div>
    </div>
  );
};

export default ObjectInfoPanel;