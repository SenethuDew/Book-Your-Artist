# Firebase Integration for ArtistProfileForm

## Overview
The existing ArtistProfileForm component needs to be updated to use Firebase functions instead of the MongoDB API endpoint. This guide shows the minimal changes required.

## Current Form State
**File**: `frontend/src/components/ArtistProfileForm.tsx`
- Uses `/api/artists/profile` endpoint (MongoDB)
- Manages form data, images, and validation
- Has `handleSubmit` function that sends data to backend

## Integration Strategy

### Option 1: Direct Integration (Recommended)

Replace the entire `handleSubmit` function with Firebase logic:

```typescript
// In ArtistProfileForm.tsx
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast'; // You'll need to install this
import { getAuth } from 'firebase/auth';
import { handleSaveProfile, validateProfileForm } from '@/lib/profileFormHandler';

export function ArtistProfileForm({ onSubmitSuccess }: ArtistProfileFormProps) {
  const router = useRouter();
  const auth = getAuth();

  // Map form fields to Firebase ArtistProfile format
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate using Firebase validation function
    const validationErrors = validateProfileForm(formData);
    if (validationErrors.length > 0) {
      setErrors({ submit: validationErrors.join('. ') });
      return;
    }

    try {
      setLoading(true);
      
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Map form data to Firebase ArtistProfile format
      const firebaseFormData = {
        fullName: formData.fullName,
        stageName: formData.stageName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        category: formData.artistType, // Map artistType to category
        genres: formData.genres,
        biography: formData.biography,
        experience: formData.yearsOfExperience,
        languages: formData.languages,
        basePrice: formData.basePrice,
        hourlyRate: formData.hourlyRate,
        travelFee: formData.travelFee,
        availableLocations: formData.availableLocations,
        availabilityStatus: formData.currentlyAvailable,
        portfolioLinks: {
          instagram: formData.instagramUrl,
          youtube: formData.youtubeUrl,
          spotify: formData.spotifyUrl,
          facebook: formData.facebookUrl,
          tiktok: formData.tiktokUrl,
          website: formData.websiteUrl,
        },
      };

      // Call Firebase handler with images and form data
      const savedProfile = await handleSaveProfile({
        uid: user.uid,
        formData: firebaseFormData,
        profileImage, // From your state
        coverImage,   // From your state
        galleryFiles: galleryImages, // From your state
        onUploadProgress: (progress) => {
          console.log(`Upload progress: ${progress}%`);
        },
      });

      // Success feedback
      toast.success('✓ Profile saved successfully!');
      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        setSuccess(false);
        router.push('/artist/dashboard');
        onSubmitSuccess?.();
      }, 2000);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save profile';
      toast.error(`✕ ${errorMsg}`);
      setErrors({ submit: errorMsg });
    } finally {
      setLoading(false);
    }
  };
```

### Option 2: Hybrid Approach (Keep existing + Add Firebase)

If you want to keep MongoDB support while adding Firebase as an option:

```typescript
const [useFirebase, setUseFirebase] = useState(true);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (useFirebase) {
    // Firebase logic here
  } else {
    // Existing MongoDB logic
  }
};
```

## Required Changes Checklist

### 1. **Install React Hot Toast** (for notifications)
```bash
npm install react-hot-toast
```

### 2. **Update Imports in ArtistProfileForm.tsx**
```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import toast from 'react-hot-toast';
import { getAuth } from 'firebase/auth';
import { 
  handleSaveProfile, 
  validateProfileForm,
  createFormDataFromProfile 
} from '@/lib/profileFormHandler';
import { FileUpload } from "./FileUpload";
import { TagsInput } from "./TagsInput";
import { ToggleSwitch } from "./ToggleSwitch";
```

### 3. **Add Toast Container** (in layout or app)
```typescript
// frontend/src/app/layout.tsx
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
```

### 4. **Update Form Data Mapping**

The existing form uses different field names than Firebase. Map them:

| MongoDB Form | Firebase |
|-------------|----------|
| `artistType` | `category` |
| `yearsOfExperience` | `experience` |
| `currentlyAvailable` | `availabilityStatus` |
| `instagramUrl` | `portfolioLinks.instagram` |
| `youtubeUrl` | `portfolioLinks.youtube` |
| `spotifyUrl` | `portfolioLinks.spotify` |
| `facebookUrl` | `portfolioLinks.facebook` |
| `tiktokUrl` | `portfolioLinks.tiktok` |
| `websiteUrl` | `portfolioLinks.website` |

