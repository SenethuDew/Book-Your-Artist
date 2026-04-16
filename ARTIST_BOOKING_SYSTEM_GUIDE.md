# Book Your Artist - Complete Implementation Guide

## 🎯 Overview

This guide explains the complete artist profile system, booking feature, and client browsing functionality for "Book Your Artist" platform.

## 📋 System Architecture

### Core Components Created

1. **Frontend Services** (`src/lib/firebaseService.ts`)
   - Firebase initialization with env variables
   - Artist profile management functions
   - Booking management functions
   - Image upload/delete functions

2. **Form Validation** (`src/lib/validation.ts`)
   - Profile validation rules
   - Booking form validation
   - Error formatting utilities

3. **Components**
   - `ArtistProfileSetup.tsx` - Multi-section form for artists
   - `ArtistDashboardProfile.tsx` - Artist dashboard display
   - `ArtistPublicCard2.tsx` - Artist card for browsing
   - `ArtistProfilePageContent.tsx` - Full public artist profile
   - `BookingForm.tsx` - Client booking form
   - `ArtistsList.tsx` - Reusable list with filtering

4. **Custom Hooks** (`src/hooks/useArtistProfile.ts`)
   - useArtistProfile - Fetch user's own profile
   - useAllArtists - Fetch all active artists
   - useArtistsByCategory - Filter by category
   - useArtistsByGenre - Filter by genre
   - useSearchArtists - Search across artists

5. **Pages**
   - `/artist/profile` - Artist profile setup form
   - `/dashboard/artist` - Artist dashboard
   - `/browse-artists` - Browse all artists
   - `/artist/[id]` - Public artist profile
   - `/booking/[id]` - Booking form

## 🚀 Quick Start Guide

### Step 1: Add Firebase Credentials

Update `frontend/.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
```

### Step 2: Artist Creates Profile

1. Artist logs in → Navigate to `/artist/profile`
2. Fill out the multi-section form:
   - Basic Info (name, email, phone)
   - Artist Details (category, bio, genres, languages)
   - Pricing (base price, hourly rate, travel fee)
   - Portfolio (profile and cover images)
   - Availability (locations)
   - Terms (agreement checkbox)
3. Click "Save Profile" → Profile saved to Firestore
4. Redirected to `/dashboard/artist`

### Step 3: Client Browses Artists

1. Client visits `/browse-artists`
2. Can filter by:
   - Search term (name, bio)
   - Category (DJ, Band, Singer, etc.)
   - Genre (Pop, Rock, Jazz, etc.)
3. Each artist card shows:
   - Profile image
   - Stage name
   - Top genres
   - Bio snippet
   - Location
   - Starting price
   - Availability status
4. Buttons: "View Profile" & "Book Now"

### Step 4: Client Views Artist Profile

1. Click "View Profile" → `/artist/[id]`
2. Full profile with:
   - Cover image
   - Profile image with name/category
   - Complete biography
   - Years of experience
   - All genres and languages
   - Pricing breakdown
   - Available locations
   - Contact info
   - Book button

### Step 5: Client Books Artist

1. Click "Book Now" → `/booking/[id]`
2. Fill booking form:
   - Client name & email
   - Event type (Wedding, Birthday, etc.)
   - Event date & time
   - Event location
   - Special requests (optional)
3. System checks availability in real-time
4. Click "Confirm Booking"
5. Booking saved to Firestore with "pending" status
6. Redirected to `/bookings`

## 📁 File Structure

```
frontend/src/
├── lib/
│   ├── firebaseService.ts       (All Firebase operations)
│   └── validation.ts             (Form validation)
│
├── components/
│   ├── ArtistProfileSetup.tsx    (Profile form - 6 sections)
│   ├── ArtistDashboardProfile.tsx (Dashboard card)
│   ├── ArtistPublicCard2.tsx      (Browsing card)
│   ├── ArtistProfilePageContent.tsx (Full profile)
│   ├── BookingForm.tsx            (Booking form)
│   └── ArtistsList.tsx            (List with filters)
│
├── hooks/
│   └── useArtistProfile.ts        (5 custom hooks)
│
└── app/
    ├── artist/
    │   ├── profile/page.tsx       (Profile setup)
    │   └── [id]/page.tsx          (Public profile)
    ├── booking/[id]/page.tsx      (Booking form)
    ├── browse-artists/page.tsx    (Browse list)
    └── dashboard/artist/page.tsx  (Artist dashboard)
```

## 🗄️ Firestore Collections

### Artists Collection
```
artists/{uid}/
  ├── uid: string
  ├── fullName: string
  ├── stageName: string
  ├── email: string
  ├── phone: string
  ├── category: string
  ├── biography: string
  ├── experience: number
  ├── genres: string[]
  ├── languages: string[]
  ├── basePrice: number
  ├── hourlyRate: number
  ├── travelFee: number
  ├── availableLocations: string[]
  ├── profileImageUrl: string
  ├── coverImageUrl: string
  ├── availabilityStatus: boolean
  ├── profileCompleted: boolean
  ├── status: "active" | "inactive"
  ├── createdAt: Timestamp
  └── updatedAt: Timestamp
```

