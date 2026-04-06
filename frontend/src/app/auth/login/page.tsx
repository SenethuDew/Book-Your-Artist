"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const isFormInvalid = !email.trim() || !password.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      // Redirect based on user role
      const redirectPath = result.user.role === "artist" ? "/home/artist" : "/home/client";

      // Keep a lightweight marker for future UX customization without changing auth flow.
      if (rememberMe) {
        localStorage.setItem("bya_remember_user", "true");
      } else {
        localStorage.removeItem("bya_remember_user");
      }

      router.push(redirectPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <Link
          href="/"
          className="inline-flex mb-5 items-center gap-2 text-sm font-semibold text-blue-300 hover:text-blue-200 transition"
        >
          ← Back to Home
        </Link>
      </div>
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_440px]">
          <section className="hidden rounded-3xl border border-gray-800 bg-linear-to-b from-gray-800 to-gray-900 p-10 lg:block">
            <p className="mb-4 inline-flex rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
              Book My Artist
            </p>
            <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
              Book My Artist
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-gray-300">
              Sign in to continue.
            </p>
          </section>

          <section className="w-full rounded-3xl border border-gray-700 bg-gray-800/90 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
            <div className="mb-8 text-center sm:text-left">
              <h2 className="text-3xl font-bold tracking-tight text-white">Welcome back</h2>
              <p className="mt-2 text-sm text-gray-400">
                Sign in to continue to your Book Your Artist account.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-600/40 bg-red-900/25 px-4 py-3" role="alert" aria-live="polite">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-200">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-gray-600 bg-gray-700/70 px-4 py-3 text-white placeholder:text-gray-400 transition duration-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-200">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-gray-600 bg-gray-700/70 px-4 py-3 pr-20 text-white placeholder:text-gray-400 transition duration-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-300 transition hover:bg-blue-500/10 hover:text-blue-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500/40"
                  />
                  Remember me
                </label>
                <p className="text-xs text-gray-400">Press Enter to sign in quickly.</p>
              </div>

              <button
                type="submit"
                disabled={loading || isFormInvalid}
                className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:bg-blue-600/50 disabled:text-gray-200"
              >
                {loading ? "Signing in..." : "Sign In to Dashboard"}
              </button>

              <p className="text-xs text-gray-400">
                Use your registered credentials. Demo accounts are listed below for quick testing.
              </p>
            </form>

            <div className="mt-7 border-t border-gray-700 pt-6">
              <p className="mb-3 text-sm text-gray-400">New to the platform?</p>
              <Link
                href="/auth/register"
                className="inline-flex w-full items-center justify-center rounded-xl border border-green-500/60 bg-green-500/10 px-5 py-3 text-sm font-semibold text-green-200 transition hover:border-green-400 hover:bg-green-500/20"
              >
                Create Account
              </Link>
            </div>

            <div className="mt-7 rounded-2xl border border-gray-700 bg-gray-900/70 p-4">
              <p className="mb-3 text-sm font-semibold text-yellow-300">Demo Accounts</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-blue-300">Client</p>
                  <p className="text-xs text-gray-300">Email: client@test.com</p>
                  <p className="text-xs text-gray-300">Password: Client123!@</p>
                </div>
                <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-300">Artist</p>
                  <p className="text-xs text-gray-300">Email: artist@test.com</p>
                  <p className="text-xs text-gray-300">Password: Artist123!@</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
