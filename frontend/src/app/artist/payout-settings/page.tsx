"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Loader2, Save, ShieldCheck } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { API_BASE_URL, getAuthToken } from "@/lib/api";
import toast, { Toaster } from "react-hot-toast";

interface PayoutMask {
  accountHolderName: string;
  bankName: string;
  country: string;
  swiftBic: string;
  accountNumberMasked: string;
  routingNumberMasked: string;
  isComplete: boolean;
}

const emptyMask: PayoutMask = {
  accountHolderName: "",
  bankName: "",
  country: "",
  swiftBic: "",
  accountNumberMasked: "",
  routingNumberMasked: "",
  isComplete: false,
};

function PayoutSettingsContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payoutOnFile, setPayoutOnFile] = useState<PayoutMask>(emptyMask);

  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [country, setCountry] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [swiftBic, setSwiftBic] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE_URL}/api/artists/me/payout-bank`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = (await res.json()) as {
          success?: boolean;
          payout?: PayoutMask;
        };
        if (!res.ok || !data.success || !data.payout) {
          throw new Error("Could not load payout details");
        }
        if (!cancelled) {
          setPayoutOnFile(data.payout);
          setAccountHolderName(data.payout.accountHolderName || "");
          setBankName(data.payout.bankName || "");
          setCountry(data.payout.country || "");
          setSwiftBic(data.payout.swiftBic || "");
        }
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/artists/me/payout-bank`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          accountHolderName: accountHolderName.trim(),
          bankName: bankName.trim(),
          country: country.trim(),
          accountNumber: accountNumber.trim(),
          ...(routingNumber.trim() ? { routingNumber: routingNumber.trim() } : {}),
          ...(swiftBic.trim() ? { swiftBic: swiftBic.trim() } : {}),
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        message?: string;
        errors?: Record<string, string>;
        payout?: PayoutMask;
      };
        if (!res.ok || !data.success) {
          const flat = data.errors as { fieldErrors?: Record<string, string[]> } | undefined;
          const fromFields = flat?.fieldErrors ? Object.values(flat.fieldErrors).flat()[0] : undefined;
          throw new Error(fromFields || data.message || "Validation failed");
        }
      toast.success(data.message || "Saved");
      if (data.payout) {
        setPayoutOnFile(data.payout);
      }
      setAccountNumber("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-violet-500/30">
      <Toaster position="top-center" />

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-20 right-0 h-96 w-96 rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-fuchsia-600/10 blur-[100px]" />
      </div>

      <nav className="sticky top-0 z-10 border-b border-white/5 bg-gray-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <Link
            href="/artist/earnings"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 transition hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Earnings
          </Link>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 rounded-3xl border border-white/10 bg-[#1E112A]/80 p-8 shadow-xl backdrop-blur-sm">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Payout bank details</h1>
          <p className="mt-3 leading-relaxed text-gray-400">
            Add the account where you want to receive payouts. Account and routing numbers are stored securely and are
            never shown in full after saving.
          </p>

          {payoutOnFile.isComplete && (
            <div className="mt-6 flex gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-sm text-violet-200">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                On file: <span className="font-bold text-white">{payoutOnFile.bankName}</span>{" "}
                {payoutOnFile.accountNumberMasked && (
                  <span className="font-mono text-violet-100">— {payoutOnFile.accountNumberMasked}</span>
                )}
                {payoutOnFile.routingNumberMasked && (
                  <span className="ml-2 font-mono text-violet-200/80">Routing {payoutOnFile.routingNumberMasked}</span>
                )}
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-3xl border border-white/10 bg-[#1E112A]/60 p-6 shadow-xl backdrop-blur-sm sm:p-8"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-gray-300">Account holder name</span>
              <input
                required
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-gray-950/80 px-4 py-3 text-white outline-none focus:border-violet-500"
                placeholder="Legal name on the account"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-gray-300">Bank name</span>
              <input
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-gray-950/80 px-4 py-3 text-white outline-none focus:border-violet-500"
                placeholder="e.g. Commercial Bank"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-gray-300">Country / region</span>
              <input
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-gray-950/80 px-4 py-3 text-white outline-none focus:border-violet-500"
                placeholder="e.g. Sri Lanka"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-gray-300">Routing / sort code (optional)</span>
              <input
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-gray-950/80 px-4 py-3 font-mono text-white outline-none focus:border-violet-500"
                placeholder={payoutOnFile.routingNumberMasked ? "Re-enter to change" : "ACH / domestic routing"}
                autoComplete="off"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-gray-300">Account number or IBAN</span>
              <input
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-gray-950/80 px-4 py-3 font-mono text-white outline-none focus:border-violet-500"
                placeholder={payoutOnFile.accountNumberMasked ? "Re-enter full number to update" : "Your account number"}
                autoComplete="off"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-gray-300">SWIFT / BIC (optional)</span>
              <input
                value={swiftBic}
                onChange={(e) => setSwiftBic(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-white/10 bg-gray-950/80 px-4 py-3 font-mono text-white outline-none focus:border-violet-500"
                placeholder="International transfers"
                maxLength={11}
              />
            </label>

            <p className="text-xs text-gray-500">
              By saving, you confirm these details are accurate. For major changes, your bank may require extra
              verification from our team.
            </p>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 font-bold text-white transition hover:bg-violet-500 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Save payout details
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

export default function ArtistPayoutSettingsPage() {
  return (
    <ProtectedRoute requiredRole="artist">
      <PayoutSettingsContent />
    </ProtectedRoute>
  );
}
