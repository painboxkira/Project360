import { useEffect, useState } from 'react';
import { textureManager } from './TextureManager';

interface LoadingScreenProps {
    isVisible: boolean;
    onComplete?: () => void;
}

const LoadingScreen = ({ isVisible, onComplete }: LoadingScreenProps) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('Initializing...');

    useEffect(() => {
        if (!isVisible) return;

        let interval: number;
        
        const updateProgress = () => {
            const stats = textureManager.getCacheStats();
            const totalTextures = stats.total;
            const loadedTextures = stats.loaded;
            
            if (totalTextures > 0) {
                const newProgress = Math.round((loadedTextures / totalTextures) * 100);
                setProgress(newProgress);
                setStatus(`Loading textures... ${loadedTextures}/${totalTextures}`);
                
                if (loadedTextures === totalTextures && totalTextures > 0) {
                    setStatus('Ready!');
                    setTimeout(() => {
                        onComplete?.();
                    }, 500);
                }
            } else {
                // If no textures are being loaded, simulate progress
                setProgress(prev => {
                    if (prev < 90) {
                        return prev + 1;
                    }
                    return prev;
                });
                setStatus('Preparing experience...');
            }
        };

        interval = setInterval(updateProgress, 100);

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isVisible, onComplete]);

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#1a1a1a',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            color: 'white',
            fontFamily: 'Arial, sans-serif'
        }}>
            {/* Logo or Title */}
            <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                marginBottom: '2rem',
                textAlign: 'center'
            }}>
                Formation Cuisine
            </div>
            
            {/* Subtitle */}
            <div style={{
                fontSize: '1.2rem',
                marginBottom: '3rem',
                opacity: 0.8,
                textAlign: 'center'
            }}>
                Interactive Training Experience
            </div>

            {/* Progress Bar */}
            <div style={{
                width: '400px',
                maxWidth: '80vw',
                marginBottom: '1rem'
            }}>
                <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#333',
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        backgroundColor: '#4CAF50',
                        transition: 'width 0.3s ease',
                        borderRadius: '4px'
                    }} />
                </div>
            </div>

            {/* Progress Text */}
            <div style={{
                fontSize: '1rem',
                marginBottom: '2rem',
                textAlign: 'center'
            }}>
                {status}
            </div>

            {/* Progress Percentage */}
            <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#4CAF50'
            }}>
                {progress}%
            </div>

            {/* Loading Animation */}
            <div style={{
                marginTop: '2rem',
                display: 'flex',
                gap: '0.5rem'
            }}>
                {[0, 1, 2].map(i => (
                    <div
                        key={i}
                        style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: '#4CAF50',
                            borderRadius: '50%',
                            animation: `pulse 1.4s ease-in-out infinite both`,
                            animationDelay: `${i * 0.16}s`
                        }}
                    />
                ))}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 80%, 100% {
                        transform: scale(0.8);
                        opacity: 0.5;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default LoadingScreen; 