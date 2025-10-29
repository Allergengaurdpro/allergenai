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
            allergen_warnings: {
              type: 'array',
              items: { type: 'string' },
              description: 'All allergen warning statements found on the label (e.g., "Contains: Milk, Soy", "May contain traces of peanuts")'
            },
            cross_contamination_warning: {
              type: 'boolean',
              description: 'True if "May Contain", "Traces of", "Manufactured on equipment" warnings found'
            },
            manufacturing_date: {
              type: 'string',
              description: 'Manufacturing date if found (in any format visible on label, e.g., MFG: 2024-01-15, or Best Before date)'
            },
            expiry_date: {
              type: 'string',
              description: 'Expiry or Best Before date if found (in any format visible on label)'
            },
            dietary_labels: {
              type: 'array',
              items: { type: 'string' },
              description: 'Dietary certifications/labels found (e.g., "Gluten Free", "Vegetarian", "Vegan", "Organic", "Kosher", "Halal", "Non-GMO", "Sugar Free", etc.)'
            },
            product_name: {
              type: 'string',
              description: 'Product name if clearly visible on the label'
            },
            brand_name: {
              type: 'string',
              description: 'Brand name if clearly visible on the label'
            },
            confidence: {
              type: 'number',
              description: 'Confidence score from 0 to 1'
            }
          },
          required: ['raw_ingredient_string', 'allergens_detected', 'allergen_warnings', 'cross_contamination_warning', 'manufacturing_date', 'expiry_date', 'dietary_labels', 'product_name', 'brand_name', 'confidence']
        }
      }
    });

    const ALLERGENS_LIST = "Peanuts, Tree Nuts, Milk, Eggs, Fish, Shellfish, Soy, Wheat, Sesame, Mustard, Sulphites";
    const DIETARY_LABELS = "Gluten Free, Vegetarian, Vegan, Organic, Kosher, Halal, Non-GMO, Sugar Free, Low Fat, Low Sodium, Dairy Free, Lactose Free, Nut Free, Keto, Paleo";

    const prompt = `You are the 'Allery' Food Safety AI. Your mission is to perform COMPREHENSIVE analysis of the entire food label image. Scan EVERY part of the package - front, back, sides, nutritional panel, and ingredient list.

**YOUR OUTPUT MUST BE A SINGLE JSON OBJECT** that strictly follows the provided schema.

ANALYZE THE ENTIRE LABEL IMAGE THOROUGHLY:

1. **INGREDIENT EXTRACTION (BILINGUAL):**
   - Extract the COMPLETE ingredient list from BOTH English AND French sections
   - Include ALL ingredients, additives, preservatives, colors, flavors
   - Look for ingredient lists on back panel, side panels, or nutritional information area

2. **ALLERGEN DETECTION (COMPREHENSIVE):**
   - Cross-reference ingredients against Canadian Priority Allergens: ${ALLERGENS_LIST}
   - Check BOTH English and French text
   - Examples: "WHEAT FLOUR", "FARINE DE BLÉ" = Wheat | "SOY LECITHIN", "LÉCITHINE DE SOYA" = Soy
   - Scan for allergens in compound ingredients (text in parentheses/brackets)
   - List all detected allergens in the "allergens_detected" array

3. **ALLERGEN WARNING STATEMENTS:**
   - Scan for specific allergen warning boxes/statements anywhere on the package
   - Look for: "Contains:", "Contient:", "May contain:", "Peut contenir:", "Traces of:", "Traces de:"
   - Look for: "Manufactured on equipment that processes...", "Fabriqué dans un établissement qui traite..."
   - Extract the FULL warning text and add to "allergen_warnings" array
   - Examples: "Contains: Milk, Soy", "May contain traces of peanuts and tree nuts"

4. **CROSS-CONTAMINATION WARNING:**
   - Set to TRUE if any "may contain", "traces", or "manufactured on shared equipment" warnings found
   - Set to FALSE if no such warnings present

5. **DATES EXTRACTION (LOOK EVERYWHERE):**
   - **Manufacturing Date:** Look for "MFG:", "MFD:", "Manufactured:", "Production Date:", "Produit le:", or date codes
   - **Expiry Date:** Look for "EXP:", "BB:", "Best Before:", "Meilleur avant:", "Use By:", "Expiry:", "BBD:"
   - Extract dates in ANY format found (YYYY-MM-DD, DD/MM/YYYY, MM-DD-YY, Julian dates, etc.)
   - Common locations: Near barcode, on bottom/top of package, on lid/cap, near nutritional panel
   - If not found, return empty string ""

6. **DIETARY LABELS & CERTIFICATIONS:**
   - Scan the ENTIRE package for dietary labels, logos, symbols, and certification marks
   - Common labels to look for: ${DIETARY_LABELS}
   - Look for certification symbols (organic leaf, kosher symbols, halal symbols, vegan logos)
   - Look for health claims: "No artificial colors", "Natural", "Whole grain"
   - Add ALL found labels to "dietary_labels" array
   - Return empty array [] if none found

7. **PRODUCT & BRAND IDENTIFICATION:**
   - Extract the main product name (usually large text on front)
   - Extract the brand name (typically at top of package or near product name)
   - If not clearly visible, return empty string ""

8. **CONFIDENCE SCORE:**
   - Assign 0.9-1.0 for clear, high-quality images
   - Assign 0.7-0.9 for slightly blurry but readable images
   - Assign 0.5-0.7 for difficult to read images
   - Assign 0.0-0.5 for very poor quality/unreadable images

**RETURN COMPLETE JSON WITH ALL REQUIRED FIELDS** - use empty strings "" or empty arrays [] for fields where information is not found.`;


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
    console.log('⚠️ Allergens Detected:', data.allergens_detected);
    console.log('📋 Allergen Warnings:', data.allergen_warnings);
    console.log('🔔 Cross-contamination:', data.cross_contamination_warning);
    console.log('📅 Manufacturing Date:', data.manufacturing_date);
    console.log('📅 Expiry Date:', data.expiry_date);
    console.log('🏷️ Dietary Labels:', data.dietary_labels);
    console.log('🏢 Product Name:', data.product_name);
    console.log('🏭 Brand Name:', data.brand_name);
    console.log('📊 Confidence:', data.confidence);

    return {
      success: true,
      text: data.raw_ingredient_string,
      confidence: data.confidence || 0.95,
      source: 'Gemini 2.0 Flash (AI-Powered)',
      allergens: data.allergens_detected || [],
      allergenWarnings: data.allergen_warnings || [],
      crossContaminationWarning: data.cross_contamination_warning || false,
      manufacturingDate: data.manufacturing_date || '',
      expiryDate: data.expiry_date || '',
      dietaryLabels: data.dietary_labels || [],
      productName: data.product_name || '',
      brandName: data.brand_name || '',
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
