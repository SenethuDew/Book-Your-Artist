"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { db, storage } from "@/lib/firebaseService";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  MapPin, Edit2, ArrowLeft, Loader2, Image as ImageIcon, Check, DollarSign, Briefcase, Plus, X, ListMusic, Globe, User, Hash
} from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

function EditProfileView() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    category: "",
    artistType: "",
    price: 0,
    experience: 0,
    location: "",
    genres: [] as string[],
    profileImage: "",
    coverImage: "",
    socialLinks: {
      instagram: "",
      spotify: "",
      youtube: ""
    }
  });

  const [newGenre, setNewGenre] = useState("");
  const [uploadingImage, setUploadingImage] = useState<"profile" | "cover" | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;
      try {
        const docRef = doc(db, "artists", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            name: data.name || user.name || "",
            bio: data.bio || "",
            category: data.category || "",
            artistType: data.artistType || "",
            price: data.price || 0,
            experience: data.experience || 0,
            location: data.location || "",
            genres: data.genres || [],
            profileImage: data.profileImage || user.profileImage || "",
            coverImage: data.coverImage || "",
            socialLinks: {
              instagram: data.socialLinks?.instagram || "",
              spotify: data.socialLinks?.spotify || "",
              youtube: data.socialLinks?.youtube || ""
            }
          });
        } else {
           // fallback to basic user auth
           setFormData(f => ({ ...f, name: user.name || "", profileImage: user.profileImage || "" }));
        }
      } catch (err) {
        console.error("Error fetching form data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "cover") => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    setUploadingImage(type);
    const storageRef = ref(storage, `artists/${user.uid}/${type}-${Date.now()}`);
    
    try {
       await uploadBytes(storageRef, file);
       const url = await getDownloadURL(storageRef);
       
       if (type === "profile") {
         setFormData(prev => ({ ...prev, profileImage: url }));
       } else {
         setFormData(prev => ({ ...prev, coverImage: url }));
       }
       toast.success("Image uploaded!");
    } catch (err) {
       console.error(err);
       toast.error("Upload failed");
    } finally {
       setUploadingImage(null);
    }
  };

  const addGenre = () => {
    if (newGenre.trim() && !formData.genres.includes(newGenre.trim())) {
      setFormData(prev => ({ ...prev, genres: [...prev.genres, newGenre.trim()] }));
      setNewGenre("");
    }
  };

  const removeGenre = (genre: string) => {
    setFormData(prev => ({ ...prev, genres: prev.genres.filter(g => g !== genre) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setSaving(true);
    try {
      const docRef = doc(db, "artists", user.uid);
      await setDoc(docRef, {
         ...formData,
         uid: user.uid,
         updatedAt: new Date().toISOString()
      }, { merge: true });

      toast.success("Profile updated successfully!");
      setTimeout(() => router.push("/artist/profile"), 1500);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Loading Workspace</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20 selection:bg-violet-500/30 pt-8">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1E112A', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}} />
      
      <div className="max-w-[75rem] mx-auto px-4 lg:px-8">
        {/* Header Navigation */}
        <div className="flex items-center gap-4 mb-10">
          <Link href="/artist/profile" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Edit Profile</h1>
            <p className="text-gray-400 text-sm font-medium">Update your public representation and rates.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
             
             {/* Images Settings */}
             <section className="bg-[#1E112A]/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8">
               <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-violet-400" /> Visual Identity</h2>
               
               <div className="space-y-6">
                 {/* Cover Image Upload */}
                 <div>
                   <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2">Cover Image</label>
                   <div className="relative w-full h-40 bg-white/5 rounded-2xl border-2 border-dashed border-white/10 overflow-hidden group">
                     {formData.coverImage && (
                       <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover opacity-60 group-hover:opacity-30 transition-opacity" />
                     )}
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       {uploadingImage === "cover" ? <Loader2 className="w-8 h-8 animate-spin text-fuchsia-400" /> : <Plus className="w-8 h-8 text-gray-500 mb-2 group-hover:text-white transition-colors" />}
                       <span className="text-sm font-bold text-gray-400 group-hover:text-white">Upload Wide Cover Art</span>
                     </div>
                     <input type="file" disabled={uploadingImage === "cover"} onChange={(e) => handleImageUpload(e, "cover")} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                   </div>
                 </div>

                 {/* Profile Avatar Upload */}
                 <div>
                   <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2">Profile Avatar</label>
                   <div className="flex items-center gap-6">
                     <div className="relative w-24 h-24 rounded-full bg-white/5 border-2 border-white/10 overflow-hidden shrink-0 group">
                       {formData.profileImage ? (
                         <img src={formData.profileImage} alt="Avatar" className="w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity" />
                       ) : (
                         <User className="w-8 h-8 m-auto mt-7 text-gray-600" />
                       )}
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         {uploadingImage === "profile" ? <Loader2 className="w-6 h-6 animate-spin text-fuchsia-400" /> : <Edit2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />}
                       </div>
                       <input type="file" disabled={uploadingImage === "profile"} onChange={(e) => handleImageUpload(e, "profile")} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                     </div>
                     <p className="text-xs text-gray-500 font-medium max-w-xs">Upload a high-quality square headshot or emblem to represent your act.</p>
                   </div>
                 </div>
               </div>
             </section>

             {/* Artist Bio & Fundamentals */}
             <section className="bg-[#1E112A]/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 space-y-6">
               <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><User className="w-5 h-5 text-emerald-400" /> Fundamentals</h2>
               
               <div className="grid sm:grid-cols-2 gap-6">
                 <div>
                   <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2 flex items-center gap-2"><User className="w-4 h-4"/> Stage Name</label>
                   <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium" placeholder="E.g. The Weeknd" />
                 </div>
                 <div>
                   <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2 flex items-center gap-2"><MapPin className="w-4 h-4"/> Base Location</label>
                   <input required type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium" placeholder="E.g. London, UK" />
                 </div>
               </div>

               <div>
                 <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2">Biography</label>
                 <textarea required rows={5} value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium resize-none custom-scrollbar" placeholder="Tell your story. What makes your performances unique?" />
               </div>

               <div className="grid sm:grid-cols-2 gap-6">
                 <div>
                   <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2 flex items-center gap-2"><Hash className="w-4 h-4"/> Category</label>
                   <select required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium">
                     <option value="">Select Category</option>
                     <option value="Singer">Singer</option>
                     <option value="DJ">DJ</option>
                     <option value="Band">Band</option>
                     <option value="Rapper">Rapper</option>
                     <option value="Musician">Musician</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2 flex items-center gap-2"><Globe className="w-4 h-4"/> Act Type</label>
                   <select required value={formData.artistType} onChange={e => setFormData({ ...formData, artistType: e.target.value })} className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium">
                     <option value="">Select Type</option>
                     <option value="Local">Local Scene</option>
                     <option value="National">National Touring</option>
                     <option value="International">International</option>
                   </select>
                 </div>
               </div>
             </section>
          </div>

          <div className="space-y-6">
             {/* Pricing & Booking */}
             <section className="bg-gradient-to-b from-[#1E112A]/60 to-[#1E112A]/10 border border-white/10 backdrop-blur-xl rounded-3xl p-6">
               <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><DollarSign className="w-5 h-5 text-amber-400" /> Booking Details</h2>
               
               <div className="space-y-5">
                 <div>
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Hourly Rate (USD)</label>
                   <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                     <input required type="number" min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full bg-black/40 border border-white/5 rounded-xl pl-9 pr-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-all font-black text-xl" />
                   </div>
                 </div>

                 <div>
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Experience (Years)</label>
                   <input required type="number" min="0" value={formData.experience} onChange={e => setFormData({ ...formData, experience: Number(e.target.value) })} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-all font-bold" />
                 </div>
               </div>
             </section>

             {/* Genres */}
             <section className="bg-gradient-to-b from-[#1E112A]/60 to-[#1E112A]/10 border border-white/10 backdrop-blur-xl rounded-3xl p-6">
               <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><ListMusic className="w-5 h-5 text-fuchsia-400" /> Genres</h2>
               
               <div className="flex gap-2 mb-4">
                 <input type="text" value={newGenre} onChange={e => setNewGenre(e.target.value)} onKeyDown={(e) => { if(e.key === "Enter"){ e.preventDefault(); addGenre(); } }} placeholder="E.g. House, R&B" className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/50 transition-all font-medium" />
                 <button type="button" onClick={addGenre} className="px-3 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-xl font-bold transition-all"><Plus className="w-4 h-4"/></button>
               </div>
               
               <div className="flex flex-wrap gap-2">
                 {formData.genres.map((g, i) => (
                   <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 text-xs font-bold rounded-lg">
                     {g} <button type="button" onClick={() => removeGenre(g)} className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                   </span>
                 ))}
                 {formData.genres.length === 0 && <span className="text-xs text-gray-500">No genres added.</span>}
               </div>
             </section>

             {/* Social Links */}
             <section className="bg-gradient-to-b from-[#1E112A]/60 to-[#1E112A]/10 border border-white/10 backdrop-blur-xl rounded-3xl p-6">
               <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-cyan-400" /> Social Links</h2>
               
               <div className="space-y-4">
                 <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Instagram URL</label>
                   <input type="url" value={formData.socialLinks.instagram} onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, instagram: e.target.value } })} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all" placeholder="https://instagram.com/..." />
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Spotify URL</label>
                   <input type="url" value={formData.socialLinks.spotify} onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, spotify: e.target.value } })} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all" placeholder="https://open.spotify.com/..." />
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">YouTube URL</label>
                   <input type="url" value={formData.socialLinks.youtube} onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, youtube: e.target.value } })} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all" placeholder="https://youtube.com/..." />
                 </div>
               </div>
             </section>

             {/* Save Button Wrapper */}
             <div className="sticky bottom-6 z-20">
                <button type="submit" disabled={saving || uploadingImage !== null} className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-emerald-500/20 ${saving ? "bg-emerald-600/50 text-emerald-200 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-400 text-gray-950 hover:-translate-y-1 hover:shadow-emerald-400/40"}`}>
                  {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Check className="w-6 h-6" /> Save Profile</>}
                </button>
             </div>
          </div>
        </form>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139, 92, 246, 0.6); }
      `}</style>
    </div>
  );
}

export default function EditProfilePage() {
  return (
    <ProtectedRoute requiredRole="artist">
      <EditProfileView />
    </ProtectedRoute>
  );
}