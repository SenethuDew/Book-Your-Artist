"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts";
import { API_BASE_URL } from "@/lib/api";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  MapPin,
  MessageSquare,
  Music,
  Star,
  User,
  XCircle,
} from "lucide-react";

interface Booking {
  _id: string;
  clientId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    profileImage: string;
  };
  artistId: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    profileImage?: string;
    category?: string;
    artistType?: string;
    location?: string;
    hourlyRate?: number;
    experience?: number;
    rating?: number;
    reviewCount?: number;
    verified?: boolean;
  };
  eventDate: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  totalPrice: number;
  artistPrice: number;
  platformFee: number;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "disputed";
  paymentStatus: "pending" | "paid" | "refunded";
  eventType: string;
  eventLocation: {
    venue?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  eventDetails: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  pending: { bg: "bg-yellow-500/10", text: "text-yellow-300", border: "border-yellow-500/20", icon: Clock },
  confirmed: { bg: "bg-blue-500/10", text: "text-blue-300", border: "border-blue-500/20", icon: CheckCircle2 },
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/20", icon: Star },
  cancelled: { bg: "bg-red-500/10", text: "text-red-300", border: "border-red-500/20", icon: XCircle },
  disputed: { bg: "bg-orange-500/10", text: "text-orange-300", border: "border-orange-500/20", icon: XCircle },
};

const resolveImageUrl = (value?: string) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
  if (value.startsWith("uploads/")) return `${API_BASE_URL}/${value}`;
  return value;
};

