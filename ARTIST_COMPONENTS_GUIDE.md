# Artists Display Components - Implementation Guide

## Overview
This guide explains the new artist display components and how to use them throughout your application.

---

## Components Created

### 1. **RatingStars** Component
Displays a 5-star rating with optional review count.

**Location:** `frontend/src/components/RatingStars.tsx`

**Features:**
- 5-star visual display
- Customizable sizes (sm, md, lg)
- Shows rating value and review count
- Yellow/gray color scheme

**Usage:**
```tsx
import { RatingStars } from "@/components/RatingStars";

<RatingStars 
  rating={4.8} 
  count={45}
  size="md"
/>
```

**Props:**
- `rating: number` - Star rating (0-5)
- `count?: number` - Number of reviews
- `size?: "sm" | "md" | "lg"` - Icon and text size

---

### 2. **BookingButton** Component
Handles navigation to the booking/checkout page.

**Location:** `frontend/src/components/BookingButton.tsx`

**Features:**
- Navigates to checkout with artist pre-selected
- Loading and disabled states ready
- Hover animations with scale effect
- Responsive styling

**Usage:**
```tsx
import { BookingButton } from "@/components/BookingButton";

<BookingButton 
  artistId="artist123" 
  artistName="DJ Thunder"
/>
```

**Props:**
- `artistId: string` - Artist MongoDB ID
- `artistName: string` - Artist's display name
- `className?: string` - Additional Tailwind classes

**Navigation:**
Clicking "Book Now" navigates to: `/checkout?artistId={artistId}`

---

### 3. **ArtistCard** Component
Main card component displaying artist information.

**Location:** `frontend/src/components/ArtistCard.tsx`

**Features:**
- Artist profile image with hover zoom effect
- Availability status badge (green/red)
- Verification badge
- Genre tags with overflow handling
- Experience level
- 5-star rating display
- Hourly rate and minimum booking
- Specialties section
- "Book Now" button

**Usage:**
```tsx
import { ArtistCard, type Artist } from "@/components/ArtistCard";

const artist: Artist = {
  _id: "123",
  userId: { _id: "u123", name: "DJ Thunder", email: "dj@example.com" },
  genres: ["Electronic", "House"],
  specialties: ["Club Events", "Weddings"],
  yearsOfExperience: 8,
  hourlyRate: 150,
  minimumBooking: 1,
  rating: 4.8,
  reviewCount: 45,
  portfolio: { images: ["https://..."] },
  verified: true,
  backgroundChecked: true
};

<ArtistCard artist={artist} isAvailable={true} />
```

**Props:**
- `artist: Artist` - Artist data object
- `isAvailable?: boolean` - Show availability status (default: true)

**Artist Interface:**
```typescript
interface Artist {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  genres: string[];
  specialties: string[];
  yearsOfExperience: number;
  hourlyRate: number;
  minimumBooking: number;
  rating: number;
  reviewCount: number;
  portfolio?: {
    images?: string[];
  };
  verified: boolean;
  backgroundChecked: boolean;
}
```

---

### 4. **FeaturedArtists** Component
Display featured artists in a grid for home page.

**Location:** `frontend/src/components/FeaturedArtists.tsx`

**Features:**
- Auto-fetches featured artists from API
- Loading state
- Error handling
- View All link to artists page
- Responsive grid (1-3 columns)

**Usage:**
```tsx
import { FeaturedArtists } from "@/components/FeaturedArtists";

// On home page
<FeaturedArtists limit={6} showViewAll={true} />
```

**Props:**
- `limit?: number` - Max artists to fetch (default: 6)
- `showViewAll?: boolean` - Show "View All" button (default: true)

---

## Pages Created

### 1. **Artists Listing Page**
**Location:** `frontend/src/app/artists/page.tsx`

**Features:**
- Grid display of all artists
- Filter by genre
- Sort by: rating, price (low-to-high, high-to-low)
- Loading state with spinner
- Error state with retry
- Results counter
- Brand new artists after seeding visible here

**URL:** `http://localhost:3000/artists`

**How it works:**
1. Fetches all artists from `/api/artists/search`
2. Filters by selected genre
3. Sorts by user preference
4. Displays in responsive grid (1-4 columns)
5. Each card is clickable with "Book Now" button

---

## Design Highlights

### Color Scheme
- **Background:** Dark gray `#111827` (gray-900)
- **Cards:** `#1f2937` (gray-800) with hover shadows
- **Accents:** Blue `#2563eb` (blue-600), Green `#22c55e` (green-400)
- **Text:** White/Gray gradient for hierarchy

