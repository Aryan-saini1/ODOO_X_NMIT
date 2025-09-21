import React, { useState } from 'react';

function Wo() {
  const [moId, setMoId] = useState('');
  const [wos, setWos] = useState([]);
  const [error, setError] = useState(null);

  const fetchWos = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch(`/api/wo/wo/mo/${moId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch WOs: ${response.statusText}`);
      }
      const data = await response.json();
      setWos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching WOs:', err);
      setError(err.message);
      setWos([]);
    }
  };

  const handleStartWo = async (woId) => {
    try {
      await fetch(`/api/wo/wo/${woId}/start`, { method: 'PATCH' });
      // Re-fetch WOs for the current MO ID to update the list
      const response = await fetch(`/api/wo/wo/mo/${moId}`);
      const data = await response.json();
      setWos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error starting WO:', err);
    }
  };

  const handleCompleteWo = async (woId) => {
    try {
      await fetch(`/api/wo/wo/${woId}/complete`, { method: 'PATCH' });
      // Re-fetch WOs for the current MO ID to update the list
      const response = await fetch(`/api/wo/wo/mo/${moId}`);
      const data = await response.json();
      setWos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error completing WO:', err);
    }
  };

  return (
    <div>
      <h2>Work Orders (WO)</h2>
      <div className="card">
        <h3>Fetch WOs by MO ID</h3>
        <form onSubmit={fetchWos}>
          <input
            type="text"
            placeholder="Enter MO ID"
            value={moId}
            onChange={(e) => setMoId(e.target.value)}
            required
          />
          <button type="submit">Get WOs</button>
        </form>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="card">
        <h3>WO List</h3>
        <ul>
          {wos.map((wo) => (
            <li key={wo.id}>
              ID: {wo.id} - Op: {wo.operation_name} - Seq: {wo.sequence} - Status: {wo.status}
              {wo.status === 'PLANNED' && (
                <button onClick={() => handleStartWo(wo.id)}>Start</button>
              )}
              {wo.status === 'IN_PROGRESS' && (
                <button onClick={() => handleCompleteWo(wo.id)}>Complete</button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Wo;
