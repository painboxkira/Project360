import { useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { textureManager } from './TextureManager';
import { useTexture } from './hooks/useTexture';

// Legacy exports for backward compatibility
export const preloadAllTextures = async (texturePaths: string[]): Promise<void> => {
    // This is now handled by TextureManager.preloadAllSceneTextures
    console.warn('preloadAllTextures is deprecated. Use textureManager.preloadAllSceneTextures instead.');
};

export const clearTextureCache = () => {
    textureManager.clearCache();
};

const Scene = ({ currentTexturePath }: { currentTexturePath: string }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [material, setMaterial] = useState<THREE.MeshBasicMaterial | null>(null);
    const { camera } = useThree();
    
    // Use the cached texture from TextureManager
    const texture = useTexture(currentTexturePath);

    useFrame(() => {
        if (meshRef.current) {
            camera.lookAt(meshRef.current.position);
        }
    });

    useEffect(() => {
        if (!currentTexturePath?.trim()) return;

        if (texture) {
            const newMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.BackSide,
                transparent: false,
                depthWrite: false
            });
            
            setMaterial(newMaterial);
        } else {
            // Fallback material if texture is not loaded
            const fallbackMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                side: THREE.BackSide,
                transparent: false,
                depthWrite: false
            });
            setMaterial(fallbackMaterial);
        }
    }, [currentTexturePath, texture]);

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
            {!disableControls && <OrbitControls ref={orbitControlsRef}  enableZoom={false}/>}
            <Scene currentTexturePath={texturePath} />
            <LightingSystem />
            {children}
        </Canvas>
    );
};

export default Viewer;