"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripeCheckout from "@/components/StripeCheckout";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface Booking {
  _id: string;
  eventDate: string;
  budget: number;
  eventType: string;
  eventDescription: string;
  artistName: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const bookingId = searchParams.get("bookingId");

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      router.push("/login");
      return;
    }

    // Redirect if no booking ID provided
    if (!bookingId) {
      setError("No booking ID provided");
      setIsLoading(false);
      return;
    }

    const fetchBookingAndCreateIntent = async () => {
      try {
        // Fetch booking details
        const token = localStorage.getItem("token");
        const bookingResponse = await fetch(`/api/bookings/${bookingId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!bookingResponse.ok) {
          throw new Error("Failed to fetch booking");
        }

        const bookingData = await bookingResponse.json();
        setBooking(bookingData.data);

        // Create payment intent
        const intentResponse = await fetch("/api/payments/intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookingId,
            amount: bookingData.data.budget,
          }),
        });

        if (!intentResponse.ok) {
          const errorData = await intentResponse.json();
          throw new Error(errorData.message || "Failed to create payment intent");
        }

        const intentData = await intentResponse.json();
        setClientSecret(intentData.clientSecret);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingAndCreateIntent();
  }, [bookingId, user, router]);

  const handlePaymentSuccess = (paymentIntent: { id: string }) => {
    // Redirect to success page with booking ID
    router.push(`/payment/success?bookingId=${bookingId}&paymentIntentId=${paymentIntent.id}`);
  };

  const handlePaymentError = (errorMsg: string) => {
    setError(errorMsg);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <Link
              href="/bookings"
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Back to Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!booking || !clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unable to load checkout</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Artist</p>
                  <p className="text-lg font-semibold text-gray-900">{booking.artistName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Event Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(booking.eventDate).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Event Type</p>
                  <p className="text-lg font-semibold text-gray-900">{booking.eventType}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-700 text-sm">{booking.eventDescription}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Subtotal</span>
                  <span className="text-gray-900 font-semibold">${booking.budget.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-700">Service Fee</span>
                  <span className="text-gray-900 font-semibold">
                    ${(booking.budget * 0.05).toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      ${(booking.budget * 1.05).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href={`/bookings/${bookingId}`}
                className="mt-6 block w-full text-center text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                View Booking Details
              </Link>
            </div>
          </div>

          {/* Payment Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 md:p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment</h1>
              <p className="text-gray-600 mb-8">
                Complete your payment to confirm your booking
              </p>

              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripeCheckout
                  clientSecret={clientSecret}
                  bookingId={bookingId || ""}
                  amount={booking.budget * 1.05}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  By completing this payment, you agree to our{" "}
                  <a href="#" className="text-indigo-600 hover:text-indigo-700">
                    Terms of Service
                  </a>{" "}
                  and confirm that your booking details are accurate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
