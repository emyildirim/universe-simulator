/**
 * Astronomical utility functions for handling coordinate systems,
 * parallax uncertainties, and unit conversions
 */

// Unit conversion constants
const UNITS = {
  PARSEC_TO_AU: 206264.806,
  PARSEC_TO_LY: 3.26156,
  AU_TO_KM: 149597870.7,
  MAS_TO_ARCSEC: 0.001
};

/**
 * Validates parallax measurements and calculates distances
 * Implements requirement: "Handle Gaia parallaxes that are tiny or negative"
 * @param {number} parallax - Parallax in milliarcseconds
 * @param {number} error - Parallax error in milliarcseconds
 * @returns {Object} Validation result and distance estimate
 */
function validateParallax(parallax, error) {
  const snr = error > 0 ? Math.abs(parallax) / error : 0;
  
  // Check for reliable parallax (SNR > 5 and positive)
  if (parallax > 0 && snr > 5) {
    return {
      isValid: true,
      distance: 1000 / parallax, // Distance in parsecs
      uncertainty: (error / Math.pow(parallax, 2)) * 1000,
      snr: snr,
      method: 'trigonometric_parallax'
    };
  }
  
  // For unreliable parallaxes, use recommended distance estimates
  if (parallax <= 0 || snr <= 5) {
    // Use Bailer-Jones et al. (2021) recommended approach
    // Simplified exponentially decreasing space density prior
    const priorLength = 1350; // Scale length in parsecs
    const estimatedDistance = estimateBailerJonesDistance(parallax, error, priorLength);
    
    return {
      isValid: false,
      distance: estimatedDistance,
      uncertainty: estimatedDistance * 0.3, // ~30% uncertainty for estimates
      snr: snr,
      method: 'photogeometric_estimate'
    };
  }
}

/**
 * Bailer-Jones distance estimator for problematic parallaxes
 * @param {number} parallax - Observed parallax (mas)
 * @param {number} error - Parallax error (mas)
 * @param {number} L - Prior scale length (pc)
 * @returns {number} Estimated distance in parsecs
 */
function estimateBailerJonesDistance(parallax, error, L = 1350) {
  if (error <= 0) return null;
  
  // Simplified calculation - in practice would use full Bayesian inference
  const varpi = parallax / 1000; // Convert to arcsec
  const sigma = error / 1000;
  
  if (varpi <= 0) {
    // For negative/zero parallax, use mode of prior
    return L / 2;
  }
  
  // Approximate mode of posterior
  const r_mode = 1 / varpi; // Initial estimate
  return Math.max(10, Math.min(10000, r_mode)); // Clamp to reasonable range
}

/**
 * Format coordinates in specified reference frame
 * Implements requirement: "Use ICRS/ICRF for star positions"
 * @param {number} ra - Right ascension in degrees
 * @param {number} dec - Declination in degrees
 * @param {string} frame - Coordinate frame (ICRS, ICRF, J2000)
 * @returns {Object} Formatted coordinate object
 */
function formatCoordinates(ra, dec, frame = 'ICRS') {
  // Normalize RA to 0-360 range
  const normalizedRa = ((ra % 360) + 360) % 360;
  
  // Clamp declination to valid range
  const clampedDec = Math.max(-90, Math.min(90, dec));
  
  return {
    ra_deg: normalizedRa,
    dec_deg: clampedDec,
    ra_hms: degreesToHMS(normalizedRa),
    dec_dms: degreesToDMS(clampedDec),
    frame: frame,
    epoch: frame === 'J2000' ? 'J2000.0' : 'ICRS'
  };
}

/**
 * Convert degrees to hours:minutes:seconds format
 * @param {number} degrees - Angle in degrees
 * @returns {string} HMS format string
 */
function degreesToHMS(degrees) {
  const hours = degrees / 15;
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = ((hours - h) * 60 - m) * 60;
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}

/**
 * Convert degrees to degrees:minutes:seconds format
 * @param {number} degrees - Angle in degrees
 * @returns {string} DMS format string
 */
function degreesToDMS(degrees) {
  const sign = degrees >= 0 ? '+' : '-';
  const absDeg = Math.abs(degrees);
  const d = Math.floor(absDeg);
  const m = Math.floor((absDeg - d) * 60);
  const s = ((absDeg - d) * 60 - m) * 60;
  
  return `${sign}${d.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
}

/**
 * Convert between different distance units
 * Implements requirement: "Be consistent (parsecs vs AU vs ly)"
 * @param {number} value - Distance value
 * @param {string} fromUnit - Source unit (pc, au, ly, km)
 * @param {string} toUnit - Target unit
 * @returns {number} Converted distance
 */
function convertDistance(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  
  // Convert to parsecs first
  let parsecs;
  switch (fromUnit.toLowerCase()) {
    case 'pc':
    case 'parsec':
    case 'parsecs':
      parsecs = value;
      break;
    case 'au':
      parsecs = value / UNITS.PARSEC_TO_AU;
      break;
    case 'ly':
    case 'lightyear':
    case 'lightyears':
      parsecs = value / UNITS.PARSEC_TO_LY;
      break;
    case 'km':
      parsecs = value / (UNITS.PARSEC_TO_AU * UNITS.AU_TO_KM);
      break;
    default:
      throw new Error(`Unknown distance unit: ${fromUnit}`);
  }
  
  // Convert from parsecs to target unit
  switch (toUnit.toLowerCase()) {
    case 'pc':
    case 'parsec':
    case 'parsecs':
      return parsecs;
    case 'au':
      return parsecs * UNITS.PARSEC_TO_AU;
    case 'ly':
    case 'lightyear':
    case 'lightyears':
      return parsecs * UNITS.PARSEC_TO_LY;
    case 'km':
      return parsecs * UNITS.PARSEC_TO_AU * UNITS.AU_TO_KM;
    default:
      throw new Error(`Unknown distance unit: ${toUnit}`);
  }
}

/**
 * Convert proper motion to tangential velocity
 * @param {number} pm - Proper motion in mas/yr
 * @param {number} distance - Distance in parsecs
 * @returns {number} Tangential velocity in km/s
 */
function properMotionToVelocity(pm, distance) {
  // Convert mas/yr to km/s
  // v = 4.74 * μ * d, where μ is in arcsec/yr and d is in pc
  return 4.74 * (pm / 1000) * distance;
}

module.exports = {
  validateParallax,
  estimateBailerJonesDistance,
  formatCoordinates,
  convertDistance,
  properMotionToVelocity,
  degreesToHMS,
  degreesToDMS,
  UNITS
};