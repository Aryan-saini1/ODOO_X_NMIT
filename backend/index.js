const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboard'); // 1. IMPORT DASHBOARD ROUTES

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Auth Service is running!');
});

// Define API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes); // 2. USE DASHBOARD ROUTES

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Auth Service listening on port ${PORT}`);
});

