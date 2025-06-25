import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Viewer, { preloadAllTextures } from './Viewer';
import { Loading } from './loading';
import { dataManager } from './DataManager';
import type { ProcessedScene } from './processors/SceneProcessor';
import InfoHotspot, { preloadHotspotTextures } from '../hotspots/InfoHotspot';
import LinkHotspot from '../hotspots/LinkHotspot';
import IntroHotspot from '../hotspots/IntroHotspot';
import QCUhotspot from '../hotspots/QCUhotspot';
import StaticImg from '../hotspots/StaticImg';
import AudioManager from './AudioManager';
import AudioControls from './AudioControls';

import Layout from '../hotspots/ActiveAi/Rapport/Layout';

// Smooth camera rotation component
const SmoothCameraRotation = ({ targetPosition, isActive, orbitControlsRef }: {
    targetPosition: [number, number, number] | null;
    isActive: boolean;
    orbitControlsRef: React.RefObject<any>;
}) => {
    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef(0);
    const startPositionRef = useRef<THREE.Vector3 | null>(null);

    useEffect(() => {
        if (isActive && targetPosition && orbitControlsRef.current) {
            const controls = orbitControlsRef.current;
            
            startTimeRef.current = Date.now();
            startPositionRef.current = controls.object.position.clone();
            
            const targetVector = new THREE.Vector3(...targetPosition);
            const targetSpherical = new THREE.Spherical();
            targetSpherical.setFromVector3(targetVector);
            
            const targetCameraPosition = new THREE.Vector3();
            targetCameraPosition.setFromSphericalCoords(
                controls.getDistance(),
                Math.PI - targetSpherical.phi,
                targetSpherical.theta - Math.PI
            );
            targetCameraPosition.add(controls.target);
            
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            
            // Disable orbit controls during animation
            controls.enabled = false;
            
            const animate = () => {
                const elapsed = Date.now() - startTimeRef.current;
                const duration = 1000;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                
                controls.object.position.lerpVectors(
                    startPositionRef.current!,
                    targetCameraPosition,
                    easedProgress
                );
                
                controls.object.lookAt(controls.target);
                controls.update();
                
                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(animate);
                } else {
                    animationRef.current = null;
                    // Re-enable orbit controls after animation completes
                    controls.enabled = true;
                }
            };
            
            animationRef.current = requestAnimationFrame(animate);
        }
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                // Re-enable orbit controls if animation is cancelled
                if (orbitControlsRef.current) {
                    orbitControlsRef.current.enabled = true;
                }
            }
        };
    }, [isActive, targetPosition, orbitControlsRef]);

    return null;
};

// Camera-facing wrapper for intro and ActivAI hotspots
const CameraFacingHotspot = ({ children, scale = [1, 1, 1] }: {
    children: React.ReactNode;
    scale?: [number, number, number];
}) => {
    const { camera } = useThree();
    const groupRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (groupRef.current && camera) {
            const distance = 2.5;
            const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            const targetPosition = camera.position.clone().add(cameraDirection.multiplyScalar(distance));
            groupRef.current.position.copy(targetPosition);
            groupRef.current.lookAt(camera.position);
        }
    });

    return (
        <group ref={groupRef} scale={scale}>
            {children}
        </group>
    );
};

