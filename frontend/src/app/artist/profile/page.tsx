"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { db } from "@/lib/firebaseService";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { 
  MapPin, Edit2, Trash2, ArrowLeft, Star, ExternalLink, Music, Mic2, Disc, PlayCircle, Loader2, AlertTriangle, Check
} from "lucide-react";
import { FaInstagram, FaYoutube } from "react-icons/fa";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

function ArtistProfileView() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (searchParams?.get("delete") === "true") {
      setDeleteModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;
      try {
        const docRef = doc(db, "artists", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          toast("No profile found. Let's create one!", { icon: "👋" });
          router.push("/artist/edit-profile");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, router]);

  const handleDeleteProfile = async () => {
    if (!user?.uid) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "artists", user.uid));
      toast.success("Profile deleted successfully");
      await logout();
      router.push("/");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete profile");
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Loading Profile</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20 selection:bg-violet-500/30">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1E112A', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}} />
      
      {/* Header Image */}
      <div className="relative h-64 md:h-80 lg:h-96 w-full">
        {profile.coverImage ? (
           <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
        ) : (
           <div className="w-full h-full bg-gradient-to-br from-violet-900/40 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
        
        {/* Navigation & Actions */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between z-10 max-w-[90rem] mx-auto">
          <Link href="/home/artist" className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex gap-3">
            <Link href="/artist/edit-profile" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 font-bold text-sm transition-colors shadow-[0_0_15px_rgba(139,92,246,0.4)]">
              <Edit2 className="w-4 h-4" /> Edit Profile
            </Link>
            <button onClick={() => setDeleteModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 font-bold text-sm transition-colors">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-[75rem] mx-auto px-4 lg:px-8 relative -mt-32 z-10">
        
        {/* Avatar & Title Row */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-end mb-10">
          <div className="w-32 h-32 md:w-44 md:h-44 rounded-2xl border-4 border-gray-950 bg-gray-900 shadow-2xl shadow-violet-900/30 overflow-hidden shrink-0">
            {profile.profileImage || user?.profileImage ? (
              <img src={profile.profileImage || user?.profileImage} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-violet-900/50 flex items-center justify-center">
                 <Mic2 className="w-12 h-12 text-violet-300" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">{profile.name || user?.name || "Artist Name"}</h1>
              {profile.artistType && (
                 <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider text-violet-300 w-fit border border-violet-500/20">{profile.artistType}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-gray-400 font-medium">
              {profile.category && <span className="flex items-center gap-1.5"><PlayCircle className="w-4 h-4 text-fuchsia-400" /> {profile.category}</span>}
              {profile.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-400" /> {profile.location}</span>}
              <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400" /> 5.0 (0 Reviews)</span>
            </div>
          </div>
          <div className="shrink-0 flex flex-col md:items-end text-left md:text-right">
             <p className="text-gray-400 uppercase tracking-widest text-[10px] font-bold mb-1">Starting Rate</p>
             <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">${profile.price || 0}<span className="text-lg text-gray-500 font-medium">/hr</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
             {/* Bio Section */}
             <section className="bg-[#1E112A]/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8">
               <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center"><Mic2 className="w-4 h-4 text-violet-400" /></div> About Me</h2>
               <div className="text-gray-300 leading-relaxed whitespace-pre-wrap font-medium">
                 {profile.bio || "No bio provided. Give clients a reason to book you by writing a compelling bio!"}
               </div>
             </section>

             {/* Genres & Experience */}
             <section className="grid sm:grid-cols-2 gap-6">
                <div className="bg-[#1E112A]/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6">
                   <h2 className="text-lg font-bold mb-4 text-gray-200">Musical Genres</h2>
                   {profile.genres && profile.genres.length > 0 ? (
                     <div className="flex flex-wrap gap-2">
                       {profile.genres.map((g: string, i: number) => (
                         <span key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm font-bold text-gray-300">{g}</span>
                       ))}
                     </div>
                   ) : (
                     <p className="text-sm text-gray-500">No genres specified.</p>
                   )}
                </div>
                <div className="bg-[#1E112A]/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6">
                   <h2 className="text-lg font-bold mb-4 text-gray-200">Experience</h2>
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
                       <Disc className="w-6 h-6 text-fuchsia-400" />
                     </div>
                     <div>
                       <p className="text-2xl font-black">{profile.experience || "0"} Years</p>
                       <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Professional</p>
                     </div>
                   </div>
                </div>
             </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
             {/* Social Links */}
             <section className="bg-gradient-to-br from-violet-900/20 to-fuchsia-900/10 border border-violet-500/20 backdrop-blur-xl rounded-3xl p-6">
                <h3 className="text-white font-bold mb-4 tracking-tight">Social & Links</h3>
                <div className="flex flex-col gap-3">
                  {profile.socialLinks?.instagram ? (
                    <a href={profile.socialLinks.instagram} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group">
                      <span className="flex items-center gap-3 text-sm font-bold text-gray-200"><FaInstagram className="w-4 h-4 text-fuchsia-400" /> Instagram</span>
                      <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 opacity-50"><FaInstagram className="w-4 h-4" /> <span className="text-sm font-medium">Not Connected</span></div>
                  )}
                  
                  {profile.socialLinks?.youtube ? (
                    <a href={profile.socialLinks.youtube} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group">
                      <span className="flex items-center gap-3 text-sm font-bold text-gray-200"><FaYoutube className="w-4 h-4 text-red-500" /> YouTube</span>
                      <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 opacity-50"><FaYoutube className="w-4 h-4" /> <span className="text-sm font-medium">Not Connected</span></div>
                  )}

                  {profile.socialLinks?.spotify ? (
                    <a href={profile.socialLinks.spotify} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group">
                      <span className="flex items-center gap-3 text-sm font-bold text-gray-200"><Music className="w-4 h-4 text-emerald-400" /> Spotify</span>
                      <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 opacity-50"><Music className="w-4 h-4" /> <span className="text-sm font-medium">Not Connected</span></div>
                  )}
                </div>
             </section>

             <section className="bg-[#1E112A]/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6">
               <h3 className="text-white font-bold mb-4 tracking-tight">Booking Preferences</h3>
               <ul className="text-sm text-gray-400 space-y-3 font-medium">
                 <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Deposits required</li>
                 <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Custom requests accepted</li>
                 <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Available for travel</li>
               </ul>
             </section>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeleteModalOpen(false)}></div>
          <div className="relative bg-gray-900 border border-red-500/20 w-full max-w-md rounded-3xl p-6 shadow-2xl shadow-red-900/20 animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-center mb-2">Delete Profile?</h2>
            <p className="text-gray-400 text-center text-sm mb-8 font-medium">
              This action is permanent and cannot be undone. Your profile data, images, and preferences will be erased.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeleteModalOpen(false)} 
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteProfile} 
                disabled={isDeleting}
                className="flex-1 flex justify-center items-center py-3 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Delete Profile"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArtistProfilePage() {
  return (
    <ProtectedRoute requiredRole="artist">
      <ArtistProfileView />
    </ProtectedRoute>
  );
}