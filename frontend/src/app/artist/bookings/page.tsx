"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { 
  Briefcase, CheckCircle, Clock, XCircle, LayoutDashboard, 
  CalendarIcon, Wallet, Settings, Bell, ChevronRight, User, Search, MapPin, Zap
} from "lucide-react";
import { useAuth } from "@/contexts";
import { isDemoArtist, DEMO_BOOKINGS, getDemoBookingSummary } from "@/lib/demoArtistData";
import { API_BASE_URL, getAuthToken } from "@/lib/api";

// Types & Mock Data
type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

interface Booking {
  id: string;
  clientName: string;
  clientEmail?: string;
  avatar?: string;
  eventType: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location: string;
  details?: string;
  amount: number;
  status: BookingStatus;
  paymentStatus?: string;
}

const mockBookings: Booking[] = [
  { id: "B1", clientName: "Sarah Jenkins", eventType: "Wedding Reception", date: "2026-05-12", location: "Grand Plaza, NY", amount: 1500, status: "pending" },
  { id: "B2", clientName: "Michael Chen", eventType: "Corporate Gala", date: "2026-05-20", location: "Downtown Center", amount: 2200, status: "confirmed" },
  { id: "B3", clientName: "Emily Davis", eventType: "Private Party", date: "2026-04-18", location: "Beverly Hills", amount: 800, status: "cancelled" },
  { id: "B4", clientName: "James Wilson", eventType: "Club Performance", date: "2026-06-05", location: "Neon Lounge", amount: 1200, status: "confirmed" },
];

