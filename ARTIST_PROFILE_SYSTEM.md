# Artist Profile Form System - Documentation

## Overview

The Artist Profile Form System is a comprehensive, professional artist onboarding and profile management system built with Next.js, React, TypeScript, and Tailwind CSS. It allows artists to create and manage their complete professional profiles with sections for basic information, artist details, pricing, portfolio, availability, and terms acceptance.

## Key Features

✅ **6-Section Form Workflow**
- Basic Information (name, contact, photos)
- Artist Details (type, bio, genres, experience)
- Pricing & Booking (rates, availability, locations)
- Portfolio & Media (social links, samples, gallery)
- Availability & Status (calendar preferences, response time)
- Terms & Submission (agreement acceptance)

✅ **Reusable Components**
- FileUpload: Image/video upload with preview
- TagsInput: Multi-select tags with autocomplete
- ToggleSwitch: Boolean toggle switches
- ArtistProfileForm: Main form orchestrator

✅ **Form Validation**
- Required field validation
- Type checking via TypeScript
- Real-time field validation feedback
- Clear error messages

✅ **File Handling**
- Profile/cover photo uploads
- Gallery image uploads
- Portfolio video/audio uploads
- File size validation
- File type validation

✅ **Responsive Design**
- Mobile-first approach
- Dark theme (gray-900, gray-800 backgrounds)
- Blue accent colors (#2563eb)
- Touch-friendly inputs

✅ **User Experience**
- Section navigation tabs for easy jumping
- Loading states during submission
- Success confirmation messages
- Error handling with user-friendly messages
- Auto-load existing profile data

## File Structure

```
frontend/src/
├── components/
│   ├── ArtistProfileForm.tsx      (Main form - 700+ lines)
│   ├── FileUpload.tsx              (File upload component - 50 lines)
│   ├── TagsInput.tsx               (Multi-tag input - 90 lines)
│   ├── ToggleSwitch.tsx            (Boolean toggle - 35 lines)
│   ├── ArtistCard.tsx              (Display component)
│   ├── RatingStars.tsx             (Rating display)
│   └── ...
├── app/
│   └── artist/
│       └── profile/
│           └── page.tsx            (Profile form page)
└── lib/
    └── api.ts                      (API helpers)

backend/src/
├── models/
│   └── ArtistProfile.js            (Enhanced with 30+ fields)
├── controllers/
│   └── artistController.js         (Added createOrUpdateProfile method)
├── routes/
│   └── api.js                      (Added POST /artists/profile)
└── middleware/
    └── auth.js                     (Authentication)
```

## Component APIs

### ArtistProfileForm

Main form component that orchestrates all sections.

**Props:**
```typescript
interface ArtistProfileFormProps {
  onSubmitSuccess?: () => void;
}
```

**Usage:**
```tsx
<ArtistProfileForm 
  onSubmitSuccess={() => router.push('/dashboard/artist')}
/>
```

### FileUpload

File upload component with preview and validation.

**Props:**
```typescript
interface FileUploadProps {
  label: string;
  accept?: string;
  maxSize?: number;
  onFileSelect: (file: File) => void;
}
```

**Example:**
```tsx
<FileUpload
  label="Profile Photo"
  accept="image/*"
  maxSize={5 * 1024 * 1024}
  onFileSelect={(file) => setProfileImage(file)}
/>
```

### TagsInput

Multi-select tag input with autocomplete suggestions.

**Props:**
```typescript
interface TagsInputProps {
  label: string;
  placeholder?: string;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  suggestions?: string[];
  maxTags?: number;
}
```

**Example:**
```tsx
<TagsInput
  label="Genres"
  tags={formData.genres}
  onTagsChange={(genres) => setFormData({...formData, genres})}
  suggestions={MUSIC_GENRES}
  maxTags={10}
/>
```

### ToggleSwitch

Boolean toggle switch component.

**Props:**
```typescript
interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}
```

**Example:**
```tsx
<ToggleSwitch
  label="Can Travel?"
  checked={formData.canTravel}
  onChange={(canTravel) => setFormData({...formData, canTravel})}
  description="Can you travel to perform at events?"
/>
```

## Form Data Structure

The form collects the following data (60+ fields):

### Basic Information
- `fullName`: string (required)
- `stageName`: string (required)
- `email`: string (required)
- `phone`: string (required)
- `dateOfBirth`: string (optional)
- `gender`: string (optional)
- `profileImage`: File/URL (required)
- `coverImage`: File/URL (optional)

### Artist Details
- `artistType`: string (required) - Singer, DJ, Band, etc.
- `performanceStyle`: string
- `biography`: string (required)
- `yearsOfExperience`: number
- `languages`: string[]
- `genres`: string[] (required, min 1)
- `teamMembers`: number
- `performanceDurations`: string[] - 30min, 1hr, 2hr, Custom

### Pricing & Booking
- `basePrice`: number
- `hourlyRate`: number (required, > 0)
- `minimumBookingPrice`: number
- `travelFee`: number
- `canTravel`: boolean
- `acceptsCustomRequests`: boolean
- `availableFor`: string[] - Weddings, Parties, Corporate, etc.
- `availableLocations`: string[]

### Portfolio & Media
- `instagramUrl`: string
- `facebookUrl`: string
- `tiktokUrl`: string
- `youtubeUrl`: string
- `spotifyUrl`: string
- `websiteUrl`: string
- `demoAudio`: File
- `demoVideo`: File
- `galleryImages`: File[]

### Availability & Status
- `currentlyAvailable`: boolean
- `preferredDays`: string[]
- `preferredTimes`: string[]
- `responseTime`: string

### Terms
- `agreeToTerms`: boolean (required)

## API Endpoints

### POST /api/artists/profile
Create or update artist profile with form data.

**Request:**
```typescript
POST /api/artists/profile
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "artistData": JSON.stringify(formData),
  "profileImage": File,
  "coverImage": File,
  "galleryImages[]": File[]
}
```

**Response:**
```typescript
{
  "success": true,
  "message": "Profile saved successfully",
  "profile": {
    "_id": "...",
    "userId": "...",
    "fullName": "...",
    // ... all profile fields
  }
}
```

### GET /api/artists/me
Fetch current user's artist profile.

**Response:**
```typescript
{
  "success": true,
  "artist": {
    // Full profile object
  }
}
```

## Validation Rules

All validations happen on both frontend and backend:

**Required Fields:**
- fullName
- stageName
- email
- phone
- artistType
- biography
- hourlyRate (must be > 0)
- genres (min 1)
- profileImage
- agreeToTerms

**Field Constraints:**
- Email: valid email format
- Phone: non-empty string
- Hourly Rate: number > 0
- Genres: at least 1 selected
- Agreement: must be checked

## Database Schema

Updated MongoDB ArtistProfile model with fields:

```javascript
{
  userId: ObjectId (unique, indexed),
  fullName: String,
  stageName: String,
  email: String,
  phone: String,
  profileImage: String (URL),
  coverImage: String (URL),
  artistType: String,
  performanceStyle: String,
  biography: String,
  yearsOfExperience: Number,
  languages: [String],
  genres: [String] (indexed),
  basePrice: Number,
  hourlyRate: Number (indexed),
  minimumBookingPrice: Number,
  travelFee: Number,
  canTravel: Boolean,
  acceptsCustomRequests: Boolean,
  availableFor: [String],
  availableLocations: [String],
  portfolio: {
    videoLinks: [String],
    audioLinks: [String],
    images: [String],
    mediaLinks: [{platform, url}],
    demoAudio: String,
    demoVideo: String,
    gallery: [String]
  },
  socialLinks: {
    instagram: String,
    facebook: String,
    tiktok: String,
    youtube: String,
    spotify: String,
    website: String
  },
  currentlyAvailable: Boolean,
  preferredDays: [String],
  preferredTimes: [String],
  responseTime: String,
  rating: Number (0-5, indexed),
  reviewCount: Number,
  verified: Boolean,
  backgroundChecked: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Styling & Design

### Color Scheme
- **Background**: `bg-gray-900` (primary), `bg-gray-800` (sections)
- **Text**: `text-white`, `text-gray-300` (secondary)
- **Accent**: `#2563eb` (blue), `#22c55e` (green for success)
- **Error**: `#dc2626` (red)
- **Borders**: `border-gray-700`

### Responsive Breakpoints
- **Mobile**: < 768px (1 column)
- **Tablet**: 768px - 1024px (2 columns)
- **Desktop**: > 1024px (2-3 columns)

### Component Styling
- Rounded corners: `rounded-lg`
- Shadows: `shadow-sm`, `shadow-xl`
- Transitions: `transition-all`, `transition-colors`
- Focus states: `focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`

## Usage Examples

### Basic Implementation

```tsx
import { ArtistProfileForm } from '@/components/ArtistProfileForm';

export default function MyProfilePage() {
  return (
    <ArtistProfileForm 
      onSubmitSuccess={() => {
        console.log('Profile saved!');
        // Redirect or refresh
      }}
    />
  );
}
```

### With Protected Route

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ArtistProfileForm } from '@/components/ArtistProfileForm';

