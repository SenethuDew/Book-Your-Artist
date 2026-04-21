"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Briefcase, CheckCircle, Clock, XCircle, LayoutDashboard, 
  CalendarIcon, MessageSquare, Wallet, Settings, Bell, ChevronRight, User, Search, MapPin
} from "lucide-react";

// Types & Mock Data
type BookingStatus = "pending" | "confirmed" | "cancelled";

interface Booking {
  id: string;
  clientName: string;
  avatar?: string;
  eventType: string;
  date: string;
  location: string;
  amount: number;
  status: BookingStatus;
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
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");
  
  const filteredBookings = mockBookings.filter(b => filter === "all" || b.status === filter);
  
  const summary = {
    total: mockBookings.length,
    pending: mockBookings.filter(b => b.status === "pending").length,
    confirmed: mockBookings.filter(b => b.status === "confirmed").length,
    cancelled: mockBookings.filter(b => b.status === "cancelled").length,
  };

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
             <NavItem href="/artist/messages" icon={MessageSquare} label="Messages" />
             <NavItem href="/artist/earnings" icon={Wallet} label="Earnings" />
             <NavItem href="/artist/profile" icon={Settings} label="Profile" />
          </div>
          <div className="flex items-center gap-4">
             <button className="text-gray-400 hover:text-white"><Bell className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-[90rem] mx-auto px-4 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-2">Bookings</h1>
          <p className="text-gray-400 text-sm">Manage your upcoming gigs and client requests.</p>
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
            {filteredBookings.length === 0 ? (
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
                               <button className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded text-xs font-bold transition-all">Accept</button>
                               <button className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded text-xs font-bold transition-all">Reject</button>
                             </>
                           )}
                           <button className="px-3 py-1.5 border border-white/20 hover:bg-white/10 rounded text-xs font-bold text-white transition-all">Details</button>
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
    </div>
  );
}
