import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, addDoc, updateDoc, doc, getDoc } from '../../config/mockFirebase';
import { db } from '../../config/mockFirebase';
import { useAuth } from '../../contexts/AuthContext';
import BarcodeScanner from './BarcodeScanner';
import ProductForm from './ProductForm';
import { detectAllergens } from '../../utils/allergenDetection';

const ScanningSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const vendor = location.state?.vendor;

  const [sessionId, setSessionId] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [scannedProducts, setScannedProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [allergenWarningCount, setAllergenWarningCount] = useState(0);

  useEffect(() => {
    if (!vendor) {
      navigate('/dashboard');
      return;
    }
    startSession();
  }, []);

  const startSession = async () => {
    try {
      const startTime = new Date().toISOString();
      const sessionDoc = await addDoc(collection(db, 'scanning_sessions'), {
        vendorId: vendor.id,
        vendorName: vendor.name,
        receiverId: currentUser.uid,
        receiverName: userProfile.name,
        location: userProfile.location,
        startTime,
        status: 'in_progress',
        productsScanned: 0,
        allergenWarnings: 0,
        createdAt: startTime
      });

      setSessionId(sessionDoc.id);
      setSessionStartTime(startTime);
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start scanning session');
    }
  };

  const handleBarcodeScanned = async (barcode, openFoodFactsData) => {
    setShowScanner(false);

    // Check if product exists in local database first
    const productQuery = await getDoc(doc(db, 'products', barcode));

    if (productQuery.exists()) {
      // Found in local database
      const productData = productQuery.data();
      setCurrentProduct({
        barcode,
        ...productData,
        quantity: 1,
        damaged: 0
      });
      setShowProductForm(true);
    } else if (openFoodFactsData && openFoodFactsData.found) {
      // Found in Open Food Facts - pre-fill the form
      setCurrentProduct({
        barcode,
        productName: openFoodFactsData.productName || '',
        brand: openFoodFactsData.brand || '',
        ingredients: openFoodFactsData.ingredients || '',
        imageUrl: openFoodFactsData.imageUrl || '',
        quantity: 1,
        damaged: 0,
        allergens: [],
        categories: openFoodFactsData.categories || '',
        nutritionData: openFoodFactsData.nutritionData || {}
      });
      setShowProductForm(true);
    } else {
      // Not found anywhere - show empty form
      setCurrentProduct({
        barcode,
        productName: '',
        brand: '',
        ingredients: '',
        quantity: 1,
        damaged: 0,
        allergens: []
      });
      setShowProductForm(true);
    }
  };

  const handleProductSave = async (product) => {
    try {
      // Detect allergens
      const allergens = detectAllergens(product.ingredients);
      const productWithAllergens = { ...product, allergens };

      // Save to products collection if new
      if (!product.id) {
        await addDoc(collection(db, 'products'), {
          barcode: product.barcode,
          productName: product.productName,
          brand: product.brand,
          ingredients: product.ingredients,
          allergens,
          imageUrl: product.imageUrl || '',
          createdAt: new Date().toISOString()
        });
      }

      // Add to inventory
      await addDoc(collection(db, 'inventory'), {
        ...productWithAllergens,
        sessionId,
        vendorId: vendor.id,
        receiverId: currentUser.uid,
        location: userProfile.location,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Update scanned products
      const newProducts = [...scannedProducts, productWithAllergens];
      setScannedProducts(newProducts);

      // Update allergen warning count
      if (allergens.length > 0) {
        setAllergenWarningCount(prev => prev + 1);
      }

      // Update session
      await updateDoc(doc(db, 'scanning_sessions', sessionId), {
        productsScanned: newProducts.length,
        allergenWarnings: allergenWarningCount + (allergens.length > 0 ? 1 : 0),
        products: newProducts
      });

      setShowProductForm(false);
      setCurrentProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const completeSession = async () => {
    if (scannedProducts.length === 0) {
      alert('Please scan at least one product before completing the session');
      return;
    }

    try {
      await updateDoc(doc(db, 'scanning_sessions', sessionId), {
        status: 'completed',
        endTime: new Date().toISOString()
      });

      navigate('/review', { state: { sessionId, products: scannedProducts } });
    } catch (error) {
      console.error('Error completing session:', error);
      alert('Failed to complete session');
    }
  };

  const removeProduct = (index) => {
    const newProducts = scannedProducts.filter((_, i) => i !== index);
    setScannedProducts(newProducts);
  };

  return (
    <div className="scanning-session">
      <div className="session-header">
        <div className="session-info">
          <h1>Scanning Session</h1>
          <p>Vendor: {vendor?.name}</p>
          <p className="session-time">
            Started: {sessionStartTime && new Date(sessionStartTime).toLocaleString()}
          </p>
        </div>

        <div className="session-stats">
          <div className="stat">
            <span className="stat-label">Products</span>
            <span className="stat-value">{scannedProducts.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Warnings</span>
            <span className="stat-value warning">{allergenWarningCount}</span>
          </div>
        </div>
      </div>

      <div className="scanning-actions">
        <button
          className="btn-primary btn-large"
          onClick={() => setShowScanner(true)}
        >
          Scan Barcode
        </button>

        <button
          className="btn-secondary btn-large"
          onClick={() => {
            setCurrentProduct({
              barcode: '',
              productName: '',
              brand: '',
              ingredients: '',
              quantity: 1,
              damaged: 0,
              allergens: []
            });
            setShowProductForm(true);
          }}
        >
          Add Manually
        </button>
      </div>

      <div className="scanned-products">
        <h2>Scanned Products ({scannedProducts.length})</h2>

        {scannedProducts.length === 0 ? (
          <div className="empty-state">
            <p>No products scanned yet</p>
            <p>Click "Scan Barcode" to begin</p>
          </div>
        ) : (
          <div className="products-list">
            {scannedProducts.map((product, index) => (
              <div key={index} className="product-card">
                <div className="product-info">
                  <h3>{product.productName}</h3>
                  {product.brand && <p className="brand">{product.brand}</p>}
                  <p className="quantity">Quantity: {product.quantity}</p>
                  {product.damaged > 0 && (
                    <p className="damaged">Damaged: {product.damaged}</p>
                  )}
                  {product.allergens && product.allergens.length > 0 && (
                    <div className="allergen-tags">
                      {product.allergens.map((allergen, i) => (
                        <span key={i} className="allergen-tag">
                          {allergen.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  className="btn-remove"
                  onClick={() => removeProduct(index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="session-footer">
        <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
          Cancel
        </button>
        <button
          className="btn-primary"
          onClick={completeSession}
          disabled={scannedProducts.length === 0}
        >
          Complete Session
        </button>
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showProductForm && currentProduct && (
        <ProductForm
          product={currentProduct}
          onSave={handleProductSave}
          onClose={() => {
            setShowProductForm(false);
            setCurrentProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default ScanningSession;
