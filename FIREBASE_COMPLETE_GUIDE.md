# Firebase Integration - Complete Implementation Guide

## Overview

This guide provides all the necessary code and instructions to integrate Firebase into the artist profile system. The implementation includes:

- ✅ **Firebase Service Layer** - Image uploads and Firestore database operations
- ✅ **Form Integration Handler** - Converts form data to Firebase format
- ✅ **Multiple File Upload Component** - For gallery images
- ✅ **Complete Firebase Form Component** - Ready-to-use form with all features
- ✅ **Real-time Data Display** - Dashboard, browse, and detail pages
- ✅ **Error Handling & Notifications** - Toast messages and validation

---

## 📁 File Structure

### New Files Created

```
frontend/src/
├── lib/
│   ├── firebaseService.ts          ← Firebase CRUD operations (450+ lines)
│   ├── profileFormHandler.ts        ← Form integration helper (NEW)
│   └── api.ts
│
├── components/
│   ├── ArtistProfileFormFirebase.tsx ← Full Firebase form (NEW)
│   ├── FileUploadMultiple.tsx        ← Multi-file upload (NEW)
│   ├── FileUpload.tsx               ← Single file upload
│   ├── ArtistDashboardCard.tsx       ← Dashboard display
│   ├── ArtistPublicCard.tsx          ← Browse grid card
│   ├── TagsInput.tsx
│   ├── ToggleSwitch.tsx
│   └── ...
│
├── hooks/
│   └── useArtistProfile.ts          ← Data fetching hooks
│
├── app/
│   ├── artist/
│   │   ├── profile/
│   │   │   └── page.tsx             ← Form page
│   │   ├── dashboard/
│   │   │   └── page.tsx             ← Dashboard page
│   │   ├── [id]/
│   │   │   └── page.tsx             ← Detail page
│   └── browse-artists/
│       └── page.tsx
│
└── contexts/
    └── AuthContext.tsx
```

### Firestore Collection Structure

```
Firestore: "artists" collection
├── {uid} (document)
│   ├── uid: string
│   ├── fullName: string
│   ├── stageName: string
│   ├── email: string
│   ├── phone: string
│   ├── dateOfBirth?: string
│   ├── gender?: string
│   ├── profileImageUrl: string
│   ├── coverImageUrl: string
│   ├── category: "DJ" | "Band" | "Singer" | ...
│   ├── genres: string[]
│   ├── biography: string
│   ├── experience: number
│   ├── languages: string[]
│   ├── basePrice: number
│   ├── hourlyRate: number
│   ├── travelFee: number
│   ├── availableLocations: string[]
│   ├── availabilityStatus: boolean
│   ├── portfolioLinks: {
│   │   instagram?: string
│   │   youtube?: string
│   │   spotify?: string
│   │   facebook?: string
│   │   tiktok?: string
│   │   website?: string
│   │ }
│   ├── galleryImages: string[]
│   ├── profileCompleted: boolean
│   ├── status: "active"
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
```

### Firebase Storage Structure

```
Firebase Storage: "artists" bucket
├── artists/
│   ├── {uid}/
│   │   ├── profileImage-{timestamp}
│   │   ├── coverImage-{timestamp}
│   │   └── gallery/
│   │       ├── {timestamp}-{random}
│   │       ├── {timestamp}-{random}
│   │       └── ...
```

---

## 🔍 File Descriptions

### `frontend/src/lib/firebaseService.ts` (450+ lines)

**Purpose**: Central Firebase integration layer

**Key Functions**:
```typescript
// Upload image to Firebase Storage, return downloadURL
async uploadImageToStorage(file: File, path: string): Promise<string>

// Delete image from Firebase Storage
async deleteImageFromStorage(path: string): Promise<void>

// Save or update artist profile to Firestore
async saveArtistProfile(uid: string, profileData): Promise<ArtistProfile>

// Get single artist profile
async getArtistProfile(uid: string): Promise<ArtistProfile | null>

// Get all active artists (for browse page)
async getActiveArtists(): Promise<ArtistProfile[]>

// Filter artists by category
async getArtistsByCategory(category: string): Promise<ArtistProfile[]>

// Filter artists by genre
async getArtistsByGenre(genre: string): Promise<ArtistProfile[]>

// Update availability status
async updateArtistAvailability(uid: string, status: boolean): Promise<void>

// Client-side search in artists
function searchArtists(searchTerm: string, artists: ArtistProfile[]): ArtistProfile[]

// Get current logged-in user UID
function getCurrentUserUID(): string | null
```

