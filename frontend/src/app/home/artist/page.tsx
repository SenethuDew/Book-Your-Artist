"use client";

import Link from "next/link";
import { useAuth } from "@/contexts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { 
  Bell, Calendar as CalendarIcon, DollarSign, User, 
  LogOut, CheckCircle, TrendingUp, LayoutDashboard, Check, X,
  MapPin, Activity, Wallet, Settings, Eye, Users, ChevronRight, Briefcase, AlertTriangle, Edit2, Trash2,
  Sparkles
} from "lucide-react";

interface Booking {
  _id: string;
  clientId: { _id: string; name: string; email: string; profileImage?: string };
  eventDate: string;
  startTime: string;
  endTime: string;
  eventType: string;
  eventLocation?: string | {
    venue?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  totalPrice: number;
  artistPrice: number;
  status: string;
  createdAt: string;
}

interface ArtistStats {
  totalEarnings: number;
  monthlyEarnings: number;
  pendingPayments: number;
  totalBookings: number;
  pendingRequests: number;
  upcomingBookings: number;
  completedBookings: number;
  averageRating: number;
  ratingTrend: string;
}

// Compact NavItem
const NavItem = ({ href, icon: Icon, label, active, badge }: { href: string, icon: any, label: string, active?: boolean, badge?: number }) => (
  <Link href={href} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${active ? "bg-violet-600/20 text-violet-400 font-bold border border-violet-500/30" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
    <Icon className={`w-4 h-4 ${active ? "text-violet-400" : ""}`} />
    <span className="hidden xl:block whitespace-nowrap">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="flex items-center justify-center bg-fuchsia-500 text-white text-[10px] min-w-[18px] h-4 px-1 rounded-full font-bold ml-auto shadow-[0_0_8px_rgba(217,70,239,0.5)]">
        {badge}
      </span>
    )}
  </Link>
);

