import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from '../../config/firebase';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import UserManagement from './UserManagement';
import VendorManagement from './VendorManagement';
import ScanningActivity from './ScanningActivity';
import AllergenInventory from './AllergenInventory';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ManagerDashboard = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalScans: 0,
    todayScans: 0,
    activeReceivers: 0,
    totalProducts: 0,
    highRiskProducts: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [allergenDistribution, setAllergenDistribution] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [userProfile]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get total scans
      const scansQuery = query(
        collection(db, 'scanning_sessions'),
        where('location', '==', userProfile.location)
      );
      const scansSnapshot = await getDocs(scansQuery);
      const totalScans = scansSnapshot.size;

      // Get today's scans
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayQuery = query(
        collection(db, 'scanning_sessions'),
        where('location', '==', userProfile.location),
        where('createdAt', '>=', today.toISOString())
      );
      const todaySnapshot = await getDocs(todayQuery);

      // Get active receivers
      const receiversQuery = query(
        collection(db, 'users'),
        where('role', '==', 'receiver'),
        where('location', '==', userProfile.location),
        where('active', '==', true)
      );
      const receiversSnapshot = await getDocs(receiversQuery);

      // Get products with allergens
      const productsQuery = query(collection(db, 'products'));
      const productsSnapshot = await getDocs(productsQuery);

      let highRisk = 0;
      const allergenCount = {};

      productsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.allergens && data.allergens.length > 0) {
          if (data.allergens.length >= 3) highRisk++;

          data.allergens.forEach(allergen => {
            allergenCount[allergen.name] = (allergenCount[allergen.name] || 0) + 1;
          });
        }
      });

      // Get recent activity
      const recentQuery = query(
        collection(db, 'scanning_sessions'),
        where('location', '==', userProfile.location),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const recentSnapshot = await getDocs(recentQuery);
      const activities = recentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setStats({
        totalScans,
        todayScans: todaySnapshot.size,
        activeReceivers: receiversSnapshot.size,
        totalProducts: productsSnapshot.size,
        highRiskProducts: highRisk
      });

      setRecentActivity(activities);
      setAllergenDistribution(allergenCount);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const allergenChartData = {
    labels: Object.keys(allergenDistribution),
    datasets: [
      {
        label: 'Allergen Occurrences',
        data: Object.values(allergenDistribution),
        backgroundColor: [
          '#3b82f6',
          '#60a5fa',
          '#93c5fd',
          '#dbeafe',
          '#1e40af',
          '#2563eb',
          '#1d4ed8',
          '#1e3a8a',
          '#1f2937',
          '#374151',
          '#4b5563'
        ]
      }
    ]
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Manager Dashboard</h1>
        <p>Welcome, {userProfile?.name} - {userProfile?.location}</p>
      </div>

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'overview' ? 'tab-active' : 'tab'}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'users' ? 'tab-active' : 'tab'}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button
          className={activeTab === 'vendors' ? 'tab-active' : 'tab'}
          onClick={() => setActiveTab('vendors')}
        >
          Vendors
        </button>
        <button
          className={activeTab === 'scanning' ? 'tab-active' : 'tab'}
          onClick={() => setActiveTab('scanning')}
        >
          Scanning Activity
        </button>
        <button
          className={activeTab === 'inventory' ? 'tab-active' : 'tab'}
          onClick={() => setActiveTab('inventory')}
        >
          Allergen Inventory
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Scans</h3>
                <p className="stat-value">{stats.totalScans}</p>
                <span className="stat-label">All time</span>
              </div>

              <div className="stat-card">
                <h3>Today's Scans</h3>
                <p className="stat-value">{stats.todayScans}</p>
                <span className="stat-label">Last 24 hours</span>
              </div>

              <div className="stat-card">
                <h3>Active Receivers</h3>
                <p className="stat-value">{stats.activeReceivers}</p>
                <span className="stat-label">Currently active</span>
              </div>

              <div className="stat-card">
                <h3>Total Products</h3>
                <p className="stat-value">{stats.totalProducts}</p>
                <span className="stat-label">In database</span>
              </div>

              <div className="stat-card alert">
                <h3>High Risk Products</h3>
                <p className="stat-value">{stats.highRiskProducts}</p>
                <span className="stat-label">3+ allergens</span>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-card">
                <h3>Allergen Distribution</h3>
                <div className="chart-container">
                  {Object.keys(allergenDistribution).length > 0 ? (
                    <Doughnut data={allergenChartData} options={{ maintainAspectRatio: false }} />
                  ) : (
                    <p>No allergen data available</p>
                  )}
                </div>
              </div>

              <div className="chart-card">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  {recentActivity.length > 0 ? (
                    recentActivity.map(activity => (
                      <div key={activity.id} className="activity-item">
                        <div className="activity-info">
                          <p className="activity-vendor">{activity.vendorName}</p>
                          <p className="activity-receiver">{activity.receiverName}</p>
                        </div>
                        <div className="activity-meta">
                          <span className="activity-count">{activity.productsScanned || 0} items</span>
                          <span className="activity-date">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'users' && <UserManagement location={userProfile?.location} />}
        {activeTab === 'vendors' && <VendorManagement location={userProfile?.location} />}
        {activeTab === 'scanning' && <ScanningActivity location={userProfile?.location} />}
        {activeTab === 'inventory' && <AllergenInventory location={userProfile?.location} />}
      </div>
    </div>
  );
};

export default ManagerDashboard;
