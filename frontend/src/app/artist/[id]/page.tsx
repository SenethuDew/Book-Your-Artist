'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getArtistFromFirestore, getArtistBookings } from '@/lib/firebaseBookingAPI';
import { FirebaseBookingForm } from '@/components/FirebaseBookingForm';
import { useAuth } from '@/contexts';
import { MapPin, Star, Clock, Globe, Mic2, Tag, Calendar, Music2, Share2, ArrowLeft, CalendarCheck, CheckCircle2, Zap, Image as ImageIcon, Video, UserCheck, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { FaInstagram } from 'react-icons/fa';

export default function ArtistProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const [artist, setArtist] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{date: string, start: string, end: string} | null>(null);

  useEffect(() => {
    async function loadArtist() {
      if (!id) return;
      try {
        const [artistData, bookingData] = await Promise.all([
          getArtistFromFirestore(id),
          getArtistBookings(id)
        ]);
        setArtist(artistData);
        setBookings(bookingData || []);
      } catch (error) {
        console.error("Error loading artist:", error);
      } finally {
        setLoading(false);
      }
    }
    loadArtist();
  }, [id, showBookingForm]); // added showBookingForm to refresh bookings after modal closes

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 ml-4 font-medium animate-pulse">Loading Spotlight...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl text-white font-bold mb-4">Artist Not Found</h1>
        <p className="text-gray-400 mb-8 text-lg">This stage is empty. The artist you're looking for doesn't exist.</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-white font-bold transition-colors">
          Return Home
        </button>
      </div>
    );
  }

  const profileImage = artist.profileImage || 
    (artist.category === 'DJ' 
     ? 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop'
     : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop');
  const coverImage = artist.coverImage || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&h=400&fit=crop';

  const mockStats = {
    totalBookings: Math.floor(Math.random() * 50) + 10,
    responseTime: ['< 1 hr', '< 3 hrs', 'Same day'][Math.floor(Math.random() * 3)],
    reviewCount: Math.floor(Math.random() * 100) + 15
  };

  const openInteractiveModal = (dateStr?: string, start?: string, end?: string) => {
    if (dateStr && start && end) {
      setSelectedSlot({ date: dateStr, start, end });
    } else {
      setSelectedSlot(null);
    }
    setShowBookingForm(true);
  };

  // Generate dynamic slots for the next 7 days
  const TIME_SLOTS = [
    { label: "4:00 PM - 6:00 PM", start: "16:00", end: "18:00" },
    { label: "6:30 PM - 8:30 PM", start: "18:30", end: "20:30" },
    { label: "9:00 PM - 11:00 PM", start: "21:00", end: "23:00" },
    { label: "11:30 PM - 1:00 AM", start: "23:30", end: "01:00" }
  ];

  const today = new Date();
  const getUpcomingDates = () => {
    const dates = [];
    const curr = new Date(today);
    // Next 7 days from today
    for (let i = 0; i < 7; i++) {
       dates.push(new Date(curr));
       curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };
  const upcomingDates = getUpcomingDates();
  const formatYYYYMMDD = (d: Date) => d.toISOString().split('T')[0];

  const getBookingForSlot = (dateStr: string, start: string, end: string) => {
    return bookings.find(b => {
      if (b.eventDate !== dateStr || b.status === "cancelled" || b.paymentStatus === "refunded") return false;
      
      const bStart = b.startTime;
      let bEnd = b.endTime === "00:00" ? "24:00" : b.endTime;
      let bEndVal = parseFloat(bEnd.replace(':', '.'));
      if (bEndVal < parseFloat(bStart.replace(':', '.'))) bEndVal += 24;

      const slotStart = parseFloat(start.replace(':', '.'));
      let slotEndVal = parseFloat(end.replace(':', '.'));
      // if end is earlier, it extends into next day
      if (slotEndVal < slotStart) slotEndVal += 24;

      const compStart = parseFloat(bStart.replace(':', '.'));

      return (compStart < slotEndVal && bEndVal > slotStart);
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <div 
        className="w-full h-64 md:h-80 lg:h-[420px] bg-cover bg-center relative"
        style={{ backgroundImage: `url(${coverImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/60 to-transparent"></div>
        
        <button onClick={() => router.back()} className="absolute top-6 left-6 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors z-10 shadow-lg">
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        {/* Main Identity Card */}
        <div className="bg-gray-900/95 backdrop-blur-2xl border border-gray-700/50 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start ring-1 ring-white/10">
          
          <div className="flex-shrink-0 w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden border-4 border-gray-800 shadow-2xl bg-gray-700 relative">
            <img src={profileImage} alt={artist.stageName || artist.name} className="w-full h-full object-cover" />
            <div className="absolute top-2 right-2 bg-green-500 rounded-full w-4 h-4 border-2 border-gray-800 shadow-sm" title="Online or Active recently"></div>
          </div>

           <div className="flex-1 pt-2 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start lg:items-center gap-4 mb-4">
              <div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 mb-2 flex items-center gap-3">
                  {artist.stageName || artist.name}
                  <ShieldCheck className="text-blue-400 w-6 h-6 sm:w-8 sm:h-8" />
                </h1>
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300 font-medium mt-3">
                  {artist.category && (
                    <span className="flex items-center gap-1.5 bg-gray-800/80 px-3 py-1 rounded-full border border-gray-700"><Mic2 size={14} className="text-violet-400" /> {artist.category}</span>
                  )}
                  {artist.location && (
                    <span className="flex items-center gap-1.5 bg-gray-800/80 px-3 py-1 rounded-full border border-gray-700"><MapPin size={14} className="text-red-400" /> {artist.location}</span>
                  )}
                  {artist.rating !== undefined && (
                    <div className="flex items-center gap-1 ml-1 text-yellow-500 font-bold">
                      <Star size={16} fill="currentColor" />
                      <span>{artist.rating.toFixed(1)}</span>
                      <span className="text-gray-400 font-normal ml-1">({mockStats.reviewCount} reviews)</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-stretch md:items-end w-full md:w-auto p-4 bg-gray-800/50 rounded-2xl border border-gray-700/50">
                <div className="text-gray-400 text-sm font-medium mb-1 uppercase tracking-wider">Starting at</div>
                <div className="text-3xl font-black text-white mb-4 flex items-baseline">
                   ${artist.hourlyRate || artist.price || 150}
                   <span className="text-sm text-gray-400 ml-1 font-normal">/ hour</span>
                </div>
                <button 
                  onClick={() => setShowBookingForm(true)}
                  className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-bold shadow-lg shadow-violet-600/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <CalendarCheck size={18} /> Request Booking
                </button>
              </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-700/50">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Bookings</span>
                <span className="text-lg text-white font-bold flex items-center gap-1.5"><CheckCircle2 size={16} className="text-green-400"/> {mockStats.totalBookings}+</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Response Time</span>
                <span className="text-lg text-white font-bold flex items-center gap-1.5"><Zap size={16} className="text-yellow-400"/> {mockStats.responseTime}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Experience</span>
                <span className="text-lg text-white font-bold flex items-center gap-1.5"><UserCheck size={16} className="text-blue-400"/> {artist.experience || '3+ Years'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Status</span>
                <span className="text-lg text-white font-bold flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${artist.availability !== false ? 'bg-green-500' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`}></span> 
                  {artist.availability !== false ? 'Accepting Events' : 'Fully Booked'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          
           {/* Left Column - Details & Portfolio */}
           <div className="lg:col-span-2 space-y-6">
            <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>
              <h2 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
                <Music2 className="text-fuchsia-400 w-6 h-6" /> About {artist.stageName || artist.name}
              </h2>
              
              <p className="text-gray-300 leading-relaxed max-w-prose whitespace-pre-wrap text-[15px] sm:text-base font-light mb-6">
                {artist.biography || "No biography provided yet. But this artist's talent speaks for itself! Get ready to be amazed by the ultimate performance. Let the music take control and connect with the vibe."}
              </p>
              
              <div className="mt-4 bg-gray-800/30 border border-gray-700/50 p-4 rounded-xl inline-block min-w-[200px]">
                <p className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">Instagram</p>
                <a
                  href={artist.socialLinks?.instagram || "https://instagram.com/yohanimusic"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-pink-500 hover:text-pink-400 hover:underline transition-all"
                >
                  <FaInstagram className="w-6 h-6" />
                  <span className="font-semibold text-[17px]">
                    @{artist.socialLinks?.instagram ? artist.socialLinks.instagram.split('/').filter((p: string) => p).pop() : "yohanimusic"}
                  </span>
                </a>
              </div>

              <div className="mt-8">
                <h3 className="text-sm uppercase tracking-wider font-bold text-gray-500 mb-3">Musical DNA</h3>
                <div className="flex flex-wrap gap-2">
                  {artist.genres && artist.genres.length > 0 ? (
                    artist.genres.map((g: string, i: number) => (
                      <span key={i} className="px-5 py-2 bg-gray-800 border border-gray-700 hover:border-violet-500/50 text-gray-300 rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-violet-500/10 transition-all cursor-default">
                        {g}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 italic">Not specified</span>
                  )}
                </div>
              </div>
            </section>

            {/* Mock Portfolio Area */}
            <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Video className="text-blue-400 w-6 h-6" /> Performance Previews
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="group relative aspect-video bg-gray-800 rounded-xl overflow-hidden cursor-pointer">
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1470229722913-7c090be5f5ae?w=800')" }}></div>
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                      <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[14px] border-l-white border-b-8 border-b-transparent ml-1"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-gray-900 to-transparent pt-8">
                     <span className="text-white font-semibold text-sm">Live in Concert 2025</span>
                  </div>
                </div>
                <div className="group relative aspect-video bg-gray-800 rounded-xl overflow-hidden cursor-pointer">
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800')" }}></div>
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                       <span className="text-white font-bold text-xs tracking-wider">AUDIO</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-gray-900 to-transparent pt-8 text-right">
                     <span className="text-white font-semibold text-sm">Acoustic Session</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Live Availability Engine MOVED to Main Column Conditionally */}
            {id.startsWith('intl-') ? (
              <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-blue-500/5 rounded-bl-full pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Travel & Reservation Plan</h2>
                      <p className="text-gray-400">International Performance Booking</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-800">
                      <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Destination
                      </h3>
                      <p className="text-lg font-semibold text-white">Sri Lanka</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-800">
                      <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Performance Type
                      </h3>
                      <p className="text-lg font-semibold text-white truncate">{artist.category || 'Special Event'}</p>
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                    <h3 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Important Notice for Clients
                    </h3>
                    <ul className="space-y-2 text-amber-200/80 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Reservations require coordinating travel dates strictly with the artist's management.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Flight, luxury accommodation, and local transport must be verified.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        A 50% advance secures your booking slot once travel is confirmed.
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
            ) : (
            <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <CalendarCheck className="text-violet-400 w-6 h-6" /> Booking Calendar
              </h2>
              <p className="text-sm font-medium text-gray-500 mb-6">Upcoming slots available to book.</p>
              
              <div className="flex flex-col gap-2 pb-2">
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
                    {upcomingDates.map((date, idx) => {
                      const dateString = formatYYYYMMDD(date);
                      const isToday = dateString === formatYYYYMMDD(today);
                      
                      return (
                        <tr key={idx} className={isToday ? "bg-gray-800/40" : "hover:bg-gray-800/20 transition-colors"}>
                          <td className="p-1 sm:p-2 border-r border-gray-700/30">
                            <div className="flex flex-col">
                              <span className={`font-bold text-[10px] sm:text-xs leading-tight ${isToday ? 'text-yellow-400' : 'text-gray-200'}`}>
                                {date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                              </span>
                              {isToday && <span className="text-[8px] sm:text-[9px] text-yellow-500/70 font-semibold tracking-wider uppercase mt-0.5">Today</span>}
                            </div>
                          </td>
                          {TIME_SLOTS.map((slot, sIdx) => {
                            const booking = getBookingForSlot(dateString, slot.start, slot.end);
                            const isBooked = !!booking;
                            
                            return (
                              <td key={sIdx} className="p-1 sm:p-2 border-r border-gray-700/30 align-top overflow-hidden">
                                {isBooked ? (
                                  <div className="flex flex-col items-center justify-center p-1 sm:p-2 rounded bg-red-500/5 border border-red-500/10 h-full text-center">
                                    <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-red-400 uppercase tracking-wider mb-0.5 sm:mb-1">
                                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-500" /> Booked
                                    </span>
                                    <span className="text-[9px] sm:text-[11px] text-gray-400 font-medium truncate w-full px-0.5" title={`${booking.eventTitle} ${booking.location ? `- ${booking.location}` : ''}`}>
                                      {booking.eventTitle}
                                    </span>
                                    {booking.location && (
                                      <span className="text-[8px] sm:text-[10px] text-gray-500 truncate w-full flex items-center justify-center gap-0.5 mt-0.5 px-0.5">
                                        <MapPin size={10} className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> {booking.location.split(',')[0]}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center p-1 sm:p-2 rounded bg-emerald-500/5 border border-emerald-500/10 h-full hover:bg-emerald-500/10 transition-colors group cursor-pointer" onClick={() => openInteractiveModal(dateString, slot.start, slot.end)}>
                                    <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5 sm:mb-1">
                                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" /> Free
                                    </span>
                                    <button 
                                      className="mt-0.5 sm:mt-1 px-1 sm:px-2 py-1 sm:py-1.5 bg-emerald-600/80 hover:bg-emerald-500 rounded text-[9px] sm:text-[11px] text-white font-bold transition-all shadow-sm w-full opacity-80 group-hover:opacity-100"
                                    >
                                      Book Now
                                    </button>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
            )}
          </div>

          {/* Right Column - Schedule & Socials */}
          <div className="space-y-6">
            <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl sticky top-6">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <CalendarCheck className="text-violet-400" /> {id.startsWith('intl-') ? 'Reserve Travel Plan' : 'Quick Booking'}
              </h2>
              <p className="text-sm font-medium text-gray-500 mb-6">{id.startsWith('intl-') ? 'Start your international booking process.' : 'Select a custom schedule for your event.'}</p>
              
              <div className="border-t border-gray-800 pt-6 mt-2">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 font-medium">{id.startsWith('intl-') ? 'Starting Rate' : 'Standard Rate'}</span>
                  <span className="text-2xl font-black text-white">$ {artist.hourlyRate || 250}{!id.startsWith('intl-') && <span className="text-sm font-normal text-gray-500">/hr</span>}</span>
                </div>
                <button
                  onClick={() => openInteractiveModal()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-lg hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)] hover:shadow-[0_0_60px_-10px_rgba(168,85,247,0.7)] group transform hover:-translate-y-1"
                >
                  <Calendar className="w-5 h-5 group-hover:animate-pulse" /> {id.startsWith('intl-') ? 'Request Travel Itinerary' : 'Custom Request Details'}
                </button>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Safe & Secure Payments via Stripe
                </div>
              </div>
            </section>
            
            <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl">
               <h3 className="text-lg font-bold text-white mb-4">You Might Also Like</h3>
               <div className="flex flex-col gap-3">
                 <div className="flex items-center gap-4 group cursor-pointer hover:bg-gray-800 p-2 rounded-xl transition-colors">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                      <img src="https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400" className="w-full h-full object-cover group-hover:scale-110 transition-transform"/>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Neon Shadows</h4>
                      <p className="text-xs text-gray-400">Synthwave DJ</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 group cursor-pointer hover:bg-gray-800 p-2 rounded-xl transition-colors">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                      <img src="https://images.unsplash.com/photo-1621360841013-c76831f1228e?w=400" className="w-full h-full object-cover group-hover:scale-110 transition-transform"/>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Acoustic Dreamers</h4>
                      <p className="text-xs text-gray-400">Indie Folk Band</p>
                    </div>
                 </div>
               </div>
            </section>
          </div>
        </div>
      </div>
      
      {showBookingForm && (
        <FirebaseBookingForm 
          artistId={artist.id || artist._id || id} 
          artistName={artist.stageName || artist.name} 
          hourlyRate={artist.hourlyRate || 250}
          onClose={() => setShowBookingForm(false)} 
          clientId={user?._id || (user as any)?.uid} 
          prefilledSlot={selectedSlot || undefined}
        />
      )}
    </div>
  );
}
