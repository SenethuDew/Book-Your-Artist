'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getArtistFromFirestore } from '@/lib/firebaseBookingAPI';
import { FirebaseBookingForm } from '@/components/FirebaseBookingForm';
import { useAuth } from '@/contexts';
import { MapPin, Star, Clock, Globe, Mic2, Tag, Calendar, Music2, Share2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ArtistProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    async function loadArtist() {
      if (!id) return;
      try {
        const data = await getArtistFromFirestore(id);
        setArtist(data);
      } catch (error) {
        console.error("Error loading artist:", error);
      } finally {
        setLoading(false);
      }
    }
    loadArtist();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 ml-4 font-medium animate-pulse">Loading Spotlight...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl text-white font-bold mb-4">Artist Not Found</h1>
        <p className="text-gray-400 mb-8 text-lg">This stage is empty. The artist you're looking for doesn't exist.</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-white font-bold transition-colors">
          Return Home
        </button>
      </div>
    );
  }

  const profileImage = artist.profileImage || 
    (artist.category === 'DJ' 
     ? 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop'
     : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop');
  const coverImage = artist.coverImage || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&h=400&fit=crop';

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <div 
        className="w-full h-64 md:h-80 lg:h-96 bg-cover bg-center relative"
        style={{ backgroundImage: `url()` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
        
        <button onClick={() => router.back()} className="absolute top-6 left-6 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors z-10 shadow-lg">
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          
          <div className="flex-shrink-0 w-32 h-32 md:w-48 md:h-48 rounded-xl overflow-hidden border-4 border-gray-900 shadow-xl bg-gray-700">
            <img src={profileImage} alt={artist.stageName || artist.name} className="w-full h-full object-cover" />
          </div>

           <div className="flex-1 pt-2 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{artist.stageName || artist.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 font-medium">
                  {artist.category && (
                    <span className="flex items-center gap-1.5 bg-gray-700/50 px-3 py-1 rounded-full"><Mic2 size={16} className="text-yellow-500" /> {artist.category}</span>
                  )}
                  {artist.location && (
                    <span className="flex items-center gap-1.5 bg-gray-700/50 px-3 py-1 rounded-full"><MapPin size={16} className="text-red-400" /> {artist.location}</span>
                  )}
                  {artist.rating !== undefined && (
                    <span className="flex items-center gap-1 bg-yellow-900/30 text-yellow-500 font-bold px-3 py-1 rounded-full border border-yellow-500/20 shadow-inner">
                      <Star size={16} fill="currentColor" /> {artist.rating.toFixed(1)} / 5.0
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-stretch md:items-end w-full md:w-auto">
                <div className="text-2xl font-bold text-yellow-500 mb-3 flex items-baseline">
                   <span className="text-sm text-gray-400 ml-1">/ hr</span>
                </div>
                <button 
                  onClick={() => setShowBookingForm(true)}
                  className="w-full md:w-auto px-8 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-bold shadow-lg shadow-yellow-600/30 transition-all hover:-translate-y-1"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          
           <div className="lg:col-span-2 space-y-8">
            <section className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Music2 className="text-yellow-500" /> Biography
              </h2>
              <p className="text-gray-300 leading-relaxed max-w-prose whitespace-pre-wrap">
                {artist.biography || "No biography provided yet. But this artist's talent speaks for itself!"}
              </p>
            </section>
            
            <section className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Tag className="text-purple-400" /> Genres
              </h2>
              <div className="flex flex-wrap gap-2">
                {artist.genres && artist.genres.length > 0 ? (
                  artist.genres.map((g: string, i: number) => (
                    <span key={i} className="px-4 py-2 bg-gray-900 border border-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:border-purple-500/50 transition-colors">
                      {g}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 italic">Not specified</span>
                )}
              </div>
            </section> \
          </div>

          <div className="space-y-8">
            <section className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-lg font-bold text-white mb-4">Availability</h2>
              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-xl mb-4 border border-gray-800">
                <div className="flex items-center gap-3">
                  <Calendar className="text-blue-400" />
                  <span className="text-gray-300 font-medium">Status</span>
                </div>
                <span className={"px-3 py-1 rounded-full text-xs font-bold "}>
                  {artist.availability === 'false' || artist.availability === false ? 'Unavailable' : 'Available to Book'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-800">
                <div className="flex items-center gap-3">
                  <Clock className="text-blue-400" />
                  <span className="text-gray-300 font-medium">Experience</span>
                </div>
                <span className="text-white font-bold">{artist.experience || '1+ Years'}</span>
              </div>
            </section>
            
            {artist.socialLinks && Object.values(artist.socialLinks).some(Boolean) && (
              <section className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Share2 className="text-pink-400" /> Connect
                </h2>
                <div className="flex flex-col gap-3">
                  {artist.socialLinks.instagram && (
                    <a href={artist.socialLinks.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors bg-gray-900 p-3 rounded-xl border border-gray-800 hover:border-gray-600">
                      <Globe size={18} /> Instagram
                    </a>
                  )}
                  {artist.socialLinks.spotify && (
                    <a href={artist.socialLinks.spotify} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors bg-gray-900 p-3 rounded-xl border border-gray-800 hover:border-gray-600">
                      <Music2 size={18} /> Spotify
                    </a>
                  )}
                  {artist.socialLinks.website && (
                    <a href={artist.socialLinks.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors bg-gray-900 p-3 rounded-xl border border-gray-800 hover:border-gray-600">
                      <Globe size={18} /> Website
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
      
      {showBookingForm && (
        <FirebaseBookingForm 
          artistId={artist.id || artist._id || id} 
          artistName={artist.stageName || artist.name} 
          onClose={() => setShowBookingForm(false)} 
          clientId={user?._id || (user as any)?.uid} 
        />
      )}
    </div>
  );
}
