import type React from 'react';

export interface Platform {
  name: string;
  dimensions: string;
  aspectRatio: string;
  icon: string;
  isVideo?: boolean;
}

export interface BrandAssets {
  brandName: string;
  logoFile: File | null;
  mascotFile: File | null;
  colorPalette: string;
  fontStyle: string;
  tone: string;
}

export interface CampaignDetails {
  productDescription: string;
  productPhotoFile: File | null;
  preset: string;
  customPreset: string;
  platforms: Platform[];
  tagline: string;
  ctaButton?: string;
  seasonalOverlay: string;
  generateABTest: boolean;
  logoPlacement?: string;
  taglinePlacement?: string;
  mascotPlacement?: string;
  videoPrompt?: string;
  videoAspectRatio?: string;
}

export interface ImageCreative {
  id: string;
  type: 'image';
  platformName: string;
  dimensions: string;
  imageUrl: string;
  variation?: 'A' | 'B';
}

export interface VideoCreative {
    id: string;
    type: 'video';
    platformName: string;
    videoUrl: string;
    variation?: 'A' | 'B';
}

export type Creative = ImageCreative | VideoCreative;


export interface FormState {
  brandAssets: BrandAssets;
  campaignDetails: CampaignDetails;
}

export interface GenerationParams {
  brandAssets: BrandAssets;
  campaignDetails: CampaignDetails;
}