const express = require('express');
const axios = require('axios');
const { formatCoordinates, convertDistance } = require('../utils/astronomical');

const router = express.Router();

// SIMBAD API base URL
const SIMBAD_BASE_URL = 'https://simbad.u-strasbg.fr/simbad/sim-tap/sync';

/**
 * Name resolution for astronomical objects
 * Implements requirement: "SIMBAD - name resolution and metadata queries"
 */
router.get('/resolve/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { format = 'json' } = req.query;

    // Build ADQL query for SIMBAD TAP service
    const query = `
      SELECT 
        main_id,
        ra,
        dec,
        plx_value,
        plx_error,
        pmra,
        pmdec,
        rvz_radvel,
        sp_type,
        otype_txt,
        flux_V,
        flux_B
      FROM basic 
      WHERE main_id = '${name}' OR id = '${name}'
    `;

    // For demo purposes, simulate SIMBAD response
    const simbadData = await simulateSimbadResponse(name);

    if (!simbadData) {
      return res.status(404).json({ 
        error: `Object '${name}' not found in SIMBAD database` 
      });
    }

    // Format the response
    const response = {
      query: {
        object_name: name,
        resolved_name: simbadData.main_id,
        coordinate_frame: 'ICRS',
        epoch: 'J2000.0'
      },
      object_data: {
        main_identifier: simbadData.main_id,
        object_type: simbadData.otype_txt,
        coordinates: formatCoordinates(simbadData.ra, simbadData.dec, 'ICRS'),
        astrometry: {
          parallax_mas: simbadData.plx_value,
          parallax_error_mas: simbadData.plx_error,
          proper_motion_ra_mas_yr: simbadData.pmra,
          proper_motion_dec_mas_yr: simbadData.pmdec,
          radial_velocity_km_s: simbadData.rvz_radvel
        },
        photometry: {
          v_magnitude: simbadData.flux_V,
          b_magnitude: simbadData.flux_B,
          b_v_color: simbadData.flux_B && simbadData.flux_V ? 
            simbadData.flux_B - simbadData.flux_V : null
        },
        spectral_type: simbadData.sp_type,
        distance: simbadData.plx_value && simbadData.plx_value > 0 ? {
          value_pc: 1000 / simbadData.plx_value,
          value_ly: convertDistance(1000 / simbadData.plx_value, 'pc', 'ly'),
          method: 'trigonometric_parallax'
        } : null
      }
    };

    res.json(response);

  } catch (error) {
    console.error('SIMBAD resolution error:', error);
    res.status(500).json({ error: 'Failed to resolve object name' });
  }
});

/**
 * Search objects by coordinates (cone search)
 */
router.get('/cone-search', async (req, res) => {
  try {
    const {
      ra,
      dec,
      radius = 1.0, // arcminutes
      limit = 50
    } = req.query;

    if (!ra || !dec) {
      return res.status(400).json({ 
        error: 'Both ra and dec parameters are required' 
      });
    }

    const raNum = parseFloat(ra);
    const decNum = parseFloat(dec);
    const radiusNum = parseFloat(radius);

    // Validate coordinate ranges
    if (raNum < 0 || raNum >= 360 || decNum < -90 || decNum > 90) {
      return res.status(400).json({ 
        error: 'Invalid coordinates. RA must be 0-360°, Dec must be -90° to +90°' 
      });
    }

    // Build ADQL cone search query
    const query = `
      SELECT 
        main_id,
        ra,
        dec,
        plx_value,
        flux_V,
        otype_txt,
        DISTANCE(POINT('ICRS', ra, dec), POINT('ICRS', ${raNum}, ${decNum})) AS sep_arcmin
      FROM basic 
      WHERE CONTAINS(POINT('ICRS', ra, dec), CIRCLE('ICRS', ${raNum}, ${decNum}, ${radiusNum/60})) = 1
      ORDER BY sep_arcmin
      LIMIT ${Math.min(parseInt(limit), 200)}
    `;

    // Simulate cone search results
    const objects = await simulateConeSearch(raNum, decNum, radiusNum, parseInt(limit));

    res.json({
      search_parameters: {
        center_ra_deg: raNum,
        center_dec_deg: decNum,
        radius_arcmin: radiusNum,
        coordinate_frame: 'ICRS'
      },
      results: {
        count: objects.length,
        objects: objects
      }
    });

  } catch (error) {
    console.error('Cone search error:', error);
    res.status(500).json({ error: 'Failed to perform cone search' });
  }
});

/**
 * Get object identifiers and aliases
 */
router.get('/identifiers/:name', async (req, res) => {
  try {
    const { name } = req.params;

    // Query for all identifiers of an object
    const identifiers = await simulateIdentifiers(name);

    res.json({
      main_identifier: identifiers.main_id,
      all_identifiers: identifiers.aliases,
      count: identifiers.aliases.length
    });

  } catch (error) {
    console.error('Identifiers query error:', error);
    res.status(500).json({ error: 'Failed to fetch object identifiers' });
  }
});

/**
 * Search objects by object type
 */
