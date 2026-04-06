"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { API_BASE_URL, apiCall } from "@/lib/api";
import { useAuth } from "@/contexts";

interface Artist {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    profileImage: string;
    phone: string;
  };
  genres: string[];
  specialties?: string[];
  serviceTypes?: string[];
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  yearsOfExperience: number;
}

interface PriceStats {
  min: number;
  max: number;
  average: number;
}

interface CategoryOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  borderColor: string;
  genres: string[]; // genres to filter by for this category
}

const ARTIST_CATEGORIES: CategoryOption[] = [
  {
    id: "singers",
    name: "Singers",
    icon: "🎤",
    color: "from-violet-500/20 to-fuchsia-500/20",
    borderColor: "border-violet-500/30 hover:border-violet-400/60",
    genres: ["Vocals", "Singing", "Singer", "Soul", "Jazz", "Pop", "R&B"],
  },
  {
    id: "djs",
    name: "DJs",
    icon: "🎧",
    color: "from-cyan-500/20 to-blue-500/20",
    borderColor: "border-cyan-500/30 hover:border-cyan-400/60",
    genres: ["DJ", "Electronic", "House", "Techno", "EDM", "Mixing"],
  },
  {
    id: "bands",
    name: "Bands",
    icon: "🎸",
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/30 hover:border-amber-400/60",
    genres: ["Band", "Rock", "Ensemble", "Group", "Live Band"],
  },
];

