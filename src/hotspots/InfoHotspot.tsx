import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { hotspotManager } from "../core/hotspotManager";

interface InfoHotspotProps {
    texturePath: string[]; // Flexible array of texture paths
    position: [number, number, number];
    onComplete?: () => void;
}

export default function InfoHotspot({ texturePath, position, onComplete }: InfoHotspotProps) {
    const groupRef = useRef<THREE.Group>(null!);
    const tooltipMeshRef = useRef<THREE.Mesh>(null!);
    const { camera } = useThree();
    
    const [isHovered, setIsHovered] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [tooltipTexture, setTooltipTexture] = useState<THREE.Texture | null>(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const [initialTexture, setInitialTexture] = useState<THREE.Texture | null>(null);
    const [completedTexture, setCompletedTexture] = useState<THREE.Texture | null>(null);
    
    // Deactivation callback for the hotspot manager
    const deactivateCallback = () => {
        setIsActive(false);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            hotspotManager.deactivateHotspot(tooltipMeshRef);
        };
    }, []);

    // Billboarding - always face the camera
    useFrame(() => {
        if (groupRef.current && camera) {
            groupRef.current.lookAt(camera.position);
        }
    });

    // Load all textures at the start
    useEffect(() => {
        const loadTextures = async () => {
            const loader = new THREE.TextureLoader();
            
            try {
                // Load tooltip texture
                const tooltipPath = texturePath[1] || "/textures/infodef.png";
                loader.load(
                    tooltipPath,
                    (texture) => {
                        setTooltipTexture(texture);
                    },
                    undefined,
                    (error) => {
                        console.error('Failed to load tooltip texture:', error);
                    }
                );

                // Load initial texture
                const initialPath = texturePath[0] || "/textures/questiondef.png";
                loader.load(
                    initialPath,
                    (texture) => {
                        setInitialTexture(texture);
                    },
                    undefined,
                    (error) => {
                        console.error('Failed to load initial texture:', error);
                    }
                );

                // Load completed texture
                const completedPath = texturePath[2] || "/textures/complete.png";
                loader.load(
                    completedPath,
                    (texture) => {
                        setCompletedTexture(texture);
                    },
                    undefined,
                    (error) => {
                        console.error('Failed to load completed texture:', error);
                    }
                );
            } catch (error) {
                console.error('Failed to load hotspot textures:', error);
            }
        };

        loadTextures();
    }, [texturePath]);

    // Event handlers
    const handleMouseEnter = (event: any) => {
        event.stopPropagation();
        setIsHovered(true);
        document.body.style.cursor = 'pointer';
    };
    
    const handleMouseLeave = (event: any) => {
        event.stopPropagation();
        setIsHovered(false);
        document.body.style.cursor = 'auto';
    };

    const handleClick = (event: any) => {
        event.stopPropagation();
        
        if (!isActive) {
            // Show tooltip
            hotspotManager.setActiveHotspot(tooltipMeshRef, deactivateCallback);
            setIsActive(true);
        } else {
            // Hide tooltip
            hotspotManager.deactivateHotspot(tooltipMeshRef);
            setIsActive(false);
        }
    };

    const handleInitialClick = (event: any) => {
        event.stopPropagation();
        setIsCompleted(true);
        // Show tooltip immediately after completion
        hotspotManager.setActiveHotspot(tooltipMeshRef, deactivateCallback);
        setIsActive(true);
    };

    // Smooth hover effect
    useFrame(() => {
        if (tooltipMeshRef.current) {
            const targetScale = isHovered ? 1.05 : 1;
            const currentScale = tooltipMeshRef.current.scale.x;
            const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1);
            tooltipMeshRef.current.scale.setScalar(newScale);
        }
    });

    // Common material properties
    const commonMaterialProps = {
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        alphaTest: 0.5,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
    };

    if (isActive) {
        return (
            <group ref={groupRef} position={position}>
                {/* Tooltip mesh */}
                <mesh
                    ref={tooltipMeshRef}
                    position={[0, 0, 0]}
                    onPointerEnter={handleMouseEnter}
                    onPointerLeave={handleMouseLeave}
                    onClick={handleClick}
                    visible={isActive}
                    scale={[1.5, 1.5, 1.5]}
                    renderOrder={1000}
                >
                    <planeGeometry args={[1.875, 1]} />
                    <meshBasicMaterial 
                        map={tooltipTexture}
                        transparent={true}
                        opacity={1.0}
                        side={THREE.DoubleSide}
                        alphaTest={0.5}
                        depthTest={false}
                        depthWrite={false}
                        toneMapped={false}
                    />
                </mesh>
            </group>
        );
    } else if (isCompleted) {
        return (
            <group ref={groupRef} position={position}>
                <mesh 
                    ref={tooltipMeshRef}
                    position={[0, 0, 0]}
                    onPointerEnter={handleMouseEnter}
                    onPointerLeave={handleMouseLeave}
                    onClick={handleClick}
                >
                    <circleGeometry args={[0.1, 32]} />
                    <meshBasicMaterial 
                        map={completedTexture}
                        {...commonMaterialProps}
                    />
                </mesh>
            </group>
        );
    } else {
        return (
            <group ref={groupRef} position={position}>
                <mesh 
                    ref={tooltipMeshRef}
                    position={[0, 0, 0]}
                    onPointerEnter={handleMouseEnter}
                    onPointerLeave={handleMouseLeave}
                    onClick={handleInitialClick}
                >
                    <circleGeometry args={[0.1, 32]} />
                    <meshBasicMaterial 
                        map={initialTexture}
                        {...commonMaterialProps}
                    />
                </mesh>
            </group>
        );
    }
} 