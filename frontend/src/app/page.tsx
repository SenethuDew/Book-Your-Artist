"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts";
import { getAllArtistsFromFirestore } from "@/lib/firebaseBookingAPI";
import { FirebaseArtistCard, type FirebaseArtist } from "@/components/FirebaseArtistCard";
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
  {
    id: 'rappers',
    name: "Rappers",
    description: "Hip-hop, Rap, Trap",
    icon: "🎤",
    count: "65+",
    color: "from-rose-500/20 to-red-500/20",
    borderColor: "border-rose-500/30 hover:border-rose-400/60",
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

/* ─── Creative hero visual: live equalizer deck ─── */
function SoundWaveDeck() {
  const barHeightsPx = [14, 26, 18, 34, 22, 40, 16, 30, 24, 38, 12, 28, 20, 36, 18, 32];
  return (
    <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
      <div className="absolute inset-[-12%] rounded-[2.5rem] bg-gradient-to-tr from-violet-600/25 via-fuchsia-600/10 to-transparent blur-3xl" aria-hidden />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#120A20]/75 p-6 shadow-[0_0_70px_-12px_rgba(139,92,246,0.45)] backdrop-blur-xl sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(rgba(167, 139, 250, 0.12) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        <div className="relative mb-5 flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-fuchsia-500/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-200 ring-1 ring-fuchsia-400/25">
            Spotlight roster
          </span>
          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-300/95">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            </span>
            Booking open
          </span>
        </div>
        <div className="relative flex h-[10.5rem] items-end justify-center gap-1 px-1 sm:h-48 sm:gap-1.5 sm:px-2">
          {barHeightsPx.map((h, i) => (
            <div
              key={i}
              className="landing-eq-bar w-1.5 rounded-full bg-gradient-to-t from-violet-800 via-violet-400 to-fuchsia-300 shadow-[0_0_10px_-2px_rgba(192,132,252,0.6)] sm:w-2"
              style={{ height: h, animationDelay: `${i * 0.065}s` }}
            />
          ))}
        </div>
        <p className="relative mt-6 text-center text-sm leading-relaxed text-gray-400">
          <span className="text-gradient-warm bg-clip-text font-semibold text-transparent">Every genre.</span>{" "}
          Every room size. Zero guesswork.
        </p>
      </div>
      <div className="animate-float-delay-1 pointer-events-none absolute -right-2 top-14 hidden rounded-2xl border border-violet-400/20 bg-[#0d0718]/90 px-4 py-2.5 text-[11px] font-bold text-violet-100 shadow-xl backdrop-blur-md sm:block">
        ✦ 500+ vetted artists
      </div>
      <div className="animate-float-delay-2 pointer-events-none absolute bottom-10 -left-4 hidden rounded-2xl border border-fuchsia-400/20 bg-[#0d0718]/90 px-4 py-2.5 text-[11px] font-bold text-fuchsia-100 shadow-xl backdrop-blur-md md:block">
        Encrypted · Stripe-ready
      </div>
    </div>
  );
}

const MARQUEE_GENRES = [
  "Weddings",
  "Corporate",
  "Studios",
  "Festivals",
  "Nightlife",
  "Private gigs",
  "DJs",
  "Live bands",
  "Hip-hop",
  "Jazz & soul",
];

function GenreMarqueeStrip() {
  const loop = [...MARQUEE_GENRES, ...MARQUEE_GENRES];
  return (
    <div className="relative overflow-hidden border-y border-white/[0.06] bg-gradient-to-r from-transparent via-violet-950/20 to-transparent py-4">
      <div className="landing-marquee-track items-center gap-x-16 pr-16">
        {loop.map((tag, i) => (
          <span key={`${tag}-${i}`} className="flex shrink-0 items-center gap-x-16">
            <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-gray-500">
              {tag}
            </span>
            <span
              className="h-px w-10 bg-gradient-to-r from-transparent via-violet-400/50 to-transparent"
              aria-hidden
            />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { loading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [activeNavLink, setActiveNavLink] = useState<string>("");
  const [featuredArtists, setFeaturedArtists] = useState<FirebaseArtist[]>([]);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const data = await getAllArtistsFromFirestore();
        if (data && data.length > 0) {
          setFeaturedArtists(data.slice(0, 6));
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
      <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0512] text-white selection:bg-violet-500/30 selection:text-violet-200">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0A0512] via-[#0A0512]/95 to-violet-950/40" />
        </div>
        <div className="relative z-10 space-y-4 text-center">
          <div className="mx-auto h-16 w-16 animate-pulse-glow rounded-full border-2 border-violet-500" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative isolate min-h-screen overflow-x-hidden bg-[#0A0512] text-white selection:bg-violet-500/30 selection:text-violet-200">
      {/* Page-wide ambience (aligned with client home & auth screens) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0A0512] via-[#0A0512]/95 to-violet-950/45" />
        <div className="absolute -top-[18%] -right-[10%] h-[85%] w-[54%] rounded-full bg-fuchsia-600/16 blur-[120px]" />
        <div className="absolute -bottom-[28%] -left-[14%] h-[92%] w-[52%] rounded-full bg-violet-600/16 blur-[120px]" />
      </div>

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-xl bg-gradient-to-b from-[#0A0512]/90 via-[#120A20]/65 to-transparent supports-[backdrop-filter]:from-[#0A0512]/80">
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

      {/* ═══════════════ HERO — asymmetric, creative split ═══════════════ */}
      <section className="relative overflow-hidden px-4 pb-16 pt-28 sm:pb-20 sm:pt-36 lg:pb-28 lg:pt-44">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-aurora-1 absolute -left-20 top-20 h-[28rem] w-[28rem] rounded-full bg-violet-600/12 blur-3xl" />
          <div className="animate-aurora-2 absolute -right-24 top-40 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="animate-aurora-3 absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="text-center lg:col-span-6 lg:text-left">
            <p className="animate-fade-in mb-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.35em] text-violet-300/90">
              <span className="h-px w-8 bg-gradient-to-r from-transparent via-violet-400 to-violet-400/70" aria-hidden />
              Where live meets luxury
              <span className="hidden h-px w-8 bg-gradient-to-r from-violet-400/70 via-violet-400 to-transparent sm:inline" aria-hidden />
            </p>

            <div className="animate-fade-in-up mb-2 inline-flex items-center gap-2 rounded-full border border-violet-500/35 bg-gradient-to-r from-violet-500/[0.14] to-fuchsia-500/[0.1] px-4 py-2 backdrop-blur-sm">
              <span className="animate-pulse text-violet-200" aria-hidden>
                ◆
              </span>
              <span className="text-xs font-semibold text-violet-100 sm:text-sm">Curated talent · Seamless payouts</span>
            </div>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.35rem] xl:text-[3.85rem]">
              <span className="block text-white drop-shadow-[0_0_40px_rgba(167,139,250,0.15)]">
                Hear the headline.
              </span>
              <span className="mt-2 block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-400 bg-clip-text text-transparent">
                Book it live tonight.
              </span>
              <span className="mt-3 block font-medium text-gray-400 sm:text-2xl lg:text-xl xl:text-2xl">
                Pro musicians. Real reviews. One studio-grade flow.
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-gray-400 sm:text-lg lg:mx-0">
              Search by vibe, budget, and calendar. Message artists, lock the date, and pay with confidence — without the endless DMs and spreadsheets.
            </p>

            <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center lg:justify-start">
              <Link
                href="/search"
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-4 text-sm font-bold text-white shadow-[0_0_40px_-8px_rgba(168,85,247,0.55)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_52px_-6px_rgba(236,72,153,0.45)] sm:w-auto sm:rounded-xl"
              >
                <svg className="relative z-10 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="relative z-10">Browse the lineup</span>
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-8 py-4 text-sm font-bold text-gray-100 backdrop-blur-sm transition-all duration-300 hover:border-violet-400/40 hover:bg-white/[0.08] sm:w-auto sm:rounded-xl"
              >
                Go on tour with us → list your talent
              </Link>
            </div>

            <div className="mx-auto mt-14 grid max-w-lg grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-center sm:gap-4 lg:mx-0 lg:max-w-none lg:justify-start">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className={`animate-fade-in-up flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/25 px-4 py-3 text-left backdrop-blur-md sm:inline-flex`}
                  style={{ animationDelay: `${0.25 + i * 0.05}s` }}
                >
                  <span className="text-2xl" aria-hidden>
                    {stat.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-base font-black text-white sm:text-lg">{stat.value}</p>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:col-span-6">
            <SoundWaveDeck />
          </div>
        </div>
      </section>

      <GenreMarqueeStrip />

      {/* ═══════════════ ARTIST CATEGORIES ═══════════════ */}
      {/* ═══════════════ ARTIST CATEGORIES ═══════════════ */}
      <section className="relative px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.42em] text-fuchsia-300/85">
              Pick your frequency
            </p>
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
              Browse by <span className="text-gradient-warm">artist type</span>
            </h2>
            <p className="mx-auto max-w-xl text-lg text-gray-400">
              Jump straight into DJs, singers, bands, or rap specialists — each card opens a curated search lane.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {artistCategories.map((cat, idx) => (
              <Link
                key={cat.id}
                href={`/search?category=${cat.id}`}
                className={`group relative cursor-pointer overflow-hidden rounded-[1.35rem] border ${cat.borderColor} bg-gradient-to-br ${cat.color} p-8 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_28px_70px_-24px_rgba(139,92,246,0.45)] odd:rotate-[0.35deg] even:-rotate-[0.35deg] hover:rotate-0 ${idx % 2 === 1 ? "lg:translate-y-5" : ""}`}
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div>
                    <div className="mb-4 text-5xl transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_14px_rgba(232,121,249,0.38)]">
                      {cat.icon}
                    </div>
                    <h3 className="mb-2 text-2xl font-bold">{cat.name}</h3>
                    <p className="mb-4 text-sm text-gray-300">{cat.description}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="font-semibold text-violet-200">{cat.count} artists</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-300 group-hover:bg-violet-500/40">
                      <svg className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
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
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.4em] text-indigo-300/80">
              Plug in · book · applause
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="mx-auto max-w-lg text-lg text-gray-400">
              Three cues from first search to curtain call — built to feel effortless.
            </p>
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
              <div key={i} className="group relative z-10">
                <div className="h-full rounded-3xl border border-white/[0.08] bg-[#120A20]/55 p-8 text-center shadow-[0_4px_40px_-18px_rgba(0,0,0,0.55)] backdrop-blur-md transition-all duration-300 hover:border-violet-400/35 hover:shadow-[0_20px_50px_-20px_rgba(139,92,246,0.25)]">
                  <div className="relative mx-auto mb-6 inline-flex">
                    <div className="absolute inset-0 rounded-full bg-violet-500/25 blur-xl transition-opacity duration-300 group-hover:opacity-80" aria-hidden />
                    <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-full border border-violet-400/35 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 transition-transform duration-300 group-hover:scale-110">
                      <span className="text-3xl">{step.icon}</span>
                    </div>
                  </div>
                  <div className="mb-3 text-[11px] font-black uppercase tracking-[0.35em] text-violet-400/90">{step.num}</div>
                  <h3 className="mb-3 text-xl font-bold">{step.title}</h3>
                  <p className="leading-relaxed text-gray-400">{step.desc}</p>
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
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.4em] text-violet-300/80">
              On rotation
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
              Featured <span className="text-gradient">Artists</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Hand-picked profiles that showcase what a finished Book Your Artist page feels like.
            </p>
          </div>

          {featuredArtists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredArtists.map((artist) => (
                <FirebaseArtistCard key={artist.id || artist._id} artist={artist} />
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-violet-500/25 bg-gradient-to-br from-[#120A20]/90 to-transparent px-8 py-14 text-center">
              <p className="text-xl font-bold text-white">The spotlight is spinning up.</p>
              <p className="mt-2 text-sm text-gray-400">
                Featured artists rotate as new talent joins. Jump into search to explore everyone who&apos;s live right now.
              </p>
              <Link
                href="/search"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition hover:scale-[1.02]"
              >
                Explore the roster
              </Link>
            </div>
          )}

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
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-b from-[#120A20]/95 to-black/40 p-8 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/25 hover:shadow-[0_24px_50px_-24px_rgba(139,92,246,0.35)]"
              >
                <span
                  className="pointer-events-none absolute right-6 top-4 font-serif text-7xl leading-none text-violet-500/[0.12] transition-opacity group-hover:text-fuchsia-500/15"
                  aria-hidden
                >
                  &ldquo;
                </span>
                <div className="mb-5 flex gap-1">
                  <Stars rating={testimonial.rating} />
                </div>
                <p className="relative flex-1 text-sm leading-relaxed text-gray-300">{testimonial.text}</p>
                <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-black text-white shadow-lg shadow-violet-500/20">
                    {testimonial.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{testimonial.name}</p>
                    <p className="truncate text-xs text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="relative py-20 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/15 p-[1px] shadow-[0_0_80px_-20px_rgba(168,85,247,0.45)]">
            <div aria-hidden className="absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(139,92,246,0.25),transparent,rgba(236,72,153,0.2),transparent)] opacity-70" />
            <div className="relative overflow-hidden rounded-[calc(2rem-1px)] bg-[#14081f]/90 backdrop-blur-sm">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/35 via-transparent to-fuchsia-600/25 opacity-90"
              />
              <div className="relative z-10 px-8 py-16 text-center sm:px-12 sm:py-20">
                <p className="mb-4 text-[11px] font-black uppercase tracking-[0.45em] text-fuchsia-200/80">
                  Close the tabs. Open the show.
                </p>
                <h2 className="mb-4 text-3xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-4xl lg:text-5xl">
                  Ready for your headline act?
                </h2>
                <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-200/95">
                  Join clients and performers who swapped chaos for confirmations. One inbox, transparent pricing, applause included.
                </p>
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/search"
                    className="w-full rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-gray-950 shadow-xl transition hover:scale-[1.03] hover:bg-gray-100 sm:w-auto"
                  >
                    Browse artists now
                  </Link>
                  <Link
                    href="/sign-up"
                    className="w-full rounded-xl border-2 border-white/80 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-white/10 sm:w-auto"
                  >
                    Join free
                  </Link>
                </div>
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
