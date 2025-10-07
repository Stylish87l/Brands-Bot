import React, { useEffect } from 'react';
// Fix: Replaced non-existent type 'AdCreative' with the correct 'ImageCreative' type.
import type { ImageCreative } from '../types';

interface ImageModalProps {
  creative: ImageCreative;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ creative, onClose }) => {
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-title"
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-11/12 max-w-6xl max-h-[95vh] flex flex-col p-4 m-4 relative animate-zoom-in"
        onClick={e => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        <div className="flex-shrink-0 flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
          <div>
              <h2 id="image-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">{creative.platformName}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{creative.dimensions}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close image preview"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex-grow my-4 flex items-center justify-center overflow-hidden min-h-0">
          <img 
            src={creative.imageUrl} 
            alt={`Ad creative for ${creative.platformName}`} 
            className="max-w-full max-h-full object-contain"
          />
        </div>

        <div className="flex-shrink-0 pt-3 border-t border-gray-200 dark:border-gray-700">
            <a 
              href={creative.imageUrl} 
              download={`${creative.platformName.replace(/ /g, '_')}_ad.png`}
              className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center justify-center transition-all duration-200"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download Image
            </a>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;