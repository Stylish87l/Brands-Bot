# AI Ad Factory (Brand-Bot)

An AI-powered creative engine that transforms one product photo and a brand guide into a complete, multi-platform ad campaign in seconds. This application leverages the Google Gemini API to generate a wide array of marketing assets, including images and videos, tailored to your specific brand identity.

## ✨ Features

- **Holistic Campaign Generation**: Automatically create a diverse set of ad creatives from a single set of inputs, ensuring brand consistency across all assets.
- **Multi-Platform Support**: Generate assets tailored for various ad placements, including:
  - X (formerly Twitter)
  - Instagram Story
  - TikTok Poster
  - LinkedIn Banner
  - Billboard / Out-of-Home (OOH)
  - Promotional Videos
- **AI-Powered Creative Suite**:
  - **Logo Generation**: Instantly create modern, clean logo variations from just a brand name.
  - **Mascot Creation**: Get unique, AI-generated mascot ideas based on your brand's personality and product.
  - **Intelligent Image Editing**:
    - **Background Removal**: Seamlessly remove the background from your product photos for a clean, professional look.
    - **Product Stylization**: Reimagine your product photo with a new, brand-aligned background and integrated logo.
  - **Copywriting Assistance**: Overcome creative block with AI-generated suggestions for campaign descriptions and taglines.
- **Deep Creative Control**:
  - **Visual Presets**: Choose from predefined styles like 'Minimal Luxe' or define your own 'Custom' aesthetic.
  - **A/B Testing**: Generate two distinct visual variations for image ads to test campaign effectiveness.
  - **Asset Placement Guidance**: Provide specific instructions on where to place your logo, tagline, and mascot.
  - **Seasonal Overlays**: Easily add a seasonal touch to your campaigns (e.g., "Summer Sale," "Holiday Special").
- **Advanced Video Generation**:
  - Create short, engaging promotional videos using the `veo-2.0-generate-001` model.
  - Control aspect ratio (16:9, 9:16, 1:1) to fit any platform.
  - Use a custom prompt for fine-grained control over the video's scene and narrative.
- **Enhanced User Experience**:
  - **Dark/Light Mode**: Switch between themes for visual comfort.
  - **State History**: Freely experiment with settings using Undo/Redo functionality.
  - **Interactive Viewer**: Click any creative to open a full-screen modal with a direct download link.
  - **Intuitive UI**: A clean, responsive interface that guides you through the campaign creation process.

## 📸 Screenshots

| Instagram Story Ad                                  | TikTok Poster Ad                                |
| --------------------------------------------------- | ----------------------------------------------- |
| ![Instagram Story Ad](./docs/instagram-story.png)   | ![TikTok Poster Ad](./docs/tiktok-poster.png)   |

| LinkedIn Banner Ad                                  | Billboard/OOH Ad                                |
| --------------------------------------------------- | ----------------------------------------------- |
| ![LinkedIn Banner Ad](./docs/linkedin-banner.png)   | ![Billboard/OOH Ad](./docs/billboard-ooh.png)   |


## 🎥 Live Demo / Video Walkthrough

See the AI Ad Factory in action! This video walkthrough demonstrates the process from input to a fully generated campaign:

**[➡️ Watch the Demo Video](./docs/demo.mp4)**

*(Note: To view the demo, you must first replace the placeholder `docs/demo.mp4` with your own screen recording of the application.)*


## 🚀 Getting Started & Deployment

This project is designed for deployment on [Vercel](https://vercel.com).

1.  **Fork and Clone**: Fork this repository and clone it to your local machine.
2.  **Vercel Project**: Create a new project on Vercel and link it to your forked GitHub repository.
3.  **API Key**:
    - The application requires a Google Gemini API key to function.
    - In your Vercel project settings, go to "Environment Variables".
    - Add a new environment variable named `API_KEY` and paste your Google Gemini API key as the value.
4.  **Deployment**:
    - Vercel will automatically detect the project setup. When you push to your repository's main branch, Vercel will trigger a deployment.
    - During the build, Vercel will run `npm install` to install the backend dependencies listed in `package.json` and deploy the serverless function from the `/api` directory.
    - The frontend will be served as a static site.
5.  **Local Development (Optional)**:
    - Install the [Vercel CLI](https://vercel.com/docs/cli).
    - Run `vercel dev` in the project root. The Vercel CLI will replicate the cloud environment, including handling the serverless function and environment variables (which you can define in a local `.env.local` file).

## ⚙️ Tech Stack

- **Frontend**: [React](https://reactjs.org/) with [TypeScript](https://www.typescriptlang.org/)
- **Backend**: [Vercel Serverless Function](https://vercel.com/docs/functions/serverless-functions) (Node.js)
- **AI Model**: [Google Gemini API](https://ai.google.dev/) (`@google/genai`)
  - `gemini-2.5-flash`: For text and JSON-based generation (suggestions).
  - `gemini-2.5-flash-image`: For advanced image editing and core ad creative generation.
  - `imagen-4.0-generate-001`: For generating new images from text (logos, mascots).
  - `veo-2.0-generate-001`: For generating high-quality video content.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Frontend Dependencies**: Loaded via ES Modules `importmap` from a CDN.
- **Backend Dependencies**: Managed via `package.json`.

## 🤖 Technical Overview

1.  **Frontend**: The user interacts with a React single-page application. All UI logic is handled client-side (`ControlsSidebar.tsx`, `App.tsx`).
2.  **API Proxy**: Instead of calling the Google Gemini API directly from the browser, the frontend sends requests to a secure serverless function at `/api/gemini` (`services/geminiService.ts`).
3.  **Backend (Serverless Function)**: The Vercel function in `api/gemini.ts` receives requests from the frontend. It securely accesses the `API_KEY` from environment variables, initializes the `@google/genai` SDK, and forwards the request to the appropriate Google Gemini API model.
4.  **Prompt Engineering**: The backend function dynamically constructs detailed, multi-modal prompts for each selected platform. It combines the user's text inputs and image files (received as base64) into structured requests for the Gemini API.
5.  **Response Handling**: The generated images (as base64 data URLs) and videos (fetched from a temporary URI and returned as base64) are sent from the serverless function back to the `App.tsx` component.
6.  **Display**: The `ResultsDisplay.tsx` component renders the final creatives in a responsive grid, allowing the user to view and download their new ad campaign assets.