import React, { useState, useEffect, useCallback } from 'react';
import SceneViewer from '../SceneViewer';
import ContinuePrompt from '../ContinuePrompt';
import type { SavedState } from '../stateManager';
import { saveState, loadState, clearState, hasSavedState } from '../stateManager';
import { dataManager } from '../DataManager';

// --- TypeScript Interfaces (remain the same) ---
interface Hotspot {
  HostpotID: string;
  order: number;
  completion: boolean;
}
interface Scene {
  SceneID: string;
  Hotspots: Hotspot[];
  SceneCompletion: number;
}
interface ScenarioData {
  Scenes: Scene[];
  ScenarioCompletion: number;
}

const EventManager: React.FC<{ jsonPath: string }> = ({ jsonPath }) => {
  const [scenarioData, setScenarioData] = useState<ScenarioData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<number>(0);
  const [completedHotspots, setCompletedHotspots] = useState<Set<string>>(new Set());
  const [totalRequiredHotspots, setTotalRequiredHotspots] = useState<number>(0);
  const [showContinuePrompt, setShowContinuePrompt] = useState<boolean>(false);
  const [savedState, setSavedState] = useState<SavedState | null>(null);
  const [isStateRestored, setIsStateRestored] = useState<boolean>(false);
  const [initialState, setInitialState] = useState<{
    currentOrder: number;
    completedHotspots: Set<string>;
    currentSceneId?: string;
  } | null>(null);

  // Load saved state on mount
  useEffect(() => {
    console.log('EventManager: Loading saved state');
    if (hasSavedState()) {
      const state = loadState();
      if (state) {
        setSavedState(state);
        setShowContinuePrompt(true);
      } else {
        // No saved state, allow SceneViewer to start fresh
        setIsStateRestored(true);
      }
    } else {
      // No saved state, allow SceneViewer to start fresh
      setIsStateRestored(true);
    }
  }, []);

  // Handle continue from saved state
  const handleContinue = useCallback(() => {
    if (savedState) {
      const restoredOrder = savedState.currentOrder;
      const restoredHotspots = new Set(savedState.completedHotspots);
      
      setCurrentOrder(restoredOrder);
      setCompletedHotspots(restoredHotspots);
      
      // Set initial state for SceneViewer
      setInitialState({
        currentOrder: restoredOrder,
        completedHotspots: restoredHotspots,
        currentSceneId: savedState.currentSceneId
      });
      
      setIsStateRestored(true);
    }
    setShowContinuePrompt(false);
  }, [savedState]);

  // Handle start over
  const handleStartOver = useCallback(() => {
    clearState();
    setCurrentOrder(0);
    setCompletedHotspots(new Set());
    
    // Set fresh initial state for SceneViewer
    setInitialState({
      currentOrder: 0,
      completedHotspots: new Set(),
      currentSceneId: undefined
    });
    
    setIsStateRestored(true);
    setShowContinuePrompt(false);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(jsonPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        const data: ScenarioData = await response.json();
        setScenarioData(data);
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [jsonPath]);

  // Save state whenever important state changes (only after initial restoration)
  useEffect(() => {
    if (!loading && scenarioData && isStateRestored) {
      // Get current scene ID from DataManager
      const currentScene = dataManager.getCurrentScene();
      const currentSceneId = currentScene?.id;
      
      // Add a small delay to ensure DataManager state is fully updated
      const saveTimeout = setTimeout(() => {
        const latestScene = dataManager.getCurrentScene();
        const latestSceneId = latestScene?.id;
        
        console.log(`EventManager: Saving state - Order: ${currentOrder}, Scene: ${latestSceneId}, Completed: ${Array.from(completedHotspots).join(',')}`);
        
        saveState({
          currentOrder,
          completedHotspots: Array.from(completedHotspots),
          currentSceneId: latestSceneId
        });
      }, 100);

      return () => clearTimeout(saveTimeout);
    }
  }, [currentOrder, completedHotspots, loading, scenarioData, isStateRestored]);

  const handleOrderUpdate = useCallback((order: number, completed: Set<string>, totalRequired: number) => {
    console.log(`EventManager received: order=${order}, completed=${Array.from(completed).join(',')}, totalRequired=${totalRequired}`);
    setCurrentOrder(order);
    setCompletedHotspots(completed);
    setTotalRequiredHotspots(totalRequired);
  }, []);

  const calculateProgress = () => {
    if (totalRequiredHotspots === 0) return 0;
    const progress = Math.round((completedHotspots.size / totalRequiredHotspots) * 100);
    return Math.min(progress, 100); // Cap at 100%
  };

  const getStatusText = () => {
    const progress = calculateProgress();
    if (progress === 0) return "Not Started";
    if (progress === 100) return "Completed";
    return "In Progress";
  };
  
  if (loading) {
    return <div className="text-center p-10 text-lg font-medium text-gray-600">Loading scenario...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-lg font-medium text-red-600">Error: {error}</div>;
  }

  // Don't render SceneViewer until state is properly restored or initialized
  if (!isStateRestored) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 h-full w-200-vh flex flex-col">
        {showContinuePrompt && savedState && (
          <ContinuePrompt
            onContinue={handleContinue}
            onStartOver={handleStartOver}
            lastSaved={savedState.lastSaved ? new Date(savedState.lastSaved) : undefined}
          />
        )}
        <div className="text-center p-10 text-lg font-medium text-gray-600">Preparing scenario...</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 h-full w-200-vh flex flex-col">
      <div className="mb-4">
        {/* Status Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-sm font-medium text-blue-800">Current Order: </span>
              <span className="text-sm text-blue-600">{currentOrder}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-blue-800">Status: </span>
              <span className="text-sm text-blue-600">{getStatusText()}</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
          
          {/* Progress Text */}
          <div className="text-xs text-blue-600">
            {completedHotspots.size} of {totalRequiredHotspots} required hotspots completed ({calculateProgress()}%)
          </div>
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