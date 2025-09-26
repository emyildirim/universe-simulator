import * as THREE from 'three';

export class MeasurementTool {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        this.isActive = false;
        this.pathPoints = [];
        this.pathLines = [];
        this.pathMarkers = [];
        this.totalDistance = 0;
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.setupMaterials();
        this.setupEventListeners();
    }
    
    setupMaterials() {
        // Line material for path
        this.lineMaterial = new THREE.LineBasicMaterial({
            color: 0xffff00,
            linewidth: 2,
            transparent: true,
            opacity: 0.8
        });
        
        // Marker material for points
        this.markerGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        this.markerMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.9
        });
        
        // Create measurement group
        this.measurementGroup = new THREE.Group();
        this.scene.add(this.measurementGroup);
    }
    
    setupEventListeners() {
        // Mouse events for drawing path
        document.addEventListener('mousemove', (event) => {
            if (this.isActive) {
                this.updateMousePosition(event);
            }
        });
        
        document.addEventListener('click', (event) => {
            if (this.isActive && event.ctrlKey) {
                this.addPathPoint(event);
            }
        });
        
        document.addEventListener('keydown', (event) => {
            if (event.code === 'KeyM') {
                this.toggle();
            } else if (event.code === 'Escape' && this.isActive) {
                this.clear();
            } else if (event.code === 'Enter' && this.isActive) {
                this.completePath();
            }
        });
    }
    
    toggle() {
        this.isActive = !this.isActive;
        
        if (this.isActive) {
            this.showInstructions();
            document.body.style.cursor = 'crosshair';
        } else {
            this.hideInstructions();
            document.body.style.cursor = 'default';
            this.clear();
        }
    }
    
    updateMousePosition(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    
    addPathPoint(event) {
        this.updateMousePosition(event);
        
        // Cast ray to find 3D position
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Create a plane at a reasonable distance for measurement
        const distance = 100; // Default measurement plane distance
        const planeNormal = this.camera.getWorldDirection(new THREE.Vector3()).negate();
        const planePoint = this.camera.position.clone().add(
            planeNormal.clone().multiplyScalar(-distance)
        );
        
        const plane = new THREE.Plane(planeNormal, -planeNormal.dot(planePoint));
        const intersectionPoint = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(plane, intersectionPoint);
        
        if (intersectionPoint) {
            this.pathPoints.push(intersectionPoint.clone());
            this.addMarker(intersectionPoint);
            
            if (this.pathPoints.length > 1) {
                this.addLineSegment();
                this.updateTotalDistance();
            }
            
            this.updateDisplay();
        }
    }
    
    addMarker(position) {
        const marker = new THREE.Mesh(this.markerGeometry, this.markerMaterial);
        marker.position.copy(position);
        
        // Scale marker based on distance from camera
        const distance = this.camera.position.distanceTo(position);
        const scale = Math.max(0.1, distance * 0.005);
        marker.scale.setScalar(scale);
        
        this.pathMarkers.push(marker);
        this.measurementGroup.add(marker);
    }
    
    addLineSegment() {
        const lastTwoPoints = this.pathPoints.slice(-2);
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(lastTwoPoints);
        const line = new THREE.Line(lineGeometry, this.lineMaterial);
        
        this.pathLines.push(line);
        this.measurementGroup.add(line);
    }
    
    updateTotalDistance() {
        this.totalDistance = 0;
        
        for (let i = 1; i < this.pathPoints.length; i++) {
            const distance = this.pathPoints[i].distanceTo(this.pathPoints[i - 1]);
            this.totalDistance += distance;
        }
    }
    
    updateDisplay() {
        if (this.pathPoints.length === 0) return;
        
        // Create or update distance display
        let displayElement = document.getElementById('measurement-display');
        if (!displayElement) {
            displayElement = document.createElement('div');
            displayElement.id = 'measurement-display';
            displayElement.className = 'ui-panel';
            displayElement.style.cssText = `
                position: absolute;
                top: 50%;
                left: 20px;
                transform: translateY(-50%);
                background: rgba(0, 0, 0, 0.9);
                border: 1px solid #ffff00;
                padding: 10px;
                color: #fff;
                font-family: monospace;
                z-index: 1001;
            `;
            document.getElementById('ui-overlay').appendChild(displayElement);
        }
        
        const distanceAU = this.totalDistance;
        const distanceParsecs = distanceAU / 206265;
        const distanceLightYears = distanceParsecs * 3.26;
        const distanceKm = distanceAU * 149597870.7; // 1 AU in km
        
        displayElement.innerHTML = `
            <h4>Path Measurement</h4>
            <p><strong>Points:</strong> ${this.pathPoints.length}</p>
            <p><strong>Total Distance:</strong></p>
            <p>${distanceAU.toFixed(2)} AU</p>
            <p>${distanceParsecs.toFixed(6)} parsecs</p>
            <p>${distanceLightYears.toFixed(3)} light years</p>
            <p>${(distanceKm / 1000000).toFixed(0)} million km</p>
            <hr>
            <small>Ctrl+Click: Add point<br>Enter: Complete<br>Esc: Cancel</small>
        `;
    }
    
    completePath() {
        if (this.pathPoints.length < 2) {
            alert('Need at least 2 points to complete a path');
            return;
        }
        
        // Finalize the measurement
        this.showFinalResults();
        this.isActive = false;
        document.body.style.cursor = 'default';
        this.hideInstructions();
    }
    
    showFinalResults() {
        const results = {
            points: this.pathPoints.length,
            totalDistance: this.totalDistance,
            segments: []
        };
        
        // Calculate individual segments
        for (let i = 1; i < this.pathPoints.length; i++) {
            const distance = this.pathPoints[i].distanceTo(this.pathPoints[i - 1]);
            results.segments.push(distance);
        }
        
        console.log('Measurement Results:', results);
        
        // You could also save this data or export it
        this.saveMeasurement(results);
    }
    
    saveMeasurement(results) {
        // Save measurement to localStorage or export
        const measurements = JSON.parse(localStorage.getItem('universeMeasurements') || '[]');
        measurements.push({
            timestamp: new Date().toISOString(),
            ...results
        });
        localStorage.setItem('universeMeasurements', JSON.stringify(measurements));
    }
    
    clear() {
        // Remove all measurement objects
        this.measurementGroup.clear();
        
        // Reset arrays
        this.pathPoints = [];
        this.pathLines = [];
        this.pathMarkers = [];
        this.totalDistance = 0;
        
        // Remove display
        const displayElement = document.getElementById('measurement-display');
        if (displayElement) {
            displayElement.remove();
        }
    }
    
    showInstructions() {
        let instructionsElement = document.getElementById('measurement-instructions');
        if (!instructionsElement) {
            instructionsElement = document.createElement('div');
            instructionsElement.id = 'measurement-instructions';
            instructionsElement.className = 'ui-panel';
            instructionsElement.style.cssText = `
                position: absolute;
                bottom: 120px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.9);
                border: 1px solid #ffff00;
                padding: 10px;
                color: #fff;
                text-align: center;
                z-index: 1001;
            `;
            document.getElementById('ui-overlay').appendChild(instructionsElement);
        }
        
        instructionsElement.innerHTML = `
            <strong>Measurement Tool Active</strong><br>
            <small>Ctrl+Click to add points • Enter to complete • Esc to cancel</small>
        `;
    }
    
    hideInstructions() {
        const instructionsElement = document.getElementById('measurement-instructions');
        if (instructionsElement) {
            instructionsElement.remove();
        }
    }
    
    update() {
        // Update marker scales based on camera distance
        this.pathMarkers.forEach(marker => {
            const distance = this.camera.position.distanceTo(marker.position);
            const scale = Math.max(0.1, distance * 0.005);
            marker.scale.setScalar(scale);
        });
    }
    
    isToolActive() {
        return this.isActive;
    }
    
    getPathPoints() {
        return this.pathPoints;
    }
    
    getTotalDistance() {
        return this.totalDistance;
    }
}