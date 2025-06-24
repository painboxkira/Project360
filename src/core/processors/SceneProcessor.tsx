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

// Simple processed scene data
export interface ProcessedScene {
    id: string;
    panoramaUrl: string;
}

// Scene processor class
export class SceneProcessor {
    /**
     * Process JSON data and extract scene IDs and panorama URLs
     */
    static processScenes(jsonData: LoadedJsonFile): ProcessedScene[] {
        if (!jsonData.scenes || !Array.isArray(jsonData.scenes)) {
            return [];
        }

        return jsonData.scenes
            .filter(scene => scene.id && scene.panoramaUrl)
            .map(scene => ({
                id: scene.id,
                panoramaUrl: scene.panoramaUrl
            }));
    }

    /**
     * Get scene IDs for navigation
     */
    static getSceneIds(jsonData: LoadedJsonFile): string[] {
        if (!jsonData.scenes || !Array.isArray(jsonData.scenes)) {
            return [];
        }

        return jsonData.scenes
            .filter(scene => scene.id)
            .map(scene => scene.id);
    }
} 