import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SceneViewer from '../SceneViewer';
import ContinuePrompt from '../ContinuePrompt';
import type { SavedState } from '../stateManager';
import { saveState, loadState, clearState, hasSavedState } from '../stateManager';
import { dataManager } from '../DataManager';

// --- TYPE DEFINITIONS ---
interface Hotspot {
  id: string;
  type: string;
  subtype?: string;
  required?: boolean;
}
interface Scene {
  id: string;
  hotspots: Hotspot[];
}
interface ScenarioData {
  scenes: Scene[];
}

// --- COMPONENT ---
const EventManager: React.FC<{ jsonPath: string }> = ({ jsonPath }) => {
  // --- STATE MANAGEMENT ---
  const [scenarioData, setScenarioData] = useState<ScenarioData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<number>(0);
  const [completedHotspots, setCompletedHotspots] = useState<Set<string>>(new Set());
  const [visitedHotspots, setVisitedHotspots] = useState<Set<string>>(new Set());
  const [showContinuePrompt, setShowContinuePrompt] = useState<boolean>(false);
  const [savedState, setSavedState] = useState<SavedState | null>(null);
  const [isStateRestored, setIsStateRestored] = useState<boolean>(false);
  const [initialState, setInitialState] = useState<{
    currentOrder: number;
    completedHotspots: Set<string>;
    visitedHotspots: Set<string>;
    currentSceneId?: string;
  } | null>(null);

  // --- DATA FETCHING & STATE RESTORATION ---

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(jsonPath);
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();
        setScenarioData(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [jsonPath]);
  
  useEffect(() => {
    if (hasSavedState()) {
      const state = loadState();
      if (state) {
        setSavedState(state);
        setShowContinuePrompt(true);
      } else {
        setIsStateRestored(true);
      }
    } else {
      setIsStateRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!loading && isStateRestored && scenarioData) {
      saveState({
        currentOrder,
        completedHotspots: Array.from(completedHotspots),
        visitedHotspots: Array.from(visitedHotspots),
        currentSceneId: dataManager.getCurrentScene()?.id,
      });
    }
  }, [currentOrder, completedHotspots, visitedHotspots, loading, isStateRestored, scenarioData]);

  // --- EVENT HANDLERS ---
  
  const handleContinue = useCallback(() => {
    if (savedState) {
      const restoredState = {
        currentOrder: savedState.currentOrder,
        completedHotspots: new Set(savedState.completedHotspots),
        visitedHotspots: new Set(savedState.visitedHotspots || []),
        currentSceneId: savedState.currentSceneId,
      };
      setInitialState(restoredState);
      setCurrentOrder(restoredState.currentOrder);
      setCompletedHotspots(restoredState.completedHotspots);
      setVisitedHotspots(restoredState.visitedHotspots);
    }
    setShowContinuePrompt(false);
    setIsStateRestored(true);
  }, [savedState]);

  const handleStartOver = useCallback(() => {
    clearState();
    const freshState = {
      currentOrder: 0,
      completedHotspots: new Set(),
      visitedHotspots: new Set(),
      currentSceneId: undefined
    };
    setInitialState(freshState);
    setCurrentOrder(freshState.currentOrder);
    setCompletedHotspots(freshState.completedHotspots);
    setVisitedHotspots(freshState.visitedHotspots);
    setShowContinuePrompt(false);
    setIsStateRestored(true);
  }, []);

  const handleOrderUpdate = useCallback((updates: { order: number; completed: Set<string>; visited: Set<string> }) => {
    setCurrentOrder(updates.order);
    setCompletedHotspots(updates.completed);
    setVisitedHotspots(updates.visited);
  }, []);


  // --- CALCULATIONS & DEBUGGING ---

  /**
   * MODIFIED: The main analytics hook now calculates a weighted progression score.
   */
  const { progressionPercentage, totalQuizHotspots, completedQuizCount } = useMemo(() => {
    const defaultAnalytics = { progressionPercentage: 0, totalQuizHotspots: 0, completedQuizCount: 0 };
    if (!scenarioData) return defaultAnalytics;
    
    const scenes = scenarioData.scenes || scenarioData.Scenes || (Array.isArray(scenarioData) ? scenarioData : []);
    if (!scenes || scenes.length === 0) return defaultAnalytics;

    const quizIds = new Set<string>();
    const requiredIds = new Set<string>();

    scenes.forEach(scene => {
      const hotspots = scene.hotspots || [];
      hotspots.forEach(hotspot => {
        if (hotspot.required) {
          requiredIds.add(hotspot.id);
        }
        if (hotspot.type === 'question' && (hotspot.subtype === 'qcu' || hotspot.subtype === 'qcm')) {
          quizIds.add(hotspot.id);
        }
      });
    });

    // --- NEW: Weighted Progression Logic ---
    let currentProgressionPoints = 0;
    const totalPossiblePoints = requiredIds.size; // Each required hotspot is worth 1 point total.

    if (totalPossiblePoints > 0) {
        requiredIds.forEach(id => {
            const isQuiz = quizIds.has(id);
            const isVisited = visitedHotspots.has(id);
            const isCompleted = completedHotspots.has(id);

            if (isQuiz) {
                // For required quizzes, award 0.5 for visiting and 0.5 for completing.
                if (isVisited) currentProgressionPoints += 0.5;
                if (isCompleted) currentProgressionPoints += 0.5;
            } else {
                // For simple required hotspots, award 1 full point for visiting.
                if (isVisited) currentProgressionPoints += 1.0;
            }
        });
    }

    const finalProgressionPercentage = totalPossiblePoints > 0
        ? Math.round((currentProgressionPoints / totalPossiblePoints) * 100)
        : 0;

    // --- Score Logic ---
    const completedQuizzes = Array.from(completedHotspots).filter(id => quizIds.has(id));
    
    return { 
        progressionPercentage: finalProgressionPercentage,
        totalQuizHotspots: quizIds.size, 
        completedQuizCount: completedQuizzes.length,
    };
  }, [scenarioData, completedHotspots, visitedHotspots]);

  // Debugging effect remains the same
  useEffect(() => {
    if (!loading && !scenarioData) {
      console.error(
        "🔥 EventManager Error: Could not parse scenario data.",
        scenarioData
      );
    }
  }, [loading, scenarioData]);
  
  // Score calculation function remains for the Score section
  const calculateScore = () => {
    if (totalQuizHotspots === 0) return 0;
    return Math.round((completedQuizCount / totalQuizHotspots) * 100);
  };

  const getStatusText = () => {
    if (loading) return "Loading...";
    // Status is now driven by the final progression percentage
    if (progressionPercentage >= 100) return "Completed";
    if (progressionPercentage > 0) return "In Progress";
    return "Not Started";
  };


  // --- RENDER LOGIC ---

  const renderMetrics = () => {
    if (loading) {
      return <div className="text-sm text-gray-500 text-center p-4">Loading Scenario Data...</div>;
    }
    if (!loading && !scenarioData && !error) {
        return <div className="text-sm text-gray-500 text-center p-4">This scenario has no progression steps.</div>;
    }
    if(error){
        return <div className="text-sm text-red-600 text-center p-4">Could not parse scenario data. ❗ Please check the console (F12) for details.</div>;
    }
    return (
      <>
        {/* MODIFIED: Progression text now shows the calculated percentage. */}
        <div>
          <div className="flex items-center justify-between mb-1 text-sm">
            <span className="font-medium text-green-700">📈 Progression</span>
            <span className="font-semibold text-green-800">{progressionPercentage}% Complete</span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2.5">
            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progressionPercentage}%` }}></div>
          </div>
        </div>
        {/* Score Section is unchanged */}
        <div>
          <div className="flex items-center justify-between mb-1 text-sm">
            <span className="font-medium text-blue-700">⭐ Score</span>
            {totalQuizHotspots > 0 ? (
              <span className="font-semibold text-blue-800">{completedQuizCount} / {totalQuizHotspots} Quizzes Passed</span>
            ) : (
              <span className="text-sm text-gray-500">No quizzes in this scenario.</span>
            )}
          </div>
          {totalQuizHotspots > 0 && (
            <div className="w-full bg-blue-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${calculateScore()}%` }}></div>
            </div>
          )}
        </div>
      </>
    );
  };
  
  if (error && !scenarioData) { return <div className="text-center p-10 text-red-600">Error loading scenario: {error}</div>; }

  if (!isStateRestored) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 h-full w-200-vh flex flex-col justify-center items-center">
        {showContinuePrompt && (
          <ContinuePrompt
            onContinue={handleContinue}
            onStartOver={handleStartOver}
            lastSaved={savedState?.lastSaved ? new Date(savedState.lastSaved) : undefined}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 h-full w-200-vh flex flex-col">
      <div className="mb-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium text-gray-700">Current Order: </span>
              <span className="font-semibold text-gray-900">{currentOrder}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Status: </span>
              <span className="font-semibold text-gray-900">{getStatusText()}</span>
            </div>
          </div>
          <hr />
          {renderMetrics()}
        </div>
      </div>
       
     <div className="bg-gray-100 rounded-lg overflow-hidden flex-1">
       <SceneViewer 
         jsonPath='./complete-scene.json' 
         onOrderUpdate={handleOrderUpdate}
         initialState={initialState}
       />
     </div>
    </div>
  );
};

export default EventManager;