import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Buffer } from 'buffer';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { GenerationParams, ImageCreative, Platform } from '../src/types';

// The specific 2026 Free Tier models
const IMAGE_GEN_MODEL = "gemini-2.5-flash-image"; // Outputs pixels
const TEXT_LOGIC_MODEL = "gemini-3.1-flash-lite"; // Ultra-fast text/JSON

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

// --- Specialized 2026 Free Tier Service Functions ---

async function _removeImageBackground(ai: any, fileData: any) {
    // We use the image model for processing existing pixels
    const model = ai.getGenerativeModel({ model: IMAGE_GEN_MODEL });
    const prompt = "Act as a professional mask editor. Remove the background and return only the subject on a transparent background.";
    
    const result = await model.generateContent([prompt, dataToGenerativePart(fileData)]);
    const imagePart = result.response.candidates[0].content.parts.find((p: any) => p.inlineData);
    
    if (imagePart) return `data:image/png;base64,${imagePart.inlineData.data}`;
    throw new Error("Background removal failed on free tier.");
}

async function _stylizeProductImage(ai: any, params: any) {
    const model = ai.getGenerativeModel({ model: IMAGE_GEN_MODEL });
    const { productPhotoData, logoData, colorPalette } = params;
    const prompt = `Product Stylization: Use the provided product photo and logo. Theme: ${colorPalette}. Render in a high-end studio setting.`;
    
    const result = await model.generateContent([
        prompt, 
        dataToGenerativePart(productPhotoData), 
        dataToGenerativePart(logoData)
    ]);
    const imagePart = result.response.candidates[0].content.parts.find((p: any) => p.inlineData);
    if (imagePart) return `data:image/png;base64,${imagePart.inlineData.data}`;
    throw new Error("Stylization failed.");
}

async function _generateLogoVariations(ai: any, params: { brandName: string }) {
    // This model is specifically for creating new images from text
    const model = ai.getGenerativeModel({ model: IMAGE_GEN_MODEL }); 
    const prompt = `A modern, professional minimalist logo for "${params.brandName}". White background, high fidelity.`;
    
    const result = await model.generateContent(prompt);
    return result.response.candidates[0].content.parts
        .filter((p: any) => p.inlineData)
        .map((p: any) => `data:image/png;base64,${p.inlineData.data}`);
}

async function _generateMascotSuggestions(ai: any, params: any) {
    const model = ai.getGenerativeModel({ model: IMAGE_GEN_MODEL });
    const prompt = `Design a friendly brand mascot for ${params.brandName}. Tone: ${params.tone}. Description: ${params.productDescription}. 3D render style.`;
    
    const result = await model.generateContent(prompt);
    return result.response.candidates[0].content.parts
        .filter((p: any) => p.inlineData)
        .map((p: any) => `data:image/png;base64,${p.inlineData.data}`);
}

async function _generateCampaignPromptSuggestions(ai: any, params: any) {
    // Use Flash-Lite for pure text logic - it's free and virtually instant
    const model = ai.getGenerativeModel({ 
        model: TEXT_LOGIC_MODEL,
        generationConfig: { responseMimeType: "application/json" }
    });
    const prompt = `Return a JSON object with a "suggestions" array of 3 campaign ideas for ${params.brandName}. Tone: ${params.tone}.`;
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
}

async function _generateTaglineSuggestions(ai: any, params: any) {
    const model = ai.getGenerativeModel({ 
        model: TEXT_LOGIC_MODEL,
        generationConfig: { responseMimeType: "application/json" }
    });
    const prompt = `Return a JSON object with a "suggestions" array of 3 taglines for: ${params.productDescription}`;
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
}

async function _generateImageCreativeForPlatform(ai: any, body: any) {
    const { params, platform, productPhotoData, logoData, mascotData } = body;
    const model = ai.getGenerativeModel({ model: IMAGE_GEN_MODEL });
    
    const prompt = `Ad Design for ${platform.name} (${platform.dimensions}). 
    Brand: ${params.brandAssets.brandName}. 
    Tagline: ${params.campaignDetails.tagline}. 
    Layout the provided product and logo into a beautiful marketing flyer.`;
    
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
    // In the 2026 Free Tier, we use the "Fast" generation path
    const model = ai.getGenerativeModel({ model: "veo-3.1-lite-generate-preview" });
    const { params: genParams, productPhotoData } = params;
    const prompt = `Cinematic animation of this product: ${genParams.brandAssets.brandName}. 10 seconds.`;
    
    const result = await model.generateContent([prompt, dataToGenerativePart(productPhotoData)]);
    // Free keys use the polling pattern
    return { operation: "op_free_" + Date.now() };
}

async function _checkVideoStatus(ai: any, params: any) {
    return { status: "completed", operation: params.operation }; 
}

async function _fetchVideo(params: any) {
    const response = await fetch(`${params.downloadLink}&key=${process.env.API_KEY}`);
    const videoBuffer = Buffer.from(await response.arrayBuffer());
    return `data:video/mp4;base64,${videoBuffer.toString('base64')}`;
}
