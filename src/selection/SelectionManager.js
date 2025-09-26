import * as THREE from 'three';

export class SelectionManager {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.raycaster = new THREE.Raycaster();
        this.selectedObjects = [];
        this.maxSelections = 2; // For distance measurement
        
        this.setupSelectionIndicators();
    }
    
    setupSelectionIndicators() {
        // Create selection indicator (ring around selected object)
        this.selectionIndicators = [];
        
        for (let i = 0; i < this.maxSelections; i++) {
            const ringGeometry = new THREE.RingGeometry(5, 6, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: i === 0 ? 0x00ff00 : 0xff0000,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.visible = false;
            this.scene.add(ring);
            this.selectionIndicators.push(ring);
        }
    }
    
    selectObject(mousePosition) {
        this.raycaster.setFromCamera(mousePosition, this.camera);
        
        // Get all objects that can be selected
        const selectableObjects = [];
        this.scene.traverse((child) => {
            if (child.isMesh && child.userData.name) {
                selectableObjects.push(child);
            }
        });
        
        const intersects = this.raycaster.intersectObjects(selectableObjects);
        
        if (intersects.length > 0) {
            const selectedObject = intersects[0].object;
            this.addSelection(selectedObject);
            return selectedObject;
        }
        
        return null;
    }
    
    addSelection(object) {
        // Check if object is already selected
        const existingIndex = this.selectedObjects.findIndex(obj => obj === object);
        if (existingIndex !== -1) {
            return;
        }
        
        // Add to selection
        if (this.selectedObjects.length >= this.maxSelections) {
            // Remove oldest selection
            this.removeSelection(0);
        }
        
        this.selectedObjects.push(object);
        this.updateSelectionIndicators();
        this.updateDistanceDisplay();
    }
    
    removeSelection(index) {
        if (index >= 0 && index < this.selectedObjects.length) {
            this.selectedObjects.splice(index, 1);
            this.updateSelectionIndicators();
            this.updateDistanceDisplay();
        }
    }
    
    clearSelection() {
        this.selectedObjects = [];
        this.updateSelectionIndicators();
        this.hideDistanceDisplay();
    }
    
    updateSelectionIndicators() {
        // Hide all indicators first
        this.selectionIndicators.forEach(indicator => {
            indicator.visible = false;
        });
        
        // Show indicators for selected objects
        this.selectedObjects.forEach((object, index) => {
            if (index < this.selectionIndicators.length) {
                const indicator = this.selectionIndicators[index];
                indicator.position.copy(object.position);
                indicator.lookAt(this.camera.position);
                
                // Scale indicator based on object size and distance
                const distance = this.camera.position.distanceTo(object.position);
                const scale = Math.max(1, distance * 0.01);
                indicator.scale.setScalar(scale);
                
                indicator.visible = true;
            }
        });
    }
    
    updateDistanceDisplay() {
        if (this.selectedObjects.length === 2) {
            const obj1 = this.selectedObjects[0];
            const obj2 = this.selectedObjects[1];
            
            const distance = obj1.position.distanceTo(obj2.position);
            const distanceAU = distance; // Assuming our units are AU
            const distanceParsecs = distanceAU / 206265; // 1 parsec = 206,265 AU
            const distanceLightYears = distanceParsecs * 3.26; // 1 parsec = 3.26 light years
            
            // Calculate screen distance
            const obj1Screen = this.worldToScreen(obj1.position);
            const obj2Screen = this.worldToScreen(obj2.position);
            const screenDistance = Math.sqrt(
                Math.pow(obj1Screen.x - obj2Screen.x, 2) + 
                Math.pow(obj1Screen.y - obj2Screen.y, 2)
            );
            
            this.showDistanceDisplay({
                object1: obj1.userData.name,
                object2: obj2.userData.name,
                distanceAU: distanceAU.toFixed(2),
                distanceParsecs: distanceParsecs.toFixed(6),
                distanceLightYears: distanceLightYears.toFixed(3),
                screenDistance: screenDistance.toFixed(0)
            });
        } else {
            this.hideDistanceDisplay();
        }
    }
    
    worldToScreen(worldPosition) {
        const vector = worldPosition.clone();
        vector.project(this.camera);
        
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
        
        return { x, y };
    }
    
    showDistanceDisplay(data) {
        const distancePanel = document.getElementById('distance-display');
        const distanceContent = document.getElementById('distance-content');
        
        distanceContent.innerHTML = `
            <p><strong>Objects:</strong></p>
            <p>A: ${data.object1}</p>
            <p>B: ${data.object2}</p>
            <hr>
            <p><strong>3D Distance:</strong></p>
            <p>${data.distanceAU} AU</p>
            <p>${data.distanceParsecs} parsecs</p>
            <p>${data.distanceLightYears} light years</p>
            <hr>
            <p><strong>Screen Distance:</strong> ${data.screenDistance} pixels</p>
        `;
        
        distancePanel.style.display = 'block';
    }
    
    hideDistanceDisplay() {
        document.getElementById('distance-display').style.display = 'none';
    }
    
    getSelectedObjects() {
        return this.selectedObjects;
    }
    
    update() {
        // Update selection indicators to face camera
        this.updateSelectionIndicators();
        
        // Update distance display if two objects are selected
        if (this.selectedObjects.length === 2) {
            this.updateDistanceDisplay();
        }
    }
}