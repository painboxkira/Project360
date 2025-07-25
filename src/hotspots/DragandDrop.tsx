import React, { useRef, useEffect, useState, useCallback, type RefObject } from "react";
import { useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import type { Mesh, Group, Object3D } from "three";

// Utility: get bounding box for a mesh in world coordinates
/**
 * Compute the world-axis-aligned bounding box of the given Object3D.
 */
function getWorldBox3(object3d: Object3D | null): THREE.Box3 {
  if (!object3d) {
    console.error("Invalid object passed to getWorldBox3", object3d);
    return new THREE.Box3();
  }
  const box = new THREE.Box3();
  object3d.updateWorldMatrix(true, true);
  box.setFromObject(object3d);
  return box;
}

interface DraggableCircleProps {
  id: string;
  initialPosition: [number, number, number];
  radius: number;
  torusRefs: RefObject<Group>[];
  torusTargets: Array<{
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    texture: string;
    label?: string;
    snapOffset: [number, number, number];
  }>;
  onSnap: (args: { circleId: string; torusId: string; isCorrect: boolean }) => void;
  occupiedTargets: Record<string, string>;
  onUnsnap: (args: { circleId: string; torusId: string }) => void;
  correctTarget: string;
  texture: string;
  label?: string;
  boundsRef: RefObject<Mesh>;
  dragPlaneRef: RefObject<Mesh>;
}
function DraggableCircle({
  id,
  initialPosition,
  radius,
  torusRefs,
  torusTargets,
  onSnap,
  occupiedTargets,
  onUnsnap,
  correctTarget,
  texture,
  label,
  boundsRef,
  dragPlaneRef,
}: DraggableCircleProps) {
  const meshRef = useRef<Mesh>(null!);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(() => new THREE.Vector3());
  const [position, setPosition] = useState(initialPosition);
  const [currentTarget, setCurrentTarget] = useState(null);
  const [isCorrectMatch, setIsCorrectMatch] = useState(false);
  const { camera, gl, controls } = useThree();

  const circleTexture = useLoader(THREE.TextureLoader, texture);

  // The bounds checking logic now takes a world-space Vector3
  const isWithinBounds = useCallback((worldPos) => {
    if (!boundsRef.current || !boundsRef.current.isObject3D) return true;
    
    boundsRef.current.updateWorldMatrix(true, true);
    const boundsBox = getWorldBox3(boundsRef.current);
    const circleSize = 0.85; // Effective radius
    
    // Check if the world position is within the bounding box, accounting for circle size
    return (
      worldPos.x >= (boundsBox.min.x + circleSize) &&
      worldPos.x <= (boundsBox.max.x - circleSize) &&
      worldPos.y >= (boundsBox.min.y + circleSize) &&
      worldPos.y <= (boundsBox.max.y - circleSize)
    );
  }, [boundsRef]);

  // --- REWRITTEN with Raycasting ---
  const handlePointerDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    if (controls) controls.enabled = false; // Disable orbit controls
    gl.domElement.style.cursor = "grabbing";

    // Raycast from camera to the drag plane to find the precise click point
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(e.pointer, camera);
    if (!dragPlaneRef.current) return;
    const intersects = raycaster.intersectObject(dragPlaneRef.current);

    if (intersects.length > 0) {
      const parent = meshRef.current.parent;
      if (parent) {
        // Convert the world-space intersection point to local space
        const localClickPoint = parent.worldToLocal(intersects[0].point.clone());
        // Calculate the offset between the object's position and the click point
        const currentPos = new THREE.Vector3(...position);
        setDragOffset(currentPos.sub(localClickPoint));
      }
    }
    
    if (currentTarget && typeof onUnsnap === "function") {
      onUnsnap({ circleId: id, torusId: currentTarget });
      setCurrentTarget(null);
      setIsCorrectMatch(false);
    }
  };

  // --- REWRITTEN with Raycasting ---
  const handlePointerMove = useCallback((event) => {
    if (!isDragging) return;
    
    // Calculate mouse position in Normalized Device Coordinates (NDC)
    const { left, top, width, height } = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - left) / width) * 2 - 1,
      -((event.clientY - top) / height) * 2 + 1
    );

    // Raycast from the camera to the drag plane
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    if (!dragPlaneRef.current) return;
    const intersects = raycaster.intersectObject(dragPlaneRef.current);

    if (intersects.length > 0) {
      const parent = meshRef.current.parent;
      if (parent) {
        // Get the intersection point in world space
        const intersectionPoint = intersects[0].point;
        
        // Convert the world-space point to the parent's local space
        const localPoint = parent.worldToLocal(intersectionPoint.clone());
        
        // Apply the initial drag offset to get the proposed new local position
        const proposedLocalPos = localPoint.add(dragOffset);
        
        // Convert proposed local position back to world for bounds checking
        const proposedWorldPos = parent.localToWorld(proposedLocalPos.clone());

        if (isWithinBounds(proposedWorldPos)) {
          setPosition(proposedLocalPos.toArray());
        } else {
          // If out of bounds, clamp the world position and convert back to local
          boundsRef.current.updateWorldMatrix(true, true);
          const boundsBox = getWorldBox3(boundsRef.current);
          const circleSize = 0.85;
          
          const clampedWorldPos = proposedWorldPos.clone().clamp(
              boundsBox.min.clone().addScalar(circleSize),
              boundsBox.max.clone().subScalar(circleSize)
          );
          
          const clampedLocalPos = parent.worldToLocal(clampedWorldPos);
          setPosition(clampedLocalPos.toArray());
        }
      }
    }
  }, [isDragging, dragOffset, camera, gl, position, boundsRef, isWithinBounds, dragPlaneRef]);

  // --- UPDATED to re-enable controls ---
  const handlePointerUp = (e) => {
    e.stopPropagation();
    setIsDragging(false);
    if (controls) controls.enabled = true; // Re-enable orbit controls
    gl.domElement.style.cursor = "auto";
    
    const mesh = meshRef.current;
    let snapped = false;
    
    torusRefs.current.forEach((ref, idx) => {
      if (!snapped && ref.current) {
        const targetId = torusTargets[idx].id;
        if (occupiedTargets[targetId] && occupiedTargets[targetId] !== id) return;
        
        const meshBox = getWorldBox3(mesh);
        const targetBox = getWorldBox3(ref.current);
        
        if (meshBox.intersectsBox(targetBox)) {
          const localSnapPos = new THREE.Vector3(...torusTargets[idx].snapOffset);
          const worldSnapPos = ref.current.localToWorld(localSnapPos.clone());

          // Convert world snap position to local space of the draggable's parent
          const parent = meshRef.current.parent;
          if (parent) {
            const localSnapFinal = parent.worldToLocal(worldSnapPos);
            setPosition(localSnapFinal.toArray());
          }

          setCurrentTarget(targetId);
          setIsCorrectMatch(correctTarget === targetId);
          snapped = true;
          
          if (typeof onSnap === "function") {
            onSnap({ circleId: id, torusId: targetId, isCorrect: correctTarget === targetId });
          }
        }
      }
    });
  };

  useEffect(() => {
    if (!isDragging) return;
    
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      // Safety net to re-enable controls if component unmounts while dragging
      if (controls) controls.enabled = true;
    };
  }, [isDragging, handlePointerMove, handlePointerUp, controls]);

  const getBorderColor = () => {
    if (isDragging) return "hotpink";
    if (currentTarget) {
      return isCorrectMatch ? "#4ade80" : "#ef4444";
    }
    return "#ffffff";
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onPointerDown={handlePointerDown}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[1.5, 1.5]} />
        <meshStandardMaterial 
          map={circleTexture}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
      <mesh position={[position[0], position[1], position[2] - 0.01]}>
        <planeGeometry args={[1.7, 1.7]} />
        <meshStandardMaterial 
          color={getBorderColor()}
          side={THREE.FrontSide}
          transparent
          opacity={0}
        />
      </mesh>
    </group>
  );
}

