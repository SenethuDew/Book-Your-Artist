/**
 * Pure artist catalog – no Firebase dependencies so it can be imported by
 * Next.js API routes (server runtime) and React components alike.
 */

export interface CatalogArtist {
  id: string;
  name: string;
  category: string; // "Singers" | "DJs" | "Bands" | "Rappers"
  genres: string[];
  location: string;
  hourlyRate: number;
  rating: number;
  profileImage: string;
  biography?: string;
  experience?: string;
  origin?: "local" | "international";
  bestFor?: string[];
}

export const LOCAL_ARTISTS: CatalogArtist[] = [
  {
    id: "sample-1",
    name: "Yohani De Silva",
    category: "Singers",
    genres: ["Singer", "Pop", "Rap"],
    location: "Colombo, Sri Lanka",
    hourlyRate: 350,
    rating: 4.9,
    profileImage: "/yohanidesilva.png",
    experience: "5+ Years",
    origin: "local",
    bestFor: ["wedding", "corporate", "festival"],
    biography: "Globally famous through 'Manike Mage Hithe'. Perfect for upbeat receptions.",
  },
  {
    id: "sample-2",
    name: "Umaria Sinhawansa",
    category: "Singers",
    genres: ["Singer", "Soul", "Pop"],
    location: "Colombo, Sri Lanka",
    hourlyRate: 300,
    rating: 5.0,
    profileImage: "/umaria.png",
    experience: "10+ Years",
    origin: "local",
    bestFor: ["wedding", "lounge", "private"],
    biography: "Polished pop/Sinhala fusion vocalist – elegant choice for weddings.",
  },
  {
    id: "sample-3",
    name: "Sanuka Wickramasinghe",
    category: "Singers",
    genres: ["Singer", "Pop", "R&B"],
    location: "Kandy, Sri Lanka",
    hourlyRate: 250,
    rating: 4.8,
    profileImage: "/sanukawik.png",
    experience: "8+ Years",
    origin: "local",
    bestFor: ["lounge", "corporate", "birthday"],
  },
  {
    id: "sample-4",
    name: "Dinesh Gamage",
    category: "Singers",
    genres: ["Singer", "Pop", "Vocals"],
    location: "Galle, Sri Lanka",
    hourlyRate: 200,
    rating: 4.7,
    profileImage: "/dineshgamage.png",
    experience: "6+ Years",
    origin: "local",
    bestFor: ["birthday", "private", "wedding"],
  },
  {
    id: "sample-5",
    name: "DJ Mass",
    category: "DJs",
    genres: ["DJ", "EDM", "House"],
    location: "Colombo, Sri Lanka",
    hourlyRate: 150,
    rating: 4.9,
    profileImage: "/djmass.png",
    experience: "12+ Years",
    origin: "local",
    bestFor: ["wedding", "party", "club"],
  },
  {
    id: "sample-6",
    name: "Iman Cader (DJ)",
    category: "DJs",
    genres: ["DJ", "Electronic", "Techno"],
    location: "Galle, Sri Lanka",
    hourlyRate: 120,
    rating: 4.6,
    profileImage: "/imancarder.png",
    experience: "5+ Years",
    origin: "local",
    bestFor: ["club", "party"],
  },
  {
    id: "sample-7",
    name: "DJ Imalka",
    category: "DJs",
    genres: ["DJ", "Mixing", "EDM"],
    location: "Colombo, Sri Lanka",
    hourlyRate: 100,
    rating: 4.8,
    profileImage: "/djimalka.png",
    experience: "7+ Years",
    origin: "local",
    bestFor: ["wedding", "party", "corporate"],
  },
  {
    id: "sample-8",
    name: "Infinity",
    category: "Bands",
    genres: ["Band", "Pop", "Rock"],
    location: "Colombo, Sri Lanka",
    hourlyRate: 800,
    rating: 5.0,
    profileImage: "/infinityband.png",
    experience: "8+ Years",
    origin: "local",
    bestFor: ["wedding", "corporate", "concert"],
  },
  {
    id: "sample-9",
    name: "WePlus",
    category: "Bands",
    genres: ["Band", "Baila", "Pop"],
    location: "Kandy, Sri Lanka",
    hourlyRate: 750,
    rating: 4.9,
    profileImage: "/wepluse.png",
    experience: "15+ Years",
    origin: "local",
    bestFor: ["wedding", "outdoor", "concert"],
  },
  {
    id: "sample-10",
    name: "Mid Lane",
    category: "Bands",
    genres: ["Band", "Jazz", "Pop"],
    location: "Colombo, Sri Lanka",
    hourlyRate: 900,
    rating: 5.0,
    profileImage: "/midlaneband.png",
    experience: "20+ Years",
    origin: "local",
    bestFor: ["wedding", "corporate", "lounge"],
  },
  {
    id: "sample-11",
    name: "News Sarith & Surith",
    category: "Bands",
    genres: ["Band", "Rock", "Pop"],
    location: "Galle, Sri Lanka",
    hourlyRate: 600,
    rating: 4.7,
    profileImage: "/newsband.png",
    experience: "7+ Years",
    origin: "local",
    bestFor: ["party", "festival", "concert"],
  },
];

