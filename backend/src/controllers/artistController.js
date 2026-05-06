const ArtistProfile = require("../models/ArtistProfile");
const User = require("../models/User");
const searchService = require("../services/searchService");
const smsService = require("../services/smsService");
const emailService = require("../services/emailService");
const { artistProfileSchema, payoutBankSchema, searchFiltersSchema } = require("../validators");

/** Remove sensitive payout fields from docs returned to clients or the public. */
function stripPayoutBank(doc) {
  if (!doc || typeof doc !== "object") return doc;
  const o = { ...doc };
  delete o.payoutBank;
  return o;
}

/** Safe summary for the logged-in artist only (no full account number). */
function maskPayoutBank(payoutBank) {
  if (!payoutBank || typeof payoutBank !== "object") {
    return {
      accountHolderName: "",
      bankName: "",
      branchName: "",
      branchCode: "",
      accountType: "savings",
      nicNumber: "",
      mobileNumber: "",
      emailAddress: "",
      country: "Sri Lanka",
      swiftBic: "",
      bankAddress: "",
      accountNumberMasked: "",
      verificationStatus: "not_submitted",
      submittedAt: null,
      updatedAt: null,
      isComplete: false,
    };
  }
  const acct = String(payoutBank.accountNumber || "").replace(/\s/g, "");
  const last4 = acct.length >= 4 ? acct.slice(-4) : acct ? "****" : "";
  const maskNic = (nic) => {
    const s = String(nic || "");
    if (s.length <= 4) return s ? "****" : "";
    return `${"*".repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`;
  };
  const maskMobile = (m) => {
    const s = String(m || "");
    return s.length >= 4 ? `*****${s.slice(-4)}` : s;
  };
  return {
    accountHolderName: payoutBank.accountHolderName || "",
    bankName: payoutBank.bankName || "",
    branchName: payoutBank.branchName || "",
    branchCode: payoutBank.branchCode || "",
    accountType: payoutBank.accountType || "savings",
    nicNumber: payoutBank.nicNumber || "",
    nicNumberMasked: maskNic(payoutBank.nicNumber),
    mobileNumber: payoutBank.mobileNumber || "",
    mobileNumberMasked: maskMobile(payoutBank.mobileNumber),
    emailAddress: payoutBank.emailAddress || "",
    country: payoutBank.country || "Sri Lanka",
    swiftBic: payoutBank.swiftBic || "",
    bankAddress: payoutBank.bankAddress || "",
    accountNumberMasked: last4 ? `••••${last4}` : "",
    verificationStatus: payoutBank.verificationStatus || "not_submitted",
    submittedAt: payoutBank.submittedAt || null,
    updatedAt: payoutBank.updatedAt || null,
    isComplete: !!(
      payoutBank.accountHolderName &&
      payoutBank.bankName &&
      payoutBank.branchName &&
      payoutBank.accountNumber &&
      payoutBank.nicNumber &&
      payoutBank.mobileNumber
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
      const accountNumber = String(d.accountNumber).replace(/\s/g, "");

      const prev = await ArtistProfile.findOne({ userId }).lean();
      if (!prev) {
        return res.status(404).json({
          success: false,
          message: "Artist profile not found. Complete your profile setup first.",
        });
      }

      const now = new Date();
      const payoutBank = {
        accountHolderName: d.accountHolderName.trim(),
        bankName: d.bankName.trim(),
        branchName: d.branchName.trim(),
        branchCode: d.branchCode ? d.branchCode.trim() : (prev.payoutBank?.branchCode || ""),
        accountNumber,
        accountType: d.accountType || "savings",
        nicNumber: d.nicNumber.trim().toUpperCase(),
        mobileNumber: d.mobileNumber.trim(),
        emailAddress: d.emailAddress.trim().toLowerCase(),
        country: d.country?.trim() || "Sri Lanka",
        swiftBic: d.swiftBic || prev.payoutBank?.swiftBic || "",
        bankAddress: d.bankAddress || prev.payoutBank?.bankAddress || "",
        verificationStatus: prev.payoutBank?.verificationStatus === "verified" ? "verified" : "pending",
        submittedAt: prev.payoutBank?.submittedAt || now,
        updatedAt: now,
      };

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

  /**
   * Remove the saved payout bank (artist owner only)
   * DELETE /api/artists/me/payout-bank
   */
  async deletePayoutBank(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const user = await User.findById(userId);
      if (!user || user.role !== "artist") {
        return res.status(403).json({ success: false, message: "Artist access only" });
      }

      const updated = await ArtistProfile.findOneAndUpdate(
        { userId },
        { $unset: { payoutBank: "" } },
        { new: true },
      ).lean();

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Artist profile not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Payout bank details removed.",
        payout: maskPayoutBank(null),
      });
    } catch (error) {
      console.error("Delete payout bank error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to remove payout details",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Start payout bank verification (sends an OTP to the artist's mobile).
   * In development the OTP is also returned in the response and logged to the
   * server console — wire up SMS in production.
   * POST /api/artists/me/payout-bank/verify/start
   */
  async startPayoutVerification(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const user = await User.findById(userId);
      if (!user || user.role !== "artist") {
        return res.status(403).json({ success: false, message: "Artist access only" });
      }

      const profile = await ArtistProfile.findOne({ userId });
      if (!profile || !profile.payoutBank?.accountNumber) {
        return res.status(400).json({
          success: false,
          message: "Save your payout bank details before starting verification.",
        });
      }
      if (profile.payoutBank.verificationStatus === "verified") {
        return res.status(200).json({
          success: true,
          alreadyVerified: true,
          message: "Bank account already verified.",
        });
      }

      const otp = String(Math.floor(100000 + Math.random() * 900000));
      profile.payoutBank.verificationOtp = otp;
      profile.payoutBank.verificationOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      profile.payoutBank.verificationOtpAttempts = 0;
      profile.payoutBank.verificationStatus = "pending";
      await profile.save();

      const mobile = profile.payoutBank.mobileNumber;
      const email = profile.payoutBank.emailAddress;
      const e164 = smsService.toE164(mobile);

      const [emailResult, smsResult] = await Promise.all([
        email ? emailService.sendOtpEmail(email, otp) : Promise.resolve(null),
        mobile ? smsService.sendOtp(mobile, otp) : Promise.resolve(null),
      ]);

      const emailDelivered = !!emailResult?.delivered;
      const smsDelivered = !!smsResult?.delivered;

      console.log(
        `[Payout OTP] artist=${userId} email=${email}(${emailDelivered}) sms=${e164}(${smsDelivered})`,
      );

      const isDev = process.env.NODE_ENV !== "production";
      const realDelivery = emailDelivered || smsDelivered;

      if (!realDelivery && !isDev) {
        return res.status(502).json({
          success: false,
          message:
            "Could not send the verification code. Check email/SMS configuration or try again.",
        });
      }

      const channels = [];
      if (emailDelivered) channels.push(`email (${email})`);
      if (smsDelivered) channels.push(`SMS (${e164})`);
      const channelsLabel = channels.join(" and ") || "dev mode (console)";

      return res.status(200).json({
        success: true,
        message: realDelivery
          ? `Verification code sent via ${channelsLabel}.`
          : "Email/SMS not configured yet — using dev mode.",
        sentTo: email || e164 || mobile,
        sentToEmail: email || null,
        sentToMobile: e164 || null,
        emailDelivered,
        smsDelivered,
        delivered: realDelivery,
        expiresInSeconds: 10 * 60,
        devOtp: isDev && !realDelivery ? otp : undefined,
      });
    } catch (error) {
      console.error("Start payout verification error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to start verification",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Confirm payout bank verification with OTP.
   * POST /api/artists/me/payout-bank/verify/confirm  body: { code }
   */
  async confirmPayoutVerification(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const user = await User.findById(userId);
      if (!user || user.role !== "artist") {
        return res.status(403).json({ success: false, message: "Artist access only" });
      }

      const code = String(req.body?.code || "").trim();
      if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({
          success: false,
          message: "Enter the 6-digit verification code.",
        });
      }

      const profile = await ArtistProfile.findOne({ userId });
      const pb = profile?.payoutBank;
      if (!pb || !pb.verificationOtp) {
        return res.status(400).json({
          success: false,
          message: "Start verification first to receive a code.",
        });
      }
      if (pb.verificationOtpExpiresAt && pb.verificationOtpExpiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Verification code expired. Request a new one.",
        });
      }
      if ((pb.verificationOtpAttempts || 0) >= 5) {
        return res.status(429).json({
          success: false,
          message: "Too many failed attempts. Request a new code.",
        });
      }

      if (pb.verificationOtp !== code) {
        pb.verificationOtpAttempts = (pb.verificationOtpAttempts || 0) + 1;
        await profile.save();
        return res.status(400).json({
          success: false,
          message: "Incorrect code. Please try again.",
        });
      }

      pb.verificationStatus = "verified";
      pb.verificationMethod = "otp";
      pb.verifiedAt = new Date();
      pb.verificationOtp = undefined;
      pb.verificationOtpExpiresAt = undefined;
      pb.verificationOtpAttempts = 0;
      pb.verificationRejectionReason = undefined;
      await profile.save();

      return res.status(200).json({
        success: true,
        message: "Bank account verified successfully.",
        payout: maskPayoutBank(profile.payoutBank),
      });
    } catch (error) {
      console.error("Confirm payout verification error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to confirm verification",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Admin: manually verify or reject an artist's payout bank.
   * PUT /api/admin/artists/:artistId/payout-verification  body: { action: 'verify'|'reject', reason? }
   */
  async adminSetPayoutVerification(req, res) {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const admin = await User.findById(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ success: false, message: "Admins only" });
      }

      const { artistId } = req.params;
      const action = String(req.body?.action || "").toLowerCase();
      if (action !== "verify" && action !== "reject") {
        return res.status(400).json({
          success: false,
          message: "action must be 'verify' or 'reject'",
        });
      }

      const profile = await ArtistProfile.findOne({ userId: artistId });
      if (!profile || !profile.payoutBank?.accountNumber) {
        return res.status(404).json({
          success: false,
          message: "Artist payout details not found.",
        });
      }

      if (action === "verify") {
        profile.payoutBank.verificationStatus = "verified";
        profile.payoutBank.verificationMethod = "admin";
        profile.payoutBank.verifiedAt = new Date();
        profile.payoutBank.verificationRejectionReason = undefined;
      } else {
        profile.payoutBank.verificationStatus = "rejected";
        profile.payoutBank.verificationRejectionReason = String(req.body?.reason || "");
      }
      profile.payoutBank.verificationOtp = undefined;
      profile.payoutBank.verificationOtpExpiresAt = undefined;
      profile.payoutBank.verificationOtpAttempts = 0;
      await profile.save();

      return res.status(200).json({
        success: true,
        message: `Payout ${action === "verify" ? "verified" : "rejected"}.`,
        payout: maskPayoutBank(profile.payoutBank),
      });
    } catch (error) {
      console.error("Admin set payout verification error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update verification",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Wallet balance + recent ledger entries (artist owner only)
   * GET /api/artists/me/wallet
   */
  async getWallet(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const user = await User.findById(userId);
      if (!user || user.role !== "artist") {
        return res.status(403).json({ success: false, message: "Artist access only" });
      }
      const profile = await ArtistProfile.findOne({ userId })
        .select("wallet payoutBank")
        .lean();
      const wallet = profile?.wallet || {
        balance: 0,
        totalEarned: 0,
        totalRefunded: 0,
        currency: "USD",
        ledger: [],
      };
      const recent = (wallet.ledger || [])
        .slice(-15)
        .reverse()
        .map((l) => ({
          bookingId: l.bookingId,
          type: l.type,
          amount: l.amount,
          note: l.note,
          createdAt: l.createdAt,
        }));
      return res.status(200).json({
        success: true,
        wallet: {
          balance: wallet.balance || 0,
          totalEarned: wallet.totalEarned || 0,
          totalRefunded: wallet.totalRefunded || 0,
          currency: wallet.currency || "USD",
          recent,
        },
        payoutMethodAttached: !!profile?.payoutBank?.accountNumber,
      });
    } catch (error) {
      console.error("Get wallet error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to load wallet",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = new ArtistController();
