"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

interface ArtistDetail {
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
  yearsOfExperience: number;
  serviceTypes: string[];
  portfolio: {
    videoLinks: string[];
    audioLinks: string[];
    images: string[];
  };
  verified: boolean;
  rating: number;
  reviewCount: number;
  reviewStats: {
    averageRating: number;
    totalReviews: number;
    verified: boolean;
  };
}

interface Review {
  _id: string;
  rating: number;
  title: string;
  comment: string;
  client: {
    _id: string;
    name: string;
    profileImage: string;
  };
  createdAt: string;
}

export default function ArtistDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const artistId = params.id as string;

  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDetails, setEventDetails] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchArtistDetail = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/artists/${artistId}`
        );
        const data = await response.json();

        if (data.success) {
          setArtist(data.artist);
          setReviews(data.reviews || []);
        }
      } catch (error) {
        console.error("Failed to fetch artist:", error);
      } finally {
        setLoading(false);
      }
    };

    if (artistId) {
      fetchArtistDetail();
    }
  }, [artistId]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push("/login");
      return;
    }

    setBookingLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          artistId,
          eventDate: new Date(bookingDate).toISOString(),
          startTime,
          endTime,
          eventType,
          eventDetails,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Booking created successfully!");
        setShowBooking(false);
        setBookingDate("");
        setStartTime("");
        setEndTime("");
        setEventType("");
        setEventDetails("");
      } else {
        alert("Booking failed: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert("Failed to create booking");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading artist details...</div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Artist Not Found
          </h1>
          <Link href="/search" className="text-purple-600 hover:underline">
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-purple-600">
            Book-Your-Artist
          </Link>
          <nav className="flex gap-4">
            <Link href="/search" className="text-gray-600 hover:text-gray-900">
              Browse Artists
            </Link>
            {user && (
              <Link href="/home/client" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
            )}
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/search" className="text-purple-600 hover:underline mb-4 block">
          ← Back to Search
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Hero Section */}
          <div className="relative h-96 bg-linear-to-br from-purple-400 to-purple-600">
            {artist.user.profileImage ? (
              <Image
                src={artist.user.profileImage}
                alt={artist.user.name}
                fill
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white text-9xl opacity-50">
                  {artist.user.name.charAt(0)}
                </span>
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-30" />

            {/* Profile Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black to-transparent p-8">
              <div className="text-white">
                <h1 className="text-5xl font-bold mb-2">{artist.user.name}</h1>
                <div className="flex items-center gap-4">
                  {artist.verified && (
                    <span className="bg-green-500 px-3 py-1 rounded-full text-sm font-semibold">
                      ✓ Verified
                    </span>
                  )}
                  <span className="text-lg">
                    {artist.yearsOfExperience} years of experience
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-3 gap-8 p-8">
            {/* Left Column - Info */}
            <div className="col-span-2">
              {/* Quick Stats */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Quick Stats</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-gray-600 text-sm mb-1">Rating</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {artist.rating}
                    </p>
                    <p className="text-xs text-gray-600">
                      {artist.reviewCount} reviews
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-600 text-sm mb-1">Hourly Rate</p>
                    <p className="text-3xl font-bold text-blue-600">
                      ${artist.hourlyRate}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-gray-600 text-sm mb-1">Contact</p>
                    <p className="text-sm font-semibold text-green-600">
                      {artist.user.phone || "Available"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Genres */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Genres</h2>
                <div className="flex flex-wrap gap-2">
                  {artist.genres.map((genre) => (
                    <span
                      key={genre}
                      className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-semibold"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              {/* Service Types */}
              {artist.serviceTypes && artist.serviceTypes.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">Services</h2>
                  <ul className="space-y-2">
                    {artist.serviceTypes.map((service) => (
                      <li key={service} className="flex items-center gap-2 text-gray-700">
                        <span className="text-green-500">✓</span> {service}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Portfolio */}
              {artist.portfolio && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">Portfolio</h2>

                  {/* Videos */}
                  {artist.portfolio.videoLinks &&
                    artist.portfolio.videoLinks.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Videos</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {artist.portfolio.videoLinks.map((video, idx) => (
                            <a
                              key={idx}
                              href={video}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:underline"
                            >
                              Video {idx + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Audio */}
                  {artist.portfolio.audioLinks &&
                    artist.portfolio.audioLinks.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Audio Samples</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {artist.portfolio.audioLinks.map((audio, idx) => (
                            <a
                              key={idx}
                              href={audio}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:underline"
                            >
                              Audio {idx + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Images */}
                  {artist.portfolio.images &&
                    artist.portfolio.images.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Gallery</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {artist.portfolio.images.map((image, idx) => (
                            <Image
                              key={idx}
                              src={image}
                              alt={`Gallery ${idx + 1}`}
                              width={200}
                              height={128}
                              className="w-full h-32 object-cover rounded-lg hover:scale-105 transition cursor-pointer"
                              onClick={() =>
                                window.open(image, "_blank")
                              }
                            />
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Reviews Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Reviews</h2>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review._id}
                        className="border-l-4 border-purple-600 pl-4 py-2"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {review.client.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-lg ${
                                  star <= review.rating
                                    ? "text-yellow-500"
                                    : "text-gray-300"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        {review.title && (
                          <p className="font-semibold text-gray-900 mb-1">
                            {review.title}
                          </p>
                        )}
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No reviews yet</p>
                )}
              </div>
            </div>

            {/* Right Column - Booking Widget */}
            <div className="col-span-1">
              <div className="bg-gray-50 rounded-lg p-6 sticky top-24">
                <h3 className="text-xl font-bold mb-4">Book This Artist</h3>

                {!showBooking ? (
                  <button
                    onClick={() => setShowBooking(true)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition"
                  >
                    Request Booking
                  </button>
                ) : (
                  <form onSubmit={handleBooking} className="space-y-4">
                    {/* Event Date */}
                    <div>
                      <label className="block text-sm font-semibold mb-1">
                        Event Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>

                    {/* Start Time */}
                    <div>
                      <label className="block text-sm font-semibold mb-1">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>

                    {/* End Time */}
                    <div>
                      <label className="block text-sm font-semibold mb-1">
                        End Time *
                      </label>
                      <input
                        type="time"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>

                    {/* Event Type */}
                    <div>
                      <label className="block text-sm font-semibold mb-1">
                        Event Type
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Wedding, Party, Concert"
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>

                    {/* Event Details */}
                    <div>
                      <label className="block text-sm font-semibold mb-1">
                        Details
                      </label>
                      <textarea
                        placeholder="Additional details..."
                        value={eventDetails}
                        onChange={(e) => setEventDetails(e.target.value)}
                        className="w-full border rounded px-3 py-2 h-20 resize-none"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={bookingLoading}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-2 rounded transition"
                      >
                        {bookingLoading ? "Booking..." : "Confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowBooking(false);
                          setBookingDate("");
                          setStartTime("");
                          setEndTime("");
                          setEventType("");
                          setEventDetails("");
                        }}
                        className="flex-1 border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold py-2 rounded transition"
                      >
                        Cancel
                      </button>
                    </div>

                    {!user && (
                      <p className="text-xs text-gray-600 text-center mt-2">
                        You need to{" "}
                        <Link
                          href="/login"
                          className="text-purple-600 hover:underline"
                        >
                          login
                        </Link>{" "}
                        to book this artist
                      </p>
                    )}
                  </form>
                )}

                {/* Contact Info */}
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-600 mb-2">Contact directly:</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {artist.user.email}
                  </p>
                  {artist.user.phone && (
                    <p className="text-sm font-semibold text-gray-900">
                      {artist.user.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