**TypeScript Types**:
```typescript
interface ArtistProfile {
  uid: string;
  fullName: string;
  stageName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  profileImageUrl: string;
  coverImageUrl: string;
  category: "DJ" | "Band" | "Singer" | "Musician" | "Dancer" | "MC";
  genres: string[];
  biography: string;
  experience: number;
  languages: string[];
  basePrice: number;
  hourlyRate: number;
  travelFee: number;
  availableLocations: string[];
  availabilityStatus: boolean;
  portfolioLinks: { [key: string]: string };
  galleryImages: string[];
  profileCompleted: boolean;
  status: "active" | "inactive";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `frontend/src/lib/profileFormHandler.ts` (NEW - 180 lines)

**Purpose**: Connect form submission to Firebase

**Key Functions**:
```typescript
// Main function: uploads images and saves profile
async handleSaveProfile({
  uid: string,
  formData: {...},
  profileImage?: File,
  coverImage?: File,
  galleryFiles?: File[],
  onUploadProgress?: (progress: number) => void
}): Promise<ArtistProfile>

// Validate form before submission
function validateProfileForm(formData): string[]

// Pre-fill form with existing profile data
function createFormDataFromProfile(profile): FormData
```

**Features**:
- Uploads profile image (required)
- Uploads cover image (optional)
- Uploads multiple gallery images
- Tracks upload progress (0-100%)
- Validates all required fields
- Saves complete profile with timestamps
- Returns saved profile data
- Handles errors gracefully

### `frontend/src/components/ArtistProfileFormFirebase.tsx` (NEW - 900+ lines)

**Purpose**: Complete form component with Firebase integration

**Features**:
- 5 sections: Basic Info, Artist Details, Pricing, Portfolio, Terms
- Image uploads with progress tracking
- Real-time form validation
- Toast notifications (success/error)
- Redirect to dashboard on success
- Upload progress bar (0-100%)
- Responsive design (mobile-friendly)
- Field mapping to Firebase format
- Error handling with user messages

**Sections**:
1. **Basic Info** → fullName, stageName, email, phone, date, gender, profile/cover images
2. **Artist Details** → category, experience, biography, genres, languages
3. **Pricing** → basePrice, hourlyRate, travelFee, availability, locations
4. **Portfolio** → Instagram, YouTube, Spotify, Facebook, TikTok, website, gallery
5. **Terms** → Agree to terms checkbox

### `frontend/src/components/FileUploadMultiple.tsx` (NEW - 200 lines)

**Purpose**: Multi-file upload component for gallery

**Props**:
```typescript
interface FileUploadMultipleProps {
  label: string;                    // "Gallery Images (Optional)"
  accept: string;                   // "image/*"
  onFilesSelect: (files: File[]) => void;
  maxFiles?: number;                // Default: 10
  maxSize?: number;                 // Default: 10MB
  previews?: string[];              // For edit mode
}
```

**Features**:
- Multiple file selection
- Image previews in grid
- Remove individual files
- File size validation
- File count display
- Drag & drop support
- Progress indicators
- Error messages

---

## 🚀 Integration Instructions

### Step 1: Install Dependencies
```bash
npm install react-hot-toast
```

### Step 2: Add Toast Provider
**File**: `frontend/src/app/layout.tsx`

```typescript
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            success: { style: { background: '#10b981' } },
            error: { style: { background: '#ef4444' } },
          }}
        />
      </body>
    </html>
  );
}
```

### Step 3: Choose Integration Approach

#### Option A: Replace Existing Form (Recommended)
1. Rename `ArtistProfileFormFirebase.tsx` to `ArtistProfileForm.tsx`
2. Replace the exported function name from `ArtistProfileFormFirebase` to `ArtistProfileForm`
3. Update the import in `frontend/src/app/artist/profile/page.tsx` to use the updated component

#### Option B: Keep Both
1. Keep `ArtistProfileFormFirebase.tsx` as new form
2. Keep `ArtistProfileForm.tsx` as legacy form
3. Update `frontend/src/app/artist/profile/page.tsx`:
```typescript
// Change from:
import { ArtistProfileForm } from "@/components/ArtistProfileForm";

// To:
import { ArtistProfileFormFirebase } from "@/components/ArtistProfileFormFirebase";

