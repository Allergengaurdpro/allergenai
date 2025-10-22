// OCR Service for extracting text from images
//
// TRIPLE-TIER APPROACH (Gemini → Google Vision → Tesseract):
// 1. PRIMARY: Gemini 2.0 Flash ($0.02/1K images, context-aware allergen detection)
// 2. FALLBACK: Google Cloud Vision API (98% text accuracy, $1.50/1K images)
// 3. FINAL FALLBACK: Tesseract.js (60-85% accuracy, offline, free)
//
// Setup Instructions:
// 1. Get a Gemini API key: https://aistudio.google.com/app/apikey
//    Add to .env: VITE_GEMINI_API_KEY=your_key_here
// 2. (Optional) Get Google Vision key: https://console.cloud.google.com/apis/credentials
//    Add to .env: VITE_GOOGLE_VISION_API_KEY=your_key_here
//
// The service automatically tries Gemini first (best for allergens), then Google Vision,
// then Tesseract if both fail.

import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

let tesseractWorker = null;

// Initialize Tesseract worker
const initTesseract = async () => {
  if (!tesseractWorker) {
    tesseractWorker = await Tesseract.createWorker('eng', 1, {
      logger: m => console.log('OCR Progress:', m)
    });
  }
  return tesseractWorker;
};

export const extractTextFromImage = async (imageFile) => {
  try {
    console.log('🔬 Starting intelligent OCR extraction...');

    // TIER 1: Try Gemini first (PRIMARY - best for allergen detection)
    console.log('🚀 Tier 1: Attempting Gemini Vision API (context-aware)...');
    const geminiResult = await extractTextWithGemini(imageFile);

    if (geminiResult.success && geminiResult.text.trim().length > 0) {
      console.log('✅ Gemini Vision succeeded - Allergen analysis complete!');
      return geminiResult;
    }

    // TIER 2: Fallback to Google Cloud Vision (good for OCR)
    console.log('⚠️ Gemini failed or not configured, trying Google Cloud Vision...');
    console.log('Gemini error:', geminiResult.error);

    const visionResult = await extractTextWithGoogleVision(imageFile);

    if (visionResult.success && visionResult.text.trim().length > 0) {
      console.log('✅ Google Cloud Vision succeeded');
      return visionResult;
    }

    // TIER 3: Final fallback to Tesseract (offline option)
    console.log('⚠️ Google Vision failed, falling back to Tesseract (offline)...');
    console.log('Vision error:', visionResult.error);

    // Create image URL for Tesseract
    const imageUrl = URL.createObjectURL(imageFile);

    // Initialize Tesseract worker
    const worker = await initTesseract();

    // Perform OCR
    const { data } = await worker.recognize(imageUrl);

    // Clean up
    URL.revokeObjectURL(imageUrl);

    console.log('Tesseract OCR Text:', data.text);
    console.log('Tesseract Confidence:', data.confidence);

    if (data.text && data.text.trim().length > 0) {
      return {
        success: true,
        text: data.text,
        confidence: data.confidence / 100, // Convert to 0-1 scale
        method: 'tesseract'
      };
    } else {
      return {
        success: false,
        text: '',
        confidence: 0,
        error: 'No text detected in image. Please ensure the image is clear and well-lit.',
        method: 'tesseract'
      };
    }
  } catch (error) {
    console.error('OCR Error:', error);
    return {
      success: false,
      text: '',
      confidence: 0,
      error: error.message || 'Failed to extract text from image',
      method: 'error'
    };
  }
};

// Cleanup worker when done
export const terminateTesseract = async () => {
  if (tesseractWorker) {
    await tesseractWorker.terminate();
    tesseractWorker = null;
  }
};