export const INTERNATIONAL_CATALOG: CatalogArtist[] = [
  {
    id: "intl-1",
    name: "Dua Lipa",
    category: "Singers",
    genres: ["Pop", "Disco", "Dance"],
    location: "London, UK",
    hourlyRate: 50000,
    rating: 4.9,
    profileImage: "/dualipa.png",
    experience: "10+ Years",
    origin: "international",
    bestFor: ["concert", "festival", "corporate"],
  },
  {
    id: "intl-2",
    name: "Calvin Harris",
    category: "DJs",
    genres: ["EDM", "House", "Dance"],
    location: "Las Vegas, USA",
    hourlyRate: 80000,
    rating: 4.8,
    profileImage: "/CalvinHarris.png",
    experience: "15+ Years",
    origin: "international",
    bestFor: ["festival", "club", "concert"],
  },
  {
    id: "intl-3",
    name: "Coldplay",
    category: "Bands",
    genres: ["Pop Rock", "Alternative Rock"],
    location: "London, UK",
    hourlyRate: 150000,
    rating: 5.0,
    profileImage: "/coldplay.png",
    experience: "25+ Years",
    origin: "international",
    bestFor: ["concert", "stadium", "festival"],
  },
  {
    id: "intl-4",
    name: "Ne-Yo",
    category: "Singers",
    genres: ["Pop", "Soul", "R&B"],
    location: "Los Angeles, USA",
    hourlyRate: 100000,
    rating: 4.9,
    profileImage: "/Ne-Yo.png",
    experience: "20+ Years",
    origin: "international",
    bestFor: ["corporate", "concert", "wedding"],
  },
];

export const ALL_CATALOG_ARTISTS = [...LOCAL_ARTISTS, ...INTERNATIONAL_CATALOG];

/* -------------------------------------------------------------------------
 * Filtering helper – used by the AI assistant route.
 * ----------------------------------------------------------------------- */
export interface ArtistFilter {
  category?: string;
  eventType?: string;
  budgetMax?: number;
  budgetMin?: number;
  location?: string;
  origin?: "local" | "international";
  genre?: string;
}

const normalizeCategory = (cat?: string) => {
  if (!cat) return "";
  const c = cat.toLowerCase();
  if (c.includes("dj")) return "djs";
  if (c.includes("singer") || c.includes("vocal")) return "singers";
  if (c.includes("band")) return "bands";
  if (c.includes("rap") || c.includes("hip")) return "rappers";
  return c;
};

export const filterCatalogArtists = (filter: ArtistFilter): CatalogArtist[] => {
  const wantCat = normalizeCategory(filter.category);
  const wantEvent = filter.eventType?.toLowerCase();
  const wantLoc = filter.location?.toLowerCase();
  const wantGenre = filter.genre?.toLowerCase();

  return ALL_CATALOG_ARTISTS
    .filter((a) => {
      if (filter.origin && a.origin !== filter.origin) return false;
      if (wantCat && normalizeCategory(a.category) !== wantCat) return false;
      if (filter.budgetMax && a.hourlyRate > filter.budgetMax) return false;
      if (filter.budgetMin && a.hourlyRate < filter.budgetMin) return false;
      if (wantLoc && !a.location.toLowerCase().includes(wantLoc)) return false;
      if (wantEvent && a.bestFor && !a.bestFor.some((e) => wantEvent.includes(e))) return false;
      if (wantGenre && !a.genres.some((g) => g.toLowerCase().includes(wantGenre))) return false;
      return true;
    })
    .sort((a, b) => b.rating - a.rating || a.hourlyRate - b.hourlyRate);
};
