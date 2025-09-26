/**
 * Universe Simulator - Main Entry Point
 * 
 * Demonstrates the coordinate utilities with example stars
 */

import {
  raDecParallaxToCartesian,
  distanceBetween,
  parallaxToDistance
} from './coordinate-utils.js';

console.log('🌌 Universe Simulator - Coordinate Math Demo\n');

// Example stars with Gaia-like data
const exampleStars = [
  {
    name: 'Proxima Centauri',
    ra: 217.429, // degrees
    dec: -62.681, // degrees
    parallax: 768.13 // milliarcseconds
  },
  {
    name: 'Alpha Centauri A',
    ra: 219.901, // degrees
    dec: -60.834, // degrees
    parallax: 747.1 // milliarcseconds
  },
  {
    name: 'Sirius A',
    ra: 101.287, // degrees
    dec: -16.716, // degrees
    parallax: 379.21 // milliarcseconds
  },
  {
    name: 'Vega',
    ra: 279.234, // degrees
    dec: 38.784, // degrees
    parallax: 128.93 // milliarcseconds
  }
];

console.log('Converting stellar coordinates to Cartesian system:\n');

// Convert all stars to Cartesian coordinates
const stars3D = [];
for (const star of exampleStars) {
  const coords = raDecParallaxToCartesian(star.ra, star.dec, star.parallax);
  
  if (coords) {
    const starData = {
      ...star,
      ...coords
    };
    stars3D.push(starData);
    
    console.log(`${star.name}:`);
    console.log(`  RA: ${star.ra.toFixed(3)}°, Dec: ${star.dec.toFixed(3)}°`);
    console.log(`  Parallax: ${star.parallax.toFixed(2)} mas`);
    console.log(`  Distance: ${coords.d_pc.toFixed(2)} parsecs`);
    console.log(`  Cartesian: (${coords.x.toFixed(3)}, ${coords.y.toFixed(3)}, ${coords.z.toFixed(3)})`);
    console.log('');
  } else {
    console.log(`${star.name}: Invalid parallax data`);
  }
}

console.log('Calculating distances between stars:\n');

// Calculate distances between all pairs of stars
for (let i = 0; i < stars3D.length; i++) {
  for (let j = i + 1; j < stars3D.length; j++) {
    const star1 = stars3D[i];
    const star2 = stars3D[j];
    const distance = distanceBetween(star1, star2);
    
    console.log(`Distance between ${star1.name} and ${star2.name}: ${distance.toFixed(3)} parsecs`);
  }
}

console.log('\n🚀 Universe Simulator coordinate utilities are working!');