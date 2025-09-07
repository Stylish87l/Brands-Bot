import React from 'react';
import type { Creative, BrandAssets, CampaignDetails, ImageCreative, VideoCreative } from '../types';

interface AdCreativeCardProps {
  creative: ImageCreative;
  onView: () => void;
}

const AdCreativeCard: React.FC<AdCreativeCardProps> = ({ creative, onView }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg dark:shadow-2xl animate-fade-in transition-colors group">
      <div className="p-3 bg-gray-100 dark:bg-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">{creative.platformName}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{creative.dimensions}</p>
      </div>
      <button 
        onClick={onView} 
        className="w-full p-2 bg-gray-50 dark:bg-gray-900 aspect-w-1 aspect-h-1 block focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-b-md"
        aria-label={`View larger image for ${creative.platformName}`}
      >
        <img src={creative.imageUrl} alt={`Ad for ${creative.platformName}`} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200" />
      </button>
    </div>
  );
};

interface VideoCreativeCardProps {
    creative: VideoCreative;
    onView: () => void;
}
  
const VideoCreativeCard: React.FC<VideoCreativeCardProps> = ({ creative, onView }) => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg dark:shadow-2xl animate-fade-in transition-colors group">
        <div className="p-3 bg-gray-100 dark:bg-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">{creative.platformName}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Video</p>
        </div>
        <button 
          onClick={onView} 
          className="w-full p-2 bg-gray-50 dark:bg-gray-900 aspect-w-16 aspect-h-9 block focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-b-md"
          aria-label={`View video for ${creative.platformName}`}
        >
          <video src={creative.videoUrl} loop muted autoPlay playsInline className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
        </button>
      </div>
    );
};


interface ResultsDisplayProps {
  creatives: Creative[];
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  brandAssets: BrandAssets;
  campaignDetails: CampaignDetails;
  onRetry: () => void;
  onViewCreative: (creative: Creative) => void;
}

const SummaryItem: React.FC<{label: string, value?: string}> = ({label, value}) => (
  value ? <div className="bg-gray-200 dark:bg-gray-700/50 rounded px-2 py-1 text-xs transition-colors">
    <span className="font-semibold text-gray-500 dark:text-gray-400">{label}: </span>
    <span className="text-gray-800 dark:text-gray-200">{value}</span>
  </div> : null
);

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ creatives, isLoading, loadingMessage, error, brandAssets, campaignDetails, onRetry, onViewCreative }) => {
  const hasResults = creatives.length > 0;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center h-full">
          <svg className="animate-spin h-12 w-12 text-indigo-500 dark:text-indigo-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Generating Your Campaign...</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">{loadingMessage || 'Initializing creative engine...'}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center text-center h-full bg-red-900/10 dark:bg-red-900/20 border border-red-400 dark:border-red-500 rounded-lg p-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mb-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Generation Failed</h2>
            <p className="text-red-500 dark:text-red-300 mt-2 max-w-md mb-6">{error}</p>
            <button
              onClick={onRetry}
              className="bg-indigo-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-indigo-700 flex items-center justify-center transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
              Retry Generation
            </button>
        </div>
      );
    }
    
    if (!hasResults && !isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center h-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 dark:text-gray-600 mb-4"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M21 12H3"/><path d="M12 3v18"/></svg>
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Your Campaign Creatives Will Appear Here</h2>
          <p className="text-gray-500 mt-2">Fill out the details on the left and click "Generate Campaign".</p>
        </div>
      );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {creatives.map(creative => {
              if (creative.type === 'image') {
                return <AdCreativeCard key={creative.id} creative={creative} onView={() => onViewCreative(creative)} />;
              }
              if (creative.type === 'video') {
                return <VideoCreativeCard key={creative.id} creative={creative} onView={() => onViewCreative(creative)} />;
              }
              return null;
            })}
        </div>
    );
  };
  
  return (
    <div className="w-full h-full flex flex-col">
        {hasResults && (
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Campaign Summary</h2>
                <div className="flex flex-wrap gap-2">
                    <SummaryItem label="Preset" value={campaignDetails.preset} />
                    <SummaryItem label="Tone" value={brandAssets.tone} />
                    <SummaryItem label="Tagline" value={campaignDetails.tagline} />
                    <SummaryItem label="Seasonal" value={campaignDetails.seasonalOverlay} />
                </div>
            </div>
        )}
        <div className="flex-grow">
            {renderContent()}
        </div>
    </div>
  );
};

export default ResultsDisplay;