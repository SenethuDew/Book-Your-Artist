"use client";

import Link from "next/link";
import { useAuth } from "@/contexts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

function ArtistHomeContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    completedBookings: 0,
    totalEarnings: 0,
    averageRating: 0,
    upcomingBookings: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/artists/me/stats`, {
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
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">⏳</p>
          <h1 className="text-3xl font-bold mb-4">Account Pending Approval</h1>
          <p className="text-gray-400 mb-8 max-w-md">
            Thank you for registering as a musician! Your account is currently pending admin approval. 
            You&apos;ll receive an email notification once your account is approved.
          </p>
          <button 
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded font-bold"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="border-b border-gray-700 bg-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Book Your Artist</h1>
          <div className="space-x-4">
            <Link href="/bookings" className="text-gray-400 hover:text-white">My Bookings</Link>
            <Link href="/artist/profile" className="text-gray-400 hover:text-white">My Profile</Link>
            <button 
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-linear-to-r from-green-600 to-green-700 rounded-lg p-12 text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Welcome, {user?.name}! 🎸</h2>
          <p className="text-lg mb-6">Your account is now live and visible to clients</p>
          <Link href="/artist/profile" className="inline-block bg-white text-green-600 font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition">
            Complete Your Profile
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Pending Requests</p>
            <p className="text-4xl font-bold text-yellow-400">{stats.pending}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Confirmed Bookings</p>
            <p className="text-4xl font-bold text-green-400">{stats.confirmed}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Rating</p>
            <p className="text-4xl font-bold text-blue-400">{stats.averageRating || "0.0"}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Total Earnings</p>
            <p className="text-4xl font-bold text-purple-400">${stats.totalEarnings}</p>
          </div>
        </div>

        <h3 className="text-2xl font-bold mb-6">Get Started</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/artist/profile" className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-6 transition">
            <p className="font-bold text-lg">👤 Complete Your Profile</p>
            <p className="text-gray-400 text-sm mt-2">Add genres, rates, bio, and portfolio links</p>
          </Link>
          <Link href="/bookings" className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-6 transition">
            <p className="font-bold text-lg">📌 My Bookings</p>
            <p className="text-gray-400 text-sm mt-2">View and manage booking requests ({stats.pending} pending)</p>
          </Link>
          <Link href="/artist/availability" className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-6 transition">
            <p className="font-bold text-lg">📅 Set Availability</p>
            <p className="text-gray-400 text-sm mt-2">Tell clients when you&apos;re available for bookings</p>
          </Link>
          <Link href="/messages" className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-6 transition">
            <p className="font-bold text-lg">💬 Messages</p>
            <p className="text-gray-400 text-sm mt-2">Chat with clients about their events</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ArtistHomePage() {
  return (
    <ProtectedRoute requiredRole="artist">
      <ArtistHomeContent />
    </ProtectedRoute>
  );
}
