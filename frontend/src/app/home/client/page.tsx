"use client";

import Link from "next/link";
import { useAuth } from "@/contexts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function ClientHomeContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    completed: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
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

    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="border-b border-gray-700 bg-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Book Your Artist</h1>
          <div className="space-x-4">
            <Link href="/search" className="text-blue-400 hover:underline">Search Artists</Link>
            <Link href="/bookings" className="text-gray-400 hover:text-white">My Bookings</Link>
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
        <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-lg p-12 text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Welcome, {user?.name}!</h2>
          <p className="text-lg mb-6">Find and book your favorite musicians</p>
          <Link href="/search" className="inline-block bg-white text-blue-600 font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition">
            Start Browsing Musicians
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Confirmed Bookings</p>
            <p className="text-4xl font-bold text-blue-400">{stats.confirmed}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Pending Requests</p>
            <p className="text-4xl font-bold text-yellow-400">{stats.pending}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Total Spent</p>
            <p className="text-4xl font-bold text-green-400">${stats.totalRevenue}</p>
          </div>
        </div>

        <h3 className="text-2xl font-bold mb-6">Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/search" className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-6 transition">
            <p className="font-bold text-lg">🔍 Search Musicians</p>
            <p className="text-gray-400 text-sm mt-2">Browse and filter musicians by genre, price, and rating</p>
          </Link>
          <Link href="/bookings" className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-6 transition">
            <p className="font-bold text-lg">📅 My Bookings</p>
            <p className="text-gray-400 text-sm mt-2">View and manage your booking requests and history</p>
          </Link>
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
