"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import Link from "next/link";
import { User, Mail, Lock, Eye, EyeOff, Music, Briefcase, ArrowRight } from "lucide-react";
import { FaFacebookF, FaGoogle } from "react-icons/fa";
import {
  isFirebaseSocialAuthAvailable,
  signInWithFacebook,
  signInWithGoogle,
} from "@/lib/firebaseSocialAuth";

interface SignupData {
  name: string;
  email: string;
  password: string;
  role: "client" | "artist";
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<SignupData>({
    name: "",
    email: "",
    password: "",
    role: "client",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [oauthProvider, setOauthProvider] = useState<"google" | "facebook" | null>(null);
  const router = useRouter();
  const { signup, loginWithFirebaseIdToken } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const setRole = (role: "client"|"artist") => {
    setFormData((prev) => ({ ...prev, role }));
  }

  const isFormInvalid = !formData.name.trim() || !formData.email.trim() || formData.password.length < 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(isFormInvalid) return;
    setError("");
    setLoading(true);

    try {
      const result = await signup(formData);
      const redirectPath = result.user.role === "artist" ? "/home/artist" : "/home/client";
      router.push(redirectPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialGoogle = async () => {
    if (!isFirebaseSocialAuthAvailable()) {
      setError(
        "Social sign-in could not resolve your API URL. Set NEXT_PUBLIC_API_URL (or NEXT_PUBLIC_FIREBASE_* in .env.local), then retry."
      );
      return;
    }
    setError("");
    setOauthProvider("google");
    try {
      const idToken = await signInWithGoogle();
      await loginWithFirebaseIdToken(idToken, formData.role);
      const redirectPath = formData.role === "artist" ? "/home/artist" : "/home/client";
      router.push(redirectPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign-in failed.";
      setError(message);
    } finally {
      setOauthProvider(null);
    }
  };

  const handleSocialFacebook = async () => {
    if (!isFirebaseSocialAuthAvailable()) {
      setError(
        "Facebook sign-in requires Firebase keys and Facebook enabled in Firebase Console. Add FIREBASE_WEB_API_KEY to backend .env."
      );
      return;
    }
    setError("");
    setOauthProvider("facebook");
    try {
      const idToken = await signInWithFacebook();
      await loginWithFirebaseIdToken(idToken, formData.role);
      const redirectPath = formData.role === "artist" ? "/home/artist" : "/home/client";
      router.push(redirectPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Facebook sign-in failed.";
      setError(message);
    } finally {
      setOauthProvider(null);
    }
  };

  const oauthBusy = oauthProvider !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px] -z-10 mix-blend-screen" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[100px] -z-10 mix-blend-screen" />

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
            <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Create Account</h2>
            <p className="text-sm text-gray-400">
              Join our community and book the perfect artist.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-center gap-3 animate-fade-in-up" role="alert">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account Type Toggle */}
            <div className="grid grid-cols-2 gap-3 mb-2">
               <button
                 type="button"
                 onClick={() => setRole("client")}
                 className={`flex items-center justify-center p-3 rounded-xl border transition-all text-sm font-semibold gap-2 ${formData.role === 'client' ? 'bg-violet-600/20 border-violet-500 shadow-lg shadow-violet-500/20 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}`}
               >
                 <Briefcase className={`w-4 h-4 ${formData.role === 'client' ? 'text-violet-400' : ''}`} />
                 Client
               </button>
               <button
                 type="button"
                 onClick={() => setRole("artist")}
                 className={`flex items-center justify-center p-3 rounded-xl border transition-all text-sm font-semibold gap-2 ${formData.role === 'artist' ? 'bg-fuchsia-600/20 border-fuchsia-500 shadow-lg shadow-fuchsia-500/20 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}`}
               >
                 <Music className={`w-4 h-4 ${formData.role === 'artist' ? 'text-fuchsia-400' : ''}`} />
                 Artist
               </button>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-violet-400 transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 pl-11 text-white placeholder:text-gray-500 transition-all duration-300 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 hover:bg-white/10"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-violet-400 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 pl-11 text-white placeholder:text-gray-500 transition-all duration-300 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 hover:bg-white/10"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-violet-400 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  minLength={8}
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
              <p className="text-xs text-gray-500 mt-2 ml-1">Must be at least 8 characters</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || oauthBusy || isFormInvalid}
              className="group pt-2 relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25 transition-all outline-none overflow-hidden mt-6"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out disabled:hidden" />
              <span className="relative flex items-center gap-2">
                {loading ? "Creating Account..." : "Create Account"}
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
          
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleSocialGoogle}
              disabled={loading || oauthBusy}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-violet-500/40 transition-all text-sm font-bold text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaGoogle className="w-4 h-4 text-red-400 shrink-0" />
              {oauthProvider === "google" ? "Google…" : "Google"}
            </button>
            <button
              type="button"
              onClick={handleSocialFacebook}
              disabled={loading || oauthBusy}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/40 transition-all text-sm font-bold text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaFacebookF className="w-4 h-4 text-blue-400 shrink-0" />
              {oauthProvider === "facebook" ? "Facebook…" : "Facebook"}
            </button>
          </div>
          {!isFirebaseSocialAuthAvailable() && (
            <p className="mt-3 text-[11px] text-center text-amber-200/90 leading-relaxed">
              Set valid <span className="font-mono">NEXT_PUBLIC_FIREBASE_*</span> in frontend <span className="font-mono">.env.local</span>, or add Firebase web variables to backend <span className="font-mono">.env</span> (starting with{" "}
              <span className="font-mono">FIREBASE_WEB_API_KEY</span>) — the client loads config from{" "}
              <span className="font-mono">/api/config/firebase-public</span> when the frontend still has placeholders.
            </p>
          )}

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-bold text-violet-400 hover:text-violet-300 transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