export default function BookingDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!user || !bookingId) return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_BASE_URL}/api/bookings/${bookingId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          setBooking(data.booking);
        } else {
          alert("Booking not found");
          router.push("/bookings");
        }
      } catch (error) {
        console.error("Failed to fetch booking:", error);
        alert("Failed to load booking");
        router.push("/bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [user, bookingId, router]);

  const handleStatusChange = async (newStatus: string) => {
    if (!booking) return;

    setActionLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/bookings/${booking._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setBooking(data.booking);
        alert(`Booking ${newStatus} successfully!`);
      } else {
        alert("Failed to update booking: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("Failed to update booking");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    return `${hours}:${minutes}`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLocation = () => {
    const parts = [
      booking?.eventLocation?.venue,
      booking?.eventLocation?.address,
      booking?.eventLocation?.city,
      booking?.eventLocation?.country,
    ].filter(Boolean);

    return parts.length ? parts.join(", ") : "Venue TBD";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0512] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-400 rounded-full animate-spin mx-auto mb-4" />
          <div className="text-lg font-bold text-gray-300">Loading booking details...</div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#0A0512] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            Booking Not Found
          </h1>
          <Link href="/bookings" className="text-violet-300 hover:text-white font-bold">
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const isClient = user?.role === "client";
  const isArtist = user?.role === "artist";
  const other = isClient ? booking.artistId : booking.clientId;
  const artist = booking.artistId;
  const client = booking.clientId;
  const colors = statusColors[booking.status] || statusColors.pending;
  const StatusIcon = colors.icon;
  const isUpcoming = new Date(booking.eventDate) > new Date();
  const contactImage = resolveImageUrl(other.profileImage);

  return (
    <div className="min-h-screen bg-[#0A0512] text-white selection:bg-violet-500/30">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-fuchsia-600/10 blur-[150px]" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/bookings" className="inline-flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to My Bookings
          </Link>
          <Link href={isClient ? "/home/client" : "/home/artist"} className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
            Home
          </Link>
        </div>
      </nav>

      <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <section className="rounded-[2rem] border border-white/10 bg-[#120A20]/80 overflow-hidden shadow-2xl mb-8">
          <div className="relative min-h-[260px] p-6 sm:p-8 lg:p-10 flex flex-col justify-end">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-700/35 via-fuchsia-700/20 to-blue-700/20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.22),transparent_35%)]" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider mb-4 ${colors.bg} ${colors.text} ${colors.border}`}>
                  <StatusIcon className="w-4 h-4" />
                  {booking.status}
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-200 mb-2">Booking Details</p>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
                  Booking with {other.name}
                </h1>
                <p className="text-gray-300 mt-3 max-w-2xl">
                  {booking.eventType || "General Event"} on {formatDate(booking.eventDate)} from {formatTime(booking.startTime)} to {formatTime(booking.endTime)}
                </p>
                <p className="text-xs text-gray-500 mt-3 font-mono break-all">Booking ID: {booking._id}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <Calendar className="w-5 h-5 text-violet-300 mb-2" />
                  <p className="text-xs text-gray-400 font-bold uppercase">Date</p>
                  <p className="text-sm font-bold">{formatDate(booking.eventDate)}</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <Clock className="w-5 h-5 text-fuchsia-300 mb-2" />
                  <p className="text-xs text-gray-400 font-bold uppercase">Duration</p>
                  <p className="text-sm font-bold">{booking.durationHours} hours</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 col-span-2 sm:col-span-1">
                  <DollarSign className="w-5 h-5 text-emerald-300 mb-2" />
                  <p className="text-xs text-gray-400 font-bold uppercase">Total</p>
                  <p className="text-sm font-bold">${booking.totalPrice}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-3xl border border-violet-500/10 bg-violet-500/[0.04] p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Music className="w-6 h-6 text-violet-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wider text-violet-300">Artist Details</p>
                    <h2 className="text-xl font-black truncate">{artist.name}</h2>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-gray-300">
                  {artist.email && <p className="break-all">{artist.email}</p>}
                  {artist.phone && <p>{artist.phone}</p>}
                  <p><span className="text-gray-500">Category:</span> {artist.category || "Not added"}</p>
                  <p><span className="text-gray-500">Type:</span> {artist.artistType || "Not added"}</p>
                  <p><span className="text-gray-500">Location:</span> {artist.location || "Not added"}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {artist.hourlyRate !== undefined && <span className="px-2 py-1 rounded-lg bg-white/5 text-xs font-bold">${artist.hourlyRate}/hr</span>}
                    {artist.experience !== undefined && <span className="px-2 py-1 rounded-lg bg-white/5 text-xs font-bold">{artist.experience} yrs exp.</span>}
                    {artist.rating !== undefined && <span className="px-2 py-1 rounded-lg bg-white/5 text-xs font-bold">{artist.rating.toFixed(1)} rating</span>}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-fuchsia-500/10 bg-fuchsia-500/[0.04] p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-fuchsia-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wider text-fuchsia-300">Client Details</p>
                    <h2 className="text-xl font-black truncate">{client.name}</h2>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-gray-300">
                  <p className="break-all">{client.email}</p>
                  {client.phone && <p>{client.phone}</p>}
                  <p><span className="text-gray-500">Event:</span> {booking.eventType || "General Event"}</p>
                  <p><span className="text-gray-500">Location:</span> {formatLocation()}</p>
                  {booking.eventDetails && <p className="text-gray-400 pt-2">{booking.eventDetails}</p>}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#120A20]/80 p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-5">
                <MapPin className="w-5 h-5 text-fuchsia-300" />
                <h2 className="text-xl font-black">Event Location</h2>
              </div>
              <p className="text-white font-bold">{booking.eventLocation?.venue || "Venue TBD"}</p>
              <p className="text-gray-400 mt-1">{formatLocation()}</p>
            </section>

            {booking.eventDetails && (
              <section className="rounded-3xl border border-white/10 bg-[#120A20]/80 p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-5">
                  <MessageSquare className="w-5 h-5 text-violet-300" />
                  <h2 className="text-xl font-black">Event Notes</h2>
                </div>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{booking.eventDetails}</p>
              </section>
            )}

            <section className="rounded-3xl border border-white/10 bg-[#120A20]/80 p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-5">
                <CreditCard className="w-5 h-5 text-blue-300" />
                <h2 className="text-xl font-black">Payment Summary</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="font-bold">${booking.totalPrice}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-gray-400">Platform Fee</span>
                  <span className="font-bold">${Math.round(booking.platformFee * 100) / 100}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-black">Total</span>
                  <span className="text-3xl font-black text-violet-300">${booking.totalPrice}</span>
                </div>
              </div>
              <div className={`mt-5 rounded-2xl border p-4 ${booking.paymentStatus === "paid" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"}`}>
                <p className="text-sm font-bold">Payment Status: {booking.paymentStatus === "paid" ? "Paid" : "Pending"}</p>
                {isClient && booking.paymentStatus === "pending" && (
                  <button
                    onClick={() => router.push(`/checkout?bookingId=${booking._id}`)}
                    className="mt-3 w-full rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black py-2 transition-colors"
                  >
                    Pay Now
                  </button>
                )}
              </div>
              {isArtist && (
                <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <p className="text-sm text-emerald-300 font-bold">You Earn</p>
                  <p className="text-3xl font-black text-white">${booking.artistPrice}</p>
                  <p className="text-xs text-gray-400 mt-1">After platform fee deduction</p>
                </div>
              )}
            </section>
          </div>

          <aside className="lg:col-span-1 space-y-6">
            <section className="rounded-3xl border border-white/10 bg-[#120A20]/80 p-6 shadow-2xl lg:sticky lg:top-24">
              <h2 className="text-xl font-black mb-5">{isClient ? "Artist" : "Client"} Contact</h2>
              <div className="mb-5">
                {contactImage ? (
                  <Image
                    src={contactImage}
                    alt={other.name}
                    width={500}
                    height={220}
                    className="w-full h-44 object-cover rounded-2xl"
                  />
                ) : (
                  <div className="w-full h-44 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                    <span className="text-white text-5xl font-black">{other.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <p className="text-lg font-black">{other.name}</p>
              <p className="text-sm text-gray-400 break-all mt-1">{other.email}</p>
              {other.phone && <p className="text-sm text-gray-400 mt-1">{other.phone}</p>}

              <div className="mt-6 space-y-3">
                {isArtist && booking.status === "pending" && isUpcoming && (
                  <>
                    <button
                      onClick={() => handleStatusChange("confirmed")}
                      disabled={actionLoading}
                      className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-gray-950 font-black py-3 transition-colors"
                    >
                      {actionLoading ? "Processing..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => handleStatusChange("cancelled")}
                      disabled={actionLoading}
                      className="w-full rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-60 text-white border border-white/10 font-black py-3 transition-colors"
                    >
                      {actionLoading ? "Processing..." : "Decline"}
                    </button>
                  </>
                )}

                {(booking.status === "pending" || booking.status === "confirmed") && isUpcoming && (
                  <button
                    onClick={() => handleStatusChange("cancelled")}
                    disabled={actionLoading}
                    className="w-full rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-60 text-red-300 font-black py-3 transition-colors"
                  >
                    {actionLoading ? "Processing..." : "Cancel Booking"}
                  </button>
                )}

                <button
                  onClick={() => router.push(`/messages?userId=${other._id}`)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-black py-3 transition-colors"
                >
                  Send Message
                </button>

                {isClient && booking.status === "completed" && (
                  <Link
                    href={`/reviews/new?bookingId=${booking._id}`}
                    className="block text-center w-full rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black py-3 transition-colors"
                  >
                    Leave Review
                  </Link>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#120A20]/80 p-6 shadow-2xl">
              <h2 className="text-xl font-black mb-5">Timeline</h2>
              <div className="space-y-5">
                <div className="flex gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-violet-400 mt-2 shrink-0 shadow-[0_0_12px_rgba(167,139,250,0.8)]" />
                  <div>
                    <p className="text-sm font-bold">Booking Created</p>
                    <p className="text-xs text-gray-500">{formatDateTime(booking.createdAt)}</p>
                  </div>
                </div>
                {booking.status === "confirmed" && (
                  <div className="flex gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-2 shrink-0 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                    <div>
                      <p className="text-sm font-bold">Booking Confirmed</p>
                      <p className="text-xs text-gray-500">{formatDateTime(booking.updatedAt)}</p>
                    </div>
                  </div>
                )}
                {booking.status === "completed" && (
                  <div className="flex gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400 mt-2 shrink-0 shadow-[0_0_12px_rgba(96,165,250,0.8)]" />
                    <div>
                      <p className="text-sm font-bold">Event Completed</p>
                      <p className="text-xs text-gray-500">{formatDateTime(booking.updatedAt)}</p>
                    </div>
                  </div>
                )}
                {booking.status === "cancelled" && (
                  <div className="flex gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400 mt-2 shrink-0 shadow-[0_0_12px_rgba(248,113,113,0.8)]" />
                    <div>
                      <p className="text-sm font-bold">Booking Cancelled</p>
                      <p className="text-xs text-gray-500">{formatDateTime(booking.updatedAt)}</p>
                    </div>
                  </div>
                )}
                {isUpcoming && booking.status !== "cancelled" && (
                  <div className="flex gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-300 mt-2 shrink-0 shadow-[0_0_12px_rgba(253,224,71,0.8)]" />
                    <div>
                      <p className="text-sm font-bold">Event Scheduled</p>
                      <p className="text-xs text-gray-500">{formatDate(booking.eventDate)}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
