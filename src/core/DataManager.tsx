import { SceneProcessor } from './processors/SceneProcessor';
import type { ProcessedScene } from './processors/SceneProcessor';

// Type definition for the JSON file structure
interface LoadedJsonFile {
    scenes: Array<{
        id: string;
        title: string;
        panoramaUrl: string;
        sphereRadius: number;
        hotspots?: any[];
        audio?: any;
    }>;
}

// Manager for all data operations
export interface DataManagerState {
    isLoading: boolean;
    currentScene: ProcessedScene | null;
    allScenes: ProcessedScene[];
    sceneIds: string[];
    error: string | null;
}

export class DataManager {
    private state: DataManagerState = {
        isLoading: false,
        currentScene: null,
        allScenes: [],
        sceneIds: [],
        error: null
    };

    private listeners: Array<(state: DataManagerState) => void> = [];

    /**
     * Load and process scene data from JSON file
     */
    async loadSceneData(jsonPath: string): Promise<void> {
        try {
            this.setState({ isLoading: true, error: null });

            // Load raw data
            const rawData = await this.loadJsonData(jsonPath);
            console.log('DataManager: Loaded raw data:', rawData);
            
            // Process scenes to get IDs and panorama URLs
            const processedScenes = SceneProcessor.processScenes(rawData);
            const sceneIds = SceneProcessor.getSceneIds(rawData);
            
            console.log('DataManager: Processed scenes:', processedScenes);
            console.log('DataManager: Scene IDs:', sceneIds);

            // Set current scene to first valid scene
            const currentScene = processedScenes.length > 0 ? processedScenes[0] : null;
            console.log('DataManager: Setting current scene to:', currentScene?.id);

            this.setState({
                isLoading: false,
                currentScene,
                allScenes: processedScenes,
                sceneIds,
                error: null
            });

        } catch (error) {
            console.error('DataManager: Error loading scene data:', error);
            this.setState({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            });
        }
    }

    /**
     * Switch to a different scene by ID
     */
    switchToScene(sceneId: string): boolean {
        console.log('DataManager: Attempting to switch to scene:', sceneId);
        console.log('DataManager: Available scenes:', this.state.allScenes.map(s => s.id));
        console.log('DataManager: Current scene before switch:', this.state.currentScene?.id);
        
        const scene = this.state.allScenes.find(s => s.id === sceneId);
        if (scene) {
            console.log('DataManager: Found scene, switching to:', scene.id);
            this.setState({ currentScene: scene });
            return true;
        }
        console.log('DataManager: Scene not found:', sceneId);
        return false;
    }

    /**
     * Get current scene data
     */
    getCurrentScene(): ProcessedScene | null {
        return this.state.currentScene;
    }

    /**
     * Get all available scene IDs
     */
    getSceneIds(): string[] {
        return this.state.sceneIds;
    }

    /**
     * Get all available scenes
     */
    getAllScenes(): ProcessedScene[] {
        return this.state.allScenes;
    }

    /**
     * Get loading state
     */
    isLoading(): boolean {
        return this.state.isLoading;
    }

    /**
     * Get error state
     */
    getError(): string | null {
        return this.state.error;
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener: (state: DataManagerState) => void): () => void {
        this.listeners.push(listener);
        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * Update state and notify listeners
     */
    private setState(updates: Partial<DataManagerState>): void {
        this.state = { ...this.state, ...updates };
        this.listeners.forEach(listener => listener(this.state));
    }

    /**
     * Load JSON data from file
     */
    private async loadJsonData(jsonPath: string): Promise<LoadedJsonFile> {
        const response = await fetch(jsonPath);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const data = await response.json();
        return data as LoadedJsonFile;
    }
}

// Create singleton instance
export const dataManager = new DataManager(); 