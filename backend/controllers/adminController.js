// controllers/adminController.js
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Media = require('../models/Media');
const cloudinary = require('../utils/cloudinary');

// Admin login controller
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ success: false, message: 'Invalid username or password' });

    const validPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!validPassword) return res.status(401).json({ success: false, message: 'Invalid username or password' });

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin upload controller (now saves file info to DB)
exports.uploadMedia = async (req, res) => {
  try {
    // Check if file is uploaded
    const uploadedFile = req.files?.media || req.files?.file;
    if (!uploadedFile) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(uploadedFile.tempFilePath, {
      resource_type: "auto", // auto-detect image/video
      folder: "gallery"
    });

    // Save to DB
    const media = new Media({
      public_id: result.public_id,
      url: result.secure_url
    });

    await media.save();

    res.json({
      success: true,
      message: 'File uploaded to Cloudinary & saved in DB',
      file: media
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
