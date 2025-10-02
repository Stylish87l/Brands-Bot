import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { GenerationParams, ImageCreative, VideoCreative, Platform } from '../types';

// Per guidelines, API key must be from process.env.API_KEY
const apiKey = process.env.API_KEY;
if (!apiKey) {
    // This is a fallback for development; in a real app, you'd want a more robust setup.
    // For this project, we assume process.env.API_KEY is configured.
    console.error("API_KEY environment variable is not set.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

/**
 * Converts a File object to a GoogleGenerativeAI.Part object.
 * @param file The file to convert.
 * @returns A promise that resolves to a generative part.
 */
const fileToGenerativePart = async (file: File) => {
    const base64EncodedData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: base64EncodedData,
            mimeType: file.type,
        },
    };
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = (reader.result as string).split(',')[1];
        resolve(result);
      };
      reader.onerror = error => reject(error);
    });
};


export const removeImageBackground = async (file: File): Promise<string> => {
    try {
        const imagePart = await fileToGenerativePart(file);
        const textPart = { text: "Expertly remove the background from this image, leaving only the main subject. The new background should be transparent. Output only the final image." };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            }
        });

        const outputImagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

        if (outputImagePart && outputImagePart.inlineData) {
            return `data:image/png;base64,${outputImagePart.inlineData.data}`;
        }

        throw new Error("The AI did not return an image. Please try again.");

    } catch (error) {
        console.error("Error removing image background:", error);
        throw new Error("Failed to remove background. The AI may not have been able to process this image.");
    }
};

export const stylizeProductImage = async (productPhotoFile: File, logoFile: File, colorPalette: string): Promise<string> => {
    try {
        const productPhotoPart = await fileToGenerativePart(productPhotoFile);
        const logoPart = await fileToGenerativePart(logoFile);
        const textPart = { text: `Take the primary product from the first image and place it on a new, clean, abstract background inspired by the color palette: "${colorPalette}". Tastefully integrate the logo from the second image into the scene. The product should be the main focus and remain crisp and clear. The final image should look like a professional product advertisement shot. Output only the final image.` };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [productPhotoPart, logoPart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            }
        });

        const outputImagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

        if (outputImagePart && outputImagePart.inlineData) {
            return `data:image/png;base64,${outputImagePart.inlineData.data}`;
        }

        throw new Error("The AI did not return a stylized image. Please try again.");

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
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `A modern, clean, minimalist logo for a brand named "${brandName}", on a transparent background.`,
            config: {
                numberOfImages: 4,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });
        
        return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
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
        const prompt = `A friendly, modern mascot for a brand named "${brandName}". The brand's tone is "${tone}" and they sell "${productDescription}". The mascot should be a unique character, not a logo. Generate 4 distinct options on a transparent background.`;
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt,
            config: {
                numberOfImages: 4,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });
        
        return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
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
        const prompt = `Based on a brand named "${brandName}" with a "${tone}" tone, generate 3 creative and distinct campaign concepts. Each concept should be a short, engaging description (1-2 sentences) suitable for a marketing campaign prompt. Focus on the core message or angle.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: "A creative campaign prompt suggestion."
                            },
                            description: "An array of three campaign prompt suggestions."
                        }
                    },
                    required: ["suggestions"]
                }
            }
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        
        if (result && Array.isArray(result.suggestions)) {
            return result.suggestions.slice(0, 3);
        }
        
        console.warn("Could not parse suggestions from Gemini response:", jsonStr);
        return [];
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
        const prompt = `Based on the product description "${productDescription}", generate 3 creative and distinct taglines for an ad campaign. The taglines should be short, catchy, and memorable.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: "A catchy tagline suggestion."
                            },
                            description: "An array of three tagline suggestions."
                        }
                    },
                    required: ["suggestions"]
                }
            }
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        
        if (result && Array.isArray(result.suggestions)) {
            return result.suggestions.slice(0, 3);
        }
        
        console.warn("Could not parse suggestions from Gemini response:", jsonStr);
        return [];
    } catch (error) {
        console.error("Error generating tagline suggestions:", error);
        throw new Error("Failed to generate tagline suggestions.");
    }
};


