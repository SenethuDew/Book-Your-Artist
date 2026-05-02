"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  CalendarIcon, Briefcase, Wallet, Settings, Bell, LayoutDashboard, Plus, Trash2, Check, ExternalLink, CalendarDays, Clock, FileText, Upload, RefreshCw, X, Save, Pause, Eye, MapPin
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { isSingleGigPerDayCategory } from "@/lib/artistCalendarMode";

const NavItem = ({ href, icon: Icon, label, active, badge }: { href: string, icon: any, label: string, active?: boolean, badge?: number }) => (
  <Link href={href} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${active ? "bg-violet-600/20 text-violet-400 font-bold border border-violet-500/30" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
    <Icon className={`w-4 h-4 ${active ? "text-violet-400" : ""}`} />
    <span className="hidden xl:block whitespace-nowrap">{label}</span>
    {badge ? <span className="bg-fuchsia-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-md">{badge}</span> : null}
  </Link>
);

interface Slot {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "Available" | "Requested" | "Booked" | "Blocked" | "Draft";
  isPublished: boolean;
  bookingId?: {
    _id: string;
    clientId?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    eventLocation?: {
      venue?: string;
      address?: string;
      city?: string;
      country?: string;
    };
  };
}

export default function CalendarBuilderPage() {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [meArtist, setMeArtist] = useState<{ category?: string; artistType?: string }>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState("");
  const [modalStart, setModalStart] = useState("");
  const [modalEnd, setModalEnd] = useState("");
  const [modalStatus, setModalStatus] = useState<Slot["status"]>("Available");
  const [modalEditingSlotId, setModalEditingSlotId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) return router.push("/auth/login");

      const [availRes, meRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/availability/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/artists/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const availData = await availRes.json();
      const meData = await meRes.json().catch(() => ({}));

      if (meRes.ok && meData?.success && meData?.artist) {
        setMeArtist({
          category: meData.artist.category,
          artistType: meData.artist.artistType,
        });
      } else {
        setMeArtist({});
      }

      if (availData.success) {
        // Map backend slots to standard slot format, ensuring status is populated
        const mappedSlots = availData.availability.map((s: any) => ({
          ...s,
          status: s.status || "Available",
          isPublished: s.isPublished !== undefined ? s.isPublished : true,
        }));
        setSlots(mappedSlots);
      } else {
        setError(availData.message || "Failed to load calendar slots");
      }
    } catch (err: any) {
      setError("Network error loading calendar");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalDate || !modalStart || !modalEnd)
      return setError("Please fill in date and show hours");

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const isEdit = Boolean(modalEditingSlotId);
      const res = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/availability/${modalEditingSlotId}`
          : `${API_BASE_URL}/api/availability`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            date: modalDate,
            startTime: modalStart,
            endTime: modalEnd,
            status: modalStatus,
          }),
        }
      );
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(isEdit ? "Slot updated successfully" : "Slot saved successfully");
        setIsModalOpen(false);
        setModalEditingSlotId(null);
        fetchSlots(); // Automatically refresh UI
      } else {
        setError(data.message || "Failed to save slot. It might overlap another.");
      }
    } catch {
      setError("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Remove this availability slot?")) return;
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      await fetch(`${API_BASE_URL}/api/availability/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` }
      });
      setSlots(slots.filter(s => s._id !== id));
      setSuccess("Slot removed");
    } catch {
      setError("Failed to delete slot");
    }
  };

  const handleBookingAction = async (bookingId: string, status: "confirmed" | "cancelled", e?: React.MouseEvent) => {
    e?.stopPropagation();
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) return setError("Not authenticated");

    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update booking request");
      }
      setSuccess(status === "confirmed" ? "Booking request accepted" : "Booking request rejected");
      fetchSlots();
    } catch (err: any) {
      setError(err.message || "Failed to update booking request");
    }
  };

  // Grid Mapping logic to match client booking calendar
  const TIME_SLOTS = [
    { label: "4:00 PM - 6:00 PM", start: "16:00", end: "18:00" },
    { label: "6:30 PM - 8:30 PM", start: "18:30", end: "20:30" },
    { label: "9:00 PM - 11:00 PM", start: "21:00", end: "23:00" },
    { label: "11:30 PM - 1:00 AM", start: "23:30", end: "01:00" }
  ];

    const handlePublish = async () => {
      if (!slots.length) {
        setError("Add slots first");
        return;
      }
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) return;
      const draftSlots = slots.filter((x: Slot) => x.status === "Draft");
      const slotsToPublish = slots.filter((x: Slot) => x.status !== "Draft");
      if (!slotsToPublish.length) {
        setError(draftSlots.length ? "Un-draft or adjust slots marked Draft — those stay private." : "No slots to publish.");
        return;
      }
      if (
        !confirm(
          `${slotsToPublish.length} slot(s) will be visible on your public booking page (excluding Draft rows). Clients should refresh after a moment. Continue?`,
        )
      )
        return;
      setError("");
      setSuccess("");
      try {
        let ok = 0;
        for (const s of slotsToPublish) {
          const r = await fetch(`${API_BASE_URL}/api/availability/${s._id}`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ isPublished: true }),
          });
          const j = await r.json().catch(() => ({}));
          if (r.ok && j.success) ok++;
        }
        setSuccess(ok ? `Published ${ok} slot(s). Your live calendar now reflects these times.` : "Nothing was updated — try again.");
        fetchSlots();
      } catch {
        setError("Publish failed");
      }
    };
  
  // Future dates (Next 14 days)
  const upcomingDates = Array.from({length: 14}).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0,0,0,0);
    return d;
  });

  const getSlotForCell = (dateObj: Date, start: string, end: string) => {
    return slots.find(s => {
      const sDate = new Date(s.date);
      sDate.setHours(0,0,0,0);
      return sDate.getTime() === dateObj.getTime() && s.startTime === start && s.endTime === end;
    });
  };

  const slotMatchesPreset = (s: Pick<Slot, "startTime" | "endTime">) =>
    TIME_SLOTS.some((t) => t.start === s.startTime && t.end === s.endTime);

  const getExtraSlotsForDay = (dateObj: Date) => {
    return slots.filter((s) => {
      const sDate = new Date(s.date);
      sDate.setHours(0, 0, 0, 0);
      return sDate.getTime() === dateObj.getTime() && !slotMatchesPreset(s);
    });
  };

  const formatYYYYMMDD = (d: Date) => {
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
  };

  const formatBookingLocation = (slot?: Slot) => {
    const location = slot?.bookingId?.eventLocation;
    if (!location) return "";

    return [location.venue, location.address, location.city, location.country]
      .filter(Boolean)
      .join(", ");
  };

  const singleGigPerDay = isSingleGigPerDayCategory(meArtist.category, meArtist.artistType);

  const getSlotsForDay = (dateObj: Date) =>
    slots
      .filter((s) => {
        const sDate = new Date(s.date);
        sDate.setHours(0, 0, 0, 0);
        return sDate.getTime() === dateObj.getTime();
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Summaries
  const stats = {
    total: slots.length,
    available: slots.filter(s => s.status === "Available").length,
    booked: slots.filter(s => s.status === "Booked").length,
    requested: slots.filter(s => s.status === "Requested").length,
    blocked: slots.filter(s => s.status === "Blocked").length,
    drafts: slots.filter(s => s.status === "Draft").length
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans pb-20 selection:bg-fuchsia-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[40vw] h-[40vh] bg-violet-900/10 blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-0 right-1/4 w-[40vw] h-[40vh] bg-fuchsia-900/10 blur-[150px] mix-blend-screen" />
      </div>

      {/* Navbar Replicated */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-[90rem] mx-auto px-4 lg:px-8 flex items-center justify-between h-16">
          <Link href="/home/artist" className="flex items-center gap-3 shrink-0 group">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center font-black shadow-lg">♪</div>
             <span className="font-extrabold tracking-tight text-white hidden sm:block">BookYour<span className="text-violet-400">Artist</span></span>
          </Link>
          <div className="flex items-center overflow-x-auto scrollbar-hide py-1 w-full sm:w-auto px-2 sm:px-0 mx-0 sm:mx-6 flex-1 lg:justify-center gap-1">
             <NavItem href="/home/artist" icon={LayoutDashboard} label="Dashboard" />
             <NavItem href="/artist/bookings" icon={Briefcase} label="Bookings" />
             <NavItem href="/artist/calendar" icon={CalendarIcon} label="Calendar" active />
             <NavItem href="/artist/messages" icon={Bell} label="Notifications" />
             <NavItem href="/artist/earnings" icon={Wallet} label="Earnings" />
             <NavItem href="/artist/profile" icon={Settings} label="Settings" />
          </div>
          <div className="flex items-center gap-4">
             <button className="text-gray-400 hover:text-white"><Bell className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-[90rem] mx-auto auto px-4 lg:px-8 py-8 relative z-10 flex flex-col gap-8">
        
        {/* 1. Page Header & 2. Top Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Booking Calendar</h1>
            <p className="text-gray-400 text-sm">
              {singleGigPerDay ? (
                <>
                  Bands and DJs list one advertised show per day. Each row is a date — set start/end, choose status (Available, Booked, Blocked…), then Publish/Launch when you want it live on your public calendar.
                  Use <span className="text-gray-300">Add slot</span> on dates that do not yet have a show window.
                </>
              ) : (
                <>
                  Default columns match common client booking windows. Edit start/end anytime, or add another time window for the same day below each row.
                  Unpublished changes stay private until you use Publish/Launch — then clients see the updated slots on your public page.
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => { setModalEditingSlotId(null); setModalDate(""); setModalStart(""); setModalEnd(""); setModalStatus("Available"); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 border border-white/10 hover:bg-white/5 text-white rounded-xl text-sm font-bold transition-all shadow-lg">
              <Plus className="w-4 h-4 text-violet-400" /> New slot (pick date/time)
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-white/10 hover:bg-white/5 text-white rounded-xl text-sm font-bold transition-all shadow-lg">
              <RefreshCw className="w-4 h-4 text-fuchsia-400" /> Recurring
            </button>
            <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block"></div>
            <button onClick={handlePublish} className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-violet-600/20">
              <Upload className="w-4 h-4" /> Publish/Launch
            </button>
          </div>
        </div>

        {/* Status Messaging */}
        {(error || success) && (
          <div className={`px-4 py-3 rounded-xl border flex justify-between items-center text-sm font-bold ${error ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
            <span>{error || success}</span>
            <button onClick={() => {setError(""); setSuccess("");}} className="opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* 3. Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col justify-center">
            <p className="text-gray-400 text-xs font-bold uppercase mb-1 flex items-center gap-2"><CalendarIcon className="w-4 h-4"/> Total Cards</p>
            <h3 className="text-3xl font-black text-white mt-1">{stats.total}</h3>
          </div>
          <div className="bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden group">
            <Check className="absolute -right-4 -bottom-4 w-24 h-24 text-emerald-500/10 group-hover:scale-110 transition-transform" />
            <p className="text-emerald-400 text-xs font-bold uppercase mb-1 relative z-10">Available</p>
            <h3 className="text-3xl font-black text-emerald-300 mt-1 relative z-10">{stats.available}</h3>
          </div>
          <div className="bg-violet-500/5 backdrop-blur-xl border border-violet-500/20 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden group">
            <Check className="absolute -right-4 -bottom-4 w-24 h-24 text-violet-500/10 group-hover:scale-110 transition-transform" />
            <p className="text-violet-400 text-xs font-bold uppercase mb-1 relative z-10">Requested</p>
            <h3 className="text-3xl font-black text-violet-300 mt-1 relative z-10">{stats.requested}</h3>
          </div>
          <div className="bg-blue-500/5 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden group">
            <Check className="absolute -right-4 -bottom-4 w-24 h-24 text-blue-500/10 group-hover:scale-110 transition-transform" />
            <p className="text-blue-400 text-xs font-bold uppercase mb-1 relative z-10">Booked</p>
            <h3 className="text-3xl font-black text-violet-300 mt-1 relative z-10">{stats.booked}</h3>
          </div>
          <div className="bg-red-500/5 backdrop-blur-xl border border-red-500/20 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden group">
            <X className="absolute -right-4 -bottom-4 w-24 h-24 text-red-500/10 group-hover:scale-110 transition-transform" />
            <p className="text-red-400 text-xs font-bold uppercase mb-1 relative z-10">Blocked</p>
            <h3 className="text-3xl font-black text-red-300 mt-1 relative z-10">{stats.blocked}</h3>
          </div>
          <div className="bg-fuchsia-500/5 backdrop-blur-xl border border-fuchsia-500/20 rounded-2xl p-5 flex flex-col justify-center items-center">
             <p className="text-gray-400 text-xs font-medium mb-1">Calendar Status</p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold w-fit shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> Live View
            </span>
          </div>
        </div>

        {/* 4. Main Configurable Grid Builder matched to Client UI */}
        <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl overflow-x-auto relative">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <CalendarIcon className="text-violet-400 w-6 h-6" /> Management Calendar
          </h2>
          <p className="text-sm font-medium text-gray-500 mb-6">
            {singleGigPerDay
              ? "One advertised show per day — dates as rows, show window plus status like your public calendar. Tap the time band or Edit to change hours or status."
              : "Use the preset columns like clients see, tap a slot to change its window or status, then save. Extra times for the same day appear in the strip under each row — use the trash control on each chip to remove an additional slot."}
          </p>

          <div
            className={`flex flex-col gap-2 pb-2 ${singleGigPerDay ? "min-w-0 md:min-w-[520px]" : "min-w-[700px]"}`}
          >
            {singleGigPerDay ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 bg-gray-800/80 border-b border-gray-700/50 text-gray-400 font-semibold uppercase text-[10px] w-[26%] sm:w-1/4">Date</th>
                    <th className="p-2 bg-gray-800/80 border-b border-gray-700/50 text-gray-400 font-semibold uppercase text-[10px] border-l border-gray-700/30">
                      Show window
                    </th>
                    <th className="p-2 bg-gray-800/80 border-b border-gray-700/50 text-gray-400 font-semibold uppercase text-[10px] border-l border-gray-700/30">
                      Status
                    </th>
                    <th className="p-2 bg-gray-800/80 border-b border-gray-700/50 text-gray-400 font-semibold uppercase text-[10px] border-l border-gray-700/30 text-right">
                      Manage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900/40 divide-y divide-gray-800/60">
                  {upcomingDates.map((dateObj) => {
                    const dateString = formatYYYYMMDD(dateObj);
                    const isToday = dateString === formatYYYYMMDD(new Date());
                    const daySlots = getSlotsForDay(dateObj);

                    const openNewForDay = () => {
                      setModalEditingSlotId(null);
                      setModalDate(dateString);
                      setModalStart("19:00");
                      setModalEnd("23:00");
                      setModalStatus("Available");
                      setIsModalOpen(true);
                    };

                    const openEditSlot = (slot: Slot) => {
                      setModalEditingSlotId(slot._id);
                      setModalDate(slot.date.split("T")[0]);
                      setModalStart(slot.startTime);
                      setModalEnd(slot.endTime);
                      setModalStatus(slot.status);
                      setIsModalOpen(true);
                    };

                    const dateLabel = (
                      <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                        <span
                          className={`font-bold text-[10px] sm:text-xs leading-tight ${isToday ? "text-yellow-400" : "text-gray-200"}`}
                        >
                          {dateObj.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}
                        </span>
                        {isToday && (
                          <span className="text-[8px] sm:text-[9px] text-yellow-500/70 font-semibold tracking-wider uppercase mt-0.5">
                            Today
                          </span>
                        )}
                      </div>
                    );

                    if (daySlots.length === 0) {
                      return (
                        <tr
                          key={`${dateString}-empty`}
                          className={isToday ? "bg-gray-800/40" : "hover:bg-gray-800/20 transition-colors"}
                        >
                          <td className="p-2 sm:p-3 border-r border-gray-700/30 align-middle">{dateLabel}</td>
                          <td className="p-2 sm:p-3 border-r border-gray-700/30 text-gray-500 text-xs">—</td>
                          <td className="p-2 sm:p-3 border-r border-gray-700/30 text-gray-600 text-[11px]">No slot</td>
                          <td className="p-2 sm:p-3 text-right">
                            <button
                              type="button"
                              onClick={openNewForDay}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 text-[11px] font-bold transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add slot
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    return daySlots.map((slot, idx) => {
                      const bookingLocation = formatBookingLocation(slot);
                      return (
                        <tr
                          key={slot._id}
                          className={isToday ? "bg-gray-800/40" : "hover:bg-gray-800/20 transition-colors"}
                        >
                          {idx === 0 ? (
                            <td
                              rowSpan={daySlots.length}
                              className="p-2 sm:p-3 border-r border-gray-700/30 align-top pt-3"
                            >
                              {dateLabel}
                            </td>
                          ) : null}
                          <td className="p-2 sm:p-3 border-r border-gray-700/30 align-middle">
                            <button
                              type="button"
                              onClick={() => openEditSlot(slot)}
                              className="text-left w-full rounded-lg border border-gray-700/50 bg-black/25 px-2 py-1.5 hover:border-violet-500/40 transition-colors"
                            >
                              <span className="font-mono text-[11px] sm:text-xs font-bold text-white">
                                {slot.startTime} – {slot.endTime}
                              </span>
                              {!slot.isPublished && slot.status !== "Draft" && (
                                <span className="ml-2 align-middle text-[9px] uppercase font-bold text-amber-400/90 border border-amber-500/40 rounded px-1 py-0">
                                  Not published
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="p-2 sm:p-3 border-r border-gray-700/30 align-middle">
                            <div className="flex flex-col gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide w-fit
                                ${slot.status === "Available" ? "text-emerald-400"
                                  : slot.status === "Requested" ? "text-amber-400"
                                  : slot.status === "Booked" ? "text-indigo-400"
                                  : slot.status === "Blocked" ? "text-red-400" : "text-gray-400"}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0
                                  ${slot.status === "Available" ? "bg-emerald-500"
                                    : slot.status === "Requested" ? "bg-amber-500"
                                    : slot.status === "Booked" ? "bg-indigo-500"
                                    : slot.status === "Blocked" ? "bg-red-500" : "bg-gray-500"}`}
                                />
                                {slot.status}
                              </span>
                              {slot.status === "Requested" && slot.bookingId?.clientId?.name && (
                                <span
                                  className="text-[11px] text-gray-300 truncate max-w-[200px]"
                                  title={slot.bookingId.clientId.name}
                                >
                                  {slot.bookingId.clientId.name}
                                </span>
                              )}
                              {slot.status === "Requested" && slot.bookingId && (
                                <div className="flex flex-wrap gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      slot.bookingId?._id && handleBookingAction(slot.bookingId._id, "confirmed", e)
                                    }
                                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 rounded text-[9px] text-white font-bold"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      slot.bookingId?._id && handleBookingAction(slot.bookingId._id, "cancelled", e)
                                    }
                                    className="px-2 py-0.5 bg-red-600 hover:bg-red-500 rounded text-[9px] text-white font-bold"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                              {bookingLocation && (slot.status === "Booked" || slot.status === "Requested") && (
                                <p
                                  className="flex items-start gap-1 text-[10px] text-gray-400 max-w-[240px]"
                                  title={bookingLocation}
                                >
                                  <MapPin className="w-3 h-3 shrink-0 text-fuchsia-300 mt-0.5" />
                                  <span className="truncate">{bookingLocation}</span>
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-2 sm:p-3 align-middle text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openEditSlot(slot)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-white/15 text-[10px] text-gray-200 hover:bg-white/10 mr-2"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              title="Remove slot"
                              onClick={(e) => handleDeleteSlot(slot._id, e)}
                              className="inline-flex items-center justify-center p-1.5 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/40 border border-red-500/25"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr>
                  <th className="p-1 sm:p-2 bg-gray-800/80 border-b border-gray-700/50 text-gray-400 font-semibold uppercase text-[9px] sm:text-[10px] w-14 sm:w-20 lg:w-24">Date</th>
                  {TIME_SLOTS.map((slot, i) => (
                    <th key={i} className="p-1 sm:p-2 bg-gray-800/80 border-b border-gray-700/50 text-gray-400 font-semibold uppercase text-[9px] sm:text-[10px] text-center border-l border-gray-700/30 w-[18%] sm:w-1/4">
                      {slot.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-gray-900/40 divide-y divide-gray-800/60">
                {upcomingDates.map((dateObj, dateIdx) => {
                  const dateString = formatYYYYMMDD(dateObj);
                  const todayString = formatYYYYMMDD(new Date());
                  const isToday = dateString === todayString;
                  const extraSlots = getExtraSlotsForDay(dateObj);

                  return (
                    <React.Fragment key={dateIdx}>
                      <tr className={isToday ? "bg-gray-800/40" : "hover:bg-gray-800/20 transition-colors"}>
                        <td className="p-1 sm:p-2 border-r border-gray-700/30 align-middle">
                          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                            <span className={`font-bold text-[10px] sm:text-xs leading-tight ${isToday ? "text-yellow-400" : "text-gray-200"}`}>
                              {dateObj.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}
                            </span>
                            {isToday && (
                              <span className="text-[8px] sm:text-[9px] text-yellow-500/70 font-semibold tracking-wider uppercase mt-0.5">Today</span>
                            )}
                          </div>
                        </td>
                        {TIME_SLOTS.map((slotTime, sIdx) => {
                          const slot = getSlotForCell(dateObj, slotTime.start, slotTime.end);
                          const bookingLocation = formatBookingLocation(slot);

                          return (
                            <td key={sIdx} className="p-2 sm:p-3 border-r border-gray-700/30 align-top h-24 sm:h-28 relative group/cell">
                              {slot ? (
                                <div
                                  onClick={() => {
                                    setModalEditingSlotId(slot._id);
                                    setModalDate(slot.date.split("T")[0]);
                                    setModalStart(slot.startTime);
                                    setModalEnd(slot.endTime);
                                    setModalStatus(slot.status);
                                    setIsModalOpen(true);
                                  }}
                                  className={`w-full h-full rounded-xl border flex flex-col justify-center items-center gap-0.5 cursor-pointer transition-all transform hover:scale-[1.02] shadow-md group relative px-1
                                ${slot.status === "Available" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50"
                                  : slot.status === "Requested" ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50"
                                  : slot.status === "Booked" ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/50"
                                  : slot.status === "Blocked" ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20 hover:border-red-500/50"
                                  : "bg-gray-500/10 border-gray-500/30 text-gray-500 hover:bg-gray-500/20 hover:border-gray-500/50"}`}
                                >
                                  <span
                                    className={`inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mb-0.5
                                  ${slot.status === "Available" ? "text-emerald-400"
                                    : slot.status === "Requested" ? "text-amber-400"
                                    : slot.status === "Booked" ? "text-indigo-400"
                                    : slot.status === "Blocked" ? "text-red-400" : "text-gray-400"}`}
                                  >
                                    <div
                                      className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full
                                    ${slot.status === "Available" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                                      : slot.status === "Requested" ? "bg-amber-500"
                                      : slot.status === "Booked" ? "bg-indigo-500"
                                      : slot.status === "Blocked" ? "bg-red-500" : "bg-gray-500"}`}
                                    />{" "}
                                    {slot.status}
                                  </span>
                                  <p className="text-[8px] sm:text-[9px] text-gray-400 font-semibold whitespace-nowrap">
                                    {slot.startTime}–{slot.endTime}
                                  </p>
                                  {!slot.isPublished && slot.status !== "Draft" && (
                                    <span className="text-[7px] uppercase font-bold tracking-wide text-amber-400/90 border border-amber-500/40 rounded px-1 py-0">
                                      Not published
                                    </span>
                                  )}
                                  {slot.status === "Requested" && slot.bookingId && (
                                    <div className="text-center px-1 w-full">
                                      <p className="text-[9px] text-white font-bold truncate max-w-[120px] mx-auto">
                                        {slot.bookingId.clientId?.name || "Client request"}
                                      </p>
                                      {bookingLocation && (
                                        <p className="mt-0.5 flex items-center justify-center gap-1 text-[8px] text-gray-300 truncate max-w-[130px]" title={bookingLocation}>
                                          <MapPin className="w-2 h-2 shrink-0 text-fuchsia-300" />
                                          <span className="truncate">{bookingLocation}</span>
                                        </p>
                                      )}
                                      <div className="flex justify-center gap-1 mt-1">
                                        <button
                                          type="button"
                                          onClick={(e) =>
                                            slot.bookingId?._id && handleBookingAction(slot.bookingId._id, "confirmed", e)
                                          }
                                          className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 rounded text-[8px] text-white font-bold"
                                        >
                                          Accept
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) =>
                                            slot.bookingId?._id && handleBookingAction(slot.bookingId._id, "cancelled", e)
                                          }
                                          className="px-1.5 py-0.5 bg-red-600 hover:bg-red-500 rounded text-[8px] text-white font-bold"
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {slot.status === "Booked" && bookingLocation && (
                                    <p className="flex items-center justify-center gap-1 px-1 text-[8px] text-gray-200 truncate max-w-[135px]" title={bookingLocation}>
                                      <MapPin className="w-2 h-2 shrink-0 text-fuchsia-300" />
                                      <span className="truncate">{bookingLocation}</span>
                                    </p>
                                  )}

                                  <div className="absolute top-1 sm:top-2 right-1 sm:right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      title="Delete Slot"
                                      type="button"
                                      onClick={(e) => handleDeleteSlot(slot._id, e)}
                                      className="p-1 sm:p-1.5 bg-red-600/90 rounded-md text-white hover:bg-red-500 transition-all transform scale-90 hover:scale-105 shadow-md"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModalEditingSlotId(null);
                                    setModalDate(dateString);
                                    setModalStart(slotTime.start);
                                    setModalEnd(slotTime.end);
                                    setModalStatus("Available");
                                    setIsModalOpen(true);
                                  }}
                                  className="w-full h-full rounded-xl border border-dashed border-gray-700/50 flex flex-col items-center justify-center text-gray-600 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group opacity-40 hover:opacity-100"
                                >
                                  <Plus className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                                  <span className="text-[10px] font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100">Add Slot</span>
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="bg-gray-950/50 border-b border-gray-800/70">
                        <td colSpan={5} className="px-3 py-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mr-1">Additional times · {dateString}</span>
                            {extraSlots.map((s) => (
                              <div
                                key={s._id}
                                className="inline-flex items-stretch rounded-lg border border-violet-500/30 bg-violet-500/15 overflow-hidden shadow-sm"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModalEditingSlotId(s._id);
                                    setModalDate(s.date.split("T")[0]);
                                    setModalStart(s.startTime);
                                    setModalEnd(s.endTime);
                                    setModalStatus(s.status);
                                    setIsModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] sm:text-[11px] text-violet-100 hover:bg-violet-500/25 transition-colors"
                                >
                                  <Clock className="w-3 h-3 shrink-0 text-violet-300" />
                                  {s.startTime}–{s.endTime}
                                  {!s.isPublished && s.status !== "Draft" && (
                                    <span className="text-[8px] text-amber-400/95 font-bold uppercase tracking-wide">Not live</span>
                                  )}
                                  <span className="text-gray-400">·</span>
                                  <span className="text-emerald-300/90">{s.status}</span>
                                </button>
                                <button
                                  type="button"
                                  title="Delete this time period"
                                  aria-label="Delete additional time slot"
                                  onClick={(e) => handleDeleteSlot(s._id, e)}
                                  className="shrink-0 px-2 border-l border-violet-500/30 bg-red-500/15 text-red-300 hover:bg-red-500/40 hover:text-white transition-colors flex items-center justify-center"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                setModalEditingSlotId(null);
                                setModalDate(dateString);
                                setModalStart("19:00");
                                setModalEnd("22:00");
                                setModalStatus("Available");
                                setIsModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-white/20 text-[10px] text-gray-400 hover:border-emerald-500/40 hover:text-emerald-300 transition-colors"
                            >
                              <Plus className="w-3 h-3" /> Add another time period
                            </button>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            )}
          </div>
        </section>
      </main>

      {/* 5. Slot Configuration Drawer / Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 selection:bg-fuchsia-500/30">
          <div className="bg-[#1E112A] border border-white/10 rounded-3xl w-full max-w-[450px] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings className="w-5 h-5 text-violet-400"/> {modalEditingSlotId ? "Edit slot" : "Add availability slot"}</h2>
              <button title="Close" onClick={() => { setIsModalOpen(false); setModalEditingSlotId(null); }} className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSaveSlot} className="p-6 space-y-6">
              
              {/* Date */}
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Slot Date</label>
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-3.5 w-5 h-5 text-fuchsia-400" />
                  <input type="date" value={modalDate} onChange={e => setModalDate(e.target.value)} required min={modalEditingSlotId ? undefined : formatYYYYMMDD(new Date())} className="w-full bg-black/60 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white font-bold focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all scheme-dark" />
                </div>
              </div>
              
              {/* Times */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Start Time</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-3.5 w-4 h-4 text-violet-400" />
                    <input type="time" value={modalStart} onChange={e => setModalStart(e.target.value)} required className="w-full bg-black/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white font-bold focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all scheme-dark" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">End Time</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-3.5 w-4 h-4 text-violet-400" />
                    <input type="time" value={modalEnd} onChange={e => setModalEnd(e.target.value)} required className="w-full bg-black/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white font-bold focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all scheme-dark" />
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                {singleGigPerDay
                  ? "Bands and DJs use one advertised show window per calendar day — clients see one row per date. Adjust times and status here, then publish when ready."
                  : "Changing start or end saves to this slot. If the times no longer match a column above, it will appear under &quot;Additional times&quot; for that day."}
              </p>

              {/* Status */}
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Slot Visual Status</label>
                <div className="relative">
                  <select value={modalStatus} onChange={e => setModalStatus(e.target.value as any)} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-white font-bold focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all appearance-none cursor-pointer">
                     <option value="Available">Available (Clients can book this)</option>
                     <option value="Requested">Requested (Waiting for your decision)</option>
                     <option value="Booked">Booked (Paid & Assigned)</option>
                     <option value="Blocked">Blocked (Personal time / Off)</option>
                     <option value="Draft">Draft (Hidden from clients)</option>
                  </select>
                  <div className="absolute right-4 top-4 pointer-events-none text-gray-400">▼</div>
                </div>
              </div>
              
              {/* Action Bar */}
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => { setIsModalOpen(false); setModalEditingSlotId(null); }} className="flex-1 px-4 py-3.5 font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] flex items-center justify-center gap-2 px-4 py-3.5 font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl shadow-lg shadow-violet-600/20 transition-all">
                  <Save className="w-5 h-5" /> {isSubmitting ? "Processing..." : (modalEditingSlotId ? "Save changes" : "Create slot")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `.scheme-dark { color-scheme: dark; }`}} />
    </div>
  );
}