class PlanetSystem {
    constructor(scene, lodManager) {
        this.scene = scene;
        this.lodManager = lodManager;
        
        // Solar system data
        this.planets = [];
        this.sun = null;
        
        // Orbital data and current positions
        this.orbitalElements = {};
        this.currentPositions = {};
        
        // 3D objects
        this.planetMeshes = {};
        this.orbitLines = {};
        
        // Textures (in a real app, these would be loaded from files)
        this.textures = {};
        
        this.initialized = false;
    }
    
    async initialize() {
        console.log('Initializing planet system...');
        
        // Create solar system data
        this.createSolarSystemData();
        
        // Create 3D objects
        await this.create3DObjects();
        
        this.initialized = true;
        console.log('Planet system initialized');
    }
    
    createSolarSystemData() {
        // Solar system orbital elements (simplified)
        // In a real implementation, this would use precise ephemeris data from JPL/NASA
        
        this.orbitalElements = {
            sun: {
                position: { x: 0, y: 0, z: 0 },
                radius: 0.00465 // AU (scaled up for visibility)
            },
            mercury: {
                semiMajorAxis: 0.387,
                eccentricity: 0.206,
                inclination: 7.0 * Math.PI / 180,
                longitudeOfAscendingNode: 48.3 * Math.PI / 180,
                argumentOfPeriapsis: 29.1 * Math.PI / 180,
                meanAnomalyAtEpoch: 174.8 * Math.PI / 180,
                period: 87.97, // days
                radius: 0.0000163 // AU (scaled up)
            },
            venus: {
                semiMajorAxis: 0.723,
                eccentricity: 0.007,
                inclination: 3.4 * Math.PI / 180,
                longitudeOfAscendingNode: 76.7 * Math.PI / 180,
                argumentOfPeriapsis: 54.9 * Math.PI / 180,
                meanAnomalyAtEpoch: 50.1 * Math.PI / 180,
                period: 224.7,
                radius: 0.0000404
            },
            earth: {
                semiMajorAxis: 1.0,
                eccentricity: 0.017,
                inclination: 0.0,
                longitudeOfAscendingNode: 0.0,
                argumentOfPeriapsis: 114.2 * Math.PI / 180,
                meanAnomalyAtEpoch: 358.6 * Math.PI / 180,
                period: 365.25,
                radius: 0.0000426
            },
            mars: {
                semiMajorAxis: 1.524,
                eccentricity: 0.094,
                inclination: 1.9 * Math.PI / 180,
                longitudeOfAscendingNode: 49.6 * Math.PI / 180,
                argumentOfPeriapsis: 286.5 * Math.PI / 180,
                meanAnomalyAtEpoch: 19.4 * Math.PI / 180,
                period: 686.98,
                radius: 0.0000227
            },
            jupiter: {
                semiMajorAxis: 5.203,
                eccentricity: 0.049,
                inclination: 1.3 * Math.PI / 180,
                longitudeOfAscendingNode: 100.5 * Math.PI / 180,
                argumentOfPeriapsis: 273.9 * Math.PI / 180,
                meanAnomalyAtEpoch: 20.0 * Math.PI / 180,
                period: 4332.6,
                radius: 0.000477
            },
            saturn: {
                semiMajorAxis: 9.537,
                eccentricity: 0.057,
                inclination: 2.5 * Math.PI / 180,
                longitudeOfAscendingNode: 113.7 * Math.PI / 180,
                argumentOfPeriapsis: 339.4 * Math.PI / 180,
                meanAnomalyAtEpoch: 317.0 * Math.PI / 180,
                period: 10759.2,
                radius: 0.000403
            }
        };
        
        // Create planet list
        this.planets = Object.keys(this.orbitalElements).filter(name => name !== 'sun');
    }
    
    async create3DObjects() {
        // Create the Sun
        await this.createSun();
        
        // Create planets
        for (const planetName of this.planets) {
            await this.createPlanet(planetName);
            this.createOrbitLine(planetName);
        }
    }
    
    async createSun() {
        // Create sun geometry
        const geometry = new THREE.SphereGeometry(
            this.orbitalElements.sun.radius * CONSTANTS.PLANET_SIZE_SCALE, 
            32, 32
        );
        
        // Create sun material with emissive glow
        const material = new THREE.MeshBasicMaterial({
            color: 0xFFFFAA,
            emissive: 0xFFFF44,
            emissiveIntensity: 0.3
        });
        
        this.sun = new THREE.Mesh(geometry, material);
        this.sun.position.set(0, 0, 0);
        this.sun.userData.name = 'Sun';
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(
            this.orbitalElements.sun.radius * CONSTANTS.PLANET_SIZE_SCALE * 1.5, 
            16, 16
        );
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF44,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        
        const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.sun.add(sunGlow);
        
        this.lodManager.addToNearLOD(this.sun);
    }
    