// Gemini Vision API implementation with structured JSON output
// This is the PRIMARY method - fast, cheap, and context-aware for allergen detection
export const extractTextWithGemini = async (imageFile) => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    console.log('🔍 Gemini API Key check:', apiKey ? `${apiKey.substring(0, 15)}...` : 'NOT FOUND');

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('Gemini API key not configured');
    }

    console.log('🚀 Starting Gemini Vision analysis...');
    console.log('📸 Image file type:', imageFile.type);
    console.log('📏 Image file size:', imageFile.size, 'bytes');

    // Convert image to base64
    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-001',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            raw_ingredient_string: {
              type: 'string',
              description: 'The full, unedited ingredient list text extracted from the label'
            },
            allergens_detected: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of allergens found from the Canadian Priority Allergens list'
            },
            cross_contamination_warning: {
              type: 'boolean',
              description: 'True if phrases like "May Contain", "Traces of", or similar warnings are found'
            },
            confidence: {
              type: 'number',
              description: 'Confidence score from 0 to 1'
            }
          },
          required: ['raw_ingredient_string', 'allergens_detected', 'cross_contamination_warning', 'confidence']
        }
      }
    });

    // Craft the prompt based on GeminiInstructions.txt
    const prompt = `You are the 'Allery' Food Safety AI. Your goal is to accurately extract ingredients and analyze all major food allergens from the provided image. Your output MUST be a single JSON object that strictly adheres to the provided schema.

Examine the food label image and:

1. **Extract:** Find and return the *entire* ingredient list as a single string in the 'raw_ingredient_string' field.

2. **Analyze:** Cross-reference the extracted ingredients against the following Canadian Priority Allergens: Peanuts, Tree Nuts, Milk, Eggs, Fish, Shellfish, Soy, Wheat, Sesame, Mustard, Sulphites.

3. **Detect Warnings:** Check for phrases like "May Contain", "Traces of", "Manufactured on equipment that processes", or similar cross-contamination warnings.

4. **Report:** Return the data in JSON format:
   - raw_ingredient_string: Full ingredients text
   - allergens_detected: Array of allergen names found (use exact names from the list above)
   - cross_contamination_warning: Boolean (true if any "may contain" type warning found)
   - confidence: Your confidence score (0.0 to 1.0)

Important:
- Support both English and French text (Canadian labels are bilingual)
- Look for allergens in both ingredient list AND "Contains:" statements
- Be thorough - missing an allergen could be life-threatening
- Only include allergens that are explicitly present or mentioned`;

    // Call Gemini API
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: imageFile.type || 'image/jpeg',
          data: base64Image
        }
      },
      prompt
    ]);

    const response = await result.response;
    const text = response.text();
    const data = JSON.parse(text);

    console.log('✅ Gemini Vision succeeded');
    console.log('📝 Ingredients:', data.raw_ingredient_string);
    console.log('⚠️ Allergens detected:', data.allergens_detected);
    console.log('🔔 Cross-contamination warning:', data.cross_contamination_warning);
    console.log('📊 Confidence:', data.confidence);

    return {
      success: true,
      text: data.raw_ingredient_string,
      confidence: data.confidence || 0.95,
      method: 'gemini',
      allergens: data.allergens_detected || [],
      crossContaminationWarning: data.cross_contamination_warning || false,
      structuredData: data // Include full structured response
    };
  } catch (error) {
    console.error('❌ Gemini Error (FULL):', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    if (error.response) {
      console.error('❌ API Response:', error.response);
    }
    return {
      success: false,
      text: '',
      confidence: 0,
      error: error.message || 'Failed to extract text with Gemini',
      method: 'gemini'
    };
  }
};

