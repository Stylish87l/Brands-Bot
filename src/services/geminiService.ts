import type { GenerationParams, ImageCreative, VideoCreative, Platform } from '../types';
import { resizeImage } from '../utils';

// Define a maximum dimension for images sent to the API to prevent payload size errors.
const MAX_IMAGE_DIMENSION = 1024;

// Helper to RESIZE and then convert a File object to a base64 string and its mime type.
const fileToData = async (file: File): Promise<{ data: string; mimeType: string }> => {
    // First, resize the image to a reasonable size to avoid overly large payloads.
    const resizedFile = await resizeImage(file, MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result !== 'string') {
                return reject(new Error('File could not be read as a string.'));
            }
            const base64Data = reader.result.split(',')[1];
            resolve({ data: base64Data, mimeType: resizedFile.type });
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(resizedFile);
    });
};


// A generic function to call our new serverless API endpoint.
async function callApi<T>(action: string, params: any): Promise<T> {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, params }),
    });

    // If the response is OK, we expect valid JSON.
    if (response.ok) {
        return response.json() as Promise<T>;
    }

    // If the response is not OK, handle the error.
    // Read the body as text ONCE to avoid "body stream already read" errors.
    const errorText = await response.text();
    let errorMessage = errorText; // Default to the raw text from the server response

    try {
        // Try to parse the text as JSON to get a more specific error message.
        const errorBody = JSON.parse(errorText);
        if (errorBody && errorBody.error) {
            errorMessage = errorBody.error;
        }
    } catch (e) {
        // If parsing fails, it's not JSON (e.g., an HTML error page).
        // We'll proceed with the raw errorText we already captured.
    }
    
    console.error(`API Error for action "${action}":`, errorMessage);
    throw new Error(errorMessage || `API request failed with status ${response.status}`);
}


export const removeImageBackground = async (file: File): Promise<string> => {
    try {
        const fileData = await fileToData(file);
        return await callApi<string>('removeImageBackground', { fileData });
    } catch (error) {
        console.error("Error removing image background:", error);
        throw new Error("Failed to remove background. The AI may not have been able to process this image.");
    }
};

export const stylizeProductImage = async (productPhotoFile: File, logoFile: File, colorPalette: string): Promise<string> => {
    try {
        const productPhotoData = await fileToData(productPhotoFile);
        const logoData = await fileToData(logoFile);
        return await callApi<string>('stylizeProductImage', { productPhotoData, logoData, colorPalette });
    } catch (error) {
        console.error("Error stylizing product image:", error);
        throw new Error("Failed to stylize product image. The AI may not have been able to process this request.");
    }
};


export const generateLogoVariations = async (brandName: string): Promise<string[]> => {
    if (!brandName.trim()) {
        return [];
    }
    try {
        return await callApi<string[]>('generateLogoVariations', { brandName });
    } catch (error) {
        console.error("Error generating logo variations:", error);
        throw new Error("Failed to generate logo variations. Please check your API key and network connection.");
    }
};

export const generateMascotSuggestions = async (brandName: string, productDescription: string, tone: string): Promise<string[]> => {
    const requiredInputs = { brandName, productDescription, tone };
    for (const [key, value] of Object.entries(requiredInputs)) {
        if (!value || !value.trim()) {
            throw new Error(`Cannot generate mascot suggestions without: ${key}`);
        }
    }

    try {
        return await callApi<string[]>('generateMascotSuggestions', { brandName, productDescription, tone });
    } catch (error) {
        console.error("Error generating mascot suggestions:", error);
        throw new Error("Failed to generate mascot suggestions. Please try again.");
    }
};

export const generateCampaignPromptSuggestions = async (brandName: string, tone: string): Promise<string[]> => {
    if (!brandName.trim() || !tone.trim()) {
        throw new Error("Brand Name and Tone are required to suggest campaign prompts.");
    }
    try {
        const result = await callApi<{ suggestions: string[] }>('generateCampaignPromptSuggestions', { brandName, tone });
        return result.suggestions.slice(0, 3);
    } catch (error) {
        console.error("Error generating campaign prompt suggestions:", error);
        throw new Error("Failed to generate campaign prompt suggestions.");
    }
};

