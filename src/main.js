class UniverseSimulator {
    constructor() {
        // Core Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // System components
        this.cameraController = null;
        this.lodManager = null;
        this.timeController = null;
        
        // Object systems
        this.starSystem = null;
        this.planetSystem = null;
        this.galaxySystem = null;
        
        // Performance monitoring
        this.frameCount = 0;
        this.lastFPSUpdate = Date.now();
        this.fps = 0;
        
        // UI state
        this.showOrbits = true;
        this.showLabels = true;
        
        // Loading state
        this.isLoading = true;
        this.loadingElement = null;
        
        this.initialize();
    }
    
    async initialize() {
        console.log('Initializing Universe Simulator...');
        
        // Show loading indicator
        this.showLoading();
        
        try {
            // Initialize Three.js
            this.initializeThreeJS();
            
            // Initialize camera controller
            this.cameraController = new CameraController(this.scene, this.renderer);
            this.camera = this.cameraController.camera;
            
            // Initialize LOD manager
            this.lodManager = new LODManager(this.scene, this.camera);
            
            // Initialize time controller
            this.timeController = new TimeController();
            
            // Initialize object systems
            await this.initializeObjectSystems();
            
            // Setup UI event listeners
            this.setupUI();
            
            // Setup time callbacks
            this.setupTimeCallbacks();
            
            // Start render loop
            this.startRenderLoop();
            
            // Hide loading indicator
            this.hideLoading();
            
            console.log('Universe Simulator initialized successfully!');
            
        } catch (error) {
            console.error('Failed to initialize Universe Simulator:', error);
            this.showError(error.message);
        }
    }
    
    initializeThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('canvas'),
            antialias: true,
            powerPreference: 'high-performance'
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Enable useful features
        this.renderer.sortObjects = false; // We'll handle sorting manually for performance
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
        // Add some basic lighting
        const ambientLight = new THREE.AmbientLight(0x222222, 0.1);
        this.scene.add(ambientLight);
        
        console.log('Three.js initialized');
    }
    
    async initializeObjectSystems() {
        console.log('Initializing object systems...');
        
        // Initialize star system
        this.starSystem = new StarSystem(this.scene, this.lodManager);
        await this.starSystem.initialize();
        
        // Initialize planet system
        this.planetSystem = new PlanetSystem(this.scene, this.lodManager);
        await this.planetSystem.initialize();
        this.planetSystem.setupLighting();
        
        // Initialize galaxy system  
        this.galaxySystem = new GalaxySystem(this.scene, this.lodManager);
        await this.galaxySystem.initialize();
        
        console.log('Object systems initialized');
    }
    
    setupUI() {
        // Zoom slider
        const zoomSlider = document.getElementById('zoom-slider');
        if (zoomSlider) {
            zoomSlider.addEventListener('input', (event) => {
                this.cameraController.setZoomFromSlider(parseFloat(event.target.value));
            });
        }
        
        // View options
        const showOrbitsCheckbox = document.getElementById('show-orbits');
        if (showOrbitsCheckbox) {
            showOrbitsCheckbox.addEventListener('change', (event) => {
                this.showOrbits = event.target.checked;
                this.planetSystem.setOrbitVisibility(this.showOrbits);
            });
        }
        
        const showLabelsCheckbox = document.getElementById('show-labels');
        if (showLabelsCheckbox) {
            showLabelsCheckbox.addEventListener('change', (event) => {
                this.showLabels = event.target.checked;
            });
        }
        
        const starLimitSlider = document.getElementById('star-limit');
        if (starLimitSlider) {
            starLimitSlider.addEventListener('input', (event) => {
                const limit = parseFloat(event.target.value);
                this.starSystem.updateStarVisibility(limit);
                
                const display = document.getElementById('star-limit-display');
                if (display) {
                    display.textContent = limit.toFixed(1);
                }
            });
        }
        
        // Mouse interaction for object selection
        this.renderer.domElement.addEventListener('click', (event) => {
            this.handleObjectSelection(event);
        });
        
        console.log('UI setup complete');
    }
    
    setupTimeCallbacks() {
        // Register time update callback for planet system
        this.timeController.addUpdateCallback((timeOffset, timeScale) => {
            this.planetSystem.updatePositions(timeOffset);
        });
        
        console.log('Time callbacks setup complete');
    }
    
    startRenderLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            this.render();
        };
        
        animate();
        console.log('Render loop started');
    }
    
    render() {
        // Update camera controller
        this.cameraController.update();
        
        // Update LOD based on camera distance
        const cameraDistance = this.cameraController.getCurrentDistance();
        this.lodManager.updateLOD(cameraDistance);
        
        // Update systems
        this.starSystem.update(cameraDistance, this.showLabels);
        this.galaxySystem.update(this.camera);
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
        
        // Update performance counters
        this.updatePerformanceCounters();
    }
    
    updatePerformanceCounters() {
        this.frameCount++;
        const now = Date.now();
        
        if (now - this.lastFPSUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = now;
            
            // Update FPS display
            const fpsCounter = document.getElementById('fps-counter');
            if (fpsCounter) {
                fpsCounter.textContent = `FPS: ${this.fps}`;
            }
            
            // Performance-based quality adjustment
            this.lodManager.adjustQualityForPerformance(1000 / this.fps);
        }
    }
    
    handleObjectSelection(event) {
        // Convert mouse position to world coordinates
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // Create raycaster
        const mouse = new THREE.Vector2();
        mouse.x = (mouseX / rect.width) * 2 - 1;
        mouse.y = -(mouseY / rect.height) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        
        // Check for intersections with current LOD objects
        const currentLODGroup = this.lodManager.getCurrentLODGroup();
        const intersects = raycaster.intersectObjects(currentLODGroup.children, true);
        
        if (intersects.length > 0) {
            const selectedObject = intersects[0].object;
            this.showObjectInfo(selectedObject);
        }
    }
    
    showObjectInfo(object) {
        // Display information about the selected object
        let info = null;
        
        // Check if it's a planet
        if (object.userData.name && this.planetSystem.getPlanetInfo) {
            info = this.planetSystem.getPlanetInfo(object.userData.name);
        }
        
        // Check if it's a star (more complex for point clouds)
        // Check if it's a galaxy
        if (object.userData.galaxyData) {
            info = this.galaxySystem.getGalaxyInfo(object.userData.galaxyData.name);
        }
        
        if (info) {
            console.log('Selected object:', info);
            // In a real app, this would show in a proper UI panel
            
            // Simple alert for now (would be replaced with proper UI)
            let infoText = `${info.name}\n`;
            Object.keys(info).forEach(key => {
                if (key !== 'name') {
                    infoText += `${key}: ${info[key]}\n`;
                }
            });
            
            // Could show in a tooltip or info panel instead
            setTimeout(() => alert(infoText), 100);
        }
    }
    
    showLoading() {
        this.loadingElement = document.createElement('div');
        this.loadingElement.className = 'loading';
        this.loadingElement.textContent = 'Loading Universe Simulator';
        document.body.appendChild(this.loadingElement);
    }
    
    hideLoading() {
        if (this.loadingElement) {
            document.body.removeChild(this.loadingElement);
            this.loadingElement = null;
        }
        this.isLoading = false;
    }
    
    showError(message) {
        this.hideLoading();
        
        const errorElement = document.createElement('div');
        errorElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-size: 16px;
            text-align: center;
        `;
        errorElement.textContent = `Error: ${message}`;
        document.body.appendChild(errorElement);
    }
    
    // Debug methods
    getDebugInfo() {
        return {
            fps: this.fps,
            cameraDistance: this.cameraController?.getCurrentDistance(),
            lodLevel: this.lodManager?.currentLOD,
            timeInfo: this.timeController?.getDebugInfo(),
            starSystem: this.starSystem?.getDebugInfo(),
            planetSystem: this.planetSystem?.getDebugInfo(),
            galaxySystem: this.galaxySystem?.getDebugInfo(),
            lodManager: this.lodManager?.getDebugInfo()
        };
    }
    
    // Utility methods for external access
    focusOnObject(objectName) {
        // Focus camera on a specific object
        const planetInfo = this.planetSystem.getPlanetInfo(objectName.toLowerCase());
        if (planetInfo && planetInfo.position) {
            this.cameraController.setTarget(
                planetInfo.position.x,
                planetInfo.position.y,
                planetInfo.position.z
            );
        }
    }
    
    setTimePreset(presetName) {
        this.timeController.setPreset(presetName);
    }
    
    // Cleanup
    destroy() {
        if (this.timeController) {
            this.timeController.destroy();
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Clear scene
        while (this.scene && this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
    }
}

// Global debug access
let universeSimulator = null;

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Universe Simulator...');
    universeSimulator = new UniverseSimulator();
    
    // Make debug info accessible from console
    window.getDebugInfo = () => {
        if (universeSimulator) {
            console.table(universeSimulator.getDebugInfo());
        }
    };
    
    // Add helpful console commands
    console.log('Universe Simulator Debug Commands:');
    console.log('- getDebugInfo() - Show system information');
    console.log('- universeSimulator.focusOnObject("earth") - Focus on object');
    console.log('- universeSimulator.setTimePreset("fast") - Set time preset');
    console.log('Available time presets: realtime, fast, orbit, planetary, geological');
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (universeSimulator) {
        universeSimulator.destroy();
    }
});