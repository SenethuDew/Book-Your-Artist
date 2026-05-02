"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts";

interface ClientUser {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  status?: string;
  profileImage?: string;
}

function ClientProfileContent() {
  const { user } = useAuth();
  const client = user as ClientUser | null | undefined;
  const completedFields = [client?.name, client?.email, client?.phone, client?.location, client?.profileImage].filter(Boolean).length;
  const completionPercent = Math.round((completedFields / 5) * 100);

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
          <Link href="/home/client" className="inline-flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <Link href="/profile/settings" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold transition-colors">
            <Settings className="w-4 h-4" /> Profile Settings
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] overflow-hidden shadow-2xl shadow-violet-950/40 backdrop-blur-2xl">
          <div className="h-44 bg-gradient-to-r from-violet-700/50 via-fuchsia-700/40 to-cyan-700/30 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.22),transparent_28%),radial-gradient(circle_at_80%_40%,rgba(217,70,239,0.22),transparent_30%)]" />
          </div>
          <div className="px-6 sm:px-8 pb-8 -mt-14 relative">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 border-4 border-[#120A20] flex items-center justify-center text-4xl font-black shadow-2xl shadow-black/40 overflow-hidden">
                  {client?.profileImage ? (
                    <img src={client.profileImage} alt={client?.name || "Client"} className="w-full h-full object-cover" />
                  ) : (
                    client?.name?.charAt(0) || "C"
                  )}
                </div>

                <div className="pb-1">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-fuchsia-300" /> My Profile
                  </p>
                  <h1 className="text-3xl sm:text-5xl font-extrabold mt-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-100 to-fuchsia-300">
                    {client?.name || "Client"}
                  </h1>
                  <p className="text-gray-400 mt-2">Manage your client identity, booking contacts, and account status.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/profile/settings" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-black transition-all shadow-lg shadow-violet-600/25">
                  <Settings className="w-4 h-4" /> Edit Profile
                </Link>
                <Link href="/profile/delete-profile" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-sm font-bold transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete Profile
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-[1fr_320px] gap-6 mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">
              <div className="flex items-center gap-3 text-gray-400 text-sm font-bold mb-2">
                <User className="w-4 h-4 text-violet-300" /> Full Name
              </div>
              <p className="text-lg font-bold">{client?.name || "Not added"}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">
              <div className="flex items-center gap-3 text-gray-400 text-sm font-bold mb-2">
                <Mail className="w-4 h-4 text-violet-300" /> Email Address
              </div>
              <p className="text-lg font-bold break-all">{client?.email || "Not added"}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">
              <div className="flex items-center gap-3 text-gray-400 text-sm font-bold mb-2">
                <Phone className="w-4 h-4 text-violet-300" /> Phone
              </div>
              <p className="text-lg font-bold">{client?.phone || "Not added"}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">
              <div className="flex items-center gap-3 text-gray-400 text-sm font-bold mb-2">
                <MapPin className="w-4 h-4 text-violet-300" /> Location
              </div>
              <p className="text-lg font-bold">{client?.location || "Not added"}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">
              <div className="flex items-center gap-3 text-gray-400 text-sm font-bold mb-2">
                <ShieldCheck className="w-4 h-4 text-violet-300" /> Account Status
              </div>
              <p className="text-lg font-bold capitalize">{client?.status || "active"}</p>
            </div>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl shadow-xl shadow-black/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-violet-300 font-black">Completion</p>
                <h2 className="text-xl font-bold mt-1">Profile Health</h2>
              </div>
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="h-3 rounded-full bg-gray-950/70 border border-white/10 overflow-hidden mb-3">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${completionPercent}%` }} />
            </div>
            <p className="text-sm text-gray-400 mb-5">{completionPercent}% complete. Add your image, location, and contact details so artists can coordinate bookings faster.</p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-gray-950/50 border border-white/10 p-3">
                <span className="flex items-center gap-2 text-gray-300"><CalendarCheck className="w-4 h-4 text-fuchsia-300" /> Booking Ready</span>
                <span className="text-emerald-300 font-bold">Active</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gray-950/50 border border-white/10 p-3">
                <span className="flex items-center gap-2 text-gray-300"><ShieldCheck className="w-4 h-4 text-violet-300" /> Account Role</span>
                <span className="text-violet-200 font-bold">Client</span>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default function ClientProfilePage() {
  return (
    <ProtectedRoute requiredRole="client">
      <ClientProfileContent />
    </ProtectedRoute>
  );
}
