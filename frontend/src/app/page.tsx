"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts";
import { apiCall } from "@/lib/api";
import { getAllArtistsFromFirestore } from "@/lib/firebaseBookingAPI";

/* ─── Artist categories ─── */
const artistCategories = [
  {
    id: 'singers',
    name: "Singers",
    description: "Vocalists & solo performers",
    icon: "🎤",
    count: "245+",
    color: "from-violet-500/20 to-fuchsia-500/20",
    borderColor: "border-violet-500/30 hover:border-violet-400/60",
  },
  {
    id: 'djs',
    name: "DJs",
    description: "Electronic & turntable artists",
    icon: "🎧",
    count: "128+",
    color: "from-cyan-500/20 to-blue-500/20",
    borderColor: "border-cyan-500/30 hover:border-cyan-400/60",
  },
  {
    id: 'bands',
    name: "Bands",
    description: "Full groups & ensembles",
    icon: "🎸",
    count: "87+",
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/30 hover:border-amber-400/60",
  },
];

/* ─── Testimonials ─── */
const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Wedding Planner",
    text: "Book Your Artist transformed how we find live performers. The quality of musicians on this platform is unmatched.",
    rating: 5,
  },
  {
    name: "David Park",
    role: "Event Coordinator",
    text: "Seamless booking process, verified professionals, and the best part — every artist delivered beyond expectations.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Restaurant Owner",
    text: "We book weekly jazz nights through the platform. The secure payments and review system give us total confidence.",
    rating: 5,
  },
];

/* ─── Stats data ─── */
const stats = [
  { label: "Verified Artists", value: "500+", icon: "👥" },
  { label: "Events Booked", value: "10,000+", icon: "🎉" },
  { label: "Average Rating", value: "4.8★", icon: "⭐" },
  { label: "Happy Clients", value: "15,000+", icon: "😊" },
];

/* ─── Star component ─── */
function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < Math.floor(rating) ? "fill-current" : "fill-gray-600"}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.062 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.287-3.957z" />
        </svg>
      ))}
    </span>
  );
}

/* ════════════════════════════════════════
   MAIN LANDING PAGE - REDESIGNED
   ════════════════════════════════════════ */
