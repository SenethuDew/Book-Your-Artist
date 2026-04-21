"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  MessageSquare, Briefcase, CalendarIcon, Wallet, Settings, Bell, Search, LayoutDashboard, Send, Image as ImageIcon
} from "lucide-react";

interface Conversation {
  id: string;
  clientName: string;
  lastMessage: string;
  time: string;
  unread: number;
  online?: boolean;
}

const mockConversations: Conversation[] = [
  { id: "c1", clientName: "Sarah Jenkins", lastMessage: "Can we schedule a call?", time: "10:30 AM", unread: 2, online: true },
  { id: "c2", clientName: "Michael Chen", lastMessage: "The playlist looks perfect! Thanks.", time: "Yesterday", unread: 0 },
  { id: "c3", clientName: "Emily Davis", lastMessage: "Do you provide your own sound system?", time: "Mon", unread: 0, online: true },
];

const mockMessages = [
  { id: 1, sender: "client", text: "Hi! I loved your recent mix on SoundCloud.", time: "10:15 AM" },
  { id: 2, sender: "me", text: "Thank you so much Sarah! I appreciate it.", time: "10:20 AM" },
  { id: 3, sender: "client", text: "I'm looking to book a DJ for my wedding reception next May.", time: "10:25 AM" },
  { id: 4, sender: "client", text: "Can we schedule a call?", time: "10:30 AM" }
];

const NavItem = ({ href, icon: Icon, label, active }: { href: string, icon: any, label: string, active?: boolean }) => (
  <Link href={href} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${active ? "bg-violet-600/20 text-violet-400 font-bold border border-violet-500/30" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
    <Icon className={`w-4 h-4 ${active ? "text-violet-400" : ""}`} />
    <span className="hidden xl:block whitespace-nowrap">{label}</span>
  </Link>
);

export default function MessagesPage() {
  const [activeId, setActiveId] = useState("c1");
  const [msgInput, setMsgInput] = useState("");

  const activeConv = mockConversations.find(c => c.id === activeId);

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white font-sans overflow-hidden selection:bg-violet-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[40vw] h-[40vh] bg-violet-900/10 blur-[150px] mix-blend-screen" />
      </div>

      {/* Navbar Replicated */}
      <nav className="shrink-0 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl z-50">
        <div className="max-w-[90rem] mx-auto px-4 lg:px-8 flex items-center justify-between h-16">
          <Link href="/home/artist" className="flex items-center gap-3 shrink-0 group">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center font-black shadow-lg">♪</div>
             <span className="font-extrabold tracking-tight text-white hidden sm:block">BookYour<span className="text-violet-400">Artist</span></span>
          </Link>
          <div className="flex items-center overflow-x-auto scrollbar-hide py-1 gap-1">
             <NavItem href="/home/artist" icon={LayoutDashboard} label="Dashboard" />
             <NavItem href="/artist/bookings" icon={Briefcase} label="Bookings" />
             <NavItem href="/artist/calendar" icon={CalendarIcon} label="Calendar" />
             <NavItem href="/artist/messages" icon={MessageSquare} label="Messages" active />
             <NavItem href="/artist/earnings" icon={Wallet} label="Earnings" />
             <NavItem href="/artist/profile" icon={Settings} label="Profile" />
          </div>
        </div>
      </nav>

      <main className="flex-1 flex max-w-[90rem] w-full mx-auto p-4 lg:px-8 py-6 gap-6 relative z-10 min-h-0">
        {/* Left Sidebar - Conversations */}
        <div className="w-full md:w-80 lg:w-96 bg-[#1E112A]/40 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col overflow-hidden shrink-0 shadow-xl hidden md:flex">
           <div className="p-5 border-b border-white/10">
              <h2 className="text-xl font-extrabold text-white mb-4">Messages</h2>
              <div className="relative">
                 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                 <input type="text" placeholder="Search conversations..." className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors" />
              </div>
           </div>
           <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
              {mockConversations.map(c => (
                <button key={c.id} onClick={() => setActiveId(c.id)} className={`w-full flex items-start gap-4 p-3 rounded-xl transition-all mb-1 ${activeId === c.id ? 'bg-violet-600/20 border border-violet-500/20' : 'hover:bg-white/5 border border-transparent'}`}>
                   <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center font-bold text-violet-300">
                        {c.clientName.charAt(0)}
                      </div>
                      {c.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-gray-900 rounded-full" />}
                   </div>
                   <div className="flex-1 text-left min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-bold text-white text-sm truncate">{c.clientName}</h4>
                        <span className="text-[10px] text-gray-500 font-medium shrink-0 ml-2">{c.time}</span>
                      </div>
                      <p className={`text-xs truncate ${c.unread > 0 ? 'text-gray-200 font-bold' : 'text-gray-400'}`}>{c.lastMessage}</p>
                   </div>
                   {c.unread > 0 && (
                     <div className="w-5 h-5 bg-fuchsia-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(217,70,239,0.5)] shrink-0">
                        {c.unread}
                     </div>
                   )}
                </button>
              ))}
           </div>
        </div>

        {/* Right Panel - Chat */}
        <div className="flex-1 bg-[#1E112A]/40 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-xl">
           {activeConv ? (
             <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center font-bold text-violet-300">
                         {activeConv.clientName.charAt(0)}
                      </div>
                      <div>
                         <h3 className="font-bold text-white">{activeConv.clientName}</h3>
                         <p className="text-xs text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Online</p>
                      </div>
                   </div>
                   <button className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-colors">
                     View Booking
                   </button>
                </div>
                
                {/* Messages View */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar flex flex-col justify-end">
                   {mockMessages.map(m => {
                     const isMe = m.sender === "me";
                     return (
                       <div key={m.id} className={`flex max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
                         <div className={`p-3.5 rounded-2xl text-sm ${isMe ? 'bg-violet-600 text-white rounded-tr-sm' : 'bg-white/10 border border-white/5 text-gray-200 rounded-tl-sm'}`}>
                           {m.text}
                           <div className={`text-[9px] mt-1.5 ${isMe ? 'text-violet-300 text-right' : 'text-gray-500'}`}>{m.time}</div>
                         </div>
                       </div>
                     );
                   })}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-white/10 bg-black/20">
                   <div className="flex items-center gap-3">
                      <button className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"><ImageIcon className="w-5 h-5" /></button>
                      <input 
                        type="text" 
                        value={msgInput}
                        onChange={e => setMsgInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && setMsgInput("")}
                        placeholder="Type a message..." 
                        className="flex-1 bg-white/5 border border-white/10 focus:border-violet-500 focus:bg-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
                      />
                      <button 
                        onClick={() => setMsgInput("")}
                        className={`p-3 rounded-xl transition-all flex items-center justify-center ${msgInput.trim() ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}
                      >
                        <Send className="w-4 h-4 ml-0.5" />
                      </button>
                   </div>
                </div>
             </>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-bold text-white">No conversation selected</p>
                <p className="text-sm">Choose a chat from the sidebar to continue</p>
             </div>
           )}
        </div>
      </main>
    </div>
  );
}
