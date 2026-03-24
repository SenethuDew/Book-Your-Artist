"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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

const statusColors: Record<string, { bg: string; text: string; icon: string }> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: "⏳" },
  confirmed: { bg: "bg-blue-100", text: "text-blue-800", icon: "✓" },
  completed: { bg: "bg-green-100", text: "text-green-800", icon: "✓✓" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-800", icon: "✗" },
  disputed: { bg: "bg-red-100", text: "text-red-800", icon: "⚠" },
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
          `http://localhost:5000/api/bookings/my?${params}`,
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
        const response = await fetch("http://localhost:5000/api/bookings/stats", {
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
        `http://localhost:5000/api/bookings/${bookingId}/status`,
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
        // Refresh bookings
        setBookings(
          bookings.map((b) => (b._id === bookingId ? data.booking : b))
        );
        alert(`Booking ${newStatus} successfully!`);
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-purple-600">
              Book-Your-Artist
            </Link>
            <nav className="flex gap-6">
              {isClient && (
                <>
                  <Link
                    href="/search"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Browse Artists
                  </Link>
                  <Link
                    href="/home/client"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Dashboard
                  </Link>
                </>
              )}
              {isArtist && (
                <>
                  <Link
                    href="/home/artist"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/artist/profile"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Profile
                  </Link>
                </>
              )}
              <Link
                href="/bookings"
                className="text-purple-600 font-semibold hover:text-purple-700"
              >
                My Bookings
              </Link>
            </nav>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              My Bookings
            </h1>
            <p className="text-gray-600">
              Manage your event bookings and confirmations
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-600 text-sm mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-600 text-sm mb-1">Confirmed</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.confirmed}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-600 text-sm mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.completed}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-600 text-sm mb-1">Cancelled</p>
              <p className="text-3xl font-bold text-gray-600">
                {stats.cancelled}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-600 text-sm mb-1">
                {isClient ? "Total Spent" : "Total Earned"}
              </p>
              <p className="text-3xl font-bold text-green-600">
                ${Math.round(stats.totalRevenue)}
              </p>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Bookings</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="disputed">Disputed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="-eventDate">Newest First</option>
                  <option value="eventDate">Oldest First</option>
                  <option value="-totalPrice">Highest Price</option>
                  <option value="totalPrice">Lowest Price</option>
                  <option value="-createdAt">Recently Created</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bookings List */}
          {loading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-200 rounded-lg h-48 animate-pulse"
                />
              ))}
            </div>
          ) : bookings.length > 0 ? (
            <>
              <div className="space-y-4 mb-8">
                {bookings.map((booking) => {
                  const isPending = booking.status === "pending";
                  const isConfirmed = booking.status === "confirmed";
                  const isUpcomingEvent = isUpcoming(booking);
                  const other = isClient ? booking.artistId : booking.clientId;
                  const colors = statusColors[booking.status];

                  return (
                    <div
                      key={booking._id}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
                    >
                      <div className="flex flex-col md:flex-row">
                        {/* Image */}
                        <div className="w-full md:w-48 h-48 bg-linear-to-br from-purple-400 to-purple-600 flex items-center justify-center md:rounded-none">
                          {other.profileImage ? (
                            <Image
                              src={other.profileImage}
                              alt={other.name}
                              fill
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-6xl font-bold">
                              {other.name.charAt(0)}
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6 flex flex-col justify-between">
                          <div>
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                  {isClient ? "Booking with " : "Booking from "}
                                  {other.name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {booking._id.substring(0, 8)}...
                                </p>
                              </div>
                              <div className="text-right">
                                <div
                                  className={`inline-block ${colors.bg} ${colors.text} px-3 py-1 rounded-full text-sm font-bold`}
                                >
                                  {colors.icon} {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                  {booking.paymentStatus === "paid" ? "✓ Paid" : "Payment Pending"}
                                </p>
                              </div>
                            </div>

                            {/* Event Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-gray-600 mb-1">
                                  DATE & TIME
                                </p>
                                <p className="font-semibold text-gray-900">
                                  {formatDate(booking.eventDate)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {formatTime(booking.startTime)} -{" "}
                                  {formatTime(booking.endTime)}
                                </p>
                                <p className="text-xs text-gray-600">
                                  ({booking.durationHours}h)
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-gray-600 mb-1">
                                  EVENT TYPE
                                </p>
                                <p className="font-semibold text-gray-900">
                                  {booking.eventType || "General Event"}
                                </p>
                                {booking.eventLocation?.venue && (
                                  <p className="text-sm text-gray-600">
                                    @ {booking.eventLocation.venue}
                                  </p>
                                )}
                              </div>

                              <div>
                                <p className="text-xs text-gray-600 mb-1">PRICE</p>
                                <p className="text-2xl font-bold text-purple-600">
                                  ${booking.totalPrice}
                                </p>
                                {isClient && (
                                  <p className="text-xs text-gray-600">
                                    You pay
                                  </p>
                                )}
                                {isArtist && (
                                  <p className="text-xs text-gray-600">
                                    You get ${booking.artistPrice}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Event Details Text */}
                            {booking.eventDetails && (
                              <div className="mb-4 p-3 bg-gray-50 rounded">
                                <p className="text-sm text-gray-700">
                                  <strong>Details:</strong> {booking.eventDetails}
                                </p>
                              </div>
                            )}
                            {booking.eventLocation?.address && (
                              <div className="text-sm text-gray-600">
                                <p>
                                  <strong>Location:</strong>{" "}
                                  {booking.eventLocation.address}
                                  {booking.eventLocation.city &&
                                    `, ${booking.eventLocation.city}`}
                                  {booking.eventLocation.country &&
                                    `, ${booking.eventLocation.country}`}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-6 pt-4 border-t flex flex-wrap gap-2">
                            {isClient && isPending && isUpcomingEvent && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusChange(booking._id, "cancelled")
                                  }
                                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold transition"
                                >
                                  Cancel Booking
                                </button>
                              </>
                            )}

                            {isClient && isConfirmed && isUpcomingEvent && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusChange(booking._id, "cancelled")
                                  }
                                  className="border border-red-500 text-red-500 hover:bg-red-50 px-4 py-2 rounded font-semibold transition"
                                >
                                  Cancel Booking
                                </button>
                              </>
                            )}

                            {isClient && booking.status === "completed" && (
                              <Link
                                href={`/reviews/new?bookingId=${booking._id}`}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-semibold transition"
                              >
                                Leave Review
                              </Link>
                            )}

                            {isArtist && isPending && isUpcomingEvent && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusChange(booking._id, "confirmed")
                                  }
                                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold transition"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(booking._id, "cancelled")
                                  }
                                  className="border border-gray-300 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded font-semibold transition"
                                >
                                  Decline
                                </button>
                              </>
                            )}

                            {/* View Details / Contact */}
                            <button
                              onClick={() => router.push(`/bookings/${booking._id}`)}
                              className="border border-gray-300 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded font-semibold transition"
                            >
                              View Details
                            </button>

                            <button
                              onClick={() =>
                                router.push(
                                  `/messages?userId=${other._id}`
                                )
                              }
                              className="border border-purple-300 hover:bg-purple-50 text-purple-600 px-4 py-2 rounded font-semibold transition"
                            >
                              Message
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = page - 2 + i;
                    if (pageNum < 1 || pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-4 py-2 rounded ${
                          page === pageNum
                            ? "bg-purple-600 text-white"
                            : "border hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 text-lg mb-4">
                {statusFilter === "all"
                  ? "You don't have any bookings yet."
                  : `You don't have any ${statusFilter} bookings.`}
              </p>
              {isClient && (
                <Link
                  href="/search"
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  Browse Artists
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
