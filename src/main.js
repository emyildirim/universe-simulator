import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { UniverseRenderer } from './renderer/UniverseRenderer.js';
import { SearchManager } from './search/SearchManager.js';
import { SelectionManager } from './selection/SelectionManager.js';
import { TimelineManager } from './timeline/TimelineManager.js';
import { MeasurementTool } from './tools/MeasurementTool.js';
import { BookmarkManager } from './bookmarks/BookmarkManager.js';

class UniverseSimulator {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = null;
        
        // Managers
        this.universeRenderer = null;
        this.searchManager = null;
        this.selectionManager = null;
        this.timelineManager = null;
        this.measurementTool = null;
        this.bookmarkManager = null;
        
        this.init();
    }
    
    async init() {
        this.setupRenderer();
        this.setupCamera();
        this.setupControls();
        this.setupScene();
        
        // Initialize managers
        this.universeRenderer = new UniverseRenderer(this.scene, this.camera, this.renderer);
        this.searchManager = new SearchManager(this.universeRenderer);
        this.selectionManager = new SelectionManager(this.scene, this.camera, this.renderer);
        this.timelineManager = new TimelineManager(this.universeRenderer);
        this.measurementTool = new MeasurementTool(this.scene, this.camera);
        this.bookmarkManager = new BookmarkManager(this.camera, this.selectionManager);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadInitialData();
        
        // Hide loading screen
        document.getElementById('loading').style.display = 'none';
        
        // Start animation loop
        this.animate();
    }
    
    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000011);
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
    }
    
    setupCamera() {
        this.camera.position.set(0, 0, 1000);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 100000;
    }
    
    setupScene() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Add directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(-1, 0, 1);
        this.scene.add(directionalLight);
    }
    
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Search functionality is handled in SearchManager
        
        // Timeline controls
        const playPauseBtn = document.getElementById('play-pause-btn');
        playPauseBtn.addEventListener('click', () => {
            this.timelineManager.togglePlayPause();
            playPauseBtn.textContent = this.timelineManager.isPlaying ? 'Pause' : 'Play';
            playPauseBtn.classList.toggle('active', this.timelineManager.isPlaying);
        });
        
        const timeSlider = document.getElementById('time-slider');
        timeSlider.addEventListener('input', (e) => {
            this.timelineManager.setTime(parseInt(e.target.value));
        });
        
        const timeScale = document.getElementById('time-scale');
        timeScale.addEventListener('change', (e) => {
            this.timelineManager.setTimeScale(parseInt(e.target.value));
        });
        
        // Selection events
        this.renderer.domElement.addEventListener('click', (event) => {
            this.handleClick(event);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
    }
    
    handleClick(event) {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        const selectedObject = this.selectionManager.selectObject(mouse);
        if (selectedObject) {
            this.showObjectInfo(selectedObject);
        }
    }
    
    handleKeyDown(event) {
        switch(event.code) {
            case 'Space':
                event.preventDefault();
                this.timelineManager.togglePlayPause();
                break;
            case 'Escape':
                this.selectionManager.clearSelection();
                this.hideObjectInfo();
                break;
            case 'KeyM':
                this.measurementTool.toggle();
                break;
        }
    }
    
    showObjectInfo(object) {
        const infoPanel = document.getElementById('info-panel');
        const infoContent = document.getElementById('object-info-content');
        
        infoContent.innerHTML = `
            <h4>${object.name || 'Unknown Object'}</h4>
            <p><strong>Type:</strong> ${object.type || 'Unknown'}</p>
            <p><strong>Distance:</strong> ${object.distance || 'Unknown'} AU</p>
            <p><strong>RA/Dec:</strong> ${object.ra || 'N/A'}, ${object.dec || 'N/A'}</p>
            <p><strong>Magnitude:</strong> ${object.magnitude || 'N/A'}</p>
            ${object.discovery ? `<p><strong>Discovery:</strong> ${object.discovery}</p>` : ''}
        `;
        
        infoPanel.style.display = 'block';
    }
    
    hideObjectInfo() {
        document.getElementById('info-panel').style.display = 'none';
    }
    
    async loadInitialData() {
        try {
            await this.universeRenderer.loadStarField();
            await this.universeRenderer.loadSolarSystem();
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.controls.update();
        this.timelineManager.update();
        this.measurementTool.update();
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the simulator when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new UniverseSimulator();
});