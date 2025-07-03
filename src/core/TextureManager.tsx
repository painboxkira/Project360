import * as THREE from 'three';

// Global texture cache with improved memory management
class TextureManager {
    private textureCache = new Map<string, THREE.Texture>();
    private loadingPromises = new Map<string, Promise<THREE.Texture>>();
    private MAX_CACHE_SIZE = 100; // Increased for comprehensive preloading

    /**
     * Preload a single texture with caching
     */
    private async preloadTexture(texturePath: string): Promise<THREE.Texture> {
        if (!texturePath?.trim()) {
            throw new Error('Texture path cannot be empty');
        }
        
        // Return cached texture if available
        if (this.textureCache.has(texturePath)) {
            return this.textureCache.get(texturePath)!;
        }

        // Return existing loading promise if available
        if (this.loadingPromises.has(texturePath)) {
            return this.loadingPromises.get(texturePath)!;
        }

        // Create new loading promise
        const loadingPromise = new Promise<THREE.Texture>((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                texturePath,
                (texture) => {
                    this.textureCache.set(texturePath, texture);
                    this.loadingPromises.delete(texturePath);
                    this.cleanupCache();
                    resolve(texture);
                },
                undefined,
                (error: unknown) => {
                    this.loadingPromises.delete(texturePath);
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    reject(new Error(`Failed to load texture: ${texturePath} - ${errorMessage}`));
                }
            );
        });

        this.loadingPromises.set(texturePath, loadingPromise);
        return loadingPromise;
    }

    /**
     * Preload all textures from all scenes
     */
    async preloadAllSceneTextures(allScenes: any[]): Promise<void> {
        const allTexturePaths = new Set<string>();

        // Collect all texture paths from all scenes
        allScenes.forEach(scene => {
            // Panorama textures
            if (scene.panoramaUrl) {
                allTexturePaths.add(scene.panoramaUrl);
            }

            // Hotspot textures
            if (scene.hotspots) {
                scene.hotspots.forEach((hotspot: any) => {
                    // Info hotspot textures
                    if (hotspot.texturePath && Array.isArray(hotspot.texturePath)) {
                        hotspot.texturePath.forEach((path: string) => {
                            if (path) allTexturePaths.add(path);
                        });
                    }

                    // Image hotspot textures
                    if (hotspot.type === 'image' && hotspot.imagePath) {
                        allTexturePaths.add(hotspot.imagePath);
                    }

                    // Link hotspot textures (including return textures)
                    if (hotspot.type === 'link') {
                        if (hotspot.imagePath) {
                            allTexturePaths.add(hotspot.imagePath);
                        }
                        if (hotspot.returnImagePath) {
                            allTexturePaths.add(hotspot.returnImagePath);
                        }
                    }

                    // Question hotspot choice textures
                    if (hotspot.type === 'question' && hotspot.choices) {
                        hotspot.choices.forEach((choice: any) => {
                            if (choice.texture) {
                                allTexturePaths.add(choice.texture);
                            }
                        });
                    }

                    // Question hotspot question texture
                    if (hotspot.type === 'question' && hotspot.questionTexture) {
                        allTexturePaths.add(hotspot.questionTexture);
                    }

                    // Question hotspot submit texture (QCM/QCU)
                    if (hotspot.type === 'question' && hotspot.submitTexture) {
                        allTexturePaths.add(hotspot.submitTexture);
                    }
                });
            }
        });

        console.log(`Preloading ${allTexturePaths.size} textures...`);
        
        // Preload all textures in parallel
        const loadPromises = Array.from(allTexturePaths).map(path => 
            this.preloadTexture(path).catch(error => {
                console.warn(`Failed to preload texture: ${path}`, error);
                return null;
            })
        );

        await Promise.all(loadPromises);
        console.log('All textures preloaded successfully');
    }

    /**
     * Get a texture from cache (synchronous)
     */
    getTexture(texturePath: string): THREE.Texture | null {
        return this.textureCache.get(texturePath) || null;
    }

    /**
     * Get a texture from cache or load it if not available
     */
    async getTextureAsync(texturePath: string): Promise<THREE.Texture> {
        return this.preloadTexture(texturePath);
    }

    /**
     * Check if a texture is loaded
     */
    isTextureLoaded(texturePath: string): boolean {
        return this.textureCache.has(texturePath);
    }

    /**
     * Cleanup cache to prevent memory leaks
     */
    private cleanupCache(): void {
        if (this.textureCache.size > this.MAX_CACHE_SIZE) {
            const entries = Array.from(this.textureCache.entries());
            const toRemove = entries.slice(0, this.textureCache.size - this.MAX_CACHE_SIZE);
            
            toRemove.forEach(([key, texture]) => {
                texture.dispose();
                this.textureCache.delete(key);
            });
        }
    }

    /**
     * Clear all textures from cache
     */
    clearCache(): void {
        this.textureCache.forEach((texture) => texture.dispose());
        this.textureCache.clear();
        this.loadingPromises.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { loaded: number; loading: number; total: number } {
        return {
            loaded: this.textureCache.size,
            loading: this.loadingPromises.size,
            total: this.textureCache.size + this.loadingPromises.size
        };
    }
}

// Create singleton instance
export const textureManager = new TextureManager();

// Export the class for testing purposes
export { TextureManager }; 