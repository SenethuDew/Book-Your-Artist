"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Lock, Music } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";
import { isStrongPassword } from "@/lib/authValidation";
import { sanitizePostAuthRedirect } from "@/lib/bookingAuthRedirect";

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const redirectAfter = sanitizePostAuthRedirect(searchParams.get("redirect"));

  const loginHref =
    redirectAfter != null
      ? `/auth/login?redirect=${encodeURIComponent(redirectAfter)}`
      : "/auth/login";
  const forgotHref =
    redirectAfter != null
      ? `/auth/forgot-password?redirect=${encodeURIComponent(redirectAfter)}`
      : "/auth/forgot-password";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"password" | "confirmPassword", string>>>({});
  const [done, setDone] = useState(false);

  const isFormInvalid =
    !token ||
    !isStrongPassword(password) ||
    password !== confirmPassword ||
    !confirmPassword.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const next: typeof fieldErrors = {};
    if (!token) {
      setError("This reset link is invalid. Request a new one.");
      return;
    }
    if (!isStrongPassword(password)) {
      next.password = "Use a strong password (8+ chars, upper, lower, number, special).";
    }
    if (password !== confirmPassword) {
      next.confirmPassword = "Passwords do not match.";
    }
    if (Object.keys(next).length > 0) {
      setFieldErrors(next);
      return;
    }

    setLoading(true);
    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string };

      if (!res.ok) {
        setError(data.message || "Could not reset password.");
        return;
      }

      setDone(true);
      setTimeout(() => {
        router.push(loginHref);
      }, 2000);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const invalidLink = !token;

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
            <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Set new password</h2>
            <p className="text-sm text-gray-400">
              Choose a strong password you have not used here before.
            </p>
          </div>

          {invalidLink && (
            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Missing or invalid reset token.{" "}
              <Link href={forgotHref} className="font-semibold text-violet-300 underline underline-offset-2">
                Request a new link
              </Link>
              .
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-center gap-3" role="alert">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {done ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 text-center">
              Password updated. Redirecting to sign in…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">New password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-violet-400 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="Strong password"
                    required
                    disabled={invalidLink}
                    autoComplete="new-password"
                    className={`w-full bg-white/5 border rounded-xl py-3 px-4 pl-11 pr-12 text-white placeholder:text-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 hover:bg-white/10 disabled:opacity-50 ${
                      fieldErrors.password ? "border-red-500/50 focus:border-red-500/50" : "border-white/10 focus:border-violet-500/50"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <ul className="mt-2 ml-1 space-y-1 text-[11px] text-gray-500">
                  {(
                    [
                      { ok: password.length >= 8, label: "8+ characters" },
                      { ok: /[a-z]/.test(password), label: "Lowercase letter" },
                      { ok: /[A-Z]/.test(password), label: "Uppercase letter" },
                      { ok: /[0-9]/.test(password), label: "Number" },
                      { ok: /[^A-Za-z0-9]/.test(password), label: "Special character" },
                    ] as const
                  ).map(({ ok, label }) => (
                    <li key={label} className={ok ? "text-emerald-400/90" : ""}>
                      {ok ? "✓ " : "○ "}
                      {label}
                    </li>
                  ))}
                </ul>
                {fieldErrors.password ? (
                  <p className="mt-1.5 ml-1 text-xs text-red-300">{fieldErrors.password}</p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Confirm password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-violet-400 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    placeholder="Repeat password"
                    required
                    disabled={invalidLink}
                    autoComplete="new-password"
                    className={`w-full bg-white/5 border rounded-xl py-3 px-4 pl-11 text-white placeholder:text-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 hover:bg-white/10 disabled:opacity-50 ${
                      fieldErrors.confirmPassword ? "border-red-500/50 focus:border-red-500/50" : "border-white/10 focus:border-violet-500/50"
                    }`}
                  />
                </div>
                {fieldErrors.confirmPassword ? (
                  <p className="mt-1.5 ml-1 text-xs text-red-300">{fieldErrors.confirmPassword}</p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={loading || invalidLink || isFormInvalid}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25 transition-all outline-none overflow-hidden"
              >
                <span className="relative">{loading ? "Updating…" : "Update password"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0A0512] text-gray-400">
          Loading…
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
