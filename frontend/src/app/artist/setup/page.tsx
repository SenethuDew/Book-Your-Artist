"use client"

import CreativeArtistProfileForm from '@/components/CreativeProfileForm2';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function SetupPage() {
  return (
    <ProtectedRoute requiredRole="artist">
      <CreativeArtistProfileForm />
    </ProtectedRoute>
  );
}
