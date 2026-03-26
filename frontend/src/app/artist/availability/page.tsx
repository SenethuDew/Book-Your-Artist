"use client";

import Link from "next/link";
import { useAuth } from "@/contexts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_BASE_URL, getAuthToken } from "@/lib/api";

// Types
interface AvailabilitySlot {
  _id: string;
  artistId: string;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  date: string;
  startTime: string;
  endTime: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  availability?: AvailabilitySlot | AvailabilitySlot[];
  errors?: any;
}

function ArtistAvailabilityContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [formData, setFormData] = useState<FormData>({
    date: "",
    startTime: "",
    endTime: "",
  });

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch availability slots on mount
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const token = getAuthToken();
        
        const response = await fetch(`${API_BASE_URL}/api/availability/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = (await response.json()) as ApiResponse;

        if (data.success && data.availability) {
          const availabilityData = data.availability as AvailabilitySlot[];
          // Sort by date ascending (nearest first)
          const sorted = Array.isArray(availabilityData)
            ? [...availabilityData].sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
              )
            : [];
          setSlots(sorted);
        } else {
          setFetchError(data.message || "Failed to load availability slots");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setFetchError("Failed to load your availability slots. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSlots();
    }
  }, [user]);

  // Validation function
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate date
    if (!formData.date) {
      errors.date = "Date is required";
    } else {
      const selectedDate = new Date(formData.date);
      selectedDate.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errors.date = "Date cannot be in the past";
      }
    }

    // Validate start time
    if (!formData.startTime) {
      errors.startTime = "Start time is required";
    }

    // Validate end time
    if (!formData.endTime) {
      errors.endTime = "End time is required";
    }

    // Validate time order
    if (formData.startTime && formData.endTime) {
      const start = formData.startTime.split(":").map(Number);
      const end = formData.endTime.split(":").map(Number);
      const startMinutes = start[0] * 60 + start[1];
      const endMinutes = end[0] * 60 + end[1];

      if (endMinutes <= startMinutes) {
        errors.endTime = "End time must be after start time";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setSuccessMessage(null);
      setFetchError(null);
      const token = getAuthToken();

      const payload = {
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
      };

      const response = await fetch(`${API_BASE_URL}/api/availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as ApiResponse;

      if (data.success) {
        setSuccessMessage("Availability slot added successfully!");
        // Reset form
        setFormData({
          date: "",
          startTime: "",
          endTime: "",
        });
        
        // Refresh slots
        const fetchResponse = await fetch(`${API_BASE_URL}/api/availability/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const fetchData = (await fetchResponse.json()) as ApiResponse;
        if (fetchData.success) {
          const availabilityData = fetchData.availability as AvailabilitySlot[];
          const sorted = Array.isArray(availabilityData)
            ? [...availabilityData].sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
              )
            : [];
          setSlots(sorted);
        }
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setFetchError(data.message || "Failed to add availability slot");
      }
    } catch (error) {
      console.error("Submit error:", error);
      setFetchError("Failed to add availability slot. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (slotId: string) => {
    try {
      setDeleting(slotId);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/availability/${slotId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await response.json()) as ApiResponse;

      if (data.success) {
        setSlots((prevSlots) =>
          prevSlots.filter((slot) => slot._id !== slotId)
        );
        setDeleteConfirm(null);
        setSuccessMessage("Availability slot deleted successfully!");
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setFetchError(data.message || "Failed to delete slot");
      }
    } catch (error) {
      console.error("Delete error:", error);
      setFetchError("Failed to delete slot. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isPastSlot = (dateString: string): boolean => {
    const slotDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return slotDate < today;
  };

  const upcomingSlots = slots.filter((slot) => !isPastSlot(slot.date));
  const pastSlots = slots.filter((slot) => isPastSlot(slot.date));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mb-4"></div>
          <p>Loading availability slots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-700 bg-gray-800 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Book Your Artist</h1>
          <div className="flex items-center space-x-4">
            <Link
              href="/home/artist"
              className="text-gray-400 hover:text-white transition"
            >
              Dashboard
            </Link>
            <Link
              href="/artist/profile"
              className="text-gray-400 hover:text-white transition"
            >
              Profile
            </Link>
            <Link
              href="/bookings"
              className="text-gray-400 hover:text-white transition"
            >
              Bookings
            </Link>
            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">Availability Management</h2>
          <p className="text-gray-400">
            Manage your available time slots for bookings
          </p>
        </div>

        {/* Error Message */}
        {fetchError && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-200">{fetchError}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6">
            <p className="text-green-200">✓ {successMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add New Availability Form */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
              <h3 className="text-2xl font-bold mb-6">Add New Availability</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className={`w-full bg-gray-700 border rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition ${
                        validationErrors.date
                          ? "border-red-500"
                          : "border-gray-600"
                      }`}
                    />
                    {validationErrors.date && (
                      <p className="text-red-400 text-sm mt-1">
                        {validationErrors.date}
                      </p>
                    )}
                  </div>

                  {/* Start Time */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className={`w-full bg-gray-700 border rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition ${
                        validationErrors.startTime
                          ? "border-red-500"
                          : "border-gray-600"
                      }`}
                    />
                    {validationErrors.startTime && (
                      <p className="text-red-400 text-sm mt-1">
                        {validationErrors.startTime}
                      </p>
                    )}
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className={`w-full bg-gray-700 border rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition ${
                        validationErrors.endTime
                          ? "border-red-500"
                          : "border-gray-600"
                      }`}
                    />
                    {validationErrors.endTime && (
                      <p className="text-red-400 text-sm mt-1">
                        {validationErrors.endTime}
                      </p>
                    )}
                  </div>
                </div>

                {/* Button Group */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded font-bold transition"
                  >
                    {submitting ? "Adding..." : "Add Availability"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        date: "",
                        startTime: "",
                        endTime: "",
                      });
                      setValidationErrors({});
                    }}
                    className="px-6 py-3 rounded font-bold border border-gray-600 hover:border-gray-400 transition"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>

            {/* Availability Slots List */}
            <div className="space-y-6">
              {/* Upcoming Slots */}
              <div>
                <h3 className="text-2xl font-bold mb-4">Upcoming Slots</h3>
                {upcomingSlots.length > 0 ? (
                  <div className="grid gap-4">
                    {upcomingSlots.map((slot) => (
                      <div
                        key={slot._id}
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition flex justify-between items-center"
                      >
                        <div className="flex-1">
                          <p className="text-lg font-bold mb-1">
                            {formatDate(slot.date)}
                          </p>
                          <p className="text-gray-300">
                            <span className="font-semibold">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </p>
                        </div>
                        <div className="ml-4">
                          {deleteConfirm === slot._id ? (
                            <div className="flex flex-col gap-2">
                              <p className="text-sm text-gray-400 mb-2 w-32 text-right">
                                Confirm delete?
                              </p>
                              <button
                                onClick={() => handleDelete(slot._id)}
                                disabled={deleting === slot._id}
                                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 px-3 py-1 rounded text-sm font-bold whitespace-nowrap"
                              >
                                {deleting === slot._id ? "..." : "Yes"}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={deleting === slot._id}
                                className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-3 py-1 rounded text-sm font-bold whitespace-nowrap"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(slot._id)}
                              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold transition whitespace-nowrap"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
                    <p className="text-gray-400">No upcoming availability slots</p>
                  </div>
                )}
              </div>

              {/* Past Slots */}
              {pastSlots.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold mb-4">Past Slots</h3>
                  <div className="grid gap-4">
                    {pastSlots.map((slot) => (
                      <div
                        key={slot._id}
                        className="bg-gray-800 border border-gray-600 rounded-lg p-4 opacity-60"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="text-lg font-bold text-gray-400 mb-1">
                              {formatDate(slot.date)}
                            </p>
                            <p className="text-gray-400">
                              <span className="font-semibold">
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </p>
                          </div>
                          <span className="text-gray-500 text-sm font-semibold">Past</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 sticky top-20">
              <h3 className="text-xl font-bold mb-6">Summary</h3>

              <div className="space-y-4">
                {/* Total Slots */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-2">Total Slots</p>
                  <p className="text-3xl font-bold text-blue-400">{slots.length}</p>
                </div>

                {/* Upcoming Slots */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-2">Upcoming</p>
                  <p className="text-3xl font-bold text-green-400">
                    {upcomingSlots.length}
                  </p>
                </div>

                {/* Past Slots */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-2">Past</p>
                  <p className="text-3xl font-bold text-gray-400">
                    {pastSlots.length}
                  </p>
                </div>

                {/* Next Slot */}
                {upcomingSlots.length > 0 && (
                  <div className="border-t border-gray-700 pt-4">
                    <p className="text-gray-400 text-sm mb-3 uppercase font-bold">
                      Next Slot
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">
                        {formatDate(upcomingSlots[0].date)}
                      </p>
                      <p className="text-sm text-gray-300">
                        {upcomingSlots[0].startTime} - {upcomingSlots[0].endTime}
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

export default function ArtistAvailability() {
  return (
    <ProtectedRoute requiredRole="artist">
      <ArtistAvailabilityContent />
    </ProtectedRoute>
  );
}
