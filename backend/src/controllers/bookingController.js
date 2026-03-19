const Booking = require("../models/Booking");
const ArtistProfile = require("../models/ArtistProfile");
const User = require("../models/User");
const { bookingSchema } = require("../validators");

class BookingController {
  /**
   * Create a new booking
   * POST /api/bookings
   */
  async createBooking(req, res) {
    try {
      const clientId = req.user?.id;
      if (!clientId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Validate input
      const validation = bookingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking data",
          errors: validation.error.flatten(),
        });
      }

      const { artistId, eventDate, startTime, endTime, eventType, eventLocation, eventDetails } =
        validation.data;

      // Check artist exists
      const artist = await ArtistProfile.findOne({ userId: artistId });
      if (!artist) {
        return res.status(404).json({
          success: false,
          message: "Artist not found",
        });
      }

      // Calculate duration and price
      const start = new Date(`2000-01-01 ${startTime}`);
      const end = new Date(`2000-01-01 ${endTime}`);
      const durationHours = (end - start) / (1000 * 60 * 60);

      if (durationHours <= 0) {
        return res.status(400).json({
          success: false,
          message: "End time must be after start time",
        });
      }

      const totalPrice = Math.round(durationHours * artist.hourlyRate * 100) / 100;
      const artistPrice = Math.round(totalPrice * 0.85 * 100) / 100; // 85% to artist
      const platformFee = Math.round(totalPrice * 0.15 * 100) / 100; // 15% platform fee

      // Create booking
      const booking = new Booking({
        clientId,
        artistId,
        eventDate: new Date(eventDate),
        startTime,
        endTime,
        durationHours,
        totalPrice,
        artistPrice,
        platformFee,
        eventType,
        eventLocation,
        eventDetails,
        status: "pending",
        paymentStatus: "pending",
      });

      await booking.save();

      return res.status(201).json({
        success: true,
        message: "Booking created successfully",
        booking,
      });
    } catch (error) {
      console.error("Create booking error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create booking",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get booking details
   * GET /api/bookings/:id
   */
  async getBooking(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const booking = await Booking.findById(id)
        .populate("clientId", "name email profileImage")
        .populate("artistId", "-password")
        .populate({
          path: "artistId",
          model: "User",
          select: "name email profileImage",
        });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      // Check authorization
      if (booking.clientId._id.toString() !== userId && booking.artistId._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this booking",
        });
      }

      return res.status(200).json({
        success: true,
        booking,
      });
    } catch (error) {
      console.error("Get booking error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch booking",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get my bookings (client or artist)
   * GET /api/bookings/my
   */
  async getMyBookings(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const user = await User.findById(userId);
      const { status, sort = "-eventDate", page = 1, limit = 10 } = req.query;

      let query = {};

      if (user.role === "client") {
        query.clientId = userId;
      } else if (user.role === "artist") {
        query.artistId = userId;
      } else {
        return res.status(403).json({
          success: false,
          message: "Invalid user role",
        });
      }

      if (status) {
        query.status = status;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const bookings = await Booking.find(query)
        .populate("clientId", "name email profileImage")
        .populate("artistId", "name email profileImage")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Booking.countDocuments(query);

      return res.status(200).json({
        success: true,
        bookings,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Get my bookings error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch bookings",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Update booking status (confirm, cancel, etc.)
   * PATCH /api/bookings/:id/status
   */
  async updateBookingStatus(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { status } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const validStatuses = ["pending", "confirmed", "completed", "cancelled", "disputed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      const booking = await Booking.findById(id);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      // Only artist can confirm, only client/artist can cancel before event
      if (status === "confirmed" && booking.artistId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Only artist can confirm booking",
        });
      }

      if (status === "cancelled" && booking.clientId.toString() !== userId && booking.artistId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to cancel this booking",
        });
      }

      booking.status = status;
      await booking.save();

      return res.status(200).json({
        success: true,
        message: `Booking ${status} successfully`,
        booking,
      });
    } catch (error) {
      console.error("Update booking status error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update booking",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get booking statistics
   * GET /api/bookings/stats
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

      const user = await User.findById(userId);
      const role = user.role;

      let query = {};
      if (role === "client") {
        query.clientId = userId;
      } else if (role === "artist") {
        query.artistId = userId;
      }

      const [pending, confirmed, completed, cancelled] = await Promise.all([
        Booking.countDocuments({ ...query, status: "pending" }),
        Booking.countDocuments({ ...query, status: "confirmed" }),
        Booking.countDocuments({ ...query, status: "completed" }),
        Booking.countDocuments({ ...query, status: "cancelled" }),
      ]);

      const totalRevenue = await Booking.aggregate([
        { $match: { [role === "client" ? "clientId" : "artistId"]: userId, status: "completed" } },
        { $group: { _id: null, total: { $sum: role === "client" ? "$totalPrice" : "$artistPrice" } } },
      ]);

      return res.status(200).json({
        success: true,
        stats: {
          pending,
          confirmed,
          completed,
          cancelled,
          totalRevenue: totalRevenue[0]?.total || 0,
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

module.exports = new BookingController();
