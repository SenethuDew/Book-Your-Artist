"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  Loader2,
  Save,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts";
import { apiCall } from "@/lib/api";

type VerificationStatus = "not_submitted" | "pending" | "verified" | "rejected";
type AccountType = "savings" | "current";

interface PayoutFormData {
  accountHolderName: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  accountType: AccountType;
  nicNumber: string;
  mobileNumber: string;
  emailAddress: string;
  swiftBic: string;
}

interface PayoutDetailsDoc {
  accountHolderName: string;
  bankName: string;
  branchName: string;
  accountType: AccountType;
  nicNumber: string;
  mobileNumber: string;
  emailAddress: string;
  swiftBic?: string;
  accountNumberMasked: string;
  verificationStatus: VerificationStatus;
  submittedAt?: string | null;
  updatedAt?: string | null;
}

interface PayoutApiResponse {
  success: boolean;
  payout: PayoutDetailsDoc & { isComplete?: boolean };
  message?: string;
}

type PayoutValidationErrors = Partial<Record<keyof PayoutFormData, string>>;

const SRI_LANKAN_BANKS = [
  "Bank of Ceylon (BOC)",
  "People’s Bank",
  "Commercial Bank",
  "Sampath Bank",
  "HNB",
  "Seylan Bank",
  "NDB Bank",
  "DFCC Bank",
  "Nations Trust Bank",
  "Pan Asia Bank",
  "Union Bank",
  "Amana Bank",
  "Cargills Bank",
] as const;

const DEFAULT_FORM: PayoutFormData = {
  accountHolderName: "",
  bankName: "",
  branchName: "",
  accountNumber: "",
  confirmAccountNumber: "",
  accountType: "savings",
  nicNumber: "",
  mobileNumber: "",
  emailAddress: "",
  swiftBic: "",
};

function bankLabelShort(bankName: string) {
  const acronymMatch = bankName.match(/\(([^)]+)\)/);
  if (acronymMatch?.[1]) return acronymMatch[1].toUpperCase();
  const firstWord = bankName.split(" ")[0] || "BANK";
  return firstWord.toUpperCase();
}

function maskAccountNumber(bankName: string, accountNumber: string) {
  const tail = accountNumber.slice(-4);
  return `${bankLabelShort(bankName)} •••• ${tail}`;
}

void bankLabelShort;
void maskAccountNumber;

function isOldNic(value: string) {
  return /^\d{9}[vVxX]$/.test(value);
}

function isNewNic(value: string) {
  return /^\d{12}$/.test(value);
}

function formatTimestamp(value?: string | null) {
  if (!value) return "Not available";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "Not available";
  return d.toLocaleString();
}

function verificationBadgeStyle(status: VerificationStatus) {
  if (status === "verified") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
  if (status === "pending") return "bg-amber-500/15 text-amber-300 border-amber-500/40";
  if (status === "rejected") return "bg-red-500/15 text-red-300 border-red-500/40";
  return "bg-gray-500/15 text-gray-300 border-gray-500/40";
}

function verificationLabel(status: VerificationStatus) {
  if (status === "verified") return "Verified";
  if (status === "pending") return "Pending verification";
  if (status === "rejected") return "Rejected";
  return "Not submitted";
}

