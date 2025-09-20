const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const sendEmail = require('../utils/email');

// Setup Database and Google Client
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// SIGNUP LOGIC
exports.signup = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, hashedPassword, role]
    );
    const token = jwt.sign(
      { userId: newUser.rows[0].user_id, role: newUser.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(201).json({
      status: 'success',
      message: 'User created successfully!',
      token
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// LOGIN LOGIC
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully!',
      token
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "No user with that email found." });
    }
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes
    await pool.query("UPDATE users SET otp = $1, otp_expires = $2 WHERE email = $3", [otp, otpExpires, email]);

    // --- DEBUGGING LINES ADDED HERE ---
    console.log("--- DEBUGGING EMAIL ---");
    console.log("Sending with User:", process.env.EMAIL_USER);
    console.log("Sending with Pass:", process.env.EMAIL_PASS);
    // ------------------------------------

    await sendEmail({
      email: email,
      subject: 'Your Password Reset OTP (valid for 10 min)',
      message: `Your password reset OTP is: ${otp}`,
    });
    res.status(200).json({ status: 'success', message: 'OTP sent to email!' });
  } catch (err) {
    await pool.query("UPDATE users SET otp = NULL, otp_expires = NULL WHERE email = $1", [email]);
    console.error(err);
    res.status(500).send("There was an error sending the email. Try again later.");
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND otp = $2 AND otp_expires > NOW()",
      [email, otp]
    );
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "OTP is invalid or has expired." });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await pool.query(
      "UPDATE users SET password = $1, otp = NULL, otp_expires = NULL WHERE email = $2",
      [hashedPassword, email]
    );
    res.status(200).json({ status: 'success', message: 'Password reset successful!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// GOOGLE SIGN-IN
exports.googleSignIn = async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { name, email, sub } = ticket.getPayload();
    let userResult = await pool.query("SELECT * FROM users WHERE google_id = $1", [sub]);
    let user = userResult.rows[0];
    if (!user) {
      userResult = await pool.query(
        "INSERT INTO users (name, email, google_id, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET google_id = $3 RETURNING *",
        [name, email, sub, 'Operator']
      );
      user = userResult.rows[0];
    }
    const jwtToken = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(200).json({
      status: 'success',
      message: 'Google Sign-In successful!',
      token: jwtToken,
    });
  } catch (err) {
    console.error(err.message);
    res.status(401).json({ message: "Invalid Google token" });
  }
};