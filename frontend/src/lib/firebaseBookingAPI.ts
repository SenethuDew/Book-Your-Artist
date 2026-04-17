import { db } from './firebaseService';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  serverTimestamp,
  type DocumentData
} from 'firebase/firestore';

export interface BookingData {
  artistId: string;
  artistName: string;
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  eventTitle: string;
  location: string;
  specialRequest?: string;
  totalPrice?: number;
  advanceAmount?: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  createdAt?: any;
}

export const getArtistFromFirestore = async (artistId: string) => {
  if (artistId.startsWith('intl-')) {
    return INTERNATIONAL_ARTISTS.find(a => a.id === artistId) || null;
  }

  // Bypass if Firebase is not properly configured in .env.local
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'YOUR_PROJECT_ID_HERE') {
    return SAMPLE_ARTISTS.find(a => a.id === artistId) || null;
  }

  const docRef = doc(db, 'artists', artistId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const INTERNATIONAL_ARTISTS = [
  {
    id: 'intl-1',
    name: 'Dua Lipa',
    stageName: 'Dua Lipa',
    category: 'singers',
    location: 'London, UK',
    hourlyRate: 50000,
    basePrice: 50000,
    rating: 4.9,
    reviews: 1240,
    availability: 'limited',
    genres: ['Pop', 'Disco', 'Dance'],
    profileImage: '/dualipa.png',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f928?auto=format&fit=crop&w=800&q=80',
    biography: 'Dua Lipa is an internationally famous pop singer known for her hit songs and powerful performances. She is one of the leading global artists in the modern music industry.',
    socialLinks: {
      instagram: 'https://www.instagram.com/dualipa/?hl=en'
    }
  },
  {
    id: 'intl-2',
    name: 'Calvin Harris',
    stageName: 'Calvin Harris',
    category: 'djs',
    location: 'Las Vegas, USA',
    hourlyRate: 80000,
    basePrice: 80000,
    rating: 4.8,
    reviews: 950,
    availability: 'available',
    genres: ['EDM', 'House', 'Dance'],
    profileImage: '/CalvinHarris.png',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    biography: 'Calvin Harris is a globally recognized DJ and music producer known for his hit songs and high-energy performances. He is one of the leading figures in the EDM music industry.',
    socialLinks: {
      instagram: 'https://www.instagram.com/calvinharris/?hl=en'
    }
  },
  {
    id: 'intl-3',
    name: 'Coldplay',
    stageName: 'Coldplay',
    category: 'bands',
    location: 'London, UK',
    hourlyRate: 150000,
    basePrice: 150000,
    rating: 5.0,
    reviews: 3200,
    availability: 'unavailable',
    genres: ['Pop Rock', 'Alternative Rock'],
    profileImage: '/coldplay.png',
    coverImage: 'https://images.unsplash.com/photo-1470229722913-7c090be5faa3?auto=format&fit=crop&w=800&q=80',
    biography: 'Coldplay is a globally popular British band known for emotional songs and unforgettable live performances. They are one of the most successful music bands in the world.',
    socialLinks: {
      instagram: 'https://www.instagram.com/coldplay/'
    }
  },
  {
    id: 'intl-4',
    name: 'Ne-Yo',
    stageName: 'Ne-Yo',
    category: 'singers',
    location: 'Los Angeles, USA',
    hourlyRate: 100000,
    basePrice: 100000,
    rating: 4.9,
    reviews: 2100,
    availability: 'available',
    genres: ['Pop', 'Soul', 'R&B'],
    profileImage: '/Ne-Yo.png',
    coverImage: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80',
    biography: 'Ne-Yo is an international R&B and pop artist known for his hit songs and smooth vocals. He is one of the most successful and influential singers in modern music.',
    socialLinks: {
      instagram: 'https://www.instagram.com/neyo/'
    }
  }
];

export const SAMPLE_ARTISTS = [
  // Singers
  {
    id: 'sample-1',
    name: 'Yohani De Silva',
    stageName: 'Yohani De Silva',
    category: 'Singers',
    genres: ['Singer', 'Pop', 'Rap'],
    location: 'Colombo, Sri Lanka',
    hourlyRate: 350,
    profileImage: '/yohanidesilva.png',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a1a2a2951113?w=1200&h=400&fit=crop',
    rating: 4.9,
    biography: 'Yohani De Silva is a Sri Lankan singer and rapper who became globally famous through her viral song “Manike Mage Hithe.” She started as a YouTuber and is now one of the most popular young music artists in Sri Lanka.',
    socialLinks: {
      instagram: 'https://www.instagram.com/yohanimusic/'
    },
    availability: true,
    experience: '5+ Years'
  },
  {
    id: 'sample-2',
    name: 'Umaria Sinhawansa',
    stageName: 'Umaria Sinhawansa',
    category: 'Singers',
    genres: ['Singer', 'Soul', 'Pop'],
    location: 'Colombo, Sri Lanka',
    hourlyRate: 300,
    profileImage: '/umaria.png',
    coverImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200&h=400&fit=crop',
    rating: 5.0,
    biography: 'Umaria Sinhawansa is a famous Sri Lankan singer known for her beautiful voice, live performances, and popular songs. She is one of the leading young female artists in Sri Lanka and is admired for her talent, style, and stage presence.',
    socialLinks: {
      instagram: 'https://www.instagram.com/umariaofficial/'
    },
    availability: true,
    experience: '10+ Years'
  },
  {
    id: 'sample-3',
    name: 'Sanuka Wickramasinghe',
    stageName: 'Sanuka Wickramasinghe',
    category: 'Singers',
    genres: ['Singer', 'Pop', 'R&B'],
    location: 'Kandy, Sri Lanka',
    hourlyRate: 250,
    profileImage: '/sanukawik.png',
    coverImage: 'https://images.unsplash.com/photo-1470229722913-7c090be5f5ae?w=1200&h=400&fit=crop',
    rating: 4.8,
    biography: 'Sanuka Wickramasinghe is a talented Sri Lankan music artist known for his creative songs and modern style. He is one of the leading young musicians in Sri Lanka and continues to inspire audiences with his music.',
    socialLinks: {
      instagram: 'https://www.instagram.com/sanuka.musick/'
    },
    availability: true,
    experience: '8+ Years'
  },
  {
    id: 'sample-4',
    name: 'Dinesh Gamage',
    stageName: 'Dinesh Gamage',
    category: 'Singers',
    genres: ['Singer', 'Pop', 'Vocals'],
    location: 'Galle, Sri Lanka',
    hourlyRate: 200,
    profileImage: '/dineshgamage.png',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=400&fit=crop',
    rating: 4.7,
    biography: 'Dinesh Gamage is a talented Sri Lankan singer and music producer known for his modern songs and emotional style. He is a popular young artist who continues to grow in the music industry.',
    socialLinks: {
      instagram: 'https://www.instagram.com/dinesh_gamage_/'
    },
    availability: true,
    experience: '6+ Years'
  },

  // DJs
  {
    id: 'sample-5',
    name: 'DJ Mass',
    stageName: 'DJ Mass',
    category: 'DJs',
    genres: ['DJ', 'EDM', 'House'],
    location: 'Colombo, Sri Lanka',
    hourlyRate: 150,
    profileImage: '/djmass.png',
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=400&fit=crop',
    rating: 4.9,
    biography: 'DJ Mass is a dynamic Sri Lankan DJ known for high-energy performances and modern music mixes. He is a popular choice for events and parties, delivering unforgettable entertainment experiences.',
    socialLinks: {
      instagram: 'https://www.instagram.com/officialdjmass/'
    },
    availability: true,
    experience: '12+ Years'
  },
  {
    id: 'sample-6',
    name: 'Iman cader (DJ)',
    stageName: 'Iman cader (DJ)',
    category: 'DJs',
    genres: ['DJ', 'Electronic', 'Techno'],
    location: 'Galle, Sri Lanka',
    hourlyRate: 120,
    profileImage: '/imancarder.png',
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=400&fit=crop',
    rating: 4.6,
    biography: 'DJ Mass is a dynamic Sri Lankan DJ known for high-energy performances and modern music mixes. He is a popular choice for events and parties, delivering unforgettable entertainment experiences.',
    socialLinks: {
      instagram: 'https://www.instagram.com/iman.cader/'
    },
    availability: true,
    experience: '5+ Years'
  },
  {
    id: 'sample-7',
    name: 'DJ Imalka',
    stageName: 'DJ Imalka',
    category: 'DJs',
    genres: ['DJ', 'Mixing', 'EDM'],
    location: 'Colombo, Sri Lanka',
    hourlyRate: 100,
    profileImage: '/djimalka.png',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=400&fit=crop',
    rating: 4.8,
    biography: 'DJ Imalka is a dynamic Sri Lankan DJ known for high-energy performances and crowd-pleasing music. She is a popular choice for events, delivering fun and unforgettable experiences.',
    socialLinks: {
      instagram: 'https://www.instagram.com/dj_imalka/'
    },
    availability: true,
    experience: '7+ Years'
  },

  // Bands
  {
    id: 'sample-8',
    name: 'Infinity',
    stageName: 'Infinity',
    category: 'Bands',
    genres: ['Band', 'Pop', 'Rock'],
    location: 'Colombo, Sri Lanka',
    hourlyRate: 800,
    profileImage: '/infinityband.png',
    coverImage: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&h=400&fit=crop',
    rating: 5.0,
    biography: 'Infinity Band is a well-known Sri Lankan band that delivers exciting live performances for events. They are loved for their versatility, energy, and ability to entertain any crowd.',
    socialLinks: {
      instagram: 'https://www.instagram.com/infinitysl/'
    },
    availability: true,
    experience: '8+ Years'
  },
  {
    id: 'sample-9',
    name: 'WePlse',
    stageName: 'WePlse',
    category: 'Bands',
    genres: ['Band', 'Baila', 'Pop'],
    location: 'Kandy, Sri Lanka',
    hourlyRate: 750,
    profileImage: '/wepluse.png',
    coverImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&h=400&fit=crop',
    rating: 4.9,
    biography: 'WePlus Band is a talented Sri Lankan live band known for their captivating performances and dynamic energy on stage. With a wide repertoire covering popular local hits, international favorites, baila, and contemporary music, they are a sought-after choice for weddings, outdoor concerts, and corporate events across the country.',
    socialLinks: {
      instagram: 'https://www.instagram.com/weplussl/'
    },
    availability: true,
    experience: '15+ Years'
  },
  {
    id: 'sample-10',
    name: 'Mid Lane',
    stageName: 'Mid Lane',
    category: 'Bands',
    genres: ['Band', 'Jazz', 'Pop'],
    location: 'Colombo, Sri Lanka',
    hourlyRate: 900,
    profileImage: '/midlaneband.png',
    coverImage: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&h=400&fit=crop',
    rating: 5.0,
    biography: 'Midlane is a talented Sri Lankan band known for energetic performances and versatile music. They are a popular choice for events, delivering high-quality entertainment and engaging live shows.',
    socialLinks: {
      instagram: 'https://www.instagram.com/midlanesl/'
    },
    availability: true,
    experience: '20+ Years'
  },
  {
    id: 'sample-11',
    name: 'News Sarith & Surith',
    stageName: 'News Sarith & Surith',
    category: 'Bands',
    genres: ['Band', 'Rock', 'Pop'],
    location: 'Galle, Sri Lanka',
    hourlyRate: 600,
    profileImage: '/newsband.png',
    coverImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&h=400&fit=crop',
    rating: 4.7,
    biography: 'News Sarith & Surith is a well-known Sri Lankan band famous for energetic performances and fun party music. They are a top choice for events, delivering exciting and memorable entertainment.',
    socialLinks: {
      instagram: 'https://www.instagram.com/sarithsurithandthenews/'
    },
    availability: true,
    experience: '7+ Years'
  }
];

export const getAllArtistsFromFirestore = async () => {
  // Bypass if Firebase is not properly configured in .env.local
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'YOUR_PROJECT_ID_HERE') {
    return SAMPLE_ARTISTS;
  }

  const querySnapshot = await getDocs(collection(db, 'artists'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const checkBookingAvailability = async (artistId: string, eventDate: string, startTime: string, endTime: string) => {
  // 1. If Firebase is not configured, we'll assume it's available for now in demo mode
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'YOUR_PROJECT_ID_HERE') {
    return true; 
  }

  // 2. Fetch all bookings for this artist on this date
  const q = query(
    collection(db, 'bookings'),
    where('artistId', '==', artistId),
    where('eventDate', '==', eventDate)
  );
  
  const querySnapshot = await getDocs(q);
  
  // 3. Check for time overlaps
  for (const doc of querySnapshot.docs) {
    const existingBooking = doc.data() as BookingData;
    // An overlap occurs if: (newStart < existingEnd) AND (newEnd > existingStart)
    // String comparison works for standard HH:mm times
    if (startTime < existingBooking.endTime && endTime > existingBooking.startTime) {
      if (existingBooking.status !== 'cancelled') {
         return false; // overlapping time slot is already booked
      }
    }
  }

  // If no overlaps found, the slot is available
  return true;
};

export const getArtistBookings = async (artistId: string) => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'YOUR_PROJECT_ID_HERE') {
    return []; 
  }
  const q = query(
    collection(db, 'bookings'),
    where('artistId', '==', artistId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

import { setDoc } from 'firebase/firestore';

export const getFirestoreBooking = async (bookingId: string) => {
  try {
    const docRef = doc(db, 'bookings', bookingId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'No such booking' };
  } catch (error: any) {
    console.error('Error fetching booking:', error);
    return { success: false, error: error.message };
  }
};

export const updateFirestoreBooking = async (bookingId: string, data: any) => {
  try {
    const docRef = doc(db, 'bookings', bookingId);
    await setDoc(docRef, data, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating booking:', error);
    return { success: false, error: error.message };
  }
};

export const createFirestoreBooking = async (bookingData: BookingData) => {
  try {
    // 1. Validate Availability
    const isAvailable = await checkBookingAvailability(
      bookingData.artistId, 
      bookingData.eventDate, 
      bookingData.startTime,
      bookingData.endTime
    );

    if (!isAvailable) {
      throw new Error('This time slot overlaps with an existing booking for this artist.');
    }

    // Bypass Firebase save if not configured
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'YOUR_PROJECT_ID_HERE') {
       return { success: true, bookingId: 'demo-booking-id' };
    }

    // 2. Save Booking
    const docRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    return { success: true, bookingId: docRef.id };
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return { success: false, error: error.message };
  }
};
export const seedSampleArtists = async () => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'YOUR_PROJECT_ID_HERE') {
    return true; // Bypass if Firebase not configured
  }

  try {
    for (const artist of SAMPLE_ARTISTS) {
      const { id, ...artistData } = artist;
      await addDoc(collection(db, 'artists'), artistData);
    }
    return true;
  } catch (error) {
    console.error('Error seeding artists:', error);
    return false;
  }
};
