const jwt = require("jsonwebtoken");
const User = require("../models/User");

class AuthController {
  /**
   * Register a new user
   * POST /auth/register
   */
  async register(req, res) {
    try {
      const { name, email, password, role } = req.body;

      // Validate input
      if (!name || !email || !password || !role) {
        return res.status(400).json({
          success: false,
          message: "Please provide all required fields",
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }

      // Create new user
      const user = new User({
        name,
        email,
        role: role || "client",
        status: "active",
      });

      // Hash password manually before saving
      const salt = require("bcryptjs").genSaltSync(10);
      user.password = require("bcryptjs").hashSync(password, salt);

      await user.save();

      // Generate token
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    } catch (error) {
      console.error("Register error - Full details:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        success: false,
        message: "Registration failed",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }

  /**
   * Login user
   * POST /auth/login
   */
  async login(req, res) {
    try {
      // Frontend might send 'email' for the identifier field
      const identifier = req.body.identifier || req.body.email;
      const { password } = req.body;

      // Validate input
      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          message: "Please provide your email/phone and password",
        });
      }

      // Find user (allow phone OR email login)
      const user = await User.findOne({
        $or: [{ email: identifier.toLowerCase() }, { phone: identifier }]
      });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check if artist is approved
      if (user.role === "artist" && user.status === "pending") {
        return res.status(403).json({
          success: false,
          message:
            "Your artist account is pending approval. Please wait for admin approval.",
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
          },
        });
      }

      // Check if user is suspended
      if (user.status === "suspended") {
        return res.status(403).json({
          success: false,
          message: "Your account has been suspended",
        });
      }

      // Check password
      const isPasswordMatch = await user.matchPassword(password);
      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Generate token
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role, status: user.status },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Login failed",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get current user
   * GET /auth/me
   */
  async getMe(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const user = await User.findById(userId).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          profileImage: user.profileImage,
          phone: user.phone,
        },
      });
    } catch (error) {
      console.error("Get me error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Logout user (client-side only, but keep for consistency)
   * POST /auth/logout
   */
  async logout(req, res) {
    try {
      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }
  }
}

module.exports = new AuthController();
