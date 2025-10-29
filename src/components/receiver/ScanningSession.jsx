import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, query, where, getDocs } from '../../config/firebase';
import { db } from '../../config/firebase';
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
  const [availableVendors, setAvailableVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(vendor || null);
  const [showVendorSelection, setShowVendorSelection] = useState(!vendor);
  const [loadingVendors, setLoadingVendors] = useState(!vendor);
  const [existingSession, setExistingSession] = useState(null);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    checkForInProgressSession();
  }, []);

  const checkForInProgressSession = async () => {
    try {
      setCheckingSession(true);
      // Look for in-progress sessions
      const sessionsQuery = query(
        collection(db, 'scanning_sessions'),
        where('receiverId', '==', currentUser.uid),
        where('status', '==', 'in_progress')
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);

      if (!sessionsSnapshot.empty) {
        // Found an in-progress session
        const sessionDoc = sessionsSnapshot.docs[0];
        const sessionData = { id: sessionDoc.id, ...sessionDoc.data() };
        setExistingSession(sessionData);
        setShowContinueModal(true);
      } else {
        // No in-progress session, proceed normally
        if (vendor) {
          startSession(vendor);
        } else {
          loadVendors();
        }
      }
    } catch (error) {
      console.error('Error checking for in-progress session:', error);
      // On error, just proceed normally
      if (vendor) {
        startSession(vendor);
      } else {
        loadVendors();
      }
    } finally {
      setCheckingSession(false);
    }
  };

  const continueExistingSession = () => {
    setSessionId(existingSession.id);
    setSessionStartTime(existingSession.startTime);
    setScannedProducts(existingSession.products || []);
    setAllergenWarningCount(existingSession.allergenWarnings || 0);

    // Set vendor if available
    if (existingSession.vendorId) {
      setSelectedVendor({
        id: existingSession.vendorId,
        name: existingSession.vendorName
      });
    }

    setShowContinueModal(false);
    setShowVendorSelection(false);
  };

  const startNewSession = () => {
    setShowContinueModal(false);
    if (vendor) {
      startSession(vendor);
    } else {
      loadVendors();
    }
  };

  const loadVendors = async () => {
    try {
      setLoadingVendors(true);
      const vendorsQuery = query(
        collection(db, 'vendors'),
        where('assignedReceivers', 'array-contains', currentUser.uid),
        where('active', '==', true)
      );
      const vendorsSnapshot = await getDocs(vendorsQuery);
      const vendors = vendorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableVendors(vendors);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleVendorSelect = (vendor) => {
    setSelectedVendor(vendor);
    setShowVendorSelection(false);
    startSession(vendor);
  };

  const startSession = async (vendorData) => {
    try {
      const startTime = new Date().toISOString();
      const sessionData = {
        receiverId: currentUser.uid,
        receiverName: userProfile.name,
        location: userProfile.location,
        startTime,
        status: 'in_progress',
        productsScanned: 0,
        allergenWarnings: 0,
        createdAt: startTime
      };

      // Add vendor info if provided, otherwise mark as "No Vendor"
      if (vendorData) {
        sessionData.vendorId = vendorData.id;
        sessionData.vendorName = vendorData.name;
      } else {
        sessionData.vendorId = null;
        sessionData.vendorName = 'No Vendor Selected';
      }

      const sessionDoc = await addDoc(collection(db, 'scanning_sessions'), sessionData);

      setSessionId(sessionDoc.id);
      setSessionStartTime(startTime);
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start scanning session');
    }
  };

  const handleSkipVendor = () => {
    setSelectedVendor(null);
    setShowVendorSelection(false);
    startSession(null);
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

      // Check if this barcode already exists in scanned products
      const existingProductIndex = scannedProducts.findIndex(
        p => p.barcode && product.barcode && p.barcode === product.barcode
      );

      let newProducts;
      let newAllergenCount = allergenWarningCount;

      if (existingProductIndex !== -1) {
        // Product exists - increase quantity
        newProducts = [...scannedProducts];
        newProducts[existingProductIndex] = {
          ...newProducts[existingProductIndex],
          quantity: newProducts[existingProductIndex].quantity + product.quantity,
          damaged: newProducts[existingProductIndex].damaged + (product.damaged || 0)
        };
      } else {
        // New product - add with unique ID
        const productWithAllergens = {
          ...product,
          allergens,
          uniqueId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          scannedAt: new Date().toISOString(),
          inventoryDocId: null // Will store the Firestore doc ID
        };

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
        const inventoryData = {
          ...productWithAllergens,
          sessionId,
          receiverId: currentUser.uid,
          location: userProfile.location,
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Add vendor info if available
        if (selectedVendor) {
          inventoryData.vendorId = selectedVendor.id;
        } else {
          inventoryData.vendorId = null;
        }

        const inventoryDoc = await addDoc(collection(db, 'inventory'), inventoryData);

        // Store the inventory doc ID with the product
        productWithAllergens.inventoryDocId = inventoryDoc.id;

        newProducts = [...scannedProducts, productWithAllergens];

        // Update allergen warning count only for new products
        if (allergens.length > 0) {
          newAllergenCount += 1;
        }
      }

      setScannedProducts(newProducts);
      setAllergenWarningCount(newAllergenCount);

      // Update session
      await updateDoc(doc(db, 'scanning_sessions', sessionId), {
        productsScanned: newProducts.length,
        allergenWarnings: newAllergenCount,
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

  const removeProduct = async (index) => {
    try {
      const productToRemove = scannedProducts[index];

      // Delete from inventory if it has an inventory doc ID
      if (productToRemove.inventoryDocId) {
        await deleteDoc(doc(db, 'inventory', productToRemove.inventoryDocId));
      }

      // Update allergen warning count
      const hadAllergens = productToRemove.allergens && productToRemove.allergens.length > 0;
      const newAllergenCount = hadAllergens ? allergenWarningCount - 1 : allergenWarningCount;

      // Remove from state
      const newProducts = scannedProducts.filter((_, i) => i !== index);
      setScannedProducts(newProducts);
      setAllergenWarningCount(Math.max(0, newAllergenCount));

      // Update session in database
      await updateDoc(doc(db, 'scanning_sessions', sessionId), {
        productsScanned: newProducts.length,
        allergenWarnings: Math.max(0, newAllergenCount),
        products: newProducts
      });
    } catch (error) {
      console.error('Error removing product:', error);
      alert('Failed to remove product');
    }
  };

  const deleteSession = async () => {
    if (!confirm('Are you sure you want to delete this scanning session? All products and inventory records will be permanently deleted. This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Deleting session:', sessionId);

      // Delete all inventory items associated with this session
      const inventoryQuery = query(
        collection(db, 'inventory'),
        where('sessionId', '==', sessionId)
      );
      const inventorySnapshot = await getDocs(inventoryQuery);

      console.log(`Found ${inventorySnapshot.docs.length} inventory items to delete`);

      // Delete each inventory item
      if (!inventorySnapshot.empty) {
        const deletePromises = inventorySnapshot.docs.map(docSnapshot => {
          console.log('Deleting inventory item:', docSnapshot.id);
          return deleteDoc(docSnapshot.ref);
        });
        await Promise.all(deletePromises);
        console.log('All inventory items deleted');
      }

      // Get all unique product barcodes from this session
      const productBarcodes = [...new Set(scannedProducts
        .filter(p => p.barcode)
        .map(p => p.barcode))];

      console.log('Product barcodes in this session:', productBarcodes);

      // Delete products from products collection
      // Note: We delete all products that were scanned in this session
      // If you want to keep a product catalog, remove this section
      if (productBarcodes.length > 0) {
        const productDeletePromises = productBarcodes.map(async (barcode) => {
          const productQuery = query(
            collection(db, 'products'),
            where('barcode', '==', barcode)
          );
          const productSnapshot = await getDocs(productQuery);

          const deleteProds = productSnapshot.docs.map(docSnapshot => {
            console.log('Deleting product:', docSnapshot.id, barcode);
            return deleteDoc(docSnapshot.ref);
          });

          return Promise.all(deleteProds);
        });

        await Promise.all(productDeletePromises);
        console.log('All products deleted');
      }

      // Delete the session document
      await deleteDoc(doc(db, 'scanning_sessions', sessionId));
      console.log('Session document deleted');

      // Navigate back to dashboard
      alert('Session and all associated data deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting session:', error);
      alert(`Failed to delete session: ${error.message}`);
    }
  };

  // Show loading while checking for existing session
  if (checkingSession) {
    return (
      <div className="scanning-session">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Checking for existing sessions...</p>
        </div>
      </div>
    );
  }

  // Show continue session modal if there's an existing session
  if (showContinueModal && existingSession) {
    return (
      <div className="scanning-session">
        <div className="modal-overlay-premium">
          <div className="modal-premium">
            <div className="modal-header-premium">
              <div>
                <h2 className="modal-title">
                  <span className="modal-icon">⟳</span>
                  Continue Session?
                </h2>
                <p className="modal-subtitle">You have an in-progress scanning session</p>
              </div>
            </div>

            <div className="modal-body-premium">
              <div className="session-info-card">
                <div className="info-row">
                  <span className="info-icon">🏪</span>
                  <div>
                    <span className="info-label">Vendor</span>
                    <span className="info-value">{existingSession.vendorName}</span>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-icon">📅</span>
                  <div>
                    <span className="info-label">Started</span>
                    <span className="info-value">
                      {new Date(existingSession.startTime).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-icon">📦</span>
                  <div>
                    <span className="info-label">Products Scanned</span>
                    <span className="info-value">{existingSession.productsScanned || 0}</span>
                  </div>
                </div>
                {existingSession.allergenWarnings > 0 && (
                  <div className="info-row">
                    <span className="info-icon">⚠️</span>
                    <div>
                      <span className="info-label">Allergen Warnings</span>
                      <span className="info-value warning">{existingSession.allergenWarnings}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button className="btn-primary btn-large" onClick={continueExistingSession}>
                  Continue Session
                </button>
                <button className="btn-secondary btn-large" onClick={startNewSession}>
                  Start New Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show vendor selection if no vendor selected
  if (showVendorSelection) {
    return (
      <div className="scanning-session">
        <div className="vendor-selection-modal">
          <div className="modal-header">
            <h2>Select a Vendor</h2>
            <p>Choose a vendor to start your scanning session</p>
          </div>

          {loadingVendors ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading vendors...</p>
            </div>
          ) : availableVendors.length === 0 ? (
            <div className="empty-state-premium">
              <div className="empty-icon">📭</div>
              <h3>No Vendors Available</h3>
              <p>You don't have any vendors assigned. You can still scan without selecting a vendor.</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'center' }}>
                <button className="btn-primary" onClick={handleSkipVendor}>
                  Scan Without Vendor
                </button>
                <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="vendors-grid-premium">
                {availableVendors.map(vendor => (
                  <div
                    key={vendor.id}
                    className="vendor-card-premium clickable"
                    onClick={() => handleVendorSelect(vendor)}
                  >
                    <div className="vendor-card-header">
                      <div className="vendor-avatar">
                        <span className="avatar-icon">🏪</span>
                      </div>
                      <div className="vendor-info">
                        <h3 className="vendor-name">{vendor.name}</h3>
                        <span className="vendor-status active">Active</span>
                      </div>
                    </div>
                    <div className="vendor-card-body">
                      <div className="vendor-detail">
                        <span className="detail-icon">👤</span>
                        <div className="detail-content">
                          <span className="detail-label">Contact</span>
                          <span className="detail-value">{vendor.contactPerson}</span>
                        </div>
                      </div>
                      <div className="vendor-detail">
                        <span className="detail-icon">📞</span>
                        <div className="detail-content">
                          <span className="detail-label">Phone</span>
                          <span className="detail-value">{vendor.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="vendor-skip-section">
                <p className="skip-text">Don't want to select a vendor?</p>
                <button className="btn-skip-vendor" onClick={handleSkipVendor}>
                  📦 Scan Without Vendor
                </button>
              </div>
            </>
          )}

          <button className="btn-secondary" onClick={() => navigate('/dashboard')} style={{ marginTop: '20px' }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scanning-session">
      <div className="session-header">
        <div className="session-info">
          <h1>Scanning Session</h1>
          <p>Vendor: {selectedVendor?.name || 'No Vendor Selected'}</p>
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
              <div key={product.uniqueId || index} className="product-card">
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
        <div className="session-footer-left">
          <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
          <button className="btn-danger" onClick={deleteSession}>
            Delete Session
          </button>
        </div>
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
