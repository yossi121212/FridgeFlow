'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function TestPage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loadingStatus, setLoadingStatus] = useState('Waiting to load model...');
  const [modelInfo, setModelInfo] = useState<any>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Add a hemisphere light for better overall lighting
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x404040, 0.5);
    scene.add(hemisphereLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Helper grid and axes
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Load 3D Model
    const loader = new GLTFLoader();
    setLoadingStatus('Loading model...');
    
    loader.load(
      '/models/pushpin.glb',
      (gltf) => {
        console.log('Model loaded successfully', gltf);
        
        // Model adjustments
        const model = gltf.scene;
        model.scale.set(0.1, 0.1, 0.1);
        model.position.set(0, 0, 0);
        
        // Apply red material to all meshes in the model
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Create red material
            const redMaterial = new THREE.MeshStandardMaterial({ 
              color: 0xff0000,  // Red color
              roughness: 0.5,
              metalness: 0.2
            });
            child.material = redMaterial;
          }
        });
        
        // Count geometries and materials in the model
        let geometryCount = 0;
        let materialCount = 0;
        
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            geometryCount++;
            if (Array.isArray(child.material)) {
              materialCount += child.material.length;
            } else if (child.material) {
              materialCount++;
            }
          }
        });
        
        // Update model info
        setModelInfo({
          geometryCount,
          materialCount,
          boundingBox: new THREE.Box3().setFromObject(model),
          scale: { x: 0.1, y: 0.1, z: 0.1 },
          position: { x: 0, y: 0, z: 0 }
        });
        
        scene.add(model);
        setLoadingStatus('Model loaded and added to scene');
        
        // Log success
        console.log('Model added to scene');
        console.log('Geometries:', geometryCount);
        console.log('Materials:', materialCount);
      },
      (progress) => {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        console.log('Loading progress:', percentage, '%');
        setLoadingStatus(`Loading: ${percentage}%`);
      },
      (error) => {
        console.error('Error loading model:', error);
        setLoadingStatus(`Error loading model: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    );

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      // Dispose resources
      renderer.dispose();
    };
  }, []);

  return (
    <div className="test-container">
      <div ref={mountRef} style={{ width: '100%', height: '100vh' }}></div>
      <div className="info-panel">
        <h1>3D Model Test Page</h1>
        <p>Model: pushpin.glb (simple box for testing)</p>
        <p>Scale: 0.1</p>
        <p>Position: (0, 0, 0)</p>
        <p>Status: {loadingStatus}</p>
        
        {modelInfo && (
          <div className="model-details">
            <h2>Model Details:</h2>
            <p>Geometries: {modelInfo.geometryCount}</p>
            <p>Materials: {modelInfo.materialCount}</p>
            <p>Bounding Box Min: 
              ({modelInfo.boundingBox.min.x.toFixed(2)}, 
              {modelInfo.boundingBox.min.y.toFixed(2)}, 
              {modelInfo.boundingBox.min.z.toFixed(2)})
            </p>
            <p>Bounding Box Max: 
              ({modelInfo.boundingBox.max.x.toFixed(2)}, 
              {modelInfo.boundingBox.max.y.toFixed(2)}, 
              {modelInfo.boundingBox.max.z.toFixed(2)})
            </p>
          </div>
        )}
        
        <div className="controls-info">
          <h2>Controls:</h2>
          <p>Left click + drag: Rotate camera</p>
          <p>Right click + drag: Pan camera</p>
          <p>Scroll: Zoom in/out</p>
        </div>
      </div>

      <style jsx>{`
        .test-container {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
        }
        .info-panel {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 15px;
          border-radius: 5px;
          max-width: 350px;
          font-family: monospace;
        }
        .info-panel h1 {
          font-size: 1.2rem;
          margin: 0 0 10px 0;
        }
        .info-panel h2 {
          font-size: 1rem;
          margin: 15px 0 5px 0;
        }
        .info-panel p {
          margin: 5px 0;
          font-size: 0.9rem;
        }
        .model-details, .controls-info {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
} 