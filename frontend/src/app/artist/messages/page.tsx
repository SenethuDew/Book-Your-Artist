"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Briefcase,
  CalendarIcon,
  CheckCircle,
  Clock,
  LayoutDashboard,
  Settings,
  Wallet,
  XCircle,
} from "lucide-react";
import { API_BASE_URL, getAuthToken } from "@/lib/api";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

interface Booking {
  _id: string;
  clientId?: { name?: string; email?: string };
  eventDate: string;
  startTime: string;
  endTime: string;
  eventType?: string;
  eventLocation?: {
    venue?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  artistPrice?: number;
  totalPrice?: number;
  status: BookingStatus;
  paymentStatus?: string;
  createdAt: string;
}

interface ArtistNotification {
  id: string;
  bookingId: string;
  type: "request" | "confirmed" | "earning" | "cancelled";
  title: string;
  message: string;
  amount?: number;
  createdAt: string;
  read: boolean;
}

const READ_STORAGE_KEY = "artistNotificationReadIds";

const NavItem = ({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active?: boolean }) => (
  <Link href={href} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${active ? "bg-violet-600/20 text-violet-400 font-bold border border-violet-500/30" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
    <Icon className={`w-4 h-4 ${active ? "text-violet-400" : ""}`} />
    <span className="hidden xl:block whitespace-nowrap">{label}</span>
  </Link>
);

const formatLocation = (location?: Booking["eventLocation"]) => {
  if (!location) return "Location not provided";
  return [location.venue, location.address, location.city, location.country].filter(Boolean).join(", ") || "Location not provided";
};

const createNotifications = (bookings: Booking[], readIds: string[]): ArtistNotification[] => {
  return bookings.flatMap((booking) => {
    const clientName = booking.clientId?.name || "Client";
    const date = booking.eventDate ? new Date(booking.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Event date";
    const time = `${booking.startTime || ""} - ${booking.endTime || ""}`.trim();
    const location = formatLocation(booking.eventLocation);
    const amount = booking.artistPrice || booking.totalPrice || 0;

    const items: ArtistNotification[] = [];

    if (booking.status === "pending") {
      const id = `request-${booking._id}`;
      items.push({
        id,
        bookingId: booking._id,
        type: "request",
        title: "New booking request",
        message: `${clientName} requested ${booking.eventType || "a performance"} on ${date}${time ? `, ${time}` : ""} at ${location}.`,
        amount,
        createdAt: booking.createdAt,
        read: readIds.includes(id),
      });
    }

    if (booking.status === "confirmed") {
      const id = `confirmed-${booking._id}`;
      items.push({
        id,
        bookingId: booking._id,
        type: "confirmed",
        title: "Performance request confirmed",
        message: `${booking.eventType || "Performance"} for ${clientName} is confirmed for ${date}${time ? `, ${time}` : ""}.`,
        amount,
        createdAt: booking.createdAt,
        read: readIds.includes(id),
      });
    }

    if (booking.paymentStatus === "paid" && amount > 0) {
      const id = `earning-${booking._id}`;
      items.push({
        id,
        bookingId: booking._id,
        type: "earning",
        title: "Advance payment received",
        message: `$${amount.toFixed(2)} is secured for ${booking.eventType || "this performance"}.`,
        amount,
        createdAt: booking.createdAt,
        read: readIds.includes(id),
      });
    }

    if (booking.status === "cancelled") {
      const id = `cancelled-${booking._id}`;
      items.push({
        id,
        bookingId: booking._id,
        type: "cancelled",
        title: "Booking request rejected/cancelled",
        message: `${booking.eventType || "Performance request"} for ${clientName} was cancelled. The slot is available again.`,
        amount,
        createdAt: booking.createdAt,
        read: readIds.includes(id),
      });
    }

    return items;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export default function ArtistNotificationsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    const savedReadIds = localStorage.getItem(READ_STORAGE_KEY);
    setReadIds(savedReadIds ? JSON.parse(savedReadIds) : []);

    const fetchBookings = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE_URL}/api/bookings/my?limit=100&sort=-createdAt`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data?.success) {
          setBookings(data.bookings || []);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const notifications = useMemo(() => createNotifications(bookings, readIds), [bookings, readIds]);
  const visibleNotifications = filter === "unread" ? notifications.filter((item) => !item.read) : notifications;
  const unreadCount = notifications.filter((item) => !item.read).length;

  const saveReadIds = (ids: string[]) => {
    setReadIds(ids);
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(ids));
  };

  const markRead = (id: string) => {
    if (!readIds.includes(id)) {
      saveReadIds([...readIds, id]);
    }
  };

  const markAllRead = () => {
    saveReadIds(notifications.map((item) => item.id));
  };

  const iconForType = (type: ArtistNotification["type"]) => {
    if (type === "request") return <Clock className="w-5 h-5 text-amber-400" />;
    if (type === "confirmed") return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    if (type === "earning") return <Wallet className="w-5 h-5 text-violet-400" />;
    return <XCircle className="w-5 h-5 text-red-400" />;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-violet-500/30">
      <nav className="border-b border-white/5 bg-gray-950/80 backdrop-blur-xl z-50 sticky top-0">
        <div className="max-w-[90rem] mx-auto px-4 lg:px-8 flex items-center justify-between h-16">
          <Link href="/home/artist" className="flex items-center gap-3 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center font-black shadow-lg">♪</div>
            <span className="font-extrabold tracking-tight text-white hidden sm:block">BookYour<span className="text-violet-400">Artist</span></span>
          </Link>
          <div className="flex items-center overflow-x-auto scrollbar-hide py-1 gap-1">
            <NavItem href="/home/artist" icon={LayoutDashboard} label="Dashboard" />
            <NavItem href="/artist/bookings" icon={Briefcase} label="Bookings" />
            <NavItem href="/artist/calendar" icon={CalendarIcon} label="Calendar" />
            <NavItem href="/artist/messages" icon={Bell} label="Notifications" active />
            <NavItem href="/artist/earnings" icon={Wallet} label="Earnings" />
            <NavItem href="/artist/profile" icon={Settings} label="Profile" />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              Artist Notifications
              {unreadCount > 0 && <span className="px-3 py-1 rounded-full bg-fuchsia-500 text-white text-xs font-black">{unreadCount} new</span>}
            </h1>
            <p className="text-gray-400 text-sm mt-2">Booking requests, confirmations, and earning updates appear here.</p>
          </div>
          <button onClick={markAllRead} disabled={!notifications.length} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-50 text-sm font-bold border border-white/10">
            Mark all as read
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {(["all", "unread"] as const).map((item) => (
            <button key={item} onClick={() => setFilter(item)} className={`px-4 py-2 rounded-xl text-sm font-bold capitalize ${filter === item ? "bg-violet-600 text-white" : "bg-white/5 text-gray-400 hover:text-white"}`}>
              {item}
            </button>
          ))}
        </div>

        <section className="bg-[#1E112A]/40 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-16 flex items-center justify-center text-gray-400">
              <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : visibleNotifications.length > 0 ? (
            <div className="divide-y divide-white/5">
              {visibleNotifications.map((item) => (
                <button key={item.id} onClick={() => markRead(item.id)} className={`w-full p-5 text-left flex gap-4 hover:bg-white/[0.03] transition-colors ${item.read ? "opacity-70" : "bg-violet-500/[0.04]"}`}>
                  <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {iconForType(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white">{item.title}</h3>
                      {!item.read && <span className="w-2 h-2 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.8)]"></span>}
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.message}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                      {item.amount !== undefined && item.amount > 0 && <span className="text-emerald-400 font-bold">${item.amount.toFixed(2)}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white">No notifications</h3>
              <p className="text-sm text-gray-500 mt-1">New booking and earning updates will appear here.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
