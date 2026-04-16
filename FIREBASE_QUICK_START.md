# Firebase Form Integration - Quick Start Checklist

## 📋 Implementation Steps

### Step 1: Install Dependencies
```bash
cd frontend
npm install react-hot-toast
```

### Step 2: Add Toaster to Layout (1 minute)

**File**: `frontend/src/app/layout.tsx`

Add these imports at the top:
```typescript
import { Toaster } from 'react-hot-toast';
```

Add `<Toaster />` in the return statement:
```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Toaster 
          position="bottom-right"
          reverseOrder={false}
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

### Step 3: Update ArtistProfileForm Component (5-10 minutes)

Choose one approach:

#### Option A: Replace Existing Form (Full Firebase)

1. **Open**: `frontend/src/components/ArtistProfileForm.tsx`
2. **Replace entire file** with the code from `ArtistProfileFormFirebase.tsx`
3. **Rename** the exported function from `ArtistProfileFormFirebase` to `ArtistProfileForm`
4. **Rename** the file to `ArtistProfileForm.tsx`

```bash
# Terminal commands (if using Windows):
# 1. Backup existing file (optional)
# copy frontend\src\components\ArtistProfileForm.tsx frontend\src\components\ArtistProfileForm.backup.tsx

# 2. Replace with Firebase version
# copy frontend\src\components\ArtistProfileFormFirebase.tsx frontend\src\components\ArtistProfileForm.tsx
```

#### Option B: Keep Both (Dual Support)

1. Keep the original `ArtistProfileForm.tsx` (MongoDB)
2. Keep the new `ArtistProfileFormFirebase.tsx` (Firebase)
3. In `frontend/src/app/artist/profile/page.tsx`, import and use `ArtistProfileFormFirebase` instead of `ArtistProfileForm`

```typescript
// frontend/src/app/artist/profile/page.tsx
import { ArtistProfileFormFirebase } from "@/components/ArtistProfileFormFirebase";

export default function ArtistProfilePage() {
  return (
    <div>
      <ArtistProfileFormFirebase 
        onSubmitSuccess={() => console.log('Profile saved!')}
      />
    </div>
  );
}
```

### Step 4: Test the Integration (5-10 minutes)

#### Test Checklist:
- [ ] Fill out basic info section
- [ ] Upload profile image (required)
- [ ] Fill out artist details (category, genres, bio)
- [ ] Add pricing information
- [ ] Add portfolio links
- [ ] Check "I agree to terms"
- [ ] Click "Save Profile"
- [ ] Verify toast notification shows "Uploading images..."
- [ ] Verify upload progress bar appears
- [ ] Verify success toast shows "Profile saved successfully!"
- [ ] Verify redirect to `/artist/dashboard`
- [ ] Check Firestore console to verify data was saved

#### In Firestore Console:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Firestore Database
4. Check `artists` collection
5. Verify new document was created with user UID as ID
6. Verify all fields are present: fullName, stageName, email, phone, category, genres, basePrice, hourlyRate, profileImageUrl, etc.

#### In Firebase Storage:
1. Go to Storage in Firebase Console
2. Look for folder: `artists/{uid}/`
3. Verify files exist:
   - `profileImage-{timestamp}`
   - `coverImage-{timestamp}` (if uploaded)
   - `gallery/{timestamp}-{random}`files (if added)

### Step 5: Verify Routes Work (2-5 minutes)

Test that the complete flow works:

1. **Profile Form** (`/artist/profile`)
   - [ ] Form loads
   - [ ] Can edit all fields
   - [ ] Validation works
   - [ ] Can save successfully

2. **Dashboard** (`/artist/dashboard`)
   - [ ] Redirects from form
   - [ ] Shows saved profile with all data
   - [ ] Shows uploaded images
   - [ ] Can click "Edit Profile" to go back to form

3. **Public Browse** (`/browse-artists`)
   - [ ] Form data appears in browse results
   - [ ] Can search for saved profile
   - [ ] Can filter by category/genre

4. **Detail Page** (`/artist/[id]`)
   - [ ] Can click card to view detail page
   - [ ] All profile information displays
   - [ ] Images load correctly
   - [ ] Links work

---

## 🔍 Troubleshooting Guide

### Issue: Toast notifications not showing

**Solution**: 
1. Verify `<Toaster />` is in `layout.tsx`
2. Check browser console for errors
3. Verify `react-hot-toast` is installed

### Issue: Images not uploading

**Possible causes**:
- Firebase Storage rules don't allow uploads
- File size too large
- User not authenticated

**Solution**:
1. Check Firebase Storage rules (should allow authenticated users)
2. Check browser network tab for upload errors
3. Verify user is logged in via Firebase Auth

### Issue: Data not saving to Firestore

**Possible causes**:
- Firestore rules don't allow writes
- User UID is incorrect
- Validation failed

**Solution**:
1. Check Firestore security rules
2. Check browser console for error message
3. Verify form passes validation

### Issue: Form validation not working

**Debug**:
```typescript
// Add console.log in handleSubmit:
console.log('Form data:', formData);
console.log('Validation errors:', validationErrors);
```

### Issue: Redirect not working

**Solution**:
1. Verify `useRouter` from `'next/navigation'` is imported
2. Check that `/artist/dashboard` page exists
3. Check browser console for navigation errors

---

## 📁 File Structure After Integration

```
frontend/src/
├── lib/
│   ├── firebaseService.ts        ← Firebase operations (USE EXISTING)
│   ├── profileFormHandler.ts      ← NEW form integration helper
│   └── api.ts                     ← Keep existing
│
├── components/
│   ├── ArtistProfileForm.tsx      ← UPDATED (can be replaced or new name)
│   ├── ArtistDashboardCard.tsx    ← USE EXISTING
│   ├── ArtistPublicCard.tsx       ← USE EXISTING
│   ├── FileUpload.tsx             ← Keep existing
│   ├── TagsInput.tsx              ← Keep existing
│   └── ToggleSwitch.tsx           ← Keep existing
│
├── app/
│   ├── artist/
│   │   ├── profile/
│   │   │   └── page.tsx           ← Uses ArtistProfileForm
│   │   ├── dashboard/
│   │   │   └── page.tsx           ← Uses ArtistDashboardCard
│   │   └── [id]/
│   │       └── page.tsx           ← Shows detail page
│   └── browse-artists/
│       └── page.tsx               ← Use existing
│
└── hooks/
    └── useArtistProfile.ts        ← USE EXISTING
