import { useEffect, useRef, useCallback } from 'react';

interface AudioConfig {
  path_to_audio: string;
  initial_state: 'auto_play' | 'manual_play' | 'stopped';
  trigger_type?: 'stop' | 'pause' | 'volume_change' | 'fade_out' | 'fade_in';
  trigger?: string;
  loop?: boolean;
  volume?: number;
  fade_duration?: number; // in seconds
}

interface AudioManagerProps {
  audioConfig: AudioConfig | null;
  onHotspotComplete?: (hotspotId: string) => void;
  completedHotspots: Set<string>;
}

const AudioManager = ({ audioConfig, onHotspotComplete, completedHotspots }: AudioManagerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitializedRef = useRef(false);
  const fadeIntervalRef = useRef<number | null>(null);
  const hasBeenStoppedByTriggerRef = useRef(false);

  // Initialize audio
  const initializeAudio = useCallback(() => {
    if (!audioConfig || isInitializedRef.current) return;

    console.log('Initializing audio with config:', audioConfig);
    
    const audio = new Audio(audioConfig.path_to_audio);
    audio.loop = audioConfig.loop || false;
    audio.volume = audioConfig.volume || 0.5;
    
    // Set up event listeners
    audio.addEventListener('canplaythrough', () => {
      console.log('Audio loaded and ready to play');
      if (audioConfig.initial_state === 'auto_play' && !hasBeenStoppedByTriggerRef.current) {
        audio.play().catch(error => {
          console.warn('Auto-play failed (this is normal in some browsers):', error);
        });
      }
    });

    audio.addEventListener('error', (error) => {
      console.error('Audio loading error:', error);
    });

    audio.addEventListener('play', () => {
      console.log('Audio started playing');
    });

    audio.addEventListener('pause', () => {
      console.log('Audio paused');
    });

    audio.addEventListener('ended', () => {
      console.log('Audio ended');
    });

    audioRef.current = audio;
    isInitializedRef.current = true;
    hasBeenStoppedByTriggerRef.current = false;
  }, [audioConfig]);

  // Fade out effect
  const fadeOut = useCallback((duration: number = 2) => {
    if (!audioRef.current) return;
    
    const startVolume = audioRef.current.volume;
    const steps = 20;
    const stepDuration = (duration * 1000) / steps;
    const volumeStep = startVolume / steps;
    
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }
    
    fadeIntervalRef.current = window.setInterval(() => {
      if (audioRef.current && audioRef.current.volume > 0) {
        audioRef.current.volume = Math.max(0, audioRef.current.volume - volumeStep);
      } else {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          hasBeenStoppedByTriggerRef.current = true;
        }
      }
    }, stepDuration);
  }, []);

  // Fade in effect
  const fadeIn = useCallback((targetVolume: number, duration: number = 2) => {
    if (!audioRef.current) return;
    
    const startVolume = 0;
    const steps = 20;
    const stepDuration = (duration * 1000) / steps;
    const volumeStep = targetVolume / steps;
    
    audioRef.current.volume = startVolume;
    
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }
    
    fadeIntervalRef.current = window.setInterval(() => {
      if (audioRef.current && audioRef.current.volume < targetVolume) {
        audioRef.current.volume = Math.min(targetVolume, audioRef.current.volume + volumeStep);
      } else {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
      }
    }, stepDuration);
  }, []);

  // Handle audio triggers
  useEffect(() => {
    if (!audioConfig || !audioRef.current) return;

    const { trigger_type, trigger, fade_duration = 2 } = audioConfig;

    if (trigger) {
      console.log(`Audio trigger activated: ${trigger_type} for hotspot ${trigger}`);
      
      switch (trigger_type) {
        case 'stop':
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.loop = false; // Disable looping when stopped
          hasBeenStoppedByTriggerRef.current = true;
          console.log('Audio stopped due to trigger');
          break;
          
        case 'pause':
          audioRef.current.pause();
          console.log('Audio paused due to trigger');
          break;
          
        case 'volume_change':
          // Reduce volume to 0.1 when trigger is activated
          audioRef.current.volume = 0.1;
          console.log('Audio volume reduced due to trigger');
          break;
          
        case 'fade_out':
          fadeOut(fade_duration);
          console.log('Audio fading out due to trigger');
          break;
          
        case 'fade_in':
          const targetVolume = audioConfig.volume || 0.5;
          fadeIn(targetVolume, fade_duration);
          console.log('Audio fading in due to trigger');
          break;
          
        default:
          console.log('Unknown trigger type:', trigger_type);
      }
    }
  }, [audioConfig, completedHotspots, fadeOut, fadeIn]);

  // Initialize audio when config changes
  useEffect(() => {
    initializeAudio();
  }, [initializeAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      if (audioRef.current) {
        console.log('Cleaning up audio');
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      isInitializedRef.current = false;
      hasBeenStoppedByTriggerRef.current = false;
    };
  }, []);

  // Public methods for external control
  const playAudio = useCallback(() => {
    if (audioRef.current && !hasBeenStoppedByTriggerRef.current) {
      audioRef.current.play().catch(error => {
        console.warn('Play failed:', error);
      });
    }
  }, []);

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.loop = false;
      hasBeenStoppedByTriggerRef.current = true;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  // Expose methods via window object for external access
  useEffect(() => {
    if (audioRef.current) {
      (window as any).audioManager = {
        play: playAudio,
        pause: pauseAudio,
        stop: stopAudio,
        setVolume: setVolume,
        fadeOut: fadeOut,
        fadeIn: fadeIn,
        isPlaying: () => audioRef.current?.paused === false
      };
    }
  }, [playAudio, pauseAudio, stopAudio, setVolume, fadeOut, fadeIn]);

  return null; // This component doesn't render anything
};

export default AudioManager; 
