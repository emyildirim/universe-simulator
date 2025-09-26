// Mathematical utilities for 3D space calculations
const MathUtils = {
    // Convert spherical coordinates to Cartesian
    sphericalToCartesian: (radius, theta, phi) => {
        return {
            x: radius * Math.sin(phi) * Math.cos(theta),
            y: radius * Math.cos(phi),
            z: radius * Math.sin(phi) * Math.sin(theta)
        };
    },
    
    // Convert Cartesian to spherical coordinates
    cartesianToSpherical: (x, y, z) => {
        const radius = Math.sqrt(x * x + y * y + z * z);
        const theta = Math.atan2(z, x);
        const phi = Math.acos(y / radius);
        return { radius, theta, phi };
    },
    
    // Calculate distance between two 3D points
    distance3D: (p1, p2) => {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dz = p2.z - p1.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },
    
    // Linear interpolation
    lerp: (a, b, t) => {
        return a + (b - a) * t;
    },
    
    // Smooth step function
    smoothstep: (edge0, edge1, x) => {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    },
    
    // Random number generators
    random: (min = 0, max = 1) => {
        return min + Math.random() * (max - min);
    },
    
    randomGaussian: (mean = 0, stdDev = 1) => {
        // Box-Muller transform
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + z0 * stdDev;
    },
    
    // Orbital mechanics calculations
    keplerianToCartesian: (semiMajorAxis, eccentricity, inclination, 
                          longitudeOfAscendingNode, argumentOfPeriapsis, 
                          meanAnomaly, time) => {
        // Simplified Keplerian orbit calculation
        // This is a basic implementation - real ephemeris would be more complex
        
        const E = MathUtils.solveKepler(meanAnomaly, eccentricity);
        const trueAnomaly = 2 * Math.atan2(
            Math.sqrt(1 + eccentricity) * Math.sin(E / 2),
            Math.sqrt(1 - eccentricity) * Math.cos(E / 2)
        );
        
        const radius = semiMajorAxis * (1 - eccentricity * Math.cos(E));
        
        // Position in orbital plane
        const x_orb = radius * Math.cos(trueAnomaly);
        const y_orb = radius * Math.sin(trueAnomaly);
        const z_orb = 0;
        
        // Rotate to 3D space
        const cos_i = Math.cos(inclination);
        const sin_i = Math.sin(inclination);
        const cos_O = Math.cos(longitudeOfAscendingNode);
        const sin_O = Math.sin(longitudeOfAscendingNode);
        const cos_w = Math.cos(argumentOfPeriapsis);
        const sin_w = Math.sin(argumentOfPeriapsis);
        
        const x = (cos_O * cos_w - sin_O * sin_w * cos_i) * x_orb +
                  (-cos_O * sin_w - sin_O * cos_w * cos_i) * y_orb;
        const y = (sin_O * cos_w + cos_O * sin_w * cos_i) * x_orb +
                  (-sin_O * sin_w + cos_O * cos_w * cos_i) * y_orb;
        const z = (sin_w * sin_i) * x_orb + (cos_w * sin_i) * y_orb;
        
        return { x, y, z };
    },
    
    // Solve Kepler's equation numerically
    solveKepler: (meanAnomaly, eccentricity, tolerance = 1e-6) => {
        let E = meanAnomaly; // Initial guess
        let deltaE = 1;
        
        while (Math.abs(deltaE) > tolerance) {
            deltaE = (E - eccentricity * Math.sin(E) - meanAnomaly) / 
                     (1 - eccentricity * Math.cos(E));
            E -= deltaE;
        }
        
        return E;
    },
    
    // Convert Julian day to years since epoch
    julianDayToYears: (jd, epoch = 2451545.0) => {
        return (jd - epoch) / 365.25;
    },
    
    // Screen space to world space conversion helpers
    screenToWorld: (screenX, screenY, camera, canvas) => {
        const mouse = new THREE.Vector2();
        mouse.x = (screenX / canvas.width) * 2 - 1;
        mouse.y = -(screenY / canvas.height) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        
        return raycaster.ray;
    },
    
    // Color utilities
    temperatureToColor: (temperature) => {
        // Convert stellar temperature to RGB color
        // Based on blackbody radiation approximation
        let r, g, b;
        
        if (temperature < 3500) {
            r = 255;
            g = Math.max(0, Math.min(255, (temperature - 1000) / 10));
            b = 0;
        } else if (temperature < 5000) {
            r = 255;
            g = Math.max(0, Math.min(255, 155 + (temperature - 3500) / 15));
            b = Math.max(0, Math.min(255, (temperature - 3500) / 8));
        } else if (temperature < 6500) {
            r = Math.max(0, Math.min(255, 255 - (temperature - 5000) / 20));
            g = 255;
            b = Math.max(0, Math.min(255, 130 + (temperature - 5000) / 12));
        } else {
            r = Math.max(150, Math.min(255, 255 - (temperature - 6500) / 50));
            g = Math.max(150, Math.min(255, 255 - (temperature - 6500) / 80));
            b = 255;
        }
        
        return {
            r: Math.floor(r),
            g: Math.floor(g),
            b: Math.floor(b)
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MathUtils;
}