interface TorusTargetProps {
  position: [number, number, number];
  rotation: [number, number, number];
  isOccupied: boolean;
  label?: string;
  isCorrectMatch: boolean;
  texture: string;
}
const TorusTarget = React.forwardRef<Group, TorusTargetProps>(
  function TorusTarget(
    { position, rotation, isOccupied, label, isCorrectMatch, texture }: TorusTargetProps,
    ref
  ) {
  const targetTexture = useLoader(THREE.TextureLoader, texture);

  const getBorderColor = () => {
    if (isOccupied) {
      return isCorrectMatch ? "#4ade80" : "#ef4444";
    }
    return "#2ff95b";
  };

  return (
    <group ref={ref} position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[3, 2]} />
        <meshStandardMaterial 
          map={targetTexture}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[3.2, 2.2]} />
        <meshStandardMaterial 
          color={getBorderColor()} 
          side={THREE.DoubleSide}
          transparent
          opacity={0.6}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial color="#38edfd" transparent opacity={0} wireframe />
      </mesh>
    </group>
  );
});

interface SuccessMessageProps {
  isVisible: boolean;
  texture: string;
  position?: [number, number, number];
  scale?: [number, number, number];
}
function SuccessMessage({ isVisible, texture, position = [0, 6, 0], scale = [8, 1.5, 1] }: SuccessMessageProps) {
  const successTexture = useLoader(THREE.TextureLoader, texture);
  if (!isVisible) return null;
  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={[scale[0], scale[1]]} />
        <meshStandardMaterial 
          map={successTexture}
          transparent={true} 
          opacity={0.8}
          side={THREE.FrontSide} 
        />
      </mesh>
    </group>
  );
}

interface InstructionsProps {
  texture: string;
  position?: [number, number, number];
  scale?: [number, number, number];
}
function Instructions({ texture, position = [0, 7, 0], scale = [12, 1, 1] }: InstructionsProps) {
  const instructionTexture = useLoader(THREE.TextureLoader, texture);
  return (
    <mesh position={[position[0]-1,position[1]-5,position[2]-2]}>
      <planeGeometry args={[15, 12]} />
      <meshStandardMaterial 
        map={instructionTexture}
        side={THREE.DoubleSide} 
        transparent={true}
        opacity={0.8}
      />
    </mesh>
  );
}

