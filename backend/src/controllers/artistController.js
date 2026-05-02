const ArtistProfile = require("../models/ArtistProfile");
const User = require("../models/User");
const searchService = require("../services/searchService");
const { artistProfileSchema, payoutBankSchema, searchFiltersSchema } = require("../validators");

/** Remove sensitive payout fields from docs returned to clients or the public. */
function stripPayoutBank(doc) {
  if (!doc || typeof doc !== "object") return doc;
  const o = { ...doc };
  delete o.payoutBank;
  return o;
}

/** Safe summary for the logged-in artist only (no full account/routing numbers). */
function maskPayoutBank(payoutBank) {
  if (!payoutBank || typeof payoutBank !== "object") {
    return {
      accountHolderName: "",
      bankName: "",
      country: "",
      swiftBic: "",
      accountNumberMasked: "",
      routingNumberMasked: "",
      isComplete: false,
    };
  }
  const acct = String(payoutBank.accountNumber || "").replace(/\s/g, "");
  const last4 = acct.length >= 4 ? acct.slice(-4) : acct ? "****" : "";
  const rout = String(payoutBank.routingNumber || "").replace(/\s/g, "");
  const rLast4 = rout.length >= 4 ? rout.slice(-4) : "";
  return {
    accountHolderName: payoutBank.accountHolderName || "",
    bankName: payoutBank.bankName || "",
    country: payoutBank.country || "",
    swiftBic: payoutBank.swiftBic || "",
    accountNumberMasked: last4 ? `····${last4}` : "",
    routingNumberMasked: rout ? (rLast4 ? `····${rLast4}` : "On file") : "",
    isComplete: !!(
      payoutBank.accountHolderName &&
      payoutBank.bankName &&
      payoutBank.country &&
      payoutBank.accountNumber
    ),
  };
}

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

      if (req.body && typeof req.body === "object") {
        delete req.body.payoutBank;
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

      const safe = stripPayoutBank(profile.toObject ? profile.toObject() : profile);
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        profile: safe,
        artist: safe,
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

      const safe = stripPayoutBank(profile.toObject ? profile.toObject() : profile);
      return res.status(200).json({
        success: true,
        profile: safe,
        artist: safe,
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

  /**
   * Masked payout bank (artist owner only)
   */
  async getPayoutBank(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      let user;
      try {
        user = await User.findById(userId);
      } catch (e) {
        /* ignore */
      }
      if (!user || user.role !== "artist") {
        return res.status(403).json({ success: false, message: "Artist access only" });
      }
      const profile = await ArtistProfile.findOne({ userId }).lean();
      return res.status(200).json({
        success: true,
        payout: maskPayoutBank(profile?.payoutBank || null),
      });
    } catch (error) {
      console.error("Get payout bank error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to load payout details",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Save payout bank (artist owner only — not exposed via public artist APIs)
   */
  async updatePayoutBank(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      let user;
      try {
        user = await User.findById(userId);
      } catch (e) {
        /* ignore */
      }
      if (!user || user.role !== "artist") {
        return res.status(403).json({ success: false, message: "Artist access only" });
      }

      const validation = payoutBankSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid payout details",
          errors: validation.error.flatten(),
        });
      }

      const d = validation.data;
      const accountNumber = String(d.accountNumber).replace(/\s/g, "").replace(/-/g, "");

      const prev = await ArtistProfile.findOne({ userId }).lean();
      if (!prev) {
        return res.status(404).json({
          success: false,
          message: "Artist profile not found. Complete your profile setup first.",
        });
      }

      const payoutBank = {
        accountHolderName: d.accountHolderName.trim(),
        bankName: d.bankName.trim(),
        country: d.country.trim(),
        accountNumber,
      };
      if (d.routingNumber) {
        payoutBank.routingNumber = String(d.routingNumber).replace(/\s/g, "").replace(/-/g, "");
      } else if (prev.payoutBank?.routingNumber) {
        payoutBank.routingNumber = prev.payoutBank.routingNumber;
      }
      if (d.swiftBic) {
        payoutBank.swiftBic = d.swiftBic;
      } else if (prev.payoutBank?.swiftBic) {
        payoutBank.swiftBic = prev.payoutBank.swiftBic;
      }

      const updated = await ArtistProfile.findOneAndUpdate(
        { userId },
        { $set: { payoutBank } },
        { new: true }
      ).lean();

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Artist profile not found. Complete your profile setup first.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Payout bank details saved",
        payout: maskPayoutBank(updated.payoutBank),
      });
    } catch (error) {
      console.error("Update payout bank error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to save payout details",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = new ArtistController();
