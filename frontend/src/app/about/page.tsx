import React from 'react';
import Link from 'next/link';
import { 
  Music, Mic2, Star, Calendar, ShieldCheck, Clock, CheckCircle2, 
  Zap, Search, MessageSquare, CreditCard, ChevronRight, XCircle
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0A0512] text-white selection:bg-violet-500/30 selection:text-violet-200">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-gray-950/60">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Brand Logo & Links */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center font-black shadow-[0_0_20px_-5px_rgba(139,92,246,0.6)] text-white group-hover:scale-105 transition-transform">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-extrabold tracking-tight hidden lg:block">
                  BookYour<span className="text-violet-400">Artist</span>
                </span>
              </Link>
              
              <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
                <Link href="/" className="px-4 py-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all">
                  Home
                </Link>
                <Link href="/search" className="px-4 py-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all">
                  Artists
                </Link>
                <Link href="/about" className="px-4 py-2 rounded-full bg-white/10 text-white text-sm font-semibold transition-all shadow-sm">
                  About
                </Link>
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="px-5 py-2.5 text-sm font-bold text-white hover:text-violet-300 transition-colors">
                Log In
              </Link>
              <Link href="/auth/register" className="px-5 py-2.5 text-sm font-bold bg-white text-gray-950 hover:bg-gray-200 rounded-full transition-all hover:scale-105 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 w-full h-full bg-[#0A0512]">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-fuchsia-600/20 blur-[120px]" />
          <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[800px] h-[400px] rounded-full bg-blue-600/10 blur-[150px]" />
        </div>

        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex justify-center items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 text-sm font-bold tracking-wide text-violet-300">
            <Star className="w-4 h-4 fill-violet-400 text-violet-400" />
            <span>Premium Artist Booking Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight leading-tight">
            Elevating the <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-purple-400 animate-gradient-x">Live Music</span><br />
            Experience
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            We bridge the gap between extraordinary talent and event organizers. 
            A seamless, transparent, and secure way to book DJs, Bands, and Singers for your next unforgettable event.
          </p>
        </div>
      </section>

      {/* ABOUT DESCRIPTION */}
      <section className="py-20 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Simplifying the way you discover and book talent.</h2>
              <div className="space-y-6 text-gray-400 text-lg leading-relaxed">
                <p>
                  Organizing an event is stressful enough. Finding and booking the right artist shouldn&apos;t be. 
                  <span className="text-white font-medium"> Book Your Artist</span> was built to eliminate the endless emails, 
                  unclear pricing, and last-minute cancellations that plague the traditional entertainment industry.
                </p>
                <p>
                  Whether you&apos;re looking for a high-energy DJ for a club, a soulful singer for a wedding, 
                  or an acoustic band for a corporate retreat, our platform connects you directly with verified professionals.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#120A20] p-6 text-center border border-white/5 rounded-3xl transform translate-y-8">
                <div className="w-14 h-14 bg-violet-500/20 text-violet-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mic2 className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg mb-2">Verified Artists</h3>
                <p className="text-gray-500 text-sm">Every profile is reviewed for quality and professionalism.</p>
              </div>
              <div className="bg-[#120A20] p-6 text-center border border-white/5 rounded-3xl">
                <div className="w-14 h-14 bg-fuchsia-500/20 text-fuchsia-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg mb-2">Secure Booking</h3>
                <p className="text-gray-500 text-sm">Protected payments and clear contract terms.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM & SOLUTION */}
      <section className="py-24">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Why We Built This</h2>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto">The traditional booking process is broken. Here is how we fix it.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The Problem */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Clock className="w-32 h-32 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-red-400 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                The Old Way
              </h3>
              <ul className="space-y-4 relative z-10">
                {[
                  "No clear pricing or availability",
                  "Days waiting for email replies",
                  "Scattered communication across apps",
                  "Unreliable or unverified talent",
                  "Manual invoicing and payment risks"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <XCircle className="w-5 h-5 text-red-500/50 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* The Solution */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <CheckCircle2 className="w-32 h-32 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-400 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                Book Your Artist
              </h3>
              <ul className="space-y-4 relative z-10">
                {[
                  "Transparent rates & live calendars",
                  "Instant booking requests",
                  "Built-in direct messaging",
                  "Curated, high-quality artist roster",
                  "Secure, automated payment processing"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 bg-[#120A20]">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Platform Features</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">Everything you need to source, communicate, and pay talent in one place.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Search className="w-6 h-6" />,
                title: "Smart Discovery",
                description: "Filter artists by category, location, and hourly rate to find the perfect match."
              },
              {
                icon: <Calendar className="w-6 h-6" />,
                title: "Live Availability",
                description: "View artist calendars in real-time. No more double-booking accidents."
              },
              {
                icon: <MessageSquare className="w-6 h-6" />,
                title: "Direct Messaging",
                description: "Discuss setlists, logistics, and requirements directly through the platform."
              },
              {
                icon: <CreditCard className="w-6 h-6" />,
                title: "Secure Payments",
                description: "Powered by Stripe. Hold deposits securely until the performance is confirmed."
              },
              {
                icon: <Star className="w-6 h-6" />,
                title: "Reviews & Ratings",
                description: "Read verified reviews from past clients to book with total confidence."
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Instant Management",
                description: "Artists can manage requests, update profiles, and handle invoices effortlessly."
              }
            ].map((feature, idx) => (
              <div key={idx} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-violet-500 group-hover:text-white transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400">Four simple steps to your next great event.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: "01", title: "Browse", desc: "Search our curated database of professional artists." },
              { num: "02", title: "Review", desc: "Check profiles, past performances, and pricing." },
              { num: "03", title: "Request", desc: "Select a date and send a booking request." },
              { num: "04", title: "Confirm", desc: "Artist approves, you pay securely, event is set!" }
            ].map((step, idx) => (
              <div key={idx} className="relative">
                {idx !== 3 && <div className="hidden md:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-violet-500/50 to-transparent" />}
                <div className="bg-[#120A20] border border-white/10 rounded-3xl p-8 relative z-10 hover:border-violet-500/50 transition-colors">
                  <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-transparent mb-6">
                    {step.num}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROJECT CONTEXT / TEAM */}
      <section className="py-24 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block p-1 px-3 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
            Academic Project
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">About The Project</h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-12">
            &quot;Book Your Artist&quot; was developed as a Final Year University Project. It demonstrates the implementation of modern web technologies including Next.js, React, Firebase Authentication, Firestore databases, and Stripe payment integrations to solve a real-world gig economy problem.
          </p>

          <div className="inline-flex items-center gap-4 bg-[#120A20] p-4 pr-6 rounded-full border border-white/10 hover:border-violet-500/50 transition-colors">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-white shadow-inner">
              SD
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-400">Developed by</p>
              <p className="font-bold text-white">Senethu Peiris</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-violet-600/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-violet-600/20 to-fuchsia-600/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-8">Ready to elevate your next event?</h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Join the community of artists and event organizers making live music booking effortless.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/search" className="px-8 py-4 bg-white text-gray-950 font-bold rounded-full hover:bg-gray-200 transition-all hover:scale-105 shadow-[0_0_30px_-5px_rgba(255,255,255,0.4)] flex items-center justify-center gap-2">
              <Search className="w-5 h-5" /> Browse Artists
            </Link>
            <Link href="/auth/register" className="px-8 py-4 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center gap-2">
              Create an Account <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#0A0512] py-12">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center font-black shadow-inner">
                <Music className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-400">Book Your Artist &copy; {new Date().getFullYear()}</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="mailto:contact@bookyourartist.com" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