export default function SearchArtists() {
  const { user } = useAuth();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [priceStats, setPriceStats] = useState<PriceStats>({
    min: 0,
    max: 0,
    average: 0,
  });

  // Filter state
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(""); // Category filter state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      setSelectedGenres(urlParams.get("genres")?.split(",").filter(Boolean) || []);
      setMinPrice(urlParams.get("minPrice") || "");
      setMaxPrice(urlParams.get("maxPrice") || "");
      setMinRating(urlParams.get("minRating") || "");
      setSelectedCategory(urlParams.get("category") || "");
      setPage(parseInt(urlParams.get("page") || "1", 10));
    }
  }, []);

  // Load genres and price stats
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [genresData, priceData] = await Promise.all([
          apiCall<any>("/api/artists/genres"),
          apiCall<any>("/api/artists/price-stats"),
        ]);

        if (genresData.success) {
          setGenres(genresData.genres);
        }
        if (priceData.success) {
          setPriceStats(priceData.priceStats);
        }
      } catch (error) {
        console.error("Failed to load filters:", error);
      }
    };

    fetchFilters();
  }, []);

  // Search artists with filters
  useEffect(() => {
    const searchArtists = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        // Add category genres to selected genres
        let genresToFilter = [...selectedGenres];
        if (selectedCategory) {
          const category = ARTIST_CATEGORIES.find((c) => c.id === selectedCategory);
          if (category) {
            // Add category genres, avoiding duplicates
            genresToFilter = [
              ...new Set([
                ...genresToFilter,
                ...category.genres.filter((g) =>
                  genres.some((availableGenre) =>
                    availableGenre.toLowerCase().includes(g.toLowerCase())
                  )
                ),
              ]),
            ];
          }
        }

        if (genresToFilter.length > 0) {
          genresToFilter.forEach((g) => params.append("genres", g));
        }
        if (minPrice) params.append("minPrice", minPrice);
        if (maxPrice) params.append("maxPrice", maxPrice);
        if (minRating) params.append("minRating", minRating);
        params.append("page", page.toString());
        params.append("limit", "12");

        const data = await apiCall<any>(`/api/artists/search?${params}`);

        if (data.success) {
          setArtists(data.artists);
          setTotalPages(data.pagination.pages);
        } else {
          setArtists([]);
          setError(data.message || "Unable to load artists right now.");
        }
      } catch (error) {
        console.error("Search failed:", error);
        setArtists([]);
        setError("Unable to load artists. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    searchArtists();
  }, [selectedGenres, selectedCategory, minPrice, maxPrice, minRating, page, genres]);

  const handleGenreToggle = (genre: string) => {
    setPage(1);
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const handleCategoryChange = (categoryId: string) => {
    setPage(1);
    setSelectedCategory((prev) => (prev === categoryId ? "" : categoryId));
  };

  const handleClearFilters = () => {
    setSelectedGenres([]);
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setSelectedCategory("");
    setPage(1);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= Math.round(rating) ? "text-amber-400" : "text-gray-600"
            }`}
          >
            ★
          </span>
        ))}
        <span className="ml-1 text-sm font-semibold text-gray-300">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const getShortBio = (artist: Artist) => {
    if (artist.specialties && artist.specialties.length > 0) {
      return artist.specialties.slice(0, 2).join(" • ");
    }
    if (artist.serviceTypes && artist.serviceTypes.length > 0) {
      return `Available for ${artist.serviceTypes.slice(0, 2).join(" and ")}`;
    }
    return `${artist.yearsOfExperience || 1}+ years performing at private and public events.`;
  };

  const getArtistCategory = (artist: Artist) => {
    const artistGenres = artist.genres.map((g) => g.toLowerCase());
    
    for (const category of ARTIST_CATEGORIES) {
      if (
        category.genres.some((g) =>
          artistGenres.some((ag) =>
            ag.includes(g.toLowerCase()) || g.toLowerCase().includes(ag)
          )
        )
      ) {
        return category;
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white">
      {/* ═══════════════ NAVBAR ═══════════════ */}
      <header className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl bg-gradient-to-b from-gray-950/80 via-purple-950/40 to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-sm group-hover:shadow-lg group-hover:shadow-violet-500/50 transition-all">
                ♪
              </div>
              <span className="text-lg font-bold tracking-tight hidden sm:inline">
                <span className="text-gradient">Book</span>Your<span className="text-gradient">Artist</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm">
              {user?.role === "client" && (
                <>
                  <Link href="/home/client" className="text-gray-300 hover:text-white transition">
                    Client Home
                  </Link>
                  <Link href="/bookings" className="text-gray-300 hover:text-white transition">
                    My Bookings
                  </Link>
                </>
              )}
              <Link href="/search" className="font-semibold text-violet-400">
                Browse Artists
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              {user ? (
                <Link
                  href={user.role === "client" ? "/home/client" : user.role === "artist" ? "/home/artist" : "/"}
                  className="text-sm font-medium text-gray-300 hover:text-white transition"
                >
                  {user.role === "client" && "Dashboard"}
                  {user.role === "artist" && "Artist Dashboard"}
                  {!user.role && "Home"}
                </Link>
              ) : (
                <Link href="/sign-in" className="text-sm font-medium text-gray-300 hover:text-white transition">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3">
              Browse <span className="text-gradient">Artists</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Discover and book verified musicians, DJs, and bands for your events. Compare profiles, check ratings, and secure your perfect performer.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {ARTIST_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`group relative px-4 sm:px-6 py-3 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 flex items-center gap-2 border ${
                  selectedCategory === category.id
                    ? `bg-gradient-to-r ${category.color.replace("/20", "")} border-violet-500/60 text-white shadow-lg shadow-violet-500/20`
                    : "border-white/10 text-gray-300 hover:text-white hover:border-white/20 bg-white/5"
                }`}
              >
                <span className="text-xl">{category.icon}</span>
                <span>{category.name}</span>
                {selectedCategory === category.id && (
                  <span className="ml-1 text-xs font-bold text-violet-300">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-900/25 px-4 py-3 text-sm text-red-200 flex items-start gap-3" role="alert">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          {/* ═════════ SIDEBAR FILTERS ═════════ */}
          <aside className="h-fit lg:sticky lg:top-24">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-6 space-y-6">
              {/* Filters Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">Filters</h2>
                <button
                  onClick={handleClearFilters}
                  className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition"
                >
                  Clear All
                </button>
              </div>

              {/* Genre Filter */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-widest text-gray-300 block">
                  Genre
                </label>
                <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
                  {genres.length > 0 ? (
                    genres.map((genre) => (
                      <label key={genre} className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-white/5 transition group">
                        <input
                          type="checkbox"
                          checked={selectedGenres.includes(genre)}
                          onChange={() => handleGenreToggle(genre)}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800/50 text-violet-500 focus:ring-2 focus:ring-violet-500/40 cursor-pointer"
                        />
                        <span className="text-sm text-gray-300 group-hover:text-white transition">
                          {genre}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 py-2">Loading genres...</p>
                  )}
                </div>
              </div>

              <div className="border-t border-white/5" />

              {/* Price Filter */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-widest text-gray-300 block">
                  Hourly Rate
                </label>
                <p className="text-xs text-gray-400 mb-3">
                  Range: ${priceStats.min.toFixed(0)} - ${priceStats.max.toFixed(0)}/hr
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition"
                  />
                </div>
              </div>

              <div className="border-t border-white/5" />

              {/* Rating Filter */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-widest text-gray-300 block">
                  Minimum Rating
                </label>
                <select
                  value={minRating}
                  onChange={(e) => {
                    setMinRating(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition"
                >
                  <option value="">All Ratings</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="3.5">3.5+ Stars</option>
                  <option value="3">3+ Stars</option>
                </select>
              </div>
            </div>
          </aside>

          {/* ═════════ MAIN RESULTS ═════════ */}
          <section className="space-y-6">
            {/* Results Info */}
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-sm">
              <div className="text-sm text-gray-300">
                {loading ? (
                  "Loading artists..."
                ) : artists.length > 0 ? (
                  <>
                    <span className="font-semibold text-white">{artists.length}</span> artists • Page{" "}
                    <span className="font-semibold text-white">{page}</span> of{" "}
                    <span className="font-semibold text-white">{totalPages}</span>
                  </>
                ) : (
                  "No artists found with your filters"
                )}
              </div>
              <button
                onClick={handleClearFilters}
                className="hidden sm:inline text-xs font-semibold text-gray-400 hover:text-white transition"
              >
                Reset
              </button>
            </div>

            {/* Artist Cards Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-96 rounded-2xl border border-white/10 bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : artists.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {artists.map((artist) => {
                    const artistCategory = getArtistCategory(artist);
                    return (
                      <div
                        key={artist._id}
                        className="group relative h-full overflow-hidden rounded-2xl border border-white/10 hover:border-white/30 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/10"
                      >
                        {/* Image */}
                        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20">
                          {artist.user.profileImage ? (
                            <Image
                              src={artist.user.profileImage}
                              alt={artist.user.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-600 to-fuchsia-600">
                              <span className="text-5xl font-bold text-white/80">
                                {artist.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}

                          {/* Category Badge */}
                          {artistCategory && (
                            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/20">
                              <span className="text-sm">{artistCategory.icon}</span>
                              <span className="text-xs font-semibold text-white">{artistCategory.name}</span>
                            </div>
                          )}

                          {/* Verified Badge */}
                          {artist.verified && (
                            <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/20 backdrop-blur-sm border border-green-500/40">
                              <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs font-semibold text-green-300">Verified</span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4">
                          {/* Name & Location */}
                          <div>
                            <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition line-clamp-1">
                              {artist.user.name}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                              📍 {artist.user.phone ? "Contact available" : "Flexible location"}
                            </p>
                          </div>

                          {/* Genres */}
                          <div className="flex flex-wrap gap-2">
                            {artist.genres.slice(0, 2).map((genre) => (
                              <span
                                key={genre}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-violet-500/20 border border-violet-500/30 text-violet-200"
                              >
                                {genre}
                              </span>
                            ))}
                            {artist.genres.length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 text-xs text-gray-400">
                                +{artist.genres.length - 2} more
                              </span>
                            )}
                          </div>

                          {/* Bio */}
                          <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                            {getShortBio(artist)}
                          </p>

                          {/* Experience */}
                          <p className="text-xs text-gray-500">
                            ⭐ {artist.yearsOfExperience || 1}+ years of experience
                          </p>

                          {/* Rating & Reviews */}
                          <div className="space-y-2">
                            <div>{renderStars(artist.rating)}</div>
                            <p className="text-xs text-gray-500">
                              {artist.reviewCount} {artist.reviewCount === 1 ? "review" : "reviews"}
                            </p>
                          </div>

                          <div className="border-t border-white/10 pt-4" />

                          {/* Price & Actions */}
                          <div className="flex items-end justify-between gap-3">
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">From</p>
                              <p className="text-2xl font-bold text-gradient">
                                ${artist.hourlyRate}
                                <span className="text-xs font-normal text-gray-400">/hr</span>
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 w-32">
                              <Link
                                href={`/artists/${artist._id}`}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-all duration-300 group/btn"
                              >
                                <span>View Profile</span>
                                <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                              <Link
                                href={user ? `/artists/${artist._id}` : "/sign-in"}
                                className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-semibold text-violet-300 border border-violet-500/30 hover:bg-violet-500/10 transition-all duration-300 group/btn"
                              >
                                Book Now
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-8 pt-8 border-t border-white/10">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      ← Previous
                    </button>

                    <div className="flex flex-wrap gap-1.5">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`w-10 h-10 rounded-lg text-sm font-semibold transition ${
                              page === pageNum
                                ? "bg-violet-600 text-white"
                                : "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Empty State */
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-12 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/30">
                    <span className="text-3xl">🎵</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">No Artists Found</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    We couldn't find any artists matching your current filters. Try adjusting your price range, removing genre filters, or selecting a different category.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  <button
                    onClick={handleClearFilters}
                    className="px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 transition-all duration-300"
                  >
                    Reset All Filters
                  </button>
                  <Link
                    href="/"
                    className="px-6 py-2.5 rounded-lg font-semibold text-white border border-white/10 hover:bg-white/10 transition-all duration-300 inline-block"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
