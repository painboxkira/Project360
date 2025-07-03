// src/useDreiDragHandlers.ts
import { useCallback } from 'react';
import { DragControls, OrbitControls } from 'three-stdlib';
import * as THREE from 'three';

export const useDreiDragHandlers = (
  orbitControlsRef: React.RefObject<OrbitControls>,
  meshRef: React.RefObject<THREE.Mesh>,
  dragControlsRef: React.RefObject<DragControls>,
) => {

  const onDragStart = useCallback(() => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false;
    }
  }, [orbitControlsRef]);

  const onDragEnd = useCallback(() => {
    if (orbitControlsRef.current && meshRef.current) {
      // Re-enable OrbitControls
      orbitControlsRef.current.enabled = true;
      
 
    }
  }, [orbitControlsRef, meshRef]);
  

  return { onDragStart, onDragEnd };
};