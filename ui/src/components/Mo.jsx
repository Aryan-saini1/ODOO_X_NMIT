import React, { useState, useEffect } from 'react';

function Mo() {
  const [mos, setMos] = useState([]);
  const [newMo, setNewMo] = useState({ productId: '', quantity: '' });

  useEffect(() => {
    fetchMos();
  }, []);

  const fetchMos = async () => {
    try {
      const response = await fetch('/api/mo/mo');
      if (!response.ok) {
        throw new Error(`Failed to fetch MOs: ${response.statusText}`);
      }
      const data = await response.json();
      setMos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching MOs:', error);
      setMos([]); // Ensure mos is always an array
    }
  };

  const handleCreateMo = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/mo/mo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMo,
          quantity: parseInt(newMo.quantity, 10),
        }),
      });
      fetchMos();
      setNewMo({ productId: '', quantity: '' });
    } catch (error) {
      console.error('Error creating MO:', error);
    }
  };

  const handleConfirmMo = async (moId) => {
    try {
      await fetch(`/api/mo/mo/${moId}/confirm`, { method: 'PATCH' });
      fetchMos();
    } catch (error) {
      console.error('Error confirming MO:', error);
    }
  };

  return (
    <div>
      <h2>Manufacturing Orders (MO)</h2>
      <div className="card">
        <h3>Create MO</h3>
        <form onSubmit={handleCreateMo}>
          <input
            type="text"
            placeholder="Product ID"
            value={newMo.productId}
            onChange={(e) => setNewMo({ ...newMo, productId: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Quantity"
            value={newMo.quantity}
            onChange={(e) => setNewMo({ ...newMo, quantity: e.target.value })}
            required
          />
          <button type="submit">Create MO</button>
        </form>
      </div>

      <div className="card">
        <h3>MO List</h3>
        <button onClick={fetchMos}>Refresh MOs</button>
        <ul>
          {mos.map((mo) => (
            <li key={mo.id}>
              ID: {mo.id} - Product: {mo.product_id} - Qty: {mo.quantity} - Status: {mo.status}
              {mo.status === 'PLANNED' && (
                <button onClick={() => handleConfirmMo(mo.id)}>Confirm</button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Mo;