interface DragAndDropActivityProps {
  items?: Array<{
    id: string;
    position: [number, number, number];
    radius?: number;
    texture: string;
    label?: string;
  }>;
  targets?: Array<{
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    texture: string;
    label?: string;
    snapOffset: [number, number, number];
  }>;
  matchingPairs?: Record<string, string>;
  instructionTexture?: string;
  successTexture?: string;
  instructionPosition?: [number, number, number];
  successPosition?: [number, number, number];
  lightConfig?: {
    ambientIntensity: number;
    pointPosition: [number, number, number];
    pointIntensity: number;
  };
}
export default function DragAndDropActivity({
  items = [],
  targets = [],
  matchingPairs = {},
  instructionTexture = "/path/to/default_instruction_texture.jpg",
  successTexture = "/path/to/default_success_texture.jpg",
  instructionPosition = [0, 7, 0],
  successPosition = [0, 6, 0],
  lightConfig = {
    ambientIntensity: 0.8,
    pointPosition: [0, 8, 8],
    pointIntensity: 1,
  },
}: DragAndDropActivityProps) {
  const torusRefs = useRef<RefObject<Group>[]>(
    targets.map(() => React.createRef<Group>())
  );
  const boundRef = useRef<Mesh>(null!);
  const dragPlaneRef = useRef<Mesh>(null!); // Ref for the invisible drag plane
  const [occupiedTargets, setOccupiedTargets] = useState({});
  const [correctMatches, setCorrectMatches] = useState({});
  const [isGameComplete, setIsGameComplete] = useState(false);

  const handleSnap = ({ circleId, torusId, isCorrect }) => {
    setOccupiedTargets(prev => {
      const newOccupied = { ...prev };
      Object.keys(newOccupied).forEach(targetId => {
        if (newOccupied[targetId] === circleId) delete newOccupied[targetId];
      });
      newOccupied[torusId] = circleId;
      return newOccupied;
    });
    
    setCorrectMatches(prev => {
      const newCorrect = { ...prev };
      Object.keys(newCorrect).forEach(targetId => {
        if (newCorrect[targetId] === circleId) delete newCorrect[targetId];
      });
      if (isCorrect) newCorrect[torusId] = circleId;
      return newCorrect;
    });
  };

  const handleUnsnap = ({ circleId, torusId }) => {
    setOccupiedTargets(prev => {
      const newOccupied = { ...prev };
      if (newOccupied[torusId] === circleId) delete newOccupied[torusId];
      return newOccupied;
    });
    
    setCorrectMatches(prev => {
      const newCorrect = { ...prev };
      if (newCorrect[torusId] === circleId) delete newCorrect[torusId];
      return newCorrect;
    });
  };

  useEffect(() => {
    const totalItems = items.length;
    const correctCount = Object.keys(correctMatches).length;
    const allItemsMatched = items.every(item => {
      const targetId = matchingPairs[item.id];
      return correctMatches[targetId] === item.id;
    });
    setIsGameComplete(correctCount === totalItems && allItemsMatched);
  }, [correctMatches, matchingPairs, items]);

  return (
    <>
      <ambientLight intensity={lightConfig.ambientIntensity} />
      <pointLight 
        position={lightConfig.pointPosition} 
        intensity={lightConfig.pointIntensity} 
      />
      
      <Instructions 
        texture={instructionTexture}
        position={instructionPosition}
      />
      
      <SuccessMessage 
        isVisible={isGameComplete} 
        texture={successTexture}
        position={successPosition}
      />
      
      <group>
        {/* The new invisible plane for raycasting. It's large to ensure the ray always hits it. */}
        <mesh ref={dragPlaneRef} visible={false}>
            <planeGeometry args={[50, 50]} />
            <meshBasicMaterial />
        </mesh>

        <mesh ref={boundRef}>
          <boxGeometry args={[20, 20, 1]} />
          <meshBasicMaterial color="green" wireframe visible={false} />
        </mesh>

        {items.map((item) => (
          <DraggableCircle
            key={item.id}
            id={item.id}
            initialPosition={item.position}
            radius={item.radius || 1}
            torusRefs={torusRefs}
            torusTargets={targets}
            onSnap={handleSnap}
            onUnsnap={handleUnsnap}
            occupiedTargets={occupiedTargets}
            correctTarget={matchingPairs[item.id]}
            texture={item.texture}
            label={item.label}
            boundsRef={boundRef}
            dragPlaneRef={dragPlaneRef} // Pass the plane ref to the draggable item
          />
        ))}
      
        {targets.map((target, i) => (
          <TorusTarget
            key={target.id}
            ref={torusRefs.current[i]}
            position={target.position}
            rotation={target.rotation}
            isOccupied={occupiedTargets[target.id] !== undefined}
            label={target.label}
            isCorrectMatch={correctMatches[target.id] !== undefined}
            texture={target.texture}
          />
        ))}
      </group>
    </>
  );
}
