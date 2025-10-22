// Google Cloud Vision API and Gemini integration for OCR
// TRIPLE-TIER: Gemini → Google Vision → Fallback
// Gemini provides context-aware allergen detection with structured JSON output

import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini Vision API - PRIMARY method for allergen detection
export const extractTextWithGemini = async (imageFile, geminiApiKey) => {
  try {
    console.log('🚀 Starting Gemini Vision analysis (PRIMARY)...');
    console.log('🔑 Gemini API Key:', geminiApiKey ? geminiApiKey.substring(0, 15) + '...' : 'NOT PROVIDED');

    if (!geminiApiKey || geminiApiKey === 'your_gemini_api_key_here') {
      throw new Error('Gemini API key not configured');
    }

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

    // Initialize Gemini with optimized config
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-001',
      generationConfig: {
        temperature: 0.0, // Low temperature for consistent fact extraction
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            raw_ingredient_string: {
              type: 'string',
              description: 'The COMPLETE ingredient list from BOTH English AND French sections of the label'
            },
            allergens_detected: {
              type: 'array',
              items: { type: 'string' },
              description: 'ALL Canadian Priority Allergens found in EITHER English OR French text'
            },
            cross_contamination_warning: {
              type: 'boolean',
              description: 'True if "May Contain", "Traces of", "Manufactured on equipment" warnings found'
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

    const ALLERGENS_LIST = "Peanuts, Tree Nuts, Milk, Eggs, Fish, Shellfish, Soy, Wheat, Sesame, Mustard, Sulphites";

    const prompt = `You are the 'Allery' Food Safety AI. Your goal is to accurately extract ingredients and analyze all major food allergens from the provided food label image. Your output MUST be a single JSON object that strictly adheres to the provided schema.

Examine the food label image VERY CLOSELY to perform complete OCR and analysis.

CRITICAL INSTRUCTIONS:
1. **Extract (BILINGUAL):** This is a CANADIAN bilingual label with BOTH English and French ingredients. You MUST extract the COMPLETE ingredient list from BOTH language sections. Include everything you see.

2. **Analyze (CHECK BOTH LANGUAGES):** Cross-reference the extracted ingredients from BOTH English AND French text against this definitive list of Canadian Priority Allergens: ${ALLERGENS_LIST}

   IMPORTANT ALLERGEN DETECTION RULES:
   - Check BOTH English and French ingredient sections thoroughly
   - English examples: "WHEAT FLOUR" = Wheat, "SOY PROTEIN" = Soy, "MILK POWDER" = Milk
   - French examples: "FARINE DE BLÉ" = Wheat, "PROTÉINE DE SOYA" = Soy, "POUDRE DE LAIT" = Milk
   - "HYDROLYZED SOY PROTEIN" or "PROTÉINE DE SOYA HYDROLYSÉE" = Soy
   - Look for allergens in compound ingredients (e.g., in brackets or parentheses)
   - SULPHITES/SULFITES in English or French = Sulphites allergen

3. **Warning Check:** Scan the ENTIRE label for any "May Contain", "Peut contenir", "Traces of", "Traces de", "Manufactured on equipment that processes" warnings in English or French.

4. **Confidence:** Assign a confidence score (0.0 to 1.0) based on image quality and text clarity.

Return the data ONLY in the required JSON format with all four fields.`;


    console.log('📤 Calling Gemini API...');
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

    console.log('✅ Gemini Vision succeeded!');
    console.log('📝 Ingredients:', data.raw_ingredient_string);
    console.log('⚠️ Allergens:', data.allergens_detected);
    console.log('🔔 Cross-contamination:', data.cross_contamination_warning);
    console.log('📊 Confidence:', data.confidence);

    return {
      success: true,
      text: data.raw_ingredient_string,
      confidence: data.confidence || 0.95,
      source: 'Gemini 2.0 Flash (AI-Powered)',
      allergens: data.allergens_detected || [],
      crossContaminationWarning: data.cross_contamination_warning || false,
      structuredData: data
    };
  } catch (error) {
    console.error('❌ Gemini Error:', error.message);
    console.error('Full error:', error);
    return {
      success: false,
      text: '',
      confidence: 0,
      error: error.message || 'Failed to extract with Gemini',
      source: 'Gemini 2.0 Flash (AI-Powered)'
    };
  }
};

export const extractTextWithGoogleVision = async (imageFile, apiKey) => {
  try {
    console.log('Starting Google Vision OCR...');

    // Convert image to base64
    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
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
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Google Vision API request failed');
    }

    const data = await response.json();
    console.log('Google Vision Response:', data);

    // Extract text from response
    const textAnnotations = data.responses[0]?.textAnnotations;

    if (textAnnotations && textAnnotations.length > 0) {
      // The first annotation contains all detected text
      const fullText = textAnnotations[0].description;

      console.log('Extracted Text:', fullText);

      return {
        success: true,
        text: fullText,
        confidence: 0.95, // Google Vision doesn't provide per-text confidence
        source: 'Google Cloud Vision API'
      };
    } else {
      return {
        success: false,
        text: '',
        confidence: 0,
        error: 'No text detected in image. Please ensure the image contains readable text.'
      };
    }
  } catch (error) {
    console.error('Google Vision API Error:', error);
    return {
      success: false,
      text: '',
      confidence: 0,
      error: error.message || 'Failed to extract text using Google Vision API',
      source: 'Google Cloud Vision API'
    };
  }
};

// Enhanced version with Gemini + Document text detection
// TRIPLE-TIER: Try Gemini → Google Vision → Fallback
export const extractTextWithDocumentDetection = async (imageFile, apiKey) => {
  console.log('🔬 Starting multi-tier OCR extraction...');

  // TIER 1: Try Gemini first (if API key available)
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
    console.log('🚀 TIER 1: Attempting Gemini Vision (context-aware)...');
    const geminiResult = await extractTextWithGemini(imageFile, geminiApiKey);

    if (geminiResult.success && geminiResult.text.trim().length > 0) {
      console.log('✅ Gemini succeeded! Skipping Google Vision.');
      return geminiResult;
    }

    console.log('⚠️ Gemini failed, falling back to Google Vision...');
    console.log('Gemini error:', geminiResult.error);
  } else {
    console.log('⚠️ Gemini API key not configured, using Google Vision directly');
  }

  // TIER 2: Google Vision Document Detection
  try {
    console.log('📄 TIER 2: Using Google Vision Document OCR...');

    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

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
                  type: 'DOCUMENT_TEXT_DETECTION', // Better for dense text like ingredient lists
                  maxResults: 1
                }
              ],
              imageContext: {
                languageHints: ['en'] // English language hint
              }
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Google Vision API request failed');
    }

    const data = await response.json();
    console.log('Google Vision Document Response:', data);

    const fullTextAnnotation = data.responses[0]?.fullTextAnnotation;

    if (fullTextAnnotation && fullTextAnnotation.text) {
      const fullText = fullTextAnnotation.text;

      console.log('Extracted Text (Document):', fullText);

      return {
        success: true,
        text: fullText,
        confidence: 0.98,
        source: 'Google Cloud Vision API (Document Detection)'
      };
    } else {
      // Fallback to regular text detection
      return extractTextWithGoogleVision(imageFile, apiKey);
    }
  } catch (error) {
    console.error('Google Vision Document API Error:', error);
    // Fallback to regular text detection
    return extractTextWithGoogleVision(imageFile, apiKey);
  }
};

// Validate API key format
export const validateApiKey = (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    return false;
  }
  // Google API keys typically start with "AIza" and are 39 characters long
  return apiKey.startsWith('AIza') && apiKey.length === 39;
};
