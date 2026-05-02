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

      console.log("[auth] register token:", token);

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
          profileImage: user.profileImage,
          phone: user.phone,
          location: user.location,
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
      const rawIdentifier = req.body.identifier || req.body.email || "";
      const identifier = String(rawIdentifier).trim();
      const password = String(req.body.password || "");

      // Validate input
      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          message: "Please provide your email/phone and password",
        });
      }

      // Find user (allow phone OR email login)
      const normalizedEmail = identifier.toLowerCase();
      let user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        user = await User.findOne({
          $or: [
            { email: normalizedEmail },
            { email: identifier },
            { phone: identifier },
          ],
        });
      }

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
      const isPasswordMatch = user.matchPassword(password);
      
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
          profileImage: user.profileImage,
          phone: user.phone,
          location: user.location,
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
   * Firebase social sign-in (Google / Facebook via Firebase Auth on the client).
   * Verifies the ID token with Google Identity Toolkit, then creates a Mongo user
   * if needed and returns the same JWT as email/password login.
   *
   * POST /auth/firebase
   * Body: { idToken: string, role?: "client" | "artist" } — role applies only when creating a new user.
   */
  async firebaseLogin(req, res) {
    try {
      const axios = require("axios");
      const bcryptjs = require("bcryptjs");
      const crypto = require("crypto");

      const { getFirebaseWebApiKey } = require("../config/firebaseWebEnv");
      const { idToken, role: requestedRole } = req.body || {};
      const apiKey = getFirebaseWebApiKey();

      if (!idToken || typeof idToken !== "string") {
        return res.status(400).json({
          success: false,
          message: "Missing sign-in token. Please try signing in again.",
        });
      }

      if (!apiKey) {
        return res.status(503).json({
          success: false,
          code: "firebase_not_configured",
          message:
            "Firebase token verification has no Web API key. Add Firebase settings to backend `.env` — see backend/.env.example — then restart the API.",
        });
      }

      let lookup;
      try {
        const { data } = await axios.post(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
          { idToken },
          { headers: { "Content-Type": "application/json" }, timeout: 15000 }
        );
        lookup = data;
      } catch (err) {
        console.error("[auth] Firebase token verify failed:", err.response?.data || err.message);
        return res.status(401).json({
          success: false,
          message: "Invalid or expired social sign-in. Please try again.",
        });
      }

      const fbUser = lookup?.users?.[0];
      if (!fbUser?.email) {
        return res.status(401).json({
          success: false,
          message: "Your social account did not share an email. Try another provider or sign up with email.",
        });
      }

      const email = String(fbUser.email).trim().toLowerCase();
      const name =
        (fbUser.displayName && String(fbUser.displayName).trim()) ||
        (email.includes("@") ? email.split("@")[0] : "User");

      const role = requestedRole === "artist" ? "artist" : "client";

      const profileImage =
        fbUser.photoUrl && String(fbUser.photoUrl).trim() ? String(fbUser.photoUrl).trim() : "";

      let user = await User.findOne({ email });

      if (!user) {
        const randomPw = crypto.randomBytes(32).toString("hex");
        const salt = bcryptjs.genSaltSync(10);
        user = new User({
          name,
          email,
          role,
          status: "active",
          profileImage: profileImage || undefined,
          password: bcryptjs.hashSync(randomPw, salt),
        });
        await user.save();
      } else {
        if (profileImage && !(user.profileImage && String(user.profileImage).trim())) {
          user.profileImage = profileImage;
          await user.save();
        }
      }

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

      if (user.status === "suspended") {
        return res.status(403).json({
          success: false,
          message: "Your account has been suspended",
        });
      }

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role, status: user.status },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        success: true,
        message: "Signed in successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          profileImage: user.profileImage,
          phone: user.phone,
          location: user.location,
        },
      });
    } catch (error) {
      console.error("Firebase login error:", error);
      return res.status(500).json({
        success: false,
        message: "Social sign-in failed",
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
      console.log("[auth] getMe token payload:", req.user);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const user = await User.findById(userId).select("-password");

      if (!user) {
        console.log("[auth] getMe user not found for id:", userId);
        return res.status(404).json({
          success: false,
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      const response = {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          profileImage: user.profileImage,
          phone: user.phone,
          location: user.location,
        },
      };

      console.log("[auth] getMe response:", response);
      res.json(response);
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
   * Update current user profile
   * PUT /users/me
   */
  async updateMe(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { name, email, phone, location, profileImage } = req.body;
      const updates = {};

      if (typeof name === "string" && name.trim()) {
        updates.name = name.trim();
      }

      if (typeof email === "string" && email.trim()) {
        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: userId },
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Email already in use",
          });
        }

        updates.email = normalizedEmail;
      }

      if (typeof phone === "string") {
        updates.phone = phone.trim();
      }

      if (typeof location === "string") {
        updates.location = location.trim();
      }

      if (typeof profileImage === "string") {
        updates.profileImage = profileImage.trim();
      }

      const user = await User.findByIdAndUpdate(userId, updates, {
        new: true,
        runValidators: true,
      }).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          profileImage: user.profileImage,
          phone: user.phone,
          location: user.location,
        },
      });
    } catch (error) {
      console.error("Update me error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update profile",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Delete current user profile
   * DELETE /users/me
   */
  async deleteMe(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "Profile deleted successfully",
      });
    } catch (error) {
      console.error("Delete me error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete profile",
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
