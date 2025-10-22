import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from '../../config/mockFirebase';
import { db } from '../../config/mockFirebase';
import { getAllergenIcon } from '../../utils/allergenDetection';
import '../../styles/scanning-allergens.css';

const MyAllergens = ({ receiverId }) => {
  const [allergenData, setAllergenData] = useState({});
  const [products, setProducts] = useState([]);
  const [filterAllergen, setFilterAllergen] = useState('all');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('overview'); // overview, products, table

  useEffect(() => {
    loadAllergenData();
  }, [receiverId]);

  const loadAllergenData = async () => {
    try {
      // Load inventory items scanned by this receiver
      const q = query(
        collection(db, 'inventory'),
        where('receiverId', '==', receiverId)
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setProducts(items);

      // Calculate allergen statistics
      const stats = {};
      items.forEach(item => {
        if (item.allergens && item.allergens.length > 0) {
          item.allergens.forEach(allergen => {
            if (!stats[allergen.name]) {
              stats[allergen.name] = {
                count: 0,
                products: [],
                priority: allergen.priority || 'medium'
              };
            }
            stats[allergen.name].count += 1;
            stats[allergen.name].products.push(item);
          });
        }
      });

      setAllergenData(stats);
    } catch (error) {
      console.error('Error loading allergen data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = filterAllergen === 'all'
    ? products
    : products.filter(p => p.allergens?.some(a => a.name === filterAllergen));

  const productsWithAllergens = products.filter(p => p.allergens && p.allergens.length > 0);
  const highRiskProducts = products.filter(p => p.allergens && p.allergens.length >= 3);

  // Calculate percentage
  const getPercentage = (count) => {
    const total = products.length;
    return total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  };

  // Get max count for visual bar sizing
  const maxCount = Math.max(...Object.values(allergenData).map(d => d.count), 1);

  // Sort allergens by count
  const sortedAllergens = Object.entries(allergenData).sort((a, b) => b[1].count - a[1].count);

  if (loading) {
    return (
      <div className="loading-state-premium">
        <div className="loading-spinner"></div>
        <p>Loading allergen data...</p>
      </div>
    );
  }

  return (
    <div className="my-allergens-premium">
      {/* Stats Overview */}
      <div className="allergen-stats-grid-premium">
        <div className="allergen-stat-card stat-total-products">
          <div className="stat-icon-circle-large blue-gradient">
            <span className="stat-emoji-large">📦</span>
          </div>
          <div className="stat-content-large">
            <h4 className="stat-number-large">{products.length}</h4>
            <p className="stat-label-large">Total Products Scanned</p>
            <div className="stat-progress-bar">
              <div className="stat-progress-fill blue-fill" style={{width: '100%'}}></div>
            </div>
          </div>
        </div>

        <div className="allergen-stat-card stat-with-allergens">
          <div className="stat-icon-circle-large orange-gradient">
            <span className="stat-emoji-large">⚠️</span>
          </div>
          <div className="stat-content-large">
            <h4 className="stat-number-large">{productsWithAllergens.length}</h4>
            <p className="stat-label-large">Products with Allergens</p>
            <div className="stat-progress-bar">
              <div className="stat-progress-fill orange-fill" style={{width: `${getPercentage(productsWithAllergens.length)}%`}}></div>
            </div>
            <span className="stat-percentage">{getPercentage(productsWithAllergens.length)}%</span>
          </div>
        </div>

        <div className="allergen-stat-card stat-unique-allergens">
          <div className="stat-icon-circle-large purple-gradient">
            <span className="stat-emoji-large">🧪</span>
          </div>
          <div className="stat-content-large">
            <h4 className="stat-number-large">{Object.keys(allergenData).length}</h4>
            <p className="stat-label-large">Unique Allergen Types</p>
            <div className="stat-tags">
              {Object.keys(allergenData).slice(0, 3).map(allergen => (
                <span key={allergen} className="mini-tag">{allergen}</span>
              ))}
              {Object.keys(allergenData).length > 3 && (
                <span className="mini-tag">+{Object.keys(allergenData).length - 3}</span>
              )}
            </div>
          </div>
        </div>

        <div className="allergen-stat-card stat-high-risk">
          <div className="stat-icon-circle-large red-gradient">
            <span className="stat-emoji-large">🚨</span>
          </div>
          <div className="stat-content-large">
            <h4 className="stat-number-large">{highRiskProducts.length}</h4>
            <p className="stat-label-large">High Risk Products</p>
            <p className="stat-sublabel">(3+ allergens)</p>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="view-mode-toggle">
        <button
          className={`view-mode-btn ${viewMode === 'overview' ? 'active' : ''}`}
          onClick={() => setViewMode('overview')}
        >
          <span className="view-icon">📊</span>
          Allergen Overview
        </button>
        <button
          className={`view-mode-btn ${viewMode === 'products' ? 'active' : ''}`}
          onClick={() => setViewMode('products')}
        >
          <span className="view-icon">📦</span>
          Product List
        </button>
        <button
          className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => setViewMode('table')}
        >
          <span className="view-icon">📋</span>
          Table View
        </button>
      </div>

      {/* Allergen Overview */}
      {viewMode === 'overview' && (
        <div className="allergen-overview-section">
          <div className="section-header-visual">
            <h2 className="section-title-visual">
              <span className="section-icon-visual">📊</span>
              Allergen Distribution
            </h2>
            <p className="section-subtitle-visual">
              Visual breakdown of allergens found in your scanned products
            </p>
          </div>

          <div className="allergen-chart-cards">
            {sortedAllergens.length > 0 ? (
              sortedAllergens.map(([allergen, data]) => {
                const percentage = ((data.count / maxCount) * 100);
                const icon = getAllergenIcon(allergen);

                return (
                  <div key={allergen} className={`allergen-chart-card priority-${data.priority}`}>
                    <div className="chart-card-header">
                      <div className="chart-allergen-name">
                        <span className="chart-allergen-icon">{icon}</span>
                        <h3>{allergen}</h3>
                      </div>
                      <span className={`priority-badge priority-${data.priority}`}>
                        {data.priority === 'high' ? '🔴 High Priority' : '🟡 Medium'}
                      </span>
                    </div>

                    <div className="chart-card-body">
                      <div className="chart-stat-row">
                        <span className="chart-stat-label">Products Affected</span>
                        <span className="chart-stat-value">{data.count}</span>
                      </div>

                      <div className="chart-visual-bar">
                        <div
                          className={`chart-bar-fill priority-${data.priority}`}
                          style={{width: `${percentage}%`}}
                        >
                          <span className="bar-label">{data.count}</span>
                        </div>
                      </div>

                      <div className="chart-percentage">
                        {getPercentage(data.count)}% of total inventory
                      </div>

                      <button
                        className="chart-view-products-btn"
                        onClick={() => {
                          setFilterAllergen(allergen);
                          setViewMode('products');
                        }}
                      >
                        <span>View Products</span>
                        <span className="btn-arrow">→</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state-premium">
                <div className="empty-icon">🎉</div>
                <h3>No Allergens Detected!</h3>
                <p>Great news! None of your scanned products contain any priority allergens.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products View */}
      {viewMode === 'products' && (
        <div className="products-view-section">
          <div className="products-view-header">
            <div>
              <h2 className="section-title-visual">
                <span className="section-icon-visual">📦</span>
                Product Inventory
              </h2>
              <p className="section-subtitle-visual">
                {filterAllergen === 'all'
                  ? `Showing all ${filteredProducts.length} products`
                  : `Showing ${filteredProducts.length} products with ${filterAllergen}`}
              </p>
            </div>

            <div className="products-filter-dropdown">
              <label className="filter-label-dropdown">
                <span className="filter-icon">🔍</span>
                Filter by Allergen
              </label>
              <select
                className="premium-select"
                value={filterAllergen}
                onChange={(e) => setFilterAllergen(e.target.value)}
              >
                <option value="all">All Products ({products.length})</option>
                {sortedAllergens.map(([allergen, data]) => (
                  <option key={allergen} value={allergen}>
                    {allergen} ({data.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="products-grid-premium">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card-premium">
                {product.imageUrl ? (
                  <div className="product-image-wrapper">
                    <img src={product.imageUrl} alt={product.productName} />
                    {product.allergens && product.allergens.length >= 3 && (
                      <div className="high-risk-badge">
                        <span>🚨 High Risk</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="product-image-placeholder">
                    <span className="placeholder-icon">📦</span>
                  </div>
                )}

                <div className="product-card-content">
                  <h4 className="product-card-name">{product.productName}</h4>
                  {product.brand && <p className="product-card-brand">{product.brand}</p>}

                  <div className="product-card-meta">
                    <span className="meta-badge">
                      <span className="meta-icon">📦</span>
                      Qty: {product.quantity}
                    </span>
                    <span className="meta-badge">
                      <span className="meta-icon">📅</span>
                      {new Date(product.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {product.allergens && product.allergens.length > 0 ? (
                    <div className="product-allergen-list">
                      <span className="allergen-list-label">Contains:</span>
                      <div className="product-allergen-tags">
                        {product.allergens.map((allergen, i) => (
                          <span key={i} className={`product-allergen-tag priority-${allergen.priority}`}>
                            {getAllergenIcon(allergen.name)} {allergen.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="no-allergens-badge">
                      <span className="safe-icon">✓</span>
                      No allergens
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="empty-state-premium">
                <div className="empty-icon">🔍</div>
                <h3>No Products Found</h3>
                <p>No products match your current filter. Try selecting a different allergen.</p>
                <button className="btn-reset-filter" onClick={() => setFilterAllergen('all')}>
                  View All Products
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="table-view-section">
          {/* Allergen Statistics Table */}
          <div className="table-container-premium">
            <div className="table-header-section">
              <h2 className="section-title-visual">
                <span className="section-icon-visual">📊</span>
                Allergen Statistics
              </h2>
              <p className="section-subtitle-visual">
                Comprehensive breakdown of all allergens detected
              </p>
            </div>

            <div className="premium-table-wrapper">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Allergen</th>
                    <th>Priority</th>
                    <th>Products Affected</th>
                    <th>% of Inventory</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAllergens.length > 0 ? (
                    sortedAllergens.map(([allergen, data]) => (
                      <tr key={allergen} className={`priority-row-${data.priority}`}>
                        <td>
                          <div className="table-allergen-cell">
                            <span className="table-allergen-icon">{getAllergenIcon(allergen)}</span>
                            <span className="table-allergen-name">{allergen}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`table-priority-badge priority-${data.priority}`}>
                            {data.priority === 'high' ? '🔴 High' : '🟡 Medium'}
                          </span>
                        </td>
                        <td>
                          <span className="table-count-badge">{data.count}</span>
                        </td>
                        <td>
                          <div className="table-percentage-cell">
                            <span className="percentage-value">{getPercentage(data.count)}%</span>
                            <div className="mini-progress-bar">
                              <div
                                className={`mini-progress-fill priority-${data.priority}`}
                                style={{width: `${getPercentage(data.count)}%`}}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <button
                            className="table-action-btn"
                            onClick={() => {
                              setFilterAllergen(allergen);
                              setViewMode('products');
                            }}
                          >
                            View Products →
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="table-empty-cell">
                        <div className="table-empty-state">
                          <span className="empty-icon">🎉</span>
                          <p>No allergens detected in any products</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Inventory Table */}
          <div className="table-container-premium">
            <div className="table-header-section">
              <h2 className="section-title-visual">
                <span className="section-icon-visual">📦</span>
                Product Inventory
              </h2>
              <p className="section-subtitle-visual">
                {filterAllergen === 'all'
                  ? `All ${products.length} products in inventory`
                  : `${filteredProducts.length} products containing ${filterAllergen}`}
              </p>
            </div>

            {/* Filter Dropdown */}
            <div className="table-filter-row">
              <div className="products-filter-dropdown">
                <label className="filter-label-dropdown">
                  <span className="filter-icon">🔍</span>
                  Filter by Allergen
                </label>
                <select
                  className="premium-select"
                  value={filterAllergen}
                  onChange={(e) => setFilterAllergen(e.target.value)}
                >
                  <option value="all">All Products ({products.length})</option>
                  {sortedAllergens.map(([allergen, data]) => (
                    <option key={allergen} value={allergen}>
                      {allergen} ({data.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="premium-table-wrapper">
              <table className="premium-table product-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Brand</th>
                    <th>Quantity</th>
                    <th>Added Date</th>
                    <th>Allergens</th>
                    <th>Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <tr key={product.id}>
                        <td>
                          <div className="table-product-cell">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.productName}
                                className="table-product-image"
                              />
                            ) : (
                              <div className="table-product-placeholder">📦</div>
                            )}
                            <span className="table-product-name">{product.productName}</span>
                          </div>
                        </td>
                        <td>
                          <span className="table-brand-text">
                            {product.brand || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className="table-quantity-badge">{product.quantity}</span>
                        </td>
                        <td>
                          <span className="table-date-text">
                            {new Date(product.addedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </td>
                        <td>
                          <div className="table-allergen-tags">
                            {product.allergens && product.allergens.length > 0 ? (
                              product.allergens.map((allergen, i) => (
                                <span key={i} className={`table-allergen-tag priority-${allergen.priority}`}>
                                  {getAllergenIcon(allergen.name)} {allergen.name}
                                </span>
                              ))
                            ) : (
                              <span className="table-no-allergen">✓ None</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {product.allergens && product.allergens.length >= 3 ? (
                            <span className="table-risk-badge high-risk">
                              🚨 High Risk
                            </span>
                          ) : product.allergens && product.allergens.length > 0 ? (
                            <span className="table-risk-badge medium-risk">
                              ⚠️ Medium
                            </span>
                          ) : (
                            <span className="table-risk-badge safe">
                              ✓ Safe
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="table-empty-cell">
                        <div className="table-empty-state">
                          <span className="empty-icon">🔍</span>
                          <p>No products match your filter criteria</p>
                          <button
                            className="btn-reset-filter"
                            onClick={() => setFilterAllergen('all')}
                          >
                            View All Products
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAllergens;
