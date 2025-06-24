import { useState, useEffect, useCallback } from 'react';
import { dataManager, type DataManagerState } from '../DataManager';

export const useDataManager = () => {
    const [state, setState] = useState<DataManagerState>({
        isLoading: false,
        currentScene: null,
        allScenes: [],
        sceneIds: [],
        error: null
    });

    useEffect(() => {
        // Subscribe to data manager state changes
        const unsubscribe = dataManager.subscribe(setState);
        
        // Cleanup subscription on unmount
        return unsubscribe;
    }, []);

    // Memoize the loadSceneData function to prevent infinite re-renders
    const loadSceneData = useCallback((jsonPath: string) => {
        return dataManager.loadSceneData(jsonPath);
    }, []);

    // Memoize the switchToScene function
    const switchToScene = useCallback((sceneId: string) => {
        return dataManager.switchToScene(sceneId);
    }, []);

    return {
        // State
        isLoading: state.isLoading,
        currentScene: state.currentScene,
        allScenes: state.allScenes,
        sceneIds: state.sceneIds,
        error: state.error,

        // Actions
        loadSceneData,
        switchToScene
    };
}; 