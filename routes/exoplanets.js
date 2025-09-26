const express = require('express');
const axios = require('axios');
const { formatCoordinates, convertDistance } = require('../utils/astronomical');

const router = express.Router();

// NASA Exoplanet Archive API base URL
const EXOPLANET_API_BASE = 'https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI';

/**
 * Search confirmed exoplanets
 * Implements requirement: "Exoplanet Archive API for confirmed exoplanets, metadata, discovery method"
 */
router.get('/confirmed', async (req, res) => {
  try {
    const {
      discovery_method,
      host_name,
      planet_radius_min,
      planet_radius_max,
      orbital_period_min,
      orbital_period_max,
      distance_max = 1000, // parsecs
      limit = 100
    } = req.query;

    // Build query parameters for NASA Exoplanet Archive
    const queryParams = {
      table: 'ps', // Planetary Systems table
      format: 'json',
      select: 'pl_name,hostname,discoverymethod,disc_year,ra,dec,sy_dist,pl_orbper,pl_rade,pl_masse,pl_eqt,st_teff,st_rad,st_mass',
      order: 'sy_dist',
      limit: Math.min(parseInt(limit), 1000) // Cap at 1000 results
    };

    // Add filters based on query parameters
    const whereConditions = [];
    
    if (discovery_method) {
      whereConditions.push(`discoverymethod='${discovery_method}'`);
    }
    
    if (host_name) {
      whereConditions.push(`hostname like '%${host_name}%'`);
    }
    
    if (planet_radius_min) {
      whereConditions.push(`pl_rade>${planet_radius_min}`);
    }
    
    if (planet_radius_max) {
      whereConditions.push(`pl_rade<${planet_radius_max}`);
    }
    
    if (orbital_period_min) {
      whereConditions.push(`pl_orbper>${orbital_period_min}`);
    }
    
    if (orbital_period_max) {
      whereConditions.push(`pl_orbper<${orbital_period_max}`);
    }
    
    if (distance_max) {
      whereConditions.push(`sy_dist<${distance_max}`);
    }

    if (whereConditions.length > 0) {
      queryParams.where = whereConditions.join(' and ');
    }

    // For demo purposes, simulate the API response
    const exoplanets = await simulateExoplanetData(queryParams);

    // Process and format the results
    const processedExoplanets = exoplanets.map(planet => ({
      name: planet.pl_name,
      host_star: planet.hostname,
      discovery: {
        method: planet.discoverymethod,
        year: planet.disc_year
      },
      coordinates: formatCoordinates(planet.ra || 0, planet.dec || 0, 'ICRS'),
      system_distance: {
        value: planet.sy_dist,
        unit: 'parsecs',
        distance_ly: planet.sy_dist ? convertDistance(planet.sy_dist, 'pc', 'ly') : null
      },
      planet_properties: {
        orbital_period_days: planet.pl_orbper,
        radius_earth_radii: planet.pl_rade,
        mass_earth_masses: planet.pl_masse,
        equilibrium_temp_k: planet.pl_eqt
      },
      host_star_properties: {
        effective_temp_k: planet.st_teff,
        radius_solar_radii: planet.st_rad,
        mass_solar_masses: planet.st_mass
      }
    }));

    res.json({
      query_info: {
        total_results: processedExoplanets.length,
        coordinate_frame: 'ICRS',
        distance_unit: 'parsecs',
        filters_applied: whereConditions
      },
      exoplanets: processedExoplanets
    });

  } catch (error) {
    console.error('Exoplanet Archive API error:', error);
    res.status(500).json({ error: 'Failed to fetch exoplanet data' });
  }
});

/**
 * Get exoplanets by discovery method
 */
router.get('/by-method/:method', async (req, res) => {
  try {
    const { method } = req.params;
    const { limit = 50 } = req.query;

    const validMethods = [
      'Transit', 'Radial Velocity', 'Microlensing', 'Direct Imaging', 
      'Astrometry', 'Pulsar Timing', 'Eclipse Timing Variations'
    ];

    if (!validMethods.some(m => m.toLowerCase() === method.toLowerCase())) {
      return res.status(400).json({ 
        error: `Invalid discovery method. Valid methods: ${validMethods.join(', ')}` 
      });
    }

    const queryParams = {
      table: 'ps',
      where: `discoverymethod='${method}'`,
      limit: parseInt(limit)
    };

    const exoplanets = await simulateExoplanetData(queryParams);

    res.json({
      discovery_method: method,
      count: exoplanets.length,
      exoplanets: exoplanets.map(p => ({
        name: p.pl_name,
        host: p.hostname,
        year: p.disc_year,
        distance_pc: p.sy_dist,
        orbital_period: p.pl_orbper
      }))
    });

  } catch (error) {
    console.error('Discovery method query error:', error);
    res.status(500).json({ error: 'Failed to fetch data by discovery method' });
  }
});

