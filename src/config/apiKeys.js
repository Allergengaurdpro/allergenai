// API Keys Configuration
// Store your API keys here

// Google Cloud Vision API Key
// Get your key from: https://console.cloud.google.com/apis/credentials
export const GOOGLE_VISION_API_KEY = import.meta.env.VITE_GOOGLE_VISION_API_KEY || '';

// Check if API key is configured
export const hasGoogleVisionKey = () => {
  return GOOGLE_VISION_API_KEY && GOOGLE_VISION_API_KEY.length > 0 && GOOGLE_VISION_API_KEY !== 'YOUR_API_KEY_HERE';
};

// For development, you can also set it directly here (not recommended for production)
// Uncomment and replace with your key:
// export const GOOGLE_VISION_API_KEY = 'AIzaSy...your-key-here';