router.get('/by-type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { 
      limit = 100,
      magnitude_max = 12,
      distance_max = 1000 
    } = req.query;

    // Common astronomical object types
    const validTypes = {
      'star': 'Star',
      'galaxy': 'Galaxy',
      'nebula': 'Nebula',
      'cluster': 'Cluster',
      'variable': 'Variable Star',
      'double': 'Double or multiple star',
      'pulsar': 'Pulsar',
      'quasar': 'Quasar'
    };

    const objectType = validTypes[type.toLowerCase()];
    if (!objectType) {
      return res.status(400).json({
        error: `Invalid object type. Valid types: ${Object.keys(validTypes).join(', ')}`
      });
    }

    const objects = await simulateObjectsByType(objectType, limit, magnitude_max, distance_max);

    res.json({
      object_type: objectType,
      search_criteria: {
        max_magnitude: magnitude_max,
        max_distance_pc: distance_max
      },
      count: objects.length,
      objects: objects
    });

  } catch (error) {
    console.error('Object type search error:', error);
    res.status(500).json({ error: 'Failed to search by object type' });
  }
});

// Simulation functions for demo purposes
async function simulateSimbadResponse(name) {
  // Database of well-known astronomical objects
  const knownObjects = {
    'Sirius': {
      main_id: 'HD 48915',
      ra: 101.287,
      dec: -16.716,
      plx_value: 374.49,
      plx_error: 0.13,
      pmra: -546.05,
      pmdec: -1223.14,
      rvz_radvel: -7.6,
      sp_type: 'A0mA1Va',
      otype_txt: 'High proper-motion Star',
      flux_V: -1.44,
      flux_B: -1.05
    },
    'Betelgeuse': {
      main_id: 'HD 39801',
      ra: 88.793,
      dec: 7.407,
      plx_value: 4.51,
      plx_error: 0.8,
      pmra: 26.42,
      pmdec: 9.56,
      rvz_radvel: 21.0,
      sp_type: 'M1-2Ia-Iab',
      otype_txt: 'Semi-regular pulsating Star',
      flux_V: 0.45,
      flux_B: 1.85
    },
    'Vega': {
      main_id: 'HD 172167',
      ra: 279.234,
      dec: 38.784,
      plx_value: 130.23,
      plx_error: 0.36,
      pmra: 200.94,
      pmdec: 286.23,
      rvz_radvel: -20.6,
      sp_type: 'A0Va',
      otype_txt: 'Variable Star',
      flux_V: 0.03,
      flux_B: 0.00
    },
    'Proxima Centauri': {
      main_id: 'HD 130148',
      ra: 217.429,
      dec: -62.680,
      plx_value: 768.5,
      plx_error: 0.2,
      pmra: -3775.40,
      pmdec: 769.33,
      rvz_radvel: -22.4,
      sp_type: 'M5.5Ve',
      otype_txt: 'Flare Star',
      flux_V: 11.05,
      flux_B: 12.29
    }
  };

  // Check for exact match or partial match
  const exactMatch = knownObjects[name];
  if (exactMatch) return exactMatch;

  // Check for partial matches
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(knownObjects)) {
    if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
      return value;
    }
  }

  return null;
}

async function simulateConeSearch(ra, dec, radius, limit) {
  const objects = [];
  const numObjects = Math.min(limit, Math.floor(Math.random() * 20) + 5);

  for (let i = 0; i < numObjects; i++) {
    // Generate random positions within the search radius
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radius / 60; // Convert to degrees
    
    const objRa = ra + distance * Math.cos(angle) / Math.cos(dec * Math.PI / 180);
    const objDec = dec + distance * Math.sin(angle);
    const separation = Math.sqrt(Math.pow((objRa - ra) * Math.cos(dec * Math.PI / 180), 2) + Math.pow(objDec - dec, 2)) * 60;

    objects.push({
      main_id: `USNO-B1.0 ${String(Math.floor(Math.random() * 1000000000)).padStart(10, '0')}`,
      ra: objRa,
      dec: objDec,
      separation_arcmin: separation,
      magnitude_v: 8 + Math.random() * 8,
      object_type: ['Star', 'Galaxy', 'Quasar'][Math.floor(Math.random() * 3)]
    });
  }

  return objects.sort((a, b) => a.separation_arcmin - b.separation_arcmin);
}

async function simulateIdentifiers(name) {
  const baseIdentifiers = {
    'Sirius': {
      main_id: 'HD 48915',
      aliases: ['HD 48915', 'HIP 32349', 'HR 2491', 'SAO 151881', 'Alpha CMa', 'Sirius']
    },
    'Vega': {
      main_id: 'HD 172167',
      aliases: ['HD 172167', 'HIP 91262', 'HR 7001', 'SAO 67174', 'Alpha Lyr', 'Vega']
    }
  };

  return baseIdentifiers[name] || {
    main_id: name,
    aliases: [name]
  };
}

async function simulateObjectsByType(objectType, limit, magMax, distMax) {
  const objects = [];
  
  for (let i = 0; i < Math.min(limit, 50); i++) {
    objects.push({
      main_id: `${objectType.replace(/\s+/g, '')}-${i + 1}`,
      coordinates: formatCoordinates(Math.random() * 360, (Math.random() - 0.5) * 180, 'ICRS'),
      magnitude_v: 6 + Math.random() * (magMax - 6),
      distance_pc: 10 + Math.random() * (distMax - 10),
      object_type: objectType
    });
  }

  return objects.sort((a, b) => a.magnitude_v - b.magnitude_v);
}

module.exports = router;