const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

// Initialize Stripe lazily with error handling
let stripe = null;

const getStripe = () => {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        "STRIPE_SECRET_KEY not configured. Please set it in your .env file"
      );
    }
    const Stripe = require("stripe");
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

class StripeService {
  /**
   * Create a payment intent for a booking
   * Amount should be in dollars (will be converted to cents)
   */
  async createPaymentIntent(bookingId, amount, description) {
    try {
      const stripeClient = getStripe();
      
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        description: description,
        metadata: {
          bookingId: bookingId,
          type: "artist_booking",
        },
      });

      // Save payment record
      const payment = new Payment({
        bookingId,
        amount,
        currency: "USD",
        stripePaymentIntentId: paymentIntent.id,
        status: "pending",
        createdAt: new Date(),
      });

      await payment.save();

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error("Error creating payment intent:", error);
      throw new Error(error.message);
    }
  }

  /**
   * Confirm payment (called after Stripe confirmation)
   */
  async confirmPayment(paymentIntentId, bookingId) {
    try {
      const stripeClient = getStripe();
      const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === "succeeded") {
        // Update payment record
        const payment = await Payment.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntentId },
          { status: "completed", completedAt: new Date() },
          { new: true }
        );

        // Update booking payment status
        const booking = await Booking.findByIdAndUpdate(
          bookingId,
          { paymentStatus: "paid" },
          { new: true }
        );

        return {
          success: true,
          message: "Payment confirmed successfully",
          payment,
          booking,
        };
      } else if (paymentIntent.status === "requires_action") {
        return {
          success: false,
          message: "Payment requires additional action",
          status: paymentIntent.status,
        };
      } else {
        return {
          success: false,
          message: "Payment failed",
          status: paymentIntent.status,
        };
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      throw new Error(error.message);
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentIntentId) {
    try {
      const stripeClient = getStripe();
      const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
      return {
        stripeStatus: paymentIntent.status,
        lastPaymentError: paymentIntent.last_payment_error,
      };
    } catch (error) {
      console.error("Error getting payment status:", error);
      throw new Error(error.message);
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentIntentId, amount = null) {
    try {
      const stripeClient = getStripe();
      const refund = await stripeClient.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      // Update payment record
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntentId },
        { status: "refunded", refundedAt: new Date() },
        { new: true }
      );

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
      };
    } catch (error) {
      console.error("Error refunding payment:", error);
      throw new Error(error.message);
    }
  }
}

module.exports = new StripeService();
