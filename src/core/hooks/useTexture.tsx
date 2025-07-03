import { useMemo } from 'react';
import * as THREE from 'three';
import { textureManager } from '../TextureManager';

/**
 * Hook to get a texture from the global cache
 * This ensures zero re-renders as textures are preloaded upfront
 */
export const useTexture = (texturePath: string): THREE.Texture | null => {
    return useMemo(() => {
        if (!texturePath) return null;
        return textureManager.getTexture(texturePath);
    }, [texturePath]);
};

/**
 * Hook to get multiple textures from the global cache
 */
export const useTextures = (texturePaths: string[]): (THREE.Texture | null)[] => {
    return useMemo(() => {
        return texturePaths.map(path => textureManager.getTexture(path));
    }, [texturePaths]);
};

/**
 * Hook to get a texture with fallback
 */
export const useTextureWithFallback = (
    texturePath: string, 
    fallbackPath: string = '/textures/infodef.png'
): THREE.Texture | null => {
    return useMemo(() => {
        const texture = textureManager.getTexture(texturePath);
        if (texture) return texture;
        
        // Return fallback texture
        return textureManager.getTexture(fallbackPath);
    }, [texturePath, fallbackPath]);
};

/**
 * Hook to get a texture array with fallbacks
 */
export const useTextureArrayWithFallbacks = (
    texturePaths: string[],
    fallbackPaths: string[] = ['/textures/infodef.png', '/textures/complete.png', '/textures/feedback.png']
): (THREE.Texture | null)[] => {
    return useMemo(() => {
        return texturePaths.map((path, index) => {
            const texture = textureManager.getTexture(path);
            if (texture) return texture;
            
            // Return fallback texture
            const fallbackPath = fallbackPaths[index] || fallbackPaths[0];
            return textureManager.getTexture(fallbackPath);
        });
    }, [texturePaths, fallbackPaths]);
}; 