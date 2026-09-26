const express = require('express');
const router = express.Router();
const { upload, getFileUrl } = require('../utils/upload');

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file && !req.body.image) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }
    const url = req.file ? await getFileUrl(req.file) : req.body.image;
    return res.status(200).json({
      success: true,
      url,
      imageUrl: url,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
