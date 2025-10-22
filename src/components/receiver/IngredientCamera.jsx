import React, { useRef, useState, useEffect } from 'react';

const IngredientCamera = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

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
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        const file = new File([blob], 'ingredient-label.jpg', { type: 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
      }, 'image/jpeg', 0.95);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      const file = new File([blob], 'ingredient-label.jpg', { type: 'image/jpeg' });
      onCapture(file, capturedImage);
      stopCamera();
    }, 'image/jpeg', 0.95);
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
