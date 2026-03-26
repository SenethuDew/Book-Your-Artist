"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { API_BASE_URL } from "@/lib/api";

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

export default function SearchArtists() {
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      setSelectedGenres(urlParams.get("genres")?.split(",").filter(Boolean) || []);
      setMinPrice(urlParams.get("minPrice") || "");
      setMaxPrice(urlParams.get("maxPrice") || "");
      setMinRating(urlParams.get("minRating") || "");
      setPage(parseInt(urlParams.get("page") || "1", 10));
    }
  }, []);

  // Load genres and price stats
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [genresRes, priceRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/artists/genres`),
          fetch(`${API_BASE_URL}/api/artists/price-stats`),
        ]);

        const genresData = await genresRes.json();
        const priceData = await priceRes.json();

        if (genresData.success) {
          setGenres(genresData.genres);
        }
        if (priceData.success) {
          setPriceStats(priceData.priceStats);
        }
      } catch (error) {
        console.error("Failed to load filters:", error);
        setError("Some filters could not be loaded. You can still browse artists.");
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

        if (selectedGenres.length > 0) {
          selectedGenres.forEach((g) => params.append("genres", g));
        }
        if (minPrice) params.append("minPrice", minPrice);
        if (maxPrice) params.append("maxPrice", maxPrice);
        if (minRating) params.append("minRating", minRating);
        params.append("page", page.toString());
        params.append("limit", "12");

        const response = await fetch(
          `${API_BASE_URL}/api/artists/search?${params}`
        );
        const data = await response.json();

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
  }, [selectedGenres, minPrice, maxPrice, minRating, page]);

  const handleGenreToggle = (genre: string) => {
    setPage(1);
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const handleClearFilters = () => {
    setSelectedGenres([]);
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setPage(1);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= Math.round(rating) ? "text-yellow-400" : "text-gray-600"
            }`}
          >
            ★
          </span>
        ))}
        <span className="ml-1 text-sm text-gray-300">({rating.toFixed(1)})</span>
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

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 via-gray-900 to-gray-950 text-white">
      <header className="sticky top-0 z-20 border-b border-gray-800/50 bg-gray-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-white transition hover:text-blue-400 sm:text-2xl">
            Book Your Artist
          </Link>
          <nav className="flex items-center gap-4 text-sm sm:gap-6 sm:text-base">
            <Link href="/home/client" className="text-gray-300 transition hover:text-blue-400">
              Client Home
            </Link>
            <Link href="/bookings" className="text-gray-300 transition hover:text-blue-400">
              My Bookings
            </Link>
            <Link href="/search" className="font-semibold text-blue-400">
              Browse Artists
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 rounded-2xl border border-gray-800 bg-gray-800/50 p-6 sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Browse Artists
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base">
            Discover verified performers by genre, budget, and rating. Compare profiles and book the perfect artist for your event.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-900/25 px-4 py-3 text-sm text-red-200" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
          {/* Sidebar - Filters */}
          <aside className="h-fit rounded-2xl border border-gray-700 bg-gray-800/80 p-6 shadow-xl lg:sticky lg:top-24">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Filters</h2>
              <button
                onClick={handleClearFilters}
                className="rounded-lg border border-gray-600 bg-gray-700/60 px-3 py-1.5 text-xs font-semibold text-gray-200 transition hover:border-gray-500 hover:bg-gray-700"
              >
                Clear
              </button>
            </div>

            {/* Genre Filter */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-300">Genre</h3>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {genres.map((genre) => (
                  <label key={genre} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-gray-700/60">
                    <input
                      type="checkbox"
                      checked={selectedGenres.includes(genre)}
                      onChange={() => handleGenreToggle(genre)}
                      className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500/40"
                    />
                    <span className="text-sm text-gray-200">{genre}</span>
                  </label>
                ))}
                {genres.length === 0 && (
                  <p className="text-xs text-gray-400">Genres will appear here when available.</p>
                )}
              </div>
            </div>

            <hr className="my-5 border-gray-700" />

            {/* Price Filter */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-300">Price Range</h3>
              <div className="mb-2 text-xs text-gray-400">
                ${priceStats.min} - ${priceStats.max}/hour
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            <hr className="my-5 border-gray-700" />

            {/* Rating Filter */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-300">Minimum Rating</h3>
              <select
                value={minRating}
                onChange={(e) => {
                  setMinRating(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="">All Ratings</option>
                <option value="4">4+ Stars</option>
                <option value="3.5">3.5+ Stars</option>
                <option value="3">3+ Stars</option>
              </select>
            </div>
          </aside>

          {/* Main Content */}
          <section>
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-800/50 px-4 py-3">
              <p className="text-sm text-gray-300">
                {artists.length > 0
                  ? `Showing ${artists.length} artist${artists.length > 1 ? "s" : ""} on page ${page} of ${totalPages}`
                  : "Apply filters or clear them to discover available artists."}
              </p>
              <p className="text-xs text-gray-400">Results update automatically when filters change.</p>
            </div>

            {/* Artist Cards Grid */}
            {loading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-80 animate-pulse rounded-2xl border border-gray-800 bg-gray-800/70"
                  />
                ))}
              </div>
            ) : artists.length > 0 ? (
              <>
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                  {artists.map((artist) => (
                    <Link
                      key={artist._id}
                      href={`/artists/${artist._id}`}
                    >
                      <article className="h-full overflow-hidden rounded-2xl border border-gray-700 bg-gray-800/85 transition duration-200 hover:-translate-y-1 hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-900/20">
                        {/* Artist Image */}
                        {artist.user.profileImage ? (
                          <Image
                            src={artist.user.profileImage}
                            alt={artist.user.name}
                            width={300}
                            height={192}
                            className="h-48 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-48 w-full items-center justify-center bg-linear-to-br from-blue-700 to-blue-900">
                            <span className="text-4xl font-bold text-white">
                              {artist.user.name.charAt(0)}
                            </span>
                          </div>
                        )}

                        {/* Card Content */}
                        <div className="p-5">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-xl font-bold text-white">
                                {artist.user.name}
                              </h3>
                              <p className="text-sm text-gray-300">
                                {artist.genres?.[0] || "Performer"} • {artist.user.phone ? "Contact available" : "Contact on request"}
                              </p>
                              <p className="mt-1 text-xs text-gray-400">
                                {artist.user.phone ? "Location: Flexible / On-request" : "Location: Remote / Flexible"}
                              </p>
                            </div>
                            {artist.verified && (
                              <span className="rounded-full border border-green-500/40 bg-green-500/10 px-2 py-1 text-xs font-semibold text-green-300">
                                ✓ Verified
                              </span>
                            )}
                          </div>

                          {/* Genres */}
                          <div className="mb-4 flex flex-wrap gap-2">
                            {artist.genres.slice(0, 3).map((genre) => (
                              <span
                                key={genre}
                                className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-200"
                              >
                                {genre}
                              </span>
                            ))}
                            {artist.genres.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{artist.genres.length - 3} more
                              </span>
                            )}
                          </div>

                          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-300">
                            {getShortBio(artist)}
                          </p>

                          {/* Rating */}
                          <div className="mb-4">
                            {renderStars(artist.rating)}
                            <p className="mt-1 text-xs text-gray-400">
                              {artist.reviewCount} reviews
                            </p>
                          </div>

                          {/* Price */}
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-xs text-gray-400">Hourly Rate</p>
                              <p className="text-2xl font-bold text-blue-400">
                                ${artist.hourlyRate}
                              </p>
                            </div>
                            <span className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">
                              View Profile
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm text-gray-200 transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setPage(i + 1)}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                          page === i + 1
                            ? "bg-blue-600 text-white"
                            : "border border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm text-gray-200 transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-gray-700 bg-gray-800/70 p-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-700 text-2xl">
                  🎵
                </div>
                <h3 className="text-xl font-bold text-white">No Artists Found</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-gray-300">
                  We could not find artists matching your current filters. Try broadening your price range or removing one filter.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
