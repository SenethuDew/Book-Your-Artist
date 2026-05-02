const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
  override: true,
});

const connectDB = require("./config/db");
const apiRoutes = require("./routes/api"); // Consolidated API routes
const paymentController = require("./controllers/paymentController"); // Move webhook here

const app = express();
app.use(cors());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads');
    require('fs').mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Webhook route must be before express.json()
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), (req, res) => paymentController.handleWebhook(req, res));

app.use(express.json());

// Serve static files for uploads
app.use(express.static(path.join(__dirname, '../public')));

app.get("/", (req, res) => {
  res.json({ message: "Book-Your-Artist API running" });
});

// Upload routes
const uploadController = require("./controllers/uploadController");
app.post("/api/upload", (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({
        success: false,
        message: 'Upload error: ' + err.message,
      });
    }
    uploadController.uploadImage(req, res);
  });
});

// API routes (includes auth, artists, bookings, reviews, messages, admin)
app.use("/api", apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