### Bookings Collection
```
bookings/{bookingId}/
  ├── artistId: string
  ├── clientId: string
  ├── clientName: string
  ├── clientEmail: string
  ├── artistName: string
  ├── eventDate: string (YYYY-MM-DD)
  ├── eventTime: string (HH:MM)
  ├── eventType: string
  ├── eventLocation: string
  ├── specialRequests: string
  ├── price: number
  ├── status: "pending" | "confirmed" | "completed" | "cancelled"
  ├── createdAt: Timestamp
  └── updatedAt: Timestamp
```

## 📊 Data Flow

### Artist Profile Save Flow
```
ArtistProfileSetup Form
    ↓ (validation)
firebaseService.uploadImageToStorage (profile & cover)
    ↓ (get URLs)
firebaseService.saveArtistProfile
    ↓ (save to Firestore)
Firestore artists/{uid}
    ↓ (redirect)
/dashboard/artist
```

### Booking Flow
```
BookingForm
    ↓ (validation)
firebaseService.isArtistAvailable (check slots)
    ↓ (if available)
firebaseService.saveBooking
    ↓ (save to Firestore)
Firestore bookings/{bookingId}
    ↓ (redirect)
/bookings
```

### Browse Artists Flow
```
/browse-artists
    ↓
ArtistsList component
    ↓
firebaseService.getActiveArtists()
    ↓
Filter & Search (client-side)
    ↓
Display ArtistCard components
```

## 🔧 Key Functions

### Profile Management
```typescript
// Save a profile
await saveArtistProfile(uid, profileData)

// Get a profile
await getArtistProfile(uid)

// Get all active artists
await getActiveArtists()

// Filter by category
await getArtistsByCategory('DJ')

// Filter by genre
await getArtistsByGenre('Hip-Hop')

// Search by name
await searchArtists('John')

// Update availability
await updateArtistAvailability(uid, true)
```

### Booking Management
```typescript
// Save a booking
await saveBooking(bookingData)

// Check availability
await isArtistAvailable(artistId, date, time)

// Get artist bookings
await getArtistBookings(artistId)

// Get client bookings
await getClientBookings(clientId)
```

### Image Management
```typescript
// Upload image
await uploadImageToStorage(file, 'artists/uid/profileImage')

// Delete image
await deleteImageFromStorage('artists/uid/profileImage')
```

## ✅ Validation Rules

### Artist Profile
- All basic info fields required
- Email must be valid format
- Phone must be 10+ characters
- Category required
- Biography required
- Experience must be ≥ 0
- At least 1 genre required
- At least 1 language required
- Prices must be > 0
- Both images required
- At least 1 location required
- Terms must be accepted

### Booking
- Client name required
- Valid email required
- Event date required (not past)
- Event time required
- Event type required
- Event location required

## 🎨 UI/UX Features

### ArtistProfileSetup
- 6-section tabbed form
- Real-time validation with errors
- Image preview before upload
- Section navigation buttons
- Input-specific error messages
- Loading states for uploads
- Success confirmation

### Artist Cards
- Hover scale effect
- Quick stats display
- Availability status indicator
- Quick action buttons
- Genre tags with limit
- Rating display (when available)

### Booking Form
- Real-time availability checker
- Artist summary sidebar
- Date validation (no past dates)
- Automatic email population
- Loading states
- Error handling
- Success redirect

## 🔐 Security Notes

1. All authentication via Firebase Auth
2. Firestore rules should restrict:
   - Artists can only edit their own profile
   - Clients can only see active profiles
   - Bookings accessible only to parties involved

3. Image uploads should have:
   - File size limit (5MB)
   - Valid image type check
   - Unique storage paths per user

## 📱 Responsive Design

All components are fully responsive:
- Mobile-first approach
- Grid layouts adjust for different screens
- Forms stack vertically on mobile
- Cards display in 1, 2, or 3 columns based on screen

## 🎯 Next Steps / Enhancements

1. **Notifications**
   - Send email when booking created
   - Notify artist of new bookings

2. **Reviews & Ratings**
   - Add rating system after booking completion
   - Display reviews on artist profile

3. **Payment Integration**
   - Integrate Stripe for payments
   - Process deposits/final payments

4. **Analytics**
   - Track profile views
   - View booking statistics
   - Revenue tracking

5. **Similar Artists**
   - Show related artists by genre
   - Recommendation algorithm

6. **Messaging**
   - Direct message between artist & client
   - Booking discussion

7. **Portfolio Expansion**
   - Multiple gallery images
   - Portfolio tags
   - Demo videos/links

## 🐛 Troubleshooting

### Artists not showing up
- Check Firebase initialized correctly
- Verify artists collection exists in Firestore
- Ensure `profileCompleted: true` and `status: 'active'`

### Images not uploading
- Check file size < 5MB
- Verify Firebase Storage rules allow uploads
- Check browser console for specific errors

### Availability check not working
- Ensure date/time format is correct
- Check bookings collection queries
- Verify Firestore indexes for compound queries

### Form validation not showing errors
- Check validation.ts is imported
- Verify error strings match field names
- Check error state updates

## 📚 Useful Resources

- Firebase Firestore: https://firebase.google.com/docs/firestore
- Firebase Storage: https://firebase.google.com/docs/storage
- Next.js: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- TypeScript: https://www.typescriptlang.org/docs/