### Responsive Design
```
Mobile (< 768px):  1 column
Tablet (768-1024px): 2 columns  
Desktop (1024px+): 3-4 columns
```

### Animations
- Card hover: Scale 105%, shadow glow
- Image hover: Zoom 110%
- Button hover: Scale 105%, color transition
- Loading: Spinning circle animation

---

## API Endpoints Used

### List All Artists
```http
GET /api/artists/search
Response:
{
  "success": true,
  "artists": [Artist[]],
  "pagination": { total, page, limit, pages }
}
```

### Get Featured Artists
```http
GET /api/artists/featured?limit=6
Response:
{
  "success": true,
  "artists": [Artist[]]
}
```

### Get Artist Genres
```http
GET /api/artists/genres
Response:
{
  "success": true,
  "genres": ["Electronic", "Pop", ...]
}
```

---

## Usage Examples

### Example 1: Add Featured Artists to Home Page
```tsx
// app/page.tsx or app/home/page.tsx
import { FeaturedArtists } from "@/components/FeaturedArtists";

export default function HomePage() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Featured Artists</h2>
      <FeaturedArtists limit={6} showViewAll={true} />
    </div>
  );
}
```

### Example 2: Display Artists in Modal/Carousel
```tsx
import { ArtistCard, type Artist } from "@/components/ArtistCard";

// Use with your modal/carousel library
{artists.map(artist => (
  <ArtistCard 
    key={artist._id} 
    artist={artist}
    isAvailable={artist.verified}
  />
))}
```

### Example 3: Custom Artist Display with Filters
```tsx
import { RatingStars } from "@/components/RatingStars";
import { BookingButton } from "@/components/BookingButton";

// Your custom layout
<div className="border rounded-lg p-4">
  <h3>{artist.userId.name}</h3>
  <RatingStars rating={artist.rating} count={artist.reviewCount} />
  <p>${artist.hourlyRate}/hour</p>
  <BookingButton artistId={artist._id} artistName={artist.userId.name} />
</div>
```

---

## State Management

All components use React Hooks:
- **`useState`** - Manage filters, loading states, error states
- **`useEffect`** - Fetch data on mount
- **`useRouter`** - Navigation to checkout page
- **`useSearchParams`** - Handle URL parameters

No external state management (Redux, Zustand) required.

---

## Error Handling

Each component handles errors gracefully:

1. **ArtistCard** - Safe image fallback with placeholder URL
2. **FeaturedArtists** - Shows error message, no crash
3. **Artists Page** - Error state with "Try Again" button
4. **Search Page** - Validation, empty results message

---

## Performance Optimizations

- ✅ Next.js Image optimization with `next/image`
- ✅ Lazy loading ready (images load as needed)
- ✅ Efficient filtering (client-side)
- ✅ Memoization ready for large lists

---

## Styling with Tailwind

All components use Tailwind CSS v4 with:
- Responsive classes (sm:, md:, lg:, xl:)
- Hover states (hover:)
- Gradient backgrounds (from-, to-)
- Transitions (transition-, duration-)
- Ring and shadow effects

---

## Next Steps

1. ✅ **Seed sample artists**: `npm run seed` (Already done!)
2. ✅ **View artists page**: Visit `http://localhost:3000/artists`
3. 📝 **Customize colors**: Adjust Tailwind classes in component files
4. 🎨 **Add animations**: Enhance with Framer Motion (optional)
5. 🔍 **Expand search**: Add more filter options to search page
6. 📱 **Mobile test**: Test responsive design on mobile devices

---

## File Structure

```
frontend/src/
├── components/
│   ├── ArtistCard.tsx         ✅ NEW
│   ├── RatingStars.tsx        ✅ NEW
│   ├── BookingButton.tsx      ✅ NEW
│   ├── FeaturedArtists.tsx    ✅ NEW
│   ├── GridScan.tsx           (existing)
│   ├── ProtectedRoute.tsx     (existing)
│   └── StripeCheckout.tsx     (existing)
├── app/
│   ├── artists/
│   │   └── page.tsx           ✅ NEW
│   ├── search/
│   │   └── page.tsx           (existing, enhanced)
│   └── ...
└── lib/
    └── api.ts                 (existing, used by all)
```

---

## Support

For issues or questions:
1. Check browser console for errors
2. Verify API is running (http://localhost:5000)
3. Check MongoDB connection
4. Clear browser cache and refresh
5. Restart servers if needed

---

Created: April 10, 2026
Last Updated: April 10, 2026
