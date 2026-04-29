const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../public/uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

exports.uploadImage = async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('File:', req.file);
    console.log('Upload dir:', uploadDir);
    console.log('Upload dir exists:', fs.existsSync(uploadDir));

    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    console.log('File saved successfully:', req.file.filename);
    console.log('File path:', req.file.path);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: err.message,
    });
  }
};
