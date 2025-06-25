import { useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Texture cache with improved memory management
const textureCache = new Map<string, THREE.Texture>();
const MAX_CACHE_SIZE = 15;

const cleanupTextureCache = () => {
    if (textureCache.size > MAX_CACHE_SIZE) {
        const entries = Array.from(textureCache.entries());
        const toRemove = entries.slice(0, textureCache.size - MAX_CACHE_SIZE);
        
        toRemove.forEach(([key, texture]) => {
            texture.dispose();
            textureCache.delete(key);
        });
    }
};

const preloadTexture = async (texturePath: string): Promise<THREE.Texture> => {
    if (!texturePath?.trim()) {
        throw new Error('Texture path cannot be empty');
    }
    
    if (textureCache.has(texturePath)) {
        return textureCache.get(texturePath)!;
    }

    const loader = new THREE.TextureLoader();
    return new Promise((resolve, reject) => {
        loader.load(
            texturePath,
            (texture) => {
                textureCache.set(texturePath, texture);
                cleanupTextureCache();
                resolve(texture);
            },
            undefined,
            (error: unknown) => {
                const errorMessage = error instanceof Error ? error.message : String(error);
                reject(new Error(`Failed to load texture: ${texturePath} - ${errorMessage}`));
            }
        );
    });
};

export const preloadAllTextures = async (texturePaths: string[]): Promise<void> => {
    const loadPromises = texturePaths.map(path => preloadTexture(path));
    await Promise.all(loadPromises);
};

export const clearTextureCache = () => {
    textureCache.forEach((texture) => texture.dispose());
    textureCache.clear();
};

const Scene = ({ currentTexturePath }: { currentTexturePath: string }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [material, setMaterial] = useState<THREE.MeshBasicMaterial | null>(null);
    const { camera } = useThree();

    useFrame(() => {
        if (meshRef.current) {
            camera.lookAt(meshRef.current.position);
        }
    });

    useEffect(() => {
        const updateTexture = async () => {
            if (!currentTexturePath?.trim()) return;

            try {
                const texture = textureCache.has(currentTexturePath) 
                    ? textureCache.get(currentTexturePath)! 
                    : await preloadTexture(currentTexturePath);
                
                const newMaterial = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.BackSide,
                    transparent: false,
                    depthWrite: false
                });
                
                setMaterial(newMaterial);
            } catch (error) {
                const fallbackMaterial = new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    side: THREE.BackSide,
                    transparent: false,
                    depthWrite: false
                });
                setMaterial(fallbackMaterial);
            }
        };

        updateTexture();
    }, [currentTexturePath]);

    useEffect(() => {
        return () => {
            if (material) {
                material.dispose();
            }
        };
    }, [material]);

    return (
        <mesh ref={meshRef} scale={[-1, 1, 1]} rotation={[0, 0, 0]} position={[0, 0, 0]}>
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

const LightingSystem = () => {
    return (
        <>
            <ambientLight intensity={0.6} color={0xffffff} />
            <directionalLight position={[5, 5, 5]} intensity={1.2} color={0xffffff} />
            <directionalLight position={[-3, 3, -3]} intensity={0.5} color={0xffffff} />
            <directionalLight position={[0, 0, -5]} intensity={1.0} color={0xffffff} />
            <directionalLight position={[0, 10, 0]} intensity={1.0} color={0xffffff} />
            <directionalLight position={[0, 0, 5]} intensity={0.8} color={0xffffff} />
            <hemisphereLight intensity={0.3} groundColor={0x404040} color={0xffffff} />
        </>
    );
};

const Viewer = ({ texturePath, children, disableControls = false, orbitControlsRef }: { 
    texturePath: string, 
    children: React.ReactNode,
    disableControls?: boolean,
    orbitControlsRef?: React.RefObject<any>
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
            {!disableControls && <OrbitControls ref={orbitControlsRef} />}
            <Scene currentTexturePath={texturePath} />
            <LightingSystem />
            {children}
        </Canvas>
    );
};

export default Viewer;