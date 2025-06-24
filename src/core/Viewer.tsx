import  { useState, useEffect, useRef} from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Texture cache to store preloaded textures
const textureCache = new Map<string, THREE.Texture>();

// Memory management for texture cache
const MAX_CACHE_SIZE = 10; // Maximum number of textures to keep in cache

const cleanupTextureCache = () => {
    if (textureCache.size > MAX_CACHE_SIZE) {
        // Remove oldest textures (first entries)
        const entries = Array.from(textureCache.entries());
        const toRemove = entries.slice(0, textureCache.size - MAX_CACHE_SIZE);
        
        toRemove.forEach(([key, texture]) => {
            texture.dispose();
            textureCache.delete(key);
        });
    }
};

// Preload texture function
const preloadTexture = async (texturePath: string): Promise<THREE.Texture> => {
    if (!texturePath || texturePath.trim() === '') {
        throw new Error('Texture path cannot be empty');
    }
    
    if (textureCache.has(texturePath)) {
        return textureCache.get(texturePath)!;
    }

    const loader = new THREE.TextureLoader();
    return new Promise((resolve, reject) => {
        console.log(`Loading texture: ${texturePath}`);
        loader.load(
            texturePath,
            (texture) => {
                console.log(`Successfully loaded texture: ${texturePath}`);
                textureCache.set(texturePath, texture);
                cleanupTextureCache(); // Clean up if cache gets too large
                resolve(texture);
            },
            undefined,
            (error: unknown) => {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`Failed to load texture: ${texturePath}`, error);
                reject(new Error(`Failed to load texture: ${texturePath} - ${errorMessage}`));
            }
        );
    });
};

// Preload all textures for smooth transitions
export const preloadAllTextures = async (texturePaths: string[]): Promise<void> => {
    const loadPromises = texturePaths.map(path => preloadTexture(path));
    await Promise.all(loadPromises);
};

// Clear texture cache to free memory
export const clearTextureCache = () => {
    textureCache.forEach((texture) => {
        texture.dispose();
    });
    textureCache.clear();
};

// Scene component that switches textures
const Scene = ({ currentTexturePath, sceneId }: { 
    currentTexturePath: string;
    sceneId?: string;
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [material, setMaterial] = useState<THREE.MeshBasicMaterial | null>(null);

    useEffect(() => {
        const updateTexture = async () => {
            // Don't try to load empty texture paths
            if (!currentTexturePath || currentTexturePath.trim() === '') {
                console.warn('Skipping texture load for empty path');
                return;
            }

            try {
                // Use cached texture if available, otherwise load it
                let texture: THREE.Texture;
                if (textureCache.has(currentTexturePath)) {
                    texture = textureCache.get(currentTexturePath)!;
                } else {
                    texture = await preloadTexture(currentTexturePath);
                }
                
                const newMaterial = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.BackSide,
                    transparent: false,
                    depthWrite: false
                });
                
                setMaterial(newMaterial);
            } catch (error) {
                console.error(`Failed to load texture: ${currentTexturePath}`, error);
                // Create a fallback material with a visible color to indicate loading failure
                const fallbackMaterial = new THREE.MeshBasicMaterial({
                    color: 0xff0000, // Red color to indicate error
                    side: THREE.BackSide,
                    transparent: false,
                    depthWrite: false
                });
                setMaterial(fallbackMaterial);
            }
        };

        updateTexture();
    }, [currentTexturePath]);

    // Cleanup material on unmount
    useEffect(() => {
        return () => {
            if (material) {
                material.dispose();
            }
        };
    }, [material]);

    return (
        <mesh 
            ref={meshRef} 
            scale={[-1, 1, 1]} 
            rotation={[0, 0, 0]} 
            position={[0, 0, 0]}
        >
            <sphereGeometry args={[3, 64, 32]} />
            {material && (
                <meshBasicMaterial 
                    map={material.map}
                    side={material.side}
                    transparent={material.transparent}
                    depthWrite={material.depthWrite}
                />
            )}
        </mesh>
    );
};

const Viewer = ({ texturePath, sceneId, children }: { 
    texturePath: string, 
    sceneId?: string,
    children: React.ReactNode 
}) => {
    return (
        <Canvas camera={{ position: [0, 0, 2], fov: 90, zoom: 3 }}>
           <hemisphereLight intensity={0.5} groundColor={0x000000} />
            <OrbitControls />
            <Scene currentTexturePath={texturePath} sceneId={sceneId} />
            {children}
        </Canvas>
    );
};

export default Viewer;