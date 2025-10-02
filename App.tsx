import React, { useState, useCallback } from 'react';
import ControlsSidebar from './components/ControlsSidebar';
import ResultsDisplay from './components/ResultsDisplay';
import { useTheme } from './components/ThemeContext';
import { generateAdCreatives, removeImageBackground, stylizeProductImage, generateMascotSuggestions, generateVideoCreative, generateCampaignPromptSuggestions } from './services/geminiService';
import type { Creative, FormState } from './types';
import { PLATFORMS } from './hooks/constants';
import useHistoryState from './hooks/useHistoryState';
import ImageModal from './components/ImageModal';
import VideoModal from './components/VideoModal';
import { dataUrlToFile } from './utils';

const INITIAL_FORM_STATE: FormState = {
  brandAssets: {
    brandName: '',
    logoFile: null,
    mascotFile: null,
    colorPalette: 'Vibrant orange, sleek black, and clean white',
    fontStyle: 'Modern Sans-Serif',
    tone: '',
  },
  campaignDetails: {
    productDescription: '',
    productPhotoFile: null,
    preset: 'Minimal Luxe',
    customPreset: '',
    platforms: [PLATFORMS[0], PLATFORMS[1]], // Default to first two platforms
    tagline: '',
    ctaButton: '',
    seasonalOverlay: '',
    generateABTest: false,
    logoPlacement: '',
    taglinePlacement: '',
    mascotPlacement: '',
    videoPrompt: '',
    videoAspectRatio: '16:9',
  }
};

