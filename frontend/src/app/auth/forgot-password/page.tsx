"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Mail, Music } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";
import { isValidEmail } from "@/lib/authValidation";
import { sanitizePostAuthRedirect } from "@/lib/bookingAuthRedirect";

function ForgotPasswordInner() {
  const searchParams = useSearchParams();
  const redirectAfter = sanitizePostAuthRedirect(searchParams.get("redirect"));

  const loginHref =
    redirectAfter != null
      ? `/auth/login?redirect=${encodeURIComponent(redirectAfter)}`
      : "/auth/login";
  const registerHref =
    redirectAfter != null
      ? `/auth/register?redirect=${encodeURIComponent(redirectAfter)}`
      : "/auth/register";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed.toLowerCase() }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        message?: string;
        devResetUrl?: string;
      };

      if (!res.ok) {
        setError(data.message || "Could not send reset email. Try again.");
        return;
      }

      setSent(true);
      setDevResetUrl(
        typeof data.devResetUrl === "string" && data.devResetUrl.length > 0
          ? data.devResetUrl
          : null
      );
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative isolate min-h-screen flex flex-col justify-center overflow-hidden bg-[#0A0512] py-12 px-4 font-sans text-white selection:bg-violet-500/30 selection:text-violet-200 sm:px-6 lg:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0A0512] via-[#0A0512]/95 to-violet-950/45" />
        <div className="pointer-events-none absolute -top-[20%] -right-[10%] h-[95%] w-[55%] rounded-full bg-fuchsia-600/18 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-[25%] -left-[15%] h-[95%] w-[55%] rounded-full bg-violet-600/18 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto mb-10 flex w-full max-w-md items-center justify-between">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 font-black text-white shadow-[0_0_20px_-5px_rgba(139,92,246,0.6)] transition-transform group-hover:scale-[1.03] sm:h-11 sm:w-11">
            <Music className="h-[22px] w-[22px] text-white sm:h-6 sm:w-6" />
          </div>
          <span className="text-lg font-extrabold tracking-tight sm:text-2xl">
            Book Your <span className="text-violet-400">Artist</span>
          </span>
        </Link>
        <Link
          href="/"
          className="shrink-0 text-sm font-medium text-gray-400 transition-colors hover:text-white"
        >
          Back to Home
        </Link>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#120A20]/85 p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-10">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <Link
            href={loginHref}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Forgot password</h2>
            <p className="text-sm text-gray-400">
              Enter your account email and we will send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-center gap-3" role="alert">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {sent ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                If an account exists for that email, we sent password reset instructions. Check your inbox
                and spam folder.
              </div>
              {devResetUrl ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                  <p className="font-semibold text-amber-200 mb-2">Development</p>
                  <p className="mb-2">Email is not configured. Open this link to reset your password:</p>
                  <a
                    href={devResetUrl}
                    className="break-all text-violet-300 underline underline-offset-2 hover:text-violet-200"
                  >
                    {devResetUrl}
                  </a>
                </div>
              ) : null}
              <Link
                href={loginHref}
                className="block w-full text-center py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/25"
              >
                Return to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">
                  Email address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-violet-400 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 pl-11 text-white placeholder:text-gray-500 transition-all duration-300 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 hover:bg-white/10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25 transition-all outline-none overflow-hidden"
              >
                <span className="relative">{loading ? "Sending…" : "Send reset link"}</span>
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Don{"'"}t have an account?{" "}
              <Link href={registerHref} className="font-bold text-violet-400 hover:text-violet-300 transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0A0512] text-gray-400">
          Loading…
        </div>
      }
    >
      <ForgotPasswordInner />
    </Suspense>
  );
}
