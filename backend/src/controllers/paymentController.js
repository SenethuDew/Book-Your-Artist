const stripeService = require("../services/stripeService");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

class PaymentController {
  /**
   * Create payment intent for a booking
   * POST /api/payments/intent
   * Body: { bookingId, amount, artistId }
   */
  async createPaymentIntent(req, res) {
    try {
      const { bookingId, amount } = req.body;
      const userId = req.user?.id;

      if (!bookingId || !amount) {
        return res.status(400).json({
          success: false,
          message: "Booking ID and amount are required",
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Amount must be greater than 0",
        });
      }

      // Verify booking exists and belongs to user
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      if (booking.clientId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Create payment intent with Stripe
      const result = await stripeService.createPaymentIntent(
        bookingId,
        amount,
        `Booking payment for artist event on ${new Date(booking.eventDate).toLocaleDateString()}`
      );

      return res.status(200).json(result);
    } catch (error) {
      console.error("Create payment intent error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create payment intent",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Confirm payment after Stripe confirmation
   * POST /api/payments/confirm
   * Body: { paymentIntentId, bookingId }
   */
  async confirmPayment(req, res) {
    try {
      const { paymentIntentId, bookingId } = req.body;
      const userId = req.user?.id;

      if (!paymentIntentId || !bookingId) {
        return res.status(400).json({
          success: false,
          message: "Payment Intent ID and Booking ID are required",
        });
      }

      // Verify booking belongs to user
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      if (booking.clientId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Confirm payment with Stripe
      const result = await stripeService.confirmPayment(paymentIntentId, bookingId);

      return res.status(200).json(result);
    } catch (error) {
      console.error("Confirm payment error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to confirm payment",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get payment status
   * GET /api/payments/:paymentIntentId
   */
  async getPaymentStatus(req, res) {
    try {
      const { paymentIntentId } = req.params;

      if (!paymentIntentId) {
        return res.status(400).json({
          success: false,
          message: "Payment Intent ID is required",
        });
      }

      const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      const stripeStatus = await stripeService.getPaymentStatus(paymentIntentId);

      return res.status(200).json({
        success: true,
        payment,
        stripe: stripeStatus,
      });
    } catch (error) {
      console.error("Get payment status error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get payment status",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Refund payment
   * POST /api/payments/:paymentIntentId/refund
   * Body: { amount? }
   */
  async refundPayment(req, res) {
    try {
      const { paymentIntentId } = req.params;
      const { amount } = req.body;
      const userId = req.user?.id;

      if (!paymentIntentId) {
        return res.status(400).json({
          success: false,
          message: "Payment Intent ID is required",
        });
      }

      // Find payment and verify ownership
      const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      const booking = await Booking.findById(payment.bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      // Only artist or admin can refund
      if (
        booking.artistId.toString() !== userId &&
        req.user?.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Process refund
      const result = await stripeService.refundPayment(paymentIntentId, amount);

      return res.status(200).json(result);
    } catch (error) {
      console.error("Refund payment error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to refund payment",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Webhook for Stripe events
   * POST /api/payments/webhook
   */
  async handleWebhook(req, res) {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = require("stripe").webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "payment_intent.succeeded":
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case "payment_intent.payment_failed":
          await this.handlePaymentFailed(event.data.object);
          break;
        case "charge.refunded":
          await this.handleChargeRefunded(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook handling error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }

  /**
   * Handle payment success
   */
  async handlePaymentSucceeded(paymentIntent) {
    const bookingId = paymentIntent.metadata?.bookingId;
    if (!bookingId) return;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { paymentStatus: "paid" },
      { new: true }
    );

    const payment = await Payment.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      {
        status: "completed",
        completedAt: new Date(),
        lastFourDigits: paymentIntent.charges?.data[0]?.payment_method_details?.card?.last4,
        cardBrand: paymentIntent.charges?.data[0]?.payment_method_details?.card?.brand,
      },
      { new: true }
    );

    console.log("Payment succeeded:", { booking, payment });
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailed(paymentIntent) {
    const bookingId = paymentIntent.metadata?.bookingId;
    if (!bookingId) return;

    const payment = await Payment.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      {
        status: "failed",
        failureReason: paymentIntent.last_payment_error?.message,
      },
      { new: true }
    );

    console.log("Payment failed:", { payment });
  }

  /**
   * Handle charge refunded
   */
  async handleChargeRefunded(charge) {
    const payment = await Payment.findOne({
      stripePaymentIntentId: charge.payment_intent,
    });

    if (payment) {
      await Payment.findByIdAndUpdate(payment._id, {
        status: "refunded",
        refundedAt: new Date(),
        refundAmount: charge.refunded ? charge.amount / 100 : 0,
      });

      // Update booking if fully refunded
      if (charge.refunded) {
        await Booking.findByIdAndUpdate(payment.bookingId, {
          paymentStatus: "refunded",
        });
      }
    }

    console.log("Charge refunded:", { charge });
  }
}

module.exports = new PaymentController();
