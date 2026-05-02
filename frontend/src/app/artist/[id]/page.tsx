'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getArtistFromFirestore, getArtistBookings } from '@/lib/firebaseBookingAPI';
import { API_BASE_URL } from '@/lib/api';
import { FirebaseBookingForm } from '@/components/FirebaseBookingForm';
import { intervalsOverlapHM, resolvePublishedSlotForPresetColumn, slotCalendarDay } from '@/lib/slotIntervals';
import { isSingleGigPerDayCategory } from '@/lib/artistCalendarMode';
import { useAuth } from '@/contexts';
import { MapPin, Star, Mic2, Calendar, Music2, ArrowLeft, CalendarCheck, CheckCircle2, Zap, UserCheck, ShieldCheck } from 'lucide-react';
import { FaInstagram, FaSpotify, FaYoutube } from 'react-icons/fa';

interface ArtistProfileData {
  id?: string;
  _id?: string;
  name?: string;
  stageName?: string;
  category?: string;
  artistType?: string;
  location?: string;
  hourlyRate?: number;
  price?: number;
  rating?: number;
  genres?: string[];
  profileImage?: string;
  coverImage?: string;
  biography?: string;
  bio?: string;
  socialLinks?: {
    instagram?: string;
    youtube?: string;
    spotify?: string;
  };
  experience?: string;
  yearsOfExperience?: string;
  availability?: boolean;
  user?: {
    name?: string;
    profileImage?: string;
  };
}

interface BookingSlotData {
  eventDate: string;
  status?: string;
  paymentStatus?: string;
  startTime: string;
  endTime: string;
  eventTitle?: string;
  location?: string;
}

interface BookingLocation {
  venue?: string;
  address?: string;
  city?: string;
  country?: string;
}

interface PublishedAvailabilitySlot {
  _id?: string;
  date: string;
  startTime: string;
  endTime: string;
  status?: string;
  bookingId?: {
    eventLocation?: BookingLocation;
    eventType?: string;
  };
}

interface AuthUserWithIds {
  id?: string;
  _id?: string;
  uid?: string;
}

