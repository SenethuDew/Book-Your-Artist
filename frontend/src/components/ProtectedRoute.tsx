"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'client' | 'artist' | 'admin';
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/sign-in");
        return;
      }

      if (requiredRole && user?.role !== requiredRole) {
        router.push("/");
        return;
      }
    }
  }, [loading, isAuthenticated, user, requiredRole, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Access Denied</p>
      </div>
    );
  }

  return <>{children}</>;
}