export const generateTaglineSuggestions = async (productDescription: string): Promise<string[]> => {
    if (!productDescription.trim()) {
        return [];
    }
    try {
        const result = await callApi<{ suggestions: string[] }>('generateTaglineSuggestions', { productDescription });
        return result.suggestions.slice(0, 3);
    } catch (error) {
        console.error("Error generating tagline suggestions:", error);
        throw new Error("Failed to generate tagline suggestions.");
    }
};


export const generateImageCreativeForPlatform = async (params: GenerationParams, platform: Platform): Promise<ImageCreative[]> => {
    const { brandAssets, campaignDetails } = params;
    
    if (!brandAssets.logoFile || !campaignDetails.productPhotoFile) {
        throw new Error("Logo and product photo are required to generate creatives.");
    }

    // Convert files to base64 data before sending to the API
    const productPhotoData = await fileToData(campaignDetails.productPhotoFile);
    const logoData = await fileToData(brandAssets.logoFile);
    let mascotData = null;
    if (brandAssets.mascotFile) {
        mascotData = await fileToData(brandAssets.mascotFile);
    }

    // Remove file objects from payload to avoid serialization issues
    const serializableParams = {
        brandAssets: { ...brandAssets, logoFile: null, mascotFile: null },
        campaignDetails: { ...campaignDetails, productPhotoFile: null }
    };
    
    return callApi<ImageCreative[]>('generateImageCreativeForPlatform', { 
        params: serializableParams,
        platform,
        productPhotoData, 
        logoData, 
        mascotData 
    });
};


export const generateVideoCreative = async (params: GenerationParams, platform: Platform, onProgress: (message: string) => void): Promise<VideoCreative | null> => {
    const { campaignDetails } = params;

    if (!campaignDetails.productPhotoFile) {
        throw new Error("A product photo is required to generate a video.");
    }

    try {
        onProgress(`Building video prompt for ${platform.name}...`);
        const productPhotoData = await fileToData(campaignDetails.productPhotoFile);

        // Remove file objects from payload
        const serializableParams = {
            brandAssets: { ...params.brandAssets, logoFile: null, mascotFile: null },
            campaignDetails: { ...params.campaignDetails, productPhotoFile: null }
        };

        onProgress(`Starting video generation for ${platform.name}... (this may take a few minutes)`);
        
        let operation = await callApi<any>('startVideoGeneration', { params: serializableParams, productPhotoData });
        
        let pollCount = 0;
        while (!operation.done) {
            pollCount++;
            onProgress(`Checking video status for ${platform.name}... (Attempt ${pollCount})`);
            await new Promise(resolve => setTimeout(resolve, 15000)); // Poll every 15 seconds
            operation = await callApi<any>('checkVideoStatus', { operation });
        }
        
        onProgress(`Video for ${platform.name} is ready! Finalizing...`);
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

        if (!downloadLink) {
            throw new Error("Video generation completed, but no download link was provided.");
        }

        const videoDataUrl = await callApi<string>('fetchVideo', { downloadLink });
        const response = await fetch(videoDataUrl);
        const videoBlob = await response.blob();
        const videoUrl = URL.createObjectURL(videoBlob);

        return {
            id: `${platform.name.replace(/ /g, '-')}-${Date.now()}`,
            type: 'video',
            platformName: platform.name,
            videoUrl: videoUrl,
        };

    } catch (error: any) {
        console.error(`Error generating video for ${platform.name}:`, error);
        let errorMessage = "An unknown API error occurred. Please check the console.";
        if (error.message && error.message.includes('RESOURCE_EXHAUSTED')) {
            errorMessage = "API quota exceeded. Please check your plan and billing details with Google AI.";
        } else if (error.message) {
            errorMessage = error.message;
        }
        throw new Error(`Video for ${platform.name} failed: ${errorMessage}`);
    }
};