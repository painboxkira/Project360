import { useEffect, useState } from 'react';
import Viewer, { preloadAllTextures } from './Viewer';
import { Loading } from './loading';
import { dataManager } from './DataManager';
import type { ProcessedScene } from './processors/SceneProcessor';
import InfoHotspot from '../hotspots/InfoHotspot';
import LinkHotspot from '../hotspots/LinkHotspot';
import IntroHotspot from '../hotspots/IntroHotspot';

const SceneViewer = ({ jsonPath }: { jsonPath: string }) => {
    const [currentScene, setCurrentScene] = useState<ProcessedScene | null>(null);
    const [sceneIds, setSceneIds] = useState<string[]>([]);
    const [isPreloading, setIsPreloading] = useState(true);
    const [introCompleted, setIntroCompleted] = useState(false);

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
            // Reset intro completion when scene changes
            setIntroCompleted(false);
        });

        return unsubscribe;
    }, []);

    const handleSceneSwitch = (sceneId: string) => {
        const success = dataManager.switchToScene(sceneId);
        
        if (!success) {
            console.error('Failed to switch to scene:', sceneId);
        }
    };

    const handleHotspotComplete = () => {
        // Add any completion logic here
    };

    const handleIntroComplete = () => {
        setIntroCompleted(true);
    };

    // Check if there are intro hotspots in the current scene
    const hasIntroHotspots = currentScene?.hotspots?.some((h: any) => h.type === 'intro') || false;
    
    // Determine if other hotspots should be hidden
    const shouldHideOtherHotspots = hasIntroHotspots && !introCompleted;

    return (
        <div style={{width: '100vw', height: '100vh', position: 'relative'}}>
            {currentScene && currentScene.panoramaUrl ? (
                <Viewer texturePath={currentScene.panoramaUrl} sceneId={currentScene.id}>
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
                        
                        if (hotspot.type === 'info' && !shouldHideOtherHotspots) {
                            return (
                                <InfoHotspot 
                                    key={hotspot.id}
                                    texturePath={hotspot.texturePath}
                                    position={hotspot.position} 
                                    onComplete={handleHotspotComplete}
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
                </Viewer>
            ) : null}
            
            {isPreloading && <Loading />}
        </div>
    );
};

export default SceneViewer;