export default function ArtistProfilePage() {
  return <ArtistProfileFormFirebase onSubmitSuccess={() => undefined} />;
}
```

### Step 4: Test the Flow

1. **Navigate** to `/artist/profile`
2. **Fill out** the form
3. **Upload** images
4. **Submit** the form
5. **Verify** toast notification
6. **Check** redirect to `/artist/dashboard`
7. **Verify** data in Firestore console
8. **Verify** images in Storage console

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────┐
│   Artist Profile Page       │
│   /artist/profile           │
└──────────────┬──────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  ArtistProfileFormFirebase Component    │
│  - Form state management                │
│  - Image upload handlers                │
│  - Validation                           │
└──────────────┬──────────────────────────┘
               │
      (onSubmit: handleSubmit)
               │
               ↓
┌─────────────────────────────────────────┐
│  profileFormHandler.handleSaveProfile() │
│  - Validate form data                   │
│  - Upload images to Firebase Storage    │
│  - Get down loadURLs                    │
│  - Call saveArtistProfile()             │
└──────────────┬──────────────────────────┘
               │
               ├─────────────────────┐
               │                     │
               ↓                     ↓
    ┌──────────────────┐   ┌────────────────────┐
    │ Firebase Storage │   │ Firestore Database │
    │ (Images)         │   │ (Profile Doc)      │
    └──────────────────┘   └────────────────────┘
               │                     │
               └─────────────────────┘
                       │
                       ↓
            ┌──────────────────────┐
            │ Toast Notification   │
            │ "Profile saved!"     │
            └──────┬───────────────┘
                   │
                   ↓
            ┌─────────────────────────┐
            │ Redirect to Dashboard   │
            │ /artist/dashboard       │
            └─────────────────────────┘
```

---

## 🔒 Firebase Firestore Security Rules

Minimum required rules for the form to work:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own profile
    match /artists/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    
    // Allow anyone to read active, completed profiles (for browsing)
    match /artists/{uid} {
      allow read: if resource.data.status == "active" 
                     && resource.data.profileCompleted == true;
    }
  }
}
```

---

## 🔐 Firebase Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload to their folder
    match /artists/{uid}/{allPaths=**} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

---

## 🧪 Testing Checklist

- [ ] Can fill out form (all sections)
- [ ] Profile image upload works
- [ ] Cover image upload works
- [ ] Gallery images upload works
- [ ] Form validation catches errors
- [ ] Form validation error messages display
- [ ] Submit button shows loading state
- [ ] Upload progress bar appears
- [ ] Toast notification shows "Uploading images..."
- [ ] Toast notification shows "Profile saved!"
- [ ] Redirects to `/artist/dashboard` after 2 seconds
- [ ] Dashboard displays all saved data
- [ ] Dashboard shows uploaded images
- [ ] Images display correctly (sizes, quality)
- [ ] Can search for profile in `/browse-artists`
- [ ] Can view profile in `/artist/[id]` detail page
- [ ] All images load on detail page
- [ ] Portfolio links are clickable
- [ ] Data persists after page refresh
- [ ] Edit button on dashboard works

---

## 🐛 Common Issues & Solutions

### Issue: "User not authenticated"
- **Cause**: User not logged in
- **Solution**: Ensure user is logged in before accessing profile form

### Issue: Images not uploading
- **Cause**: Firebase Storage permissions
- **Solution**: Check Firebase Storage rules, ensure authenticated uploads allowed

### Issue: Data not saving to Firestore
- **Cause**: Firestore permissions or validation fails
- **Solution**: Check form validation, check Firestore rules, verify user UID

### Issue: Redirect not working
- **Cause**: Navigation issue or route missing
- **Solution**: Verify `/artist/dashboard` exists, check browser console

### Issue: Toast not showing
- **Cause**: Toaster not in layout
- **Solution**: Verify `<Toaster />` is in `layout.tsx`

### Issue: Form shows old data
- **Cause**: Cache or stale state
- **Solution**: Clear browser cache, refresh page, or logout/login

---

## 📚 Related Documentation

- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [React Hot Toast Documentation](https://react-hot-toast.com/)
- [Next.js Image Optimization](https://nextjs.org/docs/api-reference/next/image)

---

## 🎯 Success Criteria

Your integration is **success** when:

1. ✅ Form submits without errors
2. ✅ Images upload to Firebase Storage
3. ✅ Profile data saves to Firestore
4. ✅ Toast notifications appear
5. ✅ Page redirects to dashboard
6. ✅ Dashboard displays all profile data
7. ✅ Profile appears in browse page
8. ✅ Detail page loads correctly

---

## 🚀 Next Steps

After successful integration:

1. **Set up Booking System**
   - Create bookings collection
   - Build booking request form
   - Send email notifications

2. **Add Ratings & Reviews**
   - Create reviews collection
   - Build review submission form
   - Display ratings on detail page

3. **Implement Payment Processing**
   - Integrate Stripe
   - Handle payment validation
   - Update booking status

4. **Email Notifications**
   - Send profile creation confirmation
   - Send booking requests
   - Send review notifications

5. **Analytics**
   - Track profile views
   - Track booking requests
   - Monitor popular artists

---

## 📞 Support

For issues with:
- **Firebase**: Check [Firebase Documentation](https://firebase.google.com/docs)
- **React**: Check [React Documentation](https://react.dev)
- **Next.js**: Check [Next.js Documentation](https://nextjs.org/docs)
- **Form validation**: Check `validateProfileForm()` in `profileFormHandler.ts`

