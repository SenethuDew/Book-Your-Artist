"use client";

import Link from "next/link";
import { useAuth } from "@/contexts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

interface ArtistStats {
  pending: number;
  confirmed: number;
  completedBookings: number;
  totalEarnings: number;
  averageRating: number;
  upcomingBookings: number;
}

interface BookingRequest {
  id: string;
  clientName: string;
  date: string;
  status: string;
}

function StatCard({
  label,
  value,
  icon,
  color,
  trend,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: string;
}) {
  return (
    <div className="group relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 overflow-hidden transition-all duration-300 hover:border-gray-600 hover:shadow-lg hover:shadow-gray-900/50">
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:from-gray-700/20 group-hover:to-gray-800/20 transition-all duration-300"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-2">{label}</p>
            <p className={`text-4xl font-bold ${color}`}>{value}</p>
            {trend && <p className="text-xs text-green-400 mt-1">{trend}</p>}
          </div>
          <div className={`text-3xl ${color} opacity-20 group-hover:opacity-30 transition-opacity`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  href,
  icon,
  title,
  description,
  badge,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  badge?: string | number;
}) {
  return (
    <Link href={href}>
      <div className="group relative h-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:border-gray-600 hover:shadow-lg hover:shadow-gray-900/50 hover:-translate-y-1">
        {/* Accent line on hover */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="flex items-start justify-between mb-4">
          <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          {badge !== undefined && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
          {description}
        </p>
        <div className="mt-4 inline-flex items-center text-blue-400 text-xs font-semibold group-hover:translate-x-1 transition-transform">
          View Details →
        </div>
      </div>
    </Link>
  );
}

function RecentBookingRequest({
  clientName,
  date,
  status,
}: {
  clientName: string;
  date: string;
  status: string;
}) {
  const statusConfig = {
    pending: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "Pending" },
    confirmed: { bg: "bg-green-500/20", text: "text-green-400", label: "Confirmed" },
    completed: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Completed" },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:bg-gray-800/70 transition-colors">
      <div className="flex-1">
        <p className="font-semibold text-white text-sm">{clientName}</p>
        <p className="text-xs text-gray-400 mt-1">{date}</p>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
}

function ProfileCompletionBar({ percentage = 60 }: { percentage?: number }) {
  const items = [
    { label: "Basic Info", complete: true },
    { label: "Portfolio", complete: true },
    { label: "Rates", complete: true },
    { label: "Bio", complete: true },
    { label: "Availability", complete: false },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-white">Profile Completion</h4>
        <span className="text-sm font-bold text-blue-400">{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 text-xs"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                item.complete ? "bg-green-400" : "bg-gray-600"
              }`}
            ></div>
            <span className={item.complete ? "text-gray-300" : "text-gray-500"}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AvailabilityStatus() {
  const [isAvailable, setIsAvailable] = useState(true);

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-white">Availability Status</h4>
        <button
          onClick={() => setIsAvailable(!isAvailable)}
          className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
            isAvailable ? "bg-green-500" : "bg-gray-600"
          }`}
        >
          <div
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
              isAvailable ? "translate-x-6" : ""
            }`}
          ></div>
        </button>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-gray-400">
          Status:{" "}
          <span
            className={`font-semibold ${
              isAvailable ? "text-green-400" : "text-gray-400"
            }`}
          >
            {isAvailable ? "Open for Bookings" : "Not Available"}
          </span>
        </p>
        <p className="text-xs text-gray-500">
          {isAvailable
            ? "Clients can see and book you"
            : "Your profile is hidden from search"}
        </p>
      </div>
      <Link href="/artist/availability">
        <button className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
          Manage Schedule
        </button>
      </Link>
    </div>
  );
}

function QuickTips() {
  const tips = [
    {
      icon: "🎯",
      title: "Complete Your Profile",
      description: "Increase visibility when clients search for artists",
    },
    {
      icon: "⭐",
      title: "Showcase Your Best Work",
      description: "Add portfolio links and high-quality samples",
    },
    {
      icon: "💰",
      title: "Set Competitive Rates",
      description: "Research market rates to attract more bookings",
    },
    {
      icon: "📅",
      title: "Stay Available",
      description: "Keep your availability updated for more opportunities",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tips.map((tip, idx) => (
        <div
          key={idx}
          className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-4 hover:border-gray-600 transition-all duration-300"
        >
          <div className="text-2xl mb-2">{tip.icon}</div>
          <h4 className="font-semibold text-white text-sm mb-1">{tip.title}</h4>
          <p className="text-xs text-gray-400">{tip.description}</p>
        </div>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-gray-800 rounded-xl"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-800 rounded-xl"></div>
        ))}
      </div>
    </div>
  );
}

function ArtistHomeContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState<ArtistStats>({
    pending: 0,
    confirmed: 0,
    completedBookings: 0,
    totalEarnings: 0,
    averageRating: 0,
    upcomingBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("authToken");

        // First check if the artist profile actually exists
        const profileRes = await fetch(`${API_BASE_URL}/api/artists/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (profileRes.status === 404) {
          // If no profile is found, redirect them to the setup wizard
          router.push('/artist/setup');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/artists/me/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }

        const data = await response.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("Unable to load your stats. Please try again.");
        // Use default stats on error
        setStats({
          pending: 0,
          confirmed: 0,
          completedBookings: 0,
          totalEarnings: 0,
          averageRating: 0,
          upcomingBookings: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (user?.status !== "active" && user?.status !== "pending") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-6xl mb-6">⏳</p>
          <h1 className="text-4xl font-bold mb-4">Account Pending Approval</h1>
          <p className="text-gray-400 mb-8 max-w-md text-lg">
            Thank you for registering as a musician! Your account is currently pending admin approval.
            You&apos;ll receive an email notification once your account is approved.
          </p>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg font-bold transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
      {/* Enhanced Navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-blue-500 transition-all">
                📊 Artist Hub
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <NavLink href="/bookings" label="My Bookings" active={pathname === "/bookings"} />
              <NavLink
                href="/artist/setup"
                label="Make your profile"
                active={pathname === "/artist/setup"}
              />
              <NavLink
                href="/artist/profile"
                label="My Profile"
                active={pathname === "/artist/profile"}
              />
              <NavLink
                href="/artist/availability"
                label="Availability"
                active={pathname === "/artist/availability"}
              />
              <div className="w-px h-6 bg-gray-700"></div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-600/10 rounded-lg transition-all"
              >
                Logout
              </button>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden flex items-center gap-4">
              <Link
                href="/artist/setup"
                className={`text-sm ${pathname === "/artist/setup" ? "text-blue-400 font-bold" : "text-gray-300 hover:text-white"}`}
              >
                Make Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg text-sm flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* Hero Section */}
        {loading ? (
          <LoadingState />
        ) : (
          <>
            <div className="relative mb-12 overflow-hidden rounded-2xl">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 blur-3xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-purple-600/10"></div>

              <div className="relative bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-md border border-gray-700/50 p-8 md:p-12 text-center">
                <div className="mb-4 text-5xl md:text-6xl">🎭</div>
                <h2 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                  Welcome back, {user?.name}!
                </h2>
                <p className="text-lg text-gray-300 mb-2">
                  Your artist profile is live and discoverable by clients
                </p>
                <p className="text-sm text-gray-400 mb-8">
                  Keep building your reputation and securing more bookings
                </p>
                <Link href="/artist/profile">
                  <button className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold px-8 py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 hover:-translate-y-0.5">
                    <span>✨ Complete Your Profile</span>
                  </button>
                </Link>
              </div>
            </div>

            {/* Key Stats Section */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-3xl font-bold">Your Performance</h2>
                <div className="text-2xl">📈</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  label="Pending Requests"
                  value={stats.pending}
                  icon="📋"
                  color="text-yellow-400"
                  trend={stats.pending > 0 ? "New opportunities!" : "No pending"}
                />
                <StatCard
                  label="Confirmed Bookings"
                  value={stats.confirmed}
                  icon="✅"
                  color="text-green-400"
                  trend={stats.confirmed > 0 ? "Keep it up!" : "Create availability"}
                />
                <StatCard
                  label="Rating"
                  value={stats.averageRating?.toFixed(1) || "0.0"}
                  icon="⭐"
                  color="text-blue-400"
                  trend={stats.averageRating >= 4 ? "Excellent!" : "Room to grow"}
                />
                <StatCard
                  label="Total Earnings"
                  value={`$${stats.totalEarnings}`}
                  icon="💰"
                  color="text-purple-400"
                  trend={stats.totalEarnings > 0 ? "Growth mode" : "First booking coming"}
                />
              </div>
            </div>

            {/* Main Dashboard Cards */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-3xl font-bold">Quick Actions</h2>
                <div className="text-2xl">⚡</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DashboardCard
                  href="/artist/profile"
                  icon="👤"
                  title="Complete Your Profile"
                  description="Add your genres, rates, bio, and showcase your best work"
                  badge="2/5"
                />
                <DashboardCard
                  href="/bookings"
                  icon="📌"
                  title="My Bookings"
                  description="Review and manage all booking requests from clients"
                  badge={stats.pending}
                />
                <DashboardCard
                  href="/artist/availability"
                  icon="📅"
                  title="Set Availability"
                  description="Let clients know when you're ready to perform"
                />
                <DashboardCard
                  href="/messages"
                  icon="💬"
                  title="Messages"
                  description="Chat with clients about events and details"
                />
              </div>
            </div>

            {/* Secondary Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
              {/* Recent Booking Requests */}
              <div className="lg:col-span-2 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span>📬</span> Recent Requests
                  </h3>
                  <Link href="/bookings">
                    <span className="text-sm text-blue-400 hover:text-blue-300 font-semibold">
                      View All
                    </span>
                  </Link>
                </div>

                {stats.pending > 0 ? (
                  <div className="space-y-3">
                    <RecentBookingRequest
                      clientName="Sarah & Co. Events"
                      date="Mar 28, 2026 - 8:00 PM"
                      status="pending"
                    />
                    <RecentBookingRequest
                      clientName="John's Birthday Bash"
                      date="Apr 5, 2026 - 6:30 PM"
                      status="confirmed"
                    />
                    <RecentBookingRequest
                      clientName="Corporate Gala 2026"
                      date="Apr 12, 2026 - 7:00 PM"
                      status="pending"
                    />
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-4xl mb-2">🎵</p>
                    <p className="text-gray-400">No booking requests yet</p>
                    <p className="text-sm text-gray-500">
                      Complete your profile to attract more clients
                    </p>
                  </div>
                )}
              </div>

              {/* Profile Completion & Availability */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6">
                  <ProfileCompletionBar percentage={60} />
                </div>
                <AvailabilityStatus />
              </div>
            </div>

            {/* Quick Tips Section */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-3xl font-bold">Quick Tips for Success</h2>
                <div className="text-2xl">💡</div>
              </div>
              <QuickTips />
            </div>

            {/* Footer CTA */}
            <div className="text-center py-8 border-t border-gray-700/50">
              <p className="text-gray-400 mb-4">Have questions? Need help getting started?</p>
              <button className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                📖 Check Out Our Artist Guide
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// NavLink Component for Navbar
function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link href={href}>
      <span
        className={`text-sm font-semibold transition-all duration-300 relative group ${
          active
            ? "text-blue-400"
            : "text-gray-400 hover:text-white"
        }`}
      >
        {label}
        <span
          className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 ${
            active ? "w-full" : "w-0 group-hover:w-full"
          }`}
        ></span>
      </span>
    </Link>
  );
}

export default function ArtistHomePage() {
  return (
    <ProtectedRoute requiredRole="artist">
      <ArtistHomeContent />
    </ProtectedRoute>
  );
}
