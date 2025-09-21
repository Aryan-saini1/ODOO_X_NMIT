const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getDashboardStats, getManufacturingOrders } = require('../controllers/dashboardController');

// Apply the authentication middleware to all routes in this file.
// This ensures that a user must be logged in to access any of these endpoints.
router.use(authMiddleware);

// @route    GET api/dashboard/stats
// @desc     Get statistics for the dashboard cards
// @access   Private
router.get('/stats', getDashboardStats);

// @route    GET api/dashboard/orders
// @desc     Get a list of manufacturing orders based on filters
// @access   Private
router.get('/orders', getManufacturingOrders);

module.exports = router;
