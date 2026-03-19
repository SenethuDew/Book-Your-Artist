"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { StripePaymentElementOptions, PaymentIntent } from "@stripe/stripe-js";

interface StripeCheckoutProps {
  clientSecret: string;
  bookingId: string;
  amount: number;
  onSuccess: (result: PaymentIntent) => void;
  onError: (error: string) => void;
}

export default function StripeCheckout({
  clientSecret,
  bookingId,
  amount,
  onSuccess,
  onError,
}: StripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const paymentElementOptions: StripePaymentElementOptions = {
    layout: "tabs",
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError("Stripe failed to load");
      return;
    }

    setIsLoading(true);

    try {
      // Confirm the payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?bookingId=${bookingId}`,
          receipt_email: email,
        },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message || "Payment failed");
        setIsLoading(false);
      } else if (paymentIntent.status === "succeeded") {
        // Payment succeeded - confirm on backend
        const confirmResponse = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            bookingId,
          }),
        });

        if (confirmResponse.ok) {
          onSuccess(paymentIntent);
        } else {
          onError("Failed to confirm payment");
        }
      }
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "An error occurred"
      );
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="space-y-6">
        {/* Email input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Stripe Payment Element */}
        <PaymentElement options={paymentElementOptions} />

        {/* Amount display */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Total Amount:</span>
            <span className="text-2xl font-bold text-indigo-600">
              ${amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!stripe || isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin mr-2">⟳</span>
              Processing...
            </span>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </button>

        {/* Security info */}
        <p className="text-xs text-gray-500 text-center">
          Your payment is secure and encrypted
        </p>
      </div>
    </form>
  );
}
