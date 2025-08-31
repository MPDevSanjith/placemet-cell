const multer = require('multer');
const path = require('path');

// Memory storage for Google Drive upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Invalid file type. Only PDF allowed.'));
};

const uploadResume = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
}).single('resume');

module.exports = { uploadResume };
