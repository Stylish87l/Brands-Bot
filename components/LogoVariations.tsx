import React from 'react';

interface LogoVariationsProps {
  variations: string[];
  isLoading: boolean;
  error: string | null;
  onSelect: (dataUrl: string) => void;
}

const LogoVariations: React.FC<LogoVariationsProps> = ({ variations, isLoading, error, onSelect }) => {
  if (isLoading) {
    return (
      <div className="mt-4 flex items-center justify-center p-4 bg-gray-200/50 dark:bg-gray-700/50 rounded-md transition-colors">
        <svg className="animate-spin h-5 w-5 text-indigo-500 dark:text-indigo-400 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm text-gray-700 dark:text-gray-300">Generating logo ideas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-3 bg-red-900/10 dark:bg-red-900/20 border border-red-500 rounded-md text-sm text-red-500 dark:text-red-300">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (variations.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Select a Variation</h4>
      <div className="grid grid-cols-2 gap-3">
        {variations.map((dataUrl, index) => (
          <button
            key={index}
            onClick={() => onSelect(dataUrl)}
            className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 aspect-square flex items-center justify-center ring-2 ring-transparent hover:ring-indigo-500 focus:outline-none focus:ring-indigo-500 transition-all"
            aria-label={`Select logo variation ${index + 1}`}
          >
            <img src={dataUrl} alt={`Logo Variation ${index + 1}`} className="max-w-full max-h-full object-contain" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default LogoVariations;