function validatePayoutForm(form: PayoutFormData): PayoutValidationErrors {
  const errors: PayoutValidationErrors = {};
  const nic = form.nicNumber.trim();
  const mobile = form.mobileNumber.trim();

  if (!form.accountHolderName.trim()) {
    errors.accountHolderName = "Account holder name is required.";
  }
  if (!form.bankName.trim()) {
    errors.bankName = "Bank name is required.";
  }
  if (!form.branchName.trim()) {
    errors.branchName = "Branch name is required.";
  }
  if (!form.accountNumber.trim()) {
    errors.accountNumber = "Account number is required.";
  } else if (!/^\d+$/.test(form.accountNumber.trim())) {
    errors.accountNumber = "Account number must contain only numbers.";
  }
  if (!form.confirmAccountNumber.trim()) {
    errors.confirmAccountNumber = "Please re-enter account number.";
  } else if (form.confirmAccountNumber.trim() !== form.accountNumber.trim()) {
    errors.confirmAccountNumber = "Account numbers do not match.";
  }
  if (!nic) {
    errors.nicNumber = "NIC number is required.";
  } else if (!isOldNic(nic) && !isNewNic(nic)) {
    errors.nicNumber =
      "NIC must be 9 digits plus V/X or 12 digits format.";
  }
  if (!mobile) {
    errors.mobileNumber = "Mobile number is required.";
  } else if (!/^07\d{8}$/.test(mobile)) {
    errors.mobileNumber = "Mobile number must be in 07XXXXXXXX format.";
  }
  if (!form.emailAddress.trim()) {
    errors.emailAddress = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailAddress.trim())) {
    errors.emailAddress = "Enter a valid email address.";
  }

  return errors;
}

function ConfirmSaveModal({
  open,
  saving,
  onConfirm,
  onClose,
}: {
  open: boolean;
  saving: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#1A0F28] p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white">Confirm payout details</h3>
        <p className="mt-3 text-sm leading-relaxed text-gray-300">
          Please confirm that these bank details are correct. Incorrect details may
          delay your payout.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-gray-200 hover:bg-white/10 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Confirm and save
          </button>
        </div>
      </div>
    </div>
  );
}

