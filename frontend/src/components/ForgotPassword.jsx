import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1 for email input, 2 for OTP/new password
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setIsError(false);
    setMessage('');

    try {
      // --- DEBUGGING LINE ADDED HERE ---
      console.log("Frontend is sending this email:", email);
      // ------------------------------------

      const response = await fetch('http://localhost:5001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send OTP.');

      setMessage('OTP sent to your email!');
      setStep(2); // Move to the next step
    } catch (error) {
      setIsError(true);
      setMessage(error.message);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setIsError(false);
    setMessage('');

    try {
      const response = await fetch('http://localhost:5001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reset password.');

      setMessage('Password has been reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
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
      <h1 className="title">forgot password</h1>

      {step === 1 ? (
        <form className="auth-form" onSubmit={handleRequestOtp}>
          <div className="input-group">
            <input
              type="email"
              className="input-field"
              placeholder="email id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-button">Send OTP</button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleResetPassword}>
          <div className="input-group">
            <input
              type="email"
              className="input-field"
              value={email}
              disabled // Email field is pre-filled and disabled
            />
          </div>
          <div className="input-group">
            <input
              type="text"
              className="input-field"
              placeholder="enter otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              className="input-field"
              placeholder="new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-button">Verify & Reset</button>
        </form>
      )}

      {message && <p className={`message ${isError ? 'error' : 'success'}`}>{message}</p>}
      <div className="links">
        <Link to="/login">Back to Login</Link>
      </div>
    </div>
  );
};

export default ForgotPassword;