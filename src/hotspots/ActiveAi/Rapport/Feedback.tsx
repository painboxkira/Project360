import React from 'react';
import { Html } from '@react-three/drei';
import { Object3D, Camera } from 'three';
import './Feedback.css';

interface Evaluation {
  id: string;
  title: string;
  feedback: string;
  score: number;
  score_min: number;
  score_max: number;
}

interface FeedbackData {
  evaluations: Evaluation[];
  score?: number;
  cost?: number;
  usage?: {
    prompt_tokens: number;
    candidates_token_count: number;
    cost: number;
  };
  learning_objects?: any;
  average_score?: number;
  appreciation_globale?: string;
}

interface FeedbackProps {
  data: FeedbackData;
  onClose?: () => void;
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
}

const Feedback: React.FC<FeedbackProps> = ({
  data,
  onClose,
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
  wrapperClass
}) => {
  const translations = {
    "CanCloseWindow": "Vous pouvez fermer cette fenêtre.",
    "TotalScore": "Score total",
    "Feedback": "Feedback",
    "Score": "Score",
    "Quitter": "Quitter"
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Fallback to window close if no onClose handler
      try {
        setTimeout(() => {
          document.body.innerHTML = `<div style="text-align: center; font-size: 2em; padding: 20px; background-color: #f0f0f0; border: 1px solid #ccc;">${translations["CanCloseWindow"]}</div>`;
        }, 1000);
        window.close();
      } catch (error) {
        console.error("Erreur lors de la fermeture de la fenêtre:", error);
      }
    }
  };

  const scoreHtml = data.average_score !== undefined ? 
    `<div class="total-score">
      <span>${translations["TotalScore"]} :</span>
      <div class="score-circle">${data.average_score}%</div>
    </div>` : '';

  const appreciationGlobaleHtml = data.appreciation_globale ?
    `<p class="description">${data.appreciation_globale}</p>` : '';

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
      <div className="feedback-container">
        <div className="header">
          <h1 className="title">{translations["Feedback"]}:</h1>
          {appreciationGlobaleHtml}
          <div dangerouslySetInnerHTML={{ __html: scoreHtml }} />
        </div>
        
        {data.evaluations.map((evaluation, index) => (
          <div key={evaluation.id || index} className="feedback-card">
            <div className="feedback-header">
              <div className="feedback-title">{evaluation.title}</div>
              <div className="feedback-score">
                {translations["Score"]}: {evaluation.score}{evaluation.score_max === 100 ? "%" : "/" + evaluation.score_max}
              </div>
            </div>
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ 
                  width: `${evaluation.score_max === 0 ? 0 : (evaluation.score / evaluation.score_max) * 100}%` 
                }}
              />
            </div>
            <p className="feedback-text">{evaluation.feedback}</p>
          </div>
        ))}

        <button className="quit-button" onClick={handleClose}>
          {translations["Quitter"]}
        </button>
      </div>
    </Html>
  );
};

export default Feedback; 