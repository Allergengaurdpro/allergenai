import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from '../../config/firebase';
import { db } from '../../config/firebase';

const ScanningActivity = ({ location }) => {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [filterReceiver, setFilterReceiver] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [receivers, setReceivers] = useState([]);

  useEffect(() => {
    loadData();
  }, [location]);

  useEffect(() => {
    applyFilters();
  }, [sessions, filterReceiver, filterDate]);

  const loadData = async () => {
    try {
      // Load receivers
      const receiversQuery = query(
        collection(db, 'users'),
        where('location', '==', location),
        where('role', '==', 'receiver')
      );
      const receiversSnapshot = await getDocs(receiversQuery);
      const receiverList = receiversSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReceivers(receiverList);

      // Load sessions
      const sessionsQuery = query(
        collection(db, 'scanning_sessions'),
        where('location', '==', location),
        orderBy('createdAt', 'desc')
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessionList = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessions(sessionList);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    if (filterReceiver !== 'all') {
      filtered = filtered.filter(s => s.receiverId === filterReceiver);
    }

    if (filterDate !== 'all') {
      const now = new Date();
      const filterTimestamp = new Date(now);

      if (filterDate === 'today') {
        filterTimestamp.setHours(0, 0, 0, 0);
      } else if (filterDate === 'week') {
        filterTimestamp.setDate(now.getDate() - 7);
      } else if (filterDate === 'month') {
        filterTimestamp.setMonth(now.getMonth() - 1);
      }

      filtered = filtered.filter(s => new Date(s.createdAt) >= filterTimestamp);
    }

    setFilteredSessions(filtered);
  };

  const getReceiverName = (receiverId) => {
    const receiver = receivers.find(r => r.id === receiverId);
    return receiver?.name || 'Unknown';
  };

  const formatDuration = (startTime, endTime) => {
    if (!endTime) return 'In progress';

    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = Math.floor((end - start) / 1000 / 60); // minutes

    if (diff < 60) return `${diff} minutes`;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: <span className="status-badge status-completed">Completed</span>,
      in_progress: <span className="status-badge status-progress">In Progress</span>,
      submitted: <span className="status-badge status-submitted">Submitted</span>
    };
    return badges[status] || <span className="status-badge">{status}</span>;
  };

  return (
    <div className="scanning-activity">
      <div className="activity-header">
        <h2>Scanning Activity</h2>

        <div className="filters">
          <select value={filterReceiver} onChange={(e) => setFilterReceiver(e.target.value)}>
            <option value="all">All Receivers</option>
            {receivers.map(receiver => (
              <option key={receiver.id} value={receiver.id}>
                {receiver.name}
              </option>
            ))}
          </select>

          <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      <div className="activity-list">
        {filteredSessions.map(session => (
          <div
            key={session.id}
            className="activity-card"
            onClick={() => setSelectedSession(session)}
          >
            <div className="activity-card-header">
              <h3>{session.vendorName}</h3>
              {getStatusBadge(session.status)}
            </div>

            <div className="activity-card-details">
              <div className="detail-row">
                <span className="label">Receiver:</span>
                <span>{getReceiverName(session.receiverId)}</span>
              </div>

              <div className="detail-row">
                <span className="label">Started:</span>
                <span>{new Date(session.startTime).toLocaleString()}</span>
              </div>

              <div className="detail-row">
                <span className="label">Duration:</span>
                <span>{formatDuration(session.startTime, session.endTime)}</span>
              </div>

              <div className="detail-row">
                <span className="label">Products Scanned:</span>
                <span className="highlight">{session.productsScanned || 0}</span>
              </div>

              {session.allergenWarnings > 0 && (
                <div className="detail-row">
                  <span className="label">Allergen Warnings:</span>
                  <span className="warning">{session.allergenWarnings}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredSessions.length === 0 && (
          <div className="empty-state">
            <p>No scanning sessions found</p>
          </div>
        )}
      </div>

      {selectedSession && (
        <div className="modal-overlay" onClick={() => setSelectedSession(null)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Session Details</h3>
              <button className="modal-close" onClick={() => setSelectedSession(null)}>
                ×
              </button>
            </div>

            <div className="session-details">
              <div className="detail-section">
                <h4>Session Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Vendor:</span>
                    <span>{selectedSession.vendorName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Receiver:</span>
                    <span>{getReceiverName(selectedSession.receiverId)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    {getStatusBadge(selectedSession.status)}
                  </div>
                  <div className="detail-item">
                    <span className="label">Started:</span>
                    <span>{new Date(selectedSession.startTime).toLocaleString()}</span>
                  </div>
                  {selectedSession.endTime && (
                    <div className="detail-item">
                      <span className="label">Completed:</span>
                      <span>{new Date(selectedSession.endTime).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="label">Duration:</span>
                    <span>{formatDuration(selectedSession.startTime, selectedSession.endTime)}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Products Scanned</h4>
                <div className="products-list">
                  {selectedSession.products && selectedSession.products.length > 0 ? (
                    selectedSession.products.map((product, index) => (
                      <div key={index} className="product-item">
                        <div className="product-info">
                          <h5>{product.name}</h5>
                          <p>Quantity: {product.quantity}</p>
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
                      </div>
                    ))
                  ) : (
                    <p>No products scanned</p>
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

export default ScanningActivity;
