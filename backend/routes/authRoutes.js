const express = require('express');
const { 
    signup, 
    login, 
    forgotPassword, 
    resetPassword, 
    googleSignIn 
} = require('../controllers/authcontroller');

const router = express.Router();

// Standard Auth
router.post('/signup', signup);
router.post('/login', login);

// Password Reset
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Google Sign-In
router.post('/google-signin', googleSignIn);

// Export the router ONCE at the end
module.exports = router;