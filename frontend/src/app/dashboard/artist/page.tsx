"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import Link from "next/link";

interface Booking {
  _id: string;
  clientId: {
    _id: string;
    name: string;
    email: string;
  };
  eventDate: string;
  eventType: string;
  status: string;
  totalPrice: number;
}

interface ArtistStats {
  bookings: number;
  totalEarnings: number;
  averageRating: number;
}

function ArtistDashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<ArtistStats>({ bookings: 0, totalEarnings: 0, averageRating: 0 });
  const [requests, setRequests] = useState<Booking[]>([]);
  const [upcomingGigs, setUpcomingGigs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(true);

  useEffect(() => {
    if (user?.status !== "active") return;

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Check if Profile is created
        const profileRes = await fetch(`${API_BASE_URL}/api/artists/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (profileRes.status === 404) {
          setProfileExists(false);
        } else {
          setProfileExists(true);
        }

        // Fetch Artist Stats
        const statsRes = await fetch(`${API_BASE_URL}/api/artists/me/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const statsData = await statsRes.json();
        
        if (statsData.success) {
          setStats(statsData.data || statsData.stats || { bookings: 0, totalEarnings: 0, averageRating: 0 });
        }

        // Fetch My Bookings (Where I am the artist)
        const bookingsRes = await fetch(`${API_BASE_URL}/api/bookings/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const bookingsData = await bookingsRes.json();
        
        if (bookingsData.success) {
          const allBookings: Booking[] = bookingsData.data || bookingsData.bookings || [];
          
          // Pending Requests
          setRequests(allBookings.filter(b => b.status === "pending"));
          
          // Upcoming Gigs (Confirmed or Paid)
          setUpcomingGigs(
            allBookings
              .filter(b => (b.status === "confirmed" || b.status === "paid") && new Date(b.eventDate) > new Date())
              .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
          );
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (user?.status !== "active") {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Waiting for Approval</h1>
          <p className="text-gray-400 mb-6">
            Your artist account is pending admin approval. You&apos;ll be able to receive bookings once approved.
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
          <h1 className="text-2xl font-bold text-purple-400">Artist Portal</h1>
          <button 
            onClick={handleLogout}
            className="text-gray-400 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {user?.name}!</h2>
            <p className="text-gray-400">Here is what is happening with your profile today.</p>
            {!profileExists && !loading && (
              <div className="mt-4 inline-flex items-center space-x-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h4 className="text-yellow-400 font-bold">Incomplete Profile</h4>
                  <p className="text-sm text-yellow-200 mt-1">Clients can&apos;t easily find you without a complete profile.</p>
                </div>
                <Link 
                  href="/artist/profile"
                  className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold text-sm py-2 px-4 rounded transition ml-6 whitespace-nowrap"
                >
                  Complete Profile Now
                </Link>
              </div>
            )}
          </div>
          <div className="flex space-x-3 mt-4 md:mt-0">
            {profileExists && (
              <Link 
                href="/artist/profile"
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition"
              >
                Edit Profile
              </Link>
            )}
            <Link 
              href="/artist/availability"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Manage Availability
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 animate-pulse">Loading dashboard data...</div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-400 mb-2">Pending Requests</h3>
                <p className="text-4xl font-bold text-yellow-400">{requests.length}</p>
              </div>
              
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-400 mb-2">Upcoming Gigs</h3>
                <p className="text-4xl font-bold text-green-400">{upcomingGigs.length}</p>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-400 mb-2">Earnings</h3>
                <p className="text-4xl font-bold text-purple-400">${stats.totalEarnings || 0}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Pending Requests */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Client Requests</h2>
                  <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">{requests.length} New</span>
                </div>
                
                {requests.length === 0 ? (
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center text-gray-400">
                    <p>No new requests right now.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map(req => (
                      <div key={req._id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-purple-500 transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg text-white mb-1">
                              {req.eventType || "Event Request"}
                            </h3>
                            <p className="text-gray-400 mb-2">From: {req.clientId?.name || "Client"}</p>
                            <div className="flex items-center text-sm text-gray-300">
                              <span className="mr-4">📅 {new Date(req.eventDate).toLocaleDateString()}</span>
                              <span className="font-semibold text-green-400">💵 ${req.totalPrice}</span>
                            </div>
                          </div>
                          <Link 
                            href={`/bookings/${req._id}`} 
                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition"
                          >
                            Review
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Confirmed Gigs */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Upcoming Gigs</h2>
                
                {upcomingGigs.length === 0 ? (
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center text-gray-400">
                    <p>Your schedule is clear.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingGigs.map(gig => (
                      <div key={gig._id} className="bg-gray-800 border-l-4 border-l-green-500 border border-gray-700 rounded-xl p-5">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-bold text-lg text-white mb-1">{gig.eventType || "Event"}</h3>
                            <p className="text-sm text-gray-400 mb-2">Client: {gig.clientId?.name}</p>
                            <p className="text-sm font-medium text-white">
                              {new Date(gig.eventDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Link 
                            href={`/bookings/${gig._id}`} 
                            className="border border-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition"
                          >
                            Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
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
