class CameraController {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        
        // Initialize camera
        this.camera = new THREE.PerspectiveCamera(
            75, // FOV
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near clipping plane
            1e15 // Far clipping plane (very large for astronomical scales)
        );
        
        // Camera state
        this.distance = 1; // Distance in AU
        this.target = new THREE.Vector3(0, 0, 0);
        this.theta = 0; // Horizontal rotation
        this.phi = Math.PI / 4; // Vertical rotation (45 degrees)
        
        // Movement state
        this.isMouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.velocity = new THREE.Vector3();
        this.targetDistance = this.distance;
        
        // Smooth movement parameters
        this.dampingFactor = 0.05;
        this.zoomSpeed = 0.1;
        this.rotationSpeed = 0.005;
        
        this.setupEventListeners();
        this.updateCameraPosition();
    }
    
    setupEventListeners() {
        const canvas = this.renderer.domElement;
        
        // Mouse controls
        canvas.addEventListener('mousedown', (event) => {
            this.isMouseDown = true;
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
            canvas.style.cursor = 'grabbing';
        });
        
        canvas.addEventListener('mousemove', (event) => {
            if (!this.isMouseDown) return;
            
            const deltaX = event.clientX - this.mouseX;
            const deltaY = event.clientY - this.mouseY;
            
            this.theta -= deltaX * this.rotationSpeed;
            this.phi = Math.max(0.01, Math.min(Math.PI - 0.01, 
                this.phi + deltaY * this.rotationSpeed));
            
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
        });
        
        canvas.addEventListener('mouseup', () => {
            this.isMouseDown = false;
            canvas.style.cursor = 'grab';
        });
        
        // Wheel zoom
        canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            
            const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
            this.targetDistance = Math.max(CONSTANTS.ZOOM_MIN, 
                Math.min(CONSTANTS.ZOOM_MAX, this.targetDistance * zoomFactor));
        });
        
        // Touch controls for mobile
        canvas.addEventListener('touchstart', (event) => {
            if (event.touches.length === 1) {
                this.isMouseDown = true;
                this.mouseX = event.touches[0].clientX;
                this.mouseY = event.touches[0].clientY;
            }
        });
        
        canvas.addEventListener('touchmove', (event) => {
            event.preventDefault();
            if (event.touches.length === 1 && this.isMouseDown) {
                const deltaX = event.touches[0].clientX - this.mouseX;
                const deltaY = event.touches[0].clientY - this.mouseY;
                
                this.theta -= deltaX * this.rotationSpeed;
                this.phi = Math.max(0.01, Math.min(Math.PI - 0.01, 
                    this.phi + deltaY * this.rotationSpeed));
                
                this.mouseX = event.touches[0].clientX;
                this.mouseY = event.touches[0].clientY;
            }
        });
        
        canvas.addEventListener('touchend', () => {
            this.isMouseDown = false;
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            const speed = this.distance * 0.01;
            
            switch(event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.moveForward(speed);
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.moveForward(-speed);
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.moveRight(-speed);
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.moveRight(speed);
                    break;
                case 'KeyQ':
                    this.moveUp(speed);
                    break;
                case 'KeyE':
                    this.moveUp(-speed);
                    break;
                case 'KeyR':
                    this.resetCamera();
                    break;
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    moveForward(distance) {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        this.target.addScaledVector(direction, distance);
    }
    
    moveRight(distance) {
        const right = new THREE.Vector3();
        right.crossVectors(this.camera.up, this.getViewDirection());
        this.target.addScaledVector(right, distance);
    }
    
    moveUp(distance) {
        this.target.y += distance;
    }
    
    getViewDirection() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        return direction;
    }
    
    resetCamera() {
        this.distance = 1;
        this.targetDistance = 1;
        this.target.set(0, 0, 0);
        this.theta = 0;
        this.phi = Math.PI / 4;
    }
    
    setZoomFromSlider(zoomValue) {
        this.targetDistance = UNITS.zoomToDistance(zoomValue);
    }
    
    setTarget(x, y, z) {
        this.target.set(x, y, z);
    }
    
    getCurrentDistance() {
        return this.distance;
    }
    
    getLODLevel() {
        if (this.distance < CONSTANTS.LOD_NEAR) {
            return 'near';
        } else if (this.distance < CONSTANTS.LOD_MID) {
            return 'mid';
        } else if (this.distance < CONSTANTS.LOD_FAR) {
            return 'far';
        } else {
            return 'galaxy';
        }
    }
    
    updateCameraPosition() {
        // Smooth distance interpolation
        this.distance = MathUtils.lerp(this.distance, this.targetDistance, this.dampingFactor);
        
        // Convert spherical to Cartesian coordinates
        const position = MathUtils.sphericalToCartesian(this.distance, this.theta, this.phi);
        
        // Set camera position relative to target
        this.camera.position.set(
            this.target.x + position.x,
            this.target.y + position.y,
            this.target.z + position.z
        );
        
        // Look at target
        this.camera.lookAt(this.target);
        
        // Update camera matrix
        this.camera.updateMatrixWorld();
    }
    
    update() {
        this.updateCameraPosition();
        
        // Update UI elements
        const zoomSlider = document.getElementById('zoom-slider');
        const zoomDisplay = document.getElementById('zoom-display');
        const cameraInfo = document.getElementById('camera-info');
        
        if (zoomSlider && !this.isMouseDown) {
            zoomSlider.value = UNITS.distanceToZoom(this.distance);
        }
        
        if (zoomDisplay) {
            zoomDisplay.textContent = UNITS.formatDistance(this.distance);
        }
        
        if (cameraInfo) {
            cameraInfo.textContent = `Distance: ${UNITS.formatDistance(this.distance)} | LOD: ${this.getLODLevel()}`;
        }
    }
    
    // Get camera frustum for culling
    getFrustum() {
        const frustum = new THREE.Frustum();
        const matrix = new THREE.Matrix4().multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
        );
        frustum.setFromProjectionMatrix(matrix);
        return frustum;
    }
    
    // Check if point is in view
    isPointInView(point) {
        const frustum = this.getFrustum();
        return frustum.containsPoint(point);
    }
    
    // Get viewing angle for LOD calculations
    getViewingAngle(objectSize, objectDistance) {
        return 2 * Math.atan(objectSize / (2 * objectDistance));
    }
}