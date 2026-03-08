"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";

function ArtistDashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (user?.status !== "approved") {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Waiting for Approval</h1>
          <p className="text-gray-400 mb-6">
            Your artist account is pending admin approval. You'll be able to receive bookings once approved.
          </p>
          <button 
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded"
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
          <h1 className="text-2xl font-bold">Artist Dashboard</h1>
          <button 
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300"
          >
            Logout
          </button>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Welcome, {user?.name}!</h2>
          <p className="text-gray-400">Email: {user?.email}</p>
          <p className="text-gray-400">Status: <span className="capitalize font-bold text-green-400">{user?.status}</span></p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2">Pending Requests</h3>
            <p className="text-3xl font-bold text-yellow-400">0</p>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2">Approved Bookings</h3>
            <p className="text-3xl font-bold text-green-400">0</p>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold mb-8">Booking Requests</h2>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="text-center text-gray-400 py-12">
            <p>No pending requests.</p>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold mt-12 mb-8">Manage Availability</h2>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 mb-4">Coming soon: Calendar and time slot management</p>
          <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded disabled opacity-50">
            Edit Availability (Disabled)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ArtistDashboard() {
  return (
    <ProtectedRoute requiredRole="artist">
      <ArtistDashboardContent />
    </ProtectedRoute>
  );
}
