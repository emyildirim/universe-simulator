/**
 * Tests for coordinate utilities
 */

import {
  raDecParallaxToCartesian,
  distanceBetween,
  parallaxToDistance,
  degreesToRadians,
  radiansToDegrees
} from '../src/coordinate-utils.js';

/**
 * Simple test runner
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Test failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

function assertClose(actual, expected, tolerance = 1e-10, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Test failed: ${message}. Expected ${expected}, got ${actual}`);
  }
  console.log(`✓ ${message}`);
}

// Test utility functions
console.log('Testing utility functions...');

// Test degrees to radians conversion
assertClose(degreesToRadians(0), 0, 1e-10, 'degreesToRadians(0) = 0');
assertClose(degreesToRadians(90), Math.PI / 2, 1e-10, 'degreesToRadians(90) = π/2');
assertClose(degreesToRadians(180), Math.PI, 1e-10, 'degreesToRadians(180) = π');

// Test radians to degrees conversion
assertClose(radiansToDegrees(0), 0, 1e-10, 'radiansToDegrees(0) = 0');
assertClose(radiansToDegrees(Math.PI / 2), 90, 1e-10, 'radiansToDegrees(π/2) = 90');
assertClose(radiansToDegrees(Math.PI), 180, 1e-10, 'radiansToDegrees(π) = 180');

// Test parallax to distance conversion
console.log('Testing parallax to distance conversion...');

assertClose(parallaxToDistance(1000), 1, 1e-10, 'parallax 1000 mas = 1 parsec');
assertClose(parallaxToDistance(100), 10, 1e-10, 'parallax 100 mas = 10 parsecs');
assertClose(parallaxToDistance(10), 100, 1e-10, 'parallax 10 mas = 100 parsecs');

// Test invalid parallax
assert(parallaxToDistance(0) === null, 'parallax 0 should return null');
assert(parallaxToDistance(-1) === null, 'negative parallax should return null');
assert(parallaxToDistance(null) === null, 'null parallax should return null');

// Test coordinate conversion
console.log('Testing RA/Dec/Parallax to Cartesian conversion...');

// Test star at RA=0°, Dec=0°, parallax=1000 mas (1 parsec distance)
const star1 = raDecParallaxToCartesian(0, 0, 1000);
assert(star1 !== null, 'Valid parallax should not return null');
assertClose(star1.d_pc, 1, 1e-10, 'Distance should be 1 parsec');
assertClose(star1.x, 1, 1e-10, 'x coordinate for RA=0°, Dec=0°');
assertClose(star1.y, 0, 1e-10, 'y coordinate for RA=0°, Dec=0°');
assertClose(star1.z, 0, 1e-10, 'z coordinate for RA=0°, Dec=0°');

// Test star at RA=90°, Dec=0°, parallax=1000 mas
const star2 = raDecParallaxToCartesian(90, 0, 1000);
assertClose(star2.x, 0, 1e-10, 'x coordinate for RA=90°, Dec=0°');
assertClose(star2.y, 1, 1e-10, 'y coordinate for RA=90°, Dec=0°');
assertClose(star2.z, 0, 1e-10, 'z coordinate for RA=90°, Dec=0°');

// Test star at RA=0°, Dec=90°, parallax=1000 mas
const star3 = raDecParallaxToCartesian(0, 90, 1000);
assertClose(star3.x, 0, 1e-10, 'x coordinate for RA=0°, Dec=90°');
assertClose(star3.y, 0, 1e-10, 'y coordinate for RA=0°, Dec=90°');
assertClose(star3.z, 1, 1e-10, 'z coordinate for RA=0°, Dec=90°');

// Test invalid parallax in coordinate conversion
assert(raDecParallaxToCartesian(0, 0, 0) === null, 'Zero parallax should return null');
assert(raDecParallaxToCartesian(0, 0, -1) === null, 'Negative parallax should return null');

// Test distance calculation
console.log('Testing distance calculation...');

// Distance between star1 (1,0,0) and star2 (0,1,0) should be sqrt(2)
const dist12 = distanceBetween(star1, star2);
assertClose(dist12, Math.sqrt(2), 1e-10, 'Distance between perpendicular unit vectors');

// Distance between star1 (1,0,0) and star3 (0,0,1) should be sqrt(2)
const dist13 = distanceBetween(star1, star3);
assertClose(dist13, Math.sqrt(2), 1e-10, 'Distance between perpendicular unit vectors');

// Distance between star2 (0,1,0) and star3 (0,0,1) should be sqrt(2)
const dist23 = distanceBetween(star2, star3);
assertClose(dist23, Math.sqrt(2), 1e-10, 'Distance between perpendicular unit vectors');

// Test with real-world example: Alpha Centauri (approximate values)
console.log('Testing with real-world example...');

// Alpha Centauri A: RA ≈ 219.9°, Dec ≈ -60.8°, parallax ≈ 742 mas
const alphaCenA = raDecParallaxToCartesian(219.9, -60.8, 742);
assert(alphaCenA !== null, 'Alpha Centauri A conversion should succeed');
assertClose(alphaCenA.d_pc, 1000/742, 1e-6, 'Alpha Centauri A distance');

// Test origin point
const origin = { x: 0, y: 0, z: 0 };
const distToAlphaCen = distanceBetween(origin, alphaCenA);
assertClose(distToAlphaCen, alphaCenA.d_pc, 1e-10, 'Distance from origin should equal the star distance');

console.log('All tests passed! ✅');