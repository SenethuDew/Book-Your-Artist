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

export const SAMPLE_ARTISTS = [
  // Singers
  {
    id: 'sample-1',
    name: 'Yohani De Silva',
    stageName: 'Yohani',
    category: 'Singers',
    genres: ['Singer', 'Pop', 'Rap'],
    location: 'Colombo, Sri Lanka',
    hourlyRate: 350,
    profileImage: 'https://images.unsplash.com/photo-1516280440502-a2f00a52416b?w=500&h=500&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a1a2a2951113?w=1200&h=400&fit=crop',
    rating: 4.9,
    biography: 'Yohani is a trending Sri Lankan singer, songwriter, and rapper with global hits.',
    availability: true,
    experience: '5+ Years'
  },
  {
    id: 'sample-2',
    name: 'Umaria Sinhawansa',
    stageName: 'Umaria',
    category: 'Singers',
    genres: ['Singer', 'Soul', 'Pop'],
    location: 'Colombo, Sri Lanka',
    hourlyRate: 300,
    profileImage: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=500&h=500&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200&h=400&fit=crop',
    rating: 5.0,
    biography: 'Umaria is a versatile award-winning vocalist known for her soulful performances.',
    availability: true,
    experience: '10+ Years'
  },
  {
    id: 'sample-3',
    name: 'Sanuka Wickramasinghe',
    stageName: 'Sanuka',
    category: 'Singers',
    genres: ['Singer', 'Pop', 'R&B'],
    location: 'Kandy, Sri Lanka',
    hourlyRate: 250,
    profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=500&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1470229722913-7c090be5f5ae?w=1200&h=400&fit=crop',
    rating: 4.8,
    biography: 'Sanuka is a popular youth icon and singer-songwriter with massive chart-toppers.',
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
    profileImage: 'https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?w=500&h=500&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=400&fit=crop',
    rating: 4.7,
    biography: 'Dinesh Gamage captures audiences with his emotional melodies and unique voice.',
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
    profileImage: 'https://images.unsplash.com/photo-1571266028243-cb40fce75242?w=500&h=500&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=400&fit=crop',
    rating: 4.9,
    biography: 'DJ Mass is a premier producer and DJ, heavily influencing the local EDM scene.',
    availability: true,
    experience: '12+ Years'
  },
  {
    id: 'sample-6',
    name: 'DJ Smokey',
    stageName: 'DJ Smokey',
    category: 'DJs',
    genres: ['DJ', 'Electronic', 'Techno'],
    location: 'Galle, Sri Lanka',
    hourlyRate: 120,
    profileImage: 'https://images.unsplash.com/photo-1542382257-80ddfc7f89ea?w=500&h=500&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=400&fit=crop',
    rating: 4.6,
    biography: 'Setting the dance floors on fire with unique techno and beach club mixes.',
    availability: true,
    experience: '5+ Years'
  },
  {
    id: 'sample-7',
    name: 'DJ Black',
    stageName: 'DJ Black',
    category: 'DJs',
    genres: ['DJ', 'Mixing', 'EDM'],
    location: 'Colombo, Sri Lanka',
    hourlyRate: 100,
    profileImage: 'https://images.unsplash.com/photo-1520625340656-74fc21017415?w=500&h=500&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=400&fit=crop',
    rating: 4.8,
    biography: 'DJ Black consistently delivers high-energy sets for corporate and private events.',
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
    profileImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500&h=500&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&h=400&fit=crop',
    rating: 5.0,
    biography: 'Infinity is one of the most trending live bands pulling massive crowds everywhere.',
    availability: true,
    experience: '8+ Years'
  },
  {
    id: 'sample-9',
    name: 'Doctor',
    stageName: 'Doctor',
    category: 'Bands',
    genres: ['Band', 'Baila', 'Pop'],
    location: 'Kandy, Sri Lanka',
    hourlyRate: 750,
    profileImage: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500&h=500&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&h=400&fit=crop',
    rating: 4.9,
    biography: 'Doctor band specializes in keeping the Sri Lankan festive spirit alive with Baila and Pop energy.',
    availability: true,
    experience: '15+ Years'
  },
  {
    id: 'sample-10',
    name: 'Misty',
    stageName: 'Misty',
    category: 'Bands',
    genres: ['Band', 'Jazz', 'Pop'],
    location: 'Colombo, Sri Lanka',
    hourlyRate: 900,
    profileImage: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=500&h=500&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&h=400&fit=crop',
    rating: 5.0,
    biography: 'Misty has been the top tier choice for elite events offering a mix of Jazz, Pop, and Classics.',
    availability: true,
    experience: '20+ Years'
  },
  {
    id: 'sample-11',
    name: 'Freeze',
    stageName: 'Freeze',
    category: 'Bands',
    genres: ['Band', 'Rock', 'Pop'],
    location: 'Galle, Sri Lanka',
    hourlyRate: 600,
    profileImage: 'https://images.unsplash.com/photo-1493225457124-a1a2a2951113?w=500&h=500&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&h=400&fit=crop',
    rating: 4.7,
    biography: 'A highly energetic band known for covering a vast range of genres from classic rock to modern pop.',
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
