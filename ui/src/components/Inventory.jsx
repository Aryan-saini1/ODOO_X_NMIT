import React, { useState } from 'react';

function Inventory() {
  const [productId, setProductId] = useState('');
  const [inventoryData, setInventoryData] = useState(null);

  const [reserveProductId, setReserveProductId] = useState('');
  const [reserveQty, setReserveQty] = useState('');
  const [reserveReferenceType, setReserveReferenceType] = useState('SO');
  const [reserveReferenceId, setReserveReferenceId] = useState('');
  const [reserveIdempotencyKey, setReserveIdempotencyKey] = useState('');
  const [reserveResult, setReserveResult] = useState(null);

  const [moveProductId, setMoveProductId] = useState('');
  const [moveQty, setMoveQty] = useState('');
  const [moveType, setMoveType] = useState('IN');
  const [moveReferenceType, setMoveReferenceType] = useState('PO');
  const [moveReferenceId, setMoveReferenceId] = useState('');
  const [moveIdempotencyKey, setMoveIdempotencyKey] = useState('');
  const [moveResult, setMoveResult] = useState(null);


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

  const handleReserveStock = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/inventory/stock/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: reserveProductId,
          qty: parseInt(reserveQty, 10),
          referenceType: reserveReferenceType,
          referenceId: reserveReferenceId,
          idempotencyKey: reserveIdempotencyKey || undefined,
        }),
      });
      const data = await response.json();
      setReserveResult(data);
    } catch (error) {
      console.error('Error reserving stock:', error);
      setReserveResult({ error: 'Failed to reserve stock' });
    }
  };

  const handleMoveStock = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/inventory/stock/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: moveProductId,
          qty: parseInt(moveQty, 10),
          type: moveType,
          referenceType: moveReferenceType,
          referenceId: moveReferenceId,
          idempotencyKey: moveIdempotencyKey || undefined,
        }),
      });
      const data = await response.json();
      setMoveResult(data);
    } catch (error) {
      console.error('Error moving stock:', error);
      setMoveResult({ error: 'Failed to move stock' });
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

      <div className="card">
        <h3>Reserve Stock</h3>
        <form onSubmit={handleReserveStock}>
          <input type="text" placeholder="Product ID" value={reserveProductId} onChange={(e) => setReserveProductId(e.target.value)} required />
          <input type="number" placeholder="Quantity" value={reserveQty} onChange={(e) => setReserveQty(e.target.value)} required />
          <select value={reserveReferenceType} onChange={(e) => setReserveReferenceType(e.target.value)}>
            <option value="SO">Sales Order</option>
            <option value="WO">Work Order</option>
          </select>
          <input type="text" placeholder="Reference ID" value={reserveReferenceId} onChange={(e) => setReserveReferenceId(e.target.value)} required />
          <input type="text" placeholder="Idempotency Key (Optional)" value={reserveIdempotencyKey} onChange={(e) => setReserveIdempotencyKey(e.target.value)} />
          <button type="submit">Reserve Stock</button>
        </form>
        {reserveResult && (
          <pre>{JSON.stringify(reserveResult, null, 2)}</pre>
        )}
      </div>

      <div className="card">
        <h3>Move Stock</h3>
        <form onSubmit={handleMoveStock}>
          <input type="text" placeholder="Product ID" value={moveProductId} onChange={(e) => setMoveProductId(e.target.value)} required />
          <input type="number" placeholder="Quantity" value={moveQty} onChange={(e) => setMoveQty(e.target.value)} required />
          <select value={moveType} onChange={(e) => setMoveType(e.target.value)}>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
          </select>
          <select value={moveReferenceType} onChange={(e) => setMoveReferenceType(e.target.value)}>
            <option value="PO">Purchase Order</option>
            <option value="WO">Work Order</option>
            <option value="ADJ">Adjustment</option>
          </select>
          <input type="text" placeholder="Reference ID" value={moveReferenceId} onChange={(e) => setMoveReferenceId(e.target.value)} required />
          <input type="text" placeholder="Idempotency Key (Optional)" value={moveIdempotencyKey} onChange={(e) => setMoveIdempotencyKey(e.target.value)} />
          <button type="submit">Move Stock</button>
        </form>
        {moveResult && (
          <pre>{JSON.stringify(moveResult, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}

export default Inventory;
