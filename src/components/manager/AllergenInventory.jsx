import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from '../../config/firebase';
import { db } from '../../config/firebase';
import { Bar } from 'react-chartjs-2';

const AllergenInventory = ({ location }) => {
  const [inventory, setInventory] = useState([]);
  const [allergenStats, setAllergenStats] = useState({});
  const [filterAllergen, setFilterAllergen] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadInventory();
  }, [location]);

  const loadInventory = async () => {
    try {
      const q = query(
        collection(db, 'inventory'),
        where('location', '==', location)
      );
      const snapshot = await getDocs(q);
      const inventoryList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setInventory(inventoryList);
      calculateAllergenStats(inventoryList);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const calculateAllergenStats = (inventoryList) => {
    const stats = {};

    inventoryList.forEach(item => {
      if (item.allergens && item.allergens.length > 0) {
        item.allergens.forEach(allergen => {
          if (!stats[allergen.name]) {
            stats[allergen.name] = {
              count: 0,
              products: [],
              totalQuantity: 0
            };
          }
          stats[allergen.name].count += 1;
          stats[allergen.name].products.push(item.productName);
          stats[allergen.name].totalQuantity += item.quantity || 0;
        });
      }
    });

    setAllergenStats(stats);
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAllergen = filterAllergen === 'all' ||
      (item.allergens && item.allergens.some(a => a.name === filterAllergen));

    return matchesSearch && matchesAllergen;
  });

  const chartData = {
    labels: Object.keys(allergenStats),
    datasets: [
      {
        label: 'Products Count',
        data: Object.values(allergenStats).map(stat => stat.count),
        backgroundColor: '#3b82f6'
      }
    ]
  };

  const getWarningLevel = (allergens) => {
    if (!allergens || allergens.length === 0) return 'none';
    if (allergens.length >= 3) return 'high';
    if (allergens.length >= 2) return 'medium';
    return 'low';
  };

  return (
    <div className="allergen-inventory">
      <div className="inventory-header">
        <h2>Allergen Inventory</h2>

        <div className="controls">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <select value={filterAllergen} onChange={(e) => setFilterAllergen(e.target.value)}>
            <option value="all">All Allergens</option>
            {Object.keys(allergenStats).sort().map(allergen => (
              <option key={allergen} value={allergen}>
                {allergen} ({allergenStats[allergen].count})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="inventory-stats">
        <div className="stat-card">
          <h3>Total Products</h3>
          <p className="stat-value">{inventory.length}</p>
        </div>

        <div className="stat-card">
          <h3>Products with Allergens</h3>
          <p className="stat-value">
            {inventory.filter(i => i.allergens && i.allergens.length > 0).length}
          </p>
        </div>

        <div className="stat-card">
          <h3>High Risk Products</h3>
          <p className="stat-value warning">
            {inventory.filter(i => i.allergens && i.allergens.length >= 3).length}
          </p>
        </div>

        <div className="stat-card">
          <h3>Unique Allergens</h3>
          <p className="stat-value">{Object.keys(allergenStats).length}</p>
        </div>
      </div>

      <div className="chart-section">
        <h3>Allergen Distribution</h3>
        <div className="chart-container-large">
          {Object.keys(allergenStats).length > 0 ? (
            <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          ) : (
            <p>No allergen data available</p>
          )}
        </div>
      </div>

      <div className="inventory-table">
        <h3>Product Details</h3>
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Brand</th>
              <th>Quantity</th>
              <th>Allergens</th>
              <th>Risk Level</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map(item => (
              <tr key={item.id}>
                <td>
                  <div className="product-name">
                    {item.productName}
                    {item.barcode && <span className="barcode">#{item.barcode}</span>}
                  </div>
                </td>
                <td>{item.brand || '-'}</td>
                <td>{item.quantity || 0}</td>
                <td>
                  <div className="allergen-tags">
                    {item.allergens && item.allergens.length > 0 ? (
                      item.allergens.map((allergen, index) => (
                        <span key={index} className="allergen-tag">
                          {allergen.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted">None</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`risk-badge risk-${getWarningLevel(item.allergens)}`}>
                    {getWarningLevel(item.allergens)}
                  </span>
                </td>
                <td>{new Date(item.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredInventory.length === 0 && (
          <div className="empty-state">
            <p>No products found</p>
          </div>
        )}
      </div>

      <div className="allergen-summary">
        <h3>Allergen Summary</h3>
        <div className="allergen-grid">
          {Object.entries(allergenStats).map(([allergen, data]) => (
            <div key={allergen} className="allergen-summary-card">
              <h4>{allergen}</h4>
              <p className="allergen-count">{data.count} products</p>
              <p className="allergen-quantity">Total quantity: {data.totalQuantity}</p>
              <details className="allergen-products">
                <summary>View products</summary>
                <ul>
                  {data.products.slice(0, 10).map((product, index) => (
                    <li key={index}>{product}</li>
                  ))}
                  {data.products.length > 10 && (
                    <li className="text-muted">...and {data.products.length - 10} more</li>
                  )}
                </ul>
              </details>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllergenInventory;
