"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { 
  Wallet, DollarSign, ArrowUpRight, CheckCircle, TrendingUp, LayoutDashboard, Briefcase, CalendarIcon, Settings, Bell, Download, Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts";
import { API_BASE_URL, getAuthToken } from "@/lib/api";
import { isDemoArtist, DEMO_EARNINGS, DEMO_TRANSACTIONS } from "@/lib/demoArtistData";

const NavItem = ({ href, icon: Icon, label, active }: { href: string, icon: LucideIcon, label: string, active?: boolean }) => (
  <Link href={href} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${active ? "bg-violet-600/20 text-violet-400 font-bold border border-violet-500/30" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
    <Icon className={`w-4 h-4 ${active ? "text-violet-400" : ""}`} />
    <span className="hidden xl:block whitespace-nowrap">{label}</span>
  </Link>
);

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "disputed";

interface ArtistBookingRow {
  _id: string;
  eventType?: string;
  eventDate?: string;
  totalPrice?: number;
  artistPrice?: number;
  platformFee?: number;
  status?: BookingStatus;
  paymentStatus?: "pending" | "paid" | "refunded";
  clientId?: {
    name?: string;
    email?: string;
  };
}

interface TransactionRow {
  id: string;
  event: string;
  client: string;
  date: string;
  amount: number;
  status: "pending_clearance" | "completed" | "pending_payment" | "processed";
}

interface EarningsSummary {
  netRevenue: number;
  thisMonth: number;
  pendingEscrow: number;
  completedPayouts: number;
  nextPayoutAmount: number;
  nextPayoutDate: string;
  paymentMethod: string;
  processingFee: number;
}

const emptyEarnings: EarningsSummary = {
  netRevenue: 0,
  thisMonth: 0,
  pendingEscrow: 0,
  completedPayouts: 0,
  nextPayoutAmount: 0,
  nextPayoutDate: "",
  paymentMethod: "",
  processingFee: 0,
};

function artistNetAmount(booking: ArtistBookingRow): number {
  if (typeof booking.artistPrice === "number") return booking.artistPrice;
  if (typeof booking.totalPrice !== "number") return 0;
  if (typeof booking.platformFee === "number") return Math.max(0, booking.totalPrice - booking.platformFee);
  // Booking model may not always store artistPrice/platformFee, so use the
  // platform's 10% fee rule as a safe display fallback.
  return booking.totalPrice * 0.9;
}

function isSameMonth(dateValue: string | undefined, now = new Date()): boolean {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function formatDate(dateValue: string | undefined): string {
  if (!dateValue) return "Date not set";
  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildEarningsSummary(bookings: ArtistBookingRow[]): EarningsSummary {
  const earningBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "completed");
  const completed = earningBookings.filter((b) => b.status === "completed");
  const pending = earningBookings.filter((b) => b.status === "confirmed");

  const completedPayouts = completed.reduce((sum, b) => sum + artistNetAmount(b), 0);
  const pendingEscrow = pending.reduce((sum, b) => sum + artistNetAmount(b), 0);
  const thisMonth = earningBookings
    .filter((b) => isSameMonth(b.eventDate))
    .reduce((sum, b) => sum + artistNetAmount(b), 0);
  const nextPayoutBooking = pending
    .filter((b) => artistNetAmount(b) > 0)
    .sort((a, b) => new Date(a.eventDate ?? 0).getTime() - new Date(b.eventDate ?? 0).getTime())[0];

  return {
    ...emptyEarnings,
    netRevenue: completedPayouts + pendingEscrow,
    thisMonth,
    pendingEscrow,
    completedPayouts,
    nextPayoutAmount: nextPayoutBooking ? artistNetAmount(nextPayoutBooking) : 0,
    nextPayoutDate: nextPayoutBooking?.eventDate ?? "",
    paymentMethod: "Bank account",
    processingFee: (completedPayouts + pendingEscrow) * 0.1,
  };
}

function buildTransactions(bookings: ArtistBookingRow[]): TransactionRow[] {
  return bookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .sort((a, b) => new Date(b.eventDate ?? 0).getTime() - new Date(a.eventDate ?? 0).getTime())
    .map((booking) => ({
      id: booking._id,
      event: booking.eventType || "Performance booking",
      client: booking.clientId?.name || "Client",
      date: formatDate(booking.eventDate),
      amount: artistNetAmount(booking),
      status:
        booking.status === "completed"
          ? "completed"
          : booking.paymentStatus === "paid"
            ? "pending_clearance"
            : "pending_payment",
    }));
}

interface PayoutMaskApi {
  accountHolderName: string;
  bankName: string;
  country: string;
  swiftBic: string;
  accountNumberMasked: string;
  routingNumberMasked: string;
  isComplete: boolean;
}

function escapeCsvCell(val: string | number): string {
  const s = String(val);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function transactionExportLabel(tx: TransactionRow): string {
  const s = tx.status;
  if (s === "completed" || s === "processed") return "Processed";
  return "Pending";
}

function downloadArtistEarningsCsv(opts: {
  artistName: string;
  earnings: EarningsSummary;
  transactions: TransactionRow[];
}) {
  const { artistName, earnings, transactions } = opts;
  const stamp = new Date().toISOString().slice(0, 10);
  const lines: string[][] = [
    ["Book Your Artist — Earnings statement"],
    ["Generated (UTC)", new Date().toISOString()],
    ["Artist", artistName],
    [],
    ["Summary"],
    ["Net revenue (confirmed + completed)", earnings.netRevenue.toFixed(2)],
    ["This month", earnings.thisMonth.toFixed(2)],
    ["Pending escrow", earnings.pendingEscrow.toFixed(2)],
    ["Completed payouts", earnings.completedPayouts.toFixed(2)],
    ["Next payout amount", earnings.nextPayoutAmount.toFixed(2)],
    ["Scheduled / next event date", earnings.nextPayoutDate ? formatDate(earnings.nextPayoutDate) : ""],
    ["Payout destination", earnings.paymentMethod],
    ["Est. platform fee (display)", earnings.processingFee.toFixed(2)],
    [],
    ["Transactions"],
    ["Event", "Client", "Date", "Amount USD", "Status"],
    ...transactions.map((t) => [
      t.event,
      t.client,
      t.date,
      t.amount.toFixed(2),
      transactionExportLabel(t),
    ]),
  ];
  const csv = lines.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bya-earnings-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function EarningsPage() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState<ArtistBookingRow[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(true);
  const [payoutMask, setPayoutMask] = useState<PayoutMaskApi | null>(null);
  
  useEffect(() => {
    let cancelled = false;

    async function fetchArtistBookings() {
      if (!user || isDemoArtist(user)) {
        setBookings([]);
        setEarningsLoading(false);
        return;
      }

      try {
        setEarningsLoading(true);
        const token = getAuthToken();
        const res = await fetch(`${API_BASE_URL}/api/bookings/my?limit=100&sort=-eventDate`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json()) as {
          success?: boolean;
          message?: string;
          bookings?: ArtistBookingRow[];
        };
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load earnings");
        }
        if (!cancelled) setBookings(data.bookings ?? []);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Failed to load earnings");
          setBookings([]);
        }
      } finally {
        if (!cancelled) setEarningsLoading(false);
      }
    }

    if (!loading) {
      void fetchArtistBookings();
    }

    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  useEffect(() => {
    if (!user || isDemoArtist(user)) {
      setPayoutMask(null);
      return;
    }
    let cancelled = false;
    const loadPayout = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE_URL}/api/artists/me/payout-bank`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = (await res.json()) as { success?: boolean; payout?: PayoutMaskApi };
        if (!cancelled && data.success && data.payout) setPayoutMask(data.payout);
      } catch {
        /* non-blocking */
      }
    };
    void loadPayout();
    return () => {
      cancelled = true;
    };
  }, [user, pathname]);

  // Demo artist keeps sample data; real artists are computed from live bookings.
  const displayTransactions: TransactionRow[] = isDemoArtist(user)
    ? (DEMO_TRANSACTIONS as unknown as TransactionRow[])
    : buildTransactions(bookings);
  const baseEarnings = isDemoArtist(user) ? DEMO_EARNINGS : buildEarningsSummary(bookings);
  const earnings: EarningsSummary = {
    ...baseEarnings,
    paymentMethod: isDemoArtist(user)
      ? baseEarnings.paymentMethod
      : payoutMask?.isComplete
        ? `${payoutMask.bankName} ${payoutMask.accountNumberMasked}`.trim()
        : "Not set — add in Manage payout",
  };

  const monthLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (loading || earningsLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full mx-auto animate-spin mb-4"></div>
          <p className="text-gray-400">Loading earnings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-violet-500/30 pb-20">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[40vw] h-[40vh] bg-emerald-900/10 blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vh] bg-violet-900/10 blur-[150px] mix-blend-screen" />
      </div>

      {/* Navbar Replicated */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-[90rem] mx-auto px-4 lg:px-8 flex items-center justify-between h-16">
          <Link href="/home/artist" className="flex items-center gap-3 shrink-0 group">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center font-black shadow-lg">♪</div>
             <span className="font-extrabold tracking-tight text-white hidden sm:block">BookYour<span className="text-violet-400">Artist</span></span>
          </Link>
          <div className="flex items-center overflow-x-auto scrollbar-hide py-1 gap-1">
             <NavItem href="/home/artist" icon={LayoutDashboard} label="Dashboard" />
             <NavItem href="/artist/bookings" icon={Briefcase} label="Bookings" />
             <NavItem href="/artist/calendar" icon={CalendarIcon} label="Calendar" />
             <NavItem href="/artist/messages" icon={Bell} label="Notifications" />
             <NavItem href="/artist/earnings" icon={Wallet} label="Earnings" active />
             <NavItem href="/artist/profile" icon={Settings} label="Profile" />
          </div>
          <div className="flex items-center gap-4">
             <button className="text-gray-400 hover:text-white"><Bell className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-[90rem] mx-auto px-4 lg:px-8 py-8 relative z-10 flex flex-col gap-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-extrabold text-white">Earnings Dashboard</h1>
              {isDemoArtist(user) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-600/30 border border-violet-500/50 text-violet-300 text-xs font-bold rounded-full">
                  <Zap className="w-3.5 h-3.5" /> Demo Mode
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm">
              {isDemoArtist(user)
                ? "Preview sample earnings data (demo data only)"
                : "Track your revenue, payouts, and financial growth."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              try {
                downloadArtistEarningsCsv({
                  artistName: user?.name || "Artist",
                  earnings,
                  transactions: displayTransactions,
                });
                toast.success("Statement downloaded");
              } catch {
                toast.error("Could not generate statement");
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-colors"
          >
            <Download className="w-4 h-4" /> Download Statement
          </button>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { title: "Net Revenue", value: `$${earnings.netRevenue.toFixed(2)}`, sub: "Confirmed + completed bookings", icon: TrendingUp, colorClass: "text-emerald-400", bgClass: "bg-emerald-500/10" },
            { title: "This Month", value: `$${earnings.thisMonth.toFixed(2)}`, sub: `${monthLabel} total`, icon: DollarSign, colorClass: "text-blue-400", bgClass: "bg-blue-500/10" },
            { title: "Pending Escrow", value: `$${earnings.pendingEscrow.toFixed(2)}`, sub: "Confirmed bookings not completed", icon: Wallet, colorClass: "text-amber-400", bgClass: "bg-amber-500/10" },
            { title: "Completed Payouts", value: `$${earnings.completedPayouts.toFixed(2)}`, sub: "Completed booking income", icon: CheckCircle, colorClass: "text-violet-400", bgClass: "bg-violet-500/10" },
          ].map((card, i) => (
             <div key={i} className="bg-[#1E112A]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 group hover:border-white/20 transition-colors">
               <div className="flex justify-between items-start mb-4">
                 <p className="text-gray-400 text-xs font-bold tracking-wider uppercase">{card.title}</p>
                 <div className={`p-2.5 rounded-xl ${card.bgClass} ${card.colorClass}`}><card.icon className="w-5 h-5" /></div>
               </div>
               <h3 className="text-3xl font-black text-white mb-1.5">{card.value}</h3>
               <p className="text-sm text-gray-500 font-medium">{card.sub}</p>
             </div>
          ))}
        </div>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
           
           {/* Detailed Transactions Section */}
           <div className="xl:col-span-2 bg-[#1E112A]/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
             <div className="p-6 border-b border-white/10 flex justify-between items-center">
               <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
               <Link href="#" className="text-xs font-bold text-violet-400 hover:text-violet-300">View All</Link>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-white/5 bg-black/20">
                     <th className="p-4 pl-6 font-medium">Event / Booking</th>
                     <th className="p-4 font-medium">Date</th>
                     <th className="p-4 font-medium text-right">Amount</th>
                     <th className="p-4 pr-6 font-medium text-right">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {displayTransactions.length === 0 ? (
                     <tr>
                       <td colSpan={4} className="p-8 text-center text-gray-400">
                         No earnings data available yet
                       </td>
                     </tr>
                   ) : (
                     displayTransactions.map((tx) => (
                     <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                       <td className="p-4 pl-6">
                         <p className="font-bold text-white text-sm">{tx.event}</p>
                         <p className="text-xs text-gray-500">Client: {tx.client}</p>
                       </td>
                       <td className="p-4 text-sm text-gray-300">{tx.date}</td>
                       <td className="p-4 text-right font-black text-white">${tx.amount.toFixed(2)}</td>
                       <td className="p-4 pr-6 text-right">
                         <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                           tx.status === "processed" || tx.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                         }`}>
                           {tx.status === "processed" || tx.status === "completed" ? "Processed" : "Pending"}
                         </span>
                       </td>
                     </tr>
                   ))
                   )}
                 </tbody>
               </table>
             </div>
           </div>

           {/* Payout Details Sidebar */}
           <div className="bg-gradient-to-br from-[#1E112A] to-violet-950/20 border border-violet-500/20 rounded-2xl p-6 shadow-xl shadow-violet-500/5 h-fit">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center mb-6">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Next Payout</h2>

              {isDemoArtist(user) || earnings.nextPayoutAmount > 0 ? (
                <>
                  <p className="text-3xl font-black text-white mb-6">${earnings.nextPayoutAmount.toFixed(2)}</p>

                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center gap-4 text-sm border-b border-white/10 pb-4">
                      <span className="text-gray-400 shrink-0">Scheduled Date</span>
                      <span className="font-bold text-white text-right">
                        {earnings.nextPayoutDate ? formatDate(earnings.nextPayoutDate) : "After event completion"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 items-start text-sm border-b border-white/10 pb-4">
                      <span className="text-gray-400 shrink-0 pt-0.5">Payment Method</span>
                      <div className="min-w-0 text-right flex-1">
                        {isDemoArtist(user) ? (
                          <div className="flex flex-wrap items-start justify-end gap-2 font-bold">
                            <span className="inline-flex h-5 shrink-0 items-center justify-center rounded border border-white/20 bg-white/10 px-1.5 text-[10px] text-white">
                              Bank
                            </span>
                            <span className="text-xs font-bold leading-snug text-white">{DEMO_EARNINGS.paymentMethod}</span>
                          </div>
                        ) : payoutMask?.isComplete ? (
                          <div className="space-y-1 text-xs font-semibold">
                            <p className="text-sm font-bold text-white">{payoutMask.bankName}</p>
                            <p className="font-mono text-emerald-200/95">{payoutMask.accountNumberMasked}</p>
                            {payoutMask.routingNumberMasked ? (
                              <p className="text-[11px] text-gray-400">Routing {payoutMask.routingNumberMasked}</p>
                            ) : null}
                            <p className="text-[11px] font-medium text-gray-300">{payoutMask.accountHolderName}</p>
                            {payoutMask.country ? (
                              <p className="text-[11px] text-gray-500">{payoutMask.country}</p>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs font-bold leading-snug text-amber-200/90">{earnings.paymentMethod}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Estimated Platform Fee</span>
                      <span className="font-bold text-red-400">${earnings.processingFee.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mb-8 space-y-4">
                  <p className="text-gray-400 text-sm">
                    No payout scheduled yet. Once you have confirmed bookings, the next payout amount will appear above.
                  </p>
                  <div className="flex justify-between gap-4 items-start text-sm border-b border-white/10 pb-4">
                    <span className="text-gray-400 shrink-0 pt-0.5">Payment Method</span>
                    <div className="min-w-0 text-right flex-1">
                      {payoutMask?.isComplete ? (
                        <div className="space-y-1 text-xs font-semibold">
                          <p className="text-sm font-bold text-white">{payoutMask.bankName}</p>
                          <p className="font-mono text-emerald-200/95">{payoutMask.accountNumberMasked}</p>
                          {payoutMask.routingNumberMasked ? (
                            <p className="text-[11px] text-gray-400">Routing {payoutMask.routingNumberMasked}</p>
                          ) : null}
                          <p className="text-[11px] font-medium text-gray-300">{payoutMask.accountHolderName}</p>
                          {payoutMask.country ? <p className="text-[11px] text-gray-500">{payoutMask.country}</p> : null}
                        </div>
                      ) : (
                        <span className="text-xs font-bold leading-snug text-amber-200/90">{earnings.paymentMethod}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Link
                href="/artist/payout-settings"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 font-bold text-white outline-none transition-all hover:bg-violet-500 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-gray-950"
              >
                 Manage Payout Methods
              </Link>
           </div>

        </div>
      </main>
    </div>
  );
}
