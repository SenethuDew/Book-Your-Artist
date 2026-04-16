# Sample Artists Setup Guide

## Overview
This guide explains how to add sample/dummy artist data to your Book-Your-Artist application for testing and UI display.

---

## Implementation Summary

I've implemented a complete solution with 3 components:

### 1. **Seed Script** (`backend/seed.js`)
- Enhanced with sample artist data generation
- Creates 12 pre-configured sample artists across different genres
- Includes test users (client, artist, admin) and artists with full profiles
- Password for sample artists: `ArtistPassword123!@`

**To run the seed script:**
```bash
cd backend
node seed.js
```

---

### 2. **Admin API Endpoint** (`backend/src/controllers/adminController.js`)
**New Method:** `seedSampleArtists()`

**Endpoint:** `POST /api/admin/seed-artists`
- **Authentication:** Required (admin only)
- **Response:** Returns created artists count and detailed results

**Example Response:**
```json
{
  "success": true,
  "message": "Seeded 12 sample artists successfully",
  "created": 12,
  "total": 12,
  "results": [
    {
      "name": "DJ Thunder",
      "status": "created",
      "genres": ["Electronic", "House", "Techno"]
    }
  ]
}
```

---

### 3. **Admin Dashboard UI** (`frontend/src/app/dashboard/admin/page.tsx`)
- Added "Seed Sample Artists" button with loading state
- Success/error message display
- One-click seeding from the admin panel

**To use:**
1. Log in as admin (email: `admin@test.com`, password: `Admin123!@`)
2. Go to Admin Dashboard: `http://localhost:3000/dashboard/admin`
3. Click "Seed Sample Artists" button
4. See confirmation message with count of created artists

---

## Sample Artists Generated

The system creates 12 diverse artists:

| Artist Name | Genres | Price/hr | Rating |
|---|---|---|---|
| DJ Thunder | Electronic, House, Techno | $150 | 4.8★ |
| Luna & The Soulmates | Indie, Alternative, Rock | $200 | 4.9★ |
| Aria Soprano | Pop, Soul, R&B | $250 | 4.7★ |
| The Rhythm Kings | Funk, Soul, Hip-Hop | $300 | 4.9★ |
| DJ Cosmic | Electronic, Trance, Dubstep | $180 | 4.6★ |
| Marcus Jazz Quartet | Jazz, Blues, Soul | $280 | 4.95★ |
| Ella's Acoustic Sessions | Acoustic, Folk, Singer-Songwriter | $100 | 4.8★ |
| DJ Pulse | EDM, House, Dance | $200 | 4.7★ |
| The Vintage Rockers | Rock, Classic Rock, Hard Rock | $320 | 4.85★ |
| Sophia Voice Studio | Classical, Opera, Musical Theatre | $400 | 5.0★ |
| DJ Groove Master | Reggae, Dancehall, Funk | $160 | 4.75★ |
| Divine Harmony Singers | Gospel, Soul, Spiritual | $220 | 4.9★ |

---

## Sample Data Structure

Each artist includes:
```javascript
{
  userId: ObjectId,              // Reference to User
  genres: [String],              // Musical genres
  specialties: [String],         // Service specialties
  yearsOfExperience: Number,     // Years in industry
  hourlyRate: Number,            // Price per hour
  minimumBooking: Number,        // Default: 1
  serviceTypes: [String],        // Types of services offered
  equipmentProvided: [String],   // Equipment details
  travelRadius: Number,          // Travel distance in km
  languages: [String],           // Languages spoken
  timezone: String,              // Timezone
  rating: Number,                // Star rating (0-5)
  reviewCount: Number,           // Number of reviews
  portfolio: {
    images: [String],            // Portfolio images (placeholder URLs)
    videoLinks: [String],        // Video links
    audioLinks: [String],        // Audio samples
    mediaLinks: [Object]         // Social media links
  },
  backgroundChecked: Boolean,    // Background verification status
  verified: Boolean,             // Verification status
}
```

---

## Quick Start

### Option 1: Run Seed Script (Terminal)
```bash
cd backend
npm run dev  # Keep running in another terminal
cd backend
node seed.js
```

### Option 2: Use Admin Button (Web UI)
1. Start both servers: `npm run dev` (both frontend & backend)
2. Open: `http://localhost:3000/auth/login`
3. Login with admin credentials:
   - Email: `admin@test.com`
   - Password: `Admin123!@`
4. Go to admin dashboard: `http://localhost:3000/dashboard/admin`
5. Click "Seed Sample Artists" button

### Option 3: API Call (cURL)
```bash
curl -X POST http://localhost:5000/api/admin/seed-artists \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## View Sample Artists

After seeding, visit:
- **All Artists:** `http://localhost:3000/artists`
- **Search Artists:** `http://localhost:3000/search`
- **Artist Details:** `http://localhost:3000/artists/[artistId]`

---

## Database Collection

All artists are stored in the **`ArtistProfile`** collection with references to the **`User`** collection.

**MongoDB Query to see all sample artists:**
```javascript
db.artistprofiles.find({ verified: true })
```

---

## Key Features

✅ **12 Diverse Artists** - DJs, Bands, Singers across genres  
✅ **Realistic Data** - Years of experience, ratings, reviews  
✅ **Pre-verified** - Marked as verified & background-checked  
✅ **One-Click Seeding** - Admin button in dashboard  
✅ **Idempotent** - Won't create duplicates if run multiple times  
✅ **Error Handling** - Graceful handling of existing artists  
✅ **Clean Structure** - Reusable seeding function in controller  

---

## Notes

- Sample artist password: `SampleArtist123!@`
- All artists created with `status: "active"` and `verified: true`
- Images use placeholder URLs (e.g., `https://via.placeholder.com/...`)
- Can easily modify sample data in `sampleArtists` array
- Endpoint requires admin authentication

---

## Troubleshooting

**Issue:** "Only admins can seed sample data"
- **Solution:** Make sure you're logged in as admin (admin@test.com)

**Issue:** "Artist already exists (skipped)"
- **Solution:** This is normal - the system won't create duplicates

**Issue:** Backend and frontend showing different data
- **Solution:** Clear browser cache and refresh page

---

## Files Modified

1. ✅ `backend/seed.js` - Enhanced with artist seeding
2. ✅ `backend/src/controllers/adminController.js` - Added seedSampleArtists() method
3. ✅ `backend/src/routes/api.js` - Added POST /admin/seed-artists route
4. ✅ `frontend/src/app/dashboard/admin/page.tsx` - Added seed button and logic

---

Created: April 10, 2026
Last Updated: April 10, 2026
