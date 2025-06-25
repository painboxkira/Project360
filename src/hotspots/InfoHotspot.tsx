import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

// Global texture cache for all hotspot textures
const hotspotTextureCache = new Map<string, THREE.Texture>();

// Preload all hotspot textures upfront
export const preloadHotspotTextures = (texturePaths: string[]) => {
    texturePaths.forEach(path => {
        if (path && !hotspotTextureCache.has(path)) {
            const texture = new THREE.TextureLoader().load(path);
            hotspotTextureCache.set(path, texture);
        }
    });
};

const loadHotspotTexture = (texturePath: string): THREE.Texture => {
    if (hotspotTextureCache.has(texturePath)) {
        return hotspotTextureCache.get(texturePath)!;
    }
    
    // Fallback texture if not preloaded
    const texture = new THREE.TextureLoader().load(texturePath);
    hotspotTextureCache.set(texturePath, texture);
    return texture;
};

interface InfoHotspotProps {
    texturePath: string[];
    position: [number, number, number];
    onComplete?: () => void;
    onActivate?: () => void;
    isActive?: boolean;
    onSetActive?: () => void;
    onSetInactive?: () => void;
}

const InfoHotspot = ({
    texturePath, 
    position, 
    onComplete, 
    onActivate, 
    isActive = false, 
    onSetActive
}: InfoHotspotProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const groupRef = useRef<THREE.Group>(null);

    // Preload all textures for this hotspot on mount
    useEffect(() => {
        preloadHotspotTextures(texturePath);
    }, [texturePath]);

    // Load textures with caching
    const initialTexture = useMemo(() => 
        loadHotspotTexture(texturePath[0] || "/textures/questiondef.png"), 
        [texturePath[0]]
    );

    const completedTexture = useMemo(() => 
        loadHotspotTexture(texturePath[2] || "/textures/complete.png"), 
        [texturePath[2]]
    );

    const tooltipTexture = useMemo(() => 
        loadHotspotTexture(texturePath[1] || "/textures/infodef.png"), 
        [texturePath[1]]
    );

    const handleMainClick = useCallback(() => {
        // Allow revisiting even after completion
        if (!isCompleted) {
            setIsCompleted(true);
            onComplete?.();
        }
        onActivate?.();
        onSetActive?.();
    }, [onActivate, onSetActive, isCompleted, onComplete]);

    const handleComplete = useCallback(() => {
        onComplete?.();
    }, [onComplete]);

    const getCurrentTexture = useMemo(() => {
        if (isCompleted) return completedTexture;
        if (isActive) return tooltipTexture;
        return initialTexture;
    }, [isCompleted, isActive, completedTexture, tooltipTexture, initialTexture]);

    return (
        <group ref={groupRef} position={position}>
            {!isActive && (
                <mesh
                    onPointerOver={() => setIsHovered(true)}
                    onPointerOut={() => setIsHovered(false)}
                    onClick={handleMainClick}
                >
                    <circleGeometry args={[0.1, 64]} />
                    <meshBasicMaterial 
                        map={getCurrentTexture}
                        transparent
                        opacity={isHovered ? 0.8 : 1}
                    />
                </mesh>
            )}
            
            {isActive && (
                <mesh onClick={handleComplete}>
                    <planeGeometry args={[2, 1]} />
                    <meshBasicMaterial 
                        map={tooltipTexture}
                        transparent
                        opacity={0.9}
                    />
                </mesh>
            )}
        </group>
    );
};

export default InfoHotspot; 