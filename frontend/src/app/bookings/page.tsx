"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { API_BASE_URL } from "@/lib/api";
import { 
  Calendar, Clock, DollarSign, MapPin, Search as SearchIcon, 
  Music, ChevronDown, CreditCard, ArrowRight, AlertCircle, 
  CheckCircle2, XCircle, Star, ChevronLeft, ChevronRight, MessageSquare
} from "lucide-react";

interface Booking {
  _id: string;
  clientId: {
    _id: string;
    name: string;
    email: string;
    profileImage: string;
  };
  artistId: {
    _id: string;
    name: string;
    email: string;
    profileImage: string;
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

const statusThemes: Record<string, { bg: string; text: string; icon: any /* eslint-disable-line @typescript-eslint/no-explicit-any */; border: string }> = {
  pending: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", icon: Clock },
  confirmed: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", icon: CheckCircle2 },
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", icon: Star },
  cancelled: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", icon: XCircle },
  disputed: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", icon: AlertCircle },
};

export default function BookingsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
  });
  const [sortBy, setSortBy] = useState("-eventDate");

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams();

        if (statusFilter !== "all") {
          params.append("status", statusFilter);
        }
        params.append("page", page.toString());
        params.append("limit", "10");
        params.append("sort", sortBy);

        const response = await fetch(
          `${API_BASE_URL}/api/bookings/my?${params}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          setBookings(data.bookings);
          setTotalPages(data.pagination.pages);
        }
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, statusFilter, page, sortBy]);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/bookings/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, [user, bookings]);

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/bookings/${bookingId}/status`,
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
        setBookings(
          bookings.map((b) => (b._id === bookingId ? data.booking : b))
        );
      } else {
        alert("Failed to update booking: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("Failed to update booking");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    return `${hours}:${minutes}`;
  };

  const isUpcoming = (booking: Booking) => {
    return new Date(booking.eventDate) > new Date();
  };

  const isArtist = user?.role === "artist";
  const isClient = user?.role === "client";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0A0512] text-white selection:bg-violet-500/30 selection:text-violet-200">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[150px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-fuchsia-600/10 blur-[150px]" />
        </div>

        {/* Header/Navbar */}
        <nav className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-gray-950/60">
          <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href={isClient ? "/home/client" : isArtist ? "/home/artist" : "/"} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center font-black shadow-[0_0_20px_-5px_rgba(139,92,246,0.6)] text-white group-hover:scale-105 transition-transform">
                <Music className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight hidden lg:block">
                BookYour<span className="text-violet-400">Artist</span>
              </span>
            </Link>
            
            <div className="flex gap-6 items-center">
              {isClient && (
                <>
                  <Link href="/search" className="text-gray-400 hover:text-white text-sm font-semibold transition-colors">
                    Browse Artists
                  </Link>
                  <Link href="/home/client" className="text-gray-400 hover:text-white text-sm font-semibold transition-colors">
                    Dashboard
                  </Link>
                </>
              )}
              {isArtist && (
                <>
                  <Link href="/home/artist" className="text-gray-400 hover:text-white text-sm font-semibold transition-colors">
                    Dashboard
                  </Link>
                  <Link href="/artist/profile" className="text-gray-400 hover:text-white text-sm font-semibold transition-colors">
                    Profile
                  </Link>
                </>
              )}
              <Link href="/bookings" className="text-violet-400 font-semibold bg-violet-500/10 px-4 py-2 rounded-full border border-violet-500/20">
                My Bookings
              </Link>
            </div>
          </div>
        </nav>

        <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          {/* Page Title */}
          <div className="mb-10 text-center sm:text-left">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
              My Bookings
            </h1>
            <p className="text-gray-400 text-lg">
              Manage your event bookings and confirmations
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            <div className="bg-[#120A20] rounded-2xl border border-white/5 p-5 relative overflow-hidden group hover:border-yellow-500/30 hover:bg-white/[0.04] transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-[30px] group-hover:bg-yellow-500/20 transition-all" />
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <Clock className="w-5 h-5 text-yellow-500" />
                <h3 className="text-gray-400 text-sm font-medium">Pending</h3>
              </div>
              <p className="text-3xl font-black text-white relative z-10">{stats.pending}</p>
            </div>
            
            <div className="bg-[#120A20] rounded-2xl border border-white/5 p-5 relative overflow-hidden group hover:border-blue-500/30 hover:bg-white/[0.04] transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-[30px] group-hover:bg-blue-500/20 transition-all" />
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                <h3 className="text-gray-400 text-sm font-medium">Confirmed</h3>
              </div>
              <p className="text-3xl font-black text-white relative z-10">{stats.confirmed}</p>
            </div>

            <div className="bg-[#120A20] rounded-2xl border border-white/5 p-5 relative overflow-hidden group hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-[30px] group-hover:bg-emerald-500/20 transition-all" />
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <Star className="w-5 h-5 text-emerald-500" />
                <h3 className="text-gray-400 text-sm font-medium">Completed</h3>
              </div>
              <p className="text-3xl font-black text-white relative z-10">{stats.completed}</p>
            </div>

            <div className="bg-[#120A20] rounded-2xl border border-white/5 p-5 relative overflow-hidden group hover:border-red-500/30 hover:bg-white/[0.04] transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-[30px] group-hover:bg-red-500/20 transition-all" />
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <XCircle className="w-5 h-5 text-red-500" />
                <h3 className="text-gray-400 text-sm font-medium">Cancelled</h3>
              </div>
              <p className="text-3xl font-black text-white relative z-10">{stats.cancelled}</p>
            </div>

            <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 rounded-2xl border border-violet-500/30 p-5 relative overflow-hidden shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)]">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <DollarSign className="w-5 h-5 text-violet-300" />
                <h3 className="text-violet-200 text-sm font-medium">{isClient ? "Total Spent" : "Total Earned"}</h3>
              </div>
              <p className="text-3xl font-black text-white relative z-10">${Math.round(stats.totalRevenue)}</p>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="bg-[#120A20] border border-white/5 rounded-2xl p-6 mb-8 flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-400 mb-2">Filter by Status</label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="w-full appearance-none bg-[#1A0F2E] border border-white/10 text-white rounded-xl pl-4 pr-10 py-3 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="all">All Bookings</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="disputed">Disputed</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-400 mb-2">Sort By</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="w-full appearance-none bg-[#1A0F2E] border border-white/10 text-white rounded-xl pl-4 pr-10 py-3 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="-eventDate">Newest First</option>
                  <option value="eventDate">Oldest First</option>
                  <option value="-totalPrice">Highest Price</option>
                  <option value="totalPrice">Lowest Price</option>
                  <option value="-createdAt">Recently Created</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Bookings List */}
          {loading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-[#120A20] border border-white/5 rounded-3xl h-64 animate-pulse flex overflow-hidden">
                  <div className="w-1/3 bg-white/5" />
                  <div className="w-2/3 p-8 space-y-4">
                    <div className="h-6 w-1/2 bg-white/10 rounded-full" />
                    <div className="h-4 w-1/4 bg-white/10 rounded-full" />
                    <div className="grid grid-cols-3 gap-6 pt-6">
                      <div className="h-16 bg-white/5 rounded-xl" />
                      <div className="h-16 bg-white/5 rounded-xl" />
                      <div className="h-16 bg-white/5 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : bookings.length > 0 ? (
            <>
              <div className="space-y-6 mb-12">
                {bookings.map((booking) => {
                  const isPending = booking.status === "pending";
                  const isConfirmed = booking.status === "confirmed";
                  const isUpcomingEvent = isUpcoming(booking);
                  const other = isClient ? booking.artistId : booking.clientId;
                  const StatusIcon = statusThemes[booking.status]?.icon || Clock;
                  const theme = statusThemes[booking.status] || statusThemes.pending;

                  return (
                    <div key={booking._id} className="bg-[#120A20] border border-white/5 rounded-2xl md:rounded-3xl overflow-hidden hover:border-white/10 transition-all hover:shadow-[0_0_30px_-10px_rgba(139,92,246,0.15)] group">
                      <div className="flex flex-col md:flex-row">
                        {/* Image Section */}
                        <div className="w-full md:w-64 h-64 md:h-auto bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 relative overflow-hidden shrink-0">
                          {other?.profileImage ? (
                            <Image
                              src={other.profileImage}
                              alt={other.name}
                              fill
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-[#1A0F2E]">
                              <Music className="w-12 h-12 text-violet-400 mb-2 opacity-50" />
                              <span className="text-white text-3xl font-black opacity-80">{other?.name ? other.name.charAt(0) : "?"}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#120A20] via-transparent to-transparent opacity-80" />
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                          <div>
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                              <div>
                                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">
                                  {isClient ? "Booking with" : "Booking from"}
                                </p>
                                <h3 className="text-2xl font-bold text-white leading-tight">
                                  {other?.name || "Unknown User"}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1 font-mono">
                                  ID: {booking._id.substring(0, 8)}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${theme.bg} ${theme.text} ${theme.border}`}>
                                  <StatusIcon className="w-3.5 h-3.5" />
                                  {booking.status.toUpperCase()}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                  {booking.paymentStatus === "paid" ? (
                                    <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Paid</>
                                  ) : (
                                    <><Clock className="w-3.5 h-3.5 text-yellow-500" /> Payment Pending</>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white/[0.02] p-5 rounded-2xl border border-white/5 mb-6">
                              <div>
                                <div className="flex items-center gap-2 text-gray-400 mb-1 font-medium text-xs uppercase tracking-wider">
                                  <Calendar className="w-4 h-4 text-violet-400" /> Date & Time
                                </div>
                                <p className="text-white font-bold">{formatDate(booking.eventDate)}</p>
                                <p className="text-sm text-gray-400">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
                              </div>

                              <div>
                                <div className="flex items-center gap-2 text-gray-400 mb-1 font-medium text-xs uppercase tracking-wider">
                                  <MapPin className="w-4 h-4 text-fuchsia-400" /> Location
                                </div>
                                <p className="text-white font-bold truncate" title={booking.eventType}>{booking.eventType || "General Event"}</p>
                                <p className="text-sm text-gray-400 truncate" title={booking.eventLocation?.venue}>
                                  {booking.eventLocation?.venue ? `@ ${booking.eventLocation.venue}` : "Venue TBD"}
                                </p>
                              </div>

                              <div>
                                <div className="flex items-center gap-2 text-gray-400 mb-1 font-medium text-xs uppercase tracking-wider">
                                  <CreditCard className="w-4 h-4 text-blue-400" /> Pricing
                                </div>
                                <p className="text-white font-bold text-xl">${booking.totalPrice}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {isClient ? "Total Amount" : `Your cut: $${booking.artistPrice}`}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
                            <div className="flex gap-2">
                              {isClient && isPending && isUpcomingEvent && (
                                <button
                                  onClick={() => handleStatusChange(booking._id, "cancelled")}
                                  className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20 rounded-xl text-sm font-bold transition-colors"
                                >
                                  Cancel Booking
                                </button>
                              )}

                              {isClient && isConfirmed && isUpcomingEvent && (
                                <button
                                  onClick={() => handleStatusChange(booking._id, "cancelled")}
                                  className="px-4 py-2 bg-transparent text-red-500 hover:bg-red-500/10 border border-red-500/30 rounded-xl text-sm font-bold transition-colors"
                                >
                                  Cancel Booking
                                </button>
                              )}

                              {isClient && booking.status === "completed" && (
                                <Link
                                  href={`/reviews/new?bookingId=${booking._id}`}
                                  className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors"
                                >
                                  <Star className="w-4 h-4" /> Leave Review
                                </Link>
                              )}

                              {isArtist && isPending && isUpcomingEvent && (
                                <>
                                  <button
                                    onClick={() => handleStatusChange(booking._id, "confirmed")}
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-900 border border-emerald-600 rounded-xl text-sm font-bold transition-colors"
                                  >
                                    Accept Request
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(booking._id, "cancelled")}
                                    className="px-4 py-2 bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-colors"
                                  >
                                    Decline
                                  </button>
                                </>
                              )}
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto">
                              <button
                                onClick={() => router.push(`/messages?userId=${other?._id}`)}
                                className="flex-1 sm:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                              >
                                <MessageSquare className="w-4 h-4" /> Message
                              </button>
                              <button
                                onClick={() => router.push(`/bookings/${booking._id}`)}
                                className="flex-1 sm:flex-none px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                              >
                                Details <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12 pb-8">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 border border-white/10 rounded-xl hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent text-gray-400 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = page - 2 + i;
                    if (pageNum < 1 || pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center transition-colors ${
                          page === pageNum
                            ? "bg-violet-600 text-white shadow-[0_0_15px_-3px_rgba(139,92,246,0.4)]"
                            : "border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-white/10 rounded-xl hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent text-gray-400 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Premium Empty State */
            <div className="bg-[#120A20] border border-white/5 rounded-3xl p-12 lg:p-24 text-center mt-12 relative overflow-hidden group">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-violet-600/20 transition-all duration-700" />
              
              <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-8 relative z-10 shadow-inner">
                <Calendar className="w-10 h-10 text-gray-400" />
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4 relative z-10">
                {statusFilter === "all" ? "No bookings yet" : `No ${statusFilter} bookings`}
              </h2>
              
              <p className="text-gray-400 text-lg max-w-lg mx-auto mb-8 relative z-10">
                {statusFilter === "all" 
                  ? "It looks like you haven't made any artist bookings yet. Start exploring our talented roster to plan your next event."
                  : `You don't have any bookings matching the "${statusFilter}" status. Try changing your filters.`}
              </p>
              
              {isClient && statusFilter === "all" && (
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 shadow-[0_0_20px_-5px_rgba(139,92,246,0.4)] relative z-10"
                >
                  <SearchIcon className="w-5 h-5" /> Browse Artists
                </Link>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
