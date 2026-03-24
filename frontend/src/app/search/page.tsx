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
      }
    };

    fetchFilters();
  }, []);

  // Search artists with filters
  useEffect(() => {
    const searchArtists = async () => {
      setLoading(true);
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
        }
      } catch (error) {
        console.error("Search failed:", error);
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
              star <= Math.round(rating) ? "text-yellow-500" : "text-gray-300"
            }`}
          >
            ★
          </span>
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-purple-600">
            Book-Your-Artist
          </Link>
          <nav className="flex gap-4">
            <Link href="/home/client" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/search" className="text-purple-600 font-semibold">
              Browse Artists
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <div className="bg-white rounded-lg shadow p-6 h-fit sticky top-20">
            <h2 className="text-xl font-bold mb-6">Filters</h2>

            {/* Genre Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Genre</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {genres.map((genre) => (
                  <label key={genre} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGenres.includes(genre)}
                      onChange={() => handleGenreToggle(genre)}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="text-sm text-gray-700">{genre}</span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="my-4" />

            {/* Price Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Price Range</h3>
              <div className="text-xs text-gray-500 mb-2">
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
                  className="border rounded px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setPage(1);
                  }}
                  className="border rounded px-2 py-1 text-sm"
                />
              </div>
            </div>

            <hr className="my-4" />

            {/* Rating Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Min Rating</h3>
              <select
                value={minRating}
                onChange={(e) => {
                  setMinRating(e.target.value);
                  setPage(1);
                }}
                className="w-full border rounded px-2 py-2 text-sm"
              >
                <option value="">All Ratings</option>
                <option value="4">4+ Stars</option>
                <option value="3.5">3.5+ Stars</option>
                <option value="3">3+ Stars</option>
              </select>
            </div>

            <button
              onClick={handleClearFilters}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded transition"
            >
              Clear Filters
            </button>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Find & Book Your Favorite Musicians
              </h1>
              <p className="text-gray-600">
                {artists.length > 0
                  ? `Showing ${artists.length} of ${(totalPages || 1) * 12} artists`
                  : "No artists found. Try adjusting your filters."}
              </p>
            </div>

            {/* Artist Cards Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-200 rounded-lg h-72 animate-pulse"
                  />
                ))}
              </div>
            ) : artists.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {artists.map((artist) => (
                    <Link
                      key={artist._id}
                      href={`/artists/${artist._id}`}
                    >
                      <div className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden">
                        {/* Artist Image */}
                        {artist.user.profileImage ? (
                          <Image
                            src={artist.user.profileImage}
                            alt={artist.user.name}
                            width={300}
                            height={192}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-linear-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                            <span className="text-white text-4xl">
                              {artist.user.name.charAt(0)}
                            </span>
                          </div>
                        )}

                        {/* Card Content */}
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">
                                {artist.user.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {artist.yearsOfExperience || "N/A"} years experience
                              </p>
                            </div>
                            {artist.verified && (
                              <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                                ✓ Verified
                              </span>
                            )}
                          </div>

                          {/* Genres */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {artist.genres.slice(0, 3).map((genre) => (
                              <span
                                key={genre}
                                className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded"
                              >
                                {genre}
                              </span>
                            ))}
                            {artist.genres.length > 3 && (
                              <span className="text-xs text-gray-600">
                                +{artist.genres.length - 3} more
                              </span>
                            )}
                          </div>

                          {/* Rating */}
                          <div className="mb-3">
                            {renderStars(artist.rating)}
                            <p className="text-xs text-gray-600 mt-1">
                              {artist.reviewCount} reviews
                            </p>
                          </div>

                          {/* Price */}
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-xs text-gray-600">Hourly Rate</p>
                              <p className="text-lg font-bold text-purple-600">
                                ${artist.hourlyRate}
                              </p>
                            </div>
                            <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm font-semibold transition">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setPage(i + 1)}
                        className={`px-4 py-2 rounded ${
                          page === i + 1
                            ? "bg-purple-600 text-white"
                            : "border hover:bg-gray-100"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600 text-lg">
                  No artists found matching your criteria. Please try adjusting your filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
