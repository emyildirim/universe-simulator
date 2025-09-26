# Universe Simulator Architecture

## Overview

This document describes the high-level architecture of the Universe Simulator, implementing the requirements for a 3D interactive astronomical visualization system.

## System Components

### 1. Data Ingestion Layer (Backend Service)

**Technology Stack:**
- Python 3.8+
- FastAPI for REST API
- SQLAlchemy for ORM
- SQLite for data storage (PostgreSQL-ready)
- Astropy for astronomical calculations
- Skyfield for ephemeris computations

**Key Features:**
- Periodic data fetching from astronomical catalogs
- Coordinate system conversion (RA/Dec/parallax → 3D Cartesian ICRS)
- Local caching with relational database
- RESTful API endpoints for frontend queries

**Implemented Endpoints:**
```
GET /object/{id}           - Get specific celestial object
GET /search?q={query}      - Search objects by name/criteria
GET /positions?params      - Spatial and magnitude filtering
GET /distance?id_a&id_b    - Calculate inter-object distances
GET /stats                 - Database statistics
GET /objects/types         - Available object classifications
```

### 2. Frontend Visualization

**Technology Stack:**
- React 18 with TypeScript
- Three.js for WebGL 3D rendering
- Axios for HTTP communication
- Modern ES6+ JavaScript

**Key Features:**
- Interactive 3D scene with celestial objects
- Smooth zoom/pan camera controls
- Object selection and detailed information panels
- Search interface with real-time filtering
- Level of Detail (LOD) system based on visual magnitude
- Spectral type-based star coloring

**UI Components:**
- `UniverseVisualization`: Main 3D rendering component
- `SearchPanel`: Object search and filtering
- `ObjectInfoPanel`: Detailed object information display

### 3. Storage & Indexing

**Database Schema:**

```sql
-- Main celestial objects catalog
CREATE TABLE celestial_objects (
    id INTEGER PRIMARY KEY,
    name TEXT INDEXED,
    object_type TEXT INDEXED,
    
    -- Equatorial coordinates
    ra REAL,                    -- Right Ascension (degrees)
    dec REAL,                   -- Declination (degrees) 
    parallax REAL,              -- Parallax (milliarcseconds)
    
    -- 3D Cartesian coordinates (ICRS, parsecs)
    x REAL INDEXED,
    y REAL INDEXED,
    z REAL INDEXED,
    
    -- Physical properties
    magnitude REAL INDEXED,     -- Visual magnitude for LOD
    distance REAL,              -- Distance in parsecs
    spectral_type TEXT,         -- Stellar classification
    
    -- Metadata
    source TEXT,                -- Data source identifier
    external_id TEXT,           -- Original catalog ID
    last_updated DATETIME,
    properties TEXT             -- JSON for additional data
);

-- Time-dependent ephemeris data
CREATE TABLE ephemeris_data (
    id INTEGER PRIMARY KEY,
    object_id INTEGER,          -- Foreign key to celestial_objects
    julian_date REAL INDEXED,   -- Time coordinate
    
    -- Position and velocity vectors
    x REAL, y REAL, z REAL,     -- Position (parsecs)
    vx REAL, vy REAL, vz REAL,  -- Velocity (parsecs/day)
    
    source TEXT,
    last_updated DATETIME
);
```

**Optimization Features:**
- Spatial indexing on 3D coordinates
- Magnitude-based filtering for LOD
- Efficient bounding box queries
- Pagination for large datasets

### 4. Coordinate Systems & Scale

**Reference Frame:**
- Internal storage: ICRS (International Celestial Reference System)
- 3D Cartesian coordinates in parsecs
- Consistent coordinate transformations using Astropy

**Multi-Scale Rendering:**
- Automatic scaling for Three.js visualization
- Log-scale distance representation
- Magnitude-based object sizing
- Level of Detail (LOD) system for performance

**Coordinate Conversion Pipeline:**
```python
RA/Dec/Parallax → ICRS SkyCoord → 3D Cartesian (parsecs) → Scaled for rendering
```

### 5. Data Sources Integration

**Currently Implemented:**
- **JPL Ephemerides**: Solar system planets with orbital data
- **Gaia DR3 Sample**: Bright star catalog with proper motions and parallax
- **Custom Database**: Extensible schema for additional catalogs

**Future Data Sources:**
- NASA Exoplanet Archive (confirmed exoplanets)
- SIMBAD lookups (comprehensive astronomical database)
- 2MASS infrared survey
- Hipparcos astrometric catalog

### 6. Performance Considerations

**Backend Optimization:**
- Database indexing on frequently queried fields
- Efficient spatial queries with bounding boxes
- Caching layer for repeated requests
- Pagination to handle large result sets

**Frontend Optimization:**
- WebGL rendering with Three.js
- Instanced geometry for similar objects
- Frustum culling for off-screen objects
- Magnitude-based LOD filtering
- Lazy loading of detailed object information

### 7. Desktop Application (Future)

**Tauri Integration:**
- Lightweight native wrapper around web application
- Small binary size compared to Electron
- Native system integration capabilities
- Cross-platform support (Windows, macOS, Linux)

**Alternative Approaches:**
- Electron wrapper for broader compatibility
- Native SwiftUI/SceneKit for macOS optimization
- Progressive Web App (PWA) for mobile devices

## API Design Principles

### RESTful Endpoints
- Consistent HTTP methods and status codes
- JSON response format
- Comprehensive error handling
- Pagination support for large datasets

### Query Parameters
- `bbox`: 3D spatial filtering (x_min,y_min,z_min,x_max,y_max,z_max)
- `max_magnitude`: Visual magnitude cutoff for LOD
- `limit`/`offset`: Pagination controls
- `object_type`: Filter by celestial object classification

### Response Format
```json
{
    "results": [...],           // Array of celestial objects
    "total_count": 1000,        // Total available results
    "page_info": {              // Pagination metadata
        "limit": 50,
        "offset": 0,
        "has_next": true
    }
}
```

## Scalability Architecture

### Horizontal Scaling Options
- Multiple backend instances behind load balancer
- Database read replicas for query distribution
- CDN for static frontend assets
- Microservices decomposition for specialized functions

### Vertical Scaling
- Database optimization with PostGIS for spatial queries
- Redis caching layer for frequently accessed data
- Background job processing for data ingestion
- Streaming APIs for real-time updates

## Security Considerations

### API Security
- Rate limiting on endpoints
- Input validation and sanitization
- CORS configuration for web clients
- API versioning for backward compatibility

### Data Privacy
- No sensitive personal data stored
- Public astronomical data sources
- Optional user preferences stored locally
- Transparent data source attribution

## Deployment Architecture

### Development Environment
```bash
# Backend (Python)
cd backend && python main.py

# Frontend (React)
cd frontend && npm start
```

### Production Deployment
- Docker containerization for consistent deployment
- Nginx reverse proxy for SSL termination
- PostgreSQL with PostGIS for spatial indexing
- Automated CI/CD pipeline with testing

### Cloud Deployment Options
- AWS: ECS + RDS + CloudFront
- Google Cloud: Cloud Run + Cloud SQL + Cloud CDN
- Azure: Container Instances + Azure Database + CDN
- Self-hosted: Docker Compose setup

## Monitoring & Observability

### Application Metrics
- API response times and error rates
- Database query performance
- Frontend rendering performance
- User interaction analytics

### System Health
- Resource utilization (CPU, memory, disk)
- Database connection pool status
- Cache hit rates
- Data ingestion pipeline status

This architecture provides a solid foundation for the Universe Simulator while maintaining flexibility for future enhancements and scaling requirements.