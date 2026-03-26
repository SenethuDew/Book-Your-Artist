"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      // Redirect based on user role
      const redirectPath = result.user.role === "artist" ? "/home/artist" : "/home/client";
      router.push(redirectPath);
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-2 text-center">Book Your Artist</h1>
          <p className="text-gray-400 text-center mb-8">Sign in to your account</p>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded font-bold transition"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-gray-400 text-center mb-4">Don't have an account?</p>
            <Link href="/auth/register">
              <button className="w-full bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-bold transition">
                Create Account
              </button>
            </Link>
          </div>

          {/* Test Credentials Info */}
          <div className="mt-8 p-4 bg-gray-700/50 rounded">
            <p className="text-sm font-bold text-yellow-400 mb-2">Test Credentials:</p>
            <div className="text-xs text-gray-300 space-y-2">
              <p><strong>Email:</strong> client@test.com</p>
              <p><strong>Password:</strong> Client123!@</p>
              <hr className="border-gray-600 my-2" />
              <p><strong>Email:</strong> artist@test.com</p>
              <p><strong>Password:</strong> Artist123!@</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
