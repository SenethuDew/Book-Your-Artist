const Review = require("../models/Review");
const Booking = require("../models/Booking");
const ArtistProfile = require("../models/ArtistProfile");
const { reviewSchema } = require("../validators");

class ReviewController {
  /**
   * Create a review
   * POST /api/reviews
   */
  async createReview(req, res) {
    try {
      const clientId = req.user?.id;
      if (!clientId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Validate input
      const validation = reviewSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid review data",
          errors: validation.error.flatten(),
        });
      }

      const { bookingId, rating, title, comment, tags } = validation.data;

      // Check booking exists and belongs to client
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      if (booking.clientId.toString() !== clientId) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to review this booking",
        });
      }

      if (booking.status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Can only review completed bookings",
        });
      }

      // Check if already reviewed
      const existingReview = await Review.findOne({ bookingId });
      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: "You have already reviewed this booking",
        });
      }

      // Create review
      const review = new Review({
        bookingId,
        artistId: booking.artistId,
        clientId,
        rating,
        title,
        comment,
        tags,
        verified: true, // Mark as verified since it's from completed booking
      });

      await review.save();

      // Update artist profile with new rating
      const allReviews = await Review.find({ artistId: booking.artistId });
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await ArtistProfile.findOneAndUpdate(
        { userId: booking.artistId },
        {
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: allReviews.length,
        }
      );

      return res.status(201).json({
        success: true,
        message: "Review created successfully",
        review,
      });
    } catch (error) {
      console.error("Create review error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create review",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get reviews for an artist
   * GET /api/reviews/artist/:artistId
   */
  async getArtistReviews(req, res) {
    try {
      const { artistId } = req.params;
      const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const reviews = await Review.find({
        artistId,
        verified: true,
      })
        .populate("clientId", "name profileImage")
        .populate("bookingId", "eventDate eventType")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Review.countDocuments({ artistId, verified: true });

      // Calculate rating breakdown
      const allReviews = await Review.find({ artistId, verified: true });
      const ratingBreakdown = {
        5: allReviews.filter((r) => r.rating === 5).length,
        4: allReviews.filter((r) => r.rating === 4).length,
        3: allReviews.filter((r) => r.rating === 3).length,
        2: allReviews.filter((r) => r.rating === 2).length,
        1: allReviews.filter((r) => r.rating === 1).length,
      };

      return res.status(200).json({
        success: true,
        reviews: reviews.map((review) => ({
          ...review.toObject(),
          client: review.clientId,
          clientId: undefined,
        })),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
        ratingBreakdown,
        averageRating: allReviews.length
          ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
          : 0,
      });
    } catch (error) {
      console.error("Get artist reviews error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch reviews",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get review details
   * GET /api/reviews/:id
   */
  async getReview(req, res) {
    try {
      const { id } = req.params;

      const review = await Review.findById(id)
        .populate("clientId", "name email profileImage")
        .populate("artistId", "name email profileImage")
        .populate("bookingId", "eventDate eventType eventLocation");

      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      return res.status(200).json({
        success: true,
        review,
      });
    } catch (error) {
      console.error("Get review error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch review",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Add artist response to review
   * PATCH /api/reviews/:id/response
   */
  async addResponse(req, res) {
    try {
      const { id } = req.params;
      const artistId = req.user?.id;
      const { response } = req.body;

      if (!artistId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!response || response.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Response cannot be empty",
        });
      }

      const review = await Review.findById(id);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      if (review.artistId.toString() !== artistId) {
        return res.status(403).json({
          success: false,
          message: "You can only respond to your own reviews",
        });
      }

      review.response = response;
      await review.save();

      return res.status(200).json({
        success: true,
        message: "Response added successfully",
        review,
      });
    } catch (error) {
      console.error("Add response error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to add response",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get client's reviews
   * GET /api/reviews/my
   */
  async getMyReviews(req, res) {
    try {
      const clientId = req.user?.id;
      if (!clientId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { page = 1, limit = 10, sort = "-createdAt" } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const reviews = await Review.find({ clientId })
        .populate("artistId", "name profileImage")
        .populate("bookingId", "eventDate eventType")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Review.countDocuments({ clientId });

      return res.status(200).json({
        success: true,
        reviews: reviews.map((review) => ({
          ...review.toObject(),
          artist: review.artistId,
          artistId: undefined,
        })),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Get my reviews error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch your reviews",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Delete review (client only)
   * DELETE /api/reviews/:id
   */
  async deleteReview(req, res) {
    try {
      const { id } = req.params;
      const clientId = req.user?.id;

      if (!clientId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const review = await Review.findById(id);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      if (review.clientId.toString() !== clientId) {
        return res.status(403).json({
          success: false,
          message: "You can only delete your own reviews",
        });
      }

      await Review.findByIdAndDelete(id);

      // Recalculate artist rating
      const allReviews = await Review.find({ artistId: review.artistId });
      const avgRating = allReviews.length
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

      await ArtistProfile.findOneAndUpdate(
        { userId: review.artistId },
        {
          rating: allReviews.length ? Math.round(avgRating * 10) / 10 : 0,
          reviewCount: allReviews.length,
        }
      );

      return res.status(200).json({
        success: true,
        message: "Review deleted successfully",
      });
    } catch (error) {
      console.error("Delete review error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete review",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = new ReviewController();
