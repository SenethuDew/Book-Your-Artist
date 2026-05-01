const express = require("express");
const router = express.Router();

// Import controllers
const authController = require("../controllers/authController");
const artistController = require("../controllers/artistController");
const availabilityController = require("../controllers/availabilityController");
const bookingController = require("../controllers/bookingController");
const paymentController = require("../controllers/paymentController");
const reviewController = require("../controllers/reviewController");
const messageController = require("../controllers/messageController");
const adminController = require("../controllers/adminController");

// Import middleware (auth middleware should already exist)
const auth = require("../middleware/auth"); // Assuming this exists

// ===== AUTH ROUTES =====
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
// Add logging
const fs = require("fs");
router.use((req, res, next) => {
	fs.appendFileSync("./route.log", `[${new Date().toISOString()}] ${req.method} ${req.path}\n`, "utf8");
	next();
});
router.get("/auth/me", auth, authController.getMe);
router.get("/users/me", auth, authController.getMe);
router.put("/users/me", auth, authController.updateMe);
router.delete("/users/me", auth, authController.deleteMe);
router.post("/auth/logout", auth, authController.logout);

// ===== ARTIST PROFILE ROUTES (Auth Required) - MUST BE BEFORE /:id =====
router.get("/artists/me", auth, artistController.getMyProfile);
router.put("/artists/me", auth, artistController.updateProfile);

// ===== ARTIST SEARCH & BROWSE ROUTES =====
router.get("/artists/genres", artistController.getGenres);
router.get("/artists/price-stats", artistController.getPriceStats);
router.get("/artists/featured", artistController.getFeaturedArtists);
router.get("/artists/trending", artistController.getTrendingArtists);
router.get("/artists/search", artistController.searchArtists);
router.get("/artists/:id", artistController.getArtistDetail);
router.put("/artists/profile", auth, artistController.updateProfile);
router.get("/artists/me/stats", auth, artistController.getStats);

// ===== AVAILABILITY ROUTES =====
router.get("/availability/me", auth, availabilityController.getMyAvailability);
router.post("/availability", auth, availabilityController.createAvailability);
router.delete("/availability/:id", auth, availabilityController.deleteAvailability);
router.get("/availability/artist/:artistId", availabilityController.getArtistAvailability);
router.patch("/availability/:id", auth, availabilityController.updateAvailability);

// ===== BOOKING ROUTES =====
router.post("/bookings", auth, bookingController.createBooking);
router.get("/bookings/my", auth, bookingController.getMyBookings);
router.get("/bookings/stats", auth, bookingController.getStats);
router.get("/bookings/:id", auth, bookingController.getBooking);
router.patch("/bookings/:id/status", auth, bookingController.updateBookingStatus);

// ===== PAYMENT ROUTES =====
router.post("/payments/intent", auth, paymentController.createPaymentIntent);
router.post("/payments/confirm", auth, paymentController.confirmPayment);
router.get("/payments/:paymentIntentId", auth, paymentController.getPaymentStatus);
router.post("/payments/:paymentIntentId/refund", auth, paymentController.refundPayment);
// /payments/webhook is registered in server.js to use raw express body

// ===== REVIEW ROUTES =====
router.post("/reviews", auth, reviewController.createReview);
router.get("/reviews/artist/:artistId", reviewController.getArtistReviews);
router.get("/reviews/my", auth, reviewController.getMyReviews);
router.get("/reviews/:id", reviewController.getReview);
router.patch("/reviews/:id/response", auth, reviewController.addResponse);
router.delete("/reviews/:id", auth, reviewController.deleteReview);

// ===== MESSAGE ROUTES =====
router.post("/messages", auth, messageController.sendMessage);
router.get("/messages/conversations", auth, messageController.getConversations);
router.get("/messages/conversation/:conversationId", auth, messageController.getConversationMessages);
router.post("/messages/conversation", auth, messageController.getOrCreateConversation);
router.patch("/messages/:id/read", auth, messageController.markAsRead);
router.delete("/messages/:id", auth, messageController.deleteMessage);

// ===== ADMIN ROUTES =====
router.get("/admin/users", auth, adminController.getAllUsers);
router.get("/admin/pending-artists", auth, adminController.getPendingArtists);
router.put("/admin/artists/:artistId/approve", auth, adminController.approveArtist);
router.put("/admin/artists/:artistId/reject", auth, adminController.rejectArtist);
router.get("/admin/stats", auth, adminController.getStats);
router.put("/admin/users/:userId/suspend", auth, adminController.suspendUser);
router.put("/admin/users/:userId/unsuspend", auth, adminController.unsuspendUser);

module.exports = router;
