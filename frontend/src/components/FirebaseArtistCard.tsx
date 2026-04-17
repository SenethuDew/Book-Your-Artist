import React from 'react';
import Link from 'next/link';
import { MapPin, Star, Clock } from 'lucide-react';

interface FirebaseArtistCardProps {
  artist: any;
}

export function FirebaseArtistCard({ artist }: FirebaseArtistCardProps) {
  // Fallbacks for profile image based on category
  const profileImage = artist.profileImage || 
    (artist.category === 'DJ' 
     ? 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop'
     : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop');

  const hourlyRate = artist.hourlyRate || artist.basePrice || 0;
  const rating = artist.rating !== undefined ? artist.rating.toFixed(1) : 'New';

  return (
    <div className="group relative bg-[#1E112A]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden hover:border-[#E8B638]/50 transition-all duration-500 hover:shadow-2xl hover:shadow-[#E8B638]/20 flex flex-col h-full transform hover:-translate-y-2">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Image Area */}
      <div className="relative h-56 sm:h-64 w-full overflow-hidden">
         <div 
           className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
           style={{ backgroundImage: `url(${profileImage})` }}
         />
         <div className="absolute inset-0 bg-gradient-to-t from-[#1E112A] via-[#1E112A]/40 to-transparent opacity-90" />
         
         {/* Category Badge */}
         <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider text-[#E8B638] shadow-lg flex items-center gap-2">
           <span className="w-1.5 h-1.5 rounded-full bg-[#E8B638] animate-pulse"></span>
           {artist.category || 'Artist'}
         </div>
         
         {/* Price Tag */}
         <div className="absolute top-4 right-4 bg-gradient-to-r from-[#E8B638] to-yellow-600 px-4 py-1.5 rounded-full text-xs font-bold text-[#1E112A] shadow-lg flex items-center transform transition-transform group-hover:scale-105">
           <span className="text-sm border-r border-[#1E112A]/20 pr-1.5 mr-1.5">$</span>
           {hourlyRate}
           <span className="text-[10px] font-medium ml-1 opacity-80 uppercase tracking-tighter">/hr</span>
         </div>
      </div>

      {/* Content Area */}
      <div className="p-6 flex flex-col flex-1 relative z-10 -mt-8">
        <h3 className="text-2xl font-bold text-white mb-4 line-clamp-1 drop-shadow-md group-hover:text-[#E8B638] transition-colors">
          {artist.stageName || artist.name || 'Unknown Artist'}
        </h3>
        
        <div className="flex flex-col gap-3 mb-6 bg-white/5 p-4 rounded-xl border border-white/5">
          {/* Rating */}
          <div className="flex items-center gap-2 text-sm font-semibold text-[#E8B638]">
            <div className="bg-[#E8B638]/20 p-1.5 rounded-md">
              <Star size={14} fill="currentColor" /> 
            </div>
            <span>{rating} {rating !== 'New' && <span className="text-white/40 font-normal ml-1">/ 5.0</span>}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <div className="bg-purple-500/20 p-1.5 rounded-md text-purple-400">
              <MapPin size={14} />
            </div>
            <span className="line-clamp-1">{artist.location || 'Location upon request'}</span>
          </div>

          {/* Availability */}
          <div className="flex items-center gap-2 text-sm">
            <div className={`p-1.5 rounded-md ${artist.availability === 'false' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <Clock size={14} />
            </div>
            <span className={artist.availability === 'false' ? 'text-red-400 font-medium' : 'text-emerald-400 font-medium'}>
              {artist.availability === 'false' ? 'Currently Unavailable' : 'Available for Booking'}
            </span>
          </div>
        </div>

        <div className="mt-auto">
          {/* View Profile Button */}
          <Link 
            href={`/artist/${artist.id || artist._id}`}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-[#E8B638] text-white hover:text-[#1E112A] rounded-xl transition-all duration-300 font-bold text-sm tracking-wide group/btn border border-white/10 hover:border-transparent cursor-pointer relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              View Profile
              <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
