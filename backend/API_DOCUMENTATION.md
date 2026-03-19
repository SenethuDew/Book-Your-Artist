# Book-Your-Artist API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## AUTH ENDPOINTS

### Register
**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "client" // or "artist"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "client",
    "status": "active"
  }
}
```

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "client",
    "status": "active"
  }
}
```

### Get Current User
**GET** `/auth/me` (Protected)

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "client",
    "status": "active"
  }
}
```

### Logout
**POST** `/auth/logout` (Protected)

---

## ARTIST ENDPOINTS (Browse & Search)

### Get Genres
**GET** `/artists/genres`

**Response:**
```json
{
  "success": true,
  "genres": ["Jazz", "Classical", "Pop", "Rock", "Hip-Hop", "Electronic"]
}
```

### Get Price Stats
**GET** `/artists/price-stats`

**Response:**
```json
{
  "success": true,
  "priceStats": {
    "min": 50,
    "max": 500,
    "average": 150
  }
}
```

### Get Featured Artists
**GET** `/artists/featured?limit=6`

**Response:**
```json
{
  "success": true,
  "artists": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "user": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jazz Master",
        "email": "jazzer@example.com",
        "profileImage": "url",
        "phone": "1234567890"
      },
      "genres": ["Jazz"],
      "hourlyRate": 200,
      "rating": 4.8,
      "reviewCount": 45,
      "verified": true
    }
  ]
}
```

### Get Trending Artists
**GET** `/artists/trending?limit=6`

**Response:** Same as Featured Artists

### Search Artists
**GET** `/artists/search?genres=Jazz&minPrice=100&maxPrice=300&minRating=4&page=1&limit=10`

**Query Parameters:**
- `genres[]` - Array of genres to filter by (optional)
- `minPrice` - Minimum hourly rate (optional)
- `maxPrice` - Maximum hourly rate (optional)
- `minRating` - Minimum rating (0-5) (optional)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10, max: 100)
- `sort` - Sort field (default: "-rating")

**Response:**
```json
{
  "success": true,
  "artists": [...],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

### Get Artist Detail
**GET** `/artists/:id`

**Response:**
```json
{
  "success": true,
  "artist": {
    "_id": "507f1f77bcf86cd799439011",
    "genres": ["Jazz"],
    "hourlyRate": 200,
    "rating": 4.8,
    "verified": true,
    "user": {...},
    "reviewStats": {
      "averageRating": 4.8,
      "totalReviews": 45,
      "verified": true
    }
  },
  "reviews": [...]
}
```

---

## ARTIST PROFILE ENDPOINTS (Protected)

### Get My Profile
**GET** `/artists/me` (Protected)

### Update Profile
**PUT** `/artists/profile` (Protected)

**Request Body:**
```json
{
  "genres": ["Jazz", "Blues"],
  "yearsOfExperience": 10,
  "hourlyRate": 200,
  "minimumBooking": 2,
  "serviceTypes": ["Live Performance", "Studio Session"],
  "portfolio": {
    "videoLinks": ["https://youtube.com/..."],
    "audioLinks": ["https://soundcloud.com/..."],
    "images": ["https://example.com/image.jpg"]
  }
}
```

### Get My Stats
**GET** `/artists/me/stats` (Protected)

**Response:**
```json
{
  "success": true,
  "stats": {
    "completedBookings": 15,
    "totalEarnings": 3000,
    "averageRating": 4.8,
    "totalReviews": 30,
    "upcomingBookings": 2
  }
}
```

---

## BOOKING ENDPOINTS

### Create Booking
**POST** `/bookings` (Protected)

**Request Body:**
```json
{
  "artistId": "507f1f77bcf86cd799439011",
  "eventDate": "2024-04-15T00:00:00Z",
  "startTime": "18:00",
  "endTime": "21:00",
  "eventType": "Wedding",
  "eventLocation": {
    "venue": "Grand Hotel",
    "address": "123 Main St",
    "city": "New York",
    "country": "USA"
  },
  "eventDetails": "Wedding reception for 100 guests"
}
```

### Get Booking Details
**GET** `/bookings/:id` (Protected)

### Get My Bookings
**GET** `/bookings/my?status=pending,confirmed&page=1&limit=10` (Protected)

**Query Parameters:**
- `status` - Filter by status (pending, confirmed, completed, cancelled, disputed)
- `page` - Page number
- `limit` - Results per page
- `sort` - Sort field (default: "-eventDate")

### Update Booking Status
**PATCH** `/bookings/:id/status` (Protected)

**Request Body:**
```json
{
  "status": "confirmed" // or "cancelled", "completed", etc
}
```

### Get Booking Stats
**GET** `/bookings/stats` (Protected)

**Response:**
```json
{
  "success": true,
  "stats": {
    "pending": 3,
    "confirmed": 5,
    "completed": 20,
    "cancelled": 1,
    "totalRevenue": 5000
  }
}
```

---

## REVIEW ENDPOINTS

### Create Review
**POST** `/reviews` (Protected)

**Request Body:**
```json
{
  "bookingId": "507f1f77bcf86cd799439011",
  "rating": 5,
  "title": "Amazing performance!",
  "comment": "The artist delivered an incredible performance that exceeded our expectations...",
  "tags": ["professional", "talented", "reliable"]
}
```

### Get Artist Reviews
**GET** `/reviews/artist/:artistId?page=1&limit=10`

**Response:**
```json
{
  "success": true,
  "reviews": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "rating": 5,
      "comment": "Amazing!",
      "client": {...},
      "createdAt": "2024-03-20T10:00:00Z"
    }
  ],
  "pagination": {...},
  "ratingBreakdown": {
    "5": 30,
    "4": 10,
    "3": 2,
    "2": 1,
    "1": 0
  },
  "averageRating": 4.8
}
```

### Get Review Detail
**GET** `/reviews/:id`

### Add Artist Response
**PATCH** `/reviews/:id/response` (Protected)

**Request Body:**
```json
{
  "response": "Thank you for the kind words! It was a pleasure performing at your event."
}
```

### Get My Reviews (Client)
**GET** `/reviews/my?page=1&limit=10` (Protected)

### Delete Review
**DELETE** `/reviews/:id` (Protected)

---

## MESSAGE ENDPOINTS

### Send Message
**POST** `/messages` (Protected)

**Request Body:**
```json
{
  "conversationId": "507f1f77bcf86cd799439011", // Optional, will create if not provided
  "recipientId": "507f1f77bcf86cd799439012",
  "content": "Hi! Are you available on April 15th?"
}
```

### Get My Conversations
**GET** `/messages/conversations?page=1&limit=10` (Protected)

### Get Conversation Messages
**GET** `/messages/conversation/:conversationId?page=1&limit=20` (Protected)

### Get or Create Conversation
**POST** `/messages/conversation` (Protected)

**Request Body:**
```json
{
  "otherUserId": "507f1f77bcf86cd799439012"
}
```

### Mark Message as Read
**PATCH** `/messages/:id/read` (Protected)

### Delete Message
**DELETE** `/messages/:id` (Protected)

---

## ADMIN ENDPOINTS (Admin Only)

### Get All Users
**GET** `/admin/users?role=artist&status=active&page=1&limit=10&search=query` (Protected)

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "artist",
      "status": "active",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

### Get Pending Artist Approvals
**GET** `/admin/pending-artists?page=1&limit=10` (Protected)

**Response:**
```json
{
  "success": true,
  "artists": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Jane Artist",
      "email": "jane@example.com",
      "role": "artist",
      "status": "pending",
      "profile": {
        "genres": ["Classical"],
        "hourlyRate": 150
      }
    }
  ],
  "pagination": {...}
}
```

### Approve Artist
**PUT** `/admin/artists/:artistId/approve` (Protected)

**Request Body:**
```json
{
  "feedback": "Profile looks great!" // Optional
}
```

### Reject Artist
**PUT** `/admin/artists/:artistId/reject` (Protected)

**Request Body:**
```json
{
  "reason": "Portfolio is incomplete"
}
```

### Get Platform Statistics
**GET** `/admin/stats` (Protected)

**Response:**
```json
{
  "success": true,
  "stats": {
    "users": {
      "total": 150,
      "clients": 100,
      "artists": 45,
      "pendingArtists": 5
    },
    "bookings": {
      "total": 80,
      "completed": 60,
      "pending": 15
    },
    "revenue": {
      "platformTotal": 5000,
      "artistTotal": 25000,
      "thisMonth": 1200
    },
    "reviews": {
      "averageRating": 4.6,
      "totalReviews": 120
    },
    "thisMonth": {
      "bookings": 12
    }
  }
}
```

### Suspend User
**PUT** `/admin/users/:userId/suspend` (Protected)

### Unsuspend User
**PUT** `/admin/users/:userId/unsuspend` (Protected)

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": {} // Only if validation errors
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (not authorized for this action)
- `404` - Not Found
- `500` - Server Error

---

## Testing Tips

1. **Register a Client:**
   ```
   POST /auth/register
   {
     "name": "Test Client",
     "email": "client@test.com",
     "password": "password123",
     "role": "client"
   }
   ```

2. **Register an Artist:**
   ```
   POST /auth/register
   {
     "name": "Test Artist",
     "email": "artist@test.com",
     "password": "password123",
     "role": "artist"
   }
   ```

3. **Login to get token:**
   ```
   POST /auth/login
   {
     "email": "client@test.com",
     "password": "password123"
   }
   ```

4. **Use the token in all protected requests:**
   ```
   Authorization: Bearer <token_from_login>
   ```

5. **As admin, approve the artist** (if you need admin access, manually update user role in MongoDB)

6. **Search for artists:**
   ```
   GET /artists/search?genres=Jazz&minPrice=50&maxPrice=300
   ```

7. **Create a booking:**
   ```
   POST /bookings (with auth token)
   {
     "artistId": "...",
     "eventDate": "2024-04-15T00:00:00Z",
     "startTime": "18:00",
     "endTime": "21:00"
   }
   ```

---

## Database Collections

- **users** - User accounts (clients, artists, admins)
- **artistprofiles** - Artist detailed information
- **bookings** - Bookings/reservations
- **reviews** - Artist reviews and ratings
- **messages** - Chat messages
- **conversations** - Message threads
- **availabilities** - Artist time slots

---

## Environment Variables

```
MONGO_URI=mongodb://localhost:27017/book-your-artist
JWT_SECRET=your_secret_key_here
NODE_ENV=development
PORT=5000
```
