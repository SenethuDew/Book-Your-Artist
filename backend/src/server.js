const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const apiRoutes = require("./routes/api"); // Consolidated API routes
const paymentController = require("./controllers/paymentController"); // Move webhook here

const app = express();
app.use(cors());

// Webhook route must be before express.json()
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), (req, res) => paymentController.handleWebhook(req, res));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Book-Your-Artist API running" });
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
