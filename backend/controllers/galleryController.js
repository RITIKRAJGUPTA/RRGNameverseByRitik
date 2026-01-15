const Media = require('../models/Media');

exports.getPhotos = async (req, res) => {
  try {
    const mediaList = await Media.find().sort({ uploadedAt: -1 });
    res.json({
      success: true,
      images: mediaList.map(item => item.url)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to load images' });
  }
};
