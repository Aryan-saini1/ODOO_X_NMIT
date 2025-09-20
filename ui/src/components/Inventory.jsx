import React, { useState } from 'react';

function Inventory() {
  const [productId, setProductId] = useState('');
  const [inventoryData, setInventoryData] = useState(null);

  const handleFetchInventory = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/inventory/inventory/${productId}`);
      const data = await response.json();
      setInventoryData(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventoryData({ error: 'Failed to fetch' });
    }
  };

  return (
    <div>
      <h2>Inventory Service</h2>
      <div className="card">
        <h3>Get Inventory for Product</h3>
        <form onSubmit={handleFetchInventory}>
          <input
            type="text"
            placeholder="Product ID"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          />
          <button type="submit">Get Inventory</button>
        </form>
        {inventoryData && (
          <pre>{JSON.stringify(inventoryData, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}

export default Inventory;
