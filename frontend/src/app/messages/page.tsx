"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, CheckCircle2, Clock, Home, MessageSquare, Music, Wallet, XCircle } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { API_BASE_URL, getAuthToken } from "@/lib/api";

interface Booking {
  _id: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  eventType?: string;
  status: string;
  paymentStatus?: string;
  totalPrice?: number;
  createdAt?: string;
  artistId?: {
    name?: string;
    email?: string;
    profileImage?: string;
  };
}

interface ClientNotification {
  id: string;
  type: "request" | "confirmed" | "payment" | "cancelled" | "completed";
  title: string;
  message: string;
  createdAt: string;
  amount?: number;
  read: boolean;
}

const READ_STORAGE_KEY = "clientNotificationReadIds";

function ClientNotificationsContent() {
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

  const notifications = useMemo<ClientNotification[]>(() => {
    return bookings.flatMap((booking) => {
      const artistName = booking.artistId?.name || "Artist";
      const date = booking.eventDate
        ? new Date(booking.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "event date";
      const time = booking.startTime && booking.endTime ? `, ${booking.startTime} - ${booking.endTime}` : "";
      const amount = booking.totalPrice || 0;
      const items: ClientNotification[] = [];

      if (booking.status === "pending") {
        const id = `request-${booking._id}`;
        items.push({
          id,
          type: "request",
          title: "Booking request sent",
          message: `Your request to ${artistName} for ${booking.eventType || "a performance"} on ${date}${time} is waiting for artist approval.`,
          createdAt: booking.createdAt || booking.eventDate,
          amount,
          read: readIds.includes(id),
        });
      }

      if (booking.status === "confirmed") {
        const id = `confirmed-${booking._id}`;
        items.push({
          id,
          type: "confirmed",
          title: "Artist accepted your request",
          message: `${artistName} confirmed your ${booking.eventType || "performance"} booking on ${date}${time}.`,
          createdAt: booking.createdAt || booking.eventDate,
          amount,
          read: readIds.includes(id),
        });
      }

      if (booking.paymentStatus === "paid") {
        const id = `payment-${booking._id}`;
        items.push({
          id,
          type: "payment",
          title: "Advance payment recorded",
          message: `Your advance payment for ${artistName} has been recorded successfully.`,
          createdAt: booking.createdAt || booking.eventDate,
          amount,
          read: readIds.includes(id),
        });
      }

      if (booking.status === "cancelled") {
        const id = `cancelled-${booking._id}`;
        items.push({
          id,
          type: "cancelled",
          title: "Booking request cancelled",
          message: `Your request with ${artistName} was cancelled or rejected. The selected slot is available again.`,
          createdAt: booking.createdAt || booking.eventDate,
          amount,
          read: readIds.includes(id),
        });
      }

      if (booking.status === "completed") {
        const id = `completed-${booking._id}`;
        items.push({
          id,
          type: "completed",
          title: "Performance completed",
          message: `Your ${booking.eventType || "performance"} booking with ${artistName} is marked as completed.`,
          createdAt: booking.createdAt || booking.eventDate,
          amount,
          read: readIds.includes(id),
        });
      }

      return items;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookings, readIds]);

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

  const iconForType = (type: ClientNotification["type"]) => {
    if (type === "request") return <Clock className="w-5 h-5 text-amber-400" />;
    if (type === "confirmed") return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    if (type === "payment") return <Wallet className="w-5 h-5 text-violet-400" />;
    if (type === "cancelled") return <XCircle className="w-5 h-5 text-red-400" />;
    return <Calendar className="w-5 h-5 text-blue-400" />;
  };

  return (
    <div className="min-h-screen bg-[#0A0512] text-white selection:bg-violet-500/30">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/home/client" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-[0_0_20px_-5px_rgba(139,92,246,0.6)]">
              <Music className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight hidden sm:block">
              BookYour<span className="text-violet-400">Artist</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/home/client" className="px-4 py-2 rounded-full text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5">
              <Home className="w-4 h-4 inline mr-2" /> Home
            </Link>
            <Link href="/bookings" className="px-4 py-2 rounded-full text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5">
              My Bookings
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3">
              Messages
              {unreadCount > 0 && (
                <span className="px-3 py-1 rounded-full bg-fuchsia-500 text-white text-xs font-black">{unreadCount} new</span>
              )}
            </h1>
            <p className="text-gray-400 text-sm mt-2">Track booking requests, artist confirmations, payments, and cancellations.</p>
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

        <section className="bg-[#120A20]/70 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="py-16 flex items-center justify-center">
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
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white">No messages</h3>
              <p className="text-sm text-gray-500 mt-1">Your booking updates will appear here.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function ClientNotificationsPage() {
  return (
    <ProtectedRoute requiredRole="client">
      <ClientNotificationsContent />
    </ProtectedRoute>
  );
}
