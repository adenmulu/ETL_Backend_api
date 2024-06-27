// routes/user.routes.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/user.model');
const logger = require("../controllers/logger");

const router = express.Router();

// User registration
router.post('/register', asyncHandler(async (req, res) => {
  const { username, password, role } = req.body;
  const existingUser = await User.query().findOne({ username });

  if (existingUser) {
    return res.status(400).json({ message: "Username already exists" });
  }

  const user = await User.query().insert({
    username,
    password,
    role
  });

  res.json({ message: 'User created', user });
}));

// User login
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const user = await User.query().findOne({ username });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.json({ message: "Login successful", token, role: user.role }); // Include role in the response
}));


// Password reset
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { username, newPassword } = req.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await User.query().patch({ password: hashedPassword }).where('username', username);

  res.json({ message: "Password reset successful" });
}));

module.exports = router;