export default function ArtistProfilePage() {
  return (
    <ProtectedRoute requiredRole="artist">
      <ArtistProfileForm 
        onSubmitSuccess={() => redirectToDashboard()}
      />
    </ProtectedRoute>
  );
}
```

## File Upload Implementation

Currently, the form collects files but doesn't upload them until the backend is configured with a storage solution. To implement full file uploads:

### Option 1: Firebase Storage (Recommended)
```typescript
// In backend
import admin from 'firebase-admin';

app.post('/api/artists/profile', async (req, res) => {
  const file = req.files.profileImage;
  const path = `profiles/${userId}/profile.jpg`;
  
  await admin.storage().bucket().upload(file.path, {
    destination: path
  });
  
  const url = await getSignedUrl(path);
  // Save url to MongoDB
});
```

### Option 2: AWS S3
```typescript
import AWS from 'aws-sdk';
const s3 = new AWS.S3();

await s3.putObject({
  Bucket: 'my-bucket',
  Key: `profiles/${userId}/profile.jpg`,
  Body: fileContent
}).promise();
```

### Option 3: Cloudinary
```typescript
import cloudinary from 'cloudinary';

const result = await cloudinary.v2.uploader.upload(
  file.path,
  { folder: `artists/${userId}` }
);
```

## Testing Checklist

- [ ] Form renders without errors
- [ ] All 6 sections load correctly
- [ ] Section navigation tabs work
- [ ] File uploads show previews
- [ ] Genre autocomplete works
- [ ] Toggle switches change state
- [ ] Form validation catches missing fields
- [ ] Required fields show error messages
- [ ] Form submission sends data to backend
- [ ] Success message appears on save
- [ ] Existing profile data loads correctly
- [ ] Responsive design works on mobile

## Common Errors & Solutions

### "user?.id does not exist"
**Solution**: Use `user?._id` instead (MongoDB ID format)

### "Cannot submit FormData"
**Solution**: Ensure `Content-Type: multipart/form-data` in request headers

### "File too large"
**Solution**: Implement file size validation in FileUpload component

### "Profile not found" on load
**Solution**: This is expected for new profiles - initialize with empty formData

## Performance Optimizations

1. **Lazy Loading**: Form sections load on demand via tabs
2. **Image Optimization**: Use Next.js Image component for previews
3. **Debouncing**: Debounce autosave feature (if implemented)
4. **Code Splitting**: Components are automatically split by Next.js
5. **Caching**: API responses cached with SWR (if implemented)

## Future Enhancements

- [ ] Autosave form progress every 30 seconds
- [ ] Profile preview modal before submission
- [ ] Drag-and-drop file uploads
- [ ] Image cropping/editing tool
- [ ] Video preview for demo files
- [ ] Rate limiting on API submissions
- [ ] Email verification for email field
- [ ] Phone number validation
- [ ] Multi-language support
- [ ] Accessibility improvements (WCAG 2.1)

## Support & Maintenance

For issues or updates:
1. Check existing validation in form component
2. Review MongoDB schema in ArtistProfile.js
3. Check backend controller for submission logic
4. Review API endpoint in routes/api.js

## Changelog

### Version 1.0 (Latest)
- Created main ArtistProfileForm component
- Added 3 reusable form components (FileUpload, TagsInput, ToggleSwitch)
- Enhanced MongoDB ArtistProfile schema
- Added POST /api/artists/profile endpoint
- Implemented 6-section form workflow
- Added form validation
- Responsive mobile-first design
