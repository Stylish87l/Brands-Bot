import type { VercelRequest, VercelResponse } from '@vercel/node';
// Fix: Import Buffer to resolve TypeScript error in a Node.js environment where Buffer is available but types may not be globally recognized.
import { Buffer } from 'buffer';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { GenerationParams, ImageCreative } from '../src/types';

// Helper to convert base64 data from the client into the format the GenAI SDK expects.
const dataToGenerativePart = (fileData: { data: string; mimeType: string }) => {
    return {
        inlineData: {
            data: fileData.data,
            mimeType: fileData.mimeType,
        },
    };
};

const getAiInstance = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable is not set.");
    }
    return new GoogleGenAI({ apiKey });
};

// Main handler for all API requests from the frontend.
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { action, params } = req.body;
    
    try {
        const ai = getAiInstance();
        let result;

        switch (action) {
            case 'removeImageBackground':
                result = await _removeImageBackground(ai, params.fileData);
                break;
            case 'stylizeProductImage':
                result = await _stylizeProductImage(ai, params);
                break;
            case 'generateLogoVariations':
                result = await _generateLogoVariations(ai, params);
                break;
            case 'generateMascotSuggestions':
                 result = await _generateMascotSuggestions(ai, params);
                break;
            case 'generateCampaignPromptSuggestions':
                result = await _generateCampaignPromptSuggestions(ai, params);
                break;
            case 'generateTaglineSuggestions':
                result = await _generateTaglineSuggestions(ai, params);
                break;
            case 'generateAdCreatives':
                result = await _generateAdCreatives(ai, params);
                break;
            case 'startVideoGeneration':
                result = await _startVideoGeneration(ai, params);
                break;
            case 'checkVideoStatus':
                result = await _checkVideoStatus(ai, params);
                break;
            case 'fetchVideo':
                result = await _fetchVideo(params);
                break;
            default:
                return res.status(400).json({ error: `Unknown action: ${action}` });
        }
        return res.status(200).json(result);
    } catch (error: any) {
        console.error(`Error in action "${action}":`, error.message);
        return res.status(500).json({ error: error.message || 'An internal server error occurred.' });
    }
}


// Service function implementations, adapted for the serverless environment.

async function _removeImageBackground(ai: GoogleGenAI, fileData: any) {
    const imagePart = dataToGenerativePart(fileData);
    const textPart = { text: "Expertly remove the background from this image, leaving only the main subject. The new background should be transparent. Output only the final image." };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    const outputImagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (outputImagePart?.inlineData) {
        return `data:image/png;base64,${outputImagePart.inlineData.data}`;
    }
    throw new Error("The AI did not return an image.");
}

async function _stylizeProductImage(ai: GoogleGenAI, params: any) {
    const { productPhotoData, logoData, colorPalette } = params;
    const productPhotoPart = dataToGenerativePart(productPhotoData);
    const logoPart = dataToGenerativePart(logoData);
    const textPart = { text: `Take the primary product from the first image and place it on a new, clean, abstract background inspired by the color palette: "${colorPalette}". Tastefully integrate the logo from the second image into the scene. The product should be the main focus and remain crisp and clear. The final image should look like a professional product advertisement shot. Output only the final image.` };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [productPhotoPart, logoPart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    const outputImagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (outputImagePart?.inlineData) {
        return `data:image/png;base64,${outputImagePart.inlineData.data}`;
    }
    throw new Error("The AI did not return a stylized image.");
}

async function _generateLogoVariations(ai: GoogleGenAI, params: { brandName: string }) {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A modern, clean, minimalist logo for a brand named "${params.brandName}", on a transparent background.`,
        config: { numberOfImages: 4, outputMimeType: 'image/png', aspectRatio: '1:1' },
    });
    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
}

async function _generateMascotSuggestions(ai: GoogleGenAI, params: { brandName: string; productDescription: string; tone: string }) {
    const prompt = `A friendly, modern mascot for a brand named "${params.brandName}". The brand's tone is "${params.tone}" and they sell "${params.productDescription}". The mascot should be a unique character, not a logo. Generate 4 distinct options on a transparent background.`;
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: { numberOfImages: 4, outputMimeType: 'image/png', aspectRatio: '1:1' },
    });
    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
}

const jsonResponseSchema = (itemType: string, itemDescription: string) => ({
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING, description: itemDescription },
            description: `An array of three ${itemType} suggestions.`,
        }
    },
    required: ["suggestions"],
});

async function _generateCampaignPromptSuggestions(ai: GoogleGenAI, params: { brandName: string; tone: string }) {
    const prompt = `Based on a brand named "${params.brandName}" with a "${params.tone}" tone, generate 3 creative and distinct campaign concepts. Each concept should be a short, engaging description (1-2 sentences) suitable for a marketing campaign prompt. Focus on the core message or angle.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: jsonResponseSchema("campaign prompt", "A creative campaign prompt suggestion."),
        }
    });
    return JSON.parse(response.text.trim());
}

async function _generateTaglineSuggestions(ai: GoogleGenAI, params: { productDescription: string }) {
    const prompt = `Based on the product description "${params.productDescription}", generate 3 creative and distinct taglines for an ad campaign. The taglines should be short, catchy, and memorable.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: jsonResponseSchema("tagline", "A catchy tagline suggestion."),
        }
    });
    return JSON.parse(response.text.trim());
}

