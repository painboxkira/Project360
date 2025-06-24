import { useEffect, useState } from 'react';
import Viewer, { preloadAllTextures } from './Viewer';
import { Loading } from './loading';
import { dataManager } from './DataManager';
import type { ProcessedScene } from './processors/SceneProcessor';

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
            // Only update current scene, don't trigger preloading again
            setCurrentScene(state.currentScene);
        });

        return unsubscribe;
    }, []);

    const handleSceneSwitch = (sceneId: string) => {
        const success = dataManager.switchToScene(sceneId);
        if (!success) {
            console.error('Failed to switch to scene:', sceneId);
        }
    };

    return (
        <div style={{width: '100vw', height: '100vh', position: 'relative'}}>
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
                        onClick={() => handleSceneSwitch(sceneId)}
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
            <Viewer texturePath={currentScene?.panoramaUrl || ""} />
            
            {/* Loading overlay - shows during initial preloading only */}
            {isPreloading && <Loading />}
        </div>
    );
};

export default SceneViewer;