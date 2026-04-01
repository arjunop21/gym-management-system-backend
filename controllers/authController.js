import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Auth admin & get token
// @route   POST /api/login
// @access  Public
export const authAdmin = async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });

  if (admin && (await admin.matchPassword(password))) {
    res.json({
      _id: admin._id,
      email: admin.email,
      token: generateToken(admin._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// @desc    Register a new admin
// @route   POST /api/admin/register
// @access  Public (should be restricted in real world)
export const registerAdmin = async (req, res) => {
  const { email, password } = req.body;

  const adminExists = await Admin.findOne({ email });
  if (adminExists) {
    return res.status(400).json({ message: 'Admin already exists' });
  }

  const admin = await Admin.create({ email, password });

  if (admin) {
    res.status(201).json({
      _id: admin._id,
      email: admin.email,
      token: generateToken(admin._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid admin data' });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const admin = await Admin.findOne({ email });

  if (!admin) {
    return res.status(404).json({ message: 'There is no user with that email' });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash it and set to resetPasswordToken field
  admin.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Set expire (30 mins)
  admin.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

  await admin.save();

  // For this assignment, we will simply return the token in the response or console log it 
  // since "use email service" is marked OPTIONAL.
  console.log(`Password reset token for ${email}: ${resetToken}`);

  res.status(200).json({ 
    message: 'Reset token generated (check server console)',
    resetToken // sending to frontend for simplicity, otherwise would be emailed
  });
};

export const resetPassword = async (req, res) => {
  // Get hashed token
  const resetPasswordToken = crypto.createHash('sha256').update(req.body.token).digest('hex');

  const admin = await Admin.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!admin) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  // Set new password
  admin.password = req.body.password;
  admin.resetPasswordToken = undefined;
  admin.resetPasswordExpire = undefined;

  await admin.save();

  res.status(200).json({ message: 'Password reset successful. Please login with new password.' });
};
