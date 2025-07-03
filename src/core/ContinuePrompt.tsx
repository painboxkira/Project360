import React from 'react';

interface ContinuePromptProps {
  onContinue: () => void;
  onStartOver: () => void;
  lastSaved?: Date;
}

const ContinuePrompt: React.FC<ContinuePromptProps> = ({ onContinue, onStartOver, lastSaved }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Continue Progress?</h2>
        
        <p className="text-gray-600 mb-4">
          Would you like to continue where you left off?
          {lastSaved && (
            <span className="block text-sm mt-1">
              Last saved: {new Date(lastSaved).toLocaleString()}
            </span>
          )}
        </p>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onStartOver}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Start Over
          </button>
          <button
            onClick={onContinue}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContinuePrompt; 