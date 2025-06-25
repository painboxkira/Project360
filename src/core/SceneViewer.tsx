import { useEffect, useState } from 'react';
import Viewer, { preloadAllTextures } from './Viewer';
import { Loading } from './loading';
import { dataManager } from './DataManager';
import type { ProcessedScene } from './processors/SceneProcessor';
import InfoHotspot from '../hotspots/InfoHotspot';
import LinkHotspot from '../hotspots/LinkHotspot';
import IntroHotspot from '../hotspots/IntroHotspot';
import QCUhotspot from '../hotspots/QCUhotspot';
import Layout from '../hotspots/ActiveAi/Rapport/Layout';

const SceneViewer = ({ jsonPath }: { jsonPath: string }) => {
    const [currentScene, setCurrentScene] = useState<ProcessedScene | null>(null);
    const [sceneIds, setSceneIds] = useState<string[]>([]);
    const [isPreloading, setIsPreloading] = useState(true);
    const [introCompleted, setIntroCompleted] = useState(false);
    const [completedHotspots, setCompletedHotspots] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsPreloading(true);
                
                await dataManager.loadSceneData(jsonPath);
                const scene = dataManager.getCurrentScene();
                const ids = dataManager.getSceneIds();
                const allScenes = dataManager.getAllScenes();
                
                setCurrentScene(scene);
                setSceneIds(ids);

                if (allScenes.length > 0) {
                    const texturePaths = allScenes.map((s: ProcessedScene) => s.panoramaUrl);
                    await preloadAllTextures(texturePaths);
                }
                
                setIsPreloading(false);
            } catch (error) {
                console.error('Failed to load scene data:', error);
                setIsPreloading(false);
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        const unsubscribe = dataManager.subscribe((state) => {
            setCurrentScene(state.currentScene);
            // Reset intro completion and completed hotspots when scene changes
            setIntroCompleted(false);
            setCompletedHotspots(new Set());
        });

        return unsubscribe;
    }, []);

    const handleSceneSwitch = (sceneId: string) => {
        const success = dataManager.switchToScene(sceneId);
        
        if (!success) {
            console.error('Failed to switch to scene:', sceneId);
        }
    };

    const handleHotspotComplete = (hotspotId: string) => {
        console.log(`Hotspot completed: ${hotspotId}`);
        setCompletedHotspots(prev => {
            const newSet = new Set([...prev, hotspotId]);
            console.log('Completed hotspots:', Array.from(newSet));
            return newSet;
        });
    };

    const handleIntroComplete = () => {
        console.log('Intro completed');
        setIntroCompleted(true);
    };

    // Check if there are intro hotspots in the current scene
    const hasIntroHotspots = currentScene?.hotspots?.some((h: any) => h.type === 'intro') || false;
    
    // Determine if other hotspots should be hidden
    const shouldHideOtherHotspots = hasIntroHotspots && !introCompleted;

    // Get all info and QCU hotspots that need to be completed
    const requiredHotspots = currentScene?.hotspots?.filter((h: any) => 
        (h.type === 'info' || (h.type === 'question' && h.subtype === 'qcu'))
    ) || [];

    // Check if all required hotspots are completed
    const allRequiredHotspotsCompleted = requiredHotspots.length > 0 && 
        requiredHotspots.every((h: any) => completedHotspots.has(h.id));

    // Check if Layout should be visible
    const shouldShowLayout = !shouldHideOtherHotspots && allRequiredHotspotsCompleted;

    // Get the ActivAI slug from the scene
    const activAISlug = currentScene?.hotspots?.find((h: any) => h.type === 'activai')?.slug;

    console.log('Scene state:', {
        hasIntroHotspots,
        introCompleted,
        shouldHideOtherHotspots,
        requiredHotspots: requiredHotspots.map(h => h.id),
        completedHotspots: Array.from(completedHotspots),
        allRequiredHotspotsCompleted,
        shouldShowLayout,
        activAISlug
    });

    return (
        <div style={{width: '100vw', height: '100vh', position: 'relative'}}>
            {currentScene && currentScene.panoramaUrl ? (
                <Viewer 
                    texturePath={currentScene.panoramaUrl} 
                    sceneId={currentScene.id}
                    disableControls={shouldShowLayout}
                >
                    {currentScene?.hotspots?.map((hotspot: any) => {
                        if (hotspot.type === 'intro') {
                            return (
                                <IntroHotspot 
                                    key={hotspot.id}
                                    texturePath={hotspot.texturePath}
                                    position={hotspot.position}
                                    onComplete={handleIntroComplete}
                                />
                            );
                        }
                        
                        if (hotspot.type === 'question' && hotspot.subtype === 'qcu' && !shouldHideOtherHotspots) {
                            return (
                                <QCUhotspot
                                    key={hotspot.id}
                                    texturePath={hotspot.texturePath}
                                    position={hotspot.position}
                                    onComplete={() => handleHotspotComplete(hotspot.id)}
                                    choices={hotspot.choices}
                                />
                            );
                        }
                        
                        if (hotspot.type === 'info' && !shouldHideOtherHotspots) {
                            return (
                                <InfoHotspot 
                                    key={hotspot.id}
                                    texturePath={hotspot.texturePath}
                                    position={hotspot.position} 
                                    onComplete={() => handleHotspotComplete(hotspot.id)}
                                />
                            );
                        }
                        
                        if (hotspot.type === 'link' && !shouldHideOtherHotspots) {
                            return (
                                <LinkHotspot 
                                    key={hotspot.id} 
                                    texturePath={hotspot.imagePath} 
                                    position={hotspot.position} 
                                    onClickBehaviour={() => {
                                        handleSceneSwitch(hotspot.targetScene);
                                    }} 
                                />
                            );
                        }
                        
                        return null;
                    })}

                    {/* Render Layout as camera overlay when conditions are met */}
                    {shouldShowLayout && activAISlug && (
                        <Layout 
                            slug={activAISlug}
                            position={[0, 0, -2]}
                            fullscreen
                            center
                        />
                    )}
                </Viewer>
            ) : null}
            
            {isPreloading && <Loading />}
        </div>
    );
};

export default SceneViewer;