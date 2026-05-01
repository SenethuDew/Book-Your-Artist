const Availability = require("../models/Availability");
const User = require("../models/User");
const { z } = require("zod");

/**
 * Get availability slots for authenticated artist
 * GET /api/availability/me
 */
const getMyAvailability = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Verify user is an artist
    const user = await User.findById(userId);
    if (!user || user.role !== "artist") {
      return res.status(403).json({
        success: false,
        message: "Only artists can view availability",
      });
    }

    const slots = await Availability.find({ artistId: userId })
      .sort({ date: 1, startTime: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      availability: slots,
    });
  } catch (error) {
    console.error("Get availability error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch availability slots",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Create a new availability slot
 * POST /api/availability
 */
const createAvailability = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Verify user is an artist
    const user = await User.findById(userId);
    if (!user || user.role !== "artist") {
      return res.status(403).json({
        success: false,
        message: "Only artists can create availability slots",
      });
    }

    const { date, startTime, endTime } = req.body;

    // Basic validation
    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Date, start time, and end time are required",
      });
    }

    // Validate time format
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Use HH:MM",
      });
    }

    // Parse date and times
    const slotDate = new Date(date);
    slotDate.setHours(0, 0, 0, 0);

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (slotDate < today) {
      return res.status(400).json({
        success: false,
        message: "Cannot create availability for past dates",
      });
    }

    // Convert HH:MM to total minutes for interval math
    const startParts = startTime.split(":").map(Number);
    const endParts = endTime.split(":").map(Number);
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];

    // Zero-length slots are invalid. end < start is allowed (crosses midnight).
    if (endMinutes === startMinutes) {
      return res.status(400).json({
        success: false,
        message: "End time must be different from start time",
      });
    }

    // Build absolute interval [startDateTime, endDateTime)
    const slotStartDateTime = new Date(slotDate);
    slotStartDateTime.setHours(startParts[0], startParts[1], 0, 0);

    const slotEndDateTime = new Date(slotDate);
    slotEndDateTime.setHours(endParts[0], endParts[1], 0, 0);
    if (endMinutes <= startMinutes) {
      // Overnight slot (e.g. 23:30 -> 01:00)
      slotEndDateTime.setDate(slotEndDateTime.getDate() + 1);
    }

    // Check for overlapping slots (same day plus adjacent days for overnight overlap)
    const previousDay = new Date(slotDate);
    previousDay.setDate(previousDay.getDate() - 1);

    const nextDay = new Date(slotDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingSlots = await Availability.find({
      artistId: userId,
      date: {
        $gte: previousDay,
        $lt: new Date(nextDay.getTime() + 24 * 60 * 60 * 1000),
      },
    }).lean();

    // Check for overlap or duplicate
    const hasConflict = existingSlots.some((slot) => {
      const existingStart = slot.startTime.split(":").map(Number);
      const existingEnd = slot.endTime.split(":").map(Number);
      const existingStartMinutes = existingStart[0] * 60 + existingStart[1];
      const existingEndMinutes = existingEnd[0] * 60 + existingEnd[1];

      const existingSlotDate = new Date(slot.date);
      existingSlotDate.setHours(0, 0, 0, 0);

      const existingStartDateTime = new Date(existingSlotDate);
      existingStartDateTime.setHours(existingStart[0], existingStart[1], 0, 0);

      const existingEndDateTime = new Date(existingSlotDate);
      existingEndDateTime.setHours(existingEnd[0], existingEnd[1], 0, 0);
      if (existingEndMinutes <= existingStartMinutes) {
        existingEndDateTime.setDate(existingEndDateTime.getDate() + 1);
      }

      // Check for exact duplicate
      if (
        existingSlotDate.getTime() === slotDate.getTime() &&
        slot.startTime === startTime &&
        slot.endTime === endTime
      ) {
        return true;
      }

      // Interval overlap check: [A.start < B.end] && [A.end > B.start]
      if (slotStartDateTime < existingEndDateTime && slotEndDateTime > existingStartDateTime) {
        return true;
      }

      return false;
    });

    if (hasConflict) {
      return res.status(400).json({
        success: false,
        message:
          "This time slot overlaps with or duplicates an existing slot",
      });
    }

    // Create new availability
    const availability = new Availability({
      artistId: userId,
      date: slotDate,
      startTime,
      endTime,
      status: req.body.status || 'Available',
    });

    await availability.save();

    return res.status(201).json({
      success: true,
      message: "Availability slot created successfully",
      availability,
    });
  } catch (error) {
    console.error("Create availability error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create availability slot",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Delete an availability slot
 * DELETE /api/availability/:id
 */
const deleteAvailability = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Slot ID is required",
      });
    }

    // Get the slot
    const slot = await Availability.findById(id);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Availability slot not found",
      });
    }

    // Check if user owns this slot
    if (slot.artistId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own availability slots",
      });
    }

    // Delete the slot
    await Availability.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Availability slot deleted successfully",
    });
  } catch (error) {
    console.error("Delete availability error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete availability slot",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Update availability slot (PATCH)
 * PATCH /api/availability/:id
 */
const updateAvailability = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { isPublished, status } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Availability ID is required",
      });
    }

    const slot = await Availability.findById(id);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Availability slot not found",
      });
    }

    if (slot.artistId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own availability slots",
      });
    }

    const updateData = {};
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (status !== undefined) updateData.status = status;

    const updatedSlot = await Availability.findByIdAndUpdate(id, updateData, { new: true });

    return res.status(200).json({
      success: true,
      message: "Availability slot updated successfully",
      availability: updatedSlot,
    });
  } catch (error) {
    console.error("Update availability error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update availability slot",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getMyAvailability,
  createAvailability,
  deleteAvailability,
  updateAvailability,
};

/**
 * Get availability slots for a specific artist (public)
 * GET /api/availability/artist/:artistId
 */
const getArtistAvailability = async (req, res) => {
  try {
    const { artistId } = req.params;
    if (!artistId) {
      return res.status(400).json({
        success: false,
        message: "Artist ID is required",
      });
    }

    const slots = await Availability.find({
      artistId: artistId,
      isPublished: true,
      status: { $in: ["Available", "Booked"] },
    })
      .sort({ date: 1, startTime: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      availability: slots,
    });
  } catch (error) {
    console.error("Get artist availability error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch availability slots",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getMyAvailability,
  createAvailability,
  deleteAvailability,
  updateAvailability,
  getArtistAvailability,
};
