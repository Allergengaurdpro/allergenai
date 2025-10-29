import React, { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from '../../config/firebase';
import { storage } from '../../config/firebase';
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
  const imagePreviewRef = useRef(null); // Track object URL for cleanup

  // Check if data is from Open Food Facts
  React.useEffect(() => {
    if (product.imageUrl && product.productName && product.ingredients && !product.id) {
      setIsFromOpenFoodFacts(true);
    }
  }, []);

  // Cleanup object URL when component unmounts
  React.useEffect(() => {
    return () => {
      cleanupImagePreview();
    };
  }, []);

  // Cleanup object URL
  const cleanupImagePreview = () => {
    if (imagePreviewRef.current) {
      URL.revokeObjectURL(imagePreviewRef.current);
      imagePreviewRef.current = null;
    }
  };

  // Compress image to prevent memory issues on mobile
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Detect if mobile device
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

          // Set max dimensions (smaller for mobile)
          const maxWidth = isMobile ? 1280 : 1920;
          const maxHeight = isMobile ? 1280 : 1920;

          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with compression (70% quality for mobile)
          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            isMobile ? 0.7 : 0.85
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Cleanup previous preview
      cleanupImagePreview();

      // Show loading state
      setProcessing(true);

      try {
        // Compress image first
        const compressedFile = await compressImage(file);

        const objectUrl = URL.createObjectURL(compressedFile);
        imagePreviewRef.current = objectUrl;

        setImageFile(compressedFile);
        setImagePreview(objectUrl);
        setOcrResult(null); // Reset OCR result when new image is selected
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Failed to process image. Please try again.');
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleCameraCapture = async (file, imageUrl) => {
    // Cleanup previous preview if it was an object URL
    cleanupImagePreview();

    // Cleanup the temporary URL from camera
    URL.revokeObjectURL(imageUrl);

    // Show loading state
    setProcessing(true);

    try {
      // Camera already compresses, but let's ensure consistent sizing
      const compressedFile = await compressImage(file);

      const objectUrl = URL.createObjectURL(compressedFile);
      imagePreviewRef.current = objectUrl;

      setImageFile(compressedFile);
      setImagePreview(objectUrl);
      setShowCamera(false);
      setOcrResult(null);
    } catch (error) {
      console.error('Error processing camera image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setProcessing(false);
    }
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
        console.log('Full OCR Result:', result);

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
        setOcrResult(result); // Store full OCR result including all extracted data

        // Auto-fill form with ALL extracted data
        const updatedFormData = {
          ...formData,
          ingredients: ingredientText
        };

        // Auto-fill product name if extracted and current form has empty name
        if (result.productName && !formData.productName) {
          updatedFormData.productName = result.productName;
        }

        // Auto-fill brand if extracted and current form has empty brand
        if (result.brandName && !formData.brand) {
          updatedFormData.brand = result.brandName;
        }

        // Store additional metadata
        updatedFormData.manufacturingDate = result.manufacturingDate || formData.manufacturingDate || '';
        updatedFormData.expiryDate = result.expiryDate || formData.expiryDate || '';
        updatedFormData.dietaryLabels = result.dietaryLabels || formData.dietaryLabels || [];
        updatedFormData.allergenWarnings = result.allergenWarnings || formData.allergenWarnings || [];

        setFormData(updatedFormData);

        // Build detailed success message
        const source = result.source || 'Tesseract.js';
        const extractionMethod = result.structuredData
          ? 'AI-powered comprehensive analysis'
          : 'Smart filtering applied';

        let successMessage = `✅ Label Analysis Complete!\n\nSource: ${source}\nConfidence: ${(result.confidence * 100).toFixed(1)}%\n\n📝 ${extractionMethod}\n`;

        if (result.structuredData) {
          const details = [];
          if (result.productName) details.push(`📦 Product: ${result.productName}`);
          if (result.brandName) details.push(`🏢 Brand: ${result.brandName}`);
          if (result.allergens && result.allergens.length > 0) details.push(`⚠️ Allergens: ${result.allergens.join(', ')}`);
          if (result.allergenWarnings && result.allergenWarnings.length > 0) details.push(`🔔 Warnings: ${result.allergenWarnings.length} found`);
          if (result.dietaryLabels && result.dietaryLabels.length > 0) details.push(`🏷️ Labels: ${result.dietaryLabels.join(', ')}`);
          if (result.manufacturingDate) details.push(`📅 Mfg: ${result.manufacturingDate}`);
          if (result.expiryDate) details.push(`📅 Exp: ${result.expiryDate}`);

          if (details.length > 0) {
            successMessage += '\n' + details.join('\n');
          }
        }

        successMessage += '\n\nPlease review and edit if needed.';
        alert(successMessage);
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
                      cleanupImagePreview();
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

          {/* Allergen Warnings from OCR */}
          {ocrResult && ocrResult.allergenWarnings && ocrResult.allergenWarnings.length > 0 && (
            <div className="extracted-info-box allergen-warnings-box">
              <h4>🔔 Allergen Warnings on Label</h4>
              <div className="warnings-list">
                {ocrResult.allergenWarnings.map((warning, index) => (
                  <div key={index} className="warning-item">
                    <span className="warning-icon">⚠️</span>
                    <span className="warning-text">{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dietary Labels/Certifications */}
          {ocrResult && ocrResult.dietaryLabels && ocrResult.dietaryLabels.length > 0 && (
            <div className="extracted-info-box dietary-labels-box">
              <h4>🏷️ Dietary Labels & Certifications</h4>
              <div className="dietary-tags">
                {ocrResult.dietaryLabels.map((label, index) => (
                  <span key={index} className="dietary-tag">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Manufacturing and Expiry Dates */}
          {ocrResult && (ocrResult.manufacturingDate || ocrResult.expiryDate) && (
            <div className="extracted-info-box dates-box">
              <h4>📅 Product Dates</h4>
              <div className="dates-info">
                {ocrResult.manufacturingDate && (
                  <div className="date-item">
                    <span className="date-label">Manufacturing:</span>
                    <span className="date-value">{ocrResult.manufacturingDate}</span>
                  </div>
                )}
                {ocrResult.expiryDate && (
                  <div className="date-item">
                    <span className="date-label">Expiry/Best Before:</span>
                    <span className="date-value">{ocrResult.expiryDate}</span>
                  </div>
                )}
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
