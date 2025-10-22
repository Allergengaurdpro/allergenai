import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from '../../config/mockFirebase';
import { db } from '../../config/mockFirebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ScanningHistory from './ScanningHistory';
import MyAllergens from './MyAllergens';
import '../../styles/premium-dashboard.css';

const ReceiverDashboard = () => {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tasks');
  const [assignedVendors, setAssignedVendors] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [stats, setStats] = useState({
    todayScans: 0,
    weekScans: 0,
    totalProducts: 0,
    allergenWarnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load assigned vendors
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
      setAssignedVendors(vendors);

      // Load recent sessions
      const sessionsQuery = query(
        collection(db, 'scanning_sessions'),
        where('receiverId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentSessions(sessions);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);

      const todayScans = sessions.filter(s =>
        new Date(s.createdAt) >= today
      ).length;

      const weekScans = sessions.filter(s =>
        new Date(s.createdAt) >= weekAgo
      ).length;

      let totalProducts = 0;
      let allergenWarnings = 0;

      sessions.forEach(session => {
        totalProducts += session.productsScanned || 0;
        allergenWarnings += session.allergenWarnings || 0;
      });

      setStats({
        todayScans,
        weekScans,
        totalProducts,
        allergenWarnings
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startScanning = (vendor) => {
    navigate('/scan', { state: { vendor } });
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container premium-dashboard">
      {/* Premium Header with gradient background */}
      <div className="dashboard-header-premium">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="dashboard-title">
              <span className="title-icon">📊</span>
              Receiver Dashboard
            </h1>
            <p className="dashboard-subtitle">Welcome back, <span className="user-name">{userProfile?.name}</span></p>
          </div>
          <div className="header-date">
            <div className="date-badge">
              <span className="date-icon">📅</span>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Tabs */}
      <div className="dashboard-tabs-premium">
        <button
          className={`tab-premium ${activeTab === 'tasks' ? 'tab-premium-active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <span className="tab-icon">✓</span>
          My Tasks
        </button>
        <button
          className={`tab-premium ${activeTab === 'history' ? 'tab-premium-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <span className="tab-icon">📋</span>
          Scanning History
        </button>
        <button
          className={`tab-premium ${activeTab === 'allergens' ? 'tab-premium-active' : ''}`}
          onClick={() => setActiveTab('allergens')}
        >
          <span className="tab-icon">⚠️</span>
          My Allergens
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'tasks' && (
          <>
            <div className="stats-grid-premium">
              <div className="stat-card-premium stat-primary">
                <div className="stat-icon-wrapper stat-icon-blue">
                  <span className="stat-icon-large">📱</span>
                </div>
                <div className="stat-content">
                  <h3 className="stat-title">Today's Scans</h3>
                  <p className="stat-value-premium">{stats.todayScans}</p>
                  <span className="stat-label-premium">Sessions completed today</span>
                </div>
                <div className="stat-trend trend-up">
                  <span className="trend-icon">↑</span>
                  <span className="trend-text">Active</span>
                </div>
              </div>

              <div className="stat-card-premium stat-success">
                <div className="stat-icon-wrapper stat-icon-green">
                  <span className="stat-icon-large">📊</span>
                </div>
                <div className="stat-content">
                  <h3 className="stat-title">This Week</h3>
                  <p className="stat-value-premium">{stats.weekScans}</p>
                  <span className="stat-label-premium">Weekly sessions</span>
                </div>
                <div className="stat-trend trend-up">
                  <span className="trend-icon">↑</span>
                  <span className="trend-text">+12%</span>
                </div>
              </div>

              <div className="stat-card-premium stat-info">
                <div className="stat-icon-wrapper stat-icon-purple">
                  <span className="stat-icon-large">📦</span>
                </div>
                <div className="stat-content">
                  <h3 className="stat-title">Products Scanned</h3>
                  <p className="stat-value-premium">{stats.totalProducts}</p>
                  <span className="stat-label-premium">Total items processed</span>
                </div>
                <div className="stat-trend trend-neutral">
                  <span className="trend-icon">—</span>
                  <span className="trend-text">Stable</span>
                </div>
              </div>

              <div className="stat-card-premium stat-danger">
                <div className="stat-icon-wrapper stat-icon-red">
                  <span className="stat-icon-large">⚠️</span>
                </div>
                <div className="stat-content">
                  <h3 className="stat-title">Allergen Warnings</h3>
                  <p className="stat-value-premium">{stats.allergenWarnings}</p>
                  <span className="stat-label-premium">Critical alerts detected</span>
                </div>
                <div className="stat-trend trend-down">
                  <span className="trend-icon">↓</span>
                  <span className="trend-text">Monitor</span>
                </div>
              </div>
            </div>

            <div className="tasks-section-premium">
              <div className="section-header-premium">
                <h2 className="section-title">
                  <span className="section-icon">🏢</span>
                  Assigned Vendors
                </h2>
                <span className="section-badge">{assignedVendors.length} Active</span>
              </div>
              <div className="vendors-grid-premium">
                {assignedVendors.length > 0 ? (
                  assignedVendors.map(vendor => (
                    <div key={vendor.id} className="vendor-card-premium">
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
                            <span className="detail-label">Contact Person</span>
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
                      <div className="vendor-card-footer">
                        <button
                          className="btn-scan-premium"
                          onClick={() => startScanning(vendor)}
                        >
                          <span className="btn-icon">📱</span>
                          Start Scanning Session
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-premium">
                    <div className="empty-icon">📭</div>
                    <h3>No Vendors Assigned</h3>
                    <p>You don't have any vendors assigned yet. Contact your manager to get started.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="recent-section-premium">
              <div className="section-header-premium">
                <h2 className="section-title">
                  <span className="section-icon">📋</span>
                  Recent Sessions
                </h2>
                <span className="section-badge">{recentSessions.length} Sessions</span>
              </div>
              <div className="sessions-list-premium">
                {recentSessions.length > 0 ? (
                  recentSessions.map(session => (
                    <div key={session.id} className="session-card-premium">
                      <div className="session-card-left">
                        <div className="session-icon-wrapper">
                          <span className="session-icon">📦</span>
                        </div>
                        <div className="session-info-content">
                          <h4 className="session-vendor-name">{session.vendorName}</h4>
                          <div className="session-meta">
                            <span className="session-date">
                              <span className="meta-icon">🕐</span>
                              {new Date(session.startTime).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className="session-products">
                              <span className="meta-icon">📊</span>
                              {session.productsScanned || 0} Products
                            </span>
                            {session.allergenWarnings > 0 && (
                              <span className="session-warnings">
                                <span className="meta-icon">⚠️</span>
                                {session.allergenWarnings} Warnings
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="session-card-right">
                        <span className={`status-badge-premium status-${session.status}`}>
                          {session.status === 'completed' && '✓ Completed'}
                          {session.status === 'in_progress' && '⟳ In Progress'}
                          {session.status === 'submitted' && '✓ Submitted'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-premium">
                    <div className="empty-icon">📊</div>
                    <h3>No Recent Sessions</h3>
                    <p>Start scanning products to see your session history here.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'history' && <ScanningHistory receiverId={currentUser.uid} />}
        {activeTab === 'allergens' && <MyAllergens receiverId={currentUser.uid} />}
      </div>
    </div>
  );
};

export default ReceiverDashboard;
