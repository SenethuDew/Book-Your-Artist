"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

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
    if (isFormInvalid) return;
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      const redirectPath = result.user.role === "artist" ? "/home/artist" : "/home/client";

      if (rememberMe) {
        localStorage.setItem("bya_remember_user", "true");
      } else {
        localStorage.removeItem("bya_remember_user");
      }

      router.push(redirectPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed. Please check your credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px] -z-10 mix-blend-screen" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[100px] -z-10 mix-blend-screen" />

      {/* Logo & Back Link */}
      <div className="mx-auto w-full max-w-md flex justify-between items-center mb-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-sm shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all text-white">
            ♪
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Book</span>YourArtist
          </span>
        </Link>
        <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
          Back to Home
        </Link>
      </div>

      <div className="mx-auto w-full max-w-md">
        <div className="bg-[#1E112A]/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 sm:p-10 relative overflow-hidden">
          {/* Subtle top glare */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Welcome Back</h2>
            <p className="text-sm text-gray-400">
              Sign in to continue your musical journey.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-center gap-3 animate-fade-in-up" role="alert">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-violet-400 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="username"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 pl-11 text-white placeholder:text-gray-500 transition-all duration-300 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 hover:bg-white/10"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <Link href="#" className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-violet-400 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 pl-11 pr-12 text-white placeholder:text-gray-500 transition-all duration-300 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 hover:bg-white/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 rounded border border-gray-600 bg-white/5 peer-checked:bg-violet-500 peer-checked:border-violet-500 transition-all flex items-center justify-center">
                    <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isFormInvalid}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25 transition-all outline-none overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out disabled:hidden" />
              <span className="relative flex items-center gap-2">
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 flex items-center">
            <div className="flex-1 border-t border-white/10"></div>
            <span className="px-3 text-xs text-gray-500 uppercase tracking-wider font-semibold">Or continue with</span>
            <div className="flex-1 border-t border-white/10"></div>
          </div>

          {/* Demo Accounts */}
          <div className="mt-6 grid grid-cols-2 gap-3">
             <button
               type="button"
               onClick={() => { setEmail("client@test.com"); setPassword("Client123!@"); }}
               className="flex items-center justify-center p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-violet-500/30 transition-all text-sm font-medium text-gray-300 gap-2"
             >
               <span className="text-violet-400">👤</span>
               Fill Client Demo
             </button>
             <button
               type="button"
               onClick={() => { setEmail("artist@test.com"); setPassword("Artist123!@"); }}
               className="flex items-center justify-center p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-fuchsia-500/30 transition-all text-sm font-medium text-gray-300 gap-2"
             >
               <span className="text-fuchsia-400">🎸</span>
               Fill Artist Demo
             </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{" "}
              <Link href="/auth/register" className="font-bold text-violet-400 hover:text-violet-300 transition-colors">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
