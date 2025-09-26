/**
 * Web utilities for the Universe Simulator
 * Browser-compatible version of coordinate utilities
 */

// Browser-compatible coordinate utilities (without ES6 imports)
function raDecParallaxToCartesian(raDeg, decDeg, parallaxMas) {
  if (!parallaxMas || parallaxMas <= 0) return null;
  const d_pc = 1000.0 / parallaxMas;
  const rad = Math.PI / 180.0;
  const ra = raDeg * rad;
  const dec = decDeg * rad;
  const cosd = Math.cos(dec);
  const x = d_pc * cosd * Math.cos(ra);
  const y = d_pc * cosd * Math.sin(ra);
  const z = d_pc * Math.sin(dec);
  return {x, y, z, d_pc};
}

function distanceBetween(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

// Make functions available globally for HTML
if (typeof window !== 'undefined') {
  window.CoordinateUtils = {
    raDecParallaxToCartesian,
    distanceBetween
  };
}