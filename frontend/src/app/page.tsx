"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect to appropriate home page based on role
      if (user.role === "client") {
        router.push("/home/client");
      } else if (user.role === "artist") {
        router.push("/home/artist");
      } else if (user.role === "admin") {
        router.push("/home/admin");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <p className="text-white text-xl">Loading...</p>
      </div>
    );
  }

  // Show landing page if not logged in
  return (
    <main className="min-h-screen bg-linear-to-b from-gray-900 to-gray-800">
      <nav className="border-b border-gray-700 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Book Your Artist</h1>
          <div className="space-x-4">
            <a href="/login" className="text-blue-400 hover:underline">Login</a>
            <a href="/register" className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded text-white">Register</a>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-white">
          <h2 className="text-5xl font-bold mb-4">Find & Book Your Favorite Musicians</h2>
          <p className="text-xl text-gray-300 mb-12">
            Connect with talented artists for your events, recordings, or performances
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 max-w-2xl mx-auto">
            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 hover:border-blue-500 transition">
              <div className="text-4xl mb-4">🎤</div>
              <h3 className="text-2xl font-bold mb-3">For Clients</h3>
              <p className="text-gray-300 mb-6">
                Browse verified musicians, check availability, book performances, and leave reviews
              </p>
              <a href="/register" className="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded font-bold transition">
                Get Started
              </a>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 hover:border-green-500 transition">
              <div className="text-4xl mb-4">🎸</div>
              <h3 className="text-2xl font-bold mb-3">For Musicians</h3>
              <p className="text-gray-300 mb-6">
                Showcase your talent, manage bookings, set availability, and grow your fanbase
              </p>
              <a href="/register" className="inline-block bg-green-600 hover:bg-green-700 px-8 py-3 rounded font-bold transition">
                Register as Artist
              </a>
            </div>
          </div>

          <div className="mt-16 pt-16 border-t border-gray-700">
            <h3 className="text-2xl font-bold mb-8">Why Book Your Artist?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-3xl mb-2">✓</p>
                <p className="font-bold">Verified Musicians</p>
                <p className="text-gray-400 mt-2">Background checked and approved</p>
              </div>
              <div>
                <p className="text-3xl mb-2">✓</p>
                <p className="font-bold">Secure Payments</p>
                <p className="text-gray-400 mt-2">Payments processed safely via Stripe</p>
              </div>
              <div>
                <p className="text-3xl mb-2">✓</p>
                <p className="font-bold">Real Reviews</p>
                <p className="text-gray-400 mt-2">Honest ratings from happy customers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