function PayoutSettingsContent() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const artistId = user?.id || user?._id || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [existingPayout, setExistingPayout] = useState<PayoutDetailsDoc | null>(null);
  const [formData, setFormData] = useState<PayoutFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<PayoutValidationErrors>({});

  const [removing, setRemoving] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifySending, setVerifySending] = useState(false);
  const [verifyConfirming, setVerifyConfirming] = useState(false);
  const [verifyOtpCode, setVerifyOtpCode] = useState("");
  const [verifyDevOtp, setVerifyDevOtp] = useState<string | null>(null);
  const [verifySentTo, setVerifySentTo] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState("");

  const verificationStatus: VerificationStatus =
    existingPayout?.verificationStatus ?? "not_submitted";

  const payoutMethodLabel = useMemo(() => {
    if (!existingPayout?.accountNumberMasked) return "Not submitted";
    return `${existingPayout.bankName} ${existingPayout.accountNumberMasked}`;
  }, [existingPayout]);

  useEffect(() => {
    let cancelled = false;
    async function loadPayoutDetails() {
      if (authLoading) return;
      if (!isAuthenticated || !artistId) {
        if (!cancelled) {
          setExistingPayout(null);
          setEditing(true);
          setLoading(false);
        }
        return;
      }
      try {
        const data = await apiCall<PayoutApiResponse>("/api/artists/me/payout-bank");
        if (cancelled) return;
        const payout = data?.payout;
        if (!payout || !payout.isComplete) {
          setExistingPayout(null);
          setEditing(true);
        } else {
          setExistingPayout(payout);
          setFormData((prev) => ({
            ...prev,
            accountHolderName: payout.accountHolderName || "",
            bankName: payout.bankName || "",
            branchName: payout.branchName || "",
            accountType: payout.accountType || "savings",
            nicNumber: payout.nicNumber || "",
            mobileNumber: payout.mobileNumber || "",
            emailAddress: payout.emailAddress || "",
            swiftBic: payout.swiftBic || "",
            accountNumber: "",
            confirmAccountNumber: "",
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setExistingPayout(null);
          setEditing(true);
          console.warn(
            "Payout fetch failed:",
            error instanceof Error ? error.message : error,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadPayoutDetails();
    return () => {
      cancelled = true;
    };
  }, [artistId, authLoading, isAuthenticated]);

  const onInputChange = <K extends keyof PayoutFormData>(
    key: K,
    value: PayoutFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const removePayoutMethod = async () => {
    setRemoving(true);
    try {
      await apiCall<{ success: boolean }>("/api/artists/me/payout-bank", {
        method: "DELETE",
      });
      setExistingPayout(null);
      setFormData(DEFAULT_FORM);
      setEditing(true);
      setRemoveConfirmOpen(false);
      toast.success("Payout method removed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove payout method.");
    } finally {
      setRemoving(false);
    }
  };

  const startVerification = async () => {
    setVerifyError("");
    setVerifySending(true);
    try {
      const data = await apiCall<{
        success: boolean;
        message?: string;
        sentTo?: string;
        sentToEmail?: string | null;
        sentToMobile?: string | null;
        emailDelivered?: boolean;
        smsDelivered?: boolean;
        delivered?: boolean;
        devOtp?: string;
        alreadyVerified?: boolean;
      }>("/api/artists/me/payout-bank/verify/start", { method: "POST" });

      if (data?.alreadyVerified) {
        toast.success("Bank account already verified.");
        setVerifyOpen(false);
        if (existingPayout) {
          setExistingPayout({ ...existingPayout, verificationStatus: "verified" });
        }
        return;
      }
      const channels: string[] = [];
      if (data?.emailDelivered && data?.sentToEmail) channels.push(data.sentToEmail);
      if (data?.smsDelivered && data?.sentToMobile) channels.push(data.sentToMobile);
      setVerifySentTo(channels.length ? channels.join(" and ") : data?.sentTo || null);
      setVerifyDevOtp(data?.devOtp || null);
      setVerifyOpen(true);
      toast.success(data?.message || "Verification code sent.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start verification.";
      setVerifyError(msg);
      toast.error(msg);
    } finally {
      setVerifySending(false);
    }
  };

  const confirmVerification = async () => {
    setVerifyError("");
    if (!/^\d{6}$/.test(verifyOtpCode)) {
      setVerifyError("Enter the 6-digit code.");
      return;
    }
    setVerifyConfirming(true);
    try {
      const data = await apiCall<PayoutApiResponse>(
        "/api/artists/me/payout-bank/verify/confirm",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: verifyOtpCode }),
        },
      );
      if (data?.payout) setExistingPayout(data.payout);
      toast.success("Bank account verified.");
      setVerifyOpen(false);
      setVerifyOtpCode("");
      setVerifyDevOtp(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to confirm code.";
      setVerifyError(msg);
    } finally {
      setVerifyConfirming(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = validatePayoutForm(formData);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setShowConfirmModal(true);
  };

  const savePayoutDetails = async () => {
    if (!artistId) {
      toast.error("You must be signed in as an artist.");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, string> = {
        accountHolderName: formData.accountHolderName.trim(),
        bankName: formData.bankName.trim(),
        branchName: formData.branchName.trim(),
        accountNumber: formData.accountNumber.trim(),
        accountType: formData.accountType,
        nicNumber: formData.nicNumber.trim().toUpperCase(),
        mobileNumber: formData.mobileNumber.trim(),
        emailAddress: formData.emailAddress.trim().toLowerCase(),
      };
      const swift = formData.swiftBic.trim().toUpperCase();
      if (swift) payload.swiftBic = swift;

      const data = await apiCall<PayoutApiResponse>("/api/artists/me/payout-bank", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!data?.payout) {
        throw new Error(data?.message || "Failed to save payout details.");
      }

      setExistingPayout(data.payout);
      setFormData((prev) => ({
        ...prev,
        accountNumber: "",
        confirmAccountNumber: "",
      }));
      setShowConfirmModal(false);
      setEditing(false);
      toast.success("Payout details saved successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save payout details.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-violet-500/30">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-20 right-0 h-96 w-96 rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-fuchsia-600/10 blur-[100px]" />
      </div>

      <ConfirmSaveModal
        open={showConfirmModal}
        saving={saving}
        onConfirm={() => void savePayoutDetails()}
        onClose={() => setShowConfirmModal(false)}
      />

      {removeConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-red-400/30 bg-[#1A0F28] p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Remove payout method?</h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-300">
              Your saved bank details will be deleted. You won&apos;t receive payouts
              until you add new details. Existing wallet balance is unaffected.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setRemoveConfirmOpen(false)}
                disabled={removing}
                className="flex-1 rounded-xl border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-gray-200 hover:bg-white/10 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void removePayoutMethod()}
                disabled={removing}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-60"
              >
                {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {verifyOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#1A0F28] p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Verify your bank account</h3>
            <p className="mt-2 text-sm text-gray-300">
              {verifySentTo
                ? `We sent a 6-digit code to ${verifySentTo}.`
                : "Enter the 6-digit code we sent you."}
            </p>
            {verifyDevOtp ? (
              <p className="mt-2 rounded-lg border border-violet-400/40 bg-violet-500/10 px-3 py-2 text-xs text-violet-200">
                Dev OTP: <span className="font-mono font-bold">{verifyDevOtp}</span>
                <span className="block opacity-70">
                  (only shown in development — replace with real SMS in production)
                </span>
              </p>
            ) : null}
            <input
              value={verifyOtpCode}
              onChange={(e) => {
                setVerifyOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setVerifyError("");
              }}
              inputMode="numeric"
              autoFocus
              placeholder="123456"
              className="mt-4 w-full rounded-xl border border-white/10 bg-gray-950/80 px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] text-white outline-none focus:border-violet-500"
            />
            {verifyError ? (
              <p className="mt-2 text-xs text-red-300">{verifyError}</p>
            ) : null}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setVerifyOpen(false);
                  setVerifyOtpCode("");
                  setVerifyError("");
                }}
                disabled={verifyConfirming}
                className="flex-1 rounded-xl border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-gray-200 hover:bg-white/10 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmVerification()}
                disabled={verifyConfirming || verifyOtpCode.length !== 6}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-60"
              >
                {verifyConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Verify
              </button>
            </div>
            <button
              type="button"
              onClick={() => void startVerification()}
              disabled={verifySending}
              className="mt-3 w-full text-xs text-violet-300 underline-offset-4 hover:underline disabled:opacity-60"
            >
              {verifySending ? "Resending..." : "Resend code"}
            </button>
          </div>
        </div>
      ) : null}

      <nav className="sticky top-0 z-10 border-b border-white/5 bg-gray-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
          <Link
            href="/artist/earnings"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Earnings
          </Link>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-3xl border border-white/10 bg-[#1E112A]/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Payout bank details</h1>
          <p className="mt-3 max-w-3xl leading-relaxed text-gray-300">
            Add or update your payout profile to receive artist earnings directly to a
            Sri Lankan bank account via local bank transfer in LKR.
          </p>
          <p className="mt-3 inline-flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            Your bank details are encrypted and only used for artist payout processing.
          </p>
        </div>

        {loading ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-[#1E112A]/60 p-6 sm:p-8">
            <p className="text-sm text-gray-300">Loading payout details...</p>
            <div className="mt-4 space-y-3">
              <div className="h-4 w-1/3 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
              <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
            </div>
          </div>
        ) : (
          <>
            <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-[#1E112A]/60 p-5 backdrop-blur-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Current payout method
                </p>
                <p className="text-sm font-bold text-white">
                  {existingPayout ? payoutMethodLabel : "Not submitted"}
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-[#1E112A]/60 p-5 backdrop-blur-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Verification status
                </p>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${verificationBadgeStyle(
                    verificationStatus,
                  )}`}
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {verificationLabel(verificationStatus)}
                </span>
              </article>
              <article className="rounded-2xl border border-white/10 bg-[#1E112A]/60 p-5 backdrop-blur-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Last updated
                </p>
                <p className="text-sm font-bold text-white">
                  {formatTimestamp(existingPayout?.updatedAt)}
                </p>
              </article>
            </section>

            {verificationStatus !== "verified" ? (
              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p>
                    Payouts will be enabled after your bank account is verified.
                    {existingPayout
                      ? " We'll send a 6-digit code to your registered email and mobile number."
                      : " Save your bank details first, then verify."}
                  </p>
                </div>
                {existingPayout ? (
                  <button
                    type="button"
                    onClick={() => void startVerification()}
                    disabled={verifySending}
                    className="self-start rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-gray-900 hover:bg-amber-300 disabled:opacity-60"
                  >
                    {verifySending ? "Sending code..." : "Verify now"}
                  </button>
                ) : null}
              </div>
            ) : null}

            {existingPayout && !editing ? (
              <section className="mt-6 rounded-3xl border border-white/10 bg-[#1E112A]/60 p-6 shadow-xl backdrop-blur-sm">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">Saved payout details</h2>
                    <p className="mt-1 text-sm text-gray-400">
                      Account number is masked for privacy.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="rounded-xl border border-violet-400/40 bg-violet-500/15 px-4 py-2 text-sm font-semibold text-violet-200 hover:bg-violet-500/25"
                    >
                      Edit payout details
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemoveConfirmOpen(true)}
                      className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/20"
                    >
                      Remove payout method
                    </button>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-3 text-sm text-gray-300 sm:grid-cols-2">
                  <p>
                    <span className="text-gray-500">Account holder:</span>{" "}
                    {existingPayout.accountHolderName}
                  </p>
                  <p>
                    <span className="text-gray-500">Bank:</span> {existingPayout.bankName}
                  </p>
                  <p>
                    <span className="text-gray-500">Branch:</span> {existingPayout.branchName}
                  </p>
                  <p>
                    <span className="text-gray-500">Account type:</span>{" "}
                    {existingPayout.accountType === "savings" ? "Savings" : "Current"}
                  </p>
                  <p>
                    <span className="text-gray-500">Account:</span>{" "}
                    <span className="font-mono">{existingPayout.accountNumberMasked}</span>
                  </p>
                  <p>
                    <span className="text-gray-500">NIC:</span> {existingPayout.nicNumber}
                  </p>
                  <p>
                    <span className="text-gray-500">Mobile:</span>{" "}
                    {existingPayout.mobileNumber}
                  </p>
                  <p>
                    <span className="text-gray-500">Email:</span>{" "}
                    {existingPayout.emailAddress}
                  </p>
                  <p>
                    <span className="text-gray-500">SWIFT/BIC:</span>{" "}
                    {existingPayout.swiftBic || "Not provided"}
                  </p>
                </div>
              </section>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-5 rounded-3xl border border-white/10 bg-[#1E112A]/60 p-6 shadow-xl backdrop-blur-sm sm:p-8"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-gray-300">
                      Account holder name
                    </span>
                    <input
                      value={formData.accountHolderName}
                      onChange={(e) => onInputChange("accountHolderName", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-gray-950/80 px-4 py-3 text-white outline-none focus:border-violet-500"
                      placeholder="Legal name on the account"
                    />
                    {errors.accountHolderName ? (
                      <p className="mt-1 text-xs text-red-300">{errors.accountHolderName}</p>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-gray-300">
                      Bank name
                    </span>
                    <select
                      value={formData.bankName}
                      onChange={(e) => onInputChange("bankName", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-gray-950/80 px-4 py-3 text-white outline-none focus:border-violet-500"
                    >
                      <option value="">Select a bank</option>
                      {SRI_LANKAN_BANKS.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                    {errors.bankName ? (
                      <p className="mt-1 text-xs text-red-300">{errors.bankName}</p>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-gray-300">
                      Branch name
                    </span>
                    <input
                      value={formData.branchName}
                      onChange={(e) => onInputChange("branchName", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-gray-950/80 px-4 py-3 text-white outline-none focus:border-violet-500"
                      placeholder="e.g. Colombo Fort"
                    />
                    {errors.branchName ? (
                      <p className="mt-1 text-xs text-red-300">{errors.branchName}</p>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-gray-300">
                      Account number
                    </span>
                    <input
                      value={formData.accountNumber}
                      onChange={(e) =>
                        onInputChange(
                          "accountNumber",
                          e.target.value.replace(/\D/g, ""),
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-gray-950/80 px-4 py-3 font-mono text-white outline-none focus:border-violet-500"
                      placeholder="Numbers only"
                      inputMode="numeric"
                      autoComplete="off"
                    />
                    {errors.accountNumber ? (
                      <p className="mt-1 text-xs text-red-300">{errors.accountNumber}</p>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-gray-300">
                      Re-enter account number
                    </span>
                    <input
                      value={formData.confirmAccountNumber}
                      onChange={(e) =>
                        onInputChange(
                          "confirmAccountNumber",
                          e.target.value.replace(/\D/g, ""),
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-gray-950/80 px-4 py-3 font-mono text-white outline-none focus:border-violet-500"
                      placeholder="Re-enter account number"
                      inputMode="numeric"
                      autoComplete="off"
                    />
                    {errors.confirmAccountNumber ? (
                      <p className="mt-1 text-xs text-red-300">
                        {errors.confirmAccountNumber}
                      </p>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-gray-300">
                      Account type
                    </span>
                    <select
                      value={formData.accountType}
                      onChange={(e) =>
                        onInputChange("accountType", e.target.value as AccountType)
                      }
                      className="w-full rounded-xl border border-white/10 bg-gray-950/80 px-4 py-3 text-white outline-none focus:border-violet-500"
                    >
                      <option value="savings">Savings</option>
                      <option value="current">Current</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-gray-300">
                      NIC number
                    </span>
                    <input
                      value={formData.nicNumber}
                      onChange={(e) => onInputChange("nicNumber", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-gray-950/80 px-4 py-3 text-white outline-none focus:border-violet-500"
                      placeholder="Old (123456789V) or New (200012345678)"
                    />
                    {errors.nicNumber ? (
                      <p className="mt-1 text-xs text-red-300">{errors.nicNumber}</p>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-gray-300">
                      Mobile number
                    </span>
                    <input
                      value={formData.mobileNumber}
                      onChange={(e) =>
                        onInputChange("mobileNumber", e.target.value.replace(/[^\d]/g, ""))
                      }
                      className="w-full rounded-xl border border-white/10 bg-gray-950/80 px-4 py-3 text-white outline-none focus:border-violet-500"
                      placeholder="07XXXXXXXX"
                      inputMode="numeric"
                    />
                    {errors.mobileNumber ? (
                      <p className="mt-1 text-xs text-red-300">{errors.mobileNumber}</p>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-gray-300">
                      Email address
                    </span>
                    <input
                      type="email"
                      value={formData.emailAddress}
                      onChange={(e) => onInputChange("emailAddress", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-gray-950/80 px-4 py-3 text-white outline-none focus:border-violet-500"
                      placeholder="you@example.com"
                    />
                    {errors.emailAddress ? (
                      <p className="mt-1 text-xs text-red-300">{errors.emailAddress}</p>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-gray-300">
                      SWIFT code / BIC (optional)
                    </span>
                    <input
                      value={formData.swiftBic}
                      onChange={(e) => onInputChange("swiftBic", e.target.value.toUpperCase())}
                      className="w-full rounded-xl border border-white/10 bg-gray-950/80 px-4 py-3 font-mono text-white outline-none focus:border-violet-500"
                      placeholder="Only needed for international transfers"
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {existingPayout ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setFormData((prev) => ({
                          ...prev,
                          accountNumber: "",
                          confirmAccountNumber: "",
                        }));
                        setErrors({});
                      }}
                      className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-gray-200 hover:bg-white/10"
                    >
                      Cancel edit
                    </button>
                  ) : null}
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 font-bold text-white transition hover:bg-violet-500 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Save payout details
                  </button>
                </div>
              </form>
            )}

            <section className="mt-6 rounded-3xl border border-white/10 bg-[#1E112A]/60 p-5 backdrop-blur-sm">
              <div className="mb-2 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-violet-300" />
                <h3 className="text-sm font-bold text-white">Sri Lanka payout context</h3>
              </div>
              <p className="text-sm text-gray-300">
                Payouts are sent in LKR to your local Sri Lankan bank transfer profile.
                ACH/domestic routing is not used here. SWIFT/BIC is optional and only
                needed for international transfer setups.
              </p>
            </section>
          </>
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
