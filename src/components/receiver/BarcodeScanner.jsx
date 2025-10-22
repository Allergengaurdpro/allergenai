import React, { useRef, useEffect, useState } from 'react';
import { scanBarcodeFromVideo, fetchOpenFoodFactsData } from '../../utils/barcodeScanner';

const BarcodeScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const [controls, setControls] = useState(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [manualBarcode, setManualBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Initializing camera...');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const hasScanned = useRef(false);

  useEffect(() => {
    // Small delay to ensure video element is mounted
    const timer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (controls && controls.stop) {
        controls.stop();
      }
    };
  }, []);

  const startScanner = async () => {
    try {
      console.log('=== Starting barcode scanner ===');

      if (!videoRef.current) {
        console.error('Video element not ready');
        setError('Video element not ready. Please refresh the page.');
        return;
      }

      console.log('Video element ready:', videoRef.current);

      const scanControls = await scanBarcodeFromVideo(
        videoRef.current,
        async (barcode) => {
          // Prevent multiple scans
          if (hasScanned.current) {
            console.log('Already scanned, ignoring duplicate');
            return;
          }
          hasScanned.current = true;

          console.log('✓ Barcode callback triggered:', barcode);
          setScanning(false);
          setScanSuccess(true);
          setMessage(`✓ Barcode: ${barcode}`);

          // Stop scanner immediately
          if (scanControls && scanControls.stop) {
            console.log('Stopping scanner...');
            scanControls.stop();
          }

          // Fetch product data
          try {
            setMessage('Fetching product information...');
            const productData = await fetchOpenFoodFactsData(barcode);
            console.log('Product data fetched:', productData);
            onScan(barcode, productData);
          } catch (err) {
            console.error('Error fetching product:', err);
            onScan(barcode, { found: false, barcode });
          }
        },
        (err) => {
          console.error('Scanner initialization error:', err);
          setError(`Camera error: ${err.message || 'Please check permissions and try again.'}`);
        }
      );

      console.log('scanControls received:', scanControls);

      if (scanControls) {
        console.log('✓ Scanner initialized successfully');
        setControls(scanControls);
        setCameraReady(true);
        setMessage('📷 Ready! Position barcode in frame');
      } else {
        console.error('scanControls is null/undefined');
        setError('Failed to initialize scanner. Check console for details.');
      }
    } catch (err) {
      console.error('Unexpected error in startScanner:', err);
      setError(`Error: ${err.message || 'Unknown error occurred'}`);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      setLoading(true);
      setMessage('Looking up product...');

      // Stop scanner
      if (controls && controls.stop) {
        controls.stop();
      }

      try {
        const productData = await fetchOpenFoodFactsData(manualBarcode.trim());

        if (productData.found) {
          setMessage('✓ Product found!');
        } else {
          setMessage('Product not in database. You can add it manually.');
        }

        setTimeout(() => {
          onScan(manualBarcode.trim(), productData);
        }, 500);
      } catch (error) {
        console.error('Error fetching product:', error);
        setMessage('Proceeding with manual entry...');
        setTimeout(() => {
          onScan(manualBarcode.trim(), { found: false, barcode: manualBarcode.trim() });
        }, 800);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal scanner-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {scanSuccess ? '✓ Barcode Scanned!' : '📱 Scan Barcode'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="scanner-content">
          {loading || scanSuccess ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>{message}</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button className="btn-primary" onClick={startScanner} style={{ marginTop: '16px' }}>
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* html5-qrcode will render video inside this div */}
              <div
                ref={videoRef}
                className="video-container"
                style={{
                  width: '100%',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  background: '#000'
                }}
              />

              {message && (
                <div className={`scanner-status ${cameraReady ? 'ready' : 'initializing'}`}>
                  <span className="status-icon">{cameraReady ? '📷' : '⏳'}</span>
                  {message}
                </div>
              )}
            </>
          )}

          <div className="manual-entry">
            <p><strong>Manual Entry</strong></p>
            <form onSubmit={handleManualSubmit} className="manual-form">
              <input
                type="text"
                placeholder="Enter barcode (e.g., 737628064502)"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                className="barcode-input"
                disabled={loading || scanSuccess}
              />
              <button type="submit" className="btn-primary" disabled={loading || !manualBarcode.trim() || scanSuccess}>
                {loading ? 'Looking up...' : 'Submit'}
              </button>
            </form>
            <small className="help-text">
              💡 Try: 737628064502 (Nutella), 5000112548871 (Coca-Cola)
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
