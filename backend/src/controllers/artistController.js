const ArtistProfile = require("../models/ArtistProfile");
const User = require("../models/User");
const searchService = require("../services/searchService");
const { artistProfileSchema, searchFiltersSchema } = require("../validators");
const { z } = require("zod");

class ArtistController {
  /**
   * Search artists with filters
   * GET /api/artists/search
   */
  async searchArtists(req, res) {
    try {
      const validation = searchFiltersSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid search filters",
          errors: validation.error.flatten(),
        });
      }

      const result = await searchService.searchArtists(validation.data);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Search error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to search artists",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get artist details by ID
   * GET /api/artists/:id
   */
  async getArtistDetail(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Artist ID is required",
        });
      }

      const result = await searchService.getArtistDetail(id);
      return res.status(200).json(result);
    } catch (error) {
      if (error.message === "Artist not found") {
        return res.status(404).json({
          success: false,
          message: "Artist not found",
        });
      }

      console.error("Get artist detail error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch artist details",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get genres for filter dropdowns
   * GET /api/artists/genres
   */
  async getGenres(req, res) {
    try {
      const result = await searchService.getGenres();
      return res.status(200).json(result);
    } catch (error) {
      console.error("Get genres error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch genres",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get price range stats
   * GET /api/artists/price-stats
   */
  async getPriceStats(req, res) {
    try {
      const result = await searchService.getPriceStats();
      return res.status(200).json(result);
    } catch (error) {
      console.error("Get price stats error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch price stats",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get featured artists
   * GET /api/artists/featured
   */
  async getFeaturedArtists(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 6, 50);
      const result = await searchService.getFeaturedArtists(limit);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Get featured artists error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch featured artists",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get trending artists
   * GET /api/artists/trending
   */
  async getTrendingArtists(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 6, 50);
      const result = await searchService.getTrendingArtists(limit);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Get trending artists error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch trending artists",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Update artist profile (Auth required)
   * PUT /api/artists/profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Check if user is artist
      let user;
      try {
        user = await User.findById(userId);
      } catch(e) {}
      
      if (user && user.role !== "artist") {
        return res.status(403).json({
          success: false,
          message: "Only artists can update artist profile",
        });
      }

      // Validate input
      const validation = artistProfileSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid profile data",
          errors: validation.error.flatten(),
        });
      }

      // Update or create profile
      const profile = await ArtistProfile.findOneAndUpdate(
        { userId },
        { userId, ...validation.data },
        { upsert: true, new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        profile: profile,
        artist: profile,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update profile",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get my artist profile (Auth required)
   * GET /api/artists/me
   */
  async getMyProfile(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const profile = await ArtistProfile.findOne({ userId })
        .populate("userId", "name email profileImage phone role status");

      if (!profile) {
        return res.status(200).json({
          success: true,
          profile: null,
          artist: null,
          message: "Artist profile not found",
        });
      }

      return res.status(200).json({
        success: true,
        profile: profile,
        artist: profile,
      });
    } catch (error) {
      console.error("Get my profile error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch profile",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get artist statistics (Auth required)
   * GET /api/artists/stats
   */
  async getStats(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const Booking = require("../models/Booking");
      const Review = require("../models/Review");

      // Get booking stats
      const bookings = await Booking.countDocuments({
        artistId: userId,
        status: "completed",
      });

      const totalEarnings = await Booking.aggregate([
        { $match: { artistId: userId, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$artistPrice" } } },
      ]);

      // Get review stats
      const reviews = await Review.find({ artistId: userId });
      const avgRating = reviews.length
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

      // Get upcoming bookings
      const upcomingBookings = await Booking.countDocuments({
        artistId: userId,
        status: "confirmed",
        eventDate: { $gte: new Date() },
      });

      return res.status(200).json({
        success: true,
        stats: {
          completedBookings: bookings,
          totalEarnings: totalEarnings[0]?.total || 0,
          averageRating: parseFloat(avgRating),
          totalReviews: reviews.length,
          upcomingBookings,
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
}

module.exports = new ArtistController();
