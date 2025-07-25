import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Viewer from './Viewer';
import LoadingScreen from './LoadingScreen';
import { dataManager } from './DataManager';
import type { ProcessedScene } from './processors/SceneProcessor';
import InfoHotspot from '../hotspots/InfoHotspot';
import { textureManager } from './TextureManager';
import LinkHotspot from '../hotspots/LinkHotspot';
import IntroHotspot from '../hotspots/IntroHotspot';
import QCUhotspot from '../hotspots/QCUhotspot';
import QCMhotspot from '../hotspots/QCMhotspot';
import StaticImg from '../hotspots/StaticImg';
import DragAndDropActivity from '../hotspots/DragandDrop';
import AudioManager from './AudioManager';
import AudioControls from './AudioControls';

// SmoothCameraRotation component (no changes)
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
                    controls.enabled = true;
                }
            };
            
            animationRef.current = requestAnimationFrame(animate);
        }
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                if (orbitControlsRef.current) {
                    orbitControlsRef.current.enabled = true;
                }
            }
        };
    }, [isActive, targetPosition, orbitControlsRef]);

    return null;
};

// Camera-facing wrapper (no changes)
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

// Wrapper components with lookat behavior (no changes)
const InfoHotspotWithLookat = ({ 
    texturePath, 
    position, 
    onActivate,
    isActive,
    onSetActive,
    onSetInactive,
    onComplete
}: {
    texturePath: string[];
    position: [number, number, number];
    onActivate: () => void;
    isActive: boolean;
    onSetActive: () => void;
    onSetInactive: () => void;
    onComplete: () => void;
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
                onActivate={onActivate}
                isActive={isActive}
                onSetActive={onSetActive}
                onSetInactive={onSetInactive}
                onComplete={onComplete}
            />
        </group>
    );
};

const QCUHotspotWithLookat = ({ 
    texturePath, 
    position, 
    onActivate,
    isActive,
    onSetActive,
    onSetInactive,
    choices,
    onComplete
}: {
    texturePath: string[];
    position: [number, number, number];
    onActivate: () => void;
    isActive: boolean;
    onSetActive: () => void;
    onSetInactive: () => void;
    choices: any[];
    onComplete: () => void;
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
                choices={choices}
                onActivate={onActivate}
                isActive={isActive}
                onSetActive={onSetActive}
                onSetInactive={onSetInactive}
                onComplete={onComplete}
            />
        </group>
    );
};

