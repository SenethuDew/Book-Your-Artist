const { z } = require("zod");

// Register validation
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["client", "artist"]).default("client"),
});

// Login validation
const loginSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  password: z.string().min(1, "Password is required"),
});

// Artist profile update validation
const artistProfileSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
  category: z.string().optional(),
  artistType: z.string().optional(),
  location: z.string().optional(),
  genres: z.array(z.string()).min(1, "At least one genre is required").optional(),
  hourlyRate: z.coerce.number().min(5, "Hourly rate must be at least $5").optional(),
  experience: z.coerce.number().optional(),
  profileImage: z.string().optional(),
  coverImage: z.string().optional(),
  socialLinks: z.object({
    instagram: z.string().optional(),
    spotify: z.string().optional(),
    youtube: z.string().optional(),
  }).optional(),
  specialties: z.array(z.string()).optional(),
  yearsOfExperience: z.number().optional(),
  minimumBooking: z.number().optional(),
  serviceTypes: z.array(z.string()).optional(),
  equipmentProvided: z.array(z.string()).optional(),
  travelRadius: z.number().optional(),
  languages: z.array(z.string()).optional(),
  timezone: z.string().optional(),
  portfolio: z.object({
    videoLinks: z.array(z.string().url()).optional(),
    audioLinks: z.array(z.string().url()).optional(),
    images: z.array(z.string().url()).optional(),
  }).optional(),
}).passthrough();

// Artist payout bank (use PUT /api/artists/me/payout-bank only — never via generic profile update)
const payoutBankSchema = z
  .object({
    accountHolderName: z.string().min(2, "Account name is required").max(120),
    bankName: z.string().min(2, "Bank name is required").max(120),
    country: z.string().min(2, "Country is required").max(80),
    routingNumber: z
      .preprocess((v) => (v === "" || v === undefined || v === null ? undefined : String(v).trim()),
        z.string().min(4).max(34).regex(/^[A-Za-z0-9-]+$/).optional()),
    accountNumber: z
      .string()
      .min(4)
      .max(34)
      .regex(/^[A-Za-z0-9\s-]+$/, "Use letters, numbers, spaces, or hyphens only"),
    swiftBic: z
      .preprocess((v) => (v === "" || v === undefined || v === null ? undefined : String(v).trim().toUpperCase()),
        z.string().max(11).regex(/^[A-Z0-9]+$/, "SWIFT/BIC uses letters and numbers only").optional()),
  })
  .strict();

// Search filters validation
const searchFiltersSchema = z.object({
  genres: z.array(z.string()).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sort: z.string().optional(),
});

// Booking creation validation
const bookingSchema = z.object({
  artistId: z.string().min(1, "Artist ID is required"),
  eventDate: z.string().datetime(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  eventType: z.string().optional(),
  eventLocation: z.object({
    venue: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  eventDetails: z.string().optional(),
});

// Review validation
const reviewSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().min(10, "Comment must be at least 10 characters"),
  tags: z.array(z.string()).optional(),
});

// Message validation
const messageSchema = z.object({
  conversationId: z.string().optional(),
  recipientId: z.string().min(1, "Recipient ID is required"),
  content: z.string().min(1, "Message cannot be empty"),
});

// Availability validation
const availabilitySchema = z.object({
  date: z.string().datetime(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotDuration: z.number().min(15).default(30),
});

const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.validatedData = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.reduce((acc, err) => {
          const path = err.path.join(".");
          acc[path] = err.message;
          return acc;
        }, {});
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors,
        });
      }
      res.status(400).json({ success: false, message: "Invalid request" });
    }
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  artistProfileSchema,
  payoutBankSchema,
  searchFiltersSchema,
  bookingSchema,
  reviewSchema,
  messageSchema,
  availabilitySchema,
  validateRequest,
};
