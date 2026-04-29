"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { 
  Wallet, DollarSign, ArrowUpRight, CheckCircle, TrendingUp, LayoutDashboard, Briefcase, CalendarIcon, MessageSquare, Settings, Bell, Download, Zap
} from "lucide-react";
import { useAuth } from "@/contexts";
import { isDemoArtist, DEMO_EARNINGS, DEMO_TRANSACTIONS } from "@/lib/demoArtistData";

const NavItem = ({ href, icon: Icon, label, active }: { href: string, icon: any, label: string, active?: boolean }) => (
  <Link href={href} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${active ? "bg-violet-600/20 text-violet-400 font-bold border border-violet-500/30" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
    <Icon className={`w-4 h-4 ${active ? "text-violet-400" : ""}`} />
    <span className="hidden xl:block whitespace-nowrap">{label}</span>
  </Link>
);

const mockTransactions = [
  { id: "TX1", event: "Corporate Gala", client: "Michael Chen", date: "May 20, 2026", amount: 2200, status: "pending_clearance" },
  { id: "TX2", event: "Neon Lounge DJ Set", client: "James Wilson", date: "May 05, 2026", amount: 1200, status: "completed" },
  { id: "TX3", event: "Private Party", client: "Emily Davis", date: "Apr 18, 2026", amount: 800, status: "completed" },
  { id: "TX4", event: "Festival Warmup", client: "City Events", date: "Mar 30, 2026", amount: 3500, status: "completed" },
];

export default function EarningsPage() {
  const { user, loading } = useAuth();
  
  // Use demo data if demo artist, otherwise use empty/real data
  const displayTransactions = isDemoArtist(user) ? DEMO_TRANSACTIONS : [];
  const earnings = isDemoArtist(user) ? DEMO_EARNINGS : {
    netRevenue: 0,
    thisMonth: 0,
    pendingEscrow: 0,
    completedPayouts: 0,
    nextPayoutAmount: 0,
    nextPayoutDate: "",
    paymentMethod: "",
    processingFee: 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full mx-auto animate-spin mb-4"></div>
          <p className="text-gray-400">Loading...</p>
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
             <NavItem href="/artist/messages" icon={MessageSquare} label="Messages" />
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
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-colors">
            <Download className="w-4 h-4" /> Download Statement
          </button>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { title: "Net Revenue", value: `$${earnings.netRevenue.toFixed(2)}`, sub: "+15% from last month", icon: TrendingUp, colorClass: "text-emerald-400", bgClass: "bg-emerald-500/10" },
            { title: "This Month", value: `$${earnings.thisMonth.toFixed(2)}`, sub: "May 2026 total", icon: DollarSign, colorClass: "text-blue-400", bgClass: "bg-blue-500/10" },
            { title: "Pending Escrow", value: `$${earnings.pendingEscrow.toFixed(2)}`, sub: "Clearing in 3 days", icon: Wallet, colorClass: "text-amber-400", bgClass: "bg-amber-500/10" },
            { title: "Completed Payouts", value: `$${earnings.completedPayouts.toFixed(2)}`, sub: "Successfully withdrawn", icon: CheckCircle, colorClass: "text-violet-400", bgClass: "bg-violet-500/10" },
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
                           tx.status === 'processed' || tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                         }`}>
                           {tx.status === 'processed' || tx.status === 'completed' ? 'Processed' : 'Pending'}
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
              
              {isDemoArtist(user) ? (
                <>
                  <p className="text-3xl font-black text-white mb-6">${earnings.nextPayoutAmount.toFixed(2)}</p>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                      <span className="text-gray-400">Scheduled Date</span>
                      <span className="font-bold text-white">{new Date(earnings.nextPayoutDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                      <span className="text-gray-400">Payment Method</span>
                      <span className="font-bold flex items-center gap-2">
                        <span className="w-8 h-5 bg-white/10 rounded flex items-center justify-center text-[10px] border border-white/20">Bank</span>
                        {earnings.paymentMethod.split(" ").pop()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Processing Fee</span>
                      <span className="font-bold text-red-400">${earnings.processingFee.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-sm mb-8">No payout scheduled yet. Complete bookings to earn money.</p>
              )}

              <button className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl py-3.5 transition-all outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 flex justify-center items-center gap-2">
                 Manage Payout Methods
              </button>
           </div>

        </div>
      </main>
    </div>
  );
}
