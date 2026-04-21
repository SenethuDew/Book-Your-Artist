"use client";

import Link from "next/link";
import { useAuth } from "@/contexts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getAllArtistsFromFirestore } from "@/lib/firebaseBookingAPI";
import {
  Search,
  MapPin,
  Calendar,
  Star,
  ChevronDown,
  Bell,
  MessageSquare,
  Heart,
  Clock,
  DollarSign,
  Filter,
  SlidersHorizontal,
  Music,
  Mic2,
  User,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ArrowRight,
  LayoutDashboard,
  LogOut,
  Info,
  Settings
} from "lucide-react";

interface Booking {
  _id: string;
  eventDate: string;
  eventType: string;
  status: string;
  totalPrice: number;
  artistId?: {
    name: string;
    email: string;
    category?: string;
    _id?: string;
    profileImage?: string;
    profileImageUrl?: string;
  };
}

interface Stats {
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
}

const CATEGORIES = [
  {
    id: "dj",
    title: "DJs",
    icon: <SlidersHorizontal className="w-8 h-8 text-fuchsia-400" />,
    desc: "Party & Club DJs",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80",
  },
  {
    id: "band",
    title: "Live Bands",
    icon: <Music className="w-8 h-8 text-blue-400" />,
    desc: "Rock, Jazz & Pop",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&q=80",
  },
  {
    id: "singer",
    title: "Singers",
    icon: <Mic2 className="w-8 h-8 text-purple-400" />,
    desc: "Solo Vocalists",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80",
  },
];

const BOOKING_TIPS = [
  {
    icon: <Calendar className="w-8 h-8 text-blue-400" />,
    title: "Book in Advance",
    description: "Book your event at least 2 weeks ahead for better availability",
  },
  {
    icon: <Star className="w-8 h-8 text-yellow-400" />,
    title: "Check Ratings",
    description: "Read reviews from other clients to find the perfect match",
  },
  {
    icon: <DollarSign className="w-8 h-8 text-green-400" />,
    title: "Compare Prices",
    description: "Filter by hourly rate to find artists within your budget",
  },
  {
    icon: <MessageSquare className="w-8 h-8 text-purple-400" />,
    title: "Describe Event",
    description: "Provide details to help artists prepare a great performance",
  },
];

function ClientHomeContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
  });

  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [recommendedArtists, setRecommendedArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        setLoading(true);

        // Fetch stats
        const statsRes = await fetch(`${API_BASE_URL}/api/bookings/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }

        // Fetch recent bookings
        const bookingsRes = await fetch(
          `${API_BASE_URL}/api/bookings/my?limit=4&sort=-eventDate`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const bookingsData = await bookingsRes.json();
        if (bookingsData.success) {
          setRecentBookings(bookingsData.bookings || []);
        }

        // Fetch recommended artists
        const firestoreArtists = await getAllArtistsFromFirestore();
        if (firestoreArtists && firestoreArtists.length > 0) {
          setRecommendedArtists(firestoreArtists.slice(0, 3));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "paid":
        return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "pending":
        return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "completed":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "cancelled":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0512] text-white selection:bg-violet-500/30 selection:text-violet-200">
      {/* STICKY NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-gray-950/60">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Brand Logo & Links */}
            <div className="flex items-center gap-8">
              <Link href="/home/client" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center font-black shadow-[0_0_20px_-5px_rgba(139,92,246,0.6)] text-white group-hover:scale-105 transition-transform">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-extrabold tracking-tight hidden lg:block">
                  BookYour<span className="text-violet-400">Artist</span>
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5">
                <Link
                  href="/home/client"
                  className="px-4 py-2 rounded-full bg-white/10 text-white text-sm font-semibold transition-all shadow-inner"
                >
                  Home
                </Link>
                <Link
                  href="/search"
                  className="px-4 py-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all"
                >
                  Browse Artists
                </Link>
                <Link
                  href="/categories"
                  className="px-4 py-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all"
                >
                  Categories
                </Link>
                <Link
                  href="/about"
                  className="px-4 py-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all"
                >
                  About
                </Link>
              </div>
            </div>

            {/* User Controls */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2 pr-4 border-r border-white/10">
                <Link
                  href="/messages"
                  className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all relative"
                >
                  <MessageSquare className="w-5 h-5" />
                </Link>
                <button className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-fuchsia-500 rounded-full ring-2 ring-gray-950"></span>
                </button>
                <Link
                  href="/bookings"
                  className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                  <Calendar className="w-5 h-5" />
                </Link>
                <Link
                  href="/favorites"
                  className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                  <Heart className="w-5 h-5" />
                </Link>
              </div>

              {/* Profile Dropdown */}
              <div className="relative isolate">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 p-1.5 pr-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 flex items-center justify-center font-bold text-xs ring-2 ring-white/10 group-hover:ring-violet-500/50 transition-all shadow-inner">
                    {user?.name?.charAt(0) || "C"}
                  </div>
                  <div className="hidden sm:block text-left max-w-[120px]">
                    <p className="text-sm font-bold truncate leading-tight">
                      {user?.name || "Client"}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
                </button>

                {isProfileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-3 w-56 bg-[#120A20] border border-white/10 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] py-2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                      <div className="px-4 py-3 border-b border-white/5 mb-2">
                        <p className="text-white font-bold">{user?.name}</p>
                        <p className="text-gray-400 text-xs truncate">
                          {user?.email}
                        </p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm"
                      >
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                      <Link
                        href="/bookings"
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm"
                      >
                        <Calendar className="w-4 h-4" /> Booking History
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm"
                      >
                        <Settings className="w-4 h-4" /> Settings
                      </Link>
                      <div className="h-px bg-white/5 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 w-full text-left transition-colors font-medium text-sm"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16 sm:space-y-24">
        
        {/* HERO SECTION */}
        <section className="relative rounded-[2.5rem] overflow-hidden isolate shadow-2xl border border-white/5">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity z-[-1]"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1540039155733-d7696d4eb98e?w=1600&q=80")',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0A0512] via-[#0A0512]/90 to-violet-950/40 z-[-1]" />
          <div className="absolute -top-[30%] -right-[10%] w-[60%] h-[120%] bg-fuchsia-600/20 blur-[120px] rounded-full pointer-events-none z-[-1]" />
          <div className="absolute -bottom-[30%] -left-[10%] w-[60%] h-[120%] bg-violet-600/20 blur-[120px] rounded-full pointer-events-none z-[-1]" />

          <div className="px-6 sm:px-12 lg:px-16 py-20 sm:py-28 relative z-10 flex flex-col items-start min-h-[500px] justify-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs sm:text-sm font-bold mb-8 tracking-wide shadow-sm backdrop-blur-md">
              <Star className="w-4 h-4 fill-violet-400 text-violet-400" /> Premium Connect Experience
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-500 mb-6 tracking-tight leading-[1.1] max-w-4xl">
              Elevate Your Event With Phenomenal Talent.
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl font-medium leading-relaxed">
              Welcome back, {user?.name?.split(" ")[0] || "Guest"}. Find top-tier DJs, live bands, and solo artists for your next unforgettable occasion. Compare, book, and enjoy.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link
                href="/search"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-[0_0_30px_-5px_rgba(168,85,247,0.5)] hover:shadow-[0_0_50px_-5px_rgba(168,85,247,0.7)] hover:-translate-y-0.5 group"
              >
                Explore Talent{" "}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/bookings"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-8 py-4 rounded-2xl transition-all backdrop-blur-sm hover:-translate-y-0.5 shadow-sm"
              >
                <Calendar className="w-5 h-5" /> View My Bookings
              </Link>
            </div>
          </div>
        </section>

        {/* INLINE SEARCH & FILTER SECTION */}
        <section className="relative -mt-28 z-20 max-w-5xl mx-auto px-4 sm:px-0">
          <div className="bg-[#120A20]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative col-span-1 md:col-span-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Who are you looking for?"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white font-medium focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-gray-600 shadow-inner"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <select
                  className="w-full bg-black/50 border border-white/10 rounded-2xl pl-12 pr-10 py-4 text-gray-300 font-medium focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all appearance-none cursor-pointer shadow-inner"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">Any Category</option>
                  <option value="DJ">DJs</option>
                  <option value="Band">Live Bands</option>
                  <option value="Singer">Singers</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              <button
                onClick={() =>
                  router.push(
                    `/search?q=\${searchQuery}&category=\${categoryFilter}`
                  )
                }
                className="w-full bg-white hover:bg-gray-200 text-gray-950 font-bold rounded-2xl py-4 flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)] active:scale-[0.98]"
              >
                Search Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* CATEGORIES SECTION */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
                Browse Categories
              </h3>
              <p className="text-gray-400 font-medium text-sm sm:text-base">
                Find the perfect genre or act type for your unique event.
              </p>
            </div>
            <Link
              href="/categories"
              className="hidden md:flex items-center gap-2 text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => (
              <Link
                href={`/search?category=${cat.title.replace("Live ", "")}`}
                key={cat.id}
                className="group relative rounded-3xl overflow-hidden aspect-video md:aspect-[4/3] border border-white/5 isolate bg-gray-900 shadow-lg"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110 z-[-2]"
                  style={{ backgroundImage: `url(${cat.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent z-[-1] opacity-90 group-hover:opacity-75 transition-opacity" />
                <div className="absolute inset-0 bg-violet-600/20 opacity-0 group-hover:opacity-100 transition-opacity z-[-1] mix-blend-overlay" />
                <div className="h-full flex flex-col justify-end p-6 sm:p-8 relative z-10 w-full transition-transform duration-300">
                  <div className="w-14 h-14 bg-gray-950/50 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:-translate-y-2 transition-transform shadow-2xl">
                    {cat.icon}
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-1">
                    {cat.title}
                  </h4>
                  <p className="text-gray-300 font-medium text-sm">{cat.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ACTIVITY STATS */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h3 className="text-2xl font-bold text-white tracking-tight">Your Activity</h3>
            <div className="h-px flex-grow bg-gradient-to-r from-white/10 to-transparent" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group relative overflow-hidden bg-[#120A20] border border-white/10 rounded-3xl p-6 hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-15px_rgba(16,185,129,0.2)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] group-hover:bg-emerald-500/20 transition-colors" />
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Confirmed</p>
                <p className="text-4xl font-black text-white">{loading ? "..." : stats.confirmed}</p>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-[#120A20] border border-white/10 rounded-3xl p-6 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-15px_rgba(245,158,11,0.2)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] group-hover:bg-amber-500/20 transition-colors" />
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 shadow-inner">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Pending</p>
                <p className="text-4xl font-black text-white">{loading ? "..." : stats.pending}</p>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-[#120A20] border border-white/10 rounded-3xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-15px_rgba(59,130,246,0.2)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] group-hover:bg-blue-500/20 transition-colors" />
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 shadow-inner">
                  <Star className="w-6 h-6" />
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Completed</p>
                <p className="text-4xl font-black text-white">{loading ? "..." : stats.completed}</p>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-[#120A20] border border-white/10 rounded-3xl p-6 hover:border-violet-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-15px_rgba(139,92,246,0.2)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-[50px] group-hover:bg-violet-500/20 transition-colors" />
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400 shadow-inner">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Total Spent</p>
                <p className="text-4xl font-black text-white">{loading ? "..." : `$${stats.totalRevenue.toFixed(0)}`}</p>
              </div>
            </div>
          </div>
        </section>

        {/* RECENT BOOKINGS & RECOMMENDED SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* RECENT BOOKINGS */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-white">Recent Bookings</h3>
              <Link
                href="/bookings"
                className="text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-2 bg-violet-500/10 px-4 py-2 rounded-full border border-violet-500/20"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-[#120A20] border border-white/5 rounded-3xl p-6 flex flex-col sm:flex-row gap-6 animate-pulse"
                  >
                    <div className="w-16 h-16 bg-white/5 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-3 mt-2">
                      <div className="h-5 bg-white/5 rounded w-1/3" />
                      <div className="h-4 bg-white/5 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentBookings.length > 0 ? (
              <div className="flex flex-col gap-4">
                {recentBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="group bg-[#120A20] border border-white/10 rounded-3xl p-5 sm:p-6 hover:border-violet-500/40 transition-all duration-300 flex flex-col sm:flex-row gap-6 items-center sm:items-start shadow-sm hover:shadow-[0_10px_30px_-15px_rgba(139,92,246,0.15)]"
                  >
                    <div className="w-16 h-16 bg-black/50 border border-white/5 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                      {booking.artistId?.category === "DJ" ? (
                        <SlidersHorizontal className="w-7 h-7 text-fuchsia-400" />
                      ) : booking.artistId?.category === "Band" ? (
                        <Music className="w-7 h-7 text-blue-400" />
                      ) : (
                        <Mic2 className="w-7 h-7 text-purple-400" />
                      )}
                    </div>
                    <div className="flex-1 w-full text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                        <h4 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors">
                          {booking.eventType}
                        </h4>
                        <span
                          className={`px-3 py-1 font-bold text-[10px] uppercase tracking-wider rounded-full border ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <Link
                        href={`/artists/${booking.artistId?._id}`}
                        className="text-gray-400 text-sm hover:text-white transition-colors mb-4 inline-block font-medium"
                      >
                        With {booking.artistId?.name || "Artist"}
                      </Link>
                      
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-sm text-gray-300 font-medium">
                          <Calendar className="w-4 h-4 text-violet-400" />{" "}
                          {formatDate(booking.eventDate)}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-white">
                          <DollarSign className="w-4 h-4 text-emerald-400" />{" "}
                          ${booking.totalPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <Link
                      href={`/bookings/${booking._id}`}
                      className="w-full sm:w-auto text-center px-5 py-2.5 bg-white/5 hover:bg-violet-600 border border-white/10 text-white font-bold rounded-xl transition-colors text-sm"
                    >
                      Details
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#120A20] border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px] hover:border-white/10 transition-colors">
                <div className="w-20 h-20 bg-black/40 border border-white/5 rounded-full flex items-center justify-center mb-6 shadow-inner text-gray-400">
                  <Calendar className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">
                  No active bookings
                </h4>
                <p className="text-gray-400 max-w-xs mb-8 text-sm leading-relaxed font-medium">
                  You haven't booked any artists yet. Ready to make your next
                  event memorable?
                </p>
                <Link
                  href="/search"
                  className="bg-white text-gray-950 hover:bg-gray-200 font-bold px-6 py-3 rounded-2xl transition shadow-lg inline-flex items-center gap-2 text-sm shrink-0"
                >
                  Browse Artists <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </section>

          {/* RECOMMENDED / FEATURED TALENT */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-white">Featured Talent</h3>
              <Link
                href="/search"
                className="text-sm font-bold text-fuchsia-400 hover:text-fuchsia-300 transition-colors flex items-center gap-2 bg-fuchsia-500/10 px-4 py-2 rounded-full border border-fuchsia-500/20"
              >
                View directory <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-col gap-4">
              {recommendedArtists.length > 0 ? (
                recommendedArtists.map((artist) => (
                  <div
                    key={artist.id || artist._id}
                    className="group bg-[#120A20] border border-white/10 p-5 sm:p-6 rounded-3xl shadow-sm hover:border-gray-500/50 transition-all flex flex-col gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-black/50 rounded-2xl overflow-hidden border border-white/10 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                        {artist.profileImage || artist.profileImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={artist.profileImage || artist.profileImageUrl}
                            alt={artist.name || artist.stageName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
                            <User className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-white truncate group-hover:text-fuchsia-400 transition-colors">
                          {artist.name || artist.stageName}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                          <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-xs text-gray-300">{artist.category || "Musician"}</span>
                          <span className="flex items-center text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20 text-xs font-bold">
                            <Star className="w-3.5 h-3.5 fill-yellow-500 mr-1" />
                            {(artist.rating || 5.0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="text-base font-black text-fuchsia-400 text-right">
                        ${artist.hourlyRate || artist.price || 0}
                        <span className="text-xs text-gray-500 block font-medium">/hr</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Link
                        href={`/artists/${artist.id || artist._id}`}
                        className="flex-1 text-center border border-white/10 hover:bg-white/5 text-white font-bold py-2.5 rounded-xl text-sm transition-all"
                      >
                        View Profile
                      </Link>
                      <Link
                        href={`/checkout/advance?artistId=${
                          artist.id || artist._id
                        }`}
                        className="flex-1 text-center bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md group-hover:shadow-[0_5px_15px_-3px_rgba(168,85,247,0.4)]"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-[#120A20] border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <div className="w-20 h-20 bg-black/40 border border-white/5 rounded-full flex items-center justify-center mb-6 shadow-inner text-gray-400">
                    <User className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    Finding talent...
                  </h4>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6 font-medium">
                    Check back soon for personalized artist recommendations based on your preferences.
                  </p>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* BOOKING TIPS CARDS (Quick Actions style) */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h3 className="text-2xl font-bold text-white">Pro Tips for Clients</h3>
            <div className="h-px flex-grow bg-gradient-to-r from-white/10 to-transparent" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BOOKING_TIPS.map((tip, index) => (
              <div
                key={index}
                className="bg-[#120A20] border border-white/5 hover:border-violet-500/30 rounded-3xl p-8 transition-all group shadow-sm hover:shadow-[0_10px_30px_-15px_rgba(139,92,246,0.2)]"
              >
                <div className="mb-6 p-4 w-fit bg-black/40 rounded-2xl group-hover:scale-110 transition-transform shadow-inner border border-white/5">
                  {tip.icon}
                </div>
                <h4 className="text-lg font-bold mb-3 text-white tracking-tight">
                  {tip.title}
                </h4>
                <p className="text-gray-400 text-sm leading-relaxed font-medium">
                  {tip.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* MODERN FOOTER */}
      <footer className="border-t border-white/5 bg-[#0A0512] pt-20 pb-10 mt-10">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
            <div className="lg:col-span-1 border-b border-white/5 lg:border-none pb-10 lg:pb-0">
              <Link
                href="/home/client"
                className="flex items-center gap-3 group mb-6 inline-flex"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center font-black shadow-lg text-white">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-extrabold tracking-tight">
                  BookYour<span className="text-violet-400">Artist</span>
                </span>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed font-medium mb-6 max-w-xs">
                The premier platform connecting talented independent musicians
                with clients for unforgettable events.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-violet-600 hover:text-white transition-all shadow-inner border border-white/5"
                >
                  <span className="sr-only">Twitter</span>
                  <span className="text-sm font-bold">𝕏</span>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-fuchsia-600 hover:text-white transition-all shadow-inner border border-white/5"
                >
                  <span className="sr-only">Instagram</span>
                  <span className="text-sm font-bold">IG</span>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all shadow-inner border border-white/5"
                >
                  <span className="sr-only">Facebook</span>
                  <span className="text-sm font-bold">FB</span>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-violet-400" /> Platform
              </h4>
              <ul className="space-y-4 text-sm font-medium text-gray-400">
                <li>
                  <Link
                    href="/search"
                    className="hover:text-violet-400 transition-colors flex items-center gap-2"
                  >
                    <ChevronRight className="w-3 h-3" /> Browse Artists
                  </Link>
                </li>
                <li>
                  <Link
                    href="/categories"
                    className="hover:text-violet-400 transition-colors flex items-center gap-2"
                  >
                    <ChevronRight className="w-3 h-3" /> Categories
                  </Link>
                </li>
                <li>
                  <Link
                    href="/how-it-works"
                    className="hover:text-violet-400 transition-colors flex items-center gap-2"
                  >
                    <ChevronRight className="w-3 h-3" /> How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-violet-400 transition-colors flex items-center gap-2"
                  >
                    <ChevronRight className="w-3 h-3" /> Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <User className="w-4 h-4 text-fuchsia-400" /> Useful Links
              </h4>
              <ul className="space-y-4 text-sm font-medium text-gray-400">
                <li>
                  <Link
                    href="/bookings"
                    className="hover:text-fuchsia-400 transition-colors flex items-center gap-2"
                  >
                    <ChevronRight className="w-3 h-3" /> My Bookings
                  </Link>
                </li>
                <li>
                  <Link
                    href="/messages"
                    className="hover:text-fuchsia-400 transition-colors flex items-center gap-2"
                  >
                    <ChevronRight className="w-3 h-3" /> Messages
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help"
                    className="hover:text-fuchsia-400 transition-colors flex items-center gap-2"
                  >
                    <ChevronRight className="w-3 h-3" /> Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-fuchsia-400 transition-colors flex items-center gap-2"
                  >
                    <ChevronRight className="w-3 h-3" /> Contact Support
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" /> Legal
              </h4>
              <ul className="space-y-4 text-sm font-medium text-gray-400">
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-blue-400 transition-colors flex items-center gap-2"
                  >
                    <ChevronRight className="w-3 h-3" /> Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-blue-400 transition-colors flex items-center gap-2"
                  >
                    <ChevronRight className="w-3 h-3" /> Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/trust"
                    className="hover:text-blue-400 transition-colors flex items-center gap-2"
                  >
                    <ChevronRight className="w-3 h-3" /> Trust & Safety
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm font-medium">
              © {new Date().getFullYear()} Book Your Artist. All rights
              reserved.
            </p>
            <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
              <span>Made for Final Year Project</span>
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
              <span>Premium V2.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ClientHomePage() {
  return (
    <ProtectedRoute requiredRole="client">
      <ClientHomeContent />
    </ProtectedRoute>
  );
}