const QCMHotspotWithLookat = ({ 
    texturePath, 
    position, 
    onActivate,
    isActive,
    onSetActive,
    onSetInactive,
    choices,
    questionTexture,
    submitTexture,
    onComplete
}: {
    texturePath: string[];
    position: [number, number, number];
    onActivate: () => void;
    isActive: boolean;
    onSetActive: () => void;
    onSetInactive: () => void;
    choices: any[];
    questionTexture?: string;
    submitTexture?: string;
    onComplete: () => void;
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
            <QCMhotspot
                texturePath={texturePath}
                position={[0, 0, 0]}
                choices={choices}
                onActivate={onActivate}
                isActive={isActive}
                onSetActive={onSetActive}
                onSetInactive={onSetInactive}
                questionTexture={questionTexture}
                submitTexture={submitTexture}
                onComplete={onComplete}
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


// MODIFIED: Updated prop definitions
const SceneViewer = ({ jsonPath, onOrderUpdate, initialState }: { 
    jsonPath: string;
    onOrderUpdate?: (updates: { 
        order: number; 
        completed: Set<string>; 
        visited: Set<string>; 
        totalRequired: number 
    }) => void;
    initialState?: {
        currentOrder: number;
        completedHotspots: Set<string>;
        visitedHotspots: Set<string>; // ADDED
        currentSceneId?: string;
    } | null;
}) => {
    const [sceneState, setSceneState] = useState({
        currentScene: null as ProcessedScene | null,
        isPreloading: true,
        visitedHotspots: new Set<string>(), // ADDED: Tracks visited hotspots
        completedHotspots: new Set<string>(), // Tracks progression
        activeHotspotId: null as string | null,
        activeHotspotPosition: null as [number, number, number] | null,
        activeUIHotspotId: null as string | null,
        currentOrder: 0
    });
    
    const orbitControlsRef = useRef<any>(null);

    // MODIFIED: Initialize state from initialState prop, now including visitedHotspots
    useEffect(() => {
        if (initialState) {
            console.log('SceneViewer: Restoring initial state:', initialState);
            setSceneState(prev => ({
                ...prev,
                currentOrder: initialState.currentOrder,
                completedHotspots: new Set(initialState.completedHotspots),
                visitedHotspots: new Set(initialState.visitedHotspots || []) // ADDED
            }));
        }
    }, [initialState]);

    // Get all ordered hotspots across all scenes (no changes)
    const allOrderedHotspots = useMemo(() => {
        if (!sceneState.currentScene) return [];
        
        const allScenes = dataManager.getAllScenes();
        const allHotspots = allScenes.flatMap(scene => 
            scene.hotspots?.map((hotspot: any) => ({
                ...hotspot,
                sceneId: scene.id
            })) || []
        );

        return allHotspots
            .filter((h: any) => h.order !== undefined && h.order !== -1)
            .sort((a: any, b: any) => a.order - b.order);
    }, [sceneState.currentScene]);

    // Get all required hotspots across all scenes (no changes)
    const allRequiredHotspots = useMemo(() => {
        if (!sceneState.currentScene) return [];
        
        const allScenes = dataManager.getAllScenes();
        const allHotspots = allScenes.flatMap(scene => 
            scene.hotspots?.map((hotspot: any) => ({
                ...hotspot,
                sceneId: scene.id
            })) || []
        );

        return allHotspots.filter((hotspot: any) => 
            hotspot.required === true || 
            (hotspot.type === 'question' && (hotspot.subtype === 'qcu' || hotspot.subtype === 'qcm'))
        );
    }, [sceneState.currentScene]);

    // Get hotspots for current order in current scene (no changes)
    const currentOrderHotspots = useMemo(() => {
        if (!sceneState.currentScene) return [];
        
        return sceneState.currentScene.hotspots?.filter((hotspot: any) => 
            hotspot.order === sceneState.currentOrder
        ) || [];
    }, [sceneState.currentScene, sceneState.currentOrder]);

    // Get visible hotspots for current scene (no changes)
    const visibleHotspots = useMemo(() => {
        if (!sceneState.currentScene) return [];

        return sceneState.currentScene.hotspots?.filter((hotspot: any) => {
            if (hotspot.order === undefined || hotspot.order === -1) return true;
            
            if (
                hotspot.type === 'info' || 
                (hotspot.type === 'question' && (hotspot.subtype === 'qcu' || hotspot.subtype === 'qcm'))
            ) {
                return hotspot.order <= sceneState.currentOrder;
            }
            
            return hotspot.order === sceneState.currentOrder;
        }) || [];
    }, [sceneState.currentScene, sceneState.currentOrder]);

    // Check if all required hotspots of current order are completed (no changes)
    const allRequiredCompleted = useMemo(() => {
        const requiredHotspots = currentOrderHotspots.filter((hotspot: any) => 
            hotspot.required === true || 
            (hotspot.type === 'question' && (hotspot.subtype === 'qcu' || hotspot.subtype === 'qcm'))
        );
        
        return requiredHotspots.length === 0 || 
               requiredHotspots.every((hotspot: any) => sceneState.completedHotspots.has(hotspot.id));
    }, [currentOrderHotspots, sceneState.completedHotspots]);

    // Calculate completion percentage (no changes)
    const completionPercentage = useMemo(() => {
        const completedRequired = allRequiredHotspots.filter((hotspot: any) => 
            sceneState.completedHotspots.has(hotspot.id)
        ).length;
        
        return allRequiredHotspots.length > 0 ? 
            Math.round((completedRequired / allRequiredHotspots.length) * 100) : 0;
    }, [allRequiredHotspots, sceneState.completedHotspots]);

    // Get only completed required hotspots for progress calculation (no changes)
    const completedRequiredHotspots = useMemo(() => {
        return allRequiredHotspots.filter((hotspot: any) => 
            sceneState.completedHotspots.has(hotspot.id)
        );
    }, [allRequiredHotspots, sceneState.completedHotspots]);

    // MODIFIED: Notify parent component of all state updates
    useEffect(() => {
        if (onOrderUpdate) {
            const completedRequiredIds = new Set(completedRequiredHotspots.map(h => h.id));
            onOrderUpdate({
                order: sceneState.currentOrder,
                completed: completedRequiredIds,
                visited: sceneState.visitedHotspots,
                totalRequired: allRequiredHotspots.length
            });
        }
    }, [
        sceneState.currentOrder, 
        completedRequiredHotspots.length, 
        allRequiredHotspots.length, 
        onOrderUpdate, 
        sceneState.visitedHotspots // ADDED dependency
    ]);

    // Auto-advance order when all required hotspots are completed (no changes)
    useEffect(() => {
        if (initialState && sceneState.currentOrder === initialState.currentOrder && 
            sceneState.completedHotspots.size === initialState.completedHotspots.size) {
            return;
        }

        if (allRequiredCompleted && currentOrderHotspots.length > 0) {
            const nextOrder = sceneState.currentOrder + 1;
            const hasNextOrder = allOrderedHotspots.some((h: any) => h.order === nextOrder);
            
            if (hasNextOrder) {
                setSceneState(prev => ({
                    ...prev,
                    currentOrder: nextOrder
                }));
            }
        }
    }, [allRequiredCompleted, currentOrderHotspots, sceneState.currentOrder, allOrderedHotspots, initialState, sceneState.completedHotspots.size]);

    // Additional check for order advance (no changes)
    useEffect(() => {
        if (initialState && sceneState.currentOrder === initialState.currentOrder && 
            sceneState.completedHotspots.size === initialState.completedHotspots.size) {
            return;
        }

        if (sceneState.currentScene && currentOrderHotspots.length === 0) {
            const nextOrder = sceneState.currentOrder + 1;
            const hasNextOrder = allOrderedHotspots.some((h: any) => h.order === nextOrder);
            
            if (hasNextOrder) {
                setSceneState(prev => ({
                    ...prev,
                    currentOrder: nextOrder
                }));
            }
        }
    }, [sceneState.currentScene, currentOrderHotspots.length, sceneState.currentOrder, allOrderedHotspots, initialState, sceneState.completedHotspots.size]);

    // Debug logging (no changes)
    useEffect(() => {
        console.log(`Current Order: ${sceneState.currentOrder}`);
        console.log(`All visited hotspots: ${Array.from(sceneState.visitedHotspots).join(', ')}`);
        console.log(`All completed hotspots: ${Array.from(sceneState.completedHotspots).join(', ')}`);
        console.log(`Completion percentage: ${completionPercentage}%`);
    }, [sceneState.currentOrder, sceneState.completedHotspots, sceneState.visitedHotspots, completionPercentage]);

    // Data loading and scene switching logic (no changes)
    useEffect(() => {
        const loadData = async () => {
            try {
                setSceneState(prev => ({ ...prev, isPreloading: true }));
                
                await dataManager.loadSceneData(jsonPath);
                const scene = dataManager.getCurrentScene();
                const allScenes = dataManager.getAllScenes();
                
                if (initialState?.currentSceneId && initialState.currentSceneId !== scene?.id) {
                    console.log(`SceneViewer: Switching to saved scene during load: ${initialState.currentSceneId}`);
                    const switchSuccess = dataManager.switchToScene(initialState.currentSceneId);
                    if (switchSuccess) {
                        const restoredScene = dataManager.getCurrentScene();
                        setSceneState(prev => ({ 
                            ...prev,
                            currentScene: restoredScene,
                        }));
                    } else {
                        console.error(`Failed to switch to saved scene: ${initialState.currentSceneId}`);
                        setSceneState(prev => ({ 
                            ...prev,
                            currentScene: scene,
                        }));
                    }
                } else {
                    setSceneState(prev => ({ 
                        ...prev,
                        currentScene: scene,
                    }));
                }

                if (allScenes.length > 0) {
                    await textureManager.preloadAllSceneTextures(allScenes);
                }
                
                setSceneState(prev => ({ ...prev, isPreloading: false }));
            } catch (error) {
                console.error('Failed to load scene data:', error);
                setSceneState(prev => ({ ...prev, isPreloading: false }));
            }
        };

        loadData();
    }, [jsonPath, initialState?.currentSceneId]);

    useEffect(() => {
        const unsubscribe = dataManager.subscribe((state) => {
            setSceneState(prev => {
                return {
                    ...prev,
                    currentScene: state.currentScene,
                    activeHotspotId: null,
                    activeHotspotPosition: null,
                    activeUIHotspotId: null
                };
            });
        });

        return unsubscribe;
    }, []);

    const handleSceneSwitch = useCallback((sceneId: string) => {
        const success = dataManager.switchToScene(sceneId);
        if (!success) {
            console.error('Failed to switch to scene:', sceneId);
        }
    }, []);
    
    // ADDED: Central function to mark a hotspot as visited
    const markAsVisited = useCallback((hotspotId: string) => {
        setSceneState(prev => {
            if (prev.visitedHotspots.has(hotspotId)) {
                return prev; // No state change if already visited
            }
            const newVisitedHotspots = new Set(prev.visitedHotspots);
            newVisitedHotspots.add(hotspotId);
            console.log(`Hotspot Visited: ${hotspotId}`);
            return { ...prev, visitedHotspots: newVisitedHotspots };
        });
    }, []);

    // MODIFIED: handleLinkClick now also marks as visited
    const handleLinkClick = useCallback((sceneId: string, hotspotId: string) => {
        console.log(`Link hotspot clicked: ${hotspotId}, switching to scene: ${sceneId}`);
        
        markAsVisited(hotspotId); // Mark as visited
        
        setSceneState(prev => ({
            ...prev,
            completedHotspots: new Set([...prev.completedHotspots, hotspotId])
        }));
        
        setSceneState(prev => {
            console.log(`Advancing order from ${prev.currentOrder} to ${prev.currentOrder + 1}`);
            return {
                ...prev,
                currentOrder: prev.currentOrder + 1
            };
        });
        
        handleSceneSwitch(sceneId);
    }, [handleSceneSwitch, markAsVisited]);

    // MODIFIED: handleHotspotActivate now also marks as visited
    const handleHotspotActivate = useCallback((hotspotId: string, position: [number, number, number]) => {
        markAsVisited(hotspotId); // Mark as visited on interaction
        if (sceneState.activeHotspotId === hotspotId) {
            setSceneState(prev => ({ ...prev, activeHotspotId: null, activeHotspotPosition: null }));
        } else {
            setSceneState(prev => ({ ...prev, activeHotspotId: hotspotId, activeHotspotPosition: position }));
        }
    }, [sceneState.activeHotspotId, markAsVisited]);
    
    // MODIFIED: handleHotspotUIActivate now also marks as visited
    const handleHotspotUIActivate = useCallback((hotspotId: string) => {
        markAsVisited(hotspotId); // Mark as visited when UI is shown
        setSceneState(prev => ({ ...prev, activeUIHotspotId: hotspotId }));
    }, [markAsVisited]);

    const handleHotspotUIDeactivate = useCallback(() => {
        setSceneState(prev => ({ ...prev, activeUIHotspotId: null }));
    }, []);
    
    const handleScenarioEnd = useCallback(() => {
        console.log('Scenario ended - user clicked Quitter');
    }, []);

    // MODIFIED: handleHotspotComplete now also ensures hotspot is marked as visited
    const handleHotspotComplete = useCallback((hotspotId: string) => {
        console.log(`Hotspot completed: ${hotspotId}`);
        markAsVisited(hotspotId); // Ensure it's marked as visited upon completion
        
        setSceneState(prev => {
            const newCompletedHotspots = new Set(prev.completedHotspots);
            newCompletedHotspots.add(hotspotId);
            console.log(`Updated completed hotspots: ${Array.from(newCompletedHotspots).join(', ')}`);

            return {
                ...prev,
                completedHotspots: newCompletedHotspots
            };
        });
    }, [allOrderedHotspots, markAsVisited]);

    if (!sceneState.currentScene || !sceneState.currentScene.panoramaUrl) {
        return (
            <div style={{width: '100vw', height: '100vh', position: 'relative'}}>
                <LoadingScreen 
                    isVisible={sceneState.isPreloading}
                    onComplete={() => setSceneState(prev => ({ ...prev, isPreloading: false }))}
                />
            </div>
        );
    }
    
    // Rendering logic remains largely the same, passing the modified handlers
    return (
        <div style={{width: '100vw', height: '100vh', position: 'relative'}}>
            {/* Components using state (no changes) */}
            <AudioManager 
                audioConfig={sceneState.currentScene.audio || null}
                completedHotspots={sceneState.completedHotspots}
            />
            
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

                {visibleHotspots.map((hotspot: any) => {
                    if (hotspot.type === 'intro') {
                        return (
                            <CameraFacingHotspot 
                                key={hotspot.id}
                                scale={[hotspot.size || 1, hotspot.size || 1, hotspot.size || 1]}
                            >
                                <IntroHotspot 
                                    texturePath={hotspot.texturePath}
                                    position={[0, 0, 0]}
                                    onComplete={() => handleHotspotComplete(hotspot.id)}
                                />
                            </CameraFacingHotspot>
                        );
                    }
                    
                    if (hotspot.type === 'question' && hotspot.subtype === 'qcu') {
                        return (
                            <QCUHotspotWithLookat
                                key={hotspot.id}
                                texturePath={hotspot.texturePath}
                                position={hotspot.position}
                                onActivate={() => handleHotspotActivate(hotspot.id, hotspot.position)}
                                isActive={sceneState.activeUIHotspotId === hotspot.id}
                                onSetActive={() => handleHotspotUIActivate(hotspot.id)}
                                onSetInactive={handleHotspotUIDeactivate}
                                choices={hotspot.choices}
                                onComplete={() => handleHotspotComplete(hotspot.id)}
                            />
                        );
                    }
                    
                    if (hotspot.type === 'question' && hotspot.subtype === 'qcm') {
                        return (
                            <QCMHotspotWithLookat
                                key={hotspot.id}
                                texturePath={hotspot.texturePath}
                                position={hotspot.position}
                                onActivate={() => handleHotspotActivate(hotspot.id, hotspot.position)}
                                isActive={sceneState.activeUIHotspotId === hotspot.id}
                                onSetActive={() => handleHotspotUIActivate(hotspot.id)}
                                onSetInactive={handleHotspotUIDeactivate}
                                choices={hotspot.choices}
                                questionTexture={hotspot.questionTexture}
                                submitTexture={hotspot.submitTexture}
                                onComplete={() => handleHotspotComplete(hotspot.id)}
                            />
                        );
                    }
                    
                    if (hotspot.type === 'info') {
                        return (
                            <InfoHotspotWithLookat 
                                key={hotspot.id}
                                texturePath={hotspot.texturePath}
                                position={hotspot.position} 
                                onActivate={() => handleHotspotActivate(hotspot.id, hotspot.position)}
                                isActive={sceneState.activeUIHotspotId === hotspot.id}
                                onSetActive={() => handleHotspotUIActivate(hotspot.id)}
                                onSetInactive={handleHotspotUIDeactivate}
                                onComplete={() => handleHotspotComplete(hotspot.id)}
                            />
                        );
                    }
                    
                    if (hotspot.type === 'link') {
                        return (
                            <LinkHotspotWithLookat 
                                key={hotspot.id} 
                                texturePath={hotspot.imagePath} 
                                position={hotspot.position} 
                                onClickBehaviour={() => handleLinkClick(hotspot.targetScene, hotspot.id)}
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
                    if (hotspot.type === 'draganddrop') {
                        return (
                            <DragAndDropActivity
                                key={hotspot.id}
                                items={hotspot.items}
                                targets={hotspot.targets}
                                matchingPairs={hotspot.matchingPairs}
                                instructionTexture={hotspot.instructionTexture}
                                successTexture={hotspot.successTexture}
                                instructionPosition={hotspot.instructionPosition}
                                successPosition={hotspot.successPosition}
                                lightConfig={hotspot.lightConfig}
                            />
                        );
                    }


                    return null;
                })}
            </Viewer>
            
            <LoadingScreen 
                isVisible={sceneState.isPreloading}
                onComplete={() => setSceneState(prev => ({ ...prev, isPreloading: false }))}
            />
        </div>
    );
};

export default SceneViewer;