// Google Cloud Vision API implementation
export const extractTextWithGoogleVision = async (imageFile) => {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY;

    if (!apiKey || apiKey === 'your_google_vision_api_key_here') {
      throw new Error('Google Cloud Vision API key not configured');
    }

    console.log('Starting Google Cloud Vision OCR...');

    // Convert image to base64
    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    // Call Google Cloud Vision API directly
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 1
                }
              ],
              imageContext: {
                languageHints: ['en', 'fr'] // Support English and French for Canadian labels
              }
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to call Vision API');
    }

    const data = await response.json();
    const annotations = data.responses[0]?.textAnnotations;

    if (annotations && annotations.length > 0) {
      // First annotation contains all detected text
      const fullText = annotations[0].description;

      // Calculate average confidence from all words
      const confidence = annotations.length > 1
        ? annotations.slice(1).reduce((sum, ann) => sum + (ann.confidence || 0.95), 0) / (annotations.length - 1)
        : 0.95;

      console.log('Google Vision OCR Text:', fullText);
      console.log('Google Vision Confidence:', confidence);

      return {
        success: true,
        text: fullText,
        confidence: confidence,
        method: 'google-vision'
      };
    } else {
      return {
        success: false,
        text: '',
        confidence: 0,
        error: 'No text detected in image',
        method: 'google-vision'
      };
    }
  } catch (error) {
    console.error('Google Vision Error:', error);
    return {
      success: false,
      text: '',
      confidence: 0,
      error: error.message || 'Failed to extract text with Google Vision',
      method: 'google-vision'
    };
  }
};

// Smart extraction of ingredients section from OCR text
// This function intelligently extracts only the relevant ingredients and allergen information
// while filtering out nutrition facts, barcodes, and other label information
export const extractIngredientsSection = (text) => {
  if (!text) return '';

  // Remove common noise patterns
  let cleanedText = text
    // Remove nutrition facts patterns
    .replace(/nutrition\s+facts?.*?(?=ingredients?|$)/gis, '')
    .replace(/valeur\s+nutritive.*?(?=ingrédients?|$)/gis, '') // French
    .replace(/\d+\s*%\s*(?:DV|daily value|valeur quotidienne)/gi, '')
    .replace(/calories?:\s*\d+/gi, '')
    .replace(/serving size.*?(?=ingredients?|$)/gi, '')
    .replace(/portion.*?(?=ingrédients?|$)/gi, '')
    // Remove weight/size information
    .replace(/\d+\s*(?:g|mg|kg|ml|l|oz|lb)\s*/gi, ' ')
    // Remove barcode numbers (long sequences of digits)
    .replace(/\b\d{8,}\b/g, '')
    // Remove dates and codes
    .replace(/\b\d{4}\/\d{2}\/\d{2}\b/g, '')
    .replace(/\b\d{4}\\\s*$/gm, '')
    // Remove common label words not in ingredients
    .replace(/\b(?:gluten[-\s]free|sans\s+gluten|vegan|kosher|halal|non[-\s]gmo)\b/gi, '')
    .replace(/\b(?:best before|meilleur avant|use by|exp|expiry)\b/gi, '')
    .replace(/\b(?:trademark|marque de commerce|used under licence|utilisée sous licence)\b/gi, '')
    .replace(/\b(?:manufactured|fabriqué|distributed|distribué)\b/gi, '');

  // Find ingredients section using multiple patterns
  let ingredientsSection = '';
  let containsSection = '';

  // Pattern 1: Ingredients: ... (English) - prioritize English
  const ingredientsPattern = /ingredients?:?\s*([^]+?)(?=(?:\n\s*\n)|(?:ingrédients?:)|(?:contains?:)|(?:may contain)|(?:allergen)|$)/i;
  const ingredientsMatch = cleanedText.match(ingredientsPattern);

  // Pattern 2: Also check French "Ingrédients:"
  const ingredientsFrPattern = /ingrédients?:?\s*([^]+?)(?=(?:\n\s*\n)|(?:contains?:)|(?:contient:)|$)/i;
  const ingredientsFrMatch = cleanedText.match(ingredientsFrPattern);

  // Prefer English version if it exists and is substantial
  if (ingredientsMatch && ingredientsMatch[1].trim().length > 10) {
    ingredientsSection = ingredientsMatch[1].trim();
  } else if (ingredientsFrMatch) {
    ingredientsSection = ingredientsFrMatch[1].trim();
  }

  // Extract Contains/May Contain statements
  const containsPatterns = [
    /contains?:?\s*([^\n.]+)/i,
    /may\s+contains?:?\s*([^\n.]+)/i,
    /allergens?:?\s*([^\n.]+)/i,
    /allergy\s+information:?\s*([^\n.]+)/i,
    /contains?\s+traces?\s+of:?\s*([^\n.]+)/i,
    /contient:?\s*([^\n.]+)/i // French
  ];

  for (const pattern of containsPatterns) {
    const match = cleanedText.match(pattern);
    if (match) {
      containsSection += (containsSection ? '\n' : '') + match[1].trim();
    }
  }

  // Clean up the extracted sections
  ingredientsSection = ingredientsSection
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove line breaks that aren't meaningful
    .replace(/\n+/g, ' ')
    // Remove trailing punctuation from section breaks
    .replace(/[.]\s*$/, '')
    .trim();

  containsSection = containsSection
    .replace(/\s+/g, ' ')
    .trim();

  // Combine ingredients and contains sections
  let finalText = ingredientsSection;
  if (containsSection && !ingredientsSection.toLowerCase().includes('contain')) {
    finalText += '\n\nContains: ' + containsSection;
  }

  // Final cleanup: remove any remaining nutrition/barcode artifacts
  finalText = finalText
    .replace(/\b(?:DE|COR|EL)\s+\d+/g, '') // Common barcode prefixes
    .replace(/\d+\s*%/g, '') // Percentage values
    .replace(/\s+/g, ' ')
    .trim();

  console.log('🔍 Smart Extraction Results:');
  console.log('Original length:', text.length);
  console.log('Extracted ingredients length:', finalText.length);
  console.log('Extracted text:', finalText);

  return finalText;
};

