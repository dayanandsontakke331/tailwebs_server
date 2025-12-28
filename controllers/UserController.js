const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.pong = async (req, res) => {
  return res.status(200).json({ message: 'pong' });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    await User.create({
      name: name,
      email: email,
      password: password,
      role: role
    });

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.log("erro", err)
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(200).json({ message: 'Invalid credentials' });
    }

    const accessToken = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '20m' });
    const refreshToken = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '40m' });

    return res.json({ success: true, message: "Login Successfully", user, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Refresh token expired' });
      }
      return res.status(401).json({ success: false, message: 'Unauthorized request' });
    }

    const user = await User.findById(payload._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const accessToken = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '20m' });
    const newRefreshToken = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '40m' });

    return res.json({ user, accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


