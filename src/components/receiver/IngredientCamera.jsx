import React, { useRef, useState, useEffect } from 'react';

const IngredientCamera = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const capturedImageRef = useRef(null); // Track object URL for cleanup

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
      cleanupObjectURL();
    };
  }, []);

  // Cleanup object URL when component unmounts or new image is captured
  const cleanupObjectURL = () => {
    if (capturedImageRef.current) {
      URL.revokeObjectURL(capturedImageRef.current);
      capturedImageRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      // Detect if mobile device for optimized settings
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera on mobile
          // Very low resolution for mobile to prevent memory issues and reloads
          width: { ideal: isMobile ? 960 : 1920 },
          height: { ideal: isMobile ? 720 : 1080 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    // Also stop any tracks from the video element
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      const context = canvas.getContext('2d');

      // Detect if mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // Much smaller max size for mobile to prevent memory issues
      const maxWidth = isMobile ? 1024 : 1920;
      const maxHeight = isMobile ? 1024 : 1080;
      let width = video.videoWidth;
      let height = video.videoHeight;

      // Scale down if too large
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, width, height);

      // Stop camera immediately after capture to free memory
      stopCamera();

      // Convert canvas to blob with aggressive compression for mobile
      canvas.toBlob((blob) => {
        // Cleanup previous object URL
        cleanupObjectURL();

        const imageUrl = URL.createObjectURL(blob);
        capturedImageRef.current = imageUrl;
        setCapturedImage(imageUrl);
      }, 'image/jpeg', isMobile ? 0.7 : 0.85); // More aggressive compression for mobile
    }
  };

  const retakePhoto = () => {
    cleanupObjectURL();
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = () => {
    const canvas = canvasRef.current;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    canvas.toBlob((blob) => {
      const file = new File([blob], 'ingredient-label.jpg', { type: 'image/jpeg' });
      onCapture(file, capturedImage);
      stopCamera();
      // Don't cleanup here as parent component will handle the URL
    }, 'image/jpeg', isMobile ? 0.7 : 0.85); // Match the quality used in capture
  };

  return (
    <div className="modal-overlay" onClick={() => {
      stopCamera();
      onClose();
    }}>
      <div className="modal camera-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📷 Capture Ingredient Label</h3>
          <button className="modal-close" onClick={() => {
            stopCamera();
            onClose();
          }}>
            ×
          </button>
        </div>

        <div className="camera-content">
          {error ? (
            <div className="error-message">
              <p>{error}</p>
              <button className="btn-primary" onClick={onClose}>
                Close
              </button>
            </div>
          ) : (
            <>
              {!capturedImage ? (
                <>
                  <div className="video-container">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="camera-video"
                    />
                    <div className="camera-guide">
                      <div className="guide-box">
                        <div className="corner corner-tl"></div>
                        <div className="corner corner-tr"></div>
                        <div className="corner corner-bl"></div>
                        <div className="corner corner-br"></div>
                      </div>
                      <p className="guide-text">
                        Position the ingredient label within the frame
                      </p>
                    </div>
                  </div>

                  <div className="camera-instructions">
                    <h4>📋 Tips for best results:</h4>
                    <ul>
                      <li>✓ Ensure good lighting</li>
                      <li>✓ Hold camera steady</li>
                      <li>✓ Keep label flat and readable</li>
                      <li>✓ Fill the frame with the ingredient list</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    className="btn-capture"
                    onClick={capturePhoto}
                  >
                    📸 Capture Photo
                  </button>
                </>
              ) : (
                <>
                  <div className="preview-container">
                    <img src={capturedImage} alt="Captured ingredient label" />
                  </div>

                  <div className="preview-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={retakePhoto}
                    >
                      🔄 Retake
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={confirmPhoto}
                    >
                      ✓ Use This Photo
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  );
};

export default IngredientCamera;
