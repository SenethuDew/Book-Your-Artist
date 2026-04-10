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
  eventTime: string; // HH:mm
  eventType: string;
  location: string;
  specialRequest?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt?: any;
}

export const getArtistFromFirestore = async (artistId: string) => {
  const docRef = doc(db, 'artists', artistId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const getAllArtistsFromFirestore = async () => {
  const querySnapshot = await getDocs(collection(db, 'artists'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const checkBookingAvailability = async (artistId: string, eventDate: string, eventTime: string) => {
  // Prevent double booking for same artist, same date, same time
  const q = query(
    collection(db, 'bookings'),
    where('artistId', '==', artistId),
    where('eventDate', '==', eventDate),
    where('eventTime', '==', eventTime)
  );
  
  const querySnapshot = await getDocs(q);
  // If there are any documents, the slot is already booked
  return querySnapshot.empty;
};

export const createFirestoreBooking = async (bookingData: BookingData) => {
  try {
    // 1. Validate Availability
    const isAvailable = await checkBookingAvailability(
      bookingData.artistId, 
      bookingData.eventDate, 
      bookingData.eventTime
    );

    if (!isAvailable) {
      throw new Error('This time slot is already booked for this artist.');
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
  const sampleArtists = [
    {
      name: 'Elena Rose',
      stageName: 'Elena',
      category: 'Singers',
      genres: ['Pop', 'R&B'],
      location: 'New York, UK',
      hourlyRate: 150,
      profileImage: 'https://images.unsplash.com/photo-1516280440502-a2f00a52416b?w=500&h=500&fit=crop',
      coverImage: 'https://images.unsplash.com/photo-1493225457124-a1a2a2951113?w=1200&h=400&fit=crop',
      rating: 4.9,
      biography: 'Elena is a phenomenal pop and R&B vocalist.',
      availability: true,
      experience: '5+ Years'
    },
    {
      name: 'DJ Khalid',
      stageName: 'DJ Drift',
      category: 'DJs',
      genres: ['Electronic', 'House'],
      location: 'London, UK',
      hourlyRate: 120,
      profileImage: 'https://images.unsplash.com/photo-1571266028243-cb40fce75242?w=500&h=500&fit=crop',
      coverImage: 'https://images.unsplash.com/photo-1571266028243-cb40fce75242?w=1200&h=400&fit=crop',
      rating: 4.8,
      biography: 'Known for energizing crowds with house and techno.',
      availability: true,
      experience: '7+ Years'
    },
    {
      name: 'The River Boys',
      stageName: 'The River Boys',
      category: 'Bands',
      genres: ['Rock', 'Live Band'],
      location: 'Austin, TX',
      hourlyRate: 350,
      profileImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500&h=500&fit=crop',
      coverImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&h=400&fit=crop',
      rating: 5.0,
      biography: 'A dynamic 4-piece rock band ready to rock your events.',
      availability: true,
      experience: '10+ Years'
    }
  ];

  try {
    for (const artist of sampleArtists) {
      await addDoc(collection(db, 'artists'), artist);
    }
    return true;
  } catch (error) {
    console.error('Error seeding artists:', error);
    return false;
  }
};
