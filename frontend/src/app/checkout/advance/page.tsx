"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFirestoreBooking, updateFirestoreBooking } from "@/lib/firebaseBookingAPI";
import { ShieldCheck, ArrowLeft, Watch, MapPin, Music2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AdvanceCheckoutPage() {
  const router = useRouter();
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search);
      const bid = q.get("bookingId");
      const aid = q.get("artistId");
      setBookingId(bid);

      // Legacy / mistaken links passed only artistId; advance checkout needs a Firestore booking id.
      if (!bid && aid) {
        setIsLoading(false);
        setError(
          'This checkout link needs a booking. Open the artist profile to create a booking, then use "Pay now" from your booking details (or Book & pay from the dashboard).'
        );
      }
    }
  }, []);

  useEffect(() => {
    if (!bookingId) {
      if (typeof window !== "undefined" && window.location.search) {
        const q = new URLSearchParams(window.location.search);
        // artistId-only URLs are handled in the first effect with a clearer message
        if (q.get("artistId") && !q.get("bookingId")) {
          return;
        }
        setIsLoading(false);
        setError("Invalid Booking session.");
      }
      return;
    }

    const loadBooking = async () => {
      const res = await getFirestoreBooking(bookingId);
      if (res.success && res.data) {
        setBooking(res.data);
      } else {
        setError(res.error || "Booking not found.");
      }
      setIsLoading(false);
    };
    loadBooking();
  }, [bookingId]);

  const handleMockStripePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Simulate Stripe communication latency
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      const updateRes = await updateFirestoreBooking(bookingId as string, {
        status: 'confirmed',
        paymentStatus: 'paid'
      });

      if (updateRes.success) {
        toast.success("Payment successful! Booking confirmed.");
        router.push(`/payment/success?bookingId=${bookingId}`);
      } else {
        throw new Error(updateRes.error || "Failed to update booking status");
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 font-medium">Securing checkout session...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="bg-gray-900 border border-red-500/30 p-8 rounded-2xl max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Checkout Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 font-sans text-gray-200">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white flex items-center gap-2 font-medium transition">
            <ArrowLeft size={18} /> Cancel
          </button>
          <div className="flex items-center gap-2 font-bold text-white tracking-tight">
            <ShieldCheck className="text-emerald-500" size={24} /> Secure Checkout
          </div>
          <div className="w-[88px]"></div> {/* Spacer for centering */}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 grid lg:grid-cols-2 gap-8 lg:gap-12 mt-4">
        
        {/* Left Col: Order Summary */}
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6">Booking Summary</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                <span className="text-gray-400 font-medium">Artist</span>
                <span className="text-white font-semibold flex items-center gap-2">
                   <Music2 size={16} className="text-violet-400"/> {booking.artistName}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                <span className="text-gray-400 font-medium">Date & Time</span>
                <span className="text-white font-semibold flex items-center gap-2 text-right">
                  <Watch size={16} className="text-yellow-500"/>
                  {booking.eventDate}<br/>
                  <span className="text-gray-500 text-sm">{booking.startTime} - {booking.endTime}</span>
                </span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-gray-800 gap-2">
                <span className="text-gray-400 font-medium">Location</span>
                <span className="text-white font-semibold flex items-center gap-2 sm:text-right">
                   <MapPin size={16} className="text-fuchsia-500" /> {booking.location}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                <span className="text-gray-400 font-medium">Event Type</span>
                <span className="text-white font-semibold capitalize">{booking.eventType || booking.eventTitle || 'Performance'}</span>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-400">Total Price</span>
                <span className="text-white font-medium">${booking.totalPrice?.toFixed(2) || '---'}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-700 pt-3 mt-3">
                <span className="text-white font-bold text-lg">Advance Payment (50%)</span>
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                  ${booking.advanceAmount?.toFixed(2) || '---'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">
                The remaining ${(booking.totalPrice - (booking.advanceAmount || 0)).toFixed(2)} will be due 48 hours before the event.
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Stripe Mock Form */}
        <div>
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-2">Payment Input</h2>
            <p className="text-gray-400 text-sm mb-6">Complete your advance payment to secure the artist.</p>

            <form onSubmit={handleMockStripePayment} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Card Information</label>
                <div className="bg-gray-950 border border-gray-700 rounded-xl overflow-hidden focus-within:border-violet-500 transition-colors">
                  <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-3">
                    <div className="w-8 h-5 bg-gray-800 rounded flex items-center justify-center text-[10px] font-bold text-white tracking-widest shrink-0">VISA</div>
                    <input 
                      required 
                      type="text" 
                      placeholder="Card number" 
                      className="bg-transparent text-white w-full outline-none placeholder-gray-600 font-mono tracking-wider text-sm"
                      maxLength={19}
                      defaultValue="4242 4242 4242 4242"
                    />
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-gray-800">
                    <input 
                      required
                      type="text" 
                      placeholder="MM / YY" 
                      className="bg-transparent text-white w-full outline-none px-4 py-3 placeholder-gray-600 font-mono text-sm"
                      maxLength={5}
                      defaultValue="12/26"
                    />
                    <input 
                      required
                      type="text" 
                      placeholder="CVC" 
                      className="bg-transparent text-white w-full outline-none px-4 py-3 placeholder-gray-600 font-mono text-sm"
                      maxLength={4}
                      defaultValue="123"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name on card</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Jane Doe" 
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500 transition-colors"
                  defaultValue={booking.clientName}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Billing Email</label>
                <input 
                  required
                  type="email" 
                  placeholder="e.g. jane@example.com" 
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500 transition-colors"
                  defaultValue={booking.clientEmail}
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-lg hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-[0_0_30px_-10px_rgba(168,85,247,0.5)] transform hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                       <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Processing...
                    </span>
                  ) : (
                    `Pay $${booking.advanceAmount?.toFixed(2) || '---'} (Advance)`
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-1">
                <ShieldCheck size={14} className="text-gray-400" /> Payments processed securely by Stripe Demo.
              </p>
            </form>
          </div>
        </div>
        
      </main>
    </div>
  );
}