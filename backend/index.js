const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // 1. IMPORT CORS
const authRoutes = require('./routes/authRoutes');

dotenv.config();
const app = express();

app.use(cors()); // 2. USE CORS MIDDLEWARE
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Auth Service is running!');
});

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Auth Service listening on port ${PORT}`);
});