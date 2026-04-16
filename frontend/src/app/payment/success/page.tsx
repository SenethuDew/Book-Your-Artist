"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getFirestoreBooking } from "@/lib/firebaseBookingAPI";
import { CheckCircle, ShieldCheck, ArrowRight, Music2 } from "lucide-react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setBookingId(params.get("bookingId"));
    }
  }, []);

  useEffect(() => {
    if (!bookingId) {
      if (typeof window !== "undefined" && window.location.search) {
        setError("No booking confirmation found.");
        setIsLoading(false);
      }
      return;
    }

    const fetchPaymentStatus = async () => {
      try {
        const res = await getFirestoreBooking(bookingId);
        if (res.success && res.data) {
          setBooking(res.data);
        } else {
          throw new Error("Failed to fetch booking details.");
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentStatus();
  }, [bookingId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 font-medium">Verify payment status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 text-gray-200 flex items-center justify-center">
      <div className="max-w-xl w-full">
        {error ? (
          <div className="bg-gray-900 border border-red-500/30 p-8 rounded-3xl text-center shadow-2xl">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-500/20 mb-6">
              <span className="text-red-500 text-3xl font-bold">X</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
            <p className="text-gray-400 mb-8">{error}</p>
            <div className="flex gap-4">
              <button onClick={() => router.back()} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors">
                Go Back
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-emerald-500/10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 mb-6 shadow-lg shadow-emerald-500/30">
                <CheckCircle className="text-white w-10 h-10" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">Booking Confirmed!</h1>
              <p className="text-gray-400">
                Your advance payment was successful and the artist is booked.
              </p>
            </div>

            {booking && (
              <div className="bg-gray-950/50 rounded-2xl p-6 mb-8 border border-gray-800">
                <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
                  <ShieldCheck className="text-emerald-500 w-5 h-5"/> Payment Details
                </h2>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center border-b border-gray-800/50 pb-3">
                    <span className="text-gray-400">Artist</span>
                    <span className="font-semibold text-white flex items-center gap-2">
                      <Music2 size={14} className="text-violet-400"/> {booking.artistName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-800/50 pb-3">
                    <span className="text-gray-400">Date & Time</span>
                    <span className="font-semibold text-white flex items-center gap-2 text-right">
                      {booking.eventDate} <br />
                      <span className="text-gray-500 font-normal">{booking.startTime} - {booking.endTime}</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-800/50 pb-3">
                    <span className="text-gray-400">Status</span>
                    <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                      {booking.paymentStatus === "paid" ? "Paid (Advance)" : booking.paymentStatus}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-400">Paid Amount</span>
                    <span className="font-bold text-lg text-emerald-400">
                      ${booking.advanceAmount?.toFixed(2) || '---'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard/user"
                className="flex-1 flex justify-center items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg transform hover:-translate-y-0.5"
              >
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            </div>
            
            <p className="text-center text-xs text-gray-500 mt-8 flex items-center justify-center gap-1.5">
               An invoice has been sent to {booking?.clientEmail || 'your email'}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/contexts";

interface PaymentDetails {
  status: string;
  amount: number;
  createdAt: string;
  lastFourDigits?: string;
  cardBrand?: string;
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setBookingId(params.get("bookingId"));
      setPaymentIntentId(params.get("paymentIntentId"));
    }
  }, []);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      router.push("/login");
      return;
    }

    // Redirect if no payment intent ID provided
    if (!paymentIntentId) {
      setError("No payment confirmation found");
      setIsLoading(false);
      return;
    }

    const fetchPaymentStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/payments/${paymentIntentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch payment details");
        }

        const data = await response.json();
        setPayment(data.payment);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentStatus();
  }, [paymentIntentId, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {error ? (
          // Error State
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <span className="text-red-600 text-2xl">✕</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Link
                href={bookingId ? `/bookings/${bookingId}` : "/bookings"}
                className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Back to Booking
              </Link>
              <Link
                href="/bookings"
                className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                View All Bookings
              </Link>
            </div>
          </div>
        ) : (
          // Success State
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <span className="text-green-600 text-2xl">✓</span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-8">
              Your booking has been confirmed and payment received.
            </p>

            {payment && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h2 className="font-semibold text-gray-900 mb-4">Payment Details</h2>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-semibold text-gray-900">
                      ${payment.amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status</span>
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                      {payment.status === "completed" ? "Paid" : payment.status}
                    </span>
                  </div>

                  {payment.cardBrand && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Method</span>
                      <span className="font-semibold text-gray-900">
                        {payment.cardBrand} •••• {payment.lastFourDigits}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Date & Time</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(payment.createdAt).toLocaleDateString()} at{" "}
                      {new Date(payment.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Link
                href={bookingId ? `/bookings/${bookingId}` : "/bookings"}
                className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                View Your Booking
              </Link>
              <Link
                href="/bookings"
                className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                📧 A confirmation email has been sent to your registered email address with a
                receipt and booking details.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
