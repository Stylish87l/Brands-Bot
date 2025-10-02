import React, { useState, useEffect } from 'react';
import type { FormState, Platform } from '../types';
import { PRESETS, FONT_STYLES, PLATFORMS, VIDEO_ASPECT_RATIOS, SOCIAL_LINKS } from '../hooks/constants';
import { generateLogoVariations, generateTaglineSuggestions } from '../services/geminiService';
import { dataUrlToFile } from '../utils';
import ImageInput from './ImageInput';
import LogoVariations from './LogoVariations';
import PromptSuggestions from './PromptSuggestions';
import MascotVariations from './MascotVariations';

// A simple component for each section
const ControlSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-4 border-b border-gray-300 dark:border-gray-700 pb-6 mb-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
    {children}
  </div>
);

interface ControlsSidebarProps {
  formState: FormState;
  setFormState: (newState: FormState | ((prevState: FormState) => FormState)) => void;
  onGenerate: () => void;
  isLoading: boolean;
  isAnythingLoading: boolean;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onRemoveBackground: () => void;
  isBgRemoving: boolean;
  bgRemoveError: string | null;
  onStylizeImage: () => void;
  isStylizing: boolean;
  stylizeError: string | null;
  onGenerateMascot: () => void;
  mascotSuggestions: string[];
  isMascotLoading: boolean;
  mascotError: string | null;
  onSelectMascot: (dataUrl: string) => void;
  onGeneratePrompt: () => void;
  promptSuggestions: string[];
  isPromptLoading: boolean;
  promptError: string | null;
  onSelectPrompt: (suggestion: string) => void;
  onClearPromptSuggestions: () => void;
}

