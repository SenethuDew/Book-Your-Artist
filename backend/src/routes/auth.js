const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const authController = require("../controllers/authController");

// Register
router.post("/register", authController.register);

// Login
router.post("/login", authController.login);

// Get current user
router.get("/me", auth, authController.getMe);
router.get("/users/me", auth, authController.getMe);

// Logout (for consistency)
router.post("/logout", authController.logout);

module.exports = router;
