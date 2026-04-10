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
    <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl overflow-hidden hover:border-yellow-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-600/10 flex flex-col h-full">
      {/* Image Area */}
      <div className="relative h-48 sm:h-56 w-full overflow-hidden">
         <div 
           className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
           style={{ backgroundImage: `url(${profileImage})` }}
         />
         <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent opacity-80" />
         
         {/* Category Badge */}
         <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-yellow-500 shadow-sm">
           {artist.category || 'Artist'}
         </div>
         
         {/* Price Tag */}
         <div className="absolute top-4 right-4 bg-yellow-600 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg">
           ${hourlyRate}/hr
         </div>
      </div>

      {/* Content Area */}
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">
          {artist.stageName || artist.name || 'Unknown Artist'}
        </h3>
        
        <div className="flex flex-col gap-2 mb-4">
          {/* Rating */}
          <div className="flex items-center gap-1.5 text-sm font-bold text-yellow-400">
            <Star size={14} fill="currentColor" /> 
            <span>{rating} {rating !== 'New' && <span className="text-gray-500 font-normal">/ 5.0</span>}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <MapPin size={14} className="text-red-400" />
            <span className="line-clamp-1">{artist.location || 'Location upon request'}</span>
          </div>

          {/* Availability */}
          <div className="flex items-center gap-1.5 text-sm">
            <Clock size={14} className={artist.availability === 'false' ? 'text-red-400' : 'text-green-400'} />
            <span className={artist.availability === 'false' ? 'text-red-400' : 'text-green-400 font-medium'}>
              {artist.availability === 'false' ? 'Currently Unavailable' : 'Available for Booking'}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gray-800 my-auto mb-4" />

        {/* View Profile Button */}
        <Link 
          href={`/artist/${artist.id || artist._id}`}
          className="w-full flex items-center justify-center py-2.5 bg-gray-700/50 hover:bg-yellow-600 text-white rounded-lg transition-colors font-bold text-sm"
        >
          View Profile & Book
        </Link>
      </div>
    </div>
  );
}
