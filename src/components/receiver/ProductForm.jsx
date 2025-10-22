import React, { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from '../../config/mockFirebase';
import { storage } from '../../config/mockFirebase';
import { extractTextFromImage, parseIngredients, extractIngredientsSection } from '../../utils/ocrService';
import { extractTextWithDocumentDetection } from '../../utils/googleVisionOCR';
import { GOOGLE_VISION_API_KEY, hasGoogleVisionKey } from '../../config/apiKeys';
import { detectAllergens, getAllergenWarningLevel, extractAllergenStatement } from '../../utils/allergenDetection';
import IngredientCamera from './IngredientCamera';
import AllergenVisualization from './AllergenVisualization';

const ProductForm = ({ product, onSave, onClose }) => {
  const [formData, setFormData] = useState(product);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product.imageUrl || null);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [isFromOpenFoodFacts, setIsFromOpenFoodFacts] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef(null);

  // Check if data is from Open Food Facts
  React.useEffect(() => {
    if (product.imageUrl && product.productName && product.ingredients && !product.id) {
      setIsFromOpenFoodFacts(true);
    }
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setOcrResult(null); // Reset OCR result when new image is selected
    }
  };

  const handleCameraCapture = (file, imageUrl) => {
    setImageFile(file);
    setImagePreview(imageUrl);
    setShowCamera(false);
    setOcrResult(null);
  };

  const handleOCR = async () => {
    if (!imageFile) {
      alert('Please select an image first');
      return;
    }

    setProcessing(true);
    try {
      let result;

      // Check if Google Vision API key is available
      if (hasGoogleVisionKey()) {
        console.log('Using Google Cloud Vision API for OCR...');
        result = await extractTextWithDocumentDetection(imageFile, GOOGLE_VISION_API_KEY);
      } else {
        console.log('Using Tesseract.js for OCR (slower)...');
        console.log('Tip: Add VITE_GOOGLE_VISION_API_KEY to .env file for faster and more accurate OCR');
        result = await extractTextFromImage(imageFile);
      }

      if (result.success) {
        console.log('OCR Success! Raw Text:', result.text);
        console.log('Source:', result.source || 'Tesseract.js');

        // Check if we're using Gemini's structured output
        let ingredientText;
        if (result.structuredData) {
          // Gemini already extracted clean ingredients - use directly
          ingredientText = result.text;
          console.log('Using Gemini extracted ingredients directly:', ingredientText);
        } else {
          // For Tesseract/Google Vision - apply smart extraction
          ingredientText = extractIngredientsSection(result.text);
          console.log('Smart Extracted Ingredients:', ingredientText);
        }

        const parsed = parseIngredients(result.text);
        setOcrResult(parsed);

        // Auto-fill form with extracted text
        setFormData({
          ...formData,
          ingredients: ingredientText
        });

        const source = result.source || 'Tesseract.js';
        const extractionMethod = result.structuredData
          ? 'AI-powered extraction with allergen detection'
          : 'Smart filtering applied - only ingredients section extracted';
        alert(`✅ Ingredients extracted successfully!\n\nSource: ${source}\nConfidence: ${(result.confidence * 100).toFixed(1)}%\n\n📝 ${extractionMethod}\n\nPlease review and edit if needed.`);
      } else {
        console.error('OCR Failed:', result.error);
        alert('❌ Failed to extract text:\n\n' + (result.error || 'No text detected. Please ensure the image is clear and well-lit.'));
      }
    } catch (error) {
      console.error('OCR Error:', error);
      alert('❌ Failed to process image:\n\n' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      let imageUrl = formData.imageUrl || '';

      // Upload image if new
      if (imageFile) {
        const storageRef = ref(storage, `product-images/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      // Detect allergens
      const allergens = detectAllergens(formData.ingredients);

      const productData = {
        ...formData,
        imageUrl,
        allergens,
        warningLevel: getAllergenWarningLevel(allergens)
      };

      onSave(productData);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    } finally {
      setProcessing(false);
    }
  };

  // Real-time allergen detection as user types
  const allergens = detectAllergens(formData.ingredients);
  const warningLevel = getAllergenWarningLevel(allergens);
  const allergenStatement = extractAllergenStatement(formData.ingredients);

  // Log allergen detection for debugging
  React.useEffect(() => {
    if (formData.ingredients && allergens.length > 0) {
      console.log('🔍 Detected Allergens:', allergens);
    }
  }, [allergens]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{product.id ? 'Edit Product' : 'Add Product'}</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          {isFromOpenFoodFacts && (
            <div className="info-banner">
              <strong>✓ Product found in Open Food Facts database!</strong>
              <p>The information below has been pre-filled. Please review and edit if needed.</p>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Barcode</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Barcode number"
              />
            </div>

            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                required
                placeholder="Enter product name"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Brand</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Enter brand name"
            />
          </div>

          <div className="form-group">
            <label>Ingredient Label Photo</label>
            <div className="image-upload">
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Product ingredient label" />
                  <button
                    type="button"
                    className="btn-remove-img"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                      setOcrResult(null);
                    }}
                  >
                    Remove Image
                  </button>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
              />

              <div className="image-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCamera(true)}
                >
                  📷 {imagePreview ? 'Retake Photo' : 'Take Photo with Camera'}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => fileInputRef.current.click()}
                >
                  📁 Choose from Gallery
                </button>

                {imageFile && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleOCR}
                    disabled={processing}
                  >
                    {processing ? '🔄 Extracting Text...' : '🔍 Extract Ingredients (OCR)'}
                  </button>
                )}
              </div>

              {processing && (
                <div className="ocr-progress">
                  <div className="loading-spinner"></div>
                  <p>
                    {hasGoogleVisionKey()
                      ? '🚀 Extracting text using Google Vision API (fast & accurate)...'
                      : '⏳ Extracting text using Tesseract.js (this may take 5-10 seconds)...'}
                  </p>
                </div>
              )}

              <p className="help-text">
                📸 Take a clear photo of the ingredient label on the package for automatic text extraction
                {!hasGoogleVisionKey() && (
                  <span className="api-tip">
                    <br />💡 <strong>Tip:</strong> Add your Google Vision API key to .env file for faster OCR!
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="form-group">
            <label>Ingredients *</label>
            <textarea
              value={formData.ingredients}
              onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
              rows={6}
              required
              placeholder="Enter ingredients manually OR take a photo of the ingredient label and click 'Extract Ingredients (OCR)'"
            />
            {ocrResult && (
              <div className="ocr-success">
                ✅ Ingredients extracted from image! Please review and edit if needed.
              </div>
            )}
            {!imageFile && !formData.ingredients && (
              <div className="hint-box">
                💡 <strong>Tip:</strong> Take a photo of the ingredient label to automatically extract the text!
              </div>
            )}
          </div>

          {allergens.length > 0 && (
            <div className={`allergen-warning warning-${warningLevel}`}>
              <div className="allergen-warning-header">
                <h4>⚠️ Canadian Priority Allergens Detected</h4>
                <span className="warning-badge">{warningLevel.toUpperCase()} RISK</span>
              </div>
              {allergenStatement && (
                <div className="allergen-statement">
                  <strong>📋 Contains Statement Found:</strong>
                  <div className="statement-text">"{allergenStatement}"</div>
                </div>
              )}
              <AllergenVisualization allergens={allergens} showDetails={true} showEducation={true} />
              <div className="allergen-compliance">
                <div className="compliance-badge">
                  <span className="compliance-icon">✓</span>
                  <span className="compliance-text">
                    Detected according to <strong>Health Canada</strong> & <strong>CFIA</strong> regulations
                  </span>
                </div>
                <p className="compliance-note">
                  Enhanced Labelling Requirements (2012) - Federal Food and Drug Regulations
                </p>
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Damaged Units</label>
              <input
                type="number"
                value={formData.damaged}
                onChange={(e) => setFormData({ ...formData, damaged: parseInt(e.target.value) })}
                min="0"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={processing}>
              {processing ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>

      {showCamera && (
        <IngredientCamera
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};

export default ProductForm;
