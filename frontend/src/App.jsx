import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- Page Imports ---
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import DashboardPage from './pages/DashboardPage.jsx'; // 1. Import Dashboard

// --- Component Imports ---
import ProtectedRoute from './components/ProtectedRoute.jsx'; // 2. Import ProtectedRoute

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* --- Public Routes --- */}
        {/* These routes are accessible to everyone. */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* --- Protected Routes --- */}
        {/* The ProtectedRoute component acts as a guard. */}
        {/* Any route nested inside it will only be accessible if the user is logged in. */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* You can add more protected pages here in the future */}
        </Route>

        {/* --- Default Redirect Logic --- */}
        {/* This handles all other paths, including the root "/" */}
        {/* It checks for a token and redirects accordingly. */}
        <Route 
          path="*" 
          element={
            localStorage.getItem('token') 
              ? <Navigate to="/dashboard" replace /> 
              : <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;

