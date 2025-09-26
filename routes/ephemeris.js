const express = require('express');
const axios = require('axios');
const { convertDistance, formatCoordinates } = require('../utils/astronomical');

const router = express.Router();

// JPL Horizons API base URL
const HORIZONS_BASE_URL = 'https://ssd-api.jpl.nasa.gov/horizons.api';

/**
 * Get ephemeris data for solar system bodies
 * Implements requirement: "JPL Horizons API for planet positions over time"
 */
router.get('/body/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      start_time = new Date().toISOString().split('T')[0],
      stop_time = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      step_size = '1d',
      observer = 'geocenter',
      coordinate_type = 'cartesian'
    } = req.query;

    // Build Horizons API query parameters
    const horizonsParams = {
      format: 'json',
      COMMAND: id, // Object ID (e.g., '499' for Mars, 'Mercury', etc.)
      OBJ_DATA: 'YES',
      MAKE_EPHEM: 'YES',
      EPHEM_TYPE: coordinate_type === 'cartesian' ? 'VECTORS' : 'OBSERVER',
      CENTER: observer === 'geocenter' ? '@399' : observer,
      START_TIME: start_time,
      STOP_TIME: stop_time,
      STEP_SIZE: step_size,
      VEC_TABLE: '2', // Position and velocity vectors
      REF_PLANE: 'ECLIPTIC',
      REF_SYSTEM: 'J2000',
      VEC_CORR: 'NONE',
      OUT_UNITS: 'AU-D',
      CSV_FORMAT: 'YES'
    };

    // Note: In production, this would make actual API calls to JPL Horizons
    // For demo purposes, we'll simulate the response
    const ephemerisData = await simulateHorizonsResponse(id, start_time, stop_time, step_size);

    res.json({
      body_info: {
        id: id,
        name: ephemerisData.name,
        coordinate_system: 'J2000 Ecliptic',
        observer: observer,
        time_range: {
          start: start_time,
          stop: stop_time,
          step: step_size
        },
        units: {
          position: 'AU',
          velocity: 'AU/day',
          time: 'UTC'
        }
      },
      ephemeris: ephemerisData.positions
    });

  } catch (error) {
    console.error('Horizons API error:', error);
    res.status(500).json({ error: 'Failed to fetch ephemeris data' });
  }
});

/**
 * Get current positions of multiple solar system bodies
 */
router.get('/current-positions', async (req, res) => {
  try {
    const {
      bodies = 'Mercury,Venus,Earth,Mars,Jupiter,Saturn,Uranus,Neptune,Pluto',
      observer = 'geocenter'
    } = req.query;

    const bodyList = bodies.split(',').map(b => b.trim());
    const currentTime = new Date().toISOString();
    
    const positions = await Promise.all(
      bodyList.map(async (body) => {
        const ephemData = await simulateHorizonsResponse(body, currentTime, currentTime, '1d');
        return {
          name: body,
          position: ephemData.positions[0],
          last_updated: currentTime
        };
      })
    );

    res.json({
      timestamp: currentTime,
      observer: observer,
      coordinate_system: 'J2000 Ecliptic',
      units: {
        position: 'AU',
        velocity: 'AU/day'
      },
      bodies: positions
    });

  } catch (error) {
    console.error('Current positions error:', error);
    res.status(500).json({ error: 'Failed to fetch current positions' });
  }
});

/**
 * Get orbital elements for a specific body
 */
router.get('/elements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { epoch = 'current' } = req.query;

    // Simulate orbital elements response
    const elements = simulateOrbitalElements(id, epoch);

    res.json({
      body: id,
      epoch: epoch,
      reference_frame: 'J2000 Ecliptic',
      elements: elements
    });

  } catch (error) {
    console.error('Orbital elements error:', error);
    res.status(500).json({ error: 'Failed to fetch orbital elements' });
  }
});