### 5. **Load Existing Profile** (Optional - for editing)

```typescript
const { profile, loading: profileLoading, refetch } = useArtistProfile();

useEffect(() => {
  if (profile && !formData.fullName) {
    // Pre-fill form with existing profile data
    setFormData(prev => ({
      ...prev,
      fullName: profile.fullName,
      stageName: profile.stageName,
      // ... map all other fields
    }));
  }
}, [profile]);
```

## File Structure

After integration, you'll have:

```
frontend/src/
├── lib/
│   ├── firebaseService.ts   (Firebase operations - 450+ lines)
│   ├── profileFormHandler.ts (NEW - Form integration - 180+ lines)
│   └── api.ts               (Keep for other APIs)
├── components/
│   ├── ArtistProfileForm.tsx (UPDATED - handleSubmit + imports)
│   ├── ArtistDashboardCard.tsx
│   ├── ArtistPublicCard.tsx
│   ├── FileUpload.tsx
│   └── ...
├── hooks/
│   └── useArtistProfile.ts   (For loading existing profile)
├── contexts/
│   └── AuthContext.tsx       (For auth state)
└── app/
    ├── artist/
    │   ├── profile/
    │   │   └── page.tsx      (Uses ArtistProfileForm)
    │   ├── dashboard/
    │   │   └── page.tsx      (Shows ArtistDashboardCard)
    │   ├── [id]/
    │   │   └── page.tsx      (Shows ArtistDetailPage)
    └── browse-artists/
        └── page.tsx          (Shows ArtistPublicCard grid)
```

## Error Handling

The `handleSaveProfile` function includes:
- Image upload error handling (specific file, continues with others)
- Firebase authentication checks
- Firestore write error handling
- Progress tracking for multi-file uploads

UI updates:
```typescript
catch (error) {
  const errorMsg = error instanceof Error ? error.message : 'Failed to save profile';
  toast.error(`✕ ${errorMsg}`);
  setErrors({ submit: errorMsg });
}
finally {
  setLoading(false);
}
```

## Form Validation

The `validateProfileForm` function checks:
- Required fields: fullName, stageName, email, phone, category, biography, genres
- Email format validation
- Phone number format (at least 10 digits)
- Price validation (> 0)
- Experience validation

Use it before calling `handleSaveProfile`:
```typescript
const validationErrors = validateProfileForm(firebaseFormData);
if (validationErrors.length > 0) {
  setErrors({ submit: validationErrors.join('. ') });
  return;
}
```

## Testing Checklist

- [ ] Install react-hot-toast
- [ ] Update ArtistProfileForm imports
- [ ] Replace handleSubmit function
- [ ] Test profile image upload
- [ ] Test cover image upload
- [ ] Test gallery images upload
- [ ] Test form validation
- [ ] Test redirect to dashboard
- [ ] Test toast notifications
- [ ] Test pre-filling form with existing profile
- [ ] Verify Firestore data structure
- [ ] Verify Firebase Storage images

## Next Steps

1. **Install Dependencies**
   ```bash
   npm install react-hot-toast
   ```

2. **Update ArtistProfileForm.tsx**
   - Add imports
   - Replace handleSubmit
   - Test with Firebase

3. **Add Toaster to Layout**
   - In `frontend/src/app/layout.tsx`
   - Add `<Toaster />` component

4. **Test Complete Flow**
   - Fill form → Upload images → Save to Firebase → Toast → Redirect

## Reference: Complete Handler Function

The `handleSaveProfile` function signature:
```typescript
export async function handleSaveProfile({
  uid: string;
  formData: {
    fullName: string;
    stageName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    gender?: string;
    category: string;
    genres: string[];
    biography: string;
    experience: number;
    languages: string[];
    basePrice: number;
    hourlyRate: number;
    travelFee: number;
    availableLocations: string[];
    availabilityStatus: boolean;
    portfolioLinks: {
      instagram?: string;
      youtube?: string;
      spotify?: string;
      facebook?: string;
      tiktok?: string;
      website?: string;
    };
    galleryImages?: string[];
  };
  profileImage?: File;
  coverImage?: File;
  galleryFiles?: File[];
  onUploadProgress?: (progress: number) => void;
}): Promise<ArtistProfile>
```

Returns the saved `ArtistProfile` object from Firestore with all fields including timestamps.
