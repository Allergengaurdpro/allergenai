# OCR Setup Guide

The app now uses **Tesseract.js** for real-time OCR text extraction from ingredient labels.

## Current Implementation

### Browser-Based OCR (Tesseract.js)
- ✅ Works completely in the browser
- ✅ No API keys needed
- ✅ Free and open source
- ✅ Real-time text extraction
- ⚠️ Slower than cloud services (3-10 seconds)
- ⚠️ Lower accuracy than Google Vision API

### How It Works:
1. User takes photo of ingredient label
2. Image is processed by Tesseract.js in the browser
3. Text is extracted and auto-filled in the form
4. Allergens are automatically detected from the extracted text

## Installation

Tesseract.js is already included in `package.json`:

```bash
npm install
```

## Testing OCR

1. **Take a Clear Photo:**
   - Good lighting
   - Hold camera steady
   - Keep label flat
   - Fill the frame with ingredient text

2. **Click "Extract Ingredients (OCR)"**

3. **Wait 3-10 seconds** for processing

4. **Review extracted text** and edit if needed

### Tips for Best Results:
- ✓ Use high contrast (dark text on light background)
- ✓ Ensure text is in focus
- ✓ Keep camera perpendicular to label
- ✓ Avoid glare and shadows
- ✓ Use good lighting
- ✓ Text should be at least 12pt font size

## Upgrading to Google Cloud Vision API

For production use with better accuracy and speed, integrate Google Cloud Vision API:

### 1. Enable Google Cloud Vision API
```bash
# Go to Google Cloud Console
# Enable Vision API
# Create a service account and download credentials
```

### 2. Create a Cloud Function

Create `functions/ocr.js`:
```javascript
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

exports.extractText = async (req, res) => {
  try {
    const { image } = req.body;

    const [result] = await client.textDetection({
      image: { content: image }
    });

    const text = result.textAnnotations[0]?.description || '';

    res.json({
      success: true,
      text: text,
      confidence: 0.95
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

### 3. Deploy Cloud Function
```bash
firebase deploy --only functions
```

### 4. Update Code

In `src/utils/ocrService.js`, update the function URL:

```javascript
export const extractTextWithGoogleVision = async (imageFile) => {
  // ... existing code ...
  const response = await fetch('https://YOUR-PROJECT.cloudfunctions.net/extractText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image })
  });
  // ... rest of code ...
};
```

### 5. Switch to Google Vision

In `src/components/receiver/ProductForm.jsx`:

```javascript
// Change this line:
const result = await extractTextFromImage(imageFile);

// To this:
const result = await extractTextWithGoogleVision(imageFile);
```

## Comparison

| Feature | Tesseract.js | Google Vision API |
|---------|-------------|-------------------|
| **Speed** | 3-10 seconds | 1-2 seconds |
| **Accuracy** | 85-90% | 95-99% |
| **Cost** | Free | $1.50 per 1000 images |
| **Setup** | Zero config | Requires API key |
| **Network** | Works offline | Requires internet |
| **Processing** | Client-side | Server-side |

## Current Status

✅ **Tesseract.js is now active** and will extract real text from images!

To switch to Google Cloud Vision API, follow the upgrade steps above.

## Troubleshooting

### OCR is slow
- This is normal for Tesseract.js (3-10 seconds)
- Upgrade to Google Vision API for faster processing

### Low accuracy
- Ensure good image quality
- Check lighting conditions
- Make sure text is in focus
- Consider upgrading to Google Vision API

### OCR fails
- Check browser console for errors
- Ensure image file is valid
- Try taking a new photo with better lighting
- Image size should be < 5MB

## Image Quality Tips

For best OCR results:
1. 📸 **Good Lighting** - Natural daylight is best
2. 🎯 **Focus** - Text should be sharp and clear
3. 📐 **Angle** - Camera perpendicular to label
4. 🔍 **Distance** - Close enough to read text easily
5. 📦 **Background** - Flat surface, no wrinkles
6. 💡 **No Glare** - Avoid reflections on glossy labels
7. 📏 **Text Size** - Fill frame with ingredient list

## Support

- Tesseract.js Docs: https://tesseract.projectnaptha.com/
- Google Vision API: https://cloud.google.com/vision/docs
- GitHub Issues: Report problems in the repository
