import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import axios from 'axios';

interface CelestialObject {
  id: number;
  name: string;
  object_type: string;
  x: number;
  y: number;
  z: number;
  magnitude?: number;
  distance?: number;
  spectral_type?: string;
}

interface UniverseVisualizationProps {
  selectedObjects: CelestialObject[];
  onObjectSelect: (object: CelestialObject) => void;
}

const UniverseVisualization: React.FC<UniverseVisualizationProps> = ({
  selectedObjects,
  onObjectSelect
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const objectGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  
  const [objects, setObjects] = useState<CelestialObject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      10000
    );
    camera.position.set(50, 50, 50);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add basic lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);

    // Create object group for celestial objects
    const objectGroup = new THREE.Group();
    scene.add(objectGroup);
    objectGroupRef.current = objectGroup;

    // Add coordinate axes for reference
    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);

    // Simple orbit controls
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isMouseDown) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position);
      
      spherical.theta -= deltaX * 0.01;
      spherical.phi += deltaY * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onWheel = (event: WheelEvent) => {
      const scaleFactor = 1 + event.deltaY * 0.001;
      camera.position.multiplyScalar(scaleFactor);
      camera.position.clampLength(1, 1000);
    };

    // Click handling for object selection
    const onClick = (event: MouseEvent) => {
      if (!mountRef.current) return;

      const rect = mountRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(objectGroup.children);

      if (intersects.length > 0) {
        const selectedMesh = intersects[0].object;
        const userData = selectedMesh.userData as CelestialObject;
        if (userData) {
          onObjectSelect(userData);
        }
      }
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('wheel', onWheel);
    renderer.domElement.addEventListener('click', onClick);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      const currentMount = mountRef.current;
      
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('click', onClick);
      
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onObjectSelect]);

  // Load celestial objects data
  useEffect(() => {
    const loadObjects = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8000/positions?limit=100&max_magnitude=10');
        setObjects(response.data.objects);
      } catch (error) {
        console.error('Error loading objects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadObjects();
  }, []);

  // Update visualization when objects change
  useEffect(() => {
    if (!objectGroupRef.current || objects.length === 0) return;

    // Clear existing objects
    while (objectGroupRef.current.children.length > 0) {
      objectGroupRef.current.remove(objectGroupRef.current.children[0]);
    }

    // Add celestial objects to scene
    objects.forEach(obj => {
      let geometry: THREE.BufferGeometry;
      let material: THREE.Material;
      let size = 1;

      // Scale based on magnitude (smaller magnitude = brighter = larger)
      if (obj.magnitude !== undefined) {
        size = Math.max(0.1, 3 - obj.magnitude * 0.3);
      }

      // Different appearance based on object type
      switch (obj.object_type) {
        case 'planet':
          geometry = new THREE.SphereGeometry(size * 2, 16, 16);
          material = new THREE.MeshLambertMaterial({ 
            color: obj.name === 'Earth' ? 0x6b93d6 : 
                   obj.name === 'Mars' ? 0xcd5c5c : 
                   obj.name === 'Jupiter' ? 0xd2691e : 0x888888 
          });
          break;
        case 'star':
          geometry = new THREE.SphereGeometry(size, 8, 8);
          material = new THREE.MeshBasicMaterial({ 
            color: obj.spectral_type?.startsWith('M') ? 0xff6b6b :
                   obj.spectral_type?.startsWith('K') ? 0xffa500 :
                   obj.spectral_type?.startsWith('G') ? 0xffff00 :
                   obj.spectral_type?.startsWith('F') ? 0xf5f5dc :
                   obj.spectral_type?.startsWith('A') ? 0xffffff :
                   obj.spectral_type?.startsWith('B') ? 0xadd8e6 : 0xffffff,
            transparent: true,
            opacity: 0.8
          });
          break;
        default:
          geometry = new THREE.SphereGeometry(size * 0.5, 8, 8);
          material = new THREE.MeshBasicMaterial({ color: 0x888888 });
      }

      const mesh = new THREE.Mesh(geometry, material);
      
      // Scale positions for better visualization
      const scale = 10;
      mesh.position.set(obj.x * scale, obj.y * scale, obj.z * scale);
      
      // Store object data for selection
      mesh.userData = obj;
      
      objectGroupRef.current!.add(mesh);
    });
  }, [objects]);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        cursor: 'grab'
      }}
    >
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '18px',
          zIndex: 1000
        }}>
          Loading universe data...
        </div>
      )}
    </div>
  );
};

export default UniverseVisualization;