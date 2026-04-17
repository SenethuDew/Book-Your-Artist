'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts';
  import { getAllArtistsFromFirestore, seedSampleArtists, INTERNATIONAL_ARTISTS } from '@/lib/firebaseBookingAPI';
import { FirebaseArtistCard } from '@/components/FirebaseArtistCard';
import { Search, Music2, MapPin, Tag, Mic2, Globe, Home } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'local' | 'international'>('local');

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
    const sourceArtists = activeTab === 'local' ? allArtists : INTERNATIONAL_ARTISTS;
    return sourceArtists.filter(artist => {
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
  }, [allArtists, searchQuery, selectedCategory, activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white pb-20">
      {/* Header Space */}
      <div className="h-24 bg-gray-900/50 backdrop-blur-md border-b border-white/5" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Hero Section with Search and Segmented Toggle */}
        <div className="relative mb-16 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/20 via-purple-950/0 to-transparent blur-2xl -z-10" />
          
          <div className="text-center space-y-4 mb-10">
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 tracking-tight drop-shadow-sm">
              Discover Exceptional Artists
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
              Find the perfect performer for your next event. Check out our diverse catalog of verified talent.
            </p>
          </div>

          <div className="max-w-4xl mx-auto backdrop-blur-xl bg-gray-900/40 p-4 sm:p-6 rounded-3xl border border-white/5 shadow-2xl shadow-purple-900/20">
            {/* Global Search Bar */}
            <div className="relative group mb-6">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-400 group-focus-within:text-violet-400 transition-colors duration-300" />
              </div>
              <input
                type="text"
                className="block w-full pl-14 pr-12 py-5 rounded-2xl bg-gray-950/50 border border-gray-700/50 placeholder-gray-500 text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all duration-300 text-lg md:text-xl shadow-inner"
                placeholder="Search by artist name, genre, category, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Modern Segmented Toggle */}
            <div className="flex justify-center">
              <div className="inline-flex bg-gray-950/80 p-1.5 rounded-full border border-gray-800/80 shadow-inner">
                <button
                  onClick={() => setActiveTab('local')}
                  className={`flex items-center justify-center gap-2.5 px-6 sm:px-10 py-3 rounded-full font-semibold transition-all duration-300 ease-out ${
                    activeTab === 'local' 
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/25' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span>Local <span className="hidden sm:inline">(Sri Lanka)</span></span>
                </button>
                <button
                  onClick={() => setActiveTab('international')}
                  className={`flex items-center justify-center gap-2.5 px-6 sm:px-10 py-3 rounded-full font-semibold transition-all duration-300 ease-out ${
                    activeTab === 'international' 
                      ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-600/25' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Globe className="w-5 h-5" />
                  <span>International</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto relative z-10">
          {ARTIST_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 transform-gpu ${
                selectedCategory === category.id
                  ? `bg-gradient-to-r ${category.color} ${category.borderColor} shadow-xl shadow-violet-500/20 scale-105 z-20 outline-none ring-2 ring-violet-500/50`
                  : 'bg-gray-900/60 border-gray-800/80 hover:bg-gray-800/90 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/50'
              } backdrop-blur-sm`}
            >
              <div className={`p-3 rounded-xl transition-colors duration-300 ${
                selectedCategory === category.id ? 'bg-white/10' : 'bg-gray-800'
              }`}>
                <span className="text-3xl">{category.icon}</span>
              </div>
              <div className="text-left">
                <div className={`text-lg font-bold ${
                  selectedCategory === category.id ? 'text-white' : 'text-gray-300'
                }`}>{category.name}</div>
                <div className="text-sm font-medium text-gray-500 line-clamp-1 mt-0.5">
                  {category.genres.slice(0, 3).join(', ')}...
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Action Header Before Results */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-6 border-b border-white/10 gap-4 mt-8">
          <h2 className="text-2xl font-bold text-white/90 tracking-tight flex items-center gap-3">
            <Tag className="w-5 h-5 text-violet-400" />
            {activeTab === 'local' ? 'Local Artists' : 'International Artists'}
          </h2>
          <div className="flex items-center text-sm font-semibold px-5 py-2.5 bg-gray-900/80 rounded-full border border-gray-700/80 text-violet-300 shadow-inner">
            <span className="bg-violet-500/20 text-violet-400 py-0.5 px-2 rounded-md mr-2">{filteredArtists.length}</span>
            {filteredArtists.length === 1 ? 'Artist' : 'Artists'} Found
          </div>
        </div>

        {/* Results Section */}
        {loading && activeTab === 'local' ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Searching for magic...</p>
          </div>
        ) : error && activeTab === 'local' ? (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-center p-6 rounded-xl mb-8">
            {error}
          </div>
        ) : filteredArtists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredArtists.map(artist => (
              <FirebaseArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-6 bg-gradient-to-b from-gray-900/50 to-gray-950/20 border border-gray-800/80 shadow-inner rounded-3xl backdrop-blur-md">
            <div className="mb-6 p-6 bg-gray-900/80 rounded-full shadow-2xl border border-white/5 relative">
              <div className="absolute inset-0 bg-violet-600/20 rounded-full blur-xl -z-10" />
              <Music2 className="h-12 w-12 text-violet-400 opacity-60" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">No artists found</h3>
            <p className="text-gray-400 max-w-lg text-center mb-8 text-lg font-medium leading-relaxed">
              We couldn't find anyone matching <span className="text-white">"{searchQuery}"</span> {selectedCategory && `in ${ARTIST_CATEGORIES.find(c=>c.id===selectedCategory)?.name}`}. Try adjusting your search keywords or clearing some filters!
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
              }}
              className="px-8 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-full text-white font-bold transition-all duration-300 shadow-lg shadow-violet-600/30 hover:scale-105 active:scale-95"
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