```

---

## 🚀 Quick Start (Copy-Paste)

If you want the absolute quickest path:

### 1. Install toast:
```bash
npm install react-hot-toast
```

### 2. Add to layout.tsx:
```typescript
import { Toaster } from 'react-hot-toast';
// ... in return:
<Toaster position="bottom-right" />
```

### 3. Replace ArtistProfileForm implementation:
Replace the entire `handleSubmit` function with:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const toastId = toast.loading("Saving your profile...");

    const savedProfile = await handleSaveProfile({
      uid: currentUser.uid,
      formData: {
        fullName: formData.fullName,
        stageName: formData.stageName,
        email: formData.email,
        phone: formData.phone,
        category: formData.artistType,
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
      },
      profileImage,
      coverImage: coverImage || undefined,
      galleryFiles: galleryImages.length > 0 ? galleryImages : undefined,
    });

    toast.success("✓ Profile saved! Redirecting...", { id: toastId });
    setTimeout(() => router.push("/artist/dashboard"), 2000);

  } catch (error) {
    toast.error(`✕ ${error instanceof Error ? error.message : 'Failed to save'}`);
  } finally {
    setLoading(false);
  }
};
```

### 4. Add imports:
```typescript
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getAuth } from "firebase/auth";
import { handleSaveProfile } from "@/lib/profileFormHandler";
```

---

## 📊 Expected Flow After Integration

```
User fills form
    ↓
Clicks "Save Profile"
    ↓
[Validation] ← Checks all required fields
    ↓
Gets Firebase auth user (UID)
    ↓
Uploads profile image to Storage
    ↓
Uploads cover image to Storage (if provided)
    ↓
Uploads gallery images to Storage (if provided)
    ↓
Saves all data to Firestore /artists/{uid}
    ↓
Shows success toast
    ↓
Wait 2 seconds
    ↓
Redirect to /artist/dashboard
    ↓
Dashboard loads from Firestore
    ↓
Shows complete profile with images
```

---

## ✅ Verification Checklist

After integration:

- [ ] Firebase dependencies installed
- [ ] Toaster added to layout
- [ ] Form handleSubmit updated
- [ ] Can submit form without errors
- [ ] Toast notifications appear
- [ ] Data saves to Firestore
- [ ] Images save to Storage
- [ ] Redirect to dashboard works
- [ ] Dashboard shows saved data
- [ ] Browse page can find new profile
- [ ] Detail page loads profile

---

## 🆘 Need Help?

If you encounter issues:

1. **Check browser console** for errors (`F12` → Console tab)
2. **Check Firebase console** for rule/security issues
3. **Verify auth user** is logged in
4. **Test Firestore access** with simple read/write
5. **Check Storage rules** allow authenticated uploads

Common error messages and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "User not authenticated" | User not logged in | Login first, check auth state |
| "Failed to save profile" | Firestore rules block write | Update Firestore security rules |
| "Permission denied" | No Storage upload permission | Update Storage security rules |
| "File size too large" | Image exceeds limit | Compress image before upload |
| "Redirect failed" | Route doesn't exist | Verify `/artist/dashboard` exists |

---

## 📝 Next Steps

1. ✅ Complete the checklist above
2. ✅ Test the complete flow
3. ✅ Check Firestore/Storage for data
4. ✅ Verify all routes work
5. Consider adding:
   - [ ] Email verification
   - [ ] Booking system
   - [ ] Payment processing
   - [ ] Admin approval workflow
   - [ ] Profile editing
   - [ ] Image cropping

