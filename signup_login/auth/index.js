const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
dotenv.config();
const app = express();
app.use(express.json());
app.get('/', (req, res) => {
    res.send('Auth Service is running!');
});
app.use('/api/auth', authRoutes);
const PORT = process.env.PORT || 5001; 
app.listen(PORT, () => {
    console.log(`Auth Service listening on port ${PORT}`);
});