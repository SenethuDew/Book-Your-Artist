"use client";

import { useAuth } from "@/contexts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";

function AdminDashboardContent() {
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
          <h1 className="text-2xl font-bold">Admin Panel</h1>
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
          <h2 className="text-2xl font-bold mb-4">Welcome Admin, {user?.name}!</h2>
          <p className="text-gray-400">Email: {user?.email}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-blue-400">0</p>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2">Pending Artists</h3>
            <p className="text-3xl font-bold text-yellow-400">0</p>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2">Total Bookings</h3>
            <p className="text-3xl font-bold text-green-400">0</p>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold mb-8">Artist Approval Requests</h2>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="text-center text-gray-400 py-12">
            <p>No pending artist approvals.</p>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold mt-12 mb-8">Recent Activity</h2>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="text-center text-gray-400 py-12">
            <p>No recent activity.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
