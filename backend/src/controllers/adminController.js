const User = require("../models/User");
const ArtistProfile = require("../models/ArtistProfile");
const Booking = require("../models/Booking");
const Review = require("../models/Review");

class AdminController {
  /**
   * Get all users (admin only)
   * GET /api/admin/users
   */
  async getAllUsers(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Check if user is admin
      const user = await User.findById(userId);
      if (user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can access this endpoint",
        });
      }

      const { role, status, page = 1, limit = 10, search } = req.query;

      let query = {};
      if (role) query.role = role;
      if (status) query.status = status;

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const users = await User.find(query)
        .select("-password")
        .sort("-createdAt")
        .skip(skip)
        .limit(parseInt(limit));

      const total = await User.countDocuments(query);

      return res.status(200).json({
        success: true,
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Get all users error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch users",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get pending artist approvals
   * GET /api/admin/pending-artists
   */
  async getPendingArtists(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const user = await User.findById(userId);
      if (user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can access this endpoint",
        });
      }

      const { page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const artists = await User.find({
        role: "artist",
        status: "pending",
      })
        .select("-password")
        .populate("_id", "name email profileImage")
        .sort("-createdAt")
        .skip(skip)
        .limit(parseInt(limit));

      const total = await User.countDocuments({
        role: "artist",
        status: "pending",
      });

      // Get artist profiles
      const artistIds = artists.map((a) => a._id);
      const profiles = await ArtistProfile.find({ userId: { $in: artistIds } });

      const artistsWithProfiles = artists.map((artist) => ({
        ...artist.toObject(),
        profile: profiles.find((p) => p.userId.toString() === artist._id.toString()),
      }));

      return res.status(200).json({
        success: true,
        artists: artistsWithProfiles,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Get pending artists error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch pending artists",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Approve artist
   * PUT /api/admin/artists/:artistId/approve
   */
  async approveArtist(req, res) {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const admin = await User.findById(adminId);
      if (admin.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can approve artists",
        });
      }

      const { artistId } = req.params;
      const { feedback } = req.body;

      const artist = await User.findById(artistId);
      if (!artist || artist.role !== "artist") {
        return res.status(404).json({
          success: false,
          message: "Artist not found",
        });
      }

      artist.status = "active";
      await artist.save();

      // Mark artist profile as verified
      await ArtistProfile.findOneAndUpdate(
        { userId: artistId },
        { verified: true }
      );

      return res.status(200).json({
        success: true,
        message: "Artist approved successfully",
        user: artist,
      });
    } catch (error) {
      console.error("Approve artist error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to approve artist",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Reject artist
   * PUT /api/admin/artists/:artistId/reject
   */
  async rejectArtist(req, res) {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const admin = await User.findById(adminId);
      if (admin.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can reject artists",
        });
      }

      const { artistId } = req.params;
      const { reason } = req.body;

      const artist = await User.findById(artistId);
      if (!artist || artist.role !== "artist") {
        return res.status(404).json({
          success: false,
          message: "Artist not found",
        });
      }

      artist.status = "suspended";
      await artist.save();

      // Remove artist profile
      await ArtistProfile.deleteOne({ userId: artistId });

      return res.status(200).json({
        success: true,
        message: "Artist rejected successfully",
        user: artist,
      });
    } catch (error) {
      console.error("Reject artist error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to reject artist",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get platform statistics
   * GET /api/admin/stats
   */
  async getStats(req, res) {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const admin = await User.findById(adminId);
      if (admin.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can access this endpoint",
        });
      }

      // User counts
      const totalUsers = await User.countDocuments();
      const clientCount = await User.countDocuments({ role: "client" });
      const artistCount = await User.countDocuments({ role: "artist" });
      const pendingArtists = await User.countDocuments({ role: "artist", status: "pending" });

      // Booking stats
      const totalBookings = await Booking.countDocuments();
      const completedBookings = await Booking.countDocuments({ status: "completed" });
      const pendingBookings = await Booking.countDocuments({ status: "pending" });

      // Revenue
      const revenue = await Booking.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$platformFee" } } },
      ]);

      // Artist earnings
      const artistEarnings = await Booking.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$artistPrice" } } },
      ]);

      // Review stats
      const averageRating = await Review.aggregate([
        { $group: { _id: null, avg: { $avg: "$rating" } } },
      ]);

      // This month stats
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);

      const thisMonthBookings = await Booking.countDocuments({
        createdAt: { $gte: thisMonthStart },
        status: "completed",
      });

      const thisMonthRevenue = await Booking.aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: thisMonthStart },
          },
        },
        { $group: { _id: null, total: { $sum: "$platformFee" } } },
      ]);

      return res.status(200).json({
        success: true,
        stats: {
          users: {
            total: totalUsers,
            clients: clientCount,
            artists: artistCount,
            pendingArtists,
          },
          bookings: {
            total: totalBookings,
            completed: completedBookings,
            pending: pendingBookings,
          },
          revenue: {
            platformTotal: revenue[0]?.total || 0,
            artistTotal: artistEarnings[0]?.total || 0,
            thisMonth: thisMonthRevenue[0]?.total || 0,
          },
          reviews: {
            averageRating: averageRating[0]?.avg.toFixed(1) || 0,
            totalReviews: await Review.countDocuments(),
          },
          thisMonth: {
            bookings: thisMonthBookings,
          },
        },
      });
    } catch (error) {
      console.error("Get stats error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch stats",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Suspend user
   * PUT /api/admin/users/:userId/suspend
   */
  async suspendUser(req, res) {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const admin = await User.findById(adminId);
      if (admin.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can suspend users",
        });
      }

      const { userId } = req.params;

      if (userId === adminId) {
        return res.status(400).json({
          success: false,
          message: "You cannot suspend yourself",
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { status: "suspended" },
        { new: true }
      ).select("-password");

      return res.status(200).json({
        success: true,
        message: "User suspended successfully",
        user,
      });
    } catch (error) {
      console.error("Suspend user error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to suspend user",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Unsuspend user
   * PUT /api/admin/users/:userId/unsuspend
   */
  async unsuspendUser(req, res) {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const admin = await User.findById(adminId);
      if (admin.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can unsuspend users",
        });
      }

      const { userId } = req.params;

      const user = await User.findByIdAndUpdate(
        userId,
        { status: "active" },
        { new: true }
      ).select("-password");

      return res.status(200).json({
        success: true,
        message: "User unsuspended successfully",
        user,
      });
    } catch (error) {
      console.error("Unsuspend user error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to unsuspend user",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = new AdminController();
