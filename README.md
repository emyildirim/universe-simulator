# Universe Simulator

A comprehensive simulator that shows planets, galaxies, and observable small bodies with proper astronomical data handling using NASA APIs and astronomical databases.

## 🌟 Features

### ✅ Gaia DR3 Data Handling
- **Server-side pre-filtering**: Implements ADQL queries with magnitude, parallax, and coordinate limits to prevent browser overload
- **Tile-based streaming**: Hierarchical sky tiling system for efficient large-scale data delivery
- **Parallax uncertainty handling**: Uses Bailer-Jones method for negative/uncertain parallaxes
- **ICRS coordinate frame**: All stellar positions use the International Celestial Reference System

### 🪐 Solar System Bodies (JPL Horizons API)
- **Real-time ephemeris**: Position and velocity vectors for planets and small bodies
- **J2000 Ecliptic coordinates**: Consistent reference frame for orbital mechanics
- **Orbital elements**: Keplerian elements for trajectory calculations
- **Multi-body tracking**: Current positions for all major planets

### 🌍 Exoplanet Data (NASA Exoplanet Archive)
- **Confirmed exoplanets**: Comprehensive database of verified discoveries
- **Discovery method filtering**: Transit, radial velocity, microlensing, etc.
- **Habitable zone analysis**: Temperature-based habitability assessment
- **Host star properties**: Stellar parameters for context

### 🔍 Astronomical Object Resolution (SIMBAD)
- **Name resolution**: Convert common names to catalog identifiers
- **Cone search**: Find objects within specified sky regions
- **Object metadata**: Spectral types, magnitudes, proper motions
- **Cross-matching**: Multiple identifier systems

## 🏃‍♂️ Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Run tests
npm test
```

The application will be available at `http://localhost:3000`

## 📡 API Endpoints

### Gaia DR3 Stars
```
GET /api/gaia/stars?ra_min=0&ra_max=30&dec_min=-10&dec_max=10&mag_max=12&limit=100
GET /api/gaia/tiles/:level/:x/:y?mag_limit=10
```

### Solar System Bodies
```
GET /api/ephemeris/body/:id?start_time=2024-01-01&stop_time=2024-02-01
GET /api/ephemeris/current-positions
GET /api/ephemeris/elements/:id
```

### Exoplanets
```
GET /api/exoplanets/confirmed?discovery_method=Transit&distance_max=100&limit=50
GET /api/exoplanets/by-method/:method
GET /api/exoplanets/habitable-zone?distance_max=100
```

### SIMBAD
```
GET /api/simbad/resolve/:name
GET /api/simbad/cone-search?ra=101.287&dec=-16.716&radius=5
GET /api/simbad/by-type/:type
```

## 🔧 Implementation Details

### Coordinate Systems & Units
- **ICRS/ICRF**: Used for all stellar positions (Gaia requirement)
- **J2000 Ecliptic**: Used for solar system ephemerides
- **Consistent units**: Parsecs for distances, degrees for coordinates, days for time
- **Unit conversions**: Built-in conversion between parsecs, AU, and light-years

### Data Quality & Filtering
- **Parallax validation**: SNR > 5 threshold for reliable trigonometric distances
- **Distance estimates**: Bailer-Jones method for uncertain parallaxes
- **Magnitude limits**: Prevents downloading excessive faint star data
- **Error propagation**: Proper uncertainty handling throughout

### Performance Optimizations
- **Server-side filtering**: Reduces client-side data processing load
- **Streaming responses**: Chunked data delivery for large datasets
- **Caching ready**: Structure supports Redis/memory caching
- **Rate limiting ready**: API structure supports request throttling

### Security Features
- **Input validation**: All parameters validated before processing
- **SQL injection protection**: Parameterized queries for ADQL
- **Error handling**: Graceful degradation with informative messages
- **CORS support**: Cross-origin resource sharing enabled

## 🧪 Testing

Comprehensive test suite covering:
- Astronomical utility functions (parallax validation, coordinate conversion)
- API endpoint functionality and error handling
- Data format validation and consistency
- Edge case handling (negative parallax, invalid coordinates)

```bash
npm test
```

## 📚 Data Sources

- **Gaia DR3**: European Space Agency's stellar catalog
- **JPL Horizons**: NASA's ephemeris computation service
- **NASA Exoplanet Archive**: Confirmed exoplanet database
- **SIMBAD**: CDS astronomical database

## 🛠️ Technology Stack

- **Backend**: Node.js + Express
- **HTTP Client**: Axios with security updates
- **Testing**: Jest + Supertest
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **APIs**: RESTful with JSON responses

## 📄 License

MIT License - see LICENSE file for details.
