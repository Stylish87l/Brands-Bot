import type { Platform } from './types';

export const PRESETS: string[] = [
  'Urban Gen Z',
  'Minimal Luxe',
  'Afro-Futurist',
  'Retro Pop',
  'Custom',
];

export const FONT_STYLES: { name: string; description: string }[] = [
  { name: 'Modern Sans-Serif', description: 'Clean, geometric, and minimalist.' },
  { name: 'Elegant Serif', description: 'Classic, sophisticated, and high-contrast.' },
  { name: 'Bold Display', description: 'Heavy, impactful, and attention-grabbing.' },
  { name: 'Playful Script', description: 'Casual, handwritten, and friendly.' },
  { name: 'Tech Grotesk', description: 'Futuristic, digital, and slightly quirky.' },
  { name: 'Retro Slab', description: 'Vintage, blocky, and confident.' },
];

export const PLATFORMS: Platform[] = [
  { 
    name: 'Instagram Carousel', 
    dimensions: '1080x1080', 
    aspectRatio: '1:1',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>'
  },
  { 
    name: 'Instagram Story', 
    dimensions: '1080x1920', 
    aspectRatio: '9:16',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>'
  },
  { 
    name: 'TikTok Poster', 
    dimensions: '1080x1920', 
    aspectRatio: '9:16',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>'
  },
  { 
    name: 'Promotional Video',
    dimensions: '10-15 seconds',
    aspectRatio: '16:9',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>',
    isVideo: true
  },
  { 
    name: 'LinkedIn Banner', 
    dimensions: '1584x396', 
    aspectRatio: '4:1',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>'
  },
  { 
    name: 'Billboard/OOH', 
    dimensions: '6000x3000', 
    aspectRatio: '2:1',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="12" rx="2" ry="2"></rect><line x1="12" y1="15" x2="12" y2="21"></line><line x1="8" y1="21" x2="16" y2="21"></line></svg>'
  },
];