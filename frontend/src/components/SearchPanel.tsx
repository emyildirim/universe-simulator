import React, { useState } from 'react';
import axios from 'axios';

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
}

interface SearchPanelProps {
  onObjectSelect: (object: CelestialObject) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ onObjectSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CelestialObject[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/search?q=${encodeURIComponent(searchQuery)}&limit=10`
      );
      setSearchResults(response.data.results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      width: '300px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: '15px',
      borderRadius: '8px',
      color: 'white',
      zIndex: 1000
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Search Universe</h3>
      
      <div style={{ display: 'flex', marginBottom: '15px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search for celestial objects..."
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontSize: '14px'
          }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            marginLeft: '8px',
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#4CAF50',
            color: 'white',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {searchResults.length > 0 && (
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
            Results ({searchResults.length})
          </h4>
          {searchResults.map((obj) => (
            <div
              key={obj.id}
              onClick={() => onObjectSelect(obj)}
              style={{
                padding: '8px',
                marginBottom: '5px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{obj.name}</div>
              <div style={{ fontSize: '12px', color: '#ccc' }}>
                Type: {obj.object_type}
                {obj.magnitude && ` | Magnitude: ${obj.magnitude.toFixed(2)}`}
                {obj.distance && ` | Distance: ${obj.distance.toFixed(2)} pc`}
              </div>
            </div>
          ))}
        </div>
      )}

      {searchQuery && searchResults.length === 0 && !loading && (
        <div style={{ color: '#ccc', fontSize: '14px' }}>
          No results found for "{searchQuery}"
        </div>
      )}
    </div>
  );
};

export default SearchPanel;