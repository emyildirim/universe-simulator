import * as THREE from 'three';

export class UniverseRenderer {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.objects = new Map(); // Store all rendered objects
        this.starField = null;
        this.solarSystemGroup = new THREE.Group();
        this.scene.add(this.solarSystemGroup);
    }
    
    async loadStarField() {
        // Create a basic star field
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 10000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            // Random positions in a sphere
            const radius = Math.random() * 50000 + 10000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // Random star colors (from blue to red)
            const temp = Math.random();
            if (temp < 0.1) { // Blue stars
                colors[i * 3] = 0.6;
                colors[i * 3 + 1] = 0.8;
                colors[i * 3 + 2] = 1.0;
            } else if (temp < 0.3) { // White stars
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 1.0;
                colors[i * 3 + 2] = 1.0;
            } else if (temp < 0.7) { // Yellow stars
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 1.0;
                colors[i * 3 + 2] = 0.6;
            } else { // Red stars
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 0.6;
                colors[i * 3 + 2] = 0.4;
            }
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            size: 3,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        this.starField = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.starField);
    }
    
    async loadSolarSystem() {
        // Create the Sun
        const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.3
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.userData = {
            name: 'Sun',
            type: 'Star',
            distance: 0,
            ra: '0h 0m 0s',
            dec: '0° 0\' 0"',
            magnitude: -26.7,
            discovery: 'Known since ancient times'
        };
        this.solarSystemGroup.add(sun);
        this.objects.set('sun', sun);
        
        // Create planets
        const planetData = [
            { name: 'Mercury', radius: 0.38, distance: 20, color: 0x8c7853, period: 88 },
            { name: 'Venus', radius: 0.95, distance: 30, color: 0xffc649, period: 225 },
            { name: 'Earth', radius: 1, distance: 40, color: 0x6b93d6, period: 365 },
            { name: 'Mars', radius: 0.53, distance: 55, color: 0xc1440e, period: 687 },
            { name: 'Jupiter', radius: 3, distance: 80, color: 0xd8ca9d, period: 4333 },
            { name: 'Saturn', radius: 2.5, distance: 110, color: 0xfad5a5, period: 10759 },
            { name: 'Uranus', radius: 1.5, distance: 140, color: 0x4fd0e7, period: 30687 },
            { name: 'Neptune', radius: 1.4, distance: 170, color: 0x4b70dd, period: 60190 }
        ];
        
        planetData.forEach((planet, index) => {
            const planetGeometry = new THREE.SphereGeometry(planet.radius, 16, 16);
            const planetMaterial = new THREE.MeshLambertMaterial({ color: planet.color });
            const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
            
            // Initial position
            planetMesh.position.x = planet.distance;
            
            planetMesh.userData = {
                name: planet.name,
                type: 'Planet',
                distance: planet.distance,
                ra: 'Variable',
                dec: 'Variable',
                magnitude: 'Variable',
                discovery: 'Known since ancient times',
                orbitalRadius: planet.distance,
                orbitalPeriod: planet.period,
                angle: Math.random() * Math.PI * 2 // Random starting position
            };
            
            this.solarSystemGroup.add(planetMesh);
            this.objects.set(planet.name.toLowerCase(), planetMesh);
        });
        
        // Add some asteroids for variety
        this.createAsteroidBelt();
    }
    
    createAsteroidBelt() {
        const asteroidCount = 200;
        const asteroidGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const asteroidMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        
        for (let i = 0; i < asteroidCount; i++) {
            const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
            const distance = 60 + Math.random() * 20; // Between Mars and Jupiter
            const angle = Math.random() * Math.PI * 2;
            const height = (Math.random() - 0.5) * 4;
            
            asteroid.position.x = Math.cos(angle) * distance;
            asteroid.position.z = Math.sin(angle) * distance;
            asteroid.position.y = height;
            
            asteroid.userData = {
                name: `Asteroid ${i + 1}`,
                type: 'Asteroid',
                distance: distance,
                ra: 'Variable',
                dec: 'Variable',
                magnitude: Math.random() * 3 + 10,
                discovery: 'Modern era'
            };
            
            this.solarSystemGroup.add(asteroid);
        }
    }
    
    addObject(name, mesh) {
        this.objects.set(name.toLowerCase(), mesh);
        this.scene.add(mesh);
    }
    
    getObject(name) {
        return this.objects.get(name.toLowerCase());
    }
    
    getAllObjects() {
        return Array.from(this.objects.values());
    }
    
    centerCameraOn(objectName) {
        const object = this.getObject(objectName);
        if (object) {
            const targetPosition = object.position.clone();
            const cameraDistance = 50;
            
            // Animate camera to object
            const startPosition = this.camera.position.clone();
            const endPosition = targetPosition.clone().add(new THREE.Vector3(cameraDistance, cameraDistance, cameraDistance));
            
            let progress = 0;
            const animate = () => {
                progress += 0.02;
                if (progress >= 1) {
                    this.camera.position.copy(endPosition);
                    this.camera.lookAt(targetPosition);
                    return;
                }
                
                this.camera.position.lerpVectors(startPosition, endPosition, progress);
                this.camera.lookAt(targetPosition);
                requestAnimationFrame(animate);
            };
            animate();
        }
    }
    
    updateOrbitalPositions(time) {
        // Update planetary positions based on time
        this.objects.forEach((object) => {
            if (object.userData.orbitalPeriod && object.userData.orbitalRadius) {
                const angle = object.userData.angle + (time * 0.01 * 365) / object.userData.orbitalPeriod;
                object.position.x = Math.cos(angle) * object.userData.orbitalRadius;
                object.position.z = Math.sin(angle) * object.userData.orbitalRadius;
                object.userData.angle = angle;
            }
        });
    }
}