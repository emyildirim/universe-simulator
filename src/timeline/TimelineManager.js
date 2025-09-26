export class TimelineManager {
    constructor(universeRenderer) {
        this.universeRenderer = universeRenderer;
        
        this.isPlaying = false;
        this.currentTime = 0; // Days since epoch
        this.timeScale = 1; // Time multiplier
        this.maxTime = 365; // One year
        
        this.setupUI();
        this.startTime = Date.now();
    }
    
    setupUI() {
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.timeSlider = document.getElementById('time-slider');
        this.timeDisplay = document.getElementById('time-display');
        this.timeScaleSelect = document.getElementById('time-scale');
        
        // Set initial values
        this.timeSlider.max = this.maxTime;
        this.timeSlider.value = this.currentTime;
        this.updateTimeDisplay();
    }
    
    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        this.playPauseBtn.textContent = this.isPlaying ? 'Pause' : 'Play';
        this.playPauseBtn.classList.toggle('active', this.isPlaying);
        
        if (this.isPlaying) {
            this.startTime = Date.now() - (this.currentTime * 1000 / this.timeScale);
        }
    }
    
    setTime(time) {
        this.currentTime = Math.max(0, Math.min(this.maxTime, time));
        this.timeSlider.value = this.currentTime;
        this.updateTimeDisplay();
        this.updateSimulation();
        
        // Reset start time if playing
        if (this.isPlaying) {
            this.startTime = Date.now() - (this.currentTime * 1000 / this.timeScale);
        }
    }
    
    setTimeScale(scale) {
        const wasPlaying = this.isPlaying;
        if (wasPlaying) {
            this.togglePlayPause(); // Pause
        }
        
        this.timeScale = scale;
        this.timeScaleSelect.value = scale;
        
        if (wasPlaying) {
            this.togglePlayPause(); // Resume
        }
    }
    
    update() {
        if (this.isPlaying) {
            const now = Date.now();
            const elapsedSeconds = (now - this.startTime) / 1000;
            this.currentTime = elapsedSeconds * this.timeScale;
            
            // Wrap around at max time
            if (this.currentTime > this.maxTime) {
                this.currentTime = 0;
                this.startTime = now;
            }
            
            this.timeSlider.value = this.currentTime;
            this.updateTimeDisplay();
            this.updateSimulation();
        }
    }
    
    updateTimeDisplay() {
        const days = Math.floor(this.currentTime);
        const hours = Math.floor((this.currentTime - days) * 24);
        
        // Calculate date from epoch (assuming epoch is Jan 1, 2024)
        const epochDate = new Date(2024, 0, 1);
        const currentDate = new Date(epochDate.getTime() + days * 24 * 60 * 60 * 1000);
        
        this.timeDisplay.textContent = `${currentDate.toLocaleDateString()} ${hours}:00`;
    }
    
    updateSimulation() {
        // Update orbital positions
        this.universeRenderer.updateOrbitalPositions(this.currentTime);
        
        // Update any time-dependent astronomical phenomena
        this.updateProperMotion();
        this.updateVariableStars();
    }
    
    updateProperMotion() {
        // Simulate proper motion for stars
        // This would be more complex in a real implementation
        const properMotionObjects = this.universeRenderer.getAllObjects().filter(
            obj => obj.userData.type === 'Star' && obj.userData.properMotion
        );
        
        properMotionObjects.forEach(star => {
            const motion = star.userData.properMotion;
            const years = this.currentTime / 365.25;
            
            // Apply proper motion (very simplified)
            if (motion.ra && motion.dec) {
                const deltaRA = motion.ra * years * 0.001; // Convert to simulation units
                const deltaDec = motion.dec * years * 0.001;
                
                star.position.x += deltaRA;
                star.position.y += deltaDec;
            }
        });
    }
    
    updateVariableStars() {
        // Simulate variable star brightness changes
        const variableStars = this.universeRenderer.getAllObjects().filter(
            obj => obj.userData.type === 'Variable Star'
        );
        
        variableStars.forEach(star => {
            const period = star.userData.variabilityPeriod || 1; // days
            const amplitude = star.userData.variabilityAmplitude || 0.1;
            
            const phase = (this.currentTime / period) * 2 * Math.PI;
            const brightness = 1 + amplitude * Math.sin(phase);
            
            if (star.material) {
                star.material.opacity = Math.max(0.1, Math.min(1.0, brightness));
            }
        });
    }
    
    // Method to add ephemeris data for accurate planetary positions
    async loadEphemerisData(objectName, startDate, endDate) {
        // This would integrate with JPL Horizons API
        // For now, we'll use simplified Keplerian elements
        
        try {
            // Mock JPL API call (would be real in production)
            const ephemerisData = await this.fetchJPLEphemeris(objectName, startDate, endDate);
            return ephemerisData;
        } catch (error) {
            console.warn('Failed to load ephemeris data:', error);
            return this.generateMockEphemeris(objectName);
        }
    }
    
    async fetchJPLEphemeris(objectName, startDate, endDate) {
        // JPL Horizons API endpoint
        const apiUrl = 'https://ssd-api.jpl.nasa.gov/horizons.api';
        
        const params = new URLSearchParams({
            format: 'json',
            COMMAND: `'${objectName}'`,
            OBJ_DATA: 'YES',
            MAKE_EPHEM: 'YES',
            EPHEM_TYPE: 'VECTORS',
            CENTER: '500@10', // Solar System Barycenter
            START_TIME: startDate,
            STOP_TIME: endDate,
            STEP_SIZE: '1d'
        });
        
        // Note: This would typically require CORS proxy or server-side implementation
        const response = await fetch(`${apiUrl}?${params}`);
        
        if (!response.ok) {
            throw new Error('JPL API request failed');
        }
        
        return await response.json();
    }
    
    generateMockEphemeris(objectName) {
        // Generate mock ephemeris data for demonstration
        return {
            objectName,
            positions: [], // Would contain position vectors over time
            velocities: [], // Would contain velocity vectors over time
            timestamps: [] // Would contain corresponding timestamps
        };
    }
    
    getCurrentTime() {
        return this.currentTime;
    }
    
    getTimeScale() {
        return this.timeScale;
    }
    
    isSimulationPlaying() {
        return this.isPlaying;
    }
}