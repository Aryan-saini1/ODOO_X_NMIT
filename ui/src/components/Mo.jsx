import React, { useState, useEffect } from 'react';

function Mo() {
  const [mos, setMos] = useState([]);
  const [newMo, setNewMo] = useState({ productId: '', quantity: '' });
  const [outboxEvents, setOutboxEvents] = useState([]);

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

  const handleBlockMo = async (moId) => {
    const reason = prompt('Enter reason for blocking:');
    if (reason) {
      try {
        await fetch(`/api/mo/mo/${moId}/block`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        });
        fetchMos();
      } catch (error) {
        console.error('Error blocking MO:', error);
      }
    }
  };

  const handleUnblockMo = async (moId) => {
    try {
      await fetch(`/api/mo/mo/${moId}/unblock`, { method: 'PATCH' });
      fetchMos();
    } catch (error) {
      console.error('Error unblocking MO:', error);
    }
  };

  const handleRetryReservation = async (moId) => {
    try {
      const response = await fetch(`/api/mo/mo/${moId}/retry-reservation`, { method: 'POST' });
      const result = await response.json();
      alert(`Reservation Retry Result: ${result.status}`);
      fetchMos();
    } catch (error) {
      console.error('Error retrying reservation:', error);
    }
  };

  const fetchOutbox = async () => {
    try {
      const response = await fetch('/api/mo/outbox');
      if (!response.ok) {
        throw new Error(`Failed to fetch outbox: ${response.statusText}`);
      }
      const data = await response.json();
      setOutboxEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching outbox events:', error);
      setOutboxEvents([]);
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
              {mo.status !== 'BLOCKED' && (
                <button onClick={() => handleBlockMo(mo.id)}>Block</button>
              )}
              {mo.status === 'BLOCKED' && (
                <button onClick={() => handleUnblockMo(mo.id)}>Unblock</button>
              )}
              {mo.status === 'CONFIRMED' && (
                <button onClick={() => handleRetryReservation(mo.id)}>Retry Reservation</button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Outbox Events</h3>
        <button onClick={fetchOutbox}>Refresh Outbox</button>
        <ul>
          {outboxEvents.map((event) => (
            <li key={event.id}>
              <strong>{event.event_type}</strong> - {new Date(event.created_at).toLocaleString()}
              <pre>{JSON.stringify(event.payload, null, 2)}</pre>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Mo;