    async createPlanet(planetName) {
        const data = this.orbitalElements[planetName];
        
        // Create planet geometry
        const geometry = new THREE.SphereGeometry(
            data.radius * CONSTANTS.PLANET_SIZE_SCALE, 
            24, 24
        );
        
        // Create planet material with basic colors
        // In a real implementation, these would be proper texture maps
        const planetColors = {
            mercury: 0x8C7853,
            venus: 0xFFC649,
            earth: 0x6B93D6,
            mars: 0xC1440E,
            jupiter: 0xD8CA9D,
            saturn: 0xFAD5A5
        };
        
        const material = new THREE.MeshLambertMaterial({
            color: planetColors[planetName] || 0x888888
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.name = planetName;
        mesh.userData.planetData = data;
        
        this.planetMeshes[planetName] = mesh;
        this.lodManager.addToNearLOD(mesh);
        
        // Add basic atmospheric glow for gas giants
        if (planetName === 'jupiter' || planetName === 'saturn') {
            const glowGeometry = new THREE.SphereGeometry(
                data.radius * CONSTANTS.PLANET_SIZE_SCALE * 1.1, 
                16, 16
            );
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: planetColors[planetName],
                transparent: true,
                opacity: 0.1,
                side: THREE.BackSide
            });
            
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            mesh.add(glow);
        }
    }
    
    createOrbitLine(planetName) {
        const data = this.orbitalElements[planetName];
        const points = [];
        const numPoints = 100;
        
        // Generate orbital path points
        for (let i = 0; i <= numPoints; i++) {
            const meanAnomaly = (i / numPoints) * 2 * Math.PI;
            const position = MathUtils.keplerianToCartesian(
                data.semiMajorAxis,
                data.eccentricity,
                data.inclination,
                data.longitudeOfAscendingNode,
                data.argumentOfPeriapsis,
                meanAnomaly,
                0 // time (not used in this simplified version)
            );
            
            points.push(new THREE.Vector3(position.x, position.y, position.z));
        }
        
        // Create orbit line
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.5
        });
        
        const orbitLine = new THREE.Line(geometry, material);
        orbitLine.userData.name = `${planetName}_orbit`;
        
        this.orbitLines[planetName] = orbitLine;
        this.lodManager.addToNearLOD(orbitLine);
    }
    
    // Update planet positions based on time
    updatePositions(timeOffset) {
        if (!this.initialized) return;
        
        const currentTime = timeOffset * CONSTANTS.DAYS_PER_YEAR; // Convert years to days
        
        this.planets.forEach(planetName => {
            const data = this.orbitalElements[planetName];
            const mesh = this.planetMeshes[planetName];
            
            if (!mesh) return;
            
            // Calculate mean anomaly at current time
            const meanMotion = 2 * Math.PI / data.period; // radians per day
            const meanAnomaly = data.meanAnomalyAtEpoch + meanMotion * currentTime;
            
            // Calculate position using Keplerian elements
            const position = MathUtils.keplerianToCartesian(
                data.semiMajorAxis,
                data.eccentricity,
                data.inclination,
                data.longitudeOfAscendingNode,
                data.argumentOfPeriapsis,
                meanAnomaly,
                currentTime
            );
            
            // Update mesh position
            mesh.position.set(position.x, position.y, position.z);
            
            // Store current position for reference
            this.currentPositions[planetName] = position;
        });
    }
    
    // Toggle orbit visibility
    setOrbitVisibility(visible) {
        Object.values(this.orbitLines).forEach(orbitLine => {
            orbitLine.visible = visible;
        });
    }
    
    // Get planet at position (for interaction)
    getPlanetAtPosition(worldPosition, threshold = 0.1) {
        for (const planetName of this.planets) {
            const mesh = this.planetMeshes[planetName];
            if (!mesh) continue;
            
            const distance = mesh.position.distanceTo(worldPosition);
            if (distance <= threshold) {
                return {
                    name: planetName,
                    mesh: mesh,
                    data: this.orbitalElements[planetName],
                    currentPosition: this.currentPositions[planetName]
                };
            }
        }
        
        // Check sun
        if (this.sun && this.sun.position.distanceTo(worldPosition) <= threshold) {
            return {
                name: 'Sun',
                mesh: this.sun,
                data: this.orbitalElements.sun,
                currentPosition: { x: 0, y: 0, z: 0 }
            };
        }
        
        return null;
    }
    
    // Get planet information for UI
    getPlanetInfo(planetName) {
        const data = this.orbitalElements[planetName];
        const position = this.currentPositions[planetName];
        
        if (!data || !position) return null;
        
        const distanceFromSun = Math.sqrt(position.x * position.x + 
                                        position.y * position.y + 
                                        position.z * position.z);
        
        return {
            name: planetName.charAt(0).toUpperCase() + planetName.slice(1),
            period: `${data.period.toFixed(1)} days`,
            semiMajorAxis: `${data.semiMajorAxis.toFixed(2)} AU`,
            eccentricity: data.eccentricity.toFixed(3),
            currentDistance: `${distanceFromSun.toFixed(2)} AU`,
            position: {
                x: position.x.toFixed(3),
                y: position.y.toFixed(3),
                z: position.z.toFixed(3)
            }
        };
    }
    
    // Add lighting to planets
    setupLighting() {
        // Add sun light
        const sunLight = new THREE.PointLight(0xFFFFAA, 1, 100);
        sunLight.position.set(0, 0, 0);
        this.lodManager.addToNearLOD(sunLight);
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
        this.lodManager.addToNearLOD(ambientLight);
    }
    
    // Debug information
    getDebugInfo() {
        return {
            initialized: this.initialized,
            planetsCreated: Object.keys(this.planetMeshes).length,
            orbitsCreated: Object.keys(this.orbitLines).length,
            currentPositions: this.currentPositions
        };
    }
}