// Advanced Stat Card
const StatCard = ({ title, value, subtitle, icon: Icon, trendStr, colorClass }: { title: string, value: string | number, subtitle: string, icon: any, trendStr: string, colorClass: string }) => (
  <div className="relative overflow-hidden bg-[#1E112A]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 group hover:border-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/10">
    <div className={`absolute -right-4 -top-4 w-20 h-20 bg-gradient-to-br ${colorClass} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />
    <div className="flex justify-between items-start mb-3">
      <div>
        <p className="text-gray-400 text-xs font-medium mb-1 tracking-wide uppercase">{title}</p>
        <h3 className="text-2xl font-extrabold text-white tracking-tight">{value}</h3>
      </div>
      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colorClass} bg-opacity-10 shadow-inner`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-white/5">
      <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      <span className="text-xs font-bold text-emerald-400">{trendStr}</span>
      <span className="text-[10px] text-gray-500 truncate ml-1">{subtitle}</span>
    </div>
  </div>
);

// Streamlined Booking Item
const CompactBooking = ({ booking, onAction, actionLoading, type = 'pending' }: { booking: Booking, onAction?: (id: string, status: string) => void, actionLoading?: string | null, type?: 'pending' | 'confirmed' }) => {
  const dateObj = new Date(booking.eventDate);
  const formattedDate = dateObj.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' });
  const isLoading = actionLoading === booking._id;
  const locationText = typeof booking.eventLocation === "string"
    ? booking.eventLocation
    : [
        booking.eventLocation?.venue,
        booking.eventLocation?.address,
        booking.eventLocation?.city,
        booking.eventLocation?.country,
      ].filter(Boolean).join(", ") || "Location not provided";

  return (
    <div className="relative group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all">
      {isLoading && (
        <div className="absolute inset-0 bg-[#1E112A]/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
          <div className="w-5 h-5 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-white text-sm truncate">{booking.eventType}</h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-gray-300">${booking.artistPrice}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-400">
            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {booking.clientId?.name || "Client"}</span>
            <span className="flex items-center gap-1 text-violet-300"><CalendarIcon className="w-3 h-3" /> {formattedDate}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {locationText}</span>
          </div>
        </div>
        
        {type === 'pending' && onAction ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => onAction(booking._id, "confirmed")} disabled={isLoading} className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors" title="Accept">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => onAction(booking._id, "cancelled")} disabled={isLoading} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors" title="Decline">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="shrink-0 text-right">
             <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>{booking.status}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Insight Metric
const InsightMetric = ({ icon: Icon, label, value, sub }: { icon: any, label: string, value: string | number, sub: string }) => (
  <div className="flex flex-col p-3 bg-white/5 rounded-xl border border-white/5">
    <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs font-medium">
      <Icon className="w-3.5 h-3.5 text-violet-400" /> {label}
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-xl font-bold text-white leading-none">{value}</span>
      <span className="text-[10px] text-emerald-400 font-medium">{sub}</span>
    </div>
  </div>
);

function ArtistDashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [stats, setStats] = useState<ArtistStats>({
    totalEarnings: 0, monthlyEarnings: 0, pendingPayments: 0, totalBookings: 0,
    pendingRequests: 0, upcomingBookings: 0, completedBookings: 0, averageRating: 4.9, ratingTrend: "+0.1"
  });
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [completionPercentage, setCompletionPercentage] = useState(100);

  useEffect(() => { 
    const fetchDashboardDataInternal = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token") || localStorage.getItem("authToken");
        if(!token) return;

        const profileRes = await fetch(`${API_BASE_URL}/api/artists/me`, { headers: { Authorization: `Bearer ${token}` } });
        
        if (profileRes.status === 404) { 
          setHasProfile(false); 
          setIsProfileComplete(false);
          setCompletionPercentage(0);
        } else {
          setHasProfile(true);
          if (profileRes.ok) {
            const data = await profileRes.json();
            const profile = data.profile || data.artist || {};
            
            // Check completion: bio, category, profile image, hourly rate, location
            const fieldsComplete = {
              bio: !!(profile.bio || profile.biography),
              category: !!profile.category,
              image: !!(profile.profileImage || profile.profileImageUrl),
              hourlyRate: !!(profile.hourlyRate || profile.price),
              location: !!profile.location
            };
            
            const completedCount = Object.values(fieldsComplete).filter(Boolean).length;
            const totalFields = Object.keys(fieldsComplete).length;
            const percentage = Math.round((completedCount / totalFields) * 100);
            
            setCompletionPercentage(percentage);
            setIsProfileComplete(completedCount === totalFields);
            
            console.log("Artist Profile Data:", profile);
            console.log("Profile Completion Status:", { 
              fields: fieldsComplete, 
              percentage, 
              isComplete: completedCount === totalFields 
            });
          }
        }

        const bookingsRes = await fetch(`${API_BASE_URL}/api/bookings/my?limit=50&sort=-eventDate`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (bookingsRes.ok) {
          const bData = await bookingsRes.json();
          if (bData.success) {
            const bks: Booking[] = bData.bookings;
            setBookings(bks);

            let pendCount = 0, upCount = 0, comCount = 0, totalVal = 0, monthVal = 0, pendEarning = 0;
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            bks.forEach(b => {
              if(b.status === "pending") pendCount++;
              if(b.status === "confirmed") { upCount++; pendEarning += (b.artistPrice || 0); }
              if(b.status === "completed") {
                 comCount++;
                 totalVal += (b.artistPrice || 0);
                 if(new Date(b.eventDate) >= startOfMonth) monthVal += (b.artistPrice || 0);
              }
            });

            setStats(prev => ({
              ...prev, totalBookings: bks.length, pendingRequests: pendCount, upcomingBookings: upCount, completedBookings: comCount,
              totalEarnings: totalVal, monthlyEarnings: monthVal, pendingPayments: pendEarning
            }));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardDataInternal(); 
    }
  }, [user, router]);

  const handleBookingAction = async (id: string, status: string) => {
    try {
      setActionLoading(id);
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      await fetch(`${API_BASE_URL}/api/bookings/${id}/status`, {
         method: "PATCH",
         headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
         body: JSON.stringify({ status })
      });
      // Optionally trigger re-fetch by updating a dummy state, but for now we'll just reload the page or update local state
      window.location.reload();
    } finally {
      setActionLoading(null);
    }
  };

  const pendingBookings = bookings.filter(b => b.status === "pending");
  const upcomingBookings = bookings.filter(b => b.status === "confirmed").sort((a,b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()).slice(0, 4);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium text-sm tracking-widest uppercase">Initializing Workspace</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans overflow-x-hidden selection:bg-violet-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-violet-900/10 blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-fuchsia-900/10 blur-[150px] mix-blend-screen" />
      </div>

      {/* Advanced Control Panel Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-[90rem] mx-auto px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-3 sm:py-0 gap-3 sm:gap-0">
             {/* Logo & Brand */}
             <Link href="/" className="flex items-center gap-3 shrink-0 group">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center font-black shadow-lg group-hover:shadow-violet-500/40 transition-all">♪</div>
               <span className="font-extrabold tracking-tight text-white hidden sm:block">BookYour<span className="text-violet-400">Artist</span></span>
             </Link>

             {/* Main Navigation - Scrollable on mobile */}
             <div className="flex items-center overflow-x-auto scrollbar-hide py-1 w-full sm:w-auto px-2 sm:px-0 mx-0 sm:mx-6 flex-1 lg:justify-center gap-1">
               <NavItem href="/home/artist" icon={LayoutDashboard} label="Dashboard" active={true} />
               <NavItem href="/artist/bookings" icon={Briefcase} label="Bookings" badge={stats.pendingRequests} />
               <NavItem href="/artist/calendar" icon={CalendarIcon} label="Calendar" />
              <NavItem href="/artist/messages" icon={Bell} label="Notifications" />
               <NavItem href="/artist/earnings" icon={Wallet} label="Earnings" />
               <NavItem href="/artist/profile" icon={Settings} label="Profile Settings" />
               <NavItem href="/artist/ai-assistant" icon={Sparkles} label="AI Support" />
             </div>

             {/* Right Utilities */}
             <div className="hidden sm:flex items-center gap-4 shrink-0">
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowDropdown(false);
                    }}
                    className="relative w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Booking request notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {pendingBookings.length > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-fuchsia-500 text-white text-[10px] font-black flex items-center justify-center shadow-[0_0_10px_rgba(217,70,239,0.7)]">
                        {pendingBookings.length}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                      <div className="absolute right-0 mt-3 w-80 bg-gray-900 border border-white/10 rounded-2xl shadow-xl shadow-fuchsia-900/10 backdrop-blur-xl z-50 overflow-hidden animate-fade-in-up">
                        <div className="p-4 border-b border-white/5 bg-white/5">
                          <p className="text-sm font-bold text-white">Booking Notifications</p>
                          <p className="text-xs text-gray-400">
                            {pendingBookings.length} pending performance request{pendingBookings.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="max-h-80 overflow-y-auto p-2">
                          {pendingBookings.length > 0 ? (
                            pendingBookings.slice(0, 5).map((booking) => {
                              const dateText = new Date(booking.eventDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              });

                              return (
                                <div key={booking._id} className="p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-white truncate">{booking.eventType || "Performance request"}</p>
                                      <p className="text-xs text-gray-400 truncate">
                                        {booking.clientId?.name || "Client"} • {dateText} • {booking.startTime} - {booking.endTime}
                                      </p>
                                    </div>
                                    <span className="shrink-0 px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase">
                                      Request
                                    </span>
                                  </div>
                                  <div className="flex gap-2 mt-3">
                                    <button onClick={() => handleBookingAction(booking._id, "confirmed")} className="flex-1 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold">
                                      Accept
                                    </button>
                                    <button onClick={() => handleBookingAction(booking._id, "cancelled")} className="flex-1 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-bold">
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="py-8 text-center">
                              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                              <p className="text-sm font-bold text-white">No new requests</p>
                              <p className="text-xs text-gray-500 mt-1">New paid performance requests will appear here.</p>
                            </div>
                          )}
                        </div>
                        <div className="p-3 border-t border-white/5">
                          <Link
                            href="/artist/bookings"
                            onClick={() => setShowNotifications(false)}
                            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors"
                          >
                            View All Requests <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="w-px h-5 bg-white/10" />
                <div className="relative">
                  <button onClick={() => { setShowDropdown(!showDropdown); setShowNotifications(false); }} className="flex items-center gap-3 hover:bg-white/5 p-1 rounded-full transition-colors focus:outline-none">
                    <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/50 overflow-hidden">
                      {(user as any)?.profileImage ? <img src={(user as any).profileImage} alt="User" className="w-full h-full object-cover" /> : <User className="w-4 h-4 m-auto mt-2 text-violet-300" />}
                    </div>
                    <span className="text-xs font-bold text-gray-200 hidden lg:block pr-2">{user?.name?.split(' ')[0]}</span>
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
                      <div className="absolute right-0 mt-3 w-56 bg-gray-900 border border-white/10 rounded-2xl shadow-xl shadow-fuchsia-900/10 backdrop-blur-xl z-50 overflow-hidden animate-fade-in-up">
                        <div className="p-4 border-b border-white/5 bg-white/5">
                          <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>
                        <div className="p-2 flex flex-col gap-1">
                          <Link href="/artist/profile" className="flex items-center justify-between px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors group">
                            <span className="flex items-center gap-2.5"><User className="w-4 h-4 text-violet-400" /> View Profile</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          <Link href="/artist/edit-profile" className="flex items-center justify-between px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors group">
                              <span className="flex items-center gap-2.5"><Edit2 className="w-4 h-4 text-fuchsia-400" /> Complete Profile</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          <button onClick={() => router.push('/artist/profile?delete=true')} className="flex items-center justify-between px-3 py-2 text-sm text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors group">
                            <span className="flex items-center gap-2.5"><Trash2 className="w-4 h-4 text-red-400" /> Delete Profile</span>
                          </button>
                          <div className="h-px bg-white/5 my-1 mx-2" />
                          <button onClick={logout} className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                            <span className="flex items-center gap-2.5"><LogOut className="w-4 h-4" /> Logout</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
             </div>
          </div>
        </div>
      </nav>

      {/* Main Control Flow */}
      <main className="max-w-[90rem] mx-auto px-4 lg:px-8 py-8 relative z-10">

        {(!isProfileComplete) && (
          <div className="mb-8 p-5 bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-amber-500/5">
            <div className="flex items-center gap-5 w-full md:w-auto flex-1">
              <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/30">
                <AlertTriangle className="w-7 h-7 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-amber-500 mb-1">Complete your profile to get more bookings</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 max-w-[200px] bg-black/40 rounded-full h-2">
                    <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-2 rounded-full transition-all duration-1000" style={{width: `${completionPercentage}%`}}></div>
                  </div>
                  <span className="text-xs font-bold text-amber-400">{completionPercentage}% Completed</span>
                </div>
              </div>
            </div>
            <button onClick={() => router.push("/artist/edit-profile")} className="w-full md:w-auto px-8 py-3 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900">
              Complete Now
            </button>
          </div>
        )}
        
        {/* Top Header */}
        <div className="flex flex-col xl:flex-row justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">Welcome back, {user?.name?.split(' ')[0] || 'Artist'}</h1>
            <p className="text-sm text-gray-400 max-w-xl">Your workspace is looking busy. Check out your latest performance metrics and upcoming gigs.</p>
          </div>
        </div>

        {/* Global Key Metrics / Analytics Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatCard title="This Month" value={`$${stats.monthlyEarnings.toFixed(2)}`} subtitle="from completed gigs" trendStr="+12%" icon={DollarSign} colorClass="from-emerald-500 to-green-500" />
          <StatCard title="In Escrow" value={`$${stats.pendingPayments.toFixed(2)}`} subtitle="secure pending payouts" trendStr="Secured." icon={Wallet} colorClass="from-violet-500 to-fuchsia-500" />
          <StatCard title="Gigs Played" value={stats.completedBookings} subtitle="all-time completed" trendStr={`${stats.totalBookings} Total`} icon={CheckCircle} colorClass="from-cyan-500 to-blue-500" />
          <StatCard title="Reputation" value={`${stats.averageRating.toFixed(1)}`} subtitle="verified reviews" trendStr="Top 10%" icon={TrendingUp} colorClass="from-amber-400 to-orange-500" />
        </div>

        {/* Central Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Main Action Area (Left 2 columns) */}
          <div className="xl:col-span-2 flex flex-col gap-6 sm:gap-8">
             
             {/* Pending Requests Box */}
             <div className="bg-[#1E112A]/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/5 blur-[80px] rounded-full" />
                <div className="flex justify-between items-center mb-5 relative z-10">
                  <h2 className="text-lg font-bold flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center"><Bell className="w-4 h-4" /></div>
                    Needs Your Attention
                  </h2>
                  {pendingBookings.length > 0 && <span className="bg-gradient-to-r from-fuchsia-600 to-violet-600 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider">{pendingBookings.length} Pending</span>}
                </div>
                
                {pendingBookings.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 relative z-10 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {pendingBookings.map(b => (
                      <CompactBooking key={b._id} booking={b} onAction={handleBookingAction} actionLoading={actionLoading} type="pending" />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 bg-black/20 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center relative z-10">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3"><CheckCircle className="w-6 h-6 text-emerald-400" /></div>
                    <p className="text-sm font-bold text-white">Inbox Zero</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-[200px]">You have no pending booking requests right now.</p>
                  </div>
                )}
             </div>

             {/* Upcoming Confirmed */}
             <div className="bg-[#1E112A]/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full" />
                <div className="flex justify-between items-center mb-5 relative z-10">
                  <h2 className="text-lg font-bold flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><CalendarIcon className="w-4 h-4" /></div>
                    Upcoming Lineup
                  </h2>
                  <Link href="/bookings" className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 group">View All <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /></Link>
                </div>
                
                {upcomingBookings.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                    {upcomingBookings.map(b => (
                      <CompactBooking key={b._id} booking={b} type="confirmed" />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 bg-black/20 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center relative z-10">
                    <Briefcase className="w-8 h-8 text-gray-600 mb-3" />
                    <p className="text-xs text-gray-500">No upcoming gigs confirmed yet.</p>
                  </div>
                )}
             </div>
          </div>

          {/* Side Panel Widgets (Right column) */}
          <div className="flex flex-col gap-6 sm:gap-8">
             
             {/* Artist Insights Panel */}
             <div className="bg-[#1E112A]/40 backdrop-blur-md border border-white/10 rounded-2xl p-5">
               <h3 className="font-bold text-sm text-gray-400 uppercase tracking-widest mb-4">Profile Insights</h3>
               <div className="grid grid-cols-2 gap-3 mb-4">
                 <InsightMetric icon={Eye} label="Views" value="1.2k" sub="+8% /wk" />
                 <InsightMetric icon={Users} label="Conversion" value="4.5%" sub="-1.2%" />
               </div>
               <Link href="/artist/preview" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-colors">
                 <User className="w-3.5 h-3.5" /> View Public Profile
               </Link>
             </div>

             {/* Quick Availability Overview */}
             <div className="bg-[#1E112A]/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 relative overflow-hidden">
               <h3 className="font-bold text-sm text-gray-400 uppercase tracking-widest mb-4 flex justify-between items-center">
                 Next 7 Days <Link href="/artist/calendar"><Settings className="w-4 h-4 hover:text-white" /></Link>
               </h3>
               <div className="flex justify-between gap-1">
                 {['M','T','W','T','F','S','S'].map((day, i) => {
                   const isActive = i === 4 || i === 5 || i === 6; // Mock weekend available
                   return (
                     <div key={i} className={`flex flex-col items-center p-2 rounded-lg border ${isActive ? "bg-violet-500/10 border-violet-500/30 text-white" : "border-white/5 text-gray-600"}`}>
                       <span className="text-[10px] font-bold mb-1.5">{day}</span>
                       <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400 shadow-[0_0_5px_#34d399]" : "bg-gray-700"}`}></div>
                     </div>
                   );
                 })}
               </div>
             </div>

             {/* Promo / Support Card */}
             <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10 border border-violet-500/20 rounded-2xl p-5 text-center">
               <div className="w-10 h-10 mx-auto bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                 <Activity className="w-5 h-5 text-white" />
               </div>
               <h3 className="font-bold text-sm text-white mb-1.5">New Feature: Express Payouts</h3>
               <p className="text-xs text-gray-400 mb-4 px-2">Opt-in to receive gig earnings 48 hours faster than standard wire processing.</p>
               <button className="w-full text-xs font-bold py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">Learn More</button>
             </div>

          </div>
        </div>
      </main>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.3); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139, 92, 246, 0.6); }
      `}</style>
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
