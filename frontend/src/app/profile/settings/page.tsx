"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, Save, User } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts";
import { apiCall } from "@/lib/api";

function ClientProfileSettingsContent() {
  const { refreshUser, user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setPhone((user as any)?.phone || "");
  }, [user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      await apiCall("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });
      await refreshUser();
      setMessage("Profile updated successfully.");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0512] text-white selection:bg-violet-500/30">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> My Profile
          </Link>
          <Link href="/home/client" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
            Home
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-300">Profile Settings</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-2">Edit your client profile</h1>
          <p className="text-gray-400 mt-2">Update the details artists and support use for your bookings.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/10 bg-[#120A20]/80 p-6 sm:p-8 shadow-2xl space-y-5">
          {message && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300">{message}</div>}
          {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">{error}</div>}

          <label className="block">
            <span className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-2">
              <User className="w-4 h-4 text-violet-300" /> Full Name
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-violet-400 transition-colors"
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
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-violet-400 transition-colors"
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
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-violet-400 transition-colors"
              placeholder="Optional phone number"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 font-black text-white shadow-[0_0_30px_-8px_rgba(168,85,247,0.7)] hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-60 transition-all"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
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
