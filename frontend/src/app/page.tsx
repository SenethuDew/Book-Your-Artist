"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts";

/* ─── mock data for featured artists ─── */
const featuredArtists = [
  {
    id: 1,
    name: "Aria Velasquez",
    genre: "Jazz & Soul",
    rating: 4.9,
    reviews: 127,
    hourlyRate: 250,
    color: "from-violet-500 to-fuchsia-500",
    initials: "AV",
  },
  {
    id: 2,
    name: "Marcus Chen",
    genre: "Classical Piano",
    rating: 4.8,
    reviews: 94,
    hourlyRate: 300,
    color: "from-cyan-500 to-blue-500",
    initials: "MC",
  },
  {
    id: 3,
    name: "Luna Okafor",
    genre: "R&B / Pop",
    rating: 4.9,
    reviews: 213,
    hourlyRate: 200,
    color: "from-amber-500 to-pink-500",
    initials: "LO",
  },
];

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

/* ─── star component ─── */
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
   MAIN HOME / LANDING PAGE
   ════════════════════════════════════════ */
export default function Home() {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/home/client");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0d17] flex items-center justify-center">
        <div className="animate-pulse-glow rounded-full h-16 w-16 border-2 border-violet-500" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0d17] text-white overflow-x-hidden">
      {/* ───────────── NAVBAR ───────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-gradient">Book</span>
            <span className="text-white">Your</span>
            <span className="text-gradient">Artist</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-gray-300">
            <Link href="#featured" className="hover:text-white transition">Browse Artists</Link>
            <Link href="#how-it-works" className="hover:text-white transition">How It Works</Link>
            <Link href="#why-us" className="hover:text-white transition">Why Us</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm text-gray-300 hover:text-white transition px-4 py-2"
            >
              Login
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-semibold bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-5 py-2 rounded-full transition-all duration-300 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ───────────── HERO ───────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Aurora blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="animate-aurora-1 absolute top-1/4 left-1/4 w-125 h-125 rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="animate-aurora-2 absolute top-1/3 right-1/4 w-100 h-100 rounded-full bg-indigo-600/20 blur-[100px]" />
          <div className="animate-aurora-3 absolute bottom-1/4 left-1/3 w-87.5 h-87.5 rounded-full bg-fuchsia-600/15 blur-[100px]" />
        </div>

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="animate-fade-in-up">
            <span className="inline-block text-xs font-semibold tracking-[0.25em] uppercase text-violet-400 mb-6 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10">
              🎵 The #1 Platform for Live Music Booking
            </span>
          </div>

          <h1 className="animate-fade-in-up-delay-1 text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6">
            Discover & Book{" "}
            <span className="text-gradient-warm">World-Class</span>
            <br />
            Musicians
          </h1>

          <p className="animate-fade-in-up-delay-2 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with verified, talented artists for weddings, corporate events,
            private parties, and studio sessions — all in one place.
          </p>

          <div className="animate-fade-in-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/search"
              className="group relative inline-flex items-center gap-2 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-violet-600/30 hover:shadow-violet-500/50 hover:scale-[1.03]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Explore Artists
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 text-gray-300 hover:text-white font-medium px-8 py-4 rounded-full border border-gray-700 hover:border-gray-500 transition-all duration-300 hover:scale-[1.03]"
            >
              Join as an Artist
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              500+ Verified Artists
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              10,000+ Events Booked
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              4.8★ Average Rating
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500 text-xs">
          <span>Scroll</span>
          <div className="w-5 h-8 rounded-full border border-gray-600 flex items-start justify-center p-1">
            <div className="w-1 h-2 rounded-full bg-gray-400 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ───────────── FEATURED ARTISTS ───────────── */}
      <section id="featured" className="relative py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-violet-400">Top Performers</span>
            <h2 className="text-4xl sm:text-5xl font-bold mt-3 mb-4">
              Featured <span className="text-gradient">Artists</span>
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto">
              Hand-picked musicians loved by thousands of clients worldwide
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredArtists.map((artist, i) => (
              <div
                key={artist.id}
                className={`group glass-strong rounded-2xl p-6 hover:scale-[1.03] transition-all duration-500 cursor-pointer ${
                  i === 0 ? "animate-float" : i === 1 ? "animate-float-delay-1" : "animate-float-delay-2"
                }`}
              >
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-5">
                  <div
                    className={`w-14 h-14 rounded-full bg-linear-to-br ${artist.color} flex items-center justify-center text-lg font-bold shadow-lg`}
                  >
                    {artist.initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-violet-300 transition">
                      {artist.name}
                    </h3>
                    <p className="text-sm text-gray-400">{artist.genre}</p>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <Stars rating={artist.rating} />
                  <span className="text-sm text-gray-400">
                    {artist.rating} ({artist.reviews} reviews)
                  </span>
                </div>

                {/* Rate & CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">From</p>
                    <p className="text-2xl font-bold text-white">
                      ${artist.hourlyRate}
                      <span className="text-sm font-normal text-gray-400">/hr</span>
                    </p>
                  </div>
                  <Link
                    href="/search"
                    className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition flex items-center gap-1"
                  >
                    View Profile
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-semibold transition"
            >
              View All Artists
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────── HOW IT WORKS ───────────── */}
      <section id="how-it-works" className="relative py-24 px-4">
        {/* Subtle background accent */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full bg-indigo-600/5 blur-[150px]" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-indigo-400">Simple Process</span>
            <h2 className="text-4xl sm:text-5xl font-bold mt-3 mb-4">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto">
              Book your perfect artist in three easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-0.5 bg-linear-to-r from-violet-600/50 via-indigo-600/50 to-fuchsia-600/50" />

            {/* Step 1 */}
            <div className="text-center relative">
              <div className="relative z-10 w-32 h-32 mx-auto mb-6 rounded-2xl glass-strong flex items-center justify-center group hover:scale-110 transition-transform duration-500">
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-linear-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-sm font-bold shadow-lg">
                  1
                </div>
                <svg className="w-12 h-12 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Search & Discover</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Browse musicians by genre, price range, availability, and ratings to find your ideal match
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center relative">
              <div className="relative z-10 w-32 h-32 mx-auto mb-6 rounded-2xl glass-strong flex items-center justify-center group hover:scale-110 transition-transform duration-500">
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-sm font-bold shadow-lg">
                  2
                </div>
                <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Book Securely</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Select a date, send your booking request, and pay securely through our Stripe-powered checkout
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center relative">
              <div className="relative z-10 w-32 h-32 mx-auto mb-6 rounded-2xl glass-strong flex items-center justify-center group hover:scale-110 transition-transform duration-500">
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-linear-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center text-sm font-bold shadow-lg">
                  3
                </div>
                <svg className="w-12 h-12 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Enjoy the Show</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Sit back and enjoy a world-class performance, then leave a review to help the community
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── WHY CHOOSE US ───────────── */}
      <section id="why-us" className="relative py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-fuchsia-400">Our Promise</span>
            <h2 className="text-4xl sm:text-5xl font-bold mt-3 mb-4">
              Why Choose <span className="text-gradient-warm">Book Your Artist</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="group glass rounded-2xl p-6 hover:border-violet-500/30 transition-all duration-500">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-violet-500/20 to-violet-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Verified Artists</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Every musician is background-checked and portfolio-reviewed before joining our platform
              </p>
            </div>

            {/* Card 2 */}
            <div className="group glass rounded-2xl p-6 hover:border-indigo-500/30 transition-all duration-500">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-500/20 to-blue-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Secure Payments</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                All transactions are encrypted and processed safely through Stripe with buyer protection
              </p>
            </div>

            {/* Card 3 */}
            <div className="group glass rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-500">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-cyan-500/20 to-teal-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Real Reviews</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Authentic ratings from real clients who have attended events with our booked artists
              </p>
            </div>

            {/* Card 4 */}
            <div className="group glass rounded-2xl p-6 hover:border-fuchsia-500/30 transition-all duration-500">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-fuchsia-500/20 to-pink-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Direct Messaging</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Chat directly with artists to discuss your event details, preferences, and special requests
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── TESTIMONIALS ───────────── */}
      <section className="relative py-24 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/4 w-125 h-125 rounded-full bg-fuchsia-600/5 blur-[150px]" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-400">Testimonials</span>
            <h2 className="text-4xl sm:text-5xl font-bold mt-3 mb-4">
              Loved by <span className="text-gradient-warm">Clients</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="glass rounded-2xl p-8 flex flex-col">
                <Stars rating={t.rating} />
                <p className="text-gray-300 mt-4 mb-6 flex-1 leading-relaxed italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── CTA BANNER ───────────── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-linear-to-br from-violet-600 via-indigo-600 to-fuchsia-600 opacity-90" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />

          <div className="relative z-10 text-center py-16 px-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">
              Ready to Find Your Perfect Artist?
            </h2>
            <p className="text-lg text-violet-100 mb-8 max-w-xl mx-auto">
              Join thousands of happy clients who found amazing musicians through our platform
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/sign-up"
                className="bg-white text-indigo-700 font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-all duration-300 shadow-xl hover:scale-105"
              >
                Create Free Account
              </Link>
              <Link
                href="/search"
                className="text-white font-medium px-8 py-4 rounded-full border border-white/30 hover:bg-white/10 transition-all duration-300"
              >
                Browse Artists →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── FOOTER ───────────── */}
      <footer className="border-t border-white/5 pt-16 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-xl font-bold mb-4">
                <span className="text-gradient">Book</span>Your<span className="text-gradient">Artist</span>
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                The premier platform for discovering and booking world-class musicians for any occasion.
              </p>
            </div>

            {/* For Clients */}
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">For Clients</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/search" className="hover:text-white transition">Browse Artists</Link></li>
                <li><Link href="/sign-up" className="hover:text-white transition">Create Account</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition">How It Works</Link></li>
              </ul>
            </div>

            {/* For Artists */}
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">For Artists</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/sign-up" className="hover:text-white transition">Join as Artist</Link></li>
                <li><Link href="/sign-in" className="hover:text-white transition">Artist Login</Link></li>
                <li><Link href="#why-us" className="hover:text-white transition">Why Join Us</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              © 2026 Book Your Artist. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {/* Social icons */}
              <a href="#" className="text-gray-600 hover:text-white transition" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-600 hover:text-white transition" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                </svg>
              </a>
              <a href="#" className="text-gray-600 hover:text-white transition" aria-label="YouTube">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
