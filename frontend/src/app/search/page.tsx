'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getAllArtistsFromFirestore, seedSampleArtists, INTERNATIONAL_ARTISTS } from '@/lib/firebaseBookingAPI';
import { API_BASE_URL } from '@/lib/api';
import { FirebaseArtistCard } from '@/components/FirebaseArtistCard';
import { ArrowLeft, Search, Music2, MapPin, Tag, Mic2, Globe, Home, Sparkles } from 'lucide-react';

interface CategoryOption {
  id: string;
  name: string;
  icon: React.ReactNode | string;
  color: string;
  borderColor: string;
  genres: string[];
  subtitle?: string;
}

interface ArtistSearchItem {
  id?: string;
  _id?: string;
  name?: string;
  stageName?: string;
  category?: string;
  artistType?: string;
  location?: string;
  genres?: string[];
  hourlyRate?: number;
  rating?: number;
  profileImage?: string;
  availability?: boolean | string;
  user?: {
    _id?: string;
    name?: string;
    profileImage?: string;
  };
}

interface ArtistSearchResponse {
  success?: boolean;
  message?: string;
  artists?: ArtistSearchItem[];
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
  {
    id: 'rappers',
    name: 'Rappers',
    icon: <Mic2 className="w-5 h-5 text-rose-400" />,
    color: 'from-rose-500/20 to-red-500/20',
    borderColor: 'border-rose-500/30 hover:border-rose-400/60',
    genres: ['Rapper', 'Rap', 'Hip-hop', 'Trap', 'Hip Hop'],
    subtitle: 'Hip-hop, Rap, Trap',
  },
];

function SearchArtistsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams?.get('category') || '';
  const initialQuery = searchParams?.get('q') || '';
  const [allArtists, setAllArtists] = useState<ArtistSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [activeTab, setActiveTab] = useState<'local' | 'international'>('local');

  const normalizeBackendArtist = (artist: ArtistSearchItem): ArtistSearchItem => ({
    id: artist?.user?._id || artist?._id,
    _id: artist?.user?._id || artist?._id,
    name: artist?.name || artist?.user?.name || 'Unknown Artist',
    stageName: artist?.name || artist?.user?.name || 'Unknown Artist',
    category: artist?.category || artist?.artistType || 'Musician',
    location: artist?.location || '',
    genres: Array.isArray(artist?.genres) ? artist.genres : [],
    hourlyRate: artist?.hourlyRate || 0,
    rating: typeof artist?.rating === 'number' ? artist.rating : 0,
    profileImage: artist?.profileImage || artist?.user?.profileImage || '',
    availability: true,
  });

  useEffect(() => {
    const fetchArtists = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: '100',
          sort: '-createdAt',
        });
        const [backendResponse, firestoreArtists] = await Promise.all([
          fetch(`${API_BASE_URL}/api/artists/search?${params.toString()}`),
          getAllArtistsFromFirestore(),
        ]);

        const backendData = (await backendResponse.json()) as ArtistSearchResponse;
        if (!backendResponse.ok || !backendData?.success) {
          throw new Error(backendData?.message || 'Failed to load artists');
        }

        let sampleArtists = firestoreArtists;
        if (sampleArtists.length === 0) {
          await seedSampleArtists();
          sampleArtists = await getAllArtistsFromFirestore();
        }

        const backendArtists = Array.isArray(backendData.artists)
          ? backendData.artists.map(normalizeBackendArtist)
          : [];

        const sampleArtistIds = new Set((sampleArtists as ArtistSearchItem[]).map((artist) => artist.id || artist._id));
        const newBackendArtists = backendArtists.filter((artist) => !sampleArtistIds.has(artist.id || artist._id));
        setAllArtists([...(sampleArtists as ArtistSearchItem[]), ...newBackendArtists]);
      } catch (err) {
        console.error('Failed to load artists:', err);
        const fallbackArtists = await getAllArtistsFromFirestore();
        setAllArtists(fallbackArtists as ArtistSearchItem[]);
        setError(fallbackArtists.length ? '' : 'Failed to load local artists. Please try again.');
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
          const artistCategory = (artist.category || '').toLowerCase();
          const artistGenres = (artist.genres || []).map((g: string) => g.toLowerCase());
          const categoryMatch = cat.name.toLowerCase().includes(artistCategory) || artistCategory.includes(cat.name.toLowerCase());
          const genreMatch = cat.genres.some((catGenre) =>
            artistGenres.some((ag: string) => ag.includes(catGenre.toLowerCase()) || catGenre.toLowerCase().includes(ag))
          );
          matchesCategory = categoryMatch || genreMatch;
        }
      }

      return matchesSearch && matchesCategory;
    });
  }, [allArtists, searchQuery, selectedCategory, activeTab]);

  return (
    <div className="min-h-screen bg-[#07040f] text-white pb-20 relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-64 -left-24 h-80 w-80 rounded-full bg-fuchsia-600/10 blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-gray-950/70 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <Link href="/home/client" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-600/25 group-hover:scale-105 transition-transform">
              <ArrowLeft className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-violet-300 font-bold">Back to Home</p>
              <p className="text-sm text-gray-400 hidden sm:block">Return to your client dashboard</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" />
            <span>Find verified talent for your next event</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* Hero Section with Search and Segmented Toggle */}
        <div className="relative mb-12 px-0 sm:px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/30 via-purple-950/0 to-transparent blur-2xl -z-10" />
          
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-violet-200 shadow-lg shadow-violet-900/20">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" />
              Search Musician
            </div>
            <h1 className="text-[clamp(1.55rem,5vw,3.75rem)] whitespace-nowrap font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-fuchsia-300 tracking-tight drop-shadow-sm">
              Find the Sound for Your Moment
            </h1>
            <p className="text-gray-400 text-base md:text-lg max-w-3xl mx-auto font-medium leading-relaxed">
              Search singers, DJs, bands, and rappers with a stage-ready booking experience built around your event.
            </p>
          </div>

          <div className="max-w-5xl mx-auto backdrop-blur-xl bg-white/[0.06] p-3 sm:p-4 rounded-[2rem] border border-white/10 shadow-2xl shadow-violet-950/40 ring-1 ring-white/5">
            {/* Global Search Bar */}
            <div className="relative group mb-4">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-fuchsia-300 transition-colors duration-300" />
              </div>
              <input
                type="text"
                className="block w-full pl-14 pr-12 py-4 rounded-3xl bg-gray-950/70 border border-white/10 placeholder-gray-500 text-white focus:ring-2 focus:ring-fuchsia-500/40 focus:border-fuchsia-400/60 transition-all duration-300 text-base md:text-lg shadow-inner shadow-black/40"
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
              <div className="inline-flex bg-gray-950/80 p-1.5 rounded-full border border-white/10 shadow-inner shadow-black/50">
                <button
                  onClick={() => setActiveTab('local')}
                  className={`flex items-center justify-center gap-2.5 px-5 sm:px-8 py-2.5 rounded-full font-semibold transition-all duration-300 ease-out ${
                    activeTab === 'local' 
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/30' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>Local <span className="hidden sm:inline">(Sri Lanka)</span></span>
                </button>
                <button
                  onClick={() => setActiveTab('international')}
                  className={`flex items-center justify-center gap-2.5 px-5 sm:px-8 py-2.5 rounded-full font-semibold transition-all duration-300 ease-out ${
                    activeTab === 'international' 
                      ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-600/25' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>International</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10 max-w-5xl mx-auto relative z-10">
          {ARTIST_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`flex flex-col items-center justify-center p-5 rounded-3xl border transition-all duration-300 transform-gpu backdrop-blur-sm relative overflow-hidden group ${
                selectedCategory === category.id
                  ? `bg-gradient-to-r ${category.color} ${category.borderColor} shadow-xl shadow-violet-500/25 scale-105 z-20 outline-none ring-2 ring-violet-500/50`
                  : 'bg-white/[0.045] border-white/10 hover:bg-white/[0.08] hover:-translate-y-1 hover:shadow-lg hover:shadow-black/50'
              }`}
            >
              <div className="absolute inset-x-0 -top-16 mx-auto h-24 w-24 rounded-full bg-white/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-3 w-full justify-center">
                {typeof category.icon === 'string' ? (
                  <span className="text-xl">{category.icon}</span>
                ) : (
                  <div className="flex items-center justify-center p-1">{category.icon}</div>
                )}
                <span className="font-bold text-lg tracking-wide">{category.name}</span>
              </div>
              {category.subtitle && (
                <span className="text-xs text-gray-400 mt-2 font-medium bg-black/40 px-2.5 py-1 rounded-full">{category.subtitle}</span>
              )}
            </button>
          ))}
        </div>

        {/* Action Header Before Results */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-7 p-4 border border-white/10 bg-white/[0.04] rounded-3xl gap-4 mt-6 shadow-xl shadow-black/20">
          <div>
            <h2 className="text-2xl font-bold text-white/90 tracking-tight flex items-center gap-3">
              <Tag className="w-4 h-4 text-violet-400" />
              {activeTab === 'local' ? 'Local Artists' : 'International Artists'}
            </h2>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-fuchsia-400" />
              Filter by name, style, category, or location
            </p>
          </div>
          <div className="flex items-center text-sm font-semibold px-5 py-2.5 bg-gray-950/80 rounded-full border border-white/10 text-violet-300 shadow-inner">
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
          <div className="bg-red-500/15 border border-red-500/30 text-red-200 text-center p-6 rounded-3xl mb-8">
            {error}
          </div>
        ) : filteredArtists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {filteredArtists.map(artist => (
              <FirebaseArtistCard key={artist.id} artist={artist} compact />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-6 bg-gradient-to-b from-gray-900/50 to-gray-950/20 border border-gray-800/80 shadow-inner rounded-3xl backdrop-blur-md">
            <div className="mb-6 p-6 bg-gray-900/80 rounded-full shadow-2xl border border-white/5 relative">
              <div className="absolute inset-0 bg-violet-600/20 rounded-full blur-xl -z-10" />
              <Music2 className="h-10 w-10 text-violet-400 opacity-60" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">No artists found</h3>
            <p className="text-gray-400 max-w-lg text-center mb-8 text-lg font-medium leading-relaxed">
              We couldn&apos;t find anyone matching <span className="text-white">&quot;{searchQuery}&quot;</span> {selectedCategory && `in ${ARTIST_CATEGORIES.find(c=>c.id===selectedCategory)?.name}`}. Try adjusting your search keywords or clearing some filters!
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
