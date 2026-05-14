"use client";

import { useState } from "react";
import { useAuth } from "@/contexts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { 
  Users, UserCheck, UserPlus, Calendar, CheckCircle, 
  DollarSign, Wallet, AlertTriangle, ShieldCheck, 
  Settings, LogOut, LayoutDashboard, FileText, Activity, 
  Star, Image as ImageIcon, MapPin, Search, ChevronRight, Menu, X, PieChart, CreditCard, Music
} from "lucide-react";

function AdminDashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard/admin" },
    { name: "Users", icon: Users, href: "#" },
    { name: "Artists", icon: Music, href: "#" },
    { name: "Bookings", icon: Calendar, href: "#" },
    { name: "Payments", icon: CreditCard, href: "#" },
    { name: "Reports", icon: FileText, href: "#" },
    { name: "Settings", icon: Settings, href: "#" },
  ];

  const stats = [
    { title: "Total Users", value: "1,245", icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { title: "Approved Artists", value: "342", icon: UserCheck, color: "text-green-400", bg: "bg-green-400/10" },
    { title: "Pending Artist Approvals", value: "18", icon: UserPlus, color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { title: "Total Bookings", value: "856", icon: Calendar, color: "text-purple-400", bg: "bg-purple-400/10" },
    { title: "Completed Events", value: "712", icon: CheckCircle, color: "text-teal-400", bg: "bg-teal-400/10" },
    { title: "Revenue", value: "$45,200", icon: DollarSign, color: "text-indigo-400", bg: "bg-indigo-400/10" },
    { title: "Pending Payouts", value: "$3,450", icon: Wallet, color: "text-orange-400", bg: "bg-orange-400/10" },
    { title: "Disputes / Reports", value: "4", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/10" },
  ];

  const actions = [
    { 
      title: "Artist Verification", 
      desc: "Review pending artists, approve/reject profiles, check documents",
      icon: ShieldCheck, 
      color: "group-hover:text-yellow-400" 
    },
    { 
      title: "Booking Management", 
      desc: "Monitor client bookings, event dates, booking status, cancellations",
      icon: Calendar, 
      color: "group-hover:text-purple-400" 
    },
    { 
      title: "User Management", 
      desc: "Manage clients and artists, block/suspend accounts",
      icon: Users, 
      color: "group-hover:text-blue-400" 
    },
    { 
      title: "Payment & Payout", 
      desc: "View Stripe payments, artist payout requests, commission tracking",
      icon: DollarSign, 
      color: "group-hover:text-green-400" 
    },
    { 
      title: "Reviews & Complaints", 
      desc: "Manage ratings, feedback, and reported users",
      icon: Star, 
      color: "group-hover:text-red-400" 
    },
    { 
      title: "Content Management", 
      desc: "Manage featured artists, homepage sections, categories",
      icon: ImageIcon, 
      color: "group-hover:text-pink-400" 
    },
    { 
      title: "Analytics", 
      desc: "Show platform growth, booking trends, revenue insights",
      icon: PieChart, 
      color: "group-hover:text-indigo-400" 
    },
  ];

  const recentActivity = [
    { action: "New artist registered", details: "DJ Snake", time: "2 hours ago", icon: UserPlus, color: "text-blue-400" },
    { action: "Booking request created", details: "Wedding Reception in Colombo", time: "4 hours ago", icon: Calendar, color: "text-purple-400" },
    { action: "Payment completed", details: "$500 from John Doe", time: "5 hours ago", icon: CheckCircle, color: "text-green-400" },
    { action: "Artist payout requested", details: "$800 to The Rock Band", time: "1 day ago", icon: Wallet, color: "text-yellow-400" },
    { action: "User complaint submitted", details: "Issue with last booking", time: "2 days ago", icon: AlertTriangle, color: "text-red-400" },
  ];

  const pendingTasks = [
    { task: "Artists waiting for approval", count: 18, urgent: true },
    { task: "Pending payouts", count: 7, urgent: false },
    { task: "Booking disputes", count: 2, urgent: true },
    { task: "Incomplete artist profiles", count: 45, urgent: false },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex overflow-hidden font-sans">
      
      {/* Sidebar (Desktop) & Mobile Overlay */}
      <div className={`fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm transition-opacity ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={() => setSidebarOpen(false)} />
      
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#111827] border-r border-gray-800 transition-transform duration-300 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/30">
              BA
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Admin
            </span>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item, index) => (
            <a key={index} href={item.href} className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all ${index === 0 ? "bg-purple-500/10 text-purple-400" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg text-red-400 hover:bg-red-400/10 transition-all font-medium">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#0B0F19]/90 backdrop-blur z-30">
          <div className="flex items-center space-x-2">
            <span className="font-bold">Book Your Artist</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg bg-gray-800">
            <Menu size={20} />
          </button>
        </div>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Hero Section */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 p-6 lg:p-10 shadow-xl">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-purple-600/20 blur-3xl rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-blue-600/10 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="relative z-10">
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-3 tracking-tight">
                Welcome back, {user?.name || "Admin"}
              </h1>
              <p className="text-gray-400 max-w-2xl text-lg mb-6 leading-relaxed">
                Manage artists, bookings, users, payments, and platform activity from one place.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                  Live Platform
                </span>
                <span className="inline-flex items-center px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-sm font-medium">
                  <MapPin size={14} className="mr-1.5" />
                  Sri Lanka Market
                </span>
                <span className="inline-flex items-center px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-sm font-medium">
                  <ShieldCheck size={14} className="mr-1.5" />
                  Secure Admin Panel
                </span>
              </div>
            </div>
          </section>

          {/* Stats Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 hover:bg-gray-800 transition-all duration-300 group shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                    <stat.icon size={22} />
                  </div>
                  <ChevronRight size={16} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <section className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Activity className="text-purple-400" size={24} />
                Admin Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {actions.map((action, i) => (
                  <button key={i} className="group flex flex-col items-start p-5 bg-gray-800/40 border border-gray-700/50 rounded-xl hover:bg-gray-800 hover:border-gray-600 transition-all text-left shadow-sm">
                    <action.icon size={28} className={`mb-3 text-gray-500 transition-colors ${action.color}`} />
                    <h3 className="text-lg font-semibold text-gray-200 mb-1 group-hover:text-white transition-colors">{action.title}</h3>
                    <p className="text-sm text-gray-500 leading-snug">{action.desc}</p>
                  </button>
                ))}
              </div>
            </section>

            <div className="space-y-8">
              {/* Pending Tasks */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle className="text-blue-400" size={24} />
                  Pending Tasks
                </h2>
                <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden divide-y divide-gray-700/50 shadow-sm">
                  {pendingTasks.map((task, i) => (
                    <div key={i} className="p-4 hover:bg-gray-800/80 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${task.urgent ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                        <span className="text-sm font-medium text-gray-300">{task.task}</span>
                      </div>
                      <span className="bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded-md">{task.count}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Recent Activity */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Search className="text-green-400" size={24} />
                  Recent Activity
                </h2>
                <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 space-y-5 shadow-sm">
                  {recentActivity.map((activity, i) => (
                    <div key={i} className="flex gap-4 items-start relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-700 before:to-transparent last:before:hidden">
                      <div className={`relative z-10 w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 ${activity.color}`}>
                        <activity.icon size={14} />
                      </div>
                      <div className="flex-1 pb-1">
                        <p className="text-sm font-medium text-gray-200">{activity.action}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{activity.details} &bull; {activity.time}</p>
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-2 mt-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors">
                    View All Activity
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
