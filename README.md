# universe-simulator
A simulator that shows, planets, galaxies, observable small bodies with a 3D map using NASA APIs.

## Features

### Coordinate Math & Distance Calculation
The simulator includes robust coordinate utilities for astronomical calculations:

- **RA/Dec/Parallax to Cartesian conversion**: Convert Right Ascension, Declination, and parallax measurements (like those from Gaia) to 3D Cartesian coordinates
- **Distance calculations**: Calculate Euclidean distances between celestial objects in 3D space
- **Parallax to distance conversion**: Convert parallax measurements in milliarcseconds to distances in parsecs

### Usage

#### Node.js/ES6 Modules
```javascript
import { raDecParallaxToCartesian, distanceBetween } from './src/coordinate-utils.js';

// Convert star coordinates (RA, Dec in degrees; parallax in milliarcseconds)
const starCoords = raDecParallaxToCartesian(219.901, -60.834, 747.1);
// Returns: {x, y, z, d_pc} in parsecs or null for invalid parallax

// Calculate distance between two objects
const distance = distanceBetween(star1, star2); // in parsecs
```

#### Web Browser
Open `index.html` in a browser for an interactive coordinate calculator.

#### Command Line Demo
```bash
npm start  # Run demo with example stars
npm test   # Run comprehensive tests
```

## Coordinate System

The implementation uses the ICRS (International Celestial Reference System) coordinate system:

- **Input**: RA (α) in degrees, Dec (δ) in degrees, parallax in milliarcseconds
- **Distance**: `d = 1000 / parallax_mas` (parsecs)
- **Cartesian conversion**:
  - `x = d × cos(dec) × cos(ra)`
  - `y = d × cos(dec) × sin(ra)`  
  - `z = d × sin(dec)`

## Example Stars Included

- **Proxima Centauri**: 1.30 parsecs away
- **Alpha Centauri A**: 1.34 parsecs away  
- **Sirius A**: 2.64 parsecs away
- **Vega**: 7.76 parsecs away
