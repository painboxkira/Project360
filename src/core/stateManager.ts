// Types for saved state
export interface SavedState {
  currentOrder: number;
  completedHotspots: string[];
  currentSceneId?: string;
  lastSaved?: number; // timestamp is now optional since we add it in saveState
}

const STATE_KEY = 'scenario_saved_state';

// Save current state to localStorage
export const saveState = (state: SavedState): void => {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify({
      ...state,
      lastSaved: Date.now()
    }));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
};

// Load state from localStorage
export const loadState = (): SavedState | null => {
  try {
    const savedState = localStorage.getItem(STATE_KEY);
    if (!savedState) return null;
    return JSON.parse(savedState);
  } catch (error) {
    console.error('Failed to load state:', error);
    return null;
  }
};

// Clear saved state
export const clearState = (): void => {
  try {
    localStorage.removeItem(STATE_KEY);
  } catch (error) {
    console.error('Failed to clear state:', error);
  }
};

// Check if there's a saved state
export const hasSavedState = (): boolean => {
  return !!localStorage.getItem(STATE_KEY);
}; 