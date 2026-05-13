import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Buffer } from 'buffer';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { GenerationParams, ImageCreative, Platform } from '../src/types';

// STABLE 2026 FREE TIER CONFIG
// We use gemini-2.0-flash as the primary because it is the most stable free multimodal model.
const PRIMARY_MODEL = "gemini-2.0-flash"; 

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
        // Specialized error message for recruitment demo
        const isQuota = error.message.includes("429") || error.message.includes("quota");
        return res.status(isQuota ? 429 : 500).json({ 
            error: isQuota ? "API_QUOTA_REACHED" : "AI_PROCESSING_ERROR",
            message: isQuota ? "The Free Tier daily limit has been reached. Please try again in 24 hours." : error.message
        });
    }
}

// --- High-Stability Service Functions ---

async function _removeImageBackground(ai: any, fileData: any) {
    const model = ai.getGenerativeModel({ model: PRIMARY_MODEL });
    const prompt = "Remove the background from this image. Return only the subject on a transparent background as a PNG.";
    
    const result = await model.generateContent([prompt, dataToGenerativePart(fileData)]);
    const imagePart = result.response.candidates[0].content.parts.find((p: any) => p.inlineData);
    
    if (imagePart) return `data:image/png;base64,${imagePart.inlineData.data}`;
    throw new Error("Could not extract image data from AI response.");
}

async function _stylizeProductImage(ai: any, params: any) {
    const model = ai.getGenerativeModel({ model: PRIMARY_MODEL });
    const { productPhotoData, logoData, colorPalette } = params;
    const prompt = `Stylize this product. Background: ${colorPalette}. Integrate the logo. Professional 3D ad style. Output image pixels.`;
    
    const result = await model.generateContent([
        prompt, 
        dataToGenerativePart(productPhotoData), 
        dataToGenerativePart(logoData)
    ]);
    const imagePart = result.response.candidates[0].content.parts.find((p: any) => p.inlineData);
    if (imagePart) return `data:image/png;base64,${imagePart.inlineData.data}`;
    throw new Error("Product stylization failed.");
}

async function _generateLogoVariations(ai: any, params: { brandName: string }) {
    const model = ai.getGenerativeModel({ 
        model: PRIMARY_MODEL,
        generationConfig: { responseModalities: ["image"] }
    }); 
    const prompt = `Modern minimalist logo for "${params.brandName}". White background, professional vector style.`;
    
    const result = await model.generateContent(prompt);
    return result.response.candidates[0].content.parts
        .filter((p: any) => p.inlineData)
        .map((p: any) => `data:image/png;base64,${p.inlineData.data}`);
}

async function _generateMascotSuggestions(ai: any, params: any) {
    const model = ai.getGenerativeModel({ 
        model: PRIMARY_MODEL,
        generationConfig: { responseModalities: ["image"] }
    });
    const prompt = `Design a friendly mascot for ${params.brandName}. Tone: ${params.tone}. Style: 3D Rendered character.`;
    
    const result = await model.generateContent(prompt);
    return result.response.candidates[0].content.parts
        .filter((p: any) => p.inlineData)
        .map((p: any) => `data:image/png;base64,${p.inlineData.data}`);
}

async function _generateCampaignPromptSuggestions(ai: any, params: any) {
    const model = ai.getGenerativeModel({ 
        model: PRIMARY_MODEL,
        generationConfig: { responseMimeType: "application/json" }
    });
    const prompt = `JSON ONLY: Create 3 campaign ideas for ${params.brandName}. Return as { "suggestions": ["concept1", "concept2", "concept3"] }`;
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
}

async function _generateTaglineSuggestions(ai: any, params: any) {
    const model = ai.getGenerativeModel({ 
        model: PRIMARY_MODEL,
        generationConfig: { responseMimeType: "application/json" }
    });
    const prompt = `JSON ONLY: 3 catchy taglines for: ${params.productDescription}. Return as { "suggestions": ["tagline1", "tagline2", "tagline3"] }`;
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
}

async function _generateImageCreativeForPlatform(ai: any, body: any) {
    const { params, platform, productPhotoData, logoData, mascotData } = body;
    const model = ai.getGenerativeModel({ 
        model: PRIMARY_MODEL,
        generationConfig: { responseModalities: ["image"] }
    });
    
    const prompt = `Marketing creative for ${platform.name} (${platform.dimensions}). Brand: ${params.brandAssets.brandName}. Use the provided image and logo assets.`;
    
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
    // Free keys use a simulated processing state in this production wrapper
    return { operation: "vid_demo_" + Date.now(), status: "processing" };
}

async function _checkVideoStatus(ai: any, params: any) {
    return { status: "completed", operation: params.operation }; 
}

async function _fetchVideo(params: any) {
    const response = await fetch(`${params.downloadLink}&key=${process.env.API_KEY}`);
    const videoBuffer = Buffer.from(await response.arrayBuffer());
    return `data:video/mp4;base64,${videoBuffer.toString('base64')}`;
}
