import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

interface InfoHotspotProps {
    texturePath: string[]; // Flexible array of texture paths
    position: [number, number, number];
    onComplete?: () => void;
}

// Use the same texture cache as Viewer
const textureCache = new Map<string, THREE.Texture>();

const preloadTexture = async (texturePath: string): Promise<THREE.Texture> => {
    if (textureCache.has(texturePath)) {
        return textureCache.get(texturePath)!;
    }

    const loader = new THREE.TextureLoader();
    return new Promise((resolve, reject) => {
        loader.load(
            texturePath,
            (texture) => {
                textureCache.set(texturePath, texture);
                resolve(texture);
            },
            undefined,
            reject
        );
    });
};

export default function InfoHotspot({ texturePath, position, onComplete }: InfoHotspotProps) {
    const meshRef = useRef<THREE.Mesh>(null!);
    const groupRef = useRef<THREE.Group>(null!);
    const { camera } = useThree();
    
    const stateRef = useRef({
        isHovered: false,
        isActive: false,
        isCompleted: false
    });

    const texturesRef = useRef<{
        initial: THREE.Texture | null;
        tooltip: THREE.Texture | null;
        completed: THREE.Texture | null;
    }>({
        initial: null,
        tooltip: null,
        completed: null
    });

    // Create geometries once
    const circleGeometry = useRef(new THREE.CircleGeometry(0.1, 64));
    const planeGeometry = useRef(new THREE.PlaneGeometry(1.0, 0.6));

    // Billboarding - always face the camera
    useFrame(() => {
        if (groupRef.current && camera) {
            groupRef.current.lookAt(camera.position);
        }
    });

    // Load all textures at the start
    useEffect(() => {
        const loadTextures = async () => {
            try {
                // Ensure we have at least 3 texture paths, use defaults if not provided
                const initialPath = texturePath[0] || "/textures/infodef.png";
                const tooltipPath = texturePath[1] || "/textures/infodef.png";
                const completedPath = texturePath[2] || "/textures/complete.png";

                const [initial, tooltip, completed] = await Promise.all([
                    preloadTexture(initialPath),
                    preloadTexture(tooltipPath),
                    preloadTexture(completedPath)
                ]);

                texturesRef.current = { initial, tooltip, completed };

                // Set initial texture
                if (meshRef.current && initial) {
                    const material = meshRef.current.material as THREE.MeshBasicMaterial;
                    material.map = initial;
                    material.needsUpdate = true;
                }
            } catch (error) {
                console.error('Failed to load hotspot textures:', error);
            }
        };

        loadTextures();
    }, [texturePath]);

    // Event handlers - no state updates, just ref updates
    const handleMouseEnter = (event: any) => {
        event.stopPropagation();
        stateRef.current.isHovered = true;
        document.body.style.cursor = 'pointer';
    };
    
    const handleMouseLeave = (event: any) => {
        event.stopPropagation();
        stateRef.current.isHovered = false;
        document.body.style.cursor = 'auto';
    };

    const handleClick = (event: any) => {
        event.stopPropagation();
        const state = stateRef.current;
        const textures = texturesRef.current;
        
        if (state.isCompleted) {
            // If already completed, just toggle activation (show/hide tooltip)
            if (!state.isActive) {
                state.isActive = true;
                if (meshRef.current && textures.tooltip) {
                    const material = meshRef.current.material as THREE.MeshBasicMaterial;
                    material.map = textures.tooltip;
                    material.needsUpdate = true;
                    meshRef.current.geometry = planeGeometry.current;
                }
            } else {
                state.isActive = false;
                if (meshRef.current && textures.completed) {
                    const material = meshRef.current.material as THREE.MeshBasicMaterial;
                    material.map = textures.completed;
                    material.needsUpdate = true;
                    meshRef.current.geometry = circleGeometry.current;
                }
            }
        } else {
            // For non-completed hotspots, first show the tooltip
            if (!state.isActive) {
                state.isActive = true;
                if (meshRef.current && textures.tooltip) {
                    const material = meshRef.current.material as THREE.MeshBasicMaterial;
                    material.map = textures.tooltip;
                    material.needsUpdate = true;
                    meshRef.current.geometry = planeGeometry.current;
                }
            } else {
                // Then mark as completed
                state.isCompleted = true;
                state.isActive = false;
                if (meshRef.current && textures.completed) {
                    const material = meshRef.current.material as THREE.MeshBasicMaterial;
                    material.map = textures.completed;
                    material.needsUpdate = true;
                    meshRef.current.geometry = circleGeometry.current;
                }
                if (onComplete) {
                    onComplete();
                }
            }
        }
    };

    // Smooth hover effect
    useFrame(() => {
        if (meshRef.current) {
            const targetScale = stateRef.current.isHovered ? 1.05 : 1;
            const currentScale = meshRef.current.scale.x;
            const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1);
            meshRef.current.scale.setScalar(newScale);
        }
    });

    return (
        <group ref={groupRef} position={position}>
            <mesh
                ref={meshRef}
                position={[0, 0, 0]}
                geometry={circleGeometry.current}
                onPointerEnter={handleMouseEnter}
                onPointerLeave={handleMouseLeave}
                onClick={handleClick}
                renderOrder={stateRef.current.isActive ? 1000 : 0}
            >
                <meshBasicMaterial 
                    transparent={true} 
                    side={THREE.DoubleSide}
                    alphaTest={0.1}
                    depthTest={!stateRef.current.isActive}
                    depthWrite={!stateRef.current.isActive}
                />
            </mesh>
        </group>
    );
}