// Simulation functions for demo purposes
async function simulateHorizonsResponse(bodyId, startTime, stopTime, stepSize) {
  // Simulate API response structure
  const bodyNames = {
    'Mercury': 'Mercury',
    'Venus': 'Venus', 
    'Earth': 'Earth',
    'Mars': 'Mars',
    'Jupiter': 'Jupiter Barycenter',
    'Saturn': 'Saturn Barycenter',
    'Uranus': 'Uranus Barycenter',
    'Neptune': 'Neptune Barycenter',
    'Pluto': 'Pluto Barycenter',
    '199': 'Mercury',
    '299': 'Venus',
    '399': 'Earth',
    '499': 'Mars',
    '599': 'Jupiter',
    '699': 'Saturn',
    '799': 'Uranus',
    '899': 'Neptune',
    '999': 'Pluto'
  };

  const name = bodyNames[bodyId] || bodyId;
  const start = new Date(startTime);
  const stop = new Date(stopTime);
  const positions = [];

  // Generate simulated orbital positions
  let currentTime = new Date(start);
  while (currentTime <= stop) {
    const daysSinceEpoch = (currentTime - new Date('2000-01-01')) / (1000 * 60 * 60 * 24);
    const angle = (daysSinceEpoch * getOrbitalSpeed(bodyId)) % (2 * Math.PI);
    const distance = getOrbitalDistance(bodyId);
    
    positions.push({
      time: currentTime.toISOString(),
      jd: 2451545.0 + daysSinceEpoch, // Julian Date
      x: distance * Math.cos(angle),
      y: distance * Math.sin(angle),
      z: distance * 0.1 * Math.sin(angle * 2), // Add some inclination
      vx: -getOrbitalSpeed(bodyId) * distance * Math.sin(angle),
      vy: getOrbitalSpeed(bodyId) * distance * Math.cos(angle),
      vz: 0.01 * Math.cos(angle * 2)
    });

    // Increment time based on step size
    if (stepSize === '1d') {
      currentTime.setDate(currentTime.getDate() + 1);
    } else if (stepSize === '1h') {
      currentTime.setHours(currentTime.getHours() + 1);
    }
  }

  return {
    name: name,
    positions: positions
  };
}

function simulateOrbitalElements(bodyId, epoch) {
  // Simplified orbital elements for major planets
  const elements = {
    'Mercury': {
      a: 0.38710, // Semi-major axis (AU)
      e: 0.20563, // Eccentricity
      i: 7.005,   // Inclination (degrees)
      L: 252.251, // Mean longitude (degrees)
      w: 77.456,  // Longitude of periapsis (degrees)
      O: 48.331   // Longitude of ascending node (degrees)
    },
    'Venus': {
      a: 0.72333,
      e: 0.00677,
      i: 3.395,
      L: 181.980,
      w: 131.533,
      O: 76.681
    },
    'Earth': {
      a: 1.00000,
      e: 0.01671,
      i: 0.000,
      L: 100.464,
      w: 102.937,
      O: 0.000
    },
    'Mars': {
      a: 1.52366,
      e: 0.09340,
      i: 1.850,
      L: 355.433,
      w: 336.041,
      O: 49.558
    }
  };

  return elements[bodyId] || elements['Earth'];
}

function getOrbitalDistance(bodyId) {
  const distances = {
    'Mercury': 0.39, 'Venus': 0.72, 'Earth': 1.0, 'Mars': 1.52,
    'Jupiter': 5.20, 'Saturn': 9.54, 'Uranus': 19.2, 'Neptune': 30.1, 'Pluto': 39.5
  };
  return distances[bodyId] || 1.0;
}

function getOrbitalSpeed(bodyId) {
  // Approximate orbital speeds (radians per day)
  const speeds = {
    'Mercury': 0.024, 'Venus': 0.017, 'Earth': 0.017, 'Mars': 0.009,
    'Jupiter': 0.0015, 'Saturn': 0.0006, 'Uranus': 0.0002, 'Neptune': 0.0001, 'Pluto': 0.00007
  };
  return speeds[bodyId] || 0.017;
}

module.exports = router;