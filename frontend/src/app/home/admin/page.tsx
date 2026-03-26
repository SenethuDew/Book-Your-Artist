"use client";

import Link from "next/link";
import { useAuth } from "@/contexts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";

function AdminHomeContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="border-b border-gray-700 bg-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="space-x-4">
            <Link href="/admin/users" className="text-gray-400 hover:text-white">Users</Link>
            <Link href="/admin/artists" className="text-gray-400 hover:text-white">Artists</Link>
            <Link href="/admin/bookings" className="text-gray-400 hover:text-white">Bookings</Link>
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
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-12 text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Welcome, {user?.name}! 👨‍💼</h2>
          <p className="text-lg">Platform Administration Center</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Total Users</p>
            <p className="text-4xl font-bold text-blue-400">0</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Pending Artists</p>
            <p className="text-4xl font-bold text-yellow-400">0</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Total Bookings</p>
            <p className="text-4xl font-bold text-green-400">0</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Revenue</p>
            <p className="text-4xl font-bold text-emerald-400">$0</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/admin/artists" className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-6 transition">
            <p className="font-bold text-lg">✓ Approve Artists</p>
            <p className="text-gray-400 text-sm mt-2">Review and approve pending artist registrations</p>
          </Link>
          <Link href="/admin/users" className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-6 transition">
            <p className="font-bold text-lg">👥 Manage Users</p>
            <p className="text-gray-400 text-sm mt-2">View all users and manage account status</p>
          </Link>
          <Link href="/admin/bookings" className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-6 transition">
            <p className="font-bold text-lg">📅 Monitor Bookings</p>
            <p className="text-gray-400 text-sm mt-2">Track all bookings and resolve disputes</p>
          </Link>
          <Link href="/admin/analytics" className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-6 transition">
            <p className="font-bold text-lg">📊 Analytics</p>
            <p className="text-gray-400 text-sm mt-2">View platform statistics and insights</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminHomePage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminHomeContent />
    </ProtectedRoute>
  );
}
