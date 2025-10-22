# Google Cloud Vision API Setup Guide

Follow these steps to integrate your Google Cloud Vision API key for fast and accurate OCR.

## Quick Setup (3 Steps)

### 1. Get Your API Key

If you already have a Google Cloud Vision API key, skip to step 2.

Otherwise:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Cloud Vision API**
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **API Key**
6. Copy your API key (starts with `AIza...`)

### 2. Add API Key to Environment File

Create a `.env` file in the root directory (if it doesn't exist):

```bash
# .env file
VITE_GOOGLE_VISION_API_KEY=AIzaSy...your-actual-key-here
```

**Important:** Replace `AIzaSy...your-actual-key-here` with your actual API key!

### 3. Restart Development Server

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

## ✅ That's It!

The app will automatically detect your API key and use Google Cloud Vision for OCR instead of Tesseract.js.

## How to Verify It's Working

1. **Login as receiver**
2. **Start scanning session**
3. **Add product** (take photo of ingredient label)
4. **Click "Extract Ingredients (OCR)"**
5. **Check the loading message:**
   - ✅ **With API Key:** "🚀 Extracting text using Google Vision API (fast & accurate)..."
   - ⚠️ **Without API Key:** "⏳ Extracting text using Tesseract.js (this may take 5-10 seconds)..."

6. **After extraction, check the alert:**
   - Should say: "Source: Google Cloud Vision API (Document Detection)"
   - Processing time: 1-2 seconds (vs 5-10 seconds with Tesseract)

## Benefits of Google Vision API

| Feature | Tesseract.js | Google Vision API |
|---------|-------------|-------------------|
| **Speed** | 5-10 seconds | 1-2 seconds ⚡ |
| **Accuracy** | 85-90% | 95-99% 🎯 |
| **Handwriting** | Poor | Excellent |
| **Multi-language** | Limited | 50+ languages |
| **Complex layouts** | Struggles | Excellent |
| **Cost** | Free | $1.50/1000 images |
| **Setup** | Zero config | API key needed |

## API Key Security

### ✅ Good Practices:

1. **Use `.env` file** (already set up)
2. **Never commit `.env`** to git (already in `.gitignore`)
3. **Restrict API key** in Google Cloud Console:
   - Go to your API key settings
   - Add **HTTP referrer restrictions**
   - Add your domain: `http://localhost:3000` (development)
   - Add production domain when deploying

### ⚠️ Important Notes:

- `.env` file is already in `.gitignore` - it won't be committed
- Never share your API key publicly
- Restrict the API key to Vision API only
- Set usage quotas in Google Cloud Console

## Troubleshooting

### "Failed to extract text"

**Check:**
1. API key is correct in `.env` file
2. API key starts with `AIza` and is 39 characters
3. Cloud Vision API is enabled in Google Cloud Console
4. API key has no usage restrictions blocking the request
5. Browser console for detailed error messages

### Still Using Tesseract.js

**Possible causes:**
1. `.env` file not created
2. API key variable name wrong (must be `VITE_GOOGLE_VISION_API_KEY`)
3. Server not restarted after adding key
4. API key value is empty or still says `YOUR_API_KEY_HERE`

**Solution:**
```bash
# 1. Check .env file exists
ls -la .env

# 2. Check content (should have your key)
cat .env

# 3. Restart server
npm run dev
```

### API Key Not Working

1. **Verify API key in Google Cloud Console:**
   - Go to Credentials
   - Check if key exists and is enabled
   - Check restrictions (should allow Vision API)

2. **Test API key manually:**
   ```bash
   curl "https://vision.googleapis.com/v1/images:annotate?key=YOUR_KEY" \
     -X POST \
     -H "Content-Type: application/json" \
     --data '{"requests":[{"image":{"content":""},"features":[{"type":"TEXT_DETECTION"}]}]}'
   ```

3. **Check browser console** for detailed error messages

## Alternative: Direct Key in Code (Not Recommended)

If you can't use `.env` file, you can add the key directly to code:

**File:** `src/config/apiKeys.js`

```javascript
// Uncomment and add your key:
export const GOOGLE_VISION_API_KEY = 'AIzaSy...your-key-here';
```

⚠️ **Warning:** This is less secure and the key will be visible in your code!

## Cost Estimation

Google Cloud Vision API pricing (as of 2024):
- First 1,000 images/month: **FREE**
- 1,001 - 5,000,000 images: **$1.50 per 1,000**

**Example:**
- 100 scans/day = 3,000/month = **FREE**
- 500 scans/day = 15,000/month = $21/month
- Most small operations will stay within free tier!

## API Key Rotation

To change your API key:

1. Create new key in Google Cloud Console
2. Update `.env` file with new key
3. Restart server
4. Delete old key from Google Cloud Console

## Support

- Google Vision API Docs: https://cloud.google.com/vision/docs
- Pricing: https://cloud.google.com/vision/pricing
- API Console: https://console.cloud.google.com/apis/credentials

---

**Ready to test?** Add your API key to `.env` and restart the server! 🚀
