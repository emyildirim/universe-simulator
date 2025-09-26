class StarSystem {
    constructor(scene, lodManager) {
        this.scene = scene;
        this.lodManager = lodManager;
        
        // Star data storage
        this.starData = [];
        this.starObjects = {
            near: null,    // Points system for near view
            mid: null,     // Points system for mid view  
            far: null      // Points system for far view
        };
        
        // Rendering materials
        this.starMaterials = {};
        
        // Performance settings
        this.maxStars = {
            near: CONSTANTS.MAX_STARS_NEAR,
            mid: CONSTANTS.MAX_STARS_MID,
            far: CONSTANTS.MAX_STARS_FAR
        };
        
        this.initialized = false;
    }
    
    async initialize() {
        console.log('Initializing star system...');
        
        // Generate mock star data (in a real app, this would load from NASA APIs)
        await this.generateStarData();
        
        // Create star rendering objects for different LOD levels
        this.createStarObjects();
        
        this.initialized = true;
        console.log(`Star system initialized with ${this.starData.length} stars`);
    }
    
    async generateStarData() {
        // Generate mock star catalog
        // In a real implementation, this would load from databases like:
        // - Hipparcos catalog
        // - Gaia catalog
        // - Yale Bright Star Catalog
        
        const numStars = 15000; // Total stars in database
        this.starData = [];
        
        for (let i = 0; i < numStars; i++) {
            // Generate realistic star distribution
            const magnitude = this.generateRealisticMagnitude();
            const distance = this.generateRealisticDistance(magnitude);
            const position = this.generateRandomStellarPosition(distance);
            const temperature = this.generateStellarTemperature(magnitude);
            const color = MathUtils.temperatureToColor(temperature);
            
            this.starData.push({
                id: i,
                name: `Star-${i.toString().padStart(5, '0')}`,
                position: position,
                magnitude: magnitude,
                distance: distance, // in parsecs
                temperature: temperature, // in Kelvin
                color: color,
                spectralType: this.getSpectralType(temperature),
                luminosity: Math.pow(10, (4.8 - magnitude) / 2.5) // Solar luminosities
            });
        }
        
        // Sort by magnitude for LOD purposes
        this.starData.sort((a, b) => a.magnitude - b.magnitude);
    }
    
    generateRealisticMagnitude() {
        // Generate magnitude following realistic distribution
        // Brighter stars are much rarer than faint ones
        const random = Math.random();
        
        if (random < 0.001) return MathUtils.random(-1, 1);      // Very bright stars
        if (random < 0.01) return MathUtils.random(1, 3);       // Bright stars
        if (random < 0.1) return MathUtils.random(3, 6);        // Visible stars
        return MathUtils.random(6, 12);                         // Faint stars
    }
    
    generateRealisticDistance(magnitude) {
        // Distance modulus relationship: m - M = 5 * log10(d) - 5
        // Assume absolute magnitude M ~ 5 (rough average)
        const absoluteMagnitude = MathUtils.random(0, 10);
        const distanceModulus = magnitude - absoluteMagnitude;
        const distance = Math.pow(10, (distanceModulus + 5) / 5);
        
        return Math.max(0.1, Math.min(10000, distance)); // Clamp to reasonable range
    }
    
    generateRandomStellarPosition(distance) {
        // Generate position on celestial sphere at given distance
        const theta = MathUtils.random(0, 2 * Math.PI); // Right ascension
        const phi = Math.acos(MathUtils.random(-1, 1));  // Declination (uniform on sphere)
        
        const position = MathUtils.sphericalToCartesian(
            UNITS.parsecToAu(distance), theta, phi
        );
        
        return new THREE.Vector3(position.x, position.y, position.z);
    }
    
    generateStellarTemperature(magnitude) {
        // Rough correlation between magnitude and temperature
        const baseTempMin = 3000;  // K-class stars
        const baseTempMax = 10000; // A-class stars
        
        // Brighter stars tend to be hotter (rough approximation)
        const tempFactor = Math.max(0, Math.min(1, (8 - magnitude) / 8));
        return baseTempMin + tempFactor * (baseTempMax - baseTempMin) + 
               MathUtils.randomGaussian(0, 500);
    }
    
    getSpectralType(temperature) {
        if (temperature > 30000) return 'O';
        if (temperature > 10000) return 'B';
        if (temperature > 7500) return 'A';
        if (temperature > 6000) return 'F';
        if (temperature > 5200) return 'G';
        if (temperature > 3700) return 'K';
        return 'M';
    }
    
    createStarObjects() {
        // Create different LOD representations
        this.starObjects.far = this.createStarPoints('far');
        this.starObjects.mid = this.createStarPoints('mid');
        this.starObjects.near = this.createStarPoints('near');
        
        // Add to appropriate LOD groups
        this.lodManager.addToFarLOD(this.starObjects.far);
        this.lodManager.addToMidLOD(this.starObjects.mid);
        this.lodManager.addToNearLOD(this.starObjects.near);
    }
    
    createStarPoints(lodLevel) {
        const maxStars = this.maxStars[lodLevel];
        const magnitudeLimit = lodLevel === 'far' ? 6 : 
                              lodLevel === 'mid' ? 8 : 10;
        
        // Filter stars based on magnitude and LOD level
        const visibleStars = this.starData
            .filter(star => star.magnitude <= magnitudeLimit)
            .slice(0, maxStars);
        
        console.log(`Creating ${visibleStars.length} stars for ${lodLevel} LOD`);
        
        // Create geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(visibleStars.length * 3);
        const colors = new Float32Array(visibleStars.length * 3);
        const sizes = new Float32Array(visibleStars.length);
        
        visibleStars.forEach((star, index) => {
            // Position
            positions[index * 3] = star.position.x;
            positions[index * 3 + 1] = star.position.y;
            positions[index * 3 + 2] = star.position.z;
            
            // Color based on temperature
            colors[index * 3] = star.color.r / 255;
            colors[index * 3 + 1] = star.color.g / 255;
            colors[index * 3 + 2] = star.color.b / 255;
            
            // Size based on magnitude
            sizes[index] = UNITS.magnitudeToSize(star.magnitude);
        });
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create material
        const material = new THREE.PointsMaterial({
            size: 2,
            sizeAttenuation: false,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        // For more advanced rendering, we could use a custom shader
        if (lodLevel === 'near') {
            material.size = 4;
            // Could add custom vertex/fragment shaders here for better star rendering
        }
        
        const points = new THREE.Points(geometry, material);
        points.userData.lodLevel = lodLevel;
        points.userData.starCount = visibleStars.length;
        
        return points;
    }
    
    updateStarVisibility(magnitudeLimit) {
        // Update which stars are visible based on current magnitude limit
        Object.keys(this.starObjects).forEach(lodLevel => {
            const starObject = this.starObjects[lodLevel];
            if (!starObject) return;
            
            const geometry = starObject.geometry;
            const colors = geometry.attributes.color.array;
            const sizes = geometry.attributes.size.array;
            
            // Could implement dynamic visibility here
            // For now, we recreate the objects when LOD changes
        });
    }
    
    // Update star rendering based on camera distance and settings
    update(cameraDistance, showLabels = false) {
        if (!this.initialized) return;
        
        // Update star sizes based on camera distance for depth effect
        Object.values(this.starObjects).forEach(starObject => {
            if (!starObject || !starObject.visible) return;
            
            const material = starObject.material;
            if (material.uniforms && material.uniforms.cameraDistance) {
                material.uniforms.cameraDistance.value = cameraDistance;
            }
        });
    }
    
    // Get stars near a position (for interaction)
    getStarsNearPosition(position, radius) {
        return this.starData.filter(star => {
            const distance = star.position.distanceTo(position);
            return distance <= radius;
        });
    }
    
    // Get star information for UI
    getStarInfo(starId) {
        const star = this.starData.find(s => s.id === starId);
        if (!star) return null;
        
        return {
            name: star.name,
            magnitude: star.magnitude.toFixed(2),
            distance: `${star.distance.toFixed(1)} pc`,
            spectralType: star.spectralType,
            temperature: `${Math.floor(star.temperature)} K`,
            luminosity: `${star.luminosity.toFixed(2)} L☉`
        };
    }
    
    // Debug information
    getDebugInfo() {
        return {
            totalStars: this.starData.length,
            initialized: this.initialized,
            lodObjects: Object.keys(this.starObjects).map(lod => ({
                level: lod,
                starCount: this.starObjects[lod]?.userData.starCount || 0,
                visible: this.starObjects[lod]?.visible || false
            }))
        };
    }
}