export default function ArtistProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const authUser = user as AuthUserWithIds | null | undefined;
  const [artist, setArtist] = useState<ArtistProfileData | null>(null);
  const [bookings, setBookings] = useState<BookingSlotData[]>([]);
  const [publishedAvailability, setPublishedAvailability] = useState<PublishedAvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{date: string, start: string, end: string} | null>(null);
  const [selectedBookedSlot, setSelectedBookedSlot] = useState<{
    title: string;
    date: string;
    time: string;
    location: string;
  } | null>(null);

  useEffect(() => {
    async function loadArtist() {
      if (!id) return;
      try {
        const [firebaseArtistData, bookingData] = await Promise.all([
          getArtistFromFirestore(id),
          getArtistBookings(id)
        ]);
        let artistData = firebaseArtistData as ArtistProfileData | null;

        /** Merge category/type from Mongo so Bands/DJs get day-based calendars even when a Firestore doc exists. */
        if (artistData && !id.startsWith("intl-")) {
          try {
            const profileRes = await fetch(`${API_BASE_URL}/api/artists/${id}`);
            const profileData: { success?: boolean; artist?: ArtistProfileData } = await profileRes.json();
            if (profileRes.ok && profileData?.success && profileData?.artist) {
              const b = profileData.artist;
              artistData = {
                ...artistData,
                category: artistData.category ?? b.category ?? b.artistType,
                artistType: artistData.artistType ?? b.artistType ?? b.category,
              };
            }
          } catch {
            /* ignore */
          }
        }

        // Fallback to backend artist profile for newly registered local artists.
        if (!artistData && !id.startsWith('intl-')) {
          try {
            const profileRes = await fetch(`${API_BASE_URL}/api/artists/${id}`);
            const profileData: { success?: boolean; artist?: ArtistProfileData } = await profileRes.json();
            if (profileRes.ok && profileData?.success && profileData?.artist) {
              const backendArtist = profileData.artist;
              artistData = {
                id,
                _id: id,
                name: backendArtist?.name || backendArtist?.user?.name,
                stageName: backendArtist?.name || backendArtist?.user?.name,
                category: backendArtist?.category || backendArtist?.artistType || 'Musician',
                artistType: backendArtist?.artistType,
                location: backendArtist?.location || '',
                hourlyRate: backendArtist?.hourlyRate || 0,
                rating: typeof backendArtist?.rating === 'number' ? backendArtist.rating : 0,
                genres: Array.isArray(backendArtist?.genres) ? backendArtist.genres : [],
                profileImage: backendArtist?.profileImage || backendArtist?.user?.profileImage || '',
                coverImage: backendArtist?.coverImage || '',
                biography: backendArtist?.bio || '',
                socialLinks: backendArtist?.socialLinks || {},
                experience: backendArtist?.yearsOfExperience || backendArtist?.experience || '',
                availability: true,
              };
            }
          } catch (profileErr) {
            console.error("Error loading backend artist profile:", profileErr);
          }
        }

        setArtist(artistData);
        setBookings((bookingData || []) as unknown as BookingSlotData[]);

        // Pull published availability from backend so only published slots are bookable.
        if (!id.startsWith('intl-')) {
          try {
            const res = await fetch(`${API_BASE_URL}/api/availability/artist/${id}?_=${Date.now()}`);
            const data = await res.json();
            if (res.ok && data?.success && Array.isArray(data.availability)) {
              setPublishedAvailability(data.availability as PublishedAvailabilitySlot[]);
            } else {
              setPublishedAvailability([]);
            }
          } catch {
            setPublishedAvailability([]);
          }
        } else {
          setPublishedAvailability([]);
        }
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
        <p className="text-gray-400 mb-8 text-lg">This stage is empty. The artist you&apos;re looking for doesn&apos;t exist.</p>
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
  const formatYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getBookingForSlotWindow = (dateStr: string, start: string, end: string) => {
    const endAdj = end === "00:00" ? "24:00" : end;
    return bookings.find((b) => {
      if (b.eventDate !== dateStr || b.status === "cancelled" || b.paymentStatus === "refunded") return false;
      const bEnd = b.endTime === "00:00" ? "24:00" : b.endTime;
      return intervalsOverlapHM(b.startTime, bEnd, start, endAdj);
    });
  };

  const singleGigPerDay = !id.startsWith("intl-") && isSingleGigPerDayCategory(artist.category, artist.artistType);

  const getPublishedSlotForDay = (dateStr: string) => {
    return publishedAvailability.find((slot) => {
      const slotDate = formatYYYYMMDD(new Date(slot.date));
      return slotDate === dateStr;
    });
  };

  const getBookingForDay = (dateStr: string) => {
    return bookings.find((b) => {
      if (b.eventDate !== dateStr || b.status === "cancelled" || b.paymentStatus === "refunded") return false;
      return true;
    });
  };

  const formatBackendBookingLocation = (slot?: PublishedAvailabilitySlot) => {
    const location = slot?.bookingId?.eventLocation;
    if (!location) return "";

    return [location.venue, location.address, location.city, location.country]
      .filter(Boolean)
      .join(", ");
  };

  const getBookedSlotDetails = (
    booking: BookingSlotData | undefined,
    publishedSlot: PublishedAvailabilitySlot | undefined,
    dateString: string,
    slot: { start: string; end: string }
  ) => {
    const location = booking?.location || formatBackendBookingLocation(publishedSlot);
    if (!location) return null;

    return {
      title: booking?.eventTitle || publishedSlot?.bookingId?.eventType || "Booked event",
      date: dateString,
      time: `${publishedSlot ? `${publishedSlot.startTime} - ${publishedSlot.endTime}` : `${slot.start} - ${slot.end}`}`,
      location,
    };
  };

  /** Client calendar cell: reflects published backend times (not only preset anchors). */
  const renderClientAvailabilityCell = (
    dateString: string,
    publishedSlot: PublishedAvailabilitySlot,
  ) => {
    const booking = getBookingForSlotWindow(dateString, publishedSlot.startTime, publishedSlot.endTime);
    const slotTimes = { start: publishedSlot.startTime, end: publishedSlot.endTime };
    const isReserved = publishedSlot.status === "Requested" || publishedSlot.status === "Booked";
    const bookedSlotDetails = getBookedSlotDetails(booking, publishedSlot, dateString, slotTimes);
    const canShowBookedLocation =
      !!(publishedSlot.status === "Booked" || booking) && !!bookedSlotDetails;

    if (publishedSlot.status === "Blocked" || publishedSlot.status === "Draft") {
      return (
        <div className="flex flex-col items-center justify-center p-1 sm:p-2 rounded bg-gray-950/60 border border-red-500/20 h-full text-center min-h-[4rem]">
          <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-red-300 uppercase tracking-wider">
            Blocked
          </span>
          <span className="text-[9px] text-gray-400 mt-1">{publishedSlot.startTime} – {publishedSlot.endTime}</span>
        </div>
      );
    }

    if (booking || isReserved) {
      return (
        <button
          type="button"
          onClick={() => {
            if (canShowBookedLocation && bookedSlotDetails) {
              setSelectedBookedSlot(bookedSlotDetails);
            }
          }}
          disabled={!canShowBookedLocation}
          title={canShowBookedLocation ? `View booked location: ${bookedSlotDetails?.location}` : "Booked"}
          className={`flex flex-col items-center justify-center p-1 sm:p-2 rounded bg-red-500/5 border border-red-500/10 h-full text-center w-full transition-colors min-h-[4rem] ${
            canShowBookedLocation ? "hover:bg-red-500/10 cursor-pointer" : "cursor-default"
          }`}
        >
          <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-red-400 uppercase tracking-wider mb-0.5 sm:mb-1">
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-500" /> Booked
          </span>
          <span className="text-[9px] text-gray-400">{publishedSlot.startTime} – {publishedSlot.endTime}</span>
          {booking && (
            <span className="text-[9px] sm:text-[11px] text-gray-400 font-medium truncate w-full px-0.5" title={`${booking.eventTitle} ${booking.location ? `- ${booking.location}` : ""}`}>
              {booking.eventTitle}
            </span>
          )}
          {booking?.location && (
            <span className="text-[8px] sm:text-[10px] text-gray-500 truncate w-full flex items-center justify-center gap-0.5 mt-0.5 px-0.5">
              <MapPin size={10} className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> {booking.location.split(",")[0]}
            </span>
          )}
          {canShowBookedLocation && !booking?.location && (
            <span className="text-[8px] sm:text-[10px] text-gray-500 truncate w-full flex items-center justify-center gap-0.5 mt-0.5 px-0.5">
              <MapPin size={10} className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> {bookedSlotDetails?.location.split(",")[0]}
            </span>
          )}
        </button>
      );
    }

    if (publishedSlot.status === "Available" && !booking) {
      return (
        <div
          className="flex flex-col items-center justify-center p-1 sm:p-2 rounded bg-emerald-500/5 border border-emerald-500/10 h-full hover:bg-emerald-500/10 transition-colors group cursor-pointer min-h-[4rem]"
          onClick={() => openInteractiveModal(dateString, publishedSlot.startTime, publishedSlot.endTime)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") openInteractiveModal(dateString, publishedSlot.startTime, publishedSlot.endTime);
          }}
          role="button"
          tabIndex={0}
        >
          <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5 sm:mb-1">
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" /> Free
          </span>
          <span className="text-[9px] text-gray-400">{publishedSlot.startTime} – {publishedSlot.endTime}</span>
          <button
            type="button"
            className="mt-0.5 sm:mt-1 px-1 sm:px-2 py-1 sm:py-1.5 bg-emerald-600/80 hover:bg-emerald-500 rounded text-[9px] sm:text-[11px] text-white font-bold transition-all shadow-sm w-full opacity-80 group-hover:opacity-100"
          >
            Book Now
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-1 sm:p-2 rounded bg-gray-950/60 border border-white/10 h-full text-center min-h-[4rem]">
        <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">
          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-gray-600" /> Unavailable
        </span>
      </div>
    );
  };

  const defaultMapLocation = artist.location || "Sri Lanka";
  const activeMapLocation = selectedBookedSlot?.location || defaultMapLocation;
  const activeMapTitle = selectedBookedSlot?.title || `${artist.stageName || artist.name} Location`;
  const activeMapSubtitle = selectedBookedSlot
    ? `${selectedBookedSlot.date} - ${selectedBookedSlot.time}`
    : "Artist location preview";
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(activeMapLocation)}&output=embed`;

  return (
    <div className="min-h-screen bg-[#07040f] pb-20 relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-64 -left-24 h-80 w-80 rounded-full bg-fuchsia-600/10 blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>
      <div 
        className="w-full h-56 md:h-72 lg:h-[360px] bg-cover bg-center relative"
        style={{ backgroundImage: `url(${coverImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#07040f] via-[#120A20]/80 to-black/30"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-violet-950/70 via-transparent to-fuchsia-950/50 mix-blend-screen"></div>
        
        <button onClick={() => router.back()} className="absolute top-6 left-6 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-violet-600 transition-colors z-10 shadow-lg border border-white/10">
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        {/* Main Identity Card */}
        <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl shadow-violet-950/40 p-5 sm:p-6 flex flex-col md:flex-row gap-5 md:gap-6 items-start ring-1 ring-white/5 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 left-20 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
          
          <div className="flex-shrink-0 w-28 h-28 md:w-40 md:h-40 rounded-3xl overflow-hidden border-4 border-violet-500/20 shadow-2xl shadow-black/40 bg-gray-700 relative">
            <img src={profileImage} alt={artist.stageName || artist.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
            <div className="absolute top-3 right-3 bg-emerald-400 rounded-full w-4 h-4 border-2 border-gray-950 shadow-[0_0_16px_rgba(52,211,153,0.8)]" title="Online or Active recently"></div>
          </div>

           <div className="flex-1 pt-2 w-full relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start lg:items-center gap-4 mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-violet-300 font-black mb-2">Featured Artist</p>
                <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-100 to-fuchsia-300 mb-2 flex items-center gap-3">
                  {artist.stageName || artist.name}
                  <ShieldCheck className="text-fuchsia-300 w-6 h-6 sm:w-8 sm:h-8" />
                </h1>
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300 font-medium mt-3">
                  {artist.category && (
                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10"><Mic2 size={14} className="text-violet-300" /> {artist.category}</span>
                  )}
                  {artist.location && (
                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10"><MapPin size={14} className="text-fuchsia-300" /> {artist.location}</span>
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
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10">
              <div className="flex flex-col rounded-2xl bg-white/[0.04] border border-white/10 p-2.5">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Bookings</span>
                <span className="text-lg text-white font-bold flex items-center gap-1.5"><CheckCircle2 size={16} className="text-green-400"/> {mockStats.totalBookings}+</span>
              </div>
              <div className="flex flex-col rounded-2xl bg-white/[0.04] border border-white/10 p-2.5">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Response Time</span>
                <span className="text-lg text-white font-bold flex items-center gap-1.5"><Zap size={16} className="text-yellow-400"/> {mockStats.responseTime}</span>
              </div>
              <div className="flex flex-col rounded-2xl bg-white/[0.04] border border-white/10 p-2.5">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Experience</span>
                <span className="text-lg text-white font-bold flex items-center gap-1.5"><UserCheck size={16} className="text-blue-400"/> {artist.experience || '3+ Years'}</span>
              </div>
              <div className="flex flex-col rounded-2xl bg-white/[0.04] border border-white/10 p-2.5">
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
          
           {/* Left Column - Details */}
           <div className="contents">
            <section className="lg:col-span-2 h-full bg-white/[0.05] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/20 relative overflow-hidden group backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110 duration-700 blur-2xl"></div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <Music2 className="text-fuchsia-400 w-5 h-5" /> About {artist.stageName || artist.name}
              </h2>
              
              <p className="text-gray-300 leading-relaxed max-w-prose whitespace-pre-wrap text-sm sm:text-[15px] font-light mb-5">
                {artist.biography || "No biography provided yet. But this artist's talent speaks for itself! Get ready to be amazed by the ultimate performance. Let the music take control and connect with the vibe."}
              </p>
              
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a
                  href={artist.socialLinks?.instagram || "https://instagram.com/yohanimusic"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 bg-gray-950/60 border border-white/10 p-3 rounded-2xl text-pink-400 hover:text-pink-300 hover:border-pink-400/40 transition-all"
                >
                  <FaInstagram className="w-5 h-5" />
                  <span className="font-semibold text-sm">Instagram</span>
                </a>
                <a
                  href={artist.socialLinks?.youtube || "https://youtube.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 bg-gray-950/60 border border-white/10 p-3 rounded-2xl text-red-400 hover:text-red-300 hover:border-red-400/40 transition-all"
                >
                  <FaYoutube className="w-5 h-5" />
                  <span className="font-semibold text-sm">YouTube</span>
                </a>
                <a
                  href={artist.socialLinks?.spotify || "https://spotify.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 bg-gray-950/60 border border-white/10 p-3 rounded-2xl text-emerald-400 hover:text-emerald-300 hover:border-emerald-400/40 transition-all"
                >
                  <FaSpotify className="w-5 h-5" />
                  <span className="font-semibold text-sm">Spotify</span>
                </a>
              </div>

              <div className="mt-5">
                <h3 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-3">Musical DNA</h3>
                <div className="flex flex-wrap gap-2">
                  {artist.genres && artist.genres.length > 0 ? (
                    artist.genres.map((g: string, i: number) => (
                      <span key={i} className="px-4 py-1.5 bg-violet-500/10 border border-violet-500/20 hover:border-fuchsia-400/50 text-gray-200 rounded-full text-xs font-semibold hover:shadow-lg hover:shadow-violet-500/10 transition-all cursor-default">
                        {g}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 italic">Not specified</span>
                  )}
                </div>
              </div>
            </section>

            {/* Right Column - Quick Booking */}
            <div className="space-y-6 h-full">
              <section className="bg-white/[0.05] border border-white/10 rounded-3xl p-5 shadow-xl shadow-black/20 h-full backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <CalendarCheck className="text-violet-400" /> {id.startsWith('intl-') ? 'Reserve Travel Plan' : 'Quick Booking'}
                  </h2>
                  <p className="text-sm font-medium text-gray-500 mb-4">{id.startsWith('intl-') ? 'Start your international booking process.' : 'Select a custom schedule for your event.'}</p>
                </div>
                
                <div className="border-t border-white/10 pt-5 mt-2">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400 font-medium">{id.startsWith('intl-') ? 'Starting Rate' : 'Standard Rate'}</span>
                    <span className="text-2xl font-black text-white">$ {artist.hourlyRate || 250}{!id.startsWith('intl-') && <span className="text-sm font-normal text-gray-500">/hr</span>}</span>
                  </div>
                  <button
                    onClick={() => openInteractiveModal()}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-base hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)] hover:shadow-[0_0_60px_-10px_rgba(168,85,247,0.7)] group transform hover:-translate-y-1"
                  >
                    <Calendar className="w-5 h-5 group-hover:animate-pulse" /> {id.startsWith('intl-') ? 'Request Travel Itinerary' : 'Custom Request Details'}
                  </button>
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Safe & Secure Payments via Stripe
                  </div>
                </div>
              </section>
            </div>

            {/* Live Availability Engine MOVED to Main Column Conditionally */}
            {id.startsWith('intl-') ? (
              <section className="lg:col-span-3 bg-white/[0.05] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/20 overflow-hidden relative backdrop-blur-xl">
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
                    <div className="bg-gray-950/50 rounded-2xl p-4 border border-white/10">
                      <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Destination
                      </h3>
                      <p className="text-lg font-semibold text-white">Sri Lanka</p>
                    </div>
                    <div className="bg-gray-950/50 rounded-2xl p-4 border border-white/10">
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
                        Reservations require coordinating travel dates strictly with the artist&apos;s management.
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
            <section className="lg:col-span-3 bg-white/[0.05] border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl shadow-black/20 overflow-hidden backdrop-blur-xl">
              <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-3">
                <CalendarCheck className="text-violet-400 w-5 h-5" /> Booking Calendar
              </h2>
              <p className="text-xs font-medium text-gray-500 mb-4">
                {singleGigPerDay ? "Bands/DJs publish one slot per calendar day — book the day's advertised show window." : "Upcoming slots available to book."}
              </p>
              
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
                <div className="flex flex-col gap-2 pb-2 overflow-x-auto">
                <table className={`w-full text-left border-collapse table-fixed ${singleGigPerDay ? "min-w-[300px]" : "min-w-[620px]"}`}>
                  <thead>
                    <tr>
                      <th className="p-1 sm:p-2 bg-gray-950/70 border-b border-white/10 text-gray-400 font-semibold uppercase text-[9px] sm:text-[10px] w-14 sm:w-20 lg:w-24">Date</th>
                      {singleGigPerDay ? (
                        <th className="p-1 sm:p-2 bg-gray-950/70 border-b border-white/10 text-gray-400 font-semibold uppercase text-[9px] sm:text-[10px] text-center border-l border-white/10">
                          Day availability
                        </th>
                      ) : (
                        TIME_SLOTS.map((slot, i) => (
                          <th key={i} className="p-1 sm:p-2 bg-gray-950/70 border-b border-white/10 text-gray-400 font-semibold uppercase text-[9px] sm:text-[10px] text-center border-l border-white/10 w-[18%] sm:w-1/4">
                            {slot.label}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-gray-950/30 divide-y divide-white/10">
                    {upcomingDates.map((date) => {
                      const dateString = formatYYYYMMDD(date);
                      const isToday = dateString === formatYYYYMMDD(today);
                      const slotsOnDay = publishedAvailability.filter(
                        (s) => slotCalendarDay(s.date) === dateString,
                      );
                      const usedAssign = new Set<string>();
                      const columnPublished = TIME_SLOTS.map((tp) => {
                        const p = resolvePublishedSlotForPresetColumn(slotsOnDay, tp.start, tp.end, usedAssign);
                        if (p?._id) usedAssign.add(String(p._id));
                        return p;
                      });
                      const leftoverPublished = slotsOnDay.filter(
                        (s) => s._id && !usedAssign.has(String(s._id)),
                      );
                      const emptyPresetCell = (
                        <div className="flex flex-col items-center justify-center p-1 sm:p-2 rounded bg-gray-950/60 border border-white/10 h-full text-center min-h-[4rem]">
                          <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-gray-600" /> Unavailable
                          </span>
                          <span className="text-[8px] sm:text-[10px] text-gray-500">Not published</span>
                        </div>
                      );

                      return (
                        <React.Fragment key={dateString}>
                        <tr className={isToday ? "bg-violet-500/10" : "hover:bg-white/[0.03] transition-colors"}>
                          <td className="p-1 sm:p-2 border-r border-white/10">
                            <div className="flex flex-col">
                              <span className={`font-bold text-[10px] sm:text-xs leading-tight ${isToday ? 'text-yellow-400' : 'text-gray-200'}`}>
                                {date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                              </span>
                              {isToday && <span className="text-[8px] sm:text-[9px] text-yellow-500/70 font-semibold tracking-wider uppercase mt-0.5">Today</span>}
                            </div>
                          </td>
                          {singleGigPerDay ? (() => {
                            const publishedSlot = getPublishedSlotForDay(dateString);
                            const dayBooking = getBookingForDay(dateString);
                            const slotTimes = publishedSlot ? { start: publishedSlot.startTime, end: publishedSlot.endTime } : TIME_SLOTS[0];
                            const bookedSlotDetails = getBookedSlotDetails(dayBooking, publishedSlot, dateString, slotTimes);
                            const canShowBookedLocation =
                              !!(publishedSlot?.status === "Booked" || dayBooking) && !!bookedSlotDetails;

                            if (!publishedSlot) {
                              return (
                                <td className="p-1 border-r border-white/10 align-top overflow-hidden">
                                  <div className="flex flex-col items-center justify-center p-2 rounded bg-gray-950/60 border border-white/10 h-full text-center min-h-[4.5rem]">
                                    <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                                      <div className="w-1 h-1 rounded-full bg-gray-600" /> Unavailable
                                    </span>
                                    <span className="text-[8px] text-gray-500 mt-1">Not published</span>
                                  </div>
                                </td>
                              );
                            }

                            if (publishedSlot.status === "Blocked" || publishedSlot.status === "Draft") {
                              return (
                                <td className="p-1 border-r border-white/10 align-top overflow-hidden">
                                  <div className="flex flex-col items-center justify-center p-2 rounded bg-gray-950/60 border border-red-500/20 h-full text-center min-h-[4.5rem]">
                                    <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-red-300 uppercase tracking-wider">
                                      Blocked
                                    </span>
                                    <span className="text-[9px] text-gray-400 mt-1">{publishedSlot.startTime} – {publishedSlot.endTime}</span>
                                  </div>
                                </td>
                              );
                            }

                            if (publishedSlot.status === "Requested" && !dayBooking) {
                              return (
                                <td className="p-1 border-r border-white/10 align-top overflow-hidden">
                                  <div className="flex flex-col items-center justify-center p-2 rounded bg-amber-500/5 border border-amber-500/20 h-full text-center min-h-[4.5rem]">
                                    <span className="inline-flex items-center gap-1 text-[8px] font-bold text-amber-400 uppercase tracking-wider">
                                      Requested
                                    </span>
                                    <span className="text-[9px] text-gray-400 mt-1">{publishedSlot.startTime} – {publishedSlot.endTime}</span>
                                  </div>
                                </td>
                              );
                            }

                            const isBookedCommitted = !!dayBooking || publishedSlot.status === "Booked" || publishedSlot.status === "Requested";

                            if (isBookedCommitted) {
                              return (
                                <td key="day" className="p-1 border-r border-white/10 align-top overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (canShowBookedLocation && bookedSlotDetails) {
                                        setSelectedBookedSlot(bookedSlotDetails);
                                      }
                                    }}
                                    disabled={!canShowBookedLocation}
                                    title={
                                      publishedSlot.status === "Requested"
                                        ? "Booking request pending"
                                        : canShowBookedLocation
                                          ? `View booked location: ${bookedSlotDetails?.location}`
                                          : "Booked"
                                    }
                                    className={`flex flex-col items-center justify-center p-1 sm:p-2 rounded border h-full text-center w-full transition-colors min-h-[4.5rem] ${
                                      publishedSlot.status === "Requested"
                                        ? "bg-amber-500/5 border-amber-500/20 cursor-default"
                                        : `bg-red-500/5 border-red-500/10 ${canShowBookedLocation ? "hover:bg-red-500/10 cursor-pointer" : "cursor-default"}`
                                    }`}
                                  >
                                    <span className={`inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mb-0.5 ${
                                      publishedSlot.status === "Requested" ? "text-amber-400" : "text-red-400"
                                    }`}>
                                      <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${publishedSlot.status === "Requested" ? "bg-amber-500" : "bg-red-500"}`} />
                                      {publishedSlot.status === "Requested" ? "Requested" : "Booked"}
                                    </span>
                                    <span className="text-[9px] text-gray-400">{publishedSlot.startTime} – {publishedSlot.endTime}</span>
                                    {dayBooking && (
                                      <span className="text-[9px] sm:text-[11px] text-gray-400 font-medium truncate w-full px-0.5 mt-0.5" title={`${dayBooking.eventTitle}${dayBooking.location ? ` — ${dayBooking.location}` : ""}`}>
                                        {dayBooking.eventTitle}
                                      </span>
                                    )}
                                    {dayBooking?.location && (
                                      <span className="text-[8px] sm:text-[10px] text-gray-500 truncate w-full flex items-center justify-center gap-0.5 mt-0.5 px-0.5">
                                        <MapPin size={10} className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> {dayBooking.location.split(",")[0]}
                                      </span>
                                    )}
                                    {canShowBookedLocation && !dayBooking?.location && bookedSlotDetails?.location && (
                                      <span className="text-[8px] sm:text-[10px] text-gray-500 truncate w-full flex items-center justify-center gap-0.5 mt-0.5 px-0.5">
                                        <MapPin size={10} className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> {bookedSlotDetails.location.split(",")[0]}
                                      </span>
                                    )}
                                  </button>
                                </td>
                              );
                            }

                            if (publishedSlot.status === "Available" && !dayBooking) {
                              return (
                                <td className="p-1 border-r border-white/10 align-top overflow-hidden">
                                  <div
                                    className="flex flex-col items-center justify-center p-2 rounded bg-emerald-500/5 border border-emerald-500/10 h-full hover:bg-emerald-500/10 transition-colors group cursor-pointer min-h-[4.5rem]"
                                    onClick={() => openInteractiveModal(dateString, publishedSlot.startTime, publishedSlot.endTime)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ")
                                        openInteractiveModal(dateString, publishedSlot.startTime, publishedSlot.endTime);
                                    }}
                                    role="button"
                                    tabIndex={0}
                                  >
                                    <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                                      Available
                                    </span>
                                    <span className="text-[9px] text-gray-400 mt-0.5">{publishedSlot.startTime} – {publishedSlot.endTime}</span>
                                    <button
                                      type="button"
                                      className="mt-1 px-2 py-1 bg-emerald-600/80 hover:bg-emerald-500 rounded text-[9px] sm:text-[11px] text-white font-bold transition-all shadow-sm w-full max-w-[140px]"
                                    >
                                      Book Now
                                    </button>
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td className="p-1 border-r border-white/10 align-top overflow-hidden">
                                <div className="flex flex-col items-center justify-center p-2 rounded bg-gray-950/60 border border-white/10 h-full text-center min-h-[4.5rem]">
                                  <span className="text-[8px] font-bold text-gray-500 uppercase">Unavailable</span>
                                </div>
                              </td>
                            );
                          })()
                          : TIME_SLOTS.map((_, sIdx) => {
                              const slotPub = columnPublished[sIdx];
                              return (
                                <td key={sIdx} className="p-1 border-r border-white/10 align-top overflow-hidden">
                                  {slotPub
                                    ? renderClientAvailabilityCell(dateString, slotPub)
                                    : emptyPresetCell}
                                </td>
                              );
                            })}
                        </tr>
                        {!singleGigPerDay && leftoverPublished.length > 0 ? (
                          <tr className="bg-gray-950/50 border-t border-white/10">
                            <td colSpan={5} className="p-2 sm:p-3 border-white/10 align-top">
                              <div className="flex flex-wrap gap-2 items-stretch">
                                <span className="text-[9px] uppercase tracking-wide text-violet-300/90 font-semibold w-full shrink-0">
                                  More published times · {dateString}
                                </span>
                                {leftoverPublished.map((p) => (
                                  <div key={String(p._id)} className="flex-1 min-w-[140px] max-w-[240px]">
                                    {renderClientAvailabilityCell(dateString, p)}
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
                </div>

                <div className="rounded-2xl overflow-hidden border border-violet-500/20 bg-gray-950/60 h-full min-h-[300px] flex flex-col">
                  <div className="p-3 border-b border-white/10 flex flex-col gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-violet-300 font-bold">Location Map</p>
                      <h3 className="text-white font-bold mt-1">{activeMapTitle}</h3>
                      <p className="text-xs text-gray-400 mt-1">{activeMapSubtitle}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <MapPin className="w-4 h-4 text-fuchsia-400 shrink-0" />
                      <span className="truncate" title={activeMapLocation}>{activeMapLocation}</span>
                    </div>
                  </div>
                  <iframe
                    title={`Map for ${activeMapLocation}`}
                    src={mapUrl}
                    className="w-full flex-1 min-h-60 border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </section>
            )}
          </div>
        </div>
      </div>
      
      {showBookingForm && (
        <FirebaseBookingForm 
          artistId={artist.id || artist._id || id} 
          artistName={artist.stageName || artist.name || "Artist"} 
          hourlyRate={artist.hourlyRate || 250}
          onClose={() => setShowBookingForm(false)} 
          clientId={authUser?.id || authUser?._id || authUser?.uid} 
          availableSlots={publishedAvailability}
          prefilledSlot={selectedSlot || undefined}
          singleGigPerDay={singleGigPerDay}
        />
      )}
    </div>
  );
}
