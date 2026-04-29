/**
 * Demo Artist Data - Sample data for demo/test artist account only
 * This file contains all demo bookings and earnings data
 * Used only when logged-in user email === "demoartist@bookyourartist.com"
 */

/**
 * Check if user is the demo artist
 */
export const isDemoArtist = (user: any): boolean => {
  if (!user) return false;
  return (
    user.email === "demoartist@bookyourartist.com" ||
    user.email === "artist@test.com" // Also allow test account for development
  );
};

/**
 * Booking Status Type
 */
export type BookingStatus = "pending" | "confirmed" | "cancelled";

/**
 * Booking Interface
 */
export interface DemoBooking {
  id: string;
  clientName: string;
  avatar?: string;
  eventType: string;
  date: string; // Format: YYYY-MM-DD
  location: string;
  amount: number;
  status: BookingStatus;
  description?: string;
}

/**
 * Demo Bookings Data
 */
export const DEMO_BOOKINGS: DemoBooking[] = [
  {
    id: "B1",
    clientName: "Sarah Jenkins",
    eventType: "Wedding Reception",
    date: "2026-05-12",
    location: "Grand Plaza, NY",
    amount: 1500,
    status: "pending",
    description: "50-person wedding reception with DJ and live audio setup",
  },
  {
    id: "B2",
    clientName: "Michael Chen",
    eventType: "Corporate Gala",
    date: "2026-05-20",
    location: "Downtown Center",
    amount: 2200,
    status: "confirmed",
    description: "200-person corporate charity gala event",
  },
  {
    id: "B3",
    clientName: "Emily Davis",
    eventType: "Private Party",
    date: "2026-04-18",
    location: "Beverly Hills",
    amount: 800,
    status: "cancelled",
    description: "Birthday celebration (cancelled by client)",
  },
  {
    id: "B4",
    clientName: "James Wilson",
    eventType: "Club Performance",
    date: "2026-06-05",
    location: "Neon Lounge",
    amount: 1200,
    status: "confirmed",
    description: "3-hour DJ set at rooftop club",
  },
];

/**
 * Transaction Interface
 */
export interface DemoTransaction {
  id: string;
  event: string;
  client: string;
  date: string; // Format: "Month Day, YYYY"
  amount: number;
  status: "pending_clearance" | "completed" | "processed";
  bookingId?: string;
}

/**
 * Demo Transactions/Earnings Data
 */
export const DEMO_TRANSACTIONS: DemoTransaction[] = [
  {
    id: "TX1",
    event: "Corporate Gala",
    client: "Michael Chen",
    date: "May 20, 2026",
    amount: 2200,
    status: "pending_clearance",
    bookingId: "B2",
  },
  {
    id: "TX2",
    event: "Neon Lounge DJ Set",
    client: "James Wilson",
    date: "May 05, 2026",
    amount: 1200,
    status: "processed",
    bookingId: "B4",
  },
  {
    id: "TX3",
    event: "Private Party",
    client: "Emily Davis",
    date: "Apr 18, 2026",
    amount: 800,
    status: "processed",
    bookingId: "B3",
  },
  {
    id: "TX4",
    event: "Festival Warmup",
    client: "City Events",
    date: "Mar 30, 2026",
    amount: 3500,
    status: "processed",
  },
];

/**
 * Earnings Summary Interface
 */
export interface DemoEarningsSummary {
  netRevenue: number;
  thisMonth: number;
  pendingEscrow: number;
  completedPayouts: number;
  nextPayoutAmount: number;
  nextPayoutDate: string; // Format: "YYYY-MM-DD"
  paymentMethod: string;
  processingFee: number;
}

/**
 * Demo Earnings Summary Data
 */
export const DEMO_EARNINGS: DemoEarningsSummary = {
  netRevenue: 12450.0,
  thisMonth: 3400.0,
  pendingEscrow: 2200.0,
  completedPayouts: 10250.0,
  nextPayoutAmount: 2200.0,
  nextPayoutDate: "2026-05-25",
  paymentMethod: "Bank **** 4821",
  processingFee: -66.0,
};

/**
 * Get demo booking summary statistics
 */
export const getDemoBookingSummary = () => {
  return {
    total: DEMO_BOOKINGS.length,
    pending: DEMO_BOOKINGS.filter((b) => b.status === "pending").length,
    confirmed: DEMO_BOOKINGS.filter((b) => b.status === "confirmed").length,
    cancelled: DEMO_BOOKINGS.filter((b) => b.status === "cancelled").length,
  };
};

/**
 * Get demo earnings data for display
 */
export const getDemoEarningsStats = () => {
  return {
    earnings: DEMO_EARNINGS,
    transactions: DEMO_TRANSACTIONS,
    summary: {
      totalEarned: DEMO_EARNINGS.netRevenue,
      monthlyEarnings: DEMO_EARNINGS.thisMonth,
      pendingAmount: DEMO_EARNINGS.pendingEscrow,
    },
  };
};
