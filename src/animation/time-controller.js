class TimeController {
    constructor() {
        // Time state
        this.currentTime = 0; // Years offset from 2024
        this.timeScale = 1; // Time multiplier
        this.isPlaying = false;
        this.lastUpdate = Date.now();
        
        // Animation settings
        this.maxTimeScale = 1000; // Maximum years per second
        this.minTimeScale = 0.001; // Minimum time scale
        this.defaultTimeScale = 1;
        
        // Callbacks for time updates
        this.updateCallbacks = [];
        
        // Animation loop
        this.animationId = null;
        
        this.setupUI();
    }
    
    setupUI() {
        // Time slider control
        const timeSlider = document.getElementById('time-slider');
        const timeDisplay = document.getElementById('time-display');
        const playPauseButton = document.getElementById('play-pause');
        const resetButton = document.getElementById('reset-time');
        
        if (timeSlider) {
            timeSlider.addEventListener('input', (event) => {
                this.setTime(parseFloat(event.target.value));
            });
        }
        
        if (playPauseButton) {
            playPauseButton.addEventListener('click', () => {
                this.togglePlayPause();
            });
        }
        
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetTime();
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'Space':
                    event.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'KeyH':
                    this.resetTime();
                    break;
                case 'Equal':
                case 'NumpadAdd':
                    this.increaseTimeScale();
                    break;
                case 'Minus':
                case 'NumpadSubtract':
                    this.decreaseTimeScale();
                    break;
                case 'Digit0':
                case 'Numpad0':
                    this.timeScale = this.defaultTimeScale;
                    break;
            }
        });
        
        this.updateUI();
    }
    
    // Core time methods
    setTime(timeOffset) {
        this.currentTime = Math.max(-10, Math.min(10, timeOffset));
        this.notifyCallbacks();
        this.updateUI();
    }
    
    resetTime() {
        this.currentTime = 0;
        this.timeScale = this.defaultTimeScale;
        this.notifyCallbacks();
        this.updateUI();
    }
    
    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        
        if (this.isPlaying) {
            this.startAnimation();
        } else {
            this.stopAnimation();
        }
        
        this.updateUI();
    }
    
    startAnimation() {
        if (this.animationId) return; // Already running
        
        this.lastUpdate = Date.now();
        this.animate();
    }
    
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    animate() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000; // Convert to seconds
        this.lastUpdate = now;
        
        if (this.isPlaying) {
            // Update time based on time scale
            const timeIncrement = deltaTime * this.timeScale;
            this.currentTime = Math.max(-10, Math.min(10, this.currentTime + timeIncrement));
            
            this.notifyCallbacks();
            this.updateUI();
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    // Time scale controls
    increaseTimeScale() {
        this.timeScale = Math.min(this.maxTimeScale, this.timeScale * 2);
        this.updateUI();
    }
    
    decreaseTimeScale() {
        this.timeScale = Math.max(this.minTimeScale, this.timeScale / 2);
        this.updateUI();
    }
    
    setTimeScale(scale) {
        this.timeScale = Math.max(this.minTimeScale, Math.min(this.maxTimeScale, scale));
        this.updateUI();
    }
    
    // Callback management
    addUpdateCallback(callback) {
        this.updateCallbacks.push(callback);
    }
    
    removeUpdateCallback(callback) {
        const index = this.updateCallbacks.indexOf(callback);
        if (index > -1) {
            this.updateCallbacks.splice(index, 1);
        }
    }
    
    notifyCallbacks() {
        this.updateCallbacks.forEach(callback => {
            callback(this.currentTime, this.timeScale);
        });
    }
    
    // UI updates
    updateUI() {
        const timeSlider = document.getElementById('time-slider');
        const timeDisplay = document.getElementById('time-display');
        const playPauseButton = document.getElementById('play-pause');
        
        if (timeSlider) {
            timeSlider.value = this.currentTime;
        }
        
        if (timeDisplay) {
            timeDisplay.textContent = UNITS.formatTime(this.currentTime);
            
            // Add time scale indicator
            if (this.timeScale !== 1) {
                const scaleText = this.timeScale >= 1 ? 
                    `×${this.timeScale.toFixed(0)}` : 
                    `×${this.timeScale.toFixed(3)}`;
                timeDisplay.textContent += ` (${scaleText})`;
            }
        }
        
        if (playPauseButton) {
            playPauseButton.textContent = this.isPlaying ? 'Pause' : 'Play';
            playPauseButton.style.backgroundColor = this.isPlaying ? '#e74c3c' : '#4a90e2';
        }
    }
    
    // Utility methods
    getCurrentYear() {
        return 2024 + this.currentTime;
    }
    
    getCurrentJulianDay() {
        // Simple conversion to Julian day
        const year = this.getCurrentYear();
        const dayOfYear = (year - Math.floor(year)) * 365.25;
        const baseJD = 2451545.0; // J2000.0 epoch
        return baseJD + (year - 2000) * 365.25 + dayOfYear;
    }
    
    // Convert time offset to various units
    getTimeInDays() {
        return this.currentTime * CONSTANTS.DAYS_PER_YEAR;
    }
    
    getTimeInSeconds() {
        return this.getTimeInDays() * CONSTANTS.SECONDS_PER_DAY;
    }
    
    // Ephemeris calculations
    // These would be replaced with proper ephemeris data in a real implementation
    getPlanetMeanAnomaly(planetName, epoch) {
        const meanMotions = {
            mercury: 4.0923344368, // radians per day
            venus: 1.6021302244,
            earth: 0.9856076686,
            mars: 0.5240207766,
            jupiter: 0.0831294023,
            saturn: 0.0334597339
        };
        
        const motion = meanMotions[planetName.toLowerCase()] || 0;
        return epoch + motion * this.getTimeInDays();
    }
    
    // Interpolation helpers for smooth animations
    lerp(start, end, t) {
        return start + (end - start) * t;
    }
    
    smoothstep(t) {
        return t * t * (3 - 2 * t);
    }
    
    // Time formatting utilities
    formatDuration(years) {
        const absYears = Math.abs(years);
        
        if (absYears < 1) {
            const days = Math.floor(absYears * 365.25);
            return `${days} day${days !== 1 ? 's' : ''}`;
        } else if (absYears < 1000) {
            return `${absYears.toFixed(1)} year${absYears !== 1 ? 's' : ''}`;
        } else if (absYears < 1000000) {
            const kYears = absYears / 1000;
            return `${kYears.toFixed(1)} thousand years`;
        } else {
            const mYears = absYears / 1000000;
            return `${mYears.toFixed(1)} million years`;
        }
    }
    
    formatTimeRange() {
        const minYear = 2024 + (-10);
        const maxYear = 2024 + 10;
        return `${minYear} - ${maxYear}`;
    }
    
    // Animation presets
    setPreset(presetName) {
        switch(presetName) {
            case 'realtime':
                this.timeScale = 1;
                break;
            case 'fast':
                this.timeScale = 100;
                break;
            case 'orbit':
                this.timeScale = 365; // 1 year per second
                break;
            case 'planetary':
                this.timeScale = 30; // 30 years per second
                break;
            case 'geological':
                this.timeScale = 1000000; // 1 million years per second
                break;
            default:
                this.timeScale = this.defaultTimeScale;
        }
        this.updateUI();
    }
    
    // State management
    getState() {
        return {
            currentTime: this.currentTime,
            timeScale: this.timeScale,
            isPlaying: this.isPlaying
        };
    }
    
    setState(state) {
        this.currentTime = state.currentTime || 0;
        this.timeScale = state.timeScale || this.defaultTimeScale;
        
        if (state.isPlaying && !this.isPlaying) {
            this.togglePlayPause();
        } else if (!state.isPlaying && this.isPlaying) {
            this.togglePlayPause();
        }
        
        this.updateUI();
    }
    
    // Debug information
    getDebugInfo() {
        return {
            currentTime: this.currentTime,
            currentYear: this.getCurrentYear(),
            timeScale: this.timeScale,
            isPlaying: this.isPlaying,
            julianDay: this.getCurrentJulianDay(),
            callbackCount: this.updateCallbacks.length
        };
    }
    
    // Cleanup
    destroy() {
        this.stopAnimation();
        this.updateCallbacks = [];
        
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeydown);
    }
}