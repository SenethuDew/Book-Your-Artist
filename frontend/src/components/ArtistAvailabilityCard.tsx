"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Plus, Loader2 } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

interface AvailabilitySlot {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "Available" | "Booked" | "Blocked";
  isPublished: boolean;
}

interface ArtistAvailabilityCardProps {
  artistId: string;
  artistName?: string;
}

export function ArtistAvailabilityCard({
  artistId,
  artistName = "Artist",
}: ArtistAvailabilityCardProps) {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAvailability();
  }, [artistId]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/availability/artist/${artistId}`, {
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success) {
        // Get next 7 days of availability
        const nextWeek = data.availability.slice(0, 7);
        setAvailability(nextWeek);
      }
    } catch (err) {
      console.error("Failed to fetch availability:", err);
      setError("Could not load availability");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading availability...</span>
        </div>
      </div>
    );
  }

  if (error || availability.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Calendar className="w-4 h-4" />
          <span>No availability published yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 rounded-xl p-4 border border-gray-700/50 space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-cyan-400" />
        <h4 className="text-sm font-semibold text-white">Available Slots</h4>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {availability.map((slot) => {
          const slotDate = new Date(slot.date);
          const isBooked = slot.status === "Booked";

          return (
            <div
              key={slot._id}
              className={`flex items-center justify-between p-2 rounded-lg text-xs transition ${
                isBooked
                  ? "bg-red-500/10 border border-red-500/20"
                  : "bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-gray-300">
                  {slotDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <Clock className="w-3 h-3 text-gray-500 flex-shrink-0" />
                <span className={isBooked ? "text-red-400" : "text-cyan-300"}>
                  {slot.startTime} - {slot.endTime}
                </span>
              </div>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${
                  isBooked
                    ? "bg-red-500/20 text-red-300"
                    : "bg-cyan-500/20 text-cyan-300"
                }`}
              >
                {isBooked ? "Booked" : "Available"}
              </span>
            </div>
          );
        })}
      </div>

      {availability.length > 0 && (
        <p className="text-xs text-gray-500 text-center pt-2">
          Showing {availability.length} upcoming slots
        </p>
      )}
    </div>
  );
}