function App() {
  const { theme, toggleTheme } = useTheme();
  
  const {
    state: formState,
    setState: setFormState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistoryState<FormState>(INITIAL_FORM_STATE);

  const { brandAssets, campaignDetails } = formState;

  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [viewingCreative, setViewingCreative] = useState<Creative | null>(null);

  const [isBgRemoving, setIsBgRemoving] = useState(false);
  const [bgRemoveError, setBgRemoveError] = useState<string | null>(null);
  
  const [isStylizing, setIsStylizing] = useState(false);
  const [stylizeError, setStylizeError] = useState<string | null>(null);

  const [mascotSuggestions, setMascotSuggestions] = useState<string[]>([]);
  const [isMascotLoading, setIsMascotLoading] = useState(false);
  const [mascotError, setMascotError] = useState<string | null>(null);
  
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
  const [isPromptLoading, setIsPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setCreatives([]);

    try {
        const imagePlatforms = campaignDetails.platforms.filter(p => !p.isVideo);
        const videoPlatforms = campaignDetails.platforms.filter(p => p.isVideo);

        const allPromises = [];

        if (imagePlatforms.length > 0) {
            setLoadingMessage('Generating image creatives...');
            const imageParams = { brandAssets, campaignDetails: { ...campaignDetails, platforms: imagePlatforms } };
            allPromises.push(generateAdCreatives(imageParams));
        }

        if (videoPlatforms.length > 0) {
            const videoParams = { brandAssets, campaignDetails };
            for (const platform of videoPlatforms) {
                allPromises.push(generateVideoCreative(videoParams, platform, (msg) => setLoadingMessage(msg)));
            }
        }
        
        const results = await Promise.allSettled(allPromises);
        
        const successfulCreatives: Creative[] = [];
        const failedReasons: string[] = [];

        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                if (Array.isArray(result.value)) {
                    successfulCreatives.push(...result.value.filter(c => c !== null) as Creative[]);
                } else if (result.value) {
                    successfulCreatives.push(result.value as Creative);
                }
            } else if (result.status === 'rejected') {
                failedReasons.push(result.reason.message || 'A generation task failed.');
            }
        });
        
        if (successfulCreatives.length > 0) {
            setLoadingMessage(`Generated ${successfulCreatives.length} creatives! Finalizing...`);
            
            const sortedCreatives = successfulCreatives.sort((a, b) => {
                if (a.platformName < b.platformName) return -1;
                if (a.platformName > b.platformName) return 1;
                // if platform is same, sort by variation. 'A' comes first.
                // A creative without a variation is treated as 'A' for sorting purposes.
                const variationA = a.variation || 'A';
                const variationB = b.variation || 'B';
                return variationA.localeCompare(variationB);
            });

            await new Promise(res => setTimeout(res, 500));
            setCreatives(sortedCreatives);
        }

        if (failedReasons.length > 0) {
            const errorMessage = `Generation finished with ${failedReasons.length} error(s): ${failedReasons.join('; ')}`;
            setError(errorMessage);
            if (successfulCreatives.length === 0) {
                setCreatives([]);
            }
        } else if (successfulCreatives.length === 0) {
             setError("Generation completed, but the AI did not return any valid creatives. Please try adjusting your prompt or inputs.");
        }

    } catch (e: any) {
      console.error("Generation failed:", e);
      setError(e.message || 'An unknown error occurred during generation.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [brandAssets, campaignDetails]);


  const handleRemoveBackground = async () => {
    if (!campaignDetails.productPhotoFile) return;

    setIsBgRemoving(true);
    setBgRemoveError(null);
    try {
        const dataUrl = await removeImageBackground(campaignDetails.productPhotoFile);
        const newFile = await dataUrlToFile(dataUrl, 'product_photo_no_bg.png');
        setFormState(prev => ({
            ...prev,
            campaignDetails: {
                ...prev.campaignDetails,
                productPhotoFile: newFile,
            }
        }));
    } catch(e: any) {
        setBgRemoveError(e.message || "An unknown error occurred.");
    } finally {
        setIsBgRemoving(false);
    }
  };

  const handleStylizeProductImage = async () => {
    if (!campaignDetails.productPhotoFile || !brandAssets.logoFile) return;

    setIsStylizing(true);
    setStylizeError(null);
    try {
        const dataUrl = await stylizeProductImage(campaignDetails.productPhotoFile, brandAssets.logoFile, brandAssets.colorPalette);
        const newFile = await dataUrlToFile(dataUrl, 'product_photo_stylized.png');
        setFormState(prev => ({
            ...prev,
            campaignDetails: {
                ...prev.campaignDetails,
                productPhotoFile: newFile,
            }
        }));
    } catch(e: any) {
        setStylizeError(e.message || "An unknown error occurred.");
    } finally {
        setIsStylizing(false);
    }
  };

  const handleGenerateMascotSuggestions = async () => {
    setIsMascotLoading(true);
    setMascotError(null);
    setMascotSuggestions([]);
    try {
        const suggestions = await generateMascotSuggestions(brandAssets.brandName, campaignDetails.productDescription, brandAssets.tone);
        setMascotSuggestions(suggestions);
    } catch (e: any) {
        setMascotError(e.message || "An unknown error occurred.");
    } finally {
        setIsMascotLoading(false);
    }
  };

  const handleSelectMascotSuggestion = async (dataUrl: string) => {
    const file = await dataUrlToFile(dataUrl, 'suggested_mascot.png');
    setFormState(prev => ({
        ...prev,
        brandAssets: {
            ...prev.brandAssets,
            mascotFile: file,
        }
    }));
    setMascotSuggestions([]);
  };

  const handleGeneratePromptSuggestions = async () => {
    setIsPromptLoading(true);
    setPromptError(null);
    setPromptSuggestions([]);
    try {
        const suggestions = await generateCampaignPromptSuggestions(brandAssets.brandName, brandAssets.tone);
        setPromptSuggestions(suggestions);
    } catch (e: any) {
        setPromptError(e.message || "An unknown error occurred.");
    } finally {
        setIsPromptLoading(false);
    }
  };

  const handleSelectPromptSuggestion = (suggestion: string) => {
      setFormState(prev => ({
          ...prev,
          campaignDetails: {
              ...prev.campaignDetails,
              productDescription: suggestion,
          }
      }));
      setPromptSuggestions([]);
  };

  const clearPromptSuggestions = () => setPromptSuggestions([]);

  const handleViewCreative = (creative: Creative) => {
    setViewingCreative(creative);
  };

  const handleCloseModal = () => {
    setViewingCreative(null);
  };

  return (
    <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 transition-colors`}>
      <div className="w-[450px] flex-shrink-0 shadow-2xl z-10 h-screen">
        <ControlsSidebar 
            formState={formState}
            setFormState={setFormState}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            isAnythingLoading={isLoading || !!viewingCreative || isBgRemoving || isStylizing || isMascotLoading || isPromptLoading}
            undo={undo}
            redo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            theme={theme}
            toggleTheme={toggleTheme}
            onRemoveBackground={handleRemoveBackground}
            isBgRemoving={isBgRemoving}
            bgRemoveError={bgRemoveError}
            onStylizeImage={handleStylizeProductImage}
            isStylizing={isStylizing}
            stylizeError={stylizeError}
            onGenerateMascot={handleGenerateMascotSuggestions}
            mascotSuggestions={mascotSuggestions}
            isMascotLoading={isMascotLoading}
            mascotError={mascotError}
            onSelectMascot={handleSelectMascotSuggestion}
            onGeneratePrompt={handleGeneratePromptSuggestions}
            promptSuggestions={promptSuggestions}
            isPromptLoading={isPromptLoading}
            promptError={promptError}
            onSelectPrompt={handleSelectPromptSuggestion}
            onClearPromptSuggestions={clearPromptSuggestions}
        />
      </div>

      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Generated Campaign</h1>
        </div>

        <ResultsDisplay 
            creatives={creatives}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            error={error}
            brandAssets={brandAssets}
            campaignDetails={campaignDetails}
            onRetry={handleGenerate}
            onViewCreative={handleViewCreative}
        />
      </main>

      {viewingCreative && viewingCreative.type === 'image' && (
        <ImageModal 
          creative={viewingCreative}
          onClose={handleCloseModal}
        />
      )}
       {viewingCreative && viewingCreative.type === 'video' && (
        <VideoModal
          creative={viewingCreative}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default App;