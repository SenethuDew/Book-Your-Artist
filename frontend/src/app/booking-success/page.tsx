"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ShieldCheck, ArrowRight, Music2, AlertTriangle, Home } from "lucide-react";
import { createFirestoreBooking } from "@/lib/firebaseBookingAPI";
import toast from "react-hot-toast";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const sessionId = searchParams?.get("session_id");

    if (!sessionId) {
      setError("No payment session found.");
      setIsLoading(false);
      return;
    }

    const processPayment = async () => {
      try {
        const res = await fetch(`/api/verify_session?session_id=${sessionId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || data.error || "Payment verification failed.");
        }

        const metadata = data.metadata;
        setBooking(metadata);

        // Save to Firestore ONLY NOW
        const bookingData = {
          artistId: metadata.artistId,
          artistName: metadata.artistName,
          clientId: metadata.clientId || "guest",
          clientName: metadata.clientName,
          clientEmail: metadata.clientEmail || "",
          eventDate: metadata.eventDate,
          startTime: metadata.startTime,
          endTime: metadata.endTime,
          eventTitle: metadata.eventTitle,
          location: metadata.location || "",
          specialRequest: metadata.specialRequest || "",
          totalPrice: Number(metadata.totalPrice),
          advanceAmount: Number(metadata.advanceAmount),
          status: "confirmed" as "confirmed", // Mark as confirmed instantly since paid
          paymentStatus: "paid" as "paid",
        };

        const result = await createFirestoreBooking(bookingData);
        if (!result.success) {
          // If the slot mysteriously got booked in the 5 minutes they took to pay
          throw new Error(result.error || "Failed to finalize booking in system.");
        }

        setBookingId(result.bookingId || null);
        toast.success("Booking officially confirmed!");
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to confirm payment details.");
      } finally {
        setIsLoading(false);
      }
    };

    processPayment();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-gray-300 text-lg font-medium animate-pulse">Verifying Payment Securely...</p>
        <p className="text-gray-500 text-sm mt-2">Do not close this window.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 py-12 px-4 flex items-center justify-center">
        <div className="max-w-xl w-full bg-gray-900 border border-red-500/30 p-8 rounded-3xl text-center shadow-[0_0_40px_rgba(239,68,68,0.1)]">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-red-500/10 mb-6">
            <AlertTriangle className="text-red-500 w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Booking Error</h1>
          <p className="text-gray-400 mb-8 border-l-4 border-red-500/50 bg-gray-800/50 p-4 text-left">{error}</p>
          <div className="flex gap-4 max-w-sm mx-auto">
            <Link href="/" className="flex-1 flex justify-center items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors border border-gray-700">
              <Home size={18} /> Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4 flex items-center justify-center">
      <div className="max-w-xl w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-emerald-500/5">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 mb-6 shadow-lg shadow-emerald-500/30">
            <CheckCircle className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Booking Confirmed!</h1>
          <p className="text-gray-400">Your advance payment was successful. The slot is secured.</p>
        </div>

        {booking && (
          <div className="bg-gray-950 rounded-2xl p-6 mb-8 border border-gray-800 shadow-inner">
            <h2 className="font-semibold text-white mb-5 flex items-center gap-2 tracking-wide uppercase text-sm">
               Payment Receipt
            </h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center border-b border-gray-800/80 pb-3">
                <span className="text-gray-400">Artist</span>
                <span className="font-semibold text-white flex items-center gap-2">
                  <Music2 size={14} className="text-violet-400"/> {booking.artistName}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800/80 pb-3">
                <span className="text-gray-400">Date & Time</span>
                <span className="font-semibold text-white text-right">
                  {booking.eventDate} <br />
                  <span className="text-gray-500 font-normal">{booking.startTime} - {booking.endTime}</span>
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800/80 pb-3">
                <span className="text-gray-400">Status</span>
                <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold uppercase tracking-wider">
                  ADVANCE PAID
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-400">Amount Paid</span>
                <span className="font-bold text-xl text-yellow-400">
                  ${Number(booking.advanceAmount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link href={`/artist/${booking?.artistId || ''}`} className="flex justify-center items-center gap-2 bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-yellow-600/30">
            View Artist Profile <ArrowRight size={18} />
          </Link>
          <Link href="/" className="flex justify-center items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all border border-gray-700">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