export const generateAdCreatives = async (params: GenerationParams): Promise<ImageCreative[]> => {
    const { brandAssets, campaignDetails } = params;
    const imagePlatforms = campaignDetails.platforms.filter(p => !p.isVideo);

    if (imagePlatforms.length === 0) return [];
    
    if (!brandAssets.logoFile || !campaignDetails.productPhotoFile) {
        throw new Error("Logo and product photo are required to generate creatives.");
    }

    const visualStyle = campaignDetails.preset === 'Custom' && campaignDetails.customPreset
        ? campaignDetails.customPreset
        : campaignDetails.preset;

    const creativePromises = imagePlatforms.map(async (platform): Promise<(ImageCreative | null)[]> => {
        try {
            const baseRequestParts: any[] = [];
            
            const productPhotoPart = await fileToGenerativePart(campaignDetails.productPhotoFile!);
            baseRequestParts.push(productPhotoPart);

            const logoPart = await fileToGenerativePart(brandAssets.logoFile!);
            baseRequestParts.push(logoPart);
            
            if (brandAssets.mascotFile) {
                const mascotPart = await fileToGenerativePart(brandAssets.mascotFile);
                baseRequestParts.push(mascotPart);
            }
            
            let baseTextPrompt = `Create a visually stunning ad creative for ${platform.name} (${platform.dimensions}).
- **Brand:** ${brandAssets.brandName}
- **Product:** ${campaignDetails.productDescription}
- **Key Visuals:** Use the provided product photo as the main focus. Integrate the provided logo tastefully. ${brandAssets.mascotFile ? 'Also, creatively include the brand mascot.' : ''}
- **Tagline:** "${campaignDetails.tagline}"
- **Color Palette:** The primary colors should be inspired by this palette description: ${brandAssets.colorPalette}.
- **Font Style:** Use a ${brandAssets.fontStyle} font for the text.
- **Tone & Style:** The overall feel should be ${brandAssets.tone}. The aesthetic should align with the '${visualStyle}' preset.
- **Seasonal Element (if any):** ${campaignDetails.seasonalOverlay || 'None'}
`;

            if (campaignDetails.ctaButton) {
                baseTextPrompt += `- **Call-to-Action:** Creatively incorporate a call-to-action button or text with the message: "${campaignDetails.ctaButton}".\n`;
            }
            if (campaignDetails.logoPlacement) {
                baseTextPrompt += `- **Logo Placement:** ${campaignDetails.logoPlacement}.\n`;
            }
            if (campaignDetails.taglinePlacement) {
                baseTextPrompt += `- **Tagline Placement:** ${campaignDetails.taglinePlacement}.\n`;
            }
            if (brandAssets.mascotFile && campaignDetails.mascotPlacement) {
                baseTextPrompt += `- **Mascot Placement:** ${campaignDetails.mascotPlacement}.\n`;
            }

            const finalInstruction = `- **Composition:** Ensure all elements are well-balanced for the ${platform.aspectRatio} aspect ratio. The final image should be clean, professional, and eye-catching. Do not include any placeholder text like "Your text here". The output must be just the final image.`;
            
            const generateSingleCreative = async (variation?: 'A' | 'B'): Promise<ImageCreative | null> => {
                let textPrompt = baseTextPrompt;
                if (variation === 'B') {
                    textPrompt += `- **A/B Test Instruction:** This is 'Variation B'. Create a distinctly different version from the primary creative. Experiment with a different layout, background style, color emphasis, or call-to-action placement. Be bold and creative to provide a clear alternative for testing.\n`;
                }
                textPrompt += finalInstruction;

                const requestParts = [...baseRequestParts, { text: textPrompt }];

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image-preview',
                    contents: { parts: requestParts },
                    config: {
                        responseModalities: [Modality.IMAGE, Modality.TEXT],
                    }
                });
    
                const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

                if (imagePart && imagePart.inlineData) {
                    const base64ImageBytes = imagePart.inlineData.data;
                    const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                    return {
                        id: `${platform.name.replace(/ /g, '-')}-${variation || 'A'}-${Date.now()}`,
                        type: 'image',
                        platformName: platform.name,
                        dimensions: platform.dimensions,
                        imageUrl: imageUrl,
                        ...(variation && { variation }),
                    };
                }
                console.warn(`No image part found in response for ${platform.name}`);
                return null;
            };
            
            if (campaignDetails.generateABTest) {
                const results = await Promise.all([generateSingleCreative('A'), generateSingleCreative('B')]);
                return results;
            } else {
                return [await generateSingleCreative()];
            }

        } catch (error) {
            console.error(`Error generating creative for ${platform.name}:`, error);
            return [null, null];
        }
    });

    const nestedResults = await Promise.all(creativePromises);
    const results = nestedResults.flat();
    const successfulCreatives = results.filter((c): c is ImageCreative => c !== null);
    
    return successfulCreatives;
};


export const generateVideoCreative = async (params: GenerationParams, platform: Platform, onProgress: (message: string) => void): Promise<VideoCreative | null> => {
    const { brandAssets, campaignDetails } = params;

    if (!campaignDetails.productPhotoFile) {
        throw new Error("A product photo is required to generate a video.");
    }

    const visualStyle = campaignDetails.preset === 'Custom' && campaignDetails.customPreset
        ? campaignDetails.customPreset
        : campaignDetails.preset;
    
    try {
        onProgress(`Building video prompt for ${platform.name}...`);
        
        let prompt: string;

        if (campaignDetails.videoPrompt && campaignDetails.videoPrompt.trim()) {
            prompt = campaignDetails.videoPrompt.trim();
        } else {
            prompt = `Create a short, 10-15 second promotional video for a ${brandAssets.brandName} product.
- **Product:** ${campaignDetails.productDescription}. The provided image is the star.
- **Aspect Ratio:** ${campaignDetails.videoAspectRatio || '16:9'}.
- **Tone:** ${brandAssets.tone}.
- **Style:** The aesthetic should be '${visualStyle}'. Use motion graphics inspired by the brand colors: "${brandAssets.colorPalette}".
- **Tagline:** Feature the tagline "${campaignDetails.tagline}" as animated text using a ${brandAssets.fontStyle} style font.
- **Pacing:** The video should be dynamic and engaging, suitable for social media.`;
            
            if (campaignDetails.ctaButton) {
                prompt += `\n- **Call-to-Action:** The video must conclude with a clear call-to-action featuring the text: "${campaignDetails.ctaButton}".`;
            }
        }

        onProgress(`Starting video generation for ${platform.name}... (this may take a few minutes)`);
        
        let operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt,
            image: {
                imageBytes: await fileToBase64(campaignDetails.productPhotoFile),
                mimeType: campaignDetails.productPhotoFile.type,
            },
            config: {
                numberOfVideos: 1,
            }
        });
        
        let pollCount = 0;
        while (!operation.done) {
            pollCount++;
            onProgress(`Checking video status for ${platform.name}... (Attempt ${pollCount})`);
            await new Promise(resolve => setTimeout(resolve, 15000)); // Poll every 15 seconds
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        
        onProgress(`Video for ${platform.name} is ready! Finalizing...`);
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

        if (!downloadLink) {
            throw new Error("Video generation completed, but no download link was provided.");
        }

        // The response.body contains the MP4 bytes. You must append an API key.
        const response = await fetch(`${downloadLink}&key=${apiKey}`);
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