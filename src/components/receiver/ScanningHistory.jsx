import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from '../../config/firebase';
import { db } from '../../config/firebase';
import '../../styles/scanning-allergens.css';

const ScanningHistory = ({ receiverId }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all'); // all, today, week, month
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadHistory();
  }, [receiverId]);

  const loadHistory = async () => {
    try {
      // Fetch without orderBy to avoid composite index requirement
      const q = query(
        collection(db, 'scanning_sessions'),
        where('receiverId', '==', receiverId)
      );
      const snapshot = await getDocs(q);
      const sessionList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => {
        // Sort by createdAt or startTime, descending (newest first)
        const dateA = new Date(a.createdAt || a.startTime);
        const dateB = new Date(b.createdAt || b.startTime);
        return dateB - dateA;
      });
      setSessions(sessionList);
      console.log('Loaded history sessions:', sessionList);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (startTime, endTime) => {
    if (!endTime) return 'In Progress';

    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = Math.floor((end - start) / 1000 / 60);

    if (diff < 1) return '<1 min';
    if (diff < 60) return `${diff} min`;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}m`;
  };

  const filterSessions = () => {
    let filtered = sessions;

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.startTime);
        if (timeFilter === 'today') {
          return sessionDate.toDateString() === now.toDateString();
        }
        if (timeFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return sessionDate >= weekAgo;
        }
        if (timeFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return sessionDate >= monthAgo;
        }
        return true;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    return filtered;
  };

  const filteredSessions = filterSessions();

  // Calculate stats
  const stats = {
    total: sessions.length,
    completed: sessions.filter(s => s.status === 'completed').length,
    totalProducts: sessions.reduce((sum, s) => sum + (s.productsScanned || 0), 0),
    totalWarnings: sessions.reduce((sum, s) => sum + (s.allergenWarnings || 0), 0)
  };

  if (loading) {
    return (
      <div className="loading-state-premium">
        <div className="loading-spinner"></div>
        <p>Loading your scanning history...</p>
      </div>
    );
  }

  return (
    <div className="scanning-history-premium">
      {/* Stats Overview */}
      <div className="history-stats-grid">
        <div className="history-stat-card stat-total">
          <div className="stat-icon-circle blue-gradient">
            <span className="stat-emoji">📊</span>
          </div>
          <div className="stat-details">
            <h4 className="stat-number">{stats.total}</h4>
            <p className="stat-label">Total Sessions</p>
          </div>
        </div>

        <div className="history-stat-card stat-completed">
          <div className="stat-icon-circle green-gradient">
            <span className="stat-emoji">✓</span>
          </div>
          <div className="stat-details">
            <h4 className="stat-number">{stats.completed}</h4>
            <p className="stat-label">Completed</p>
          </div>
        </div>

        <div className="history-stat-card stat-products">
          <div className="stat-icon-circle purple-gradient">
            <span className="stat-emoji">📦</span>
          </div>
          <div className="stat-details">
            <h4 className="stat-number">{stats.totalProducts}</h4>
            <p className="stat-label">Products Scanned</p>
          </div>
        </div>

        <div className="history-stat-card stat-warnings">
          <div className="stat-icon-circle red-gradient">
            <span className="stat-emoji">⚠️</span>
          </div>
          <div className="stat-details">
            <h4 className="stat-number">{stats.totalWarnings}</h4>
            <p className="stat-label">Allergen Warnings</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="history-filters">
        <div className="filter-group">
          <label className="filter-label">
            <span className="filter-icon">📅</span>
            Time Period
          </label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${timeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTimeFilter('all')}
            >
              All Time
            </button>
            <button
              className={`filter-btn ${timeFilter === 'today' ? 'active' : ''}`}
              onClick={() => setTimeFilter('today')}
            >
              Today
            </button>
            <button
              className={`filter-btn ${timeFilter === 'week' ? 'active' : ''}`}
              onClick={() => setTimeFilter('week')}
            >
              This Week
            </button>
            <button
              className={`filter-btn ${timeFilter === 'month' ? 'active' : ''}`}
              onClick={() => setTimeFilter('month')}
            >
              This Month
            </button>
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">
            <span className="filter-icon">🔍</span>
            Status
          </label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('completed')}
            >
              Completed
            </button>
            <button
              className={`filter-btn ${statusFilter === 'in_progress' ? 'active' : ''}`}
              onClick={() => setStatusFilter('in_progress')}
            >
              In Progress
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="history-timeline">
        {filteredSessions.map((session, index) => (
          <div key={session.id} className="timeline-item" onClick={() => setSelectedSession(session)}>
            <div className="timeline-marker">
              <div className="timeline-dot"></div>
              {index !== filteredSessions.length - 1 && <div className="timeline-line"></div>}
            </div>

            <div className="timeline-card">
              <div className="timeline-card-header">
                <div className="timeline-header-left">
                  <div className="vendor-icon-wrapper">
                    <span className="vendor-icon">🏪</span>
                  </div>
                  <div>
                    <h3 className="timeline-vendor-name">{session.vendorName}</h3>
                    <p className="timeline-date">
                      {new Date(session.startTime).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <span className={`timeline-status-badge status-${session.status}`}>
                  {session.status === 'completed' && '✓ Completed'}
                  {session.status === 'in_progress' && '⟳ In Progress'}
                  {session.status === 'submitted' && '✓ Submitted'}
                </span>
              </div>

              <div className="timeline-card-body">
                <div className="timeline-metrics">
                  <div className="timeline-metric">
                    <span className="metric-icon">🕐</span>
                    <div>
                      <span className="metric-value">{new Date(session.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="metric-label">Start Time</span>
                    </div>
                  </div>

                  <div className="timeline-metric">
                    <span className="metric-icon">⏱️</span>
                    <div>
                      <span className="metric-value">{formatDuration(session.startTime, session.endTime)}</span>
                      <span className="metric-label">Duration</span>
                    </div>
                  </div>

                  <div className="timeline-metric">
                    <span className="metric-icon">📦</span>
                    <div>
                      <span className="metric-value">{session.productsScanned || 0}</span>
                      <span className="metric-label">Products</span>
                    </div>
                  </div>

                  {session.allergenWarnings > 0 && (
                    <div className="timeline-metric warning-metric">
                      <span className="metric-icon">⚠️</span>
                      <div>
                        <span className="metric-value">{session.allergenWarnings}</span>
                        <span className="metric-label">Warnings</span>
                      </div>
                    </div>
                  )}
                </div>

                <button className="timeline-view-btn">
                  View Details →
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredSessions.length === 0 && (
          <div className="empty-state-premium">
            <div className="empty-icon">📭</div>
            <h3>No Sessions Found</h3>
            <p>No scanning sessions match your filter criteria. Try adjusting the filters above.</p>
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="modal-overlay-premium" onClick={() => setSelectedSession(null)}>
          <div className="modal-premium modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium">
              <div>
                <h2 className="modal-title">
                  <span className="modal-icon">📊</span>
                  Session Details
                </h2>
                <p className="modal-subtitle">{selectedSession.vendorName}</p>
              </div>
              <button className="modal-close-premium" onClick={() => setSelectedSession(null)}>
                ×
              </button>
            </div>

            <div className="modal-body-premium">
              {/* Session Info Section */}
              <div className="modal-section">
                <h3 className="section-title-modal">
                  <span className="section-icon-modal">ℹ️</span>
                  Session Information
                </h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-icon">📅</span>
                    <div>
                      <span className="info-label">Date</span>
                      <span className="info-value">{new Date(selectedSession.startTime).toLocaleDateString('en-US', { dateStyle: 'full' })}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">🕐</span>
                    <div>
                      <span className="info-label">Start Time</span>
                      <span className="info-value">{new Date(selectedSession.startTime).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  {selectedSession.endTime && (
                    <div className="info-item">
                      <span className="info-icon">🏁</span>
                      <div>
                        <span className="info-label">End Time</span>
                        <span className="info-value">{new Date(selectedSession.endTime).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="info-icon">⏱️</span>
                    <div>
                      <span className="info-label">Duration</span>
                      <span className="info-value">{formatDuration(selectedSession.startTime, selectedSession.endTime)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Section */}
              <div className="modal-section">
                <h3 className="section-title-modal">
                  <span className="section-icon-modal">📦</span>
                  Products Scanned ({selectedSession.products?.length || 0})
                </h3>
                <div className="modal-products-grid">
                  {selectedSession.products && selectedSession.products.length > 0 ? (
                    selectedSession.products.map((product, index) => (
                      <div key={index} className="modal-product-card">
                        {product.imageUrl && (
                          <div className="modal-product-image">
                            <img src={product.imageUrl} alt={product.productName} />
                          </div>
                        )}
                        <div className="modal-product-info">
                          <h4 className="modal-product-name">{product.productName}</h4>
                          {product.brand && <p className="modal-product-brand">{product.brand}</p>}
                          <div className="modal-product-meta">
                            <span className="product-quantity-badge">Qty: {product.quantity}</span>
                            {product.damaged > 0 && (
                              <span className="product-damaged-badge">Damaged: {product.damaged}</span>
                            )}
                          </div>
                          {product.allergens && product.allergens.length > 0 && (
                            <div className="modal-product-allergens">
                              {product.allergens.map((allergen, i) => (
                                <span key={i} className="modal-allergen-tag">
                                  ⚠️ {allergen.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="modal-empty-products">
                      <span className="empty-icon-small">📦</span>
                      <p>No products in this session</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanningHistory;
