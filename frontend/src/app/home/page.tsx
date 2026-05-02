"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts";

/**
 * HOME ROUTER PAGE
 * 
 * This page acts as a redirect hub for authenticated users.
 * If a user navigates directly to /home, they are redirected to their role-specific dashboard.
 * 
 * - Authenticated clients → /home/client
 * - Authenticated artists → /home/artist
 * - Authenticated admins → /home/admin
 * - Unauthenticated users → redirected by ProtectedRoute or go to landing page
 */
export default function HomeRouter() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Not authenticated, go back to landing page
        router.push("/");
        return;
      }

      if (user) {
        // Authenticated, route based on role
        if (user.role === 'artist') {
          router.push("/home/artist");
        } else if (user.role === 'admin') {
          router.push("/home/admin");
        } else if (user.role === 'client') {
          router.push("/home/client");
        }
      }
    }
  }, [loading, isAuthenticated, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0512] text-white selection:bg-violet-500/30 selection:text-violet-200">
      <div className="animate-pulse text-center">
        <div className="animate-pulse-glow rounded-full h-16 w-16 border-2 border-violet-500 mx-auto mb-4" />
        <p className="text-gray-400">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
