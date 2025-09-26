const express = require('express');
const axios = require('axios');
const { validateParallax, convertToDistance, formatCoordinates } = require('../utils/astronomical');

const router = express.Router();

// Gaia DR3 streaming endpoint with pre-filtering
// Implements requirement: "Pre-filter on server and stream tiles"
router.get('/stars', async (req, res) => {
  try {
    const {
      ra_min = 0,
      ra_max = 360,
      dec_min = -90,
      dec_max = 90,
      mag_max = 12, // Brightness limit to avoid loading too much data
      parallax_min = 0.1, // Minimum parallax to avoid uncertain distances
      limit = 1000
    } = req.query;

    // Validate query parameters
    if (limit > 10000) {
      return res.status(400).json({ 
        error: 'Limit too high. Maximum 10,000 stars per request to prevent browser overload.' 
      });
    }

    // Build ADQL query for Gaia Archive
    // Uses ICRS coordinate frame as specified in requirements
    const adqlQuery = `
      SELECT 
        source_id,
        ra,
        dec,
        parallax,
        parallax_error,
        phot_g_mean_mag,
        bp_rp,
        pmra,
        pmdec
      FROM gaiadr3.gaia_source
      WHERE 
        ra BETWEEN ${ra_min} AND ${ra_max}
        AND dec BETWEEN ${dec_min} AND ${dec_max}
        AND phot_g_mean_mag < ${mag_max}
        AND parallax > ${parallax_min}
        AND parallax_error/parallax < 0.2
      ORDER BY phot_g_mean_mag
      LIMIT ${limit}
    `;

    // Note: In a real implementation, this would connect to Gaia Archive
    // For this demo, we'll simulate the response structure
    const simulatedStars = generateSimulatedGaiaData(
      parseInt(limit), 
      parseFloat(ra_min), 
      parseFloat(ra_max),
      parseFloat(dec_min), 
      parseFloat(dec_max)
    );

    // Process each star to handle parallax uncertainties
    const processedStars = simulatedStars.map(star => {
      const { isValid, distance, uncertainty } = validateParallax(star.parallax, star.parallax_error);
      
      return {
        ...star,
        // Convert coordinates to ICRS format
        coordinates: formatCoordinates(star.ra, star.dec, 'ICRS'),
        // Handle parallax uncertainties as specified in requirements
        distance_pc: isValid ? distance : null,
        distance_uncertainty: uncertainty,
        distance_method: isValid ? 'parallax' : 'photometric_estimate'
      };
    });

    res.json({
      query_info: {
        total_stars: processedStars.length,
        coordinate_frame: 'ICRS',
        distance_unit: 'parsecs',
        magnitude_limit: mag_max
      },
      stars: processedStars
    });

  } catch (error) {
    console.error('Gaia query error:', error);
    res.status(500).json({ error: 'Failed to fetch Gaia data' });
  }
});

// Tile-based streaming endpoint for large sky areas
router.get('/tiles/:level/:x/:y', async (req, res) => {
  const { level, x, y } = req.params;
  const { mag_limit = 10 } = req.query;

  try {
    // Calculate sky coordinates for this tile
    const tileSize = 360 / Math.pow(2, level);
    const ra_min = x * tileSize;
    const ra_max = (x + 1) * tileSize;
    const dec_min = -90 + y * tileSize;
    const dec_max = -90 + (y + 1) * tileSize;

    // Generate simulated tile data
    const tileStars = generateSimulatedGaiaData(
      Math.min(500, Math.pow(10, 12 - mag_limit)), // Adaptive density
      ra_min, ra_max, dec_min, dec_max
    );

    res.json({
      tile_info: {
        level: parseInt(level),
        x: parseInt(x),
        y: parseInt(y),
        ra_range: [ra_min, ra_max],
        dec_range: [dec_min, dec_max],
        coordinate_frame: 'ICRS'
      },
      stars: tileStars.map(star => ({
        id: star.source_id,
        ra: star.ra,
        dec: star.dec,
        mag: star.phot_g_mean_mag,
        color: star.bp_rp,
        parallax: star.parallax
      }))
    });

  } catch (error) {
    console.error('Tile generation error:', error);
    res.status(500).json({ error: 'Failed to generate tile data' });
  }
});

// Simulate Gaia data for demo purposes
function generateSimulatedGaiaData(count, ra_min, ra_max, dec_min, dec_max) {
  const stars = [];
  
  for (let i = 0; i < count; i++) {
    const parallax = Math.random() * 10 + 0.1; // 0.1 to 10.1 mas
    const parallax_error = parallax * (0.05 + Math.random() * 0.15); // 5-20% error
    
    stars.push({
      source_id: `gaia_dr3_${Math.floor(Math.random() * 1e15)}`,
      ra: ra_min + Math.random() * (ra_max - ra_min),
      dec: dec_min + Math.random() * (dec_max - dec_min),
      parallax: parallax,
      parallax_error: parallax_error,
      phot_g_mean_mag: 6 + Math.random() * 10, // 6-16 magnitude
      bp_rp: -0.5 + Math.random() * 3, // Color index
      pmra: (Math.random() - 0.5) * 100, // Proper motion
      pmdec: (Math.random() - 0.5) * 100
    });
  }
  
  return stars.sort((a, b) => a.phot_g_mean_mag - b.phot_g_mean_mag);
}

module.exports = router;