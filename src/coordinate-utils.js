/**
 * Coordinate Utilities for Universe Simulator
 * 
 * Provides functions to convert between astronomical coordinate systems
 * and calculate distances between celestial objects.
 */

/**
 * Convert RA/Dec/Parallax to Cartesian coordinates
 * @param {number} raDeg - Right Ascension in degrees
 * @param {number} decDeg - Declination in degrees
 * @param {number} parallaxMas - Parallax in milliarcseconds
 * @returns {Object|null} Object with {x, y, z, d_pc} coordinates or null if invalid parallax
 */
export function raDecParallaxToCartesian(raDeg, decDeg, parallaxMas) {
  // Check for valid parallax
  if (!parallaxMas || parallaxMas <= 0) {
    return null; // no reliable distance
  }
  
  // Convert parallax to distance in parsecs
  const d_pc = 1000.0 / parallaxMas; // parsecs
  
  // Convert degrees to radians
  const rad = Math.PI / 180.0;
  const ra = raDeg * rad;
  const dec = decDeg * rad;
  
  // Calculate Cartesian coordinates (ICRS-like)
  const cosd = Math.cos(dec);
  const x = d_pc * cosd * Math.cos(ra);
  const y = d_pc * cosd * Math.sin(ra);
  const z = d_pc * Math.sin(dec);
  
  return { x, y, z, d_pc };
}

/**
 * Calculate Euclidean distance between two objects in 3D space
 * @param {Object} a - First object with {x, y, z} coordinates
 * @param {Object} b - Second object with {x, y, z} coordinates
 * @returns {number} Distance in parsecs
 */
export function distanceBetween(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz); // in parsecs
}

/**
 * Convert parallax in milliarcseconds to distance in parsecs
 * @param {number} parallaxMas - Parallax in milliarcseconds
 * @returns {number|null} Distance in parsecs or null if invalid parallax
 */
export function parallaxToDistance(parallaxMas) {
  if (!parallaxMas || parallaxMas <= 0) {
    return null;
  }
  return 1000.0 / parallaxMas;
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export function degreesToRadians(degrees) {
  return degrees * Math.PI / 180.0;
}

/**
 * Convert radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
export function radiansToDegrees(radians) {
  return radians * 180.0 / Math.PI;
}