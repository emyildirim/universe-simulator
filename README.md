# Universe Simulator

A 3D interactive universe simulator built with FastAPI backend and React + Three.js frontend. View planets, calculate distances, and explore the solar system with real astronomical data.

![Universe Simulator](https://github.com/user-attachments/assets/e8e6bcca-59a2-48ec-ae1b-38a8ef81790f)

## Features

### ✨ Current Implementation (MVP)
- **3D Solar System Visualization**: Interactive 3D rendering of the Sun and 8 planets using Three.js
- **Real-time Planet Positions**: FastAPI backend with JPL Horizons API integration (with fallback positions)
- **Interactive Planet Selection**: Click planets to view detailed information
- **Distance Calculator**: Select any two celestial bodies to calculate distance in AU and km
- **Planet Search**: Search and quickly navigate to specific planets
- **Timeline Controls**: Play/pause time progression to see planetary movements
- **Responsive UI**: Clean, space-themed interface with multiple control panels

### 🎮 Interactive Features
- 🖱️ **Mouse Controls**: Click and drag to rotate view, scroll to zoom
- 🪐 **Planet Info**: Click any planet to see details (type, radius, position)
- 📏 **Distance Measurement**: Select 2 planets to calculate real distance
- 🔍 **Search**: Type planet names to quickly locate them
- ⏰ **Time Travel**: Use timeline controls to advance time and see orbital changes

## Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **JPL Horizons API** - NASA's planetary ephemeris service for accurate positions
- **Uvicorn** - ASGI server for production deployment
- **Requests** - HTTP client for API calls
- **Caching** - In-memory caching for API responses

### Frontend
- **React** - Modern UI framework with hooks
- **Three.js + @react-three/fiber** - 3D graphics and WebGL rendering
- **@react-three/drei** - Useful helpers for Three.js (OrbitControls, Stars)
- **TypeScript** - Type-safe development
- **CSS3** - Custom styling with backdrop-filter effects

## Setup Instructions

### Prerequisites
- **Python 3.8+**
- **Node.js 16+**
- **npm** or **yarn**

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```
Backend will run on `http://localhost:8000`

### Frontend Setup
```bash
cd frontend
npm install
npm start
```
Frontend will run on `http://localhost:3000`

### Development
1. Start backend server first (port 8000)
2. Start frontend development server (port 3000)
3. Open browser to `http://localhost:3000`

## API Endpoints

### Backend API
- `GET /` - API information
- `GET /positions?time=<ISO_DATE>` - Get positions of all planets
- `GET /planet/{planet_name}` - Get specific planet information
- `GET /distance?body1=<name>&body2=<name>&time=<ISO_DATE>` - Calculate distance between bodies

## Project Structure

```
universe-simulator/
├── backend/
│   ├── main.py              # FastAPI application
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UniverseSimulator.tsx    # Main app component
│   │   │   ├── SolarSystem.tsx          # 3D solar system container
│   │   │   ├── Planet.tsx               # Individual planet rendering
│   │   │   ├── UI.tsx                   # User interface panels
│   │   │   └── UI.css                   # UI styling
│   │   ├── types.ts         # TypeScript interfaces
│   │   ├── App.tsx          # React app entry
│   │   └── App.css          # Global styles
│   ├── public/              # Static assets
│   └── package.json         # Node.js dependencies
└── README.md               # This file
```

## Celestial Bodies

Current implementation includes:
- **Sun** - Central star with emission lighting
- **Mercury** - Smallest planet, closest to Sun
- **Venus** - Hottest planet with thick atmosphere
- **Earth** - Our home planet
- **Mars** - The red planet
- **Jupiter** - Largest planet with prominent rings
- **Saturn** - Famous for its ring system
- **Uranus** - Ice giant tilted on its side
- **Neptune** - Furthest planet, deep blue color

Each planet features:
- Accurate relative sizes and colors
- Real orbital positions (via JPL Horizons API)
- Detailed information panels
- Interactive selection and highlighting

## Future Enhancements

### Planned Features
- **Gaia Star Catalog**: Background stars with magnitude-based LOD
- **Moons**: Major satellites for planets (Earth's Moon, Jupiter's moons, etc.)
- **Asteroids**: Near-Earth objects and asteroid belt
- **Advanced Timeline**: Custom date selection, speed controls
- **Orbital Paths**: Visual representation of planetary orbits
- **3D Models**: Detailed planet textures and atmospheric effects
- **Desktop App**: Tauri wrapper for native desktop deployment

### Technical Improvements
- **Skyfield Integration**: Local ephemeris computation
- **PostGIS Database**: Spatial queries for large datasets
- **WebGL Optimization**: Level-of-detail rendering for performance
- **Progressive Loading**: Streaming large astronomical datasets
- **Mobile Support**: Touch controls and responsive design

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- **NASA JPL Horizons** - Planetary ephemeris data
- **Three.js Community** - 3D graphics framework
- **React Three Fiber** - React bindings for Three.js
- **FastAPI** - Modern Python web framework