const ControlsSidebar: React.FC<ControlsSidebarProps> = ({
  formState,
  setFormState,
  onGenerate,
  isLoading,
  isAnythingLoading,
  undo,
  redo,
  canUndo,
  canRedo,
  theme,
  toggleTheme,
  onRemoveBackground,
  isBgRemoving,
  bgRemoveError,
  onStylizeImage,
  isStylizing,
  stylizeError,
  onGenerateMascot,
  mascotSuggestions,
  isMascotLoading,
  mascotError,
  onSelectMascot,
  onGeneratePrompt,
  promptSuggestions,
  isPromptLoading,
  promptError,
  onSelectPrompt,
  onClearPromptSuggestions
}) => {
  const { brandAssets, campaignDetails } = formState;

  const [logoVariations, setLogoVariations] = useState<string[]>([]);
  const [isLogoLoading, setIsLogoLoading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const [taglineSuggestions, setTaglineSuggestions] = useState<string[]>([]);
  const [isTaglineLoading, setIsTaglineLoading] = useState(false);
  const [taglineError, setTaglineError] = useState<string | null>(null);
  
  const [isAddingCustomPrompt, setIsAddingCustomPrompt] = useState(false);

  const handleFormChange = (section: 'brandAssets' | 'campaignDetails', key: string, value: any) => {
    setFormState(prev => ({
        ...prev,
        [section]: {
            ...prev[section],
            [key]: value,
        }
    }));
  };

  const handlePlatformToggle = (platform: Platform) => {
    const isSelected = campaignDetails.platforms.some(p => p.name === platform.name);
    const newPlatforms = isSelected
      ? campaignDetails.platforms.filter(p => p.name !== platform.name)
      : [...campaignDetails.platforms, platform];
    handleFormChange('campaignDetails', 'platforms', newPlatforms);
  };

  const handleGenerateLogos = async () => {
    if (!brandAssets.brandName) {
      setLogoError("Please enter a brand name first.");
      return;
    }
    setIsLogoLoading(true);
    setLogoError(null);
    setLogoVariations([]);
    try {
      const variations = await generateLogoVariations(brandAssets.brandName);
      setLogoVariations(variations);
    } catch (e: any) {
      setLogoError(e.message || "An unknown error occurred.");
    } finally {
      setIsLogoLoading(false);
    }
  };

  const handleSelectLogoVariation = async (dataUrl: string) => {
    const file = await dataUrlToFile(dataUrl, `${brandAssets.brandName}_logo.png`);
    handleFormChange('brandAssets', 'logoFile', file);
    setLogoVariations([]);
  };
  
  const handleGenerateTaglines = async () => {
    if (!campaignDetails.productDescription) {
        setTaglineError("Please enter a product description first.");
        return;
    }
    setIsTaglineLoading(true);
    setTaglineError(null);
    setTaglineSuggestions([]);
    try {
        const suggestions = await generateTaglineSuggestions(campaignDetails.productDescription);
        setTaglineSuggestions(suggestions);
    } catch (e: any) {
        setTaglineError(e.message || "An unknown error occurred.");
    } finally {
        setIsTaglineLoading(false);
    }
  };

  const handleSelectTagline = (suggestion: string) => {
    handleFormChange('campaignDetails', 'tagline', suggestion);
    setTaglineSuggestions([]);
  };

  const hasImagePlatform = campaignDetails.platforms.some(p => !p.isVideo);
  const hasVideoPlatform = campaignDetails.platforms.some(p => p.isVideo);
  
  const hasCustomPrompt = campaignDetails.videoPrompt && campaignDetails.videoPrompt.trim().length > 0;
  const shouldShowPromptInput = isAddingCustomPrompt || hasCustomPrompt;

  useEffect(() => {
    if (!hasVideoPlatform) {
        setIsAddingCustomPrompt(false);
    }
  }, [hasVideoPlatform]);

  const handleRemoveCustomVideoPrompt = () => {
    setIsAddingCustomPrompt(false);
    handleFormChange('campaignDetails', 'videoPrompt', '');
  };

  const isFormValid = 
    brandAssets.brandName &&
    brandAssets.colorPalette &&
    brandAssets.tone &&
    campaignDetails.productDescription &&
    campaignDetails.tagline &&
    campaignDetails.platforms.length > 0 &&
    (hasImagePlatform ? !!brandAssets.logoFile : true) &&
    ((hasImagePlatform || hasVideoPlatform) ? !!campaignDetails.productPhotoFile : true);
    
  const canSuggestMascot = brandAssets.brandName && campaignDetails.productDescription && brandAssets.tone;
  const canSuggestPrompt = brandAssets.brandName && brandAssets.tone;

  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Campaign Builder</h2>
        <div className="flex items-center space-x-2">
            <button
                onClick={toggleTheme}
                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle dark mode"
            >
                {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button onClick={undo} disabled={!canUndo} className="p-1.5 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Undo">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
            </button>
            <button onClick={redo} disabled={!canRedo} className="p-1.5 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Redo">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17v-6h6"/><path d="M21 7a9 9 0 0 1-9 9 9 9 0 0 1-6-2.3L3 11"/></svg>
            </button>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onGenerate(); }} className="space-y-6">
        
        <ControlSection title="1. Brand Assets">
            <div>
                <label htmlFor="brandName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand Name</label>
                <input type="text" id="brandName" value={brandAssets.brandName} onChange={e => handleFormChange('brandAssets', 'brandName', e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
            </div>

            <ImageInput label="Brand Logo" file={brandAssets.logoFile} onFileChange={file => handleFormChange('brandAssets', 'logoFile', file)} />
            
            <button type="button" onClick={handleGenerateLogos} disabled={isLogoLoading || !brandAssets.brandName} className="w-full text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors">
              {isLogoLoading ? 'Generating...' : '✨ Generate Logo Ideas'}
            </button>
            <LogoVariations variations={logoVariations} isLoading={isLogoLoading} error={logoError} onSelect={handleSelectLogoVariation} />

            <ImageInput label="Brand Mascot (Optional)" file={brandAssets.mascotFile} onFileChange={file => handleFormChange('brandAssets', 'mascotFile', file)} />
            <button type="button" onClick={onGenerateMascot} disabled={isMascotLoading || !canSuggestMascot} className="w-full text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors" title={!canSuggestMascot ? 'Please provide Brand Name, Product Description, and Brand Tone first.' : ''}>
              {isMascotLoading ? 'Generating...' : '✨ Suggest a Mascot'}
            </button>
            <MascotVariations variations={mascotSuggestions} isLoading={isMascotLoading} error={mascotError} onSelect={onSelectMascot} />

             <div>
                <label htmlFor="colors" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand Colors</label>
                <input type="text" id="colors" placeholder="e.g. Sunset orange, deep blue" value={brandAssets.colorPalette} onChange={e => handleFormChange('brandAssets', 'colorPalette', e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
             </div>
             <div>
                <label htmlFor="font" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Font Style</label>
                <input 
                  type="text" 
                  id="font" 
                  list="font-styles-list"
                  value={brandAssets.fontStyle} 
                  onChange={e => handleFormChange('brandAssets', 'fontStyle', e.target.value)} 
                  className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="e.g., Elegant Serif"
                />
                <datalist id="font-styles-list">
                    {FONT_STYLES.map(font => <option key={font.name} value={font.name} />)}
                </datalist>
             </div>
             <div>
                <label htmlFor="tone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand Tone</label>
                <input type="text" id="tone" placeholder="e.g., Playful and energetic" value={brandAssets.tone} onChange={e => handleFormChange('brandAssets', 'tone', e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
             </div>
        </ControlSection>

        <ControlSection title="2. Campaign Details">
            <ImageInput label="Product Photo" file={campaignDetails.productPhotoFile} onFileChange={file => handleFormChange('campaignDetails', 'productPhotoFile', file)} />
            {campaignDetails.productPhotoFile && (
                <div className="mt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={onRemoveBackground} disabled={isBgRemoving || isAnythingLoading} className="w-full text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors">
                            {isBgRemoving ? 'Removing...' : '✨ Remove Background'}
                        </button>
                        <button type="button" onClick={onStylizeImage} disabled={isStylizing || !brandAssets.logoFile || isAnythingLoading} title={!brandAssets.logoFile ? 'Please upload a brand logo first' : ''} className="w-full text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors">
                            {isStylizing ? 'Stylizing...' : '🎨 Stylize Product'}
                        </button>
                    </div>
                    {bgRemoveError && <p className="text-red-500 text-xs mt-2">{bgRemoveError}</p>}
                    {stylizeError && <p className="text-red-500 text-xs mt-2">{stylizeError}</p>}
                </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Description</label>
                  <button type="button" onClick={onGeneratePrompt} disabled={isPromptLoading || !canSuggestPrompt} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed" title={!canSuggestPrompt ? 'Please provide Brand Name and Tone first.' : ''}>
                    {isPromptLoading ? 'Thinking...' : '✨ Suggest'}
                  </button>
              </div>
              <textarea 
                id="description" 
                rows={3} 
                value={campaignDetails.productDescription} 
                onChange={e => {
                  handleFormChange('campaignDetails', 'productDescription', e.target.value);
                  if (promptSuggestions.length > 0) {
                    onClearPromptSuggestions();
                  }
                }} 
                className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
              <PromptSuggestions suggestions={promptSuggestions} isLoading={isPromptLoading} error={promptError} onSelect={onSelectPrompt} />
            </div>

            <div>
              <label htmlFor="tagline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tagline / Headline</label>
              <input type="text" id="tagline" value={campaignDetails.tagline} onChange={e => handleFormChange('campaignDetails', 'tagline', e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
              <button type="button" onClick={handleGenerateTaglines} disabled={isTaglineLoading || !campaignDetails.productDescription} className="w-full mt-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors">
                {isTaglineLoading ? 'Generating...' : '✨ Suggest Taglines'}
              </button>
              <PromptSuggestions suggestions={taglineSuggestions} isLoading={isTaglineLoading} error={taglineError} onSelect={handleSelectTagline} />
            </div>

            <div>
                <label htmlFor="ctaButton" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CTA Button Text (Optional)</label>
                <input type="text" id="ctaButton" placeholder="e.g., Shop Now, Learn More" value={campaignDetails.ctaButton} onChange={e => handleFormChange('campaignDetails', 'ctaButton', e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
            </div>

            <div>
              <label htmlFor="preset" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visual Preset</label>
              <select id="preset" value={campaignDetails.preset} onChange={e => handleFormChange('campaignDetails', 'preset', e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                {PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {campaignDetails.preset === 'Custom' && (
              <div>
                <label htmlFor="customPreset" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custom Preset Description</label>
                <input type="text" id="customPreset" placeholder="e.g., A dark, moody, cinematic style" value={campaignDetails.customPreset} onChange={e => handleFormChange('campaignDetails', 'customPreset', e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Platforms</label>
              <div className="space-y-2">
                {PLATFORMS.map(p => {
                  const isSelected = campaignDetails.platforms.some(sp => sp.name === p.name);
                  return (
                    <button 
                      key={p.name} 
                      type="button" 
                      onClick={() => handlePlatformToggle(p)} 
                      className={`w-full flex items-center justify-between p-3 rounded-md text-sm transition-all border ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-500 ring-1 ring-indigo-500' : 'bg-gray-100 dark:bg-gray-700/50 border-transparent hover:border-gray-400 dark:hover:border-gray-500'}`}
                      role="checkbox"
                      aria-checked={isSelected}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-gray-600 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: p.icon }} />
                            <div className="text-left">
                                <span className="font-semibold block text-gray-900 dark:text-white">{p.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{p.dimensions}</span>
                            </div>
                        </div>
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-700'}`}>
                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {hasVideoPlatform && (
              <div className="pt-2 space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video Aspect Ratio</label>
                      <div className="grid grid-cols-3 gap-2">
                          {VIDEO_ASPECT_RATIOS.map(ratio => {
                              const isSelected = campaignDetails.videoAspectRatio === ratio.value;
                              return (
                                  <button
                                      key={ratio.value}
                                      type="button"
                                      onClick={() => handleFormChange('campaignDetails', 'videoAspectRatio', ratio.value)}
                                      className={`w-full text-center p-2 rounded-md text-sm transition-all border ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-500 ring-1 ring-indigo-500' : 'bg-gray-100 dark:bg-gray-700/50 border-transparent hover:border-gray-400 dark:hover:border-gray-500'}`}
                                  >
                                      <span className="font-semibold block text-gray-900 dark:text-white">{ratio.name}</span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">{ratio.value}</span>
                                  </button>
                              )
                          })}
                      </div>
                  </div>
                  <div>
                    {!shouldShowPromptInput ? (
                        <button
                            type="button"
                            onClick={() => setIsAddingCustomPrompt(true)}
                            className="w-full text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors"
                        >
                            ✨ Add Custom Video Prompt
                        </button>
                    ) : (
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="videoPrompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Custom Video Prompt</label>
                                <button type="button" onClick={handleRemoveCustomVideoPrompt} className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline">
                                    Remove
                                </button>
                            </div>
                            <textarea
                                id="videoPrompt"
                                rows={4}
                                placeholder="Describe the video scene and actions. e.g., 'A dynamic shot of the product spinning on a pedestal, with confetti falling around it.'"
                                value={campaignDetails.videoPrompt || ''}
                                onChange={e => handleFormChange('campaignDetails', 'videoPrompt', e.target.value)}
                                className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">If blank, a prompt is auto-generated. If filled, this will completely override the auto-generated prompt.</p>
                        </div>
                    )}
                  </div>
              </div>
            )}

             <div>
                <label htmlFor="seasonal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seasonal Overlay (Optional)</label>
                <input type="text" id="seasonal" placeholder="e.g., Christmas, Summer Sale" value={campaignDetails.seasonalOverlay} onChange={e => handleFormChange('campaignDetails', 'seasonalOverlay', e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
             </div>
        </ControlSection>

        <ControlSection title="3. Creative Direction (Optional)">
            <div>
                <label htmlFor="logoPlacement" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo Placement</label>
                <input type="text" id="logoPlacement" placeholder="e.g., Top-left corner" value={campaignDetails.logoPlacement} onChange={e => handleFormChange('campaignDetails', 'logoPlacement', e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
            </div>
            <div>
                <label htmlFor="taglinePlacement" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tagline Placement</label>
                <input type="text" id="taglinePlacement" placeholder="e.g., Centered at the bottom" value={campaignDetails.taglinePlacement} onChange={e => handleFormChange('campaignDetails', 'taglinePlacement', e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
            </div>
            {brandAssets.mascotFile && (
                 <div>
                    <label htmlFor="mascotPlacement" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mascot Placement</label>
                    <input type="text" id="mascotPlacement" placeholder="e.g., Peeking from the right side" value={campaignDetails.mascotPlacement} onChange={e => handleFormChange('campaignDetails', 'mascotPlacement', e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
                </div>
            )}
        </ControlSection>

        <ControlSection title="4. Generation Settings">
          <div className="bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
                <label htmlFor="abTest" className="flex-grow cursor-pointer">
                    <span className="font-semibold text-gray-900 dark:text-white block">Generate A/B Test Variations</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Creates two distinct versions for each image creative.</span>
                </label>
                <div className="flex-shrink-0">
                    <input
                        type="checkbox"
                        id="abTest"
                        checked={campaignDetails.generateABTest}
                        onChange={e => handleFormChange('campaignDetails', 'generateABTest', e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                </div>
            </div>
          </div>
        </ControlSection>

        <div className="pt-4 sticky bottom-0 bg-white dark:bg-gray-800 pb-2">
          <button type="submit" disabled={!isFormValid || isAnythingLoading} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200">
            {isLoading ? (
                <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
                </>
            ) : '🚀 Generate Campaign'}
          </button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-300 dark:border-gray-700">
        <div className="flex justify-center items-center space-x-6">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              title={social.name}
              aria-label={`Follow us on ${social.name}`}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <span dangerouslySetInnerHTML={{ __html: social.icon }} />
            </a>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ControlsSidebar;