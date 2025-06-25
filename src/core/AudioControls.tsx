import { useState, useEffect } from 'react';

interface AudioControlsProps {
  audioConfig: any;
  isVisible?: boolean;
}

const AudioControls = ({ audioConfig, isVisible = true }: AudioControlsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(audioConfig?.volume || 0.5);

  useEffect(() => {
    const checkAudioState = () => {
      if ((window as any).audioManager) {
        setIsPlaying((window as any).audioManager.isPlaying());
      }
    };

    // Check audio state periodically
    const interval = setInterval(checkAudioState, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePlayPause = () => {
    if ((window as any).audioManager) {
      if (isPlaying) {
        (window as any).audioManager.pause();
      } else {
        (window as any).audioManager.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if ((window as any).audioManager) {
      (window as any).audioManager.setVolume(newVolume);
    }
  };

  if (!isVisible || !audioConfig) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      minWidth: '150px'
    }}>
      <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
        Background Audio
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={handlePlayPause}
          style={{
            background: 'none',
            border: '1px solid white',
            color: 'white',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <span style={{ fontSize: '12px' }}>
          {isPlaying ? 'Playing' : 'Paused'}
        </span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '10px' }}>Vol:</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          style={{ flex: 1 }}
        />
        <span style={{ fontSize: '10px', minWidth: '30px' }}>
          {Math.round(volume * 100)}%
        </span>
      </div>
      
      {audioConfig.trigger && (
        <div style={{ fontSize: '10px', opacity: 0.8 }}>
          Trigger: {audioConfig.trigger_type} on {audioConfig.trigger}
        </div>
      )}
    </div>
  );
};

export default AudioControls; 