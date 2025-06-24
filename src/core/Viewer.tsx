import  { useState, useEffect, useRef} from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
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
        
        console.log(`Cleaned up ${toRemove.length} textures from cache`);
    }
};

// Preload texture function
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
                cleanupTextureCache(); // Clean up if cache gets too large
                resolve(texture);
            },
            undefined,
            reject
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
    console.log('Texture cache cleared');
};

// Scene component that switches textures
const Scene = ({ currentTexturePath, sceneId }: { 
    currentTexturePath: string;
    sceneId?: string;
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [material, setMaterial] = useState<THREE.MeshBasicMaterial | null>(null);
    const { camera } = useThree();
    const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
    const lastSceneIdRef = useRef<string | undefined>(sceneId);

    useEffect(() => {
        const updateTexture = async () => {
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
                console.error('Failed to load texture:', error);
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

    // Reset raycast when scene changes
    useEffect(() => {
        if (sceneId !== lastSceneIdRef.current) {
            console.log('=== Scene Changed - Resetting Raycast ===');
            console.log('Previous scene:', lastSceneIdRef.current);
            console.log('New scene:', sceneId);
            console.log('========================================');
            
            // Reset raycaster
            raycasterRef.current = new THREE.Raycaster();
            lastSceneIdRef.current = sceneId;
        }
    }, [sceneId]);

    // Dynamic raycasting on every frame
    useFrame(() => {
        if (meshRef.current && camera) {
            const targetObjects = [meshRef.current];
            
            // Perform raycast with debug logging
            cameraRaycast(targetObjects, raycasterRef.current, camera);
        }
    });

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

// Function to perform camera raycasting with debug logging
function cameraRaycast(targetObjects: THREE.Object3D[], raycaster: THREE.Raycaster, camera: THREE.Camera) {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    // Set raycaster from camera position in the direction it's facing
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    // Perform the raycast
    const intersects = raycaster.intersectObjects(targetObjects, true);
    
    return intersects;
}

const Viewer = ({ texturePath, sceneId, children }: { 
    texturePath: string, 
    sceneId?: string,
    children: React.ReactNode 
}) => {
    return (
        <Canvas camera={{ position: [0, 0, 2], fov: 90, zoom: 3 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[1, 1, 1]} intensity={1} />
            <OrbitControls />
            <Scene currentTexturePath={texturePath} sceneId={sceneId} />
            {children}
        </Canvas>
    );
};

export default Viewer;