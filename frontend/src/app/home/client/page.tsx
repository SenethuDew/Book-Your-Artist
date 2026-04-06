"use client";

import Link from "next/link";
import { useAuth } from "@/contexts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

interface Booking {
  _id: string;
  eventDate: string;
  eventType: string;
  status: string;
  totalPrice: number;
  artistId?: { name: string; email: string };
}

interface Stats {
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
}

// Mock recommended artists data
const RECOMMENDED_ARTISTS = [
  {
    _id: "1",
    name: "Sarah Johnson",
    genre: "Jazz Piano",
    hourlyRate: 150,
    rating: 4.9,
    reviews: 48,
  },
  {
    _id: "2",
    name: "Marcus Smith",
    genre: "Soul Singer",
    hourlyRate: 120,
    rating: 4.8,
    reviews: 35,
  },
  {
    _id: "3",
    name: "Elena Rodriguez",
    genre: "Classical Violin",
    hourlyRate: 180,
    rating: 5.0,
    reviews: 52,
  },
];

const BOOKING_TIPS = [
  {
    icon: "📅",
    title: "Book in Advance",
    description: "Book your event at least 2 weeks ahead for better availability",
  },
  {
    icon: "🎵",
    title: "Check Artist Ratings",
    description: "Read reviews from other clients to find the perfect match",
  },
  {
    icon: "💰",
    title: "Compare Prices",
    description: "Filter by hourly rate to find artists within your budget",
  },
  {
    icon: "🎯",
    title: "Describe Your Event",
    description: "Provide event details to help artists prepare better",
  },
];

function ClientHomeContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [errorStats, setErrorStats] = useState("");
  const [errorBookings, setErrorBookings] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Fetch stats
      setLoadingStats(true);
      try {
        const statsResponse = await fetch(
          `${API_BASE_URL}/api/bookings/stats`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }
      } catch (error) {
        setErrorStats("Failed to load statistics");
        console.error("Stats error:", error);
      } finally {
        setLoadingStats(false);
      }

      // Fetch recent bookings
      setLoadingBookings(true);
      try {
        const bookingsResponse = await fetch(
          `${API_BASE_URL}/api/bookings/my?limit=3&sort=-eventDate`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const bookingsData = await bookingsResponse.json();
        if (bookingsData.success) {
          setRecentBookings(bookingsData.bookings || []);
        }
      } catch (error) {
        setErrorBookings("Failed to load bookings");
        console.error("Bookings error:", error);
      } finally {
        setLoadingBookings(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-400 bg-green-400/10";
      case "pending":
        return "text-yellow-400 bg-yellow-400/10";
      case "completed":
        return "text-blue-400 bg-blue-400/10";
      case "cancelled":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "pending":
        return "Pending";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-800/50 bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                🎵
              </div>
              <h1 className="text-xl font-bold group-hover:text-blue-400 transition">
                Book Your Artist
              </h1>
            </Link>
            <div className="hidden sm:flex items-center gap-6">
              <Link
                href="/search"
                className="text-gray-400 hover:text-blue-400 transition font-medium"
              >
                Search Musicians
              </Link>
              <Link
                href="/bookings"
                className="text-gray-400 hover:text-blue-400 transition font-medium"
              >
                My Bookings
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 transition font-medium"
              >
                Logout
              </button>
            </div>
            <div className="sm:hidden flex gap-3">
              <Link href="/search" className="text-blue-400 text-sm font-medium">
                Search
              </Link>
              <button
                onClick={handleLogout}
                className="text-red-400 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="relative mb-12 sm:mb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 blur-3xl -z-10" />
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 rounded-2xl overflow-hidden shadow-2xl">
            {/* Top accent line */}
            <div className="h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400" />

            <div className="px-6 sm:px-8 lg:px-12 py-10 sm:py-14 lg:py-16">
              <div className="max-w-2xl">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 tracking-tight">
                  Welcome back, {user?.name?.split(" ")[0]}! 👋
                </h2>
                <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8">
                  Discover talented musicians and artists for your next event. Browse our curated collection, compare rates, and book your perfect performer today.
                </p>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <span>Explore Musicians</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-12 sm:mb-16">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl sm:text-2xl font-bold">Your Activity</h3>
            <div className="h-1 flex-grow bg-gradient-to-r from-blue-500/50 to-transparent rounded" />
          </div>

          {errorStats && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 mb-6 text-red-200 text-sm">
              {errorStats}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Confirmed Bookings */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition" />
              <div className="relative bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-green-600/50 transition-all duration-300 backdrop-blur">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Confirmed Bookings</p>
                    <p className="text-3xl sm:text-4xl font-bold text-green-400 mt-2">
                      {loadingStats ? "..." : stats.confirmed}
                    </p>
                  </div>
                  <div className="p-3 bg-green-600/20 rounded-lg text-green-400 text-xl">
                    ✓
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
              </div>
            </div>

            {/* Pending Requests */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition" />
              <div className="relative bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-yellow-600/50 transition-all duration-300 backdrop-blur">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Pending Requests</p>
                    <p className="text-3xl sm:text-4xl font-bold text-yellow-400 mt-2">
                      {loadingStats ? "..." : stats.pending}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-600/20 rounded-lg text-yellow-400 text-xl">
                    ⏱
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" />
              </div>
            </div>

            {/* Completed Events */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition" />
              <div className="relative bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-blue-600/50 transition-all duration-300 backdrop-blur">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Completed Events</p>
                    <p className="text-3xl sm:text-4xl font-bold text-blue-400 mt-2">
                      {loadingStats ? "..." : stats.completed}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-600/20 rounded-lg text-blue-400 text-xl">
                    🎉
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
              </div>
            </div>

            {/* Total Spent */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition" />
              <div className="relative bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-purple-600/50 transition-all duration-300 backdrop-blur">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Total Spent</p>
                    <p className="text-3xl sm:text-4xl font-bold text-purple-400 mt-2">
                      {loadingStats ? "..." : `$${stats.totalRevenue.toFixed(2)}`}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-600/20 rounded-lg text-purple-400 text-xl">
                    💰
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="mb-12 sm:mb-16">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl sm:text-2xl font-bold">Quick Actions</h3>
            <div className="h-1 flex-grow bg-gradient-to-r from-blue-500/50 to-transparent rounded" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Search Musicians Card */}
            <Link
              href="/search"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600/10 to-blue-600/5 border border-blue-600/30 hover:border-blue-500 p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-blue-500/0 group-hover:from-blue-600/10 group-hover:to-blue-500/10 transition" />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-3xl mb-3">🔍</div>
                  <h4 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-blue-300 transition">
                    Search Musicians
                  </h4>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Browse and filter by genre, price, rating, and availability
                  </p>
                </div>
                <div className="text-2xl group-hover:translate-x-1 transition">→</div>
              </div>
            </Link>

            {/* My Bookings Card */}
            <Link
              href="/bookings"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-600/10 to-purple-600/5 border border-purple-600/30 hover:border-purple-500 p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-purple-600/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-purple-500/0 group-hover:from-purple-600/10 group-hover:to-purple-500/10 transition" />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-3xl mb-3">📅</div>
                  <h4 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-purple-300 transition">
                    My Bookings
                  </h4>
                  <p className="text-gray-400 text-sm sm:text-base">
                    View and manage all your booking requests and history
                  </p>
                </div>
                <div className="text-2xl group-hover:translate-x-1 transition">→</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Bookings Section */}
        <div className="mb-12 sm:mb-16">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl sm:text-2xl font-bold">Recent Bookings</h3>
            <div className="h-1 flex-grow bg-gradient-to-r from-blue-500/50 to-transparent rounded" />
          </div>

          {errorBookings && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 mb-6 text-red-200 text-sm">
              {errorBookings}
            </div>
          )}

          {loadingBookings ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 sm:p-6 animate-pulse"
                >
                  <div className="h-6 bg-gray-700/50 rounded w-1/3 mb-4" />
                  <div className="h-4 bg-gray-700/50 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : recentBookings.length > 0 ? (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <Link
                  key={booking._id}
                  href={`/bookings/${booking._id}`}
                  className="group bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 sm:p-6 hover:bg-gray-800/80 hover:border-gray-600/50 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-base sm:text-lg font-bold group-hover:text-blue-400 transition">
                          {booking.eventType}
                        </h4>
                        <span
                          className={`text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-full ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {getStatusBadge(booking.status)}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        📅 {formatDate(booking.eventDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400 text-lg">
                        ${booking.totalPrice.toFixed(2)}
                      </p>
                      <p className="text-gray-400 text-xs sm:text-sm">
                        {booking.artistId?.name && `With ${booking.artistId.name}`}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-8 sm:p-12 text-center">
              <div className="text-4xl mb-4">📭</div>
              <h4 className="text-lg font-bold mb-2">No bookings yet</h4>
              <p className="text-gray-400 mb-6">
                Start by searching for your favorite musicians
              </p>
              <Link
                href="/search"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-lg transition"
              >
                Search Musicians
              </Link>
            </div>
          )}
        </div>

        {/* Recommended Artists Section */}
        <div className="mb-12 sm:mb-16">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl sm:text-2xl font-bold">Recommended Artists</h3>
            <div className="h-1 flex-grow bg-gradient-to-r from-blue-500/50 to-transparent rounded" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {RECOMMENDED_ARTISTS.map((artist) => (
              <div
                key={artist._id}
                className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl overflow-hidden hover:border-yellow-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-600/10"
              >
                <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 h-24 flex items-end justify-end p-4">
                  <span className="text-3xl">🎵</span>
                </div>
                <div className="p-5 sm:p-6">
                  <h4 className="text-lg font-bold mb-1">{artist.name}</h4>
                  <p className="text-yellow-400 text-sm font-medium mb-3">
                    {artist.genre}
                  </p>

                  <div className="flex items-center justify-between mb-4 py-3 border-y border-gray-700/50">
                    <div>
                      <p className="text-gray-400 text-xs">Hourly Rate</p>
                      <p className="text-lg font-bold text-green-400">
                        ${artist.hourlyRate}/hr
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">Rating</p>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">⭐</span>
                        <p className="text-lg font-bold">
                          {artist.rating}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-400 text-xs mb-4">
                    {artist.reviews} reviews
                  </p>

                  <Link
                    href="/search"
                    className="w-full inline-block text-center bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold py-2.5 rounded-lg transition-all duration-200 group-hover:shadow-lg"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Tips Section */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl sm:text-2xl font-bold">Booking Tips</h3>
            <div className="h-1 flex-grow bg-gradient-to-r from-blue-500/50 to-transparent rounded" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {BOOKING_TIPS.map((tip, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-5 sm:p-6 hover:border-blue-600/50 transition-all duration-300"
              >
                <div className="text-3xl mb-3">{tip.icon}</div>
                <h4 className="text-lg font-bold mb-2">{tip.title}</h4>
                <p className="text-gray-400 text-sm">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientHomePage() {
  return (
    <ProtectedRoute requiredRole="client">
      <ClientHomeContent />
    </ProtectedRoute>
  );
}
