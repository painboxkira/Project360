// src/IntersectionScene.tsx
import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, DragControls } from '@react-three/drei';
import * as THREE from 'three';
import { useDreiDragHandlers } from './useDraggable'; // 1. Import the correct hook

const IntersectionScene: React.FC = () => {
  // Refs for the meshes and the orbit controls
  const box1Ref = useRef<THREE.Mesh>(null!);
  const box2Ref = useRef<THREE.Mesh>(null!);
  const orbitControlsRef = useRef<any>(null!);
  const dragControlsRef = useRef<any>(null!);
  // Define initial positions
  const box1InitialPos = useMemo(() => new THREE.Vector3(-1.5, 0, 0), []);
  const box2InitialPos = useMemo(() => new THREE.Vector3(1.5, 0, 0), []);
  let dragHandlers = useDreiDragHandlers(orbitControlsRef, box1Ref, dragControlsRef);
 
  const handleDrag = (event) => {
    // Get the world matrix from the dragged object
    const matrixWorld = event.object.matrixWorld;
    
    // Update the worldPosition vector with the latest coordinates
    worldPosition.setFromMatrixPosition(matrixWorld);
    
    // Update React state with the new position
    setPosition([worldPosition.x, worldPosition.y, worldPosition.z]);
    
    // You can also log it to the console
    // console.log('Real-time position:', worldPosition);
  };
  
  return (
        <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black' }}>       
    <div style={{ 
      position: 'absolute', 
      top: '10px', 
      left: '10px', 
      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
      color: 'white', 
      padding: '20px', 
      borderRadius: '8px',
      zIndex: 1000
    }}>
      <h3>Box Controls</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <h4>Box 1 (Blue)</h4>
        <div style={{ marginBottom: '10px' }}>
          <label>X: </label>
          <input 
            type="number" 
            step="0.1" 
            defaultValue={box1InitialPos.x}
            onChange={(e) => {
              if (box1Ref.current) {
                box1Ref.current.position.x = parseFloat(e.target.value);
              }
            }}
            style={{ width: '60px', marginLeft: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Y: </label>
          <input 
            type="number" 
            step="0.1" 
            defaultValue={box1InitialPos.y}
            onChange={(e) => {
              if (box1Ref.current) {
                box1Ref.current.position.y = parseFloat(e.target.value);
              }
            }}
            style={{ width: '60px', marginLeft: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Z: </label>
          <input 
            type="number" 
            step="0.1" 
            defaultValue={box1InitialPos.z}
            onChange={(e) => {
              if (box1Ref.current) {
                box1Ref.current.position.z = parseFloat(e.target.value);
              }
            }}
            style={{ width: '60px', marginLeft: '5px' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4>Box 2 (Orange)</h4>
        <div style={{ marginBottom: '10px' }}>
          <label>X: </label>
          <input 
            type="number" 
            step="0.1" 
            defaultValue={box2InitialPos.x}
            onChange={(e) => {
              if (box2Ref.current) {
                box2Ref.current.position.x = parseFloat(e.target.value);
              }
            }}
            style={{ width: '60px', marginLeft: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Y: </label>
          <input 
            type="number" 
            step="0.1" 
            defaultValue={box2InitialPos.y}
            onChange={(e) => {
              if (box2Ref.current) {
                box2Ref.current.position.y = parseFloat(e.target.value);
              }
            }}
            style={{ width: '60px', marginLeft: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Z: </label>
          <input 
            type="number" 
            step="0.1" 
            defaultValue={box2InitialPos.z}
            onChange={(e) => {
              if (box2Ref.current) {
                box2Ref.current.position.z = parseFloat(e.target.value);
              }
            }}
            style={{ width: '60px', marginLeft: '5px' }}
          />
        </div>
      </div>

      <button 
        onClick={() => {
          if (box1Ref.current) {
            box1Ref.current.position.copy(box1InitialPos);
          }
          if (box2Ref.current) {
            box2Ref.current.position.copy(box2InitialPos);
          }
        }}
        style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Reset Positions
      </button>
    </div>
    <Canvas camera={{ position: [0, 2, 8] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      {/* 3. Spread the handlers onto the DragControls component */}
      <DragControls {...dragHandlers} key="dc1">
        <mesh ref={box1Ref} position={box1InitialPos}>
          <boxGeometry />
          <meshBasicMaterial color="blue" />
        </mesh>
      </DragControls>

      {/* The same handlers can be reused */}
      <DragControls onDrag={handleDrag} key="dc2"> // 2. Get the event handlers from the hook

        <mesh ref={box2Ref} position={box2InitialPos}>
          <boxGeometry />
          <meshBasicMaterial color="orange" />
        </mesh>
      </DragControls>

      <OrbitControls ref={orbitControlsRef} />
    </Canvas>
    </div>
  );
};

export default IntersectionScene;