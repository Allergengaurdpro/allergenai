import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from '../../config/firebase';
import { db } from '../../config/firebase';

const VendorManagement = ({ location }) => {
  const [vendors, setVendors] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    assignedReceivers: [],
    location: location,
    active: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVendors();
    loadReceivers();
  }, [location]);

  const loadVendors = async () => {
    try {
      const q = query(
        collection(db, 'vendors'),
        where('location', '==', location)
      );
      const snapshot = await getDocs(q);
      const vendorList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVendors(vendorList);
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const loadReceivers = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('location', '==', location),
        where('role', '==', 'receiver'),
        where('active', '==', true)
      );
      const snapshot = await getDocs(q);
      const receiverList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReceivers(receiverList);
    } catch (error) {
      console.error('Error loading receivers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingVendor) {
        const vendorRef = doc(db, 'vendors', editingVendor.id);
        await updateDoc(vendorRef, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'vendors'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }

      setShowModal(false);
      setEditingVendor(null);
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        assignedReceivers: [],
        location: location,
        active: true
      });
      loadVendors();
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert('Failed to save vendor');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData(vendor);
    setShowModal(true);
  };

  const handleDelete = async (vendorId) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;

    try {
      await deleteDoc(doc(db, 'vendors', vendorId));
      loadVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      alert('Failed to delete vendor');
    }
  };

  const handleReceiverToggle = (receiverId) => {
    const currentReceivers = formData.assignedReceivers || [];
    if (currentReceivers.includes(receiverId)) {
      setFormData({
        ...formData,
        assignedReceivers: currentReceivers.filter(id => id !== receiverId)
      });
    } else {
      setFormData({
        ...formData,
        assignedReceivers: [...currentReceivers, receiverId]
      });
    }
  };

  const getReceiverNames = (receiverIds) => {
    if (!receiverIds || receiverIds.length === 0) return 'None assigned';
    return receiverIds
      .map(id => receivers.find(r => r.id === id)?.name || 'Unknown')
      .join(', ');
  };

  return (
    <div className="vendor-management">
      <div className="management-header">
        <h2>Vendor Management</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          Add New Vendor
        </button>
      </div>

      <div className="vendors-grid">
        {vendors.map(vendor => (
          <div key={vendor.id} className="vendor-card">
            <div className="vendor-header">
              <h3>{vendor.name}</h3>
              <span className={`status-badge ${vendor.active ? 'active' : 'inactive'}`}>
                {vendor.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="vendor-details">
              <p><strong>Contact:</strong> {vendor.contactPerson}</p>
              <p><strong>Email:</strong> {vendor.email}</p>
              <p><strong>Phone:</strong> {vendor.phone}</p>
              <p><strong>Address:</strong> {vendor.address}</p>
              <p><strong>Assigned Receivers:</strong></p>
              <p className="assigned-receivers">{getReceiverNames(vendor.assignedReceivers)}</p>
            </div>

            <div className="vendor-actions">
              <button className="btn-edit" onClick={() => handleEdit(vendor)}>
                Edit
              </button>
              <button className="btn-delete" onClick={() => handleDelete(vendor.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowModal(false);
                  setEditingVendor(null);
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Vendor Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label>Assign Receivers</label>
                <div className="checkbox-group">
                  {receivers.map(receiver => (
                    <label key={receiver.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={(formData.assignedReceivers || []).includes(receiver.id)}
                        onChange={() => handleReceiverToggle(receiver.id)}
                      />
                      {receiver.name} ({receiver.email})
                    </label>
                  ))}
                  {receivers.length === 0 && (
                    <p className="text-muted">No receivers available</p>
                  )}
                </div>
              </div>

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  Active
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingVendor(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;
