const ArtistProfile = require("../models/ArtistProfile");
const User = require("../models/User");
const Review = require("../models/Review");

class SearchService {
  /**
   * Search artists with filters
   * @param {Object} filters - { genres, minPrice, maxPrice, minRating, page, limit, sort }
   * @returns {Object} { artists, total, page, pages }
   */
  async searchArtists(filters = {}) {
    try {
      const {
        genres,
        minPrice,
        maxPrice,
        minRating = 0,
        page = 1,
        limit = 10,
        sort = "-rating",
      } = filters;

      // Build query
      const query = { verified: true }; // Only show verified artists

      if (genres && genres.length > 0) {
        query.genres = { $in: genres };
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        query.hourlyRate = {};
        if (minPrice !== undefined) query.hourlyRate.$gte = minPrice;
        if (maxPrice !== undefined) query.hourlyRate.$lte = maxPrice;
      }

      if (minRating > 0) {
        query.rating = { $gte: minRating };
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const artists = await ArtistProfile.find(query)
        .populate("userId", "name email profileImage phone")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      // Get total count
      const total = await ArtistProfile.countDocuments(query);
      const pages = Math.ceil(total / limit);

      return {
        success: true,
        artists: artists.map((artist) => ({
          ...artist,
          user: artist.userId,
          userId: undefined, // Avoid duplication
        })),
        pagination: { total, page, limit, pages },
      };
    } catch (error) {
      throw new Error(`Search error: ${error.message}`);
    }
  }

  /**
   * Get artist detail with reviews
   * @param {string} artistId - Artist user ID
   * @returns {Object} Artist profile with reviews
   */
  async getArtistDetail(artistId) {
    try {
      const artist = await ArtistProfile.findOne({ userId: artistId })
        .populate("userId", "name email profileImage phone createdAt")
        .lean();

      if (!artist) {
        throw new Error("Artist not found");
      }

      // Get reviews
      const reviews = await Review.find({ artistId })
        .populate("clientId", "name profileImage")
        .sort("-createdAt")
        .limit(10)
        .lean();

      // Calculate review stats
      const allReviews = await Review.find({ artistId }).lean();
      const avgRating = allReviews.length
        ? (
            allReviews.reduce((sum, r) => sum + r.rating, 0) /
            allReviews.length
          ).toFixed(1)
        : 0;

      return {
        success: true,
        artist: {
          ...artist,
          user: artist.userId,
          userId: undefined,
          reviewStats: {
            averageRating: avgRating,
            totalReviews: allReviews.length,
            verified: artist.verified,
          },
        },
        reviews: reviews.map((review) => ({
          ...review,
          client: review.clientId,
          clientId: undefined,
        })),
      };
    } catch (error) {
      throw new Error(`Get artist detail error: ${error.message}`);
    }
  }

  /**
   * Get genres list (for filter options)
   * @returns {Array} List of all genres
   */
  async getGenres() {
    try {
      const genres = await ArtistProfile.distinct("genres");
      return {
        success: true,
        genres: genres.sort(),
      };
    } catch (error) {
      throw new Error(`Get genres error: ${error.message}`);
    }
  }

  /**
   * Get price range stats
   * @returns {Object} { min, max, avg }
   */
  async getPriceStats() {
    try {
      const stats = await ArtistProfile.aggregate([
        { $match: { verified: true } },
        {
          $group: {
            _id: null,
            minPrice: { $min: "$hourlyRate" },
            maxPrice: { $max: "$hourlyRate" },
            avgPrice: { $avg: "$hourlyRate" },
          },
        },
      ]);

      const data = stats[0] || {
        minPrice: 0,
        maxPrice: 0,
        avgPrice: 0,
      };

      return {
        success: true,
        priceStats: {
          min: Math.floor(data.minPrice),
          max: Math.ceil(data.maxPrice),
          average: Math.ceil(data.avgPrice),
        },
      };
    } catch (error) {
      throw new Error(`Get price stats error: ${error.message}`);
    }
  }

  /**
   * Get featured artists (top rated)
   * @param {number} limit - Number of artists to return
   * @returns {Array} Featured artists
   */
  async getFeaturedArtists(limit = 6) {
    try {
      const artists = await ArtistProfile.find({ verified: true })
        .populate("userId", "name email profileImage phone")
        .sort("-createdAt")
        .limit(limit)
        .lean();

      return {
        success: true,
        artists: artists.map((artist) => ({
          ...artist,
          user: artist.userId,
          userId: undefined,
        })),
      };
    } catch (error) {
      throw new Error(`Get featured artists error: ${error.message}`);
    }
  }

  /**
   * Get trending artists (most booked recently)
   * @param {number} limit - Number of artists to return
   * @returns {Array} Trending artists
   */
  async getTrendingArtists(limit = 6) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const Booking = require("../models/Booking");
      const trendingArtists = await Booking.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: "$artistId", bookingCount: { $sum: 1 } } },
        { $sort: { bookingCount: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: "artistprofiles",
            localField: "_id",
            foreignField: "userId",
            as: "artistInfo",
          },
        },
      ]);

      return {
        success: true,
        artists: trendingArtists.map((item) => {
          const artist = item.artistInfo[0];
          return {
            ...artist,
            recentBookings: item.bookingCount,
          };
        }),
      };
    } catch (error) {
      throw new Error(`Get trending artists error: ${error.message}`);
    }
  }
}

module.exports = new SearchService();
