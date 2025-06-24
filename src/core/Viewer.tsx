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

// Comprehensive lighting system for optimal color rendering
const LightingSystem = () => {
    return (
        <>
            {/* Ambient light for overall scene illumination */}
            <ambientLight 
                intensity={0.6} 
                color={0xffffff}
            />
            
            {/* Main directional light for primary illumination */}
            <directionalLight
                position={[5, 5, 5]}
                intensity={1.2}
                color={0xffffff}
                castShadow={false}
            />
            
            {/* Secondary directional light for fill lighting */}
            <directionalLight
                position={[-3, 3, -3]}
                intensity={0.5}
                color={0xffffff}
                castShadow={false}
            />
            
            {/* Back lighting for InfoHotspots (negative Z positions) */}
            <directionalLight
                position={[0, 0, -5]}
                intensity={1.0}
                color={0xffffff}
                castShadow={false}
            />
            
            {/* Left back lighting for InfoHotspots */}
            <directionalLight
                position={[-5, 0, -3]}
                intensity={0.8}
                color={0xffffff}
                castShadow={false}
            />
            
            {/* Right back lighting for InfoHotspots */}
            <directionalLight
                position={[5, 0, -3]}
                intensity={0.8}
                color={0xffffff}
                castShadow={false}
            />
            
            {/* Top-down light for hotspot illumination */}
            <directionalLight
                position={[0, 10, 0]}
                intensity={1.0}
                color={0xffffff}
                castShadow={false}
            />
            
            {/* Front-facing light for hotspot readability */}
            <directionalLight
                position={[0, 0, 5]}
                intensity={0.8}
                color={0xffffff}
                castShadow={false}
            />
            
            {/* Subtle hemisphere light for environmental lighting */}
            <hemisphereLight 
                intensity={0.3} 
                groundColor={0x404040}
                color={0xffffff}
            />
        </>
    );
};

const Viewer = ({ texturePath, sceneId, children }: { 
    texturePath: string, 
    sceneId?: string,
    children: React.ReactNode 
}) => {
    return (
        <Canvas 
            camera={{ position: [0, 0, 2], fov: 90, zoom: 3 }}
            gl={{
                antialias: true,
                alpha: false,
                powerPreference: "high-performance",
                stencil: false,
                depth: true,
                logarithmicDepthBuffer: false
            }}
            onCreated={({ gl, scene }) => {
                // Disable ambient occlusion and reflections
                gl.toneMapping = THREE.NoToneMapping;
                gl.outputColorSpace = THREE.SRGBColorSpace;
                scene.traverse((child) => {
                    if (child instanceof THREE.Mesh && child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => {
                                mat.envMap = null;
                                mat.envMapIntensity = 0;
                                mat.aoMap = null;
                                mat.aoMapIntensity = 0;
                            });
                        } else {
                            child.material.envMap = null;
                            child.material.envMapIntensity = 0;
                            child.material.aoMap = null;
                            child.material.aoMapIntensity = 0;
                        }
                    }
                });
            }}
        >
            <LightingSystem />
            <OrbitControls />
            <Scene currentTexturePath={texturePath} sceneId={sceneId} />
            {children}
        </Canvas>
    );
};

export default Viewer;