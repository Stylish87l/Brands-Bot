import React from 'react';

interface PromptSuggestionsProps {
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
  onSelect: (suggestion: string) => void;
}

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ suggestions, isLoading, error, onSelect }) => {
  if (isLoading) {
    return (
      <div className="mt-3 flex items-center justify-center p-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-md transition-colors">
        <svg className="animate-spin h-5 w-5 text-indigo-500 dark:text-indigo-400 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm text-gray-700 dark:text-gray-300">Generating ideas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 p-3 bg-red-900/10 dark:bg-red-900/20 border border-red-500 rounded-md text-sm text-red-500 dark:text-red-300">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Suggestions</h4>
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion)}
            className="w-full text-left bg-gray-100 dark:bg-gray-700 rounded-md p-2.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:ring-2 hover:ring-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            aria-label={`Use suggestion: ${suggestion}`}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PromptSuggestions;
