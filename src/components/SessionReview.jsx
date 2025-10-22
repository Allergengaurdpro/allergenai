import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, updateDoc } from '../config/mockFirebase';
import { db } from '../config/mockFirebase';
import { ref, uploadBytes, getDownloadURL } from '../config/mockFirebase';
import { storage } from '../config/mockFirebase';

const SessionReview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId, products } = location.state || {};
  const [submitting, setSubmitting] = useState(false);

  if (!sessionId || !products) {
    navigate('/dashboard');
    return null;
  }

  const generateAllergenLabel = async (product) => {
    // Generate allergen label image (simplified - in production, use canvas or image generation)
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 300);

    // Title
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('ALLERGEN WARNING', 20, 40);

    // Product name
    ctx.fillStyle = '#000000';
    ctx.font = '18px Arial';
    ctx.fillText(product.productName.substring(0, 30), 20, 80);

    // Allergens
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Contains:', 20, 120);

    let yPos = 150;
    product.allergens.forEach((allergen, index) => {
      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      ctx.fillText(`• ${allergen.name}`, 30, yPos);
      yPos += 25;
    });

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  };

  const handleDownloadLabel = async (product) => {
    try {
      const blob = await generateAllergenLabel(product);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `allergen-label-${product.barcode || Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating label:', error);
      alert('Failed to generate label');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      await updateDoc(doc(db, 'scanning_sessions', sessionId), {
        status: 'submitted',
        submittedAt: new Date().toISOString()
      });

      alert('Session submitted successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting session:', error);
      alert('Failed to submit session');
    } finally {
      setSubmitting(false);
    }
  };

  const allergenWarnings = products.filter(p => p.allergens && p.allergens.length > 0);

  return (
    <div className="session-review">
      <div className="review-header">
        <h1>Review Session</h1>
        <p>Please review the scanned products before submitting</p>
      </div>

      <div className="review-summary">
        <div className="summary-card">
          <h3>Total Products</h3>
          <p className="summary-value">{products.length}</p>
        </div>

        <div className="summary-card">
          <h3>Products with Allergens</h3>
          <p className="summary-value warning">{allergenWarnings.length}</p>
        </div>

        <div className="summary-card">
          <h3>Total Quantity</h3>
          <p className="summary-value">
            {products.reduce((sum, p) => sum + (p.quantity || 0), 0)}
          </p>
        </div>
      </div>

      {allergenWarnings.length > 0 && (
        <div className="allergen-warnings-section">
          <h2>⚠️ Products with Allergen Warnings</h2>
          <div className="warning-products-list">
            {allergenWarnings.map((product, index) => (
              <div key={index} className="warning-product-card">
                <div className="product-info">
                  <h3>{product.productName}</h3>
                  {product.brand && <p className="brand">{product.brand}</p>}
                  <div className="allergen-tags">
                    {product.allergens.map((allergen, i) => (
                      <span key={i} className="allergen-tag">
                        {allergen.name}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => handleDownloadLabel(product)}
                >
                  Download Label
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="all-products-section">
        <h2>All Products</h2>
        <table className="products-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Brand</th>
              <th>Quantity</th>
              <th>Damaged</th>
              <th>Allergens</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={index}>
                <td>{product.productName}</td>
                <td>{product.brand || '-'}</td>
                <td>{product.quantity}</td>
                <td>{product.damaged || 0}</td>
                <td>
                  {product.allergens && product.allergens.length > 0 ? (
                    <div className="allergen-tags">
                      {product.allergens.map((allergen, i) => (
                        <span key={i} className="allergen-tag-small">
                          {allergen.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted">None</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="review-actions">
        <button
          className="btn-secondary"
          onClick={() => navigate(-1)}
        >
          Back to Session
        </button>
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Session'}
        </button>
      </div>
    </div>
  );
};

export default SessionReview;