async function _generateAdCreatives(ai: GoogleGenAI, body: { params: GenerationParams; productPhotoData: any; logoData: any; mascotData: any; }) {
    const { params, productPhotoData, logoData, mascotData } = body;
    const { brandAssets, campaignDetails } = params;
    
    const visualStyle = campaignDetails.preset === 'Custom' ? campaignDetails.customPreset : campaignDetails.preset;

    const creativePromises = campaignDetails.platforms.map(async (platform): Promise<(ImageCreative | null)[]> => {
        const baseRequestParts = [dataToGenerativePart(productPhotoData), dataToGenerativePart(logoData)];
        if (mascotData) baseRequestParts.push(dataToGenerativePart(mascotData));
        
        const baseTextPrompt = `Create a visually stunning ad creative for ${platform.name} (${platform.dimensions}).
- **Brand:** ${brandAssets.brandName}
- **Product:** ${campaignDetails.productDescription}
- **Key Visuals:** Use the provided product photo as the main focus. Integrate the provided logo tastefully. ${mascotData ? 'Also, creatively include the brand mascot.' : ''}
- **Tagline:** "${campaignDetails.tagline}"
- **Color Palette:** The primary colors should be inspired by this palette description: ${brandAssets.colorPalette}.
- **Font Style:** Use a ${brandAssets.fontStyle} font for the text.
- **Tone & Style:** The overall feel should be ${brandAssets.tone}. The aesthetic should align with the '${visualStyle}' preset.
- **Seasonal Element (if any):** ${campaignDetails.seasonalOverlay || 'None'}
`;
        let tempPrompt = baseTextPrompt; // Use a temporary variable to build the final prompt.
        if (campaignDetails.ctaButton) tempPrompt += `- **Call-to-Action:** Creatively incorporate a call-to-action button or text with the message: "${campaignDetails.ctaButton}".\n`;
        if (campaignDetails.logoPlacement) tempPrompt += `- **Logo Placement:** ${campaignDetails.logoPlacement}.\n`;
        if (campaignDetails.taglinePlacement) tempPrompt += `- **Tagline Placement:** ${campaignDetails.taglinePlacement}.\n`;
        if (mascotData && campaignDetails.mascotPlacement) tempPrompt += `- **Mascot Placement:** ${campaignDetails.mascotPlacement}.\n`;
        
        const finalInstruction = `- **Composition:** Ensure all elements are well-balanced for the ${platform.aspectRatio} aspect ratio. The final image should be clean, professional, and eye-catching. Do not include any placeholder text like "Your text here". The output must be just the final image.`;
        
        const generateSingleCreative = async (variation?: 'A' | 'B'): Promise<ImageCreative | null> => {
            let textPrompt = tempPrompt;
            if (variation === 'B') textPrompt += `- **A/B Test Instruction:** This is 'Variation B'. Create a distinctly different version from the primary creative. Experiment with a different layout, background style, color emphasis, or call-to-action placement. Be bold and creative to provide a clear alternative for testing.\n`;
            textPrompt += finalInstruction;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [...baseRequestParts, { text: textPrompt }] },
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
            });
            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (imagePart?.inlineData) {
                return {
                    id: `${platform.name.replace(/ /g, '-')}-${variation || 'A'}-${Date.now()}`,
                    type: 'image', platformName: platform.name, dimensions: platform.dimensions,
                    imageUrl: `data:image/png;base64,${imagePart.inlineData.data}`,
                    ...(variation && { variation }),
                };
            }
            return null;
        };

        if (campaignDetails.generateABTest) return await Promise.all([generateSingleCreative('A'), generateSingleCreative('B')]);
        return [await generateSingleCreative()];
    });

    const nestedResults = await Promise.all(creativePromises);
    return nestedResults.flat().filter((c): c is ImageCreative => c !== null);
}

// --- Video Generation Functions ---

async function _startVideoGeneration(ai: GoogleGenAI, params: any) {
    const { params: generationParams, productPhotoData } = params;
    const { brandAssets, campaignDetails } = generationParams;
    const visualStyle = campaignDetails.preset === 'Custom' ? campaignDetails.customPreset : campaignDetails.preset;
    
    let prompt = campaignDetails.videoPrompt?.trim() || 
        `Create a short, 10-15 second promotional video for a ${brandAssets.brandName} product.
- **Product:** ${campaignDetails.productDescription}. The provided image is the star.
- **Aspect Ratio:** ${campaignDetails.videoAspectRatio || '16:9'}.
- **Tone:** ${brandAssets.tone}.
- **Style:** The aesthetic should be '${visualStyle}'. Use motion graphics inspired by the brand colors: "${brandAssets.colorPalette}".
- **Tagline:** Feature the tagline "${campaignDetails.tagline}" as animated text using a ${brandAssets.fontStyle} style font.
- **Pacing:** The video should be dynamic and engaging, suitable for social media.
${campaignDetails.ctaButton ? `- **Call-to-Action:** The video must conclude with a clear call-to-action featuring the text: "${campaignDetails.ctaButton}".` : ''}`;

    return ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt,
        image: { imageBytes: productPhotoData.data, mimeType: productPhotoData.mimeType },
        config: { numberOfVideos: 1 }
    });
}

async function _checkVideoStatus(ai: GoogleGenAI, params: any) {
    return ai.operations.getVideosOperation({ operation: params.operation });
}

async function _fetchVideo(params: any) {
    const { downloadLink } = params;
    const apiKey = process.env.API_KEY;
    const response = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);
    const videoArrayBuffer = await response.arrayBuffer();
    const videoBuffer = Buffer.from(videoArrayBuffer);
    return `data:video/mp4;base64,${videoBuffer.toString('base64')}`;
}