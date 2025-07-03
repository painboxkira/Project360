import React, { useState, useRef, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { Object3D, Camera } from 'three';
import './Layout.css';
import fetchRapport from './Fetch';
import uploadAudio from './UploadAudio';
import postAnswer from './postanswer';
import Feedback from './Feedback';

interface LayoutProps {
  onSubmit?: (response: string, files: File[]) => void;
  onRecordingToggle?: (isRecording: boolean) => void;
  onQuit?: () => void;
  position?: [number, number, number];
  transform?: boolean;
  distanceFactor?: number;
  zIndexRange?: [number, number];
  sprite?: boolean;
  occlude?: boolean | 'blending' | 'raycast';
  onOcclude?: (visible: boolean) => void;
  fullscreen?: boolean;
  portal?: React.MutableRefObject<HTMLElement>;
  prepend?: boolean;
  center?: boolean;
  calculatePosition?: (el: Object3D, camera: Camera, size: { width: number; height: number }) => [number, number, number];
  as?: string;
  wrapperClass?: string;
  slug?: string;
  isVisible?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  onSubmit, 
  onRecordingToggle,
  onQuit,
  position = [0, 0, 0],
  transform = true,
  distanceFactor = 1,
  zIndexRange = [0, 0],
  sprite = false,
  occlude = false,
  onOcclude,
  fullscreen = false,
  portal,
  prepend = false,
  center = false,
  calculatePosition,
  as = 'div',
  wrapperClass,
  slug,
  isVisible = true
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [response, setResponse] = useState('');
  const [question, setQuestion] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([]);
  
  // New state for feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (slug) {
      fetchRapport(slug).then(setQuestion);
    }
  }, [slug]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);

      // Start MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Clean up audio context
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        analyserRef.current = null;
        microphoneRef.current = null;
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      onRecordingToggle?.(true);

      // Start recording timer
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start audio visualization
      updateAudioLevels();
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      onRecordingToggle?.(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const updateAudioLevels = () => {
    if (!analyserRef.current || !isRecording) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Convert to normalized levels (0-1)
    const levels = Array.from(dataArray).slice(0, 20).map(value => value / 255);
    setAudioLevels(levels);

    if (isRecording) {
      requestAnimationFrame(updateAudioLevels);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const playAudio = () => {
    if (audioUrl && audioElementRef.current) {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!response.trim() && !audioBlob) {
      alert('Veuillez fournir une réponse pour continuer.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let audioFileUrl = null;
      
      // Upload audio if exists
      if (audioBlob) {
        const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
        audioFileUrl = await uploadAudio(audioFile);
      }

      // Submit to API
      if (slug) {
        const feedback = await postAnswer(slug, response, audioFileUrl || undefined);
        setFeedbackData(feedback);
        setShowFeedback(true);
      } else {
        // Fallback to original onSubmit if no slug
        const files = audioBlob ? [new File([audioBlob], 'recording.wav', { type: 'audio/wav' })] : [];
        onSubmit?.(response, files);
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert(`Erreur lors de l'envoi: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseFeedback = () => {
    setShowFeedback(false);
    setFeedbackData(null);
    // Reset form
    setResponse('');
    setAudioBlob(null);
    setAudioUrl(null);
  };

  // If showing feedback, render the Feedback component
  if (showFeedback && feedbackData) {
    return (
      <Feedback
        data={feedbackData}
        onClose={handleCloseFeedback}
        position={position}
        transform={transform}
        distanceFactor={distanceFactor}
        zIndexRange={zIndexRange}
        sprite={sprite}
        occlude={occlude}
        onOcclude={onOcclude}
        fullscreen={fullscreen}
        portal={portal}
        prepend={prepend}
        center={center}
        calculatePosition={calculatePosition}
        as={as}
        wrapperClass={wrapperClass}
        onQuit={onQuit}
      />
    );
  }

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <Html
      position={position}
      transform={transform}
      distanceFactor={distanceFactor}
      zIndexRange={zIndexRange}
      sprite={sprite}
      occlude={occlude}
      onOcclude={onOcclude}
      fullscreen={fullscreen}
      portal={portal}
      prepend={prepend}
      center={center}
      calculatePosition={calculatePosition}
      as={as}
      wrapperClass={wrapperClass}
    >
      <div className="form-container">
        <div className="question-title">Question</div>
        <div className="question-box">
          <p>{question}</p>
        </div>

        <div className="response-section">
          <div className="response-header">
            <label className="response-label">Réponse</label>
            <div className="input-actions">
              <button 
                className={`action-button ${isRecording ? 'recording' : ''}`} 
                onClick={toggleRecording}
                disabled={isPlaying || isSubmitting}
              >
                <svg width="11" height="15" viewBox="0 0 11 15" stroke="currentColor" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.66675 1C5.13632 1 4.62761 1.21071 4.25253 1.58579C3.87746 1.96086 3.66675 2.46957 3.66675 3V7.66667C3.66675 8.1971 3.87746 8.70581 4.25253 9.08088C4.62761 9.45595 5.13632 9.66667 5.66675 9.66667C6.19718 9.66667 6.70589 9.45595 7.08096 9.08088C7.45603 8.70581 7.66675 8.1971 7.66675 7.66667V3C7.66675 2.46957 7.45603 1.96086 7.08096 1.58579C6.70589 1.21071 6.19718 1 5.66675 1Z" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M10.3333 6.33301V7.66634C10.3333 8.90402 9.84167 10.091 8.9665 10.9662C8.09133 11.8413 6.90434 12.333 5.66667 12.333C4.42899 12.333 3.242 11.8413 2.36683 10.9662C1.49167 10.091 1 8.90402 1 7.66634V6.33301" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M5.66675 12.333V14.333" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Recording visualization */}
          {isRecording && (
            <div className="recording-visualization">
              <div className="recording-time">{formatTime(recordingTime)}</div>
              <div className="audio-waves">
                {audioLevels.map((level, index) => (
                  <div
                    key={index}
                    className="wave-bar"
                    style={{ height: `${Math.max(level * 100, 10)}%` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Audio playback controls */}
          {audioUrl && !isRecording && (
            <div className="audio-playback">
              <div className="playback-controls">
                <button 
                  className="playback-button"
                  onClick={isPlaying ? pauseAudio : playAudio}
                  disabled={isSubmitting}
                >
                  {isPlaying ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <rect x="2" y="2" width="2" height="8" rx="1"/>
                      <rect x="8" y="2" width="2" height="8" rx="1"/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M3 2L10 6L3 10V2Z"/>
                    </svg>
                  )}
                </button>
                <span className="playback-label">Écouter l'enregistrement</span>
              </div>
              <audio 
                ref={audioElementRef}
                src={audioUrl} 
                onEnded={handleAudioEnded}
                style={{ display: 'none' }}
              />
            </div>
          )}
          
          <textarea 
            placeholder=""
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            disabled={isSubmitting}
          />

          <div className="button-group">
            <button 
              className={`submit-button ${isSubmitting ? 'loading' : ''}`} 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="submit-button-icon"></span>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.3333 1L9.66667 14.3333L7 8.33333L1 5.66667L14.3333 1Z" stroke="#FAFAFA" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M14.3333 1L7 8.33333" stroke="#FAFAFA" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  Envoyer la réponse
                </>
              )}
            </button>
            
            <button 
              className="fermer-button" 
              onClick={onQuit}
              disabled={isSubmitting}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </Html>
  );
};

export default Layout;