const NavItem = ({ href, icon: Icon, label, active }: { href: string, icon: any, label: string, active?: boolean }) => (
  <Link href={href} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${active ? "bg-violet-600/20 text-violet-400 font-bold border border-violet-500/30" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
    <Icon className={`w-4 h-4 ${active ? "text-violet-400" : ""}`} />
    <span className="hidden xl:block whitespace-nowrap">{label}</span>
  </Link>
);

export default function BookingsPage() {
  const { user, loading } = useAuth();
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const normalizeBooking = (booking: any): Booking => ({
    id: booking._id,
    clientName: booking.clientId?.name || "Client",
    clientEmail: booking.clientId?.email || "",
    eventType: booking.eventType || "Performance request",
    date: booking.eventDate ? new Date(booking.eventDate).toISOString().split("T")[0] : "",
    startTime: booking.startTime,
    endTime: booking.endTime,
    location: booking.eventLocation?.venue || booking.eventLocation?.city || "Location not provided",
    details: booking.eventDetails || "",
    amount: booking.totalPrice || 0,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
  });

  const fetchBookings = async () => {
    if (!user || isDemoArtist(user)) {
      setBookingsLoading(false);
      return;
    }

    try {
      setBookingsLoading(true);
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/bookings/my?limit=100&sort=eventDate`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to load bookings");
      }
      setBookings((data.bookings || []).map(normalizeBooking));
    } catch (error: any) {
      toast.error(error.message || "Failed to load bookings");
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchBookings();
    }
  }, [loading, user]);
  
  // Use demo data if demo artist, otherwise use empty/real data
  const displayBookings: Booking[] = isDemoArtist(user) ? (DEMO_BOOKINGS as Booking[]) : bookings;
  const filteredBookings = displayBookings.filter(b => filter === "all" || b.status === filter);
  
  const summary = isDemoArtist(user) 
    ? getDemoBookingSummary()
    : {
        total: bookings.length,
        pending: bookings.filter((b) => b.status === "pending").length,
        confirmed: bookings.filter((b) => b.status === "confirmed").length,
        cancelled: bookings.filter((b) => b.status === "cancelled").length,
      };

  const handleDemoAction = () => {
    toast.error("Demo mode: This action is only for preview.", {
      duration: 3000,
    });
  };

  const handleBookingAction = async (bookingId: string, status: "confirmed" | "cancelled") => {
    if (isDemoArtist(user)) {
      handleDemoAction();
      return;
    }

    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to update booking");
      }
      toast.success(status === "confirmed" ? "Performance request accepted" : "Performance request rejected");
      setSelectedBooking(null);
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message || "Failed to update booking");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full mx-auto animate-spin mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-violet-500/30 pb-20">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-violet-900/10 blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-fuchsia-900/10 blur-[150px] mix-blend-screen" />
      </div>

      {/* Navbar Replicated */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-[90rem] mx-auto px-4 lg:px-8 flex items-center justify-between h-16">
          <Link href="/home/artist" className="flex items-center gap-3 shrink-0 group">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center font-black shadow-lg">♪</div>
             <span className="font-extrabold tracking-tight text-white hidden sm:block">BookYour<span className="text-violet-400">Artist</span></span>
          </Link>
          <div className="flex items-center overflow-x-auto scrollbar-hide py-1 gap-1">
             <NavItem href="/home/artist" icon={LayoutDashboard} label="Dashboard" />
             <NavItem href="/artist/bookings" icon={Briefcase} label="Bookings" active />
             <NavItem href="/artist/calendar" icon={CalendarIcon} label="Calendar" />
             <NavItem href="/artist/messages" icon={Bell} label="Notifications" />
             <NavItem href="/artist/earnings" icon={Wallet} label="Earnings" />
             <NavItem href="/artist/profile" icon={Settings} label="Profile" />
          </div>
          <div className="flex items-center gap-4">
             <button className="text-gray-400 hover:text-white"><Bell className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-[90rem] mx-auto px-4 lg:px-8 py-8 relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-extrabold text-white">Bookings</h1>
              {isDemoArtist(user) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-600/30 border border-violet-500/50 text-violet-300 text-xs font-bold rounded-full">
                  <Zap className="w-3.5 h-3.5" /> Demo Mode
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm">
              {isDemoArtist(user) 
                ? "Preview sample bookings (demo data only)" 
                : "Manage your upcoming gigs and client requests."}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Bookings", value: summary.total, icon: Briefcase, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Pending Requests", value: summary.pending, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Confirmed", value: summary.confirmed, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Cancelled", value: summary.cancelled, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" }
          ].map((item, i) => (
            <div key={i} className="bg-[#1E112A]/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center gap-4">
               <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.bg} ${item.color}`}>
                 <item.icon className="w-6 h-6" />
               </div>
               <div>
                 <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{item.label}</p>
                 <p className="text-2xl font-black text-white">{item.value}</p>
               </div>
            </div>
          ))}
        </div>

        {/* List Section */}
        <div className="bg-[#1E112A]/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          {/* Filters */}
          <div className="border-b border-white/10 p-4 flex gap-2 overflow-x-auto">
            {["all", "pending", "confirmed", "cancelled"].map((f) => (
              <button 
                key={f} 
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${filter === f ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="p-4 overflow-x-auto">
            {bookingsLoading && !isDemoArtist(user) ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-gray-400">
                 <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                 <p className="text-sm">Loading performance requests...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-gray-400">
                 <Briefcase className="w-12 h-12 mb-4 opacity-50 text-white" />
                 <h3 className="text-lg font-bold text-white mb-1">No bookings found</h3>
                 <p className="text-sm">There are no bookings matching the selected filter.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-white/10">
                    <th className="p-4 font-medium">Client & Event</th>
                    <th className="p-4 font-medium">Date & Location</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 font-bold shrink-0">
                            {booking.clientName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{booking.clientName}</p>
                            <p className="text-xs text-gray-400">{booking.eventType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <div className="flex flex-col gap-1 text-gray-300">
                          <span className="flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5 text-violet-400" /> {booking.date}</span>
                          {booking.startTime && booking.endTime && (
                            <span className="flex items-center gap-1.5 text-xs text-amber-400">
                              <Clock className="w-3 h-3" /> {booking.startTime} - {booking.endTime}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 text-xs text-gray-500"><MapPin className="w-3 h-3" /> {booking.location}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-emerald-400">${booking.amount.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' :
                          booking.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                         <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           {booking.status === 'pending' && (
                             <>
                               <button 
                                onClick={() => handleBookingAction(booking.id, "confirmed")}
                                disabled={isDemoArtist(user)}
                                 className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                                   isDemoArtist(user)
                                     ? "bg-emerald-500/10 text-emerald-400 cursor-not-allowed opacity-50"
                                     : "bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white"
                                 }`}
                               >
                                 Accept
                               </button>
                               <button 
                                onClick={() => handleBookingAction(booking.id, "cancelled")}
                                disabled={isDemoArtist(user)}
                                 className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                                   isDemoArtist(user)
                                     ? "bg-red-500/10 text-red-400 cursor-not-allowed opacity-50"
                                     : "bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white"
                                 }`}
                               >
                                 Reject
                               </button>
                             </>
                           )}
                           <button onClick={() => setSelectedBooking(booking)} className="px-3 py-1.5 border border-white/20 hover:bg-white/10 rounded text-xs font-bold text-white transition-all">Details</button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {selectedBooking && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#1E112A] border border-white/10 rounded-3xl shadow-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-violet-300 font-bold mb-1">Performance Request</p>
                <h2 className="text-2xl font-black text-white">{selectedBooking.eventType}</h2>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3 text-sm text-gray-300">
              <p><span className="text-gray-500">Client:</span> {selectedBooking.clientName}</p>
              {selectedBooking.clientEmail && <p><span className="text-gray-500">Email:</span> {selectedBooking.clientEmail}</p>}
              <p><span className="text-gray-500">Date:</span> {selectedBooking.date} {selectedBooking.startTime} - {selectedBooking.endTime}</p>
              <p><span className="text-gray-500">Location:</span> {selectedBooking.location}</p>
              <p><span className="text-gray-500">Payment:</span> {selectedBooking.paymentStatus || "pending"}</p>
              <p><span className="text-gray-500">Details:</span> {selectedBooking.details || "No extra details provided."}</p>
            </div>
            {selectedBooking.status === "pending" && (
              <div className="flex gap-3 mt-8">
                <button onClick={() => handleBookingAction(selectedBooking.id, "confirmed")} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white">
                  Accept
                </button>
                <button onClick={() => handleBookingAction(selectedBooking.id, "cancelled")} className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-white">
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
