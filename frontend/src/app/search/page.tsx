'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts';
  import { getAllArtistsFromFirestore, seedSampleArtists } from '@/lib/firebaseBookingAPI';
import { FirebaseArtistCard } from '@/components/FirebaseArtistCard';
import { Search, Music2, MapPin, Tag, Mic2 } from 'lucide-react';

interface CategoryOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  borderColor: string;
  genres: string[];
}

const ARTIST_CATEGORIES: CategoryOption[] = [
  {
    id: 'singers',
    name: 'Singers',
    icon: '🎤',
    color: 'from-violet-500/20 to-fuchsia-500/20',
    borderColor: 'border-violet-500/30 hover:border-violet-400/60',
    genres: ['Vocals', 'Singing', 'Singer', 'Soul', 'Jazz', 'Pop', 'R&B'],
  },
  {
    id: 'djs',
    name: 'DJs',
    icon: '🎧',
    color: 'from-cyan-500/20 to-blue-500/20',
    borderColor: 'border-cyan-500/30 hover:border-cyan-400/60',
    genres: ['DJ', 'Electronic', 'House', 'Techno', 'EDM', 'Mixing'],
  },
  {
    id: 'bands',
    name: 'Bands',
    icon: '🎸',
    color: 'from-amber-500/20 to-orange-500/20',
    borderColor: 'border-amber-500/30 hover:border-amber-400/60',
    genres: ['Band', 'Rock', 'Ensemble', 'Group', 'Live Band'],
  },
];

function SearchArtistsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialCategory = searchParams?.get('category') || '';
  const [allArtists, setAllArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  useEffect(() => {
    const fetchArtists = async () => {
      setLoading(true);
      try {
        let data = await getAllArtistsFromFirestore();
        if (data.length === 0) {
          await seedSampleArtists();
          data = await getAllArtistsFromFirestore();
        }
        setAllArtists(data);
      } catch (err) {
        console.error('Failed to load artists:', err);
        setError('Failed to load artists. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, []);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(prev => (prev === categoryId ? '' : categoryId));
  };

  // Real-time Filtering
  const filteredArtists = useMemo(() => {
    return allArtists.filter(artist => {
      let matchesSearch = true;
      let matchesCategory = true;

      // Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const searchString = [
          artist.name || '',
          artist.stageName || '',
          artist.category || '',
          artist.location || '',
          ...(artist.genres || [])
        ].join(' ').toLowerCase();

        matchesSearch = searchString.includes(query);
      }

      // Category Filter
      if (selectedCategory) {
        const cat = ARTIST_CATEGORIES.find(c => c.id === selectedCategory);
        if (cat) {
          const artistGenres = (artist.genres || []).map((g: string) => g.toLowerCase());
          matchesCategory = cat.genres.some((catGenre) =>
            artistGenres.some((ag: string) => ag.includes(catGenre.toLowerCase()) || catGenre.toLowerCase().includes(ag))
          );
        }
      }

      return matchesSearch && matchesCategory;
    });
  }, [allArtists, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white pb-20">
      {/* Header Space */}
      <div className="h-24 bg-gray-900/50 backdrop-blur-md border-b border-white/5" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Title */}
        <div className="mb-10 text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
            Discover Exceptional Artists
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Find the perfect performer for your next event. Check out our diverse catalog of verified talent.
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-500 group-focus-within:text-violet-400 transition-colors duration-300" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-900/60 border border-gray-700 placeholder-gray-500 text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 shadow-2xl backdrop-blur-md transition-all duration-300 text-lg"
              placeholder="Search by artist name, genre, category, or location (e.g. 'DJ', 'Jazz', 'London')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 max-w-4xl mx-auto">
          {ARTIST_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
                selectedCategory === category.id
                  ? `bg-gradient-to-r ${category.color} ${category.borderColor} shadow-lg shadow-violet-500/20 scale-[1.02]`
                  : 'bg-gray-900/40 border-gray-800 hover:bg-gray-800/80 hover:scale-[1.01]'
              }`}
            >
              <span className="text-2xl">{category.icon}</span>
              <div className="text-left">
                <div className="font-semibold text-white">{category.name}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Results Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Searching for magic...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-center p-6 rounded-xl mb-8">
            {error}
          </div>
        ) : filteredArtists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredArtists.map(artist => (
              <FirebaseArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-900/30 border border-gray-800 rounded-2xl backdrop-blur-sm">
            <div className="mb-6 p-4 bg-gray-800/50 rounded-full">
              <Music2 className="h-12 w-12 text-violet-400 opacity-50" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No artists found</h3>
            <p className="text-gray-400 max-w-md text-center mb-6">
              We couldn't find anyone matching "{searchQuery}" {selectedCategory && `in ${ARTIST_CATEGORIES.find(c=>c.id===selectedCategory)?.name}`}. Try adjusting your search keywords or clearing some filters!
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
              }}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-white font-semibold transition-colors shadow-lg shadow-violet-600/30"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchArtists() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>}>
      <SearchArtistsContent />
    </Suspense>
  );
}