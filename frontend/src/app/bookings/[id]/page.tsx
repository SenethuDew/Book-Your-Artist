"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts";
import { API_BASE_URL } from "@/lib/api";

interface Booking {
  _id: string;
  clientId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    profileImage: string;
  };
  artistId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    profileImage: string;
  };
  eventDate: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  totalPrice: number;
  artistPrice: number;
  platformFee: number;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "disputed";
  paymentStatus: "pending" | "paid" | "refunded";
  eventType: string;
  eventLocation: {
    venue?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  eventDetails: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, { bg: string; text: string; icon: string }> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: "⏳" },
  confirmed: { bg: "bg-blue-100", text: "text-blue-800", icon: "✓" },
  completed: { bg: "bg-green-100", text: "text-green-800", icon: "✓✓" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-800", icon: "✗" },
  disputed: { bg: "bg-red-100", text: "text-red-800", icon: "⚠" },
};

export default function BookingDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!user || !bookingId) return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_BASE_URL}/api/bookings/${bookingId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          setBooking(data.booking);
        } else {
          alert("Booking not found");
          router.push("/bookings");
        }
      } catch (error) {
        console.error("Failed to fetch booking:", error);
        alert("Failed to load booking");
        router.push("/bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [user, bookingId, router]);

  const handleStatusChange = async (newStatus: string) => {
    if (!booking) return;

    setActionLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/bookings/${booking._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setBooking(data.booking);
        alert(`Booking ${newStatus} successfully!`);
      } else {
        alert("Failed to update booking: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("Failed to update booking");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    return `${hours}:${minutes}`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading booking...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Booking Not Found
          </h1>
          <Link href="/bookings" className="text-purple-600 hover:underline">
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const isClient = user?.role === "client";
  const isArtist = user?.role === "artist";
  const other = isClient ? booking.artistId : booking.clientId;
  const colors = statusColors[booking.status];
  const isUpcoming = new Date(booking.eventDate) > new Date();

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Link
              href="/bookings"
              className="text-purple-600 hover:underline mb-4 block"
            >
              ← Back to My Bookings
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Booking Details
            </h1>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Status Card */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Booking with {other.name}
                    </h2>
                    <p className="text-gray-600">
                      Booking ID: {booking._id}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`inline-block ${colors.bg} ${colors.text} px-4 py-2 rounded-lg text-sm font-bold mb-2`}
                    >
                      {colors.icon}{" "}
                      {booking.status.charAt(0).toUpperCase() +
                        booking.status.slice(1)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Created {formatDateTime(booking.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Event Timeline */}
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Event Date:</strong> {formatDate(booking.eventDate)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Time:</strong> {formatTime(booking.startTime)} to{" "}
                    {formatTime(booking.endTime)} ({booking.durationHours}
                    hours)
                  </p>
                  {booking.eventType && (
                    <p className="text-sm text-gray-600">
                      <strong>Event Type:</strong> {booking.eventType}
                    </p>
                  )}
                </div>
              </div>

              {/* Location Card */}
              {booking.eventLocation && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Location
                  </h3>
                  {booking.eventLocation.venue && (
                    <p className="text-gray-900 font-semibold">
                      {booking.eventLocation.venue}
                    </p>
                  )}
                  {booking.eventLocation.address && (
                    <p className="text-gray-600">{booking.eventLocation.address}</p>
                  )}
                  {booking.eventLocation.city && (
                    <p className="text-gray-600">
                      {booking.eventLocation.city}
                      {booking.eventLocation.country &&
                        `, ${booking.eventLocation.country}`}
                    </p>
                  )}
                </div>
              )}

              {/* Event Details Card */}
              {booking.eventDetails && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Event Details
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {booking.eventDetails}
                  </p>
                </div>
              )}

              {/* Payment Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Payment</h3>

                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900 font-semibold">
                      ${booking.totalPrice}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Platform Fee (15%)</span>
                    <span className="text-gray-900">
                      ${Math.round(booking.platformFee * 100) / 100}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 mb-2">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-purple-600">
                      ${booking.totalPrice}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded border-l-4 border-purple-600">
                  <p className="text-sm text-gray-600">
                    <strong>Payment Status:</strong>{" "}
                    {booking.paymentStatus === "paid" ? (
                      <span className="text-green-600">✓ Paid</span>
                    ) : (
                      <span className="text-yellow-600">Pending</span>
                    )}
                  </p>
                  {isClient && booking.paymentStatus === "pending" && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-600 mb-3">
                        Payment will be processed when you confirm the booking.
                      </p>
                      <button
                        onClick={() => router.push(`/checkout?bookingId=${booking._id}`)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition"
                      >
                        Pay Now
                      </button>
                    </div>
                  )}
                </div>

                {isArtist && (
                  <div className="mt-4 p-3 bg-green-50 rounded border-l-4 border-green-600">
                    <p className="text-sm text-gray-600">
                      <strong>You Earn:</strong>{" "}
                      <span className="text-2xl font-bold text-green-600">
                        ${booking.artistPrice}
                      </span>
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      After platform fee (15%), you&apos;ll receive this amount
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Contact & Actions */}
            <div className="lg:col-span-1">
              {/* Contact Card */}
              <div className="bg-white rounded-lg shadow p-6 mb-6 sticky top-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {isClient ? "Artist" : "Client"} Contact
                </h3>

                {/* Avatar */}
                <div className="mb-4">
                  {other.profileImage ? (
                    <Image
                      src={other.profileImage}
                      alt={other.name}
                      width={300}
                      height={128}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-32 bg-linear-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-5xl font-bold">
                        {other.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-lg font-bold text-gray-900 mb-1">
                  {other.name}
                </p>
                <p className="text-sm text-gray-600 break-all">{other.email}</p>
                {other.phone && (
                  <p className="text-sm text-gray-600">{other.phone}</p>
                )}

                {/* Action Buttons */}
                <div className="mt-4 space-y-2">
                  {/* Confirm/Decline Buttons */}
                  {isArtist &&
                    booking.status === "pending" &&
                    isUpcoming && (
                      <>
                        <button
                          onClick={() => handleStatusChange("confirmed")}
                          disabled={actionLoading}
                          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 rounded-lg transition"
                        >
                          {actionLoading ? "Processing..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => handleStatusChange("cancelled")}
                          disabled={actionLoading}
                          className="w-full border border-gray-300 hover:bg-gray-100 disabled:bg-gray-100 text-gray-700 font-bold py-2 rounded-lg transition"
                        >
                          {actionLoading ? "Processing..." : "Decline"}
                        </button>
                      </>
                    )}

                  {/* Cancel Buttons */}
                  {(booking.status === "pending" || booking.status === "confirmed") &&
                    isUpcoming && (
                      <button
                        onClick={() => handleStatusChange("cancelled")}
                        disabled={actionLoading}
                        className="w-full border border-red-300 hover:bg-red-50 disabled:bg-gray-100 text-red-600 font-bold py-2 rounded-lg transition"
                      >
                        {actionLoading ? "Processing..." : "Cancel Booking"}
                      </button>
                    )}

                  {/* Message Button */}
                  <button
                    onClick={() => router.push(`/messages?userId=${other._id}`)}
                    className="w-full border border-purple-300 hover:bg-purple-50 text-purple-600 font-bold py-2 rounded-lg transition"
                  >
                    Send Message
                  </button>

                  {/* Review Button */}
                  {isClient && booking.status === "completed" && (
                    <Link
                      href={`/reviews/new?bookingId=${booking._id}`}
                      className="block text-center w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition"
                    >
                      Leave Review
                    </Link>
                  )}
                </div>
              </div>

              {/* Timeline Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-400 mt-2 shrink-0"></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Booking Created
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDateTime(booking.createdAt)}
                      </p>
                    </div>
                  </div>

                  {booking.status === "confirmed" && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Booking Confirmed
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDateTime(booking.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {booking.status === "completed" && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Event Completed
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDateTime(booking.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {booking.status === "cancelled" && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Booking Cancelled
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDateTime(booking.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {isUpcoming && booking.status !== "cancelled" && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 shrink-0"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Event Scheduled
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDate(booking.eventDate)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}
