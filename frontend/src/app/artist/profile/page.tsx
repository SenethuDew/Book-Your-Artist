"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { API_BASE_URL } from "@/lib/api";

function ArtistProfileContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  
  const [formData, setFormData] = useState({
    bio: "",
    genres: [] as string[],
    hourlyRate: 50,
    portfolioImages: [] as string[],
    instagramUrl: "",
    spotifyUrl: "",
    youtubeUrl: ""
  });

  const [genreInput, setGenreInput] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/artists/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.artist) {
            setFormData({
              bio: data.artist.bio || "",
              genres: data.artist.genres || [],
              hourlyRate: data.artist.hourlyRate || 50,
              portfolioImages: data.artist.portfolioImages || [],
              instagramUrl: data.artist.socialLinks?.instagram || "",
              spotifyUrl: data.artist.socialLinks?.spotify || "",
              youtubeUrl: data.artist.socialLinks?.youtube || ""
            });
            setIsNew(false);
          }
        } else if (res.status === 404) {
          // Profile doesn't exist yet
          setIsNew(true);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleAddGenre = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && genreInput.trim() !== "") {
      e.preventDefault();
      if (!formData.genres.includes(genreInput.trim())) {
        setFormData({ ...formData, genres: [...formData.genres, genreInput.trim()] });
      }
      setGenreInput("");
    }
  };

  const removeGenre = (genre: string) => {
    setFormData({ ...formData, genres: formData.genres.filter(g => g !== genre) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/artists/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bio: formData.bio,
          genres: formData.genres,
          hourlyRate: Number(formData.hourlyRate),
          portfolioImages: formData.portfolioImages, // For a real app, upload files via multipart/form-data
          socialLinks: {
            instagram: formData.instagramUrl,
            spotify: formData.spotifyUrl,
            youtube: formData.youtubeUrl
          }
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Profile saved successfully!");
        router.push("/dashboard/artist");
      } else {
        alert(data.message || "Failed to save profile");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
        <div className="bg-purple-900/50 px-8 py-6 border-b border-gray-700">
          <h2 className="text-3xl font-bold text-white">Complete Your Profile</h2>
          <p className="mt-2 text-purple-200">
            Tell clients about your artistry, rates, and let them hear your work.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Biography</label>
            <textarea
              rows={4}
              required
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 pb-2 pt-2 px-3"
              placeholder="Tell us about your background, experience, and style..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>

          {/* Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Hourly Rate ($)</label>
            <div className="mt-1 relative rounded-md shadow-sm w-1/3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                min="0"
                required
                className="block w-full pl-7 rounded-md bg-gray-700 border-gray-600 text-white focus:border-purple-500 focus:ring-purple-500 py-2 sm:text-sm"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Genres */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Genres (Press Enter to add)</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 py-2 px-3"
              placeholder="e.g. Rock, Jazz, DJ, Acoustic..."
              value={genreInput}
              onChange={(e) => setGenreInput(e.target.value)}
              onKeyDown={handleAddGenre}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {formData.genres.map(genre => (
                <span key={genre} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-900 text-purple-200">
                  {genre}
                  <button type="button" onClick={() => removeGenre(genre)} className="ml-2 text-purple-400 hover:text-white focus:outline-none">
                    &times;
                  </button>
                </span>
              ))}
            </div>
            {formData.genres.length === 0 && <p className="text-xs text-gray-500 mt-2">Add at least one genre to help clients find you.</p>}
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-white mb-4">Social & Portfolio Links</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Instagram URL</label>
                <input
                  type="url"
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm py-2 px-3 focus:border-purple-500 focus:ring-purple-500"
                  placeholder="https://instagram.com/yourhandle"
                  value={formData.instagramUrl}
                  onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Spotify Artist URL</label>
                <input
                  type="url"
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm py-2 px-3 focus:border-purple-500 focus:ring-purple-500"
                  placeholder="https://open.spotify.com/artist/..."
                  value={formData.spotifyUrl}
                  onChange={(e) => setFormData({ ...formData, spotifyUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">YouTube Channel or Video URL</label>
                <input
                  type="url"
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm py-2 px-3 focus:border-purple-500 focus:ring-purple-500"
                  placeholder="https://youtube.com/..."
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-gray-700 flex justify-end">
            <button
              type="button"
              onClick={() => router.push("/dashboard/artist")}
              className="bg-transparent border border-gray-600 text-gray-300 hover:text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium mr-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || formData.genres.length === 0}
              className="bg-purple-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Profile Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ArtistProfile() {
  return (
    <ProtectedRoute requiredRole="artist">
      <ArtistProfileContent />
    </ProtectedRoute>
  );
}