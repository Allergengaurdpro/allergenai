import { Html5Qrcode } from 'html5-qrcode';

let html5QrCode = null;

export const scanBarcodeFromVideo = async (videoElement, onResult, onError) => {
  try {
    console.log('🎥 Step 1: Initializing html5-qrcode scanner...');

    // Create a container div for the scanner
    const scannerId = 'barcode-scanner-' + Date.now();
    videoElement.id = scannerId;

    // Initialize Html5Qrcode
    html5QrCode = new Html5Qrcode(scannerId);

    console.log('🎥 Step 2: Getting available cameras...');

    // Get available cameras
    const cameras = await Html5Qrcode.getCameras();
    console.log('📷 Available cameras:', cameras.length, cameras);

    if (!cameras || cameras.length === 0) {
      throw new Error('No camera found on this device');
    }

    // Select rear camera for mobile (environment facing)
    let cameraId;
    const rearCamera = cameras.find(camera =>
      camera.label.toLowerCase().includes('back') ||
      camera.label.toLowerCase().includes('rear') ||
      camera.label.toLowerCase().includes('environment')
    );

    cameraId = rearCamera ? rearCamera.id : cameras[0].id;
    console.log('📷 Selected camera:', cameraId, rearCamera ? '(rear)' : '(first)');

    // Configuration for barcode scanning
    const config = {
      fps: 10, // Frames per second
      qrbox: { width: 250, height: 250 }, // Scanning box size
      aspectRatio: 1.0
      // Library automatically supports all common formats:
      // QR_CODE, EAN_13, EAN_8, UPC_A, UPC_E, CODE_128, CODE_39, etc.
    };

    console.log('🎥 Step 3: Starting scanner...');

    // Start scanning
    await html5QrCode.start(
      cameraId,
      config,
      (decodedText, decodedResult) => {
        console.log('✅ Barcode detected:', decodedText);

        // Validate barcode
        if (isValidBarcode(decodedText)) {
          console.log('✅ Valid barcode format');

          // Vibrate on success (mobile)
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }

          // Call the result callback
          onResult(decodedText);
        } else {
          console.log('⚠️ Invalid barcode format:', decodedText);
          // Still call onResult even if format is unusual
          onResult(decodedText);
        }
      },
      (errorMessage) => {
        // Ignore "NotFoundException" - normal when no barcode in view
        if (!errorMessage.includes('NotFoundException')) {
          console.warn('Scan error:', errorMessage);
        }
      }
    );

    console.log('✅ Scanner started successfully!');

    // Return controls
    return {
      stop: async () => {
        console.log('🛑 Stopping scanner...');
        try {
          if (html5QrCode && html5QrCode.isScanning) {
            await html5QrCode.stop();
            console.log('✅ Scanner stopped');
          }
        } catch (err) {
          console.error('Error stopping scanner:', err);
        }
      }
    };

  } catch (error) {
    console.error('❌ Failed to start scanner:', error);
    if (onError) {
      onError(error);
    }
    return null;
  }
};

export const scanBarcodeFromImage = async (imageFile) => {
  try {
    const html5QrCode = new Html5Qrcode('temp-scanner');
    const imageUrl = URL.createObjectURL(imageFile);
    const result = await html5QrCode.scanFile(imageFile, true);
    return result;
  } catch (error) {
    console.error('Failed to scan barcode from image:', error);
    throw error;
  }
};

export const stopBarcodeScanner = (controls) => {
  if (controls && controls.stop) {
    controls.stop();
  }
};

// Fetch product data from Open Food Facts API
export const fetchOpenFoodFactsData = async (barcode) => {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    const data = await response.json();

    if (data.status === 1 && data.product) {
      const product = data.product;

      return {
        found: true,
        barcode: barcode,
        productName: product.product_name || 'Unknown Product',
        brand: product.brands || '',
        ingredients: product.ingredients_text || '',
        allergens: product.allergens || '',
        imageUrl: product.image_url || '',
        categories: product.categories || '',
        quantity: product.quantity || '',
        nutritionData: {
          energyKcal: product.nutriments?.['energy-kcal'] || 0,
          proteins: product.nutriments?.proteins || 0,
          carbohydrates: product.nutriments?.carbohydrates || 0,
          fat: product.nutriments?.fat || 0,
          sodium: product.nutriments?.sodium || 0,
          fiber: product.nutriments?.fiber || 0,
          sugars: product.nutriments?.sugars || 0
        }
      };
    } else {
      return {
        found: false,
        barcode: barcode,
        message: 'Product not found in Open Food Facts database'
      };
    }
  } catch (error) {
    console.error('Error fetching from Open Food Facts:', error);
    return {
      found: false,
      barcode: barcode,
      error: error.message
    };
  }
};

// Validate barcode format
export const isValidBarcode = (barcode) => {
  if (!barcode) return false;

  const cleaned = barcode.replace(/\s/g, '');

  // Check for common barcode formats
  const formats = [
    /^\d{8}$/, // EAN-8
    /^\d{12}$/, // UPC-A
    /^\d{13}$/, // EAN-13
    /^\d{14}$/, // ITF-14
  ];

  return formats.some(format => format.test(cleaned));
};
