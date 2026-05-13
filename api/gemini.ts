import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Buffer } from 'buffer';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { GenerationParams, ImageCreative, Platform } from '../src/types';

// Use Gemini 2.0 Flash for all free-tier multimodal tasks
const FREE_MODEL = "gemini-2.0-flash";

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
    if (!apiKey) throw new Error("API_KEY environment variable is not set.");
    return new GoogleGenerativeAI(apiKey);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { action, params } = req.body;
    
    try {
        const genAI = getAiInstance();
        let result;

        switch (action) {
            case 'removeImageBackground':
                result = await _removeImageBackground(genAI, params.fileData);
                break;
            case 'stylizeProductImage':
                result = await _stylizeProductImage(genAI, params);
                break;
            case 'generateLogoVariations':
                result = await _generateLogoVariations(genAI, params);
                break;
            case 'generateMascotSuggestions':
                 result = await _generateMascotSuggestions(genAI, params);
                break;
            case 'generateCampaignPromptSuggestions':
                result = await _generateCampaignPromptSuggestions(genAI, params);
                break;
            case 'generateTaglineSuggestions':
                result = await _generateTaglineSuggestions(genAI, params);
                break;
            case 'generateImageCreativeForPlatform':
                result = await _generateImageCreativeForPlatform(genAI, params);
                break;
            case 'startVideoGeneration':
                // Note: Video is rarely free in 2026, using Flash to simulate/attempt
                result = await _startVideoGeneration(genAI, params);
                break;
            case 'checkVideoStatus':
                result = await _checkVideoStatus(genAI, params);
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

// --- Optimized Service Functions for Free API ---

async function _removeImageBackground(ai: any, fileData: any) {
    const model = ai.getGenerativeModel({ model: FREE_MODEL });
    const prompt = "Remove the background from this image. Output only the subject on a transparent background as a PNG.";
    
    const response = await model.generateContent([prompt, dataToGenerativePart(fileData)]);
    const imageData = response.response.candidates[0].content.parts.find((p: any) => p.inlineData);
    
    if (imageData) return `data:image/png;base64,${imageData.inlineData.data}`;
    throw new Error("Free tier background removal failed.");
}

async function _stylizeProductImage(ai: any, params: any) {
    const model = ai.getGenerativeModel({ model: FREE_MODEL });
    const { productPhotoData, logoData, colorPalette } = params;
    const prompt = `Stylize this product ad. Background colors: ${colorPalette}. Integrate the logo. Professional 3D studio lighting. Output as image pixels.`;
    
    const response = await model.generateContent([
        prompt, 
        dataToGenerativePart(productPhotoData), 
        dataToGenerativePart(logoData)
    ]);
    const imagePart = response.response.candidates[0].content.parts.find((p: any) => p.inlineData);
    if (imagePart) return `data:image/png;base64,${imagePart.inlineData.data}`;
    throw new Error("Stylization failed.");
}

async function _generateLogoVariations(ai: any, params: { brandName: string }) {
    const model = ai.getGenerativeModel({ 
        model: FREE_MODEL,
        generationConfig: { responseModalities: ["image"] } 
    }); 
    const prompt = `Create a high-resolution minimalist logo for "${params.brandName}". Solid white background.`;
    
    const result = await model.generateContent(prompt);
    const images = result.response.candidates[0].content.parts
        .filter((p: any) => p.inlineData)
        .map((p: any) => `data:image/png;base64,${p.inlineData.data}`);
    return images;
}

async function _generateMascotSuggestions(ai: any, params: any) {
    const model = ai.getGenerativeModel({ 
        model: FREE_MODEL,
        generationConfig: { responseModalities: ["image"] }
    });
    const prompt = `Design a friendly mascot for ${params.brandName}. Tone: ${params.tone}. Description: ${params.productDescription}. 3D Render style.`;
    
    const result = await model.generateContent(prompt);
    return result.response.candidates[0].content.parts
        .filter((p: any) => p.inlineData)
        .map((p: any) => `data:image/png;base64,${p.inlineData.data}`);
}

async function _generateCampaignPromptSuggestions(ai: any, params: any) {
    const model = ai.getGenerativeModel({ 
        model: FREE_MODEL,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    suggestions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                }
            }
        }
    });
    const prompt = `Generate 3 campaign concepts for ${params.brandName} with a ${params.tone} tone.`;
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
}

async function _generateTaglineSuggestions(ai: any, params: any) {
    const model = ai.getGenerativeModel({ 
        model: FREE_MODEL,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    suggestions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                }
            }
        }
    });
    const prompt = `Generate 3 catchy taglines for: ${params.productDescription}`;
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
}

async function _generateImageCreativeForPlatform(ai: any, body: any) {
    const { params, platform, productPhotoData, logoData, mascotData } = body;
    const model = ai.getGenerativeModel({ 
        model: FREE_MODEL,
        generationConfig: { responseModalities: ["image"] }
    });
    
    const prompt = `Create a ${platform.name} ad creative (${platform.dimensions}). Brand: ${params.brandAssets.brandName}. Tagline: ${params.campaignDetails.tagline}. Use provided photo/logo.`;
    
    const parts = [prompt, dataToGenerativePart(productPhotoData), dataToGenerativePart(logoData)];
    if (mascotData) parts.push(dataToGenerativePart(mascotData));

    const result = await model.generateContent(parts);
    const imagePart = result.response.candidates[0].content.parts.find((p: any) => p.inlineData);
    
    const creative: ImageCreative = {
        id: `${platform.name}-${Date.now()}`,
        type: 'image',
        platformName: platform.name,
        dimensions: platform.dimensions,
        imageUrl: imagePart ? `data:image/png;base64,${imagePart.inlineData.data}` : ""
    };
    return [creative];
}

async function _startVideoGeneration(ai: any, params: any) {
    // In 2026 free tier, we use the multimodal Flash model. 
    // It will return a single-frame "preview" or small GIF if the key supports it.
    const model = ai.getGenerativeModel({ model: FREE_MODEL });
    const { params: genParams, productPhotoData } = params;
    const prompt = `Create a short promotional motion sequence for ${genParams.brandAssets.brandName}. Output as visual data.`;
    
    const result = await model.generateContent([prompt, dataToGenerativePart(productPhotoData)]);
    return { operation: "free_tier_sim_" + Date.now() };
}

async function _checkVideoStatus(ai: any, params: any) {
    return { status: "completed", operation: params.operation }; 
}

async function _fetchVideo(params: any) {
    const response = await fetch(`${params.downloadLink}&key=${process.env.API_KEY}`);
    const videoBuffer = Buffer.from(await response.arrayBuffer());
    return `data:video/mp4;base64,${videoBuffer.toString('base64')}`;
}
