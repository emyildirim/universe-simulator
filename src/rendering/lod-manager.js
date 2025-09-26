class LODManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // LOD groups for different scale objects
        this.lodGroups = {
            near: new THREE.Group(),    // Detailed solar system objects
            mid: new THREE.Group(),     // Local star region
            far: new THREE.Group(),     // Distant stars
            galaxy: new THREE.Group()   // Galaxy-scale objects
        };
        
        // Add LOD groups to scene
        Object.values(this.lodGroups).forEach(group => {
            this.scene.add(group);
        });
        
        // Current LOD state
        this.currentLOD = 'mid';
        this.starMagnitudeLimit = CONSTANTS.STAR_MAGNITUDE_LIMIT_FAR;
        
        // Performance tracking
        this.renderStats = {
            objectCount: 0,
            triangleCount: 0,
            drawCalls: 0
        };
    }
    
    updateLOD(cameraDistance) {
        const newLOD = this.determineLODLevel(cameraDistance);
        
        if (newLOD !== this.currentLOD) {
            this.transitionToLOD(newLOD);
            this.currentLOD = newLOD;
        }
        
        // Update magnitude limit based on distance
        this.updateStarMagnitudeLimit(cameraDistance);
        
        // Perform frustum culling
        this.performFrustumCulling();
        
        // Update render stats
        this.updateRenderStats();
    }
    
    determineLODLevel(distance) {
        if (distance < CONSTANTS.LOD_NEAR) {
            return 'near';
        } else if (distance < CONSTANTS.LOD_MID) {
            return 'mid';
        } else if (distance < CONSTANTS.LOD_FAR) {
            return 'far';
        } else {
            return 'galaxy';
        }
    }
    
    transitionToLOD(newLOD) {
        // Hide all LOD groups
        Object.values(this.lodGroups).forEach(group => {
            group.visible = false;
        });
        
        // Show appropriate LOD group
        this.lodGroups[newLOD].visible = true;
        
        console.log(`LOD transition: ${this.currentLOD} -> ${newLOD}`);
        
        // Trigger appropriate rendering updates
        switch(newLOD) {
            case 'near':
                this.enableNearViewFeatures();
                break;
            case 'mid':
                this.enableMidViewFeatures();
                break;
            case 'far':
                this.enableFarViewFeatures();
                break;
            case 'galaxy':
                this.enableGalaxyViewFeatures();
                break;
        }
    }
    
    enableNearViewFeatures() {
        // Enable detailed planet/moon rendering
        // Enable orbital mechanics
    }
    
    enableMidViewFeatures() {
        // Enable star field with moderate detail
        // Enable constellation lines
    }
    
    enableFarViewFeatures() {
        // Enable basic star field
        // Disable fine details
    }
    
    enableGalaxyViewFeatures() {
        // Enable galaxy rendering
        // Disable individual stars
    }
    
    updateStarMagnitudeLimit(distance) {
        // Progressive revelation of fainter stars as we zoom in
        const nearLimit = CONSTANTS.STAR_MAGNITUDE_LIMIT_NEAR;
        const farLimit = CONSTANTS.STAR_MAGNITUDE_LIMIT_FAR;
        
        const t = Math.max(0, Math.min(1, 
            (Math.log10(CONSTANTS.LOD_FAR) - Math.log10(distance)) / 
            (Math.log10(CONSTANTS.LOD_FAR) - Math.log10(CONSTANTS.LOD_NEAR))
        ));
        
        this.starMagnitudeLimit = MathUtils.lerp(farLimit, nearLimit, t);
        
        // Update UI
        const starLimitSlider = document.getElementById('star-limit');
        const starLimitDisplay = document.getElementById('star-limit-display');
        
        if (starLimitSlider) {
            starLimitSlider.max = this.starMagnitudeLimit.toFixed(1);
        }
        
        if (starLimitDisplay) {
            starLimitDisplay.textContent = this.starMagnitudeLimit.toFixed(1);
        }
    }
    
    performFrustumCulling() {
        const frustum = new THREE.Frustum();
        const matrix = new THREE.Matrix4().multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
        );
        frustum.setFromProjectionMatrix(matrix);
        
        // Cull objects in current LOD group
        const currentGroup = this.lodGroups[this.currentLOD];
        let visibleCount = 0;
        
        currentGroup.traverse((child) => {
            if (child.isMesh || child.isPoints) {
                const visible = frustum.intersectsObject(child);
                child.visible = visible;
                if (visible) visibleCount++;
            }
        });
        
        this.renderStats.objectCount = visibleCount;
    }
    
    updateRenderStats() {
        // Count triangles and draw calls (simplified approximation)
        let triangleCount = 0;
        let drawCalls = 0;
        
        const currentGroup = this.lodGroups[this.currentLOD];
        currentGroup.traverse((child) => {
            if (child.visible && child.geometry) {
                if (child.geometry.index) {
                    triangleCount += child.geometry.index.count / 3;
                } else if (child.geometry.attributes.position) {
                    triangleCount += child.geometry.attributes.position.count / 3;
                }
                drawCalls++;
            }
        });
        
        this.renderStats.triangleCount = Math.floor(triangleCount);
        this.renderStats.drawCalls = drawCalls;
        
        // Update UI
        const objectCount = document.getElementById('object-count');
        if (objectCount) {
            objectCount.textContent = `Objects: ${this.renderStats.objectCount} | Triangles: ${this.renderStats.triangleCount}`;
        }
    }
    
    // Methods to add objects to appropriate LOD groups
    addToNearLOD(object) {
        this.lodGroups.near.add(object);
    }
    
    addToMidLOD(object) {
        this.lodGroups.mid.add(object);
    }
    
    addToFarLOD(object) {
        this.lodGroups.far.add(object);
    }
    
    addToGalaxyLOD(object) {
        this.lodGroups.galaxy.add(object);
    }
    
    // Remove objects from LOD groups
    removeFromLOD(object) {
        Object.values(this.lodGroups).forEach(group => {
            group.remove(object);
        });
    }
    
    // Get current LOD group
    getCurrentLODGroup() {
        return this.lodGroups[this.currentLOD];
    }
    
    // Utility methods for object management
    setObjectLODDistance(object, nearDistance, farDistance) {
        object.userData.lodNear = nearDistance;
        object.userData.lodFar = farDistance;
    }
    
    shouldRenderObject(object, cameraDistance) {
        if (!object.userData.lodNear || !object.userData.lodFar) {
            return true; // No LOD constraints
        }
        
        return cameraDistance >= object.userData.lodNear && 
               cameraDistance <= object.userData.lodFar;
    }
    
    // Dynamic quality adjustment based on performance
    adjustQualityForPerformance(frameTime) {
        // If frame time is too high, reduce quality
        if (frameTime > 33) { // 30 FPS threshold
            this.starMagnitudeLimit = Math.max(3, this.starMagnitudeLimit - 0.5);
        } else if (frameTime < 16 && this.starMagnitudeLimit < 10) { // 60 FPS, can increase quality
            this.starMagnitudeLimit = Math.min(10, this.starMagnitudeLimit + 0.1);
        }
    }
    
    // Debug information
    getDebugInfo() {
        return {
            currentLOD: this.currentLOD,
            starMagnitudeLimit: this.starMagnitudeLimit.toFixed(2),
            renderStats: this.renderStats,
            lodGroupSizes: {
                near: this.lodGroups.near.children.length,
                mid: this.lodGroups.mid.children.length,
                far: this.lodGroups.far.children.length,
                galaxy: this.lodGroups.galaxy.children.length
            }
        };
    }
}