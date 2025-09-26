class GalaxySystem {
    constructor(scene, lodManager) {
        this.scene = scene;
        this.lodManager = lodManager;
        
        // Galaxy data
        this.galaxies = [];
        this.galaxyObjects = [];
        
        // Local Group and nearby galaxies
        this.localGroup = {};
        
        this.initialized = false;
    }
    
    async initialize() {
        console.log('Initializing galaxy system...');
        
        // Create galaxy catalog data
        this.createGalaxyData();
        
        // Create 3D representations
        this.createGalaxyObjects();
        
        this.initialized = true;
        console.log(`Galaxy system initialized with ${this.galaxies.length} galaxies`);
    }
    
    createGalaxyData() {
        // Create data for major nearby galaxies
        // Distances in megaparsecs (Mpc)
        this.galaxies = [
            {
                name: 'Milky Way',
                type: 'SBbc', // Barred spiral
                position: new THREE.Vector3(0, 0, 0), // We are here
                distance: 0,
                diameter: 30, // kpc
                mass: 1.5e12, // Solar masses
                magnitude: -20.9,
                color: { r: 220, g: 220, b: 255 }
            },
            {
                name: 'Andromeda Galaxy (M31)',
                type: 'SA(s)b',
                position: new THREE.Vector3(
                    UNITS.parsecToAu(2.5e6), // 2.5 Mpc
                    UNITS.parsecToAu(0.1e6),
                    UNITS.parsecToAu(0.2e6)
                ),
                distance: 2.537, // Mpc
                diameter: 46.56, // kpc
                mass: 1.23e12,
                magnitude: -21.5,
                color: { r: 255, g: 220, b: 180 }
            },
            {
                name: 'Triangulum Galaxy (M33)',
                type: 'SA(s)cd',
                position: new THREE.Vector3(
                    UNITS.parsecToAu(2.7e6),
                    UNITS.parsecToAu(-0.8e6),
                    UNITS.parsecToAu(0.1e6)
                ),
                distance: 2.73, // Mpc
                diameter: 18.74, // kpc
                mass: 5e10,
                magnitude: -18.9,
                color: { r: 180, g: 200, b: 255 }
            },
            {
                name: 'Large Magellanic Cloud',
                type: 'SB(s)m',
                position: new THREE.Vector3(
                    UNITS.parsecToAu(0.05e6),
                    UNITS.parsecToAu(-0.04e6),
                    UNITS.parsecToAu(-0.03e6)
                ),
                distance: 0.05, // Mpc
                diameter: 4.3, // kpc
                mass: 1e10,
                magnitude: -18.1,
                color: { r: 200, g: 180, b: 255 }
            },
            {
                name: 'Small Magellanic Cloud',
                type: 'SB(s)m pec',
                position: new THREE.Vector3(
                    UNITS.parsecToAu(0.06e6),
                    UNITS.parsecToAu(-0.05e6),
                    UNITS.parsecToAu(-0.04e6)
                ),
                distance: 0.06, // Mpc
                diameter: 2.7, // kpc
                mass: 7e9,
                magnitude: -16.8,
                color: { r: 200, g: 180, b: 255 }
            }
        ];
        
        // Add some distant galaxies for deep field view
        this.addDistantGalaxies();
    }
    
    addDistantGalaxies() {
        const numDistantGalaxies = 50;
        
        for (let i = 0; i < numDistantGalaxies; i++) {
            const distance = MathUtils.random(10, 1000); // 10 Mpc to 1 Gpc
            const theta = MathUtils.random(0, 2 * Math.PI);
            const phi = Math.acos(MathUtils.random(-1, 1));
            
            const position = MathUtils.sphericalToCartesian(
                UNITS.parsecToAu(distance * 1e6), theta, phi
            );
            
            // Generate galaxy properties based on distance
            const apparentMagnitude = this.calculateApparentMagnitude(-20, distance);
            const galaxyType = this.getRandomGalaxyType();
            
            this.galaxies.push({
                name: `Galaxy-${i.toString().padStart(3, '0')}`,
                type: galaxyType,
                position: new THREE.Vector3(position.x, position.y, position.z),
                distance: distance,
                diameter: MathUtils.random(10, 50), // kpc
                mass: Math.pow(10, MathUtils.random(10, 13)), // Solar masses
                magnitude: apparentMagnitude,
                color: this.getGalaxyColor(galaxyType)
            });
        }
    }
    
    calculateApparentMagnitude(absoluteMagnitude, distanceMpc) {
        // Distance modulus: m - M = 5 * log10(d) - 5 (d in pc)
        const distancePc = distanceMpc * 1e6;
        return absoluteMagnitude + 5 * Math.log10(distancePc) - 5;
    }
    
    getRandomGalaxyType() {
        const types = ['E0', 'E3', 'E5', 'S0', 'Sa', 'Sb', 'Sc', 'SBa', 'SBb', 'SBc', 'Irr'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    getGalaxyColor(type) {
        // Color based on galaxy type
        if (type.startsWith('E')) {
            // Elliptical - redder, older stars
            return { r: 255, g: 200, b: 150 };
        } else if (type.startsWith('S')) {
            // Spiral - bluer, younger stars
            return { r: 200, g: 220, b: 255 };
        } else {
            // Irregular - mixed
            return { r: 220, g: 220, b: 200 };
        }
    }
    
    createGalaxyObjects() {
        this.galaxies.forEach((galaxy, index) => {
            const object = this.createGalaxyObject(galaxy);
            this.galaxyObjects.push(object);
            this.lodManager.addToGalaxyLOD(object);
        });
    }
    
    createGalaxyObject(galaxy) {
        const group = new THREE.Group();
        group.userData.galaxyData = galaxy;
        
        if (galaxy.name === 'Milky Way') {
            // Special case: We're inside the Milky Way
            // Create a subtle background or particle field
            this.createMilkyWayBackground(group);
        } else {
            // Create galaxy representation based on distance
            if (galaxy.distance < 1) { // Very close (< 1 Mpc)
                this.createDetailedGalaxy(group, galaxy);
            } else if (galaxy.distance < 100) { // Nearby (< 100 Mpc)
                this.createBillboardGalaxy(group, galaxy);
            } else { // Distant (> 100 Mpc)
                this.createPointGalaxy(group, galaxy);
            }
        }
        
        // Set position
        group.position.copy(galaxy.position);
        
        // Add label
        if (galaxy.distance < 10) { // Only label nearby galaxies
            this.addGalaxyLabel(group, galaxy);
        }
        
        return group;
    }
    
    createMilkyWayBackground(group) {
        // Create a subtle starfield background representing our galaxy
        const geometry = new THREE.BufferGeometry();
        const numStars = 1000;
        const positions = new Float32Array(numStars * 3);
        const colors = new Float32Array(numStars * 3);
        
        for (let i = 0; i < numStars; i++) {
            // Distribute in a rough disk shape
            const r = MathUtils.random(10, 1000); // AU
            const theta = MathUtils.random(0, 2 * Math.PI);
            const z = MathUtils.randomGaussian(0, 100); // Thin disk
            
            positions[i * 3] = r * Math.cos(theta);
            positions[i * 3 + 1] = z;
            positions[i * 3 + 2] = r * Math.sin(theta);
            
            colors[i * 3] = 0.8 + Math.random() * 0.2;
            colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
            colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 1,
            sizeAttenuation: false,
            vertexColors: true,
            transparent: true,
            opacity: 0.3
        });
        
        const points = new THREE.Points(geometry, material);
        group.add(points);
    }
    
    createDetailedGalaxy(group, galaxy) {
        // Create a more detailed spiral or elliptical galaxy representation
        if (galaxy.type.includes('S')) {
            this.createSpiralGalaxy(group, galaxy);
        } else {
            this.createEllipticalGalaxy(group, galaxy);
        }
    }
    
    createSpiralGalaxy(group, galaxy) {
        // Create spiral arms using particles
        const armGeometry = new THREE.BufferGeometry();
        const numStars = 500;
        const positions = new Float32Array(numStars * 3);
        const colors = new Float32Array(numStars * 3);
        
        const armCount = 2; // Two spiral arms
        const scaleAU = UNITS.parsecToAu(galaxy.diameter * 500); // Convert kpc to AU
        
        for (let i = 0; i < numStars; i++) {
            const armIndex = Math.floor(i / (numStars / armCount));
            const t = (i % (numStars / armCount)) / (numStars / armCount);
            
            // Logarithmic spiral
            const angle = armIndex * Math.PI + t * 4 * Math.PI;
            const radius = (0.1 + 0.9 * t) * scaleAU;
            
            positions[i * 3] = radius * Math.cos(angle) + MathUtils.randomGaussian(0, scaleAU * 0.1);
            positions[i * 3 + 1] = MathUtils.randomGaussian(0, scaleAU * 0.05); // Disk thickness
            positions[i * 3 + 2] = radius * Math.sin(angle) + MathUtils.randomGaussian(0, scaleAU * 0.1);
            
            colors[i * 3] = galaxy.color.r / 255;
            colors[i * 3 + 1] = galaxy.color.g / 255;
            colors[i * 3 + 2] = galaxy.color.b / 255;
        }
        
        armGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        armGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 3,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        const spiralArms = new THREE.Points(armGeometry, material);
        group.add(spiralArms);
    }
    
    createEllipticalGalaxy(group, galaxy) {
        // Create an elliptical distribution of stars
        const geometry = new THREE.BufferGeometry();
        const numStars = 300;
        const positions = new Float32Array(numStars * 3);
        const colors = new Float32Array(numStars * 3);
        
        const scaleAU = UNITS.parsecToAu(galaxy.diameter * 500);
        
        for (let i = 0; i < numStars; i++) {
            // Elliptical distribution
            const r = MathUtils.random(0, 1);
            const theta = MathUtils.random(0, 2 * Math.PI);
            const phi = Math.acos(MathUtils.random(-1, 1));
            
            const radius = r * scaleAU;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.cos(phi) * 0.6; // Flattened
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            
            colors[i * 3] = galaxy.color.r / 255;
            colors[i * 3 + 1] = galaxy.color.g / 255;
            colors[i * 3 + 2] = galaxy.color.b / 255;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 2,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: 0.6
        });
        
        const elliptical = new THREE.Points(geometry, material);
        group.add(elliptical);
    }
    
    createBillboardGalaxy(group, galaxy) {
        // Create a textured billboard for medium-distance galaxies
        const size = Math.max(0.1, (50 - galaxy.distance) / 100) * UNITS.parsecToAu(galaxy.diameter * 1000);
        
        const geometry = new THREE.PlaneGeometry(size, size * 0.8);
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(galaxy.color.r / 255, galaxy.color.g / 255, galaxy.color.b / 255),
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const billboard = new THREE.Mesh(geometry, material);
        
        // Make billboard always face camera (will be updated in render loop)
        billboard.userData.isBillboard = true;
        
        group.add(billboard);
    }
    
    createPointGalaxy(group, galaxy) {
        // Simple point for very distant galaxies
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array([0, 0, 0]);
        const colors = new Float32Array([
            galaxy.color.r / 255,
            galaxy.color.g / 255,
            galaxy.color.b / 255
        ]);
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 5,
            sizeAttenuation: false,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        const point = new THREE.Points(geometry, material);
        group.add(point);
    }
    
    addGalaxyLabel(group, galaxy) {
        // Create text label (simplified - in a real app would use proper text rendering)
        const labelDiv = document.createElement('div');
        labelDiv.textContent = galaxy.name;
        labelDiv.style.color = 'white';
        labelDiv.style.fontSize = '12px';
        labelDiv.style.pointerEvents = 'none';
        
        // Store label info for positioning in render loop
        group.userData.label = {
            element: labelDiv,
            offset: new THREE.Vector3(0, 1, 0)
        };
    }
    
    // Update galaxy objects (billboard orientation, etc.)
    update(camera) {
        if (!this.initialized) return;
        
        this.galaxyObjects.forEach(galaxyObject => {
            // Update billboards to face camera
            galaxyObject.traverse(child => {
                if (child.userData.isBillboard) {
                    child.lookAt(camera.position);
                }
            });
            
            // Update labels (would need proper CSS3D renderer in real implementation)
            if (galaxyObject.userData.label) {
                // Label positioning would be handled here
            }
        });
    }
    
    // Get galaxy information
    getGalaxyInfo(galaxyName) {
        const galaxy = this.galaxies.find(g => g.name === galaxyName);
        if (!galaxy) return null;
        
        return {
            name: galaxy.name,
            type: galaxy.type,
            distance: `${galaxy.distance.toFixed(2)} Mpc`,
            diameter: `${galaxy.diameter.toFixed(1)} kpc`,
            magnitude: galaxy.magnitude.toFixed(1),
            mass: `${(galaxy.mass / 1e12).toFixed(2)} × 10¹² M☉`
        };
    }
    
    // Get galaxy at position (for interaction)
    getGalaxyAtPosition(worldPosition, threshold) {
        for (const galaxyObject of this.galaxyObjects) {
            const distance = galaxyObject.position.distanceTo(worldPosition);
            if (distance <= threshold) {
                return galaxyObject.userData.galaxyData;
            }
        }
        return null;
    }
    
    // Debug information
    getDebugInfo() {
        return {
            totalGalaxies: this.galaxies.length,
            initialized: this.initialized,
            objectsCreated: this.galaxyObjects.length,
            localGroupGalaxies: this.galaxies.filter(g => g.distance < 5).length
        };
    }
}