"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Trash2 } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts";
import { apiCall } from "@/lib/api";

function DeleteClientProfileContent() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const canDelete = confirmText.trim().toUpperCase() === "DELETE";

  const handleDelete = async () => {
    if (!canDelete || deleting) return;

    setError("");
    setDeleting(true);

    try {
      await apiCall("/api/users/me", { method: "DELETE" });
      await logout();
      router.push("/sign-in");
    } catch (err: any) {
      setError(err?.message || "Failed to delete profile.");
      setDeleting(false);
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
        <section className="rounded-[2rem] border border-red-500/20 bg-red-950/20 p-6 sm:p-8 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
            <AlertTriangle className="w-7 h-7 text-red-300" />
          </div>

          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-300">Delete Profile</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-2">Delete your client profile?</h1>
          <p className="text-gray-300 mt-4 leading-relaxed">
            This will remove the account for <span className="font-bold text-white">{user?.email}</span> and sign you out. This action cannot be undone.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
            <label className="block text-sm font-bold text-gray-300 mb-2">
              Type DELETE to confirm
            </label>
            <input
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-red-400 transition-colors"
              placeholder="DELETE"
            />
          </div>

          {error && <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">{error}</div>}

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDelete}
              disabled={!canDelete || deleting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-3 font-black text-white hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> {deleting ? "Deleting..." : "Delete Profile"}
            </button>
            <Link href="/profile" className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-black text-white hover:bg-white/10 transition-colors">
              Cancel
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function DeleteClientProfilePage() {
  return (
    <ProtectedRoute requiredRole="client">
      <DeleteClientProfileContent />
    </ProtectedRoute>
  );
}
