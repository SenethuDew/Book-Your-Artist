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
    return null; // Return nothing during auth check for instant feeling navigation
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
