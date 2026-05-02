const Booking = require("../models/Booking");
const ArtistProfile = require("../models/ArtistProfile");
const Availability = require("../models/Availability");
const User = require("../models/User");
const { bookingSchema } = require("../validators");
const { isSingleGigPerDayCategory } = require("../utils/artistCalendarMode");

const toObjectIdString = (value) => {
  if (!value) return "";
  if (value._id) return value._id.toString();
  return value.toString();
};

const enrichBookingsWithProfiles = async (bookings) => {
  const plainBookings = bookings.map((booking) =>
    typeof booking.toObject === "function" ? booking.toObject() : booking
  );

  const artistIds = [
    ...new Set(
      plainBookings
        .map((booking) => toObjectIdString(booking.artistId))
        .filter(Boolean)
    ),
  ];

  if (!artistIds.length) {
    return plainBookings;
  }

  const artistProfiles = await ArtistProfile.find({ userId: { $in: artistIds } })
    .select(
      "userId name bio category artistType location genres hourlyRate experience profileImage coverImage rating reviewCount verified"
    )
    .lean();

  const profileByUserId = artistProfiles.reduce((acc, profile) => {
    acc[profile.userId.toString()] = profile;
    return acc;
  }, {});

  return plainBookings.map((booking) => {
    const artistUserId = toObjectIdString(booking.artistId);
    const profile = profileByUserId[artistUserId] || {};
    const artistUser =
      booking.artistId && typeof booking.artistId === "object" ? booking.artistId : {};

    return {
      ...booking,
      artistId: {
        ...artistUser,
        _id: artistUser._id || artistUserId,
        name: profile.name || artistUser.name,
        email: artistUser.email,
        phone: artistUser.phone,
        profileImage: profile.profileImage || artistUser.profileImage,
        profileId: profile._id,
        bio: profile.bio,
        category: profile.category,
        artistType: profile.artistType,
        location: profile.location,
        genres: profile.genres || [],
        hourlyRate: profile.hourlyRate,
        experience: profile.experience,
        coverImage: profile.coverImage,
        rating: profile.rating,
        reviewCount: profile.reviewCount,
        verified: profile.verified,
      },
    };
  });
};

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
      const paymentIntentId = req.body.paymentIntentId;

      // Check artist exists
      const artist = await ArtistProfile.findOne({ userId: artistId });
      if (!artist) {
        return res.status(404).json({
          success: false,
          message: "Artist not found",
        });
      }

      const requestedDate = new Date(eventDate);
      requestedDate.setHours(0, 0, 0, 0);

      if (paymentIntentId) {
        const existingPaidBooking = await Booking.findOne({
          clientId,
          artistId,
          paymentIntentId,
        });

        if (existingPaidBooking) {
          return res.status(200).json({
            success: true,
            message: "Booking already finalized",
            booking: existingPaidBooking,
          });
        }
      }

      const singleGigDay = isSingleGigPerDayCategory(artist);

      let availabilitySlot;
      if (singleGigDay) {
        availabilitySlot = await Availability.findOne({
          artistId,
          date: requestedDate,
          startTime,
          endTime,
          isPublished: true,
          status: "Available",
        });
        if (!availabilitySlot) {
          availabilitySlot = await Availability.findOne({
            artistId,
            date: requestedDate,
            isPublished: true,
            status: "Available",
          }).sort({ startTime: 1 });
        }
      } else {
        availabilitySlot = await Availability.findOne({
          artistId,
          date: requestedDate,
          startTime,
          endTime,
          isPublished: true,
          status: "Available",
        });
      }

      if (!availabilitySlot) {
        const existingSlotBookingQuery = singleGigDay
          ? {
              clientId,
              artistId,
              eventDate: requestedDate,
              status: { $in: ["pending", "confirmed"] },
            }
          : {
              clientId,
              artistId,
              eventDate: requestedDate,
              startTime,
              endTime,
              status: { $in: ["pending", "confirmed"] },
            };
        const existingSlotBooking = await Booking.findOne(existingSlotBookingQuery);

        if (existingSlotBooking) {
          return res.status(200).json({
            success: true,
            message: "Booking already finalized",
            booking: existingSlotBooking,
          });
        }

        return res.status(409).json({
          success: false,
          message: "This slot is no longer available",
        });
      }

      const bookStartTime = availabilitySlot.startTime;
      const bookEndTime = availabilitySlot.endTime;

      // Calculate duration and price
      const start = new Date(`2000-01-01 ${bookStartTime}`);
      const end = new Date(`2000-01-01 ${bookEndTime}`);
      if (end <= start) {
        end.setDate(end.getDate() + 1);
      }
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
        eventDate: requestedDate,
        startTime: bookStartTime,
        endTime: bookEndTime,
        durationHours,
        totalPrice,
        artistPrice,
        platformFee,
        eventType,
        eventLocation,
        eventDetails,
        status: "pending",
        paymentStatus: req.body.paymentStatus === "paid" ? "paid" : "pending",
        paymentIntentId,
      });

      await booking.save();

      availabilitySlot.status = "Requested";
      availabilitySlot.bookingId = booking._id;
      await availabilitySlot.save();

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
        .populate("clientId", "name email phone profileImage")
        .populate("artistId", "name email phone profileImage");

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

      const [enrichedBooking] = await enrichBookingsWithProfiles([booking]);

      return res.status(200).json({
        success: true,
        booking: enrichedBooking,
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
        .populate("clientId", "name email phone profileImage")
        .populate("artistId", "name email phone profileImage")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));
      const enrichedBookings = await enrichBookingsWithProfiles(bookings);

      const total = await Booking.countDocuments(query);

      return res.status(200).json({
        success: true,
        bookings: enrichedBookings,
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

      if (status === "confirmed") {
        await Availability.findOneAndUpdate(
          { bookingId: booking._id, artistId: booking.artistId },
          { status: "Booked" }
        );
      }

      if (status === "cancelled") {
        await Availability.findOneAndUpdate(
          { bookingId: booking._id, artistId: booking.artistId },
          { status: "Available", bookingId: null }
        );
      }

      const updatedBooking = await Booking.findById(booking._id)
        .populate("clientId", "name email phone profileImage")
        .populate("artistId", "name email phone profileImage");
      const [enrichedBooking] = await enrichBookingsWithProfiles([updatedBooking]);

      return res.status(200).json({
        success: true,
        message: `Booking ${status} successfully`,
        booking: enrichedBooking,
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
