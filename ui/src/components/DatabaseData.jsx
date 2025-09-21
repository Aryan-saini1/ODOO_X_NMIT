import React, { useState, useEffect } from 'react';

const DatabaseData = ({ token }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("No token provided.");
        return;
      }
      try {
        const response = await fetch('/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            query: `
              query GetProducts {
                products {
                  id
                  name
                  sku
                }
              }
            `
          })
        });

        const result = await response.json();
        if (result.errors) {
          setError(result.errors[0].message);
        } else {
          setData(result.data);
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
  }, [token]);

  return (
    <div className="data-container">
      <h2>Database Data</h2>
      {error && <p className="error">Error: {error}</p>}
      {data ? (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default DatabaseData;
