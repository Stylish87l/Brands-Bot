# AI Ad Factory (Brand-Bot)

An AI-powered creative engine that transforms one product photo and a brand guide into a complete, multi-platform ad campaign in seconds. This application leverages the Google Gemini API to generate a wide array of marketing assets, including images and videos, tailored to your specific brand identity.

## ✨ Features

- **AI Campaign Generation**: Automatically create a diverse set of ad creatives for various platforms from a single set of inputs.
- **Multi-Platform Support**: Generate assets perfectly sized for platforms like Instagram (Carousel, Story), TikTok, LinkedIn, and even out-of-home Billboards.
- **Video Generation**: Create short, engaging promotional videos with animated text and motion graphics using the `veo-2.0-generate-001` model.
- **Brand Asset Management**: Define your brand with a logo, mascot, color palette, font style, and brand tone.
- **AI-Powered Creative Tools**:
  - **Logo Variations**: Generate multiple logo concepts based on your brand name.
  - **Mascot Suggestions**: Get AI-generated mascot ideas based on your brand and product.
  - **Background Removal**: Instantly remove the background from your product photos.
  - **Product Stylization**: Re-imagine your product photo with a new background based on your brand colors and logo.
  - **Tagline & Prompt Suggestions**: Overcome creative block with AI-generated ideas for taglines and campaign descriptions.
- **Detailed Creative Control**:
  - **Visual Presets**: Choose from predefined styles like 'Minimal Luxe' or define your own 'Custom' aesthetic.
  - **Asset Placement**: Provide specific instructions on where to place your logo, tagline, and mascot.
  - **Seasonal Overlays**: Add a seasonal touch to your campaigns (e.g., "Christmas Sale").
- **Enhanced User Experience**:
  - **Dark/Light Mode**: Switch between themes for your comfort.
  - **Undo/Redo History**: Freely experiment with settings, knowing you can easily go back and forth.
  - **Full-Screen Viewer**: Click on any creative to view it in a large modal with download options.
  - **Intuitive UI**: A clean, responsive interface with visual icons and clear controls.

## 🚀 Tech Stack

- **Frontend**: [React](https://reactjs.org/) with [TypeScript](https://www.typescriptlang.org/)
- **AI Model**: [Google Gemini API](https://ai.google.dev/) (`@google/genai`)
  - `gemini-2.5-flash`: For text and JSON-based generation (suggestions).
  - `gemini-2.5-flash-image-preview`: For advanced image editing tasks (background removal, stylization, ad creative generation).
  - `imagen-4.0-generate-001`: For generating new images from text (logos, mascots).
  - `veo-2.0-generate-001`: For generating video content.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Bundling/Imports**: ES Modules via `importmap`.

## ⚙️ Setup and Running

This project is designed to be run in an environment where the Google Gemini API key is securely managed as an environment variable.

1.  **API Key**:
    - The application requires a Google Gemini API key to function.
    - It is configured to read the key from `process.env.API_KEY`.
    - You must set this environment variable in your development environment (e.g., via a `.env` file if using a local server, or as a secret in a cloud environment).

2.  **Installation**:
    - No `npm install` is required for dependencies, as they are loaded via an `importmap` from a CDN.

3.  **Running**:
    - Serve the `index.html` file using any static file server.
    - Open the provided URL in your browser. The application will start immediately.

## 🤖 How It Works

1.  **Input**: The user provides brand assets (name, logo, colors, etc.) and campaign details (product photo, description, target platforms) through the sidebar.
2.  **AI Services**: When the "Generate Campaign" button is clicked, the application makes calls to the `geminiService.ts`.
3.  **Prompt Engineering**: The service dynamically constructs detailed prompts for each selected platform, combining the user's text inputs and image files into a multi-modal request for the Gemini API.
4.  **API Calls**: It calls the appropriate Gemini models for each task (e.g., `gemini-2.5-flash-image-preview` for images, `veo-2.0-generate-001` for video). Video generation involves an asynchronous polling mechanism to check for completion.
5.  **Results**: The generated images (as base64 data URLs) and videos (as blob URLs) are returned to the main `App` component.
6.  **Display**: The `ResultsDisplay` component renders the final creatives in a grid, allowing the user to view and download their new ad campaign.
