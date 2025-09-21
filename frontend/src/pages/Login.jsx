import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsError(false);
    setMessage('');

    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to log in.');
      }
      
      // On successful login:
      localStorage.setItem('token', data.token);
      setMessage('Login successful! Redirecting...');
      
      // Use a short delay before navigating to the dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000); // 1-second delay
      
    } catch (error) {
      setIsError(true);
      setMessage(error.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="logo-container">
        <span className="logo-text">🛒 ORDO</span>
      </div>
      <h1 className="title">Login</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="email"
            className="input-field"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <input
            type="password"
            className="input-field"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="auth-button">Login</button>
      </form>
      {message && <p className={`message ${isError ? 'error' : 'success'}`}>{message}</p>}
      <div className="links">
        <Link to="/forgot-password">forgot password?</Link> | <Link to="/signup">sign up</Link>
      </div>
    </div>
  );
};

export default Login;