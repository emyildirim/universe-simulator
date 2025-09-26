# Universe Simulator

A 3D interactive universe simulator that displays planets, stars, galaxies, and other celestial objects using NASA APIs and astronomical databases. Built with modern web technologies and designed for both web and desktop platforms.

## 🌌 Features

- **3D Visualization**: Interactive 3D rendering of celestial objects using Three.js
- **Real Astronomical Data**: Integrates with JPL ephemerides, Gaia catalogs, and NASA databases
- **Advanced Search**: Search and filter celestial objects by name, type, magnitude, and more
- **Coordinate Systems**: Supports ICRS coordinate system with RA/Dec/parallax to 3D Cartesian conversion
- **Interactive Controls**: Mouse-driven camera controls with zoom, pan, and object selection
- **Detailed Object Info**: Comprehensive information panels for selected objects
- **Level of Detail (LOD)**: Magnitude-based filtering for performance optimization
- **Distance Measurements**: Calculate distances between any two celestial objects
- **Spectral Classification**: Color-coded stars based on their spectral types

## 🏗️ Architecture

### Backend Service (Python)
- **FastAPI** REST API server
- **SQLAlchemy** with SQLite database for data persistence
- **Astropy** for astronomical calculations and coordinate conversions
- **Skyfield** for ephemeris computations
- Data ingestion from multiple astronomical sources

### Frontend (React + Three.js)
- **React** with TypeScript for UI components
- **Three.js** for 3D WebGL rendering
- **Axios** for API communication
- Responsive design with interactive panels

### Database Schema
- `celestial_objects`: Main object catalog with 3D coordinates
- `ephemeris_data`: Time-dependent position data for moving objects

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start the FastAPI server:
```bash
python main.py
```

The backend API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## 🌟 API Endpoints

### Core Endpoints
- `GET /` - API information
- `GET /object/{id}` - Get specific celestial object
- `GET /search?q={query}` - Search objects by name
- `GET /positions?bbox=...&max_magnitude=...` - Get objects with spatial/magnitude filtering
- `GET /distance?id_a={id}&id_b={id}` - Calculate distance between two objects
- `GET /stats` - Database statistics
- `GET /objects/types` - Available object types

### Query Parameters
- `bbox`: 3D bounding box filter (x_min,y_min,z_min,x_max,y_max,z_max)
- `max_magnitude`: Maximum visual magnitude for LOD filtering
- `limit`: Maximum number of results (default: 50)
- `offset`: Pagination offset

## 🎮 Controls

### 3D Visualization
- **Mouse Drag**: Rotate the camera around the scene
- **Mouse Wheel**: Zoom in and out
- **Click Objects**: Select objects to view detailed information
- Coordinate axes are displayed for reference

### Search Panel
- Type object names in the search bar
- Click search results to focus on objects
- Real-time filtering and suggestions

### Object Information
- Detailed physical properties
- Coordinate information (RA/Dec, 3D Cartesian)
- Spectral classification for stars
- Distance measurements in parsecs and light-years

## 📊 Data Sources

### Current Implementation
- **JPL Ephemerides**: Planetary data and orbital elements
- **Gaia DR3 Sample**: Bright star catalog with proper motions
- **Custom Database**: Extensible schema for additional catalogs

### Future Integrations
- NASA Exoplanet Archive
- SIMBAD astronomical database
- 2MASS infrared survey
- Hipparcos star catalog

## 🔧 Development

### Backend Development
```bash
cd backend

# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run tests (if implemented)
pytest

# Check database content
sqlite3 universe_simulator.db
```

### Frontend Development
```bash
cd frontend

# Development server with hot reload
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Adding New Data Sources

1. Create a new ingestion method in `backend/data_ingestion.py`
2. Add appropriate database models if needed
3. Update the API endpoints to expose new data
4. Modify frontend components to display new object types

## 🌐 Desktop App (Future)

The project is designed to be wrapped with **Tauri** for native desktop applications:

```bash
# Install Tauri CLI
cargo install tauri-cli

# Initialize Tauri project
cd frontend
cargo tauri init

# Build desktop app
cargo tauri build
```

## 📈 Performance Considerations

### Backend Optimization
- Database indexing on spatial coordinates and magnitude
- Efficient bounding box queries for large datasets
- Caching for frequently accessed data
- Pagination for large result sets

### Frontend Optimization
- Level of Detail (LOD) based on camera distance
- Magnitude-based filtering to reduce object count
- Efficient Three.js geometry instancing
- Lazy loading of object details

## 🗂️ Project Structure

```
universe-simulator/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── database.py          # SQLAlchemy models
│   ├── coordinates.py       # Coordinate conversion utilities
│   ├── data_ingestion.py    # Data source integration
│   ├── requirements.txt     # Python dependencies
│   └── universe_simulator.db # SQLite database
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UniverseVisualization.tsx  # Main 3D component
│   │   │   ├── SearchPanel.tsx           # Search interface
│   │   │   └── ObjectInfoPanel.tsx       # Object details
│   │   ├── App.tsx          # Main application
│   │   └── index.tsx        # Entry point
│   ├── package.json         # Node.js dependencies
│   └── public/             # Static assets
└── README.md               # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 References

- [JPL Horizons System](https://ssd.jpl.nasa.gov/horizons/)
- [Gaia Data Release 3](https://gea.esac.esa.int/archive/)
- [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/)
- [SIMBAD Astronomical Database](http://simbad.cds.unistra.fr/)
- [International Celestial Reference System (ICRS)](https://www.iau.org/science/scientific_bodies/commissions/a1/)

## 🙏 Acknowledgments

- NASA for providing open access to astronomical data
- ESA Gaia mission for stellar catalogs
- The Astropy community for excellent Python tools
- Three.js community for 3D visualization capabilities
