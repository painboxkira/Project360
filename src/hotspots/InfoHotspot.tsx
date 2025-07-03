import * as THREE from "three";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTextureArrayWithFallbacks } from "../core/hooks/useTexture";

// Legacy export for backward compatibility
export const preloadHotspotTextures = (texturePaths: string[]) => {
    console.warn('preloadHotspotTextures is deprecated. Use textureManager.preloadAllSceneTextures instead.');
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
    onSetActive,
    onSetInactive
}: InfoHotspotProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const groupRef = useRef<THREE.Group>(null);

    // Load textures from global cache with fallbacks
    const textures = useTextureArrayWithFallbacks(texturePath, [
        "/textures/questiondef.png",
        "/textures/infodef.png", 
        "/textures/complete.png"
    ]);

    const [initialTexture, tooltipTexture, completedTexture] = textures;

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
                <mesh onClick={() => onSetInactive?.()}>
                    <planeGeometry args={[2, 1]} />
                    <meshBasicMaterial 
                        map={tooltipTexture}
                        transparent
                        opacity={1}
                    />
                </mesh>
            )}
        </group>
    );
};

export default InfoHotspot; 