// Parse ingredient text to extract structured data
export const parseIngredients = (text) => {
  if (!text) return { ingredients: [], allergens: '' };

  // First, extract only the ingredients section
  const smartExtracted = extractIngredientsSection(text);

  const lowerText = smartExtracted.toLowerCase();

  // Try to find ingredients section
  let ingredientsText = smartExtracted;
  const ingredientsMatch = smartExtracted.match(/ingredients?:?\s*([^.]+(?:\.[^.]+)*)/i);
  if (ingredientsMatch) {
    ingredientsText = ingredientsMatch[1];
  }

  // Extract allergen statement
  let allergenStatement = '';
  const allergenMatch = smartExtracted.match(/(?:contains?|may contain|allergens?):?\s*([^.]+)/i);
  if (allergenMatch) {
    allergenStatement = allergenMatch[1].trim();
  }

  // Split ingredients by common separators
  const ingredients = ingredientsText
    .split(/[,;]/)
    .map(ing => ing.trim())
    .filter(ing => ing.length > 2 && ing.length < 100);

  return {
    ingredients,
    allergenStatement,
    rawText: smartExtracted // Return cleaned text instead of original
  };
};

// Extract nutrition information if available
export const extractNutritionInfo = (text) => {
  const nutrition = {
    calories: null,
    protein: null,
    carbohydrates: null,
    fat: null,
    sodium: null
  };

  const caloriesMatch = text.match(/calories?:?\s*(\d+)/i);
  if (caloriesMatch) nutrition.calories = parseInt(caloriesMatch[1]);

  const proteinMatch = text.match(/protein:?\s*(\d+\.?\d*)\s*g/i);
  if (proteinMatch) nutrition.protein = parseFloat(proteinMatch[1]);

  const carbsMatch = text.match(/carbohydrate:?\s*(\d+\.?\d*)\s*g/i);
  if (carbsMatch) nutrition.carbohydrates = parseFloat(carbsMatch[1]);

  const fatMatch = text.match(/fat:?\s*(\d+\.?\d*)\s*g/i);
  if (fatMatch) nutrition.fat = parseFloat(fatMatch[1]);

  const sodiumMatch = text.match(/sodium:?\s*(\d+\.?\d*)\s*mg/i);
  if (sodiumMatch) nutrition.sodium = parseFloat(sodiumMatch[1]);

  return nutrition;
};
