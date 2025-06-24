import { useEffect, useState } from 'react';
import Viewer, { preloadAllTextures } from './Viewer';
import { Loading } from './loading';
import { dataManager } from './DataManager';
import type { ProcessedScene } from './processors/SceneProcessor';
import InfoHotspot from '../hotspots/InfoHotspot';

const SceneViewer = ({ jsonPath }: { jsonPath: string }) => {
    const [currentScene, setCurrentScene] = useState<ProcessedScene | null>(null);
    const [sceneIds, setSceneIds] = useState<string[]>([]);
    const [isPreloading, setIsPreloading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsPreloading(true);
                
                // Load scene data
                await dataManager.loadSceneData(jsonPath);
                const scene = dataManager.getCurrentScene();
                const ids = dataManager.getSceneIds();
                const allScenes = dataManager.getAllScenes();
                
                setCurrentScene(scene);
                setSceneIds(ids);

                // Preload all textures for smooth transitions (only once)
                if (allScenes.length > 0) {
                    const texturePaths = allScenes.map((s: ProcessedScene) => s.panoramaUrl);
                    console.log('Preloading textures:', texturePaths);
                    await preloadAllTextures(texturePaths);
                    console.log('All textures preloaded successfully');
                }
                
                setIsPreloading(false);
            } catch (error) {
                console.error('Failed to load scene data:', error);
                setIsPreloading(false);
            }
        };

        loadData();
    }, []);

    // Subscribe to DataManager state changes
    useEffect(() => {
        const unsubscribe = dataManager.subscribe((state) => {
            console.log('SceneViewer: Received state update:', {
                currentSceneId: state.currentScene?.id,
                allSceneIds: state.allScenes.map(s => s.id),
                isLoading: state.isLoading
            });
            // Only update current scene, don't trigger preloading again
            setCurrentScene(state.currentScene);
        });

        return unsubscribe;
    }, []);

    const handleSceneSwitch = (sceneId: string) => {
        console.log('Attempting to switch to scene:', sceneId);
        console.log('Available scenes:', dataManager.getAllScenes().map(s => s.id));
        console.log('Current scene before switch:', dataManager.getCurrentScene()?.id);
        
        const success = dataManager.switchToScene(sceneId);
        console.log('Switch result:', success);
        
        if (!success) {
            console.error('Failed to switch to scene:', sceneId);
        } else {
            console.log('Successfully switched to scene:', sceneId);
            console.log('Current scene after switch:', dataManager.getCurrentScene()?.id);
        }
    };

    const handleHotspotComplete = () => {
        console.log('Hotspot completed!');
        // Add any completion logic here
    };

    return (
        <div style={{width: '100vw', height: '100vh', position: 'relative'}}>
            {/* Debug info */}
            <div style={{
                position: 'absolute',
                top: '60px',
                left: '20px',
                zIndex: 1000,
                fontSize: '12px',
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '10px',
                borderRadius: '4px'
            }}>
                <div>Current Scene: {currentScene?.id || 'none'}</div>
                <div>Scene IDs: {sceneIds.join(', ')}</div>
                <div>Is Preloading: {isPreloading.toString()}</div>
            </div>
            
            {/* Scene navigation buttons */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                zIndex: 1000,
                display: 'flex',
                gap: '10px'
            }}>
                {sceneIds.map(sceneId => (
                    <button 
                        key={sceneId} 
                        onClick={() => {
                            console.log('Button clicked for scene:', sceneId);
                            handleSceneSwitch(sceneId);
                        }}
                        disabled={isPreloading}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: currentScene?.id === sceneId ? '#007bff' : '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isPreloading ? 'not-allowed' : 'pointer',
                            opacity: isPreloading ? 0.6 : 1
                        }}
                    >
                        {sceneId}
                    </button>
                ))}
            </div>

            {/* Main viewer - single canvas for all scenes */}
            <Viewer texturePath={currentScene?.panoramaUrl || ""} sceneId={currentScene?.id}>
                {/* Dynamically generate InfoHotspots based on scene data */}
                {currentScene?.hotspots?.map((hotspot: any) => {
                    // Only render info type hotspots
                    if (hotspot.type === 'info' || hotspot.type === 'intro') {
                        return (
                            <InfoHotspot 
                                key={hotspot.id}
                                texturePath={hotspot.texturePath}
                                position={hotspot.position} 
                                onComplete={handleHotspotComplete}
                            />
                        );
                    }
                    return null;
                })}
            </Viewer>
            
            {/* Loading overlay - shows during initial preloading only */}
            {isPreloading && <Loading />}
        </div>
    );
};

export default SceneViewer;