// Wrapper components that add lookat behavior
const InfoHotspotWithLookat = ({ 
    texturePath, 
    position, 
    onComplete, 
    onActivate,
    isActive,
    onSetActive,
    onSetInactive
}: {
    texturePath: string[];
    position: [number, number, number];
    onComplete: () => void;
    onActivate: () => void;
    isActive: boolean;
    onSetActive: () => void;
    onSetInactive: () => void;
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const { camera } = useThree();

    useFrame(() => {
        if (groupRef.current && camera) {
            groupRef.current.lookAt(camera.position);
        }
    });

    return (
        <group ref={groupRef} position={position}>
            <InfoHotspot 
                texturePath={texturePath}
                position={[0, 0, 0]} 
                onComplete={onComplete}
                onActivate={onActivate}
                isActive={isActive}
                onSetActive={onSetActive}
                onSetInactive={onSetInactive}
            />
        </group>
    );
};

const QCUHotspotWithLookat = ({ 
    texturePath, 
    position, 
    onComplete, 
    onActivate,
    isActive,
    onSetActive,
    onSetInactive,
    choices
}: {
    texturePath: string[];
    position: [number, number, number];
    onComplete: () => void;
    onActivate: () => void;
    isActive: boolean;
    onSetActive: () => void;
    onSetInactive: () => void;
    choices: any[];
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const { camera } = useThree();

    useFrame(() => {
        if (groupRef.current && camera) {
            groupRef.current.lookAt(camera.position);
        }
    });

    return (
        <group ref={groupRef} position={position}>
            <QCUhotspot
                texturePath={texturePath}
                position={[0, 0, 0]}
                onComplete={onComplete}
                choices={choices}
                onActivate={onActivate}
                isActive={isActive}
                onSetActive={onSetActive}
                onSetInactive={onSetInactive}
            />
        </group>
    );
};

const LinkHotspotWithLookat = ({ 
    texturePath, 
    position, 
    onClickBehaviour, 
    onActivate 
}: {
    texturePath: string;
    position: [number, number, number];
    onClickBehaviour: () => void;
    onActivate: () => void;
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const { camera } = useThree();

    useFrame(() => {
        if (groupRef.current && camera) {
            groupRef.current.lookAt(camera.position);
        }
    });

    const handleClick = useCallback((event: any) => {
        event.stopPropagation();
        onActivate();
        onClickBehaviour();
    }, [onActivate, onClickBehaviour]);

    return (
        <group ref={groupRef} position={position} onClick={handleClick}>
            <LinkHotspot 
                texturePath={texturePath}
                position={[0, 0, 0]} 
                onClickBehaviour={() => {}}
            />
        </group>
    );
};

const ActivAIHotspotWithLookat = ({ 
    position, 
    slug,
    isVisible
}: {
    position: [number, number, number];
    slug: string;
    isVisible: boolean;
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const { camera } = useThree();

    useFrame(() => {
        if (groupRef.current && camera) {
            groupRef.current.lookAt(camera.position);
        }
    });

    return (
        <group ref={groupRef} position={position}>
            <Layout 
                slug={slug}
                position={[0, 0, 0]}
                isVisible={isVisible}
            />
        </group>
    );
};

const SceneViewer = ({ jsonPath }: { jsonPath: string }) => {
    // Consolidated state
    const [sceneState, setSceneState] = useState({
        currentScene: null as ProcessedScene | null,
        isPreloading: true,
        introCompleted: false,
        completedHotspots: new Set<string>(),
        activeHotspotId: null as string | null,
        activeHotspotPosition: null as [number, number, number] | null,
        activeUIHotspotId: null as string | null,
        layoutTimeoutActive: false
    });
    
    const orbitControlsRef = useRef<any>(null);
    const layoutTimeoutRef = useRef<number | null>(null);

    // State update helpers
    const updateSceneState = useCallback((updates: Partial<typeof sceneState>) => {
        setSceneState(prev => ({ ...prev, ...updates }));
    }, []);

    // Memoized computed values
    const computedState = useMemo(() => {
        if (!sceneState.currentScene) return null;

        const hasIntroHotspots = sceneState.currentScene.hotspots?.some((h: any) => h.type === 'intro') || false;
        const shouldHideOtherHotspots = hasIntroHotspots && !sceneState.introCompleted;
        
        const requiredHotspots = sceneState.currentScene.hotspots?.filter((h: any) => 
            (h.type === 'info' || (h.type === 'question' && h.subtype === 'qcu'))
        ) || [];
        
        const completedRequiredHotspots = requiredHotspots.filter((h: any) => sceneState.completedHotspots.has(h.id));
        const allRequiredHotspotsCompleted = requiredHotspots.length === 0 || 
            requiredHotspots.every((h: any) => sceneState.completedHotspots.has(h.id));
        
        const shouldShowLayout = !shouldHideOtherHotspots && allRequiredHotspotsCompleted && sceneState.layoutTimeoutActive;
        const activAISlug = sceneState.currentScene.hotspots?.find((h: any) => h.type === 'activai')?.slug;

        // Proper debug log showing progress
        if (requiredHotspots.length > 0) {
            console.log(`Hotspots: ${completedRequiredHotspots.length}/${requiredHotspots.length} completed - ActivAI: ${shouldShowLayout ? 'SHOWING' : 'HIDDEN'} (Timeout: ${sceneState.layoutTimeoutActive})`);
        }

        return {
            hasIntroHotspots,
            shouldHideOtherHotspots,
            shouldShowLayout,
            activAISlug,
            allRequiredHotspotsCompleted
        };
    }, [sceneState.currentScene, sceneState.introCompleted, sceneState.completedHotspots, sceneState.layoutTimeoutActive]);

    // Effect to handle timeout when all hotspots are completed
    useEffect(() => {
        if (computedState?.allRequiredHotspotsCompleted && !sceneState.layoutTimeoutActive) {
            // Clear any existing timeout
            if (layoutTimeoutRef.current) {
                clearTimeout(layoutTimeoutRef.current);
            }
            
            // Set timeout to show layout after 2 seconds (2000ms)
            layoutTimeoutRef.current = setTimeout(() => {
                updateSceneState({ layoutTimeoutActive: true });
            }, 2000);
        }
        
        return () => {
            if (layoutTimeoutRef.current) {
                clearTimeout(layoutTimeoutRef.current);
            }
        };
    }, [computedState?.allRequiredHotspotsCompleted, sceneState.layoutTimeoutActive, updateSceneState]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (layoutTimeoutRef.current) {
                clearTimeout(layoutTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                updateSceneState({ isPreloading: true });
                
                await dataManager.loadSceneData(jsonPath);
                const scene = dataManager.getCurrentScene();
                const allScenes = dataManager.getAllScenes();
                
                updateSceneState({ currentScene: scene });

                if (allScenes.length > 0) {
                    const texturePaths = allScenes.map((s: ProcessedScene) => s.panoramaUrl);
                    await preloadAllTextures(texturePaths);
                }

                // Preload all hotspot textures for the current scene
                if (scene?.hotspots) {
                    const allHotspotTextures: string[] = [];
                    scene.hotspots.forEach((hotspot: any) => {
                        if (hotspot.texturePath && Array.isArray(hotspot.texturePath)) {
                            allHotspotTextures.push(...hotspot.texturePath.filter(Boolean));
                        }
                        // Also preload imagePath textures for image type hotspots
                        if (hotspot.type === 'image' && hotspot.imagePath) {
                            allHotspotTextures.push(hotspot.imagePath);
                        }
                    });
                    preloadHotspotTextures(allHotspotTextures);
                }
                
                updateSceneState({ isPreloading: false });
            } catch (error) {
                console.error('Failed to load scene data:', error);
                updateSceneState({ isPreloading: false });
            }
        };

        loadData();
    }, [jsonPath, updateSceneState]);

    useEffect(() => {
        const unsubscribe = dataManager.subscribe((state) => {
            // Clear any existing timeout when switching scenes
            if (layoutTimeoutRef.current) {
                clearTimeout(layoutTimeoutRef.current);
                layoutTimeoutRef.current = null;
            }
            
            updateSceneState({
                currentScene: state.currentScene,
                introCompleted: false,
                completedHotspots: new Set(),
                activeHotspotId: null,
                activeHotspotPosition: null,
                activeUIHotspotId: null,
                layoutTimeoutActive: false
            });
        });

        return unsubscribe;
    }, [updateSceneState]);

    const handleSceneSwitch = useCallback((sceneId: string) => {
        const success = dataManager.switchToScene(sceneId);
        if (!success) {
            console.error('Failed to switch to scene:', sceneId);
        }
    }, []);

    const handleHotspotActivate = useCallback((hotspotId: string, position: [number, number, number]) => {
        if (sceneState.activeHotspotId === hotspotId) {
            updateSceneState({ activeHotspotId: null, activeHotspotPosition: null });
        } else {
            updateSceneState({ activeHotspotId: hotspotId, activeHotspotPosition: position });
        }
    }, [sceneState.activeHotspotId, updateSceneState]);

    const handleHotspotUIActivate = useCallback((hotspotId: string) => {
        updateSceneState({ activeUIHotspotId: hotspotId });
    }, [updateSceneState]);

    const handleHotspotUIDeactivate = useCallback((hotspotId: string) => {
        updateSceneState({ activeUIHotspotId: null });
    }, [updateSceneState]);

    const handleHotspotComplete = useCallback((hotspotId: string) => {
        setSceneState(prev => ({
            ...prev,
            completedHotspots: new Set([...prev.completedHotspots, hotspotId])
        }));
    }, []);

    const handleIntroComplete = useCallback(() => {
        updateSceneState({
            introCompleted: true,
            activeHotspotId: null,
            activeHotspotPosition: null
        });
    }, [updateSceneState]);

    const handleScenarioEnd = useCallback(() => {
        console.log('Scenario ended - user clicked Quitter');
        // Handle scenario ending - you can add custom logic here
        // For example: redirect to another page, show completion message, etc.
    }, []);

    // Don't render anything until scene is loaded
    if (!sceneState.currentScene || !sceneState.currentScene.panoramaUrl) {
        return (
            <div style={{width: '100vw', height: '100vh', position: 'relative'}}>
                {sceneState.isPreloading && <Loading />}
            </div>
        );
    }

    return (
        <div style={{width: '100vw', height: '100vh', position: 'relative'}}>
            {/* Audio Manager for background audio */}
            <AudioManager 
                audioConfig={sceneState.currentScene.audio || null}
                completedHotspots={sceneState.completedHotspots}
            />
            
            {/* Audio Controls UI */}
            <AudioControls 
                audioConfig={sceneState.currentScene.audio || null}
                isVisible={false}
            />
            
            <Viewer 
                texturePath={sceneState.currentScene.panoramaUrl} 
                orbitControlsRef={orbitControlsRef}
            >
                <SmoothCameraRotation 
                    targetPosition={sceneState.activeHotspotPosition}
                    isActive={!!sceneState.activeHotspotId}
                    orbitControlsRef={orbitControlsRef}
                />

                {sceneState.currentScene.hotspots?.map((hotspot: any) => {
                    if (hotspot.type === 'intro' && computedState?.hasIntroHotspots) {
                        return (
                            <CameraFacingHotspot 
                                key={hotspot.id}
                                scale={[hotspot.size || 1, hotspot.size || 1, hotspot.size || 1]}
                            >
                                <IntroHotspot 
                                    texturePath={hotspot.texturePath}
                                    position={[0, 0, 0]}
                                    onComplete={handleIntroComplete}
                                />
                            </CameraFacingHotspot>
                        );
                    }
                    
                    if (hotspot.type === 'question' && hotspot.subtype === 'qcu' && !computedState?.shouldHideOtherHotspots) {
                        return (
                            <QCUHotspotWithLookat
                                key={hotspot.id}
                                texturePath={hotspot.texturePath}
                                position={hotspot.position}
                                onComplete={() => handleHotspotComplete(hotspot.id)}
                                onActivate={() => handleHotspotActivate(hotspot.id, hotspot.position)}
                                isActive={sceneState.activeUIHotspotId === hotspot.id}
                                onSetActive={() => handleHotspotUIActivate(hotspot.id)}
                                onSetInactive={() => handleHotspotUIDeactivate(hotspot.id)}
                                choices={hotspot.choices}
                            />
                        );
                    }
                    
                    if (hotspot.type === 'info' && !computedState?.shouldHideOtherHotspots) {
                        return (
                            <InfoHotspotWithLookat 
                                key={hotspot.id}
                                texturePath={hotspot.texturePath}
                                position={hotspot.position} 
                                onComplete={() => handleHotspotComplete(hotspot.id)}
                                onActivate={() => handleHotspotActivate(hotspot.id, hotspot.position)}
                                isActive={sceneState.activeUIHotspotId === hotspot.id}
                                onSetActive={() => handleHotspotUIActivate(hotspot.id)}
                                onSetInactive={() => handleHotspotUIDeactivate(hotspot.id)}
                            />
                        );
                    }
                    
                    if (hotspot.type === 'link' && !computedState?.shouldHideOtherHotspots) {
                        return (
                            <LinkHotspotWithLookat 
                                key={hotspot.id} 
                                texturePath={hotspot.imagePath} 
                                position={hotspot.position} 
                                onClickBehaviour={() => handleSceneSwitch(hotspot.targetScene)}
                                onActivate={() => handleHotspotActivate(hotspot.id, hotspot.position)}
                            />
                        );
                    }
                    
                    if (hotspot.type === 'image') {
                        return (
                            <StaticImg 
                                key={hotspot.id} 
                                imagePath={hotspot.imagePath} 
                                position={hotspot.position} 
                                width={hotspot.width}
                                height={hotspot.height}
                            />
                        );
                    }

                    return null;
                })}

                {computedState?.shouldShowLayout && computedState.activAISlug && (
                    <CameraFacingHotspot scale={[0.8, 0.8, 0.8]}>
                        <Layout 
                            slug={computedState.activAISlug}
                            position={[0, 0, 0]}
                            fullscreen
                            center
                            isVisible={true}
                            onQuit={handleScenarioEnd}
                        />
                    </CameraFacingHotspot>
                )}
            </Viewer>
            
            {sceneState.isPreloading && <Loading />}
        </div>
    );
};

export default SceneViewer;