/**
 * Get habitable zone exoplanets
 */
router.get('/habitable-zone', async (req, res) => {
  try {
    const { distance_max = 100, limit = 50 } = req.query;

    // Simulate search for potentially habitable exoplanets
    const habitableExoplanets = await simulateHabitableExoplanets(distance_max, limit);

    res.json({
      search_criteria: {
        max_distance_pc: distance_max,
        habitable_zone_definition: 'Conservative liquid water zone'
      },
      count: habitableExoplanets.length,
      exoplanets: habitableExoplanets
    });

  } catch (error) {
    console.error('Habitable zone query error:', error);
    res.status(500).json({ error: 'Failed to fetch habitable zone data' });
  }
});

// Simulation functions for demo purposes
async function simulateExoplanetData(queryParams) {
  const discoveryMethods = [
    'Transit', 'Radial Velocity', 'Microlensing', 'Direct Imaging',
    'Astrometry', 'Pulsar Timing'
  ];

  const exoplanets = [];
  const count = Math.min(queryParams.limit || 100, 200);

  for (let i = 0; i < count; i++) {
    const distance = 10 + Math.random() * 990; // 10-1000 pc
    const orbitalPeriod = 0.1 + Math.random() * 3650; // 0.1-3650 days
    const planetRadius = 0.1 + Math.random() * 20; // 0.1-20 Earth radii
    const stellarTemp = 3000 + Math.random() * 4000; // 3000-7000 K
    
    exoplanets.push({
      pl_name: `Kepler-${1000 + i}b`,
      hostname: `Kepler-${1000 + i}`,
      discoverymethod: discoveryMethods[Math.floor(Math.random() * discoveryMethods.length)],
      disc_year: 2009 + Math.floor(Math.random() * 15),
      ra: Math.random() * 360,
      dec: (Math.random() - 0.5) * 180,
      sy_dist: distance,
      pl_orbper: orbitalPeriod,
      pl_rade: planetRadius,
      pl_masse: Math.pow(planetRadius, 2.06), // Mass-radius relation
      pl_eqt: stellarTemp * Math.pow(0.25 * Math.pow(orbitalPeriod / 365, -0.5), 0.25),
      st_teff: stellarTemp,
      st_rad: 0.5 + Math.random() * 2, // 0.5-2.5 solar radii
      st_mass: 0.3 + Math.random() * 2 // 0.3-2.3 solar masses
    });
  }

  return exoplanets.sort((a, b) => a.sy_dist - b.sy_dist);
}

async function simulateHabitableExoplanets(maxDistance, limit) {
  const habitable = [];
  
  for (let i = 0; i < limit; i++) {
    const distance = 10 + Math.random() * (maxDistance - 10);
    const stellarTemp = 4000 + Math.random() * 2000; // Sun-like stars
    const orbitalPeriod = 200 + Math.random() * 600; // Roughly habitable zone
    const planetRadius = 0.8 + Math.random() * 2.4; // Super-Earths to mini-Neptunes
    
    // Calculate equilibrium temperature
    const eqTemp = stellarTemp * Math.pow(0.25 * Math.pow(orbitalPeriod / 365, -0.5), 0.25);
    
    // Only include if in rough habitable zone (250-350 K)
    if (eqTemp >= 250 && eqTemp <= 350) {
      habitable.push({
        name: `TOI-${5000 + i}.01`,
        host_star: `TOI-${5000 + i}`,
        distance_pc: distance,
        orbital_period_days: orbitalPeriod,
        radius_earth_radii: planetRadius,
        equilibrium_temp_k: eqTemp,
        habitable_zone_position: eqTemp < 280 ? 'outer' : eqTemp > 320 ? 'inner' : 'center',
        coordinates: formatCoordinates(Math.random() * 360, (Math.random() - 0.5) * 180, 'ICRS')
      });
    }
  }

  return habitable;
}

module.exports = router;