"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, CheckCircle2, Mail, MapPin, Phone, Save, ShieldCheck, Sparkles, User } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts";
import { apiCall, getApiBaseUrl, getAuthToken } from "@/lib/api";

interface ClientUser {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  profileImage?: string;
  status?: string;
}

function ClientProfileSettingsContent() {
  const { refreshUser, user } = useAuth();
  const router = useRouter();
  const client = user as ClientUser | null | undefined;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(client?.name || "");
    setEmail(client?.email || "");
    setPhone(client?.phone || "");
    setLocation(client?.location || "");
    setProfileImage(client?.profileImage || "");
  }, [client?.email, client?.location, client?.name, client?.phone, client?.profileImage]);

  useEffect(() => {
    return () => {
      if (profileImagePreview) URL.revokeObjectURL(profileImagePreview);
    };
  }, [profileImagePreview]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (profileImagePreview) URL.revokeObjectURL(profileImagePreview);
    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      let finalProfileImage = profileImage;

      if (profileImageFile) {
        const uploadData = new FormData();
        uploadData.append("file", profileImageFile);

        const uploadRes = await fetch(`${getApiBaseUrl()}/api/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAuthToken() || ""}`,
          },
          body: uploadData,
        });

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || !uploadJson?.success) {
          throw new Error(uploadJson?.message || "Failed to upload profile image.");
        }

        finalProfileImage = `${getApiBaseUrl()}${uploadJson.url}`;
        setProfileImage(finalProfileImage);
      }

      await apiCall("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, location, profileImage: finalProfileImage }),
      });
      await refreshUser();
      setMessage("Profile updated successfully.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07040f] text-white selection:bg-violet-500/30 relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-64 -left-24 h-80 w-80 rounded-full bg-fuchsia-600/10 blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/70 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> My Profile
          </Link>
          <Link href="/home/client" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
            Home
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 sm:p-8 shadow-2xl shadow-violet-950/40 backdrop-blur-2xl mb-6 overflow-hidden relative">
          <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-fuchsia-300" /> Profile Settings
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold mt-3 text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-100 to-fuchsia-300">
            Edit your client profile
          </h1>
          <p className="text-gray-400 mt-3 max-w-2xl">Update the details artists and support use for booking coordination, payment updates, and event communication.</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 sm:p-8 shadow-2xl shadow-black/20 backdrop-blur-xl space-y-5">
            {message && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300">{message}</div>}
            {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">{error}</div>}

            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2 rounded-3xl border border-white/10 bg-gray-950/40 p-5">
                <span className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-4">
                  <Camera className="w-4 h-4 text-violet-300" /> Profile Image
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 border border-white/10 overflow-hidden flex items-center justify-center text-3xl font-black shadow-xl">
                    {(profileImagePreview || profileImage) ? (
                      <img src={profileImagePreview || profileImage} alt={name || "Client"} className="w-full h-full object-cover" />
                    ) : (
                      name.charAt(0) || "C"
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-3">Upload a clear image so artists can recognize your booking profile.</p>
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/10 transition-all">
                      <Camera className="w-4 h-4" />
                      Choose Image
                      <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              <label className="block md:col-span-2">
                <span className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-2">
                  <User className="w-4 h-4 text-violet-300" /> Full Name
                </span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-gray-950/50 px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-500/40 transition-colors"
                  placeholder="Your name"
                />
              </label>

              <label className="block">
                <span className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-2">
                  <Mail className="w-4 h-4 text-violet-300" /> Email Address
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-gray-950/50 px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-500/40 transition-colors"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <span className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-2">
                  <Phone className="w-4 h-4 text-violet-300" /> Phone
                </span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-gray-950/50 px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-500/40 transition-colors"
                  placeholder="Optional phone number"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 text-violet-300" /> Client Location
                </span>
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-gray-950/50 px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-500/40 transition-colors"
                  placeholder="E.g. Colombo, Sri Lanka"
                />
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 font-black text-white shadow-[0_0_30px_-8px_rgba(168,85,247,0.7)] hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-60 transition-all"
              >
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
              </button>
              <Link href="/profile" className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-bold text-gray-200 hover:bg-white/10 transition-all">
                Cancel
              </Link>
            </div>
          </form>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-xl shadow-black/20 backdrop-blur-xl h-fit">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-300 mb-5">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Account Snapshot</h2>
            <p className="text-sm text-gray-400 mb-5">These details are used for your bookings, notifications, and artist communication.</p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-gray-950/50 border border-white/10 p-3">
                <span className="text-gray-400">Status</span>
                <span className="text-emerald-300 font-bold capitalize">{client?.status || "active"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gray-950/50 border border-white/10 p-3">
                <span className="text-gray-400">Email</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gray-950/50 border border-white/10 p-3">
                <span className="text-gray-400">Phone</span>
                <span className={phone ? "text-emerald-300 font-bold" : "text-amber-300 font-bold"}>{phone ? "Added" : "Optional"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gray-950/50 border border-white/10 p-3">
                <span className="text-gray-400">Location</span>
                <span className={location ? "text-emerald-300 font-bold" : "text-amber-300 font-bold"}>{location ? "Added" : "Optional"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gray-950/50 border border-white/10 p-3">
                <span className="text-gray-400">Image</span>
                <span className={(profileImagePreview || profileImage) ? "text-emerald-300 font-bold" : "text-amber-300 font-bold"}>{(profileImagePreview || profileImage) ? "Added" : "Optional"}</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function ClientProfileSettingsPage() {
  return (
    <ProtectedRoute requiredRole="client">
      <ClientProfileSettingsContent />
    </ProtectedRoute>
  );
}
