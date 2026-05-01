"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Phone, Settings, ShieldCheck, Trash2, User } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts";

function ClientProfileContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0A0512] text-white selection:bg-violet-500/30">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/home/client" className="inline-flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <Link href="/profile/settings" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold transition-colors">
            <Settings className="w-4 h-4" /> Profile Settings
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className="rounded-[2rem] border border-white/10 bg-[#120A20]/80 overflow-hidden shadow-2xl">
          <div className="h-40 bg-gradient-to-r from-violet-700/50 via-fuchsia-700/40 to-blue-700/40" />
          <div className="px-6 sm:px-8 pb-8 -mt-12">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-500 to-violet-500 border-4 border-[#120A20] flex items-center justify-center text-3xl font-black shadow-xl">
              {user?.name?.charAt(0) || "C"}
            </div>

            <div className="mt-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-300">My Profile</p>
                <h1 className="text-3xl sm:text-4xl font-extrabold mt-2">{user?.name || "Client"}</h1>
                <p className="text-gray-400 mt-2">Manage your client account and booking details.</p>
              </div>
              <Link href="/profile/delete-profile" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-sm font-bold transition-colors">
                <Trash2 className="w-4 h-4" /> Delete Profile
              </Link>
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-4 mt-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3 text-gray-400 text-sm font-bold mb-2">
              <User className="w-4 h-4 text-violet-300" /> Full Name
            </div>
            <p className="text-lg font-bold">{user?.name || "Not added"}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3 text-gray-400 text-sm font-bold mb-2">
              <Mail className="w-4 h-4 text-violet-300" /> Email Address
            </div>
            <p className="text-lg font-bold break-all">{user?.email || "Not added"}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3 text-gray-400 text-sm font-bold mb-2">
              <Phone className="w-4 h-4 text-violet-300" /> Phone
            </div>
            <p className="text-lg font-bold">{(user as any)?.phone || "Not added"}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3 text-gray-400 text-sm font-bold mb-2">
              <ShieldCheck className="w-4 h-4 text-violet-300" /> Account Status
            </div>
            <p className="text-lg font-bold capitalize">{user?.status || "active"}</p>
          </div>
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
