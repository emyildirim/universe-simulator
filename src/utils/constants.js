// Physical and astronomical constants
const CONSTANTS = {
    // Distance units (in meters)
    AU: 149597870700, // Astronomical Unit
    PARSEC: 3.0857e16,
    LIGHT_YEAR: 9.461e15,
    
    // Time constants
    SECONDS_PER_DAY: 86400,
    DAYS_PER_YEAR: 365.25,
    
    // Rendering constants
    STAR_MAGNITUDE_LIMIT_FAR: 6.0,
    STAR_MAGNITUDE_LIMIT_NEAR: 10.0,
    GALAXY_RENDER_DISTANCE: 1000, // parsecs
    
    // Camera zoom levels (in AU)
    ZOOM_MIN: 0.01, // Close to Earth
    ZOOM_MAX: 1e12, // Galactic scale
    
    // LOD thresholds (camera distance in AU)
    LOD_NEAR: 10,      // Solar system detail
    LOD_MID: 1000,     // Local star group
    LOD_FAR: 100000,   // Galaxy scale
    
    // Sizes and scales
    EARTH_RADIUS: 6371000, // meters
    SUN_RADIUS: 696340000, // meters
    
    // Visual constants
    STAR_SIZE_MIN: 0.5,
    STAR_SIZE_MAX: 8.0,
    PLANET_SIZE_SCALE: 100, // Scale factor for planet visibility
    
    // Performance
    MAX_STARS_NEAR: 10000,
    MAX_STARS_MID: 5000,
    MAX_STARS_FAR: 1000,
};

// Utility functions for unit conversions
const UNITS = {
    auToMeters: (au) => au * CONSTANTS.AU,
    metersToAu: (meters) => meters / CONSTANTS.AU,
    parsecToAu: (parsec) => parsec * CONSTANTS.PARSEC / CONSTANTS.AU,
    auToParsec: (au) => au * CONSTANTS.AU / CONSTANTS.PARSEC,
    
    // Magnitude to visual size conversion
    magnitudeToSize: (magnitude) => {
        const normalized = Math.max(0, Math.min(1, (10 - magnitude) / 9));
        return CONSTANTS.STAR_SIZE_MIN + normalized * (CONSTANTS.STAR_SIZE_MAX - CONSTANTS.STAR_SIZE_MIN);
    },
    
    // Logarithmic zoom mapping
    zoomToDistance: (zoomValue) => {
        // Map 0-100 slider to log scale from ZOOM_MIN to ZOOM_MAX
        const logMin = Math.log10(CONSTANTS.ZOOM_MIN);
        const logMax = Math.log10(CONSTANTS.ZOOM_MAX);
        const logValue = logMin + (zoomValue / 100) * (logMax - logMin);
        return Math.pow(10, logValue);
    },
    
    distanceToZoom: (distance) => {
        const logMin = Math.log10(CONSTANTS.ZOOM_MIN);
        const logMax = Math.log10(CONSTANTS.ZOOM_MAX);
        const logDistance = Math.log10(distance);
        return ((logDistance - logMin) / (logMax - logMin)) * 100;
    },
    
    // Format distance for display
    formatDistance: (distanceAU) => {
        if (distanceAU < 1) {
            return `${(distanceAU * CONSTANTS.AU / 1000).toFixed(0)} km`;
        } else if (distanceAU < 100) {
            return `${distanceAU.toFixed(2)} AU`;
        } else if (distanceAU < 206265) { // 1 parsec in AU
            return `${distanceAU.toFixed(0)} AU`;
        } else {
            const parsecs = UNITS.auToParsec(distanceAU);
            if (parsecs < 1000) {
                return `${parsecs.toFixed(1)} pc`;
            } else {
                return `${(parsecs / 1000).toFixed(1)} kpc`;
            }
        }
    },
    
    // Format time for display
    formatTime: (timeOffset) => {
        const year = 2024 + timeOffset;
        return year.toFixed(1);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONSTANTS, UNITS };
}