export default function Home() {
  const { loading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [activeNavLink, setActiveNavLink] = useState<string>("");
  const [featuredArtists, setFeaturedArtists] = useState<any[]>([]);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const data = await getAllArtistsFromFirestore();
        if (data && data.length > 0) {
          const colors = [
            "from-violet-500 to-fuchsia-500",
            "from-cyan-500 to-blue-500",
            "from-amber-500 to-pink-500",
            "from-blue-500 to-cyan-500",
            "from-red-500 to-orange-500",
            "from-pink-500 to-rose-500"
          ];
          setFeaturedArtists(data.slice(0, 6).map((a: any, i: number) => {
            const name = a.stageName || a.name || "Unknown";
            const init = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
            return {
              id: a.id,
              name,
              category: a.category || "Artist",
              genre: (a.genres && a.genres[0]) ? a.genres[0] : "Artist",
              rating: a.rating || 0,
              reviews: a.reviews || Math.floor(Math.random() * 50) + 10,
              hourlyRate: a.hourlyRate || 0,
              color: colors[i % colors.length],
              initials: init,
              profileImage: a.profileImage,
              location: a.location || "Sri Lanka",
              availability: a.availability !== undefined ? a.availability : true
            };
          }));
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchFeatured();
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === 'artist') {
        router.push("/home/artist");
      } else if (user.role === 'admin') {
        router.push("/home/admin");
      } else if (user.role === 'client') {
        router.push("/home/client");
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="animate-pulse-glow rounded-full h-16 w-16 border-2 border-violet-500 mx-auto" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white overflow-x-hidden">
      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gradient-to-b from-gray-950/80 via-purple-950/40 to-transparent border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-sm group-hover:shadow-lg group-hover:shadow-violet-500/50 transition-all">
              ♪
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:inline">
              <span className="text-gradient">Book</span>
              <span className="text-white">Your</span>
              <span className="text-gradient">Artist</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: "#artists", label: "Artists" },
              { href: "#how", label: "How It Works" },
              { href: "#benefits", label: "Benefits" },
              { href: "#testimonials", label: "Reviews" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeNavLink === link.href
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
                onClick={() => setActiveNavLink(link.href)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="hidden sm:inline-flex text-sm font-medium text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors duration-300"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-5 py-2 rounded-lg transition-all duration-300 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section className="relative pt-32 pb-20 px-4 sm:pt-40 sm:pb-24 lg:pt-48 lg:pb-28 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-violet-600/15 blur-3xl animate-pulse" />
          <div className="absolute top-40 right-1/4 w-80 h-80 rounded-full bg-fuchsia-600/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 backdrop-blur-sm mb-6 animate-fade-in">
            <span className="text-violet-300 text-sm">✨ Discover Premium Musicians</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight tracking-tight mb-6 animate-fade-in-up">
            <span className="block">Find & Book</span>
            <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 text-transparent bg-clip-text">
              World-Class Artists
            </span>
            <span className="block text-gray-300">In Minutes</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Connect with verified musicians and bands for weddings, events, studios, and performances. Browse, book, and pay securely — all in one platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <Link
              href="/search"
              className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold px-8 py-3.5 rounded-lg transition-all duration-300 shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Artists
            </Link>
            <Link
              href="/sign-up"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 text-gray-200 hover:text-white font-semibold px-8 py-3.5 rounded-lg border border-gray-600 hover:border-violet-500/50 bg-white/5 hover:bg-white/10 transition-all duration-300"
            >
              Join as Artist
              <svg className="w-4 h-4 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="inline-flex flex-col sm:flex-row flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            {stats.map((stat, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-300">
                <span className="text-xl">{stat.icon}</span>
                <span className="font-semibold">{stat.value}</span>
                <span className="text-gray-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ ARTIST CATEGORIES ═══════════════ */}
      <section className="relative py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Browse by <span className="text-gradient">Artist Type</span>
            </h2>
            <p className="text-gray-400 text-lg">Find the perfect performer for any event</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {artistCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/search?category=${cat.id}`}
                className={`group relative overflow-hidden rounded-2xl p-8 border ${cat.borderColor} bg-gradient-to-br ${cat.color} backdrop-blur-sm transition-all duration-300 hover:scale-105 cursor-pointer`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="text-5xl mb-4">{cat.icon}</div>
                    <h3 className="text-2xl font-bold mb-2">{cat.name}</h3>
                    <p className="text-gray-300 text-sm mb-4">{cat.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="font-semibold text-violet-300">{cat.count} artists</span>
                    <svg className="w-5 h-5 text-white group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section id="how" className="relative py-20 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="text-gray-400 text-lg">Book your favorite artist in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-violet-600/30 via-fuchsia-600/30 to-indigo-600/30" />

            {/* Steps */}
            {[
              {
                num: "01",
                icon: "🔍",
                title: "Search & Discover",
                desc: "Browse thousands of verified musicians by genre, price, availability, and ratings.",
              },
              {
                num: "02",
                icon: "📅",
                title: "Book & Secure",
                desc: "Choose your preferred date, send a booking request, and confirm with secure payment.",
              },
              {
                num: "03",
                icon: "🎵",
                title: "Enjoy & Review",
                desc: "Experience world-class performance and leave a review to help the community.",
              },
            ].map((step, i) => (
              <div key={i} className="relative z-10">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 mb-6 group hover:scale-110 transition-transform">
                    <span className="text-3xl">{step.icon}</span>
                  </div>
                  <div className="text-sm font-bold text-violet-400 mb-2 tracking-widest">{step.num}</div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURED ARTISTS ═══════════════ */}
      <section id="artists" className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Featured <span className="text-gradient">Artists</span>
            </h2>
            <p className="text-gray-400 text-lg">Hand-picked performers trusted by thousands of clients</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArtists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.id}`}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 hover:border-violet-500/30 p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/20"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-fuchsia-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10">
                  {/* Avatar & Info */}
                  <div className="flex items-center gap-4 mb-4">
                    {artist.profileImage ? (
                      <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden shadow-lg shadow-violet-500/20 group-hover:shadow-xl group-hover:shadow-violet-500/40 transition-all border border-white/10">
                        <img 
                          src={artist.profileImage} 
                          alt={artist.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div
                        className={`w-16 h-16 shrink-0 rounded-xl bg-gradient-to-br ${artist.color} flex items-center justify-center text-xl font-bold shadow-lg shadow-violet-500/20 group-hover:shadow-xl group-hover:shadow-violet-500/40 transition-all`}
                      >
                        {artist.initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap flex-col items-start gap-1 mb-1">
                         <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                           {artist.category}
                         </span>
                         <h3 className="font-bold text-lg group-hover:text-violet-300 transition truncate w-full">
                           {artist.name}
                         </h3>
                      </div>
                      <p className="text-sm text-gray-400 truncate">{artist.genre}</p>
                    </div>
                  </div>

                  {/* Location & Availability */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-2">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {artist.location}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${artist.availability ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-red-500'}`}></div>
                      {artist.availability ? 'Available' : 'Unavailable'}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-white/10 my-4" />

                  {/* Rating */}
                  <div className="flex items-center gap-3 mb-4">
                    <Stars rating={artist.rating} />
                    <span className="text-xs text-gray-500">
                      {artist.rating} • {artist.reviews} reviews
                    </span>
                  </div>

                  {/* Rate and CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">From</p>
                      <p className="text-xl font-bold">
                        ${artist.hourlyRate}
                        <span className="text-xs font-normal text-gray-400">/hr</span>
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center group-hover:bg-violet-500/40 transition">
                      <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-semibold transition group"
            >
              View All Artists
              <svg className="w-5 h-5 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ WHY CHOOSE US ═══════════════ */}
      <section id="benefits" className="relative py-20 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Why Choose <span className="text-gradient">Book Your Artist</span>
            </h2>
            <p className="text-gray-400 text-lg">The most trusted platform for booking live music</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "✓",
                title: "Verified Artists",
                desc: "Every musician is background-checked and portfolio-reviewed.",
                color: "from-violet-500/20",
              },
              {
                icon: "🔒",
                title: "Secure Payments",
                desc: "All transactions encrypted with Stripe for total protection.",
                color: "from-indigo-500/20",
              },
              {
                icon: "⭐",
                title: "Real Reviews",
                desc: "Authentic ratings from verified clients who attended events.",
                color: "from-cyan-500/20",
              },
              {
                icon: "💬",
                title: "Direct Messaging",
                desc: "Chat with artists to discuss your event's unique details.",
                color: "from-fuchsia-500/20",
              },
            ].map((benefit, i) => (
              <div
                key={i}
                className={`group bg-gradient-to-br ${benefit.color} to-transparent backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl p-6 transition-all duration-300 hover:scale-105`}
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{benefit.icon}</div>
                <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section id="testimonials" className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Loved by <span className="text-gradient">Our Community</span>
            </h2>
            <p className="text-gray-400 text-lg">Real stories from satisfied clients</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl p-8 flex flex-col hover:scale-105 transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  <Stars rating={testimonial.rating} />
                </div>
                <p className="text-gray-300 flex-1 leading-relaxed mb-6 text-sm">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3 pt-6 border-t border-white/10">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-sm`}>
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-600 opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-tl from-violet-600/50 to-fuchsia-600/50 opacity-50" />

            <div className="relative z-10 text-center py-16 px-8 sm:py-20 sm:px-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
                Ready to Book Your Next Performance?
              </h2>
              <p className="text-lg text-violet-100 mb-8 max-w-2xl mx-auto leading-relaxed">
                Join thousands of satisfied clients and artists on the platform trusted for premium live music bookings.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/search"
                  className="w-full sm:w-auto bg-white text-indigo-700 font-semibold px-8 py-3.5 rounded-lg hover:bg-gray-50 transition-all duration-300 shadow-xl hover:scale-105"
                >
                  Browse Artists Now
                </Link>
                <Link
                  href="/sign-up"
                  className="w-full sm:w-auto text-white font-semibold px-8 py-3.5 rounded-lg border-2 border-white hover:bg-white/10 transition-all duration-300"
                >
                  Join for Free
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-white/5 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Footer grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-sm">
                  ♪
                </div>
                <span className="text-lg font-bold">
                  <span className="text-gradient">Book</span>
                  <span className="text-white">Your</span>
                  <span className="text-gradient">Artist</span>
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                The premier platform for discovering and booking world-class musicians for any event.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wide text-gray-300 mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/search" className="hover:text-white transition">Browse Artists</Link></li>
                <li><Link href="/sign-up" className="hover:text-white transition">Create Account</Link></li>
                <li><Link href="#how" className="hover:text-white transition">How It Works</Link></li>
              </ul>
            </div>

            {/* For Artists */}
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wide text-gray-300 mb-4">For Artists</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/sign-up" className="hover:text-white transition">Join as Artist</Link></li>
                <li><Link href="/sign-in" className="hover:text-white transition">Artist Login</Link></li>
                <li><Link href="#benefits" className="hover:text-white transition">Why Join Us</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wide text-gray-300 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          {/* Footer bottom */}
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              © 2026 Book Your Artist. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {[
                { label: "Twitter", href: "#" },
                { label: "Instagram", href: "#" },
                { label: "YouTube", href: "#" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="text-gray-600 hover:text-violet-400 transition-colors duration-300 text-sm font-medium"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
