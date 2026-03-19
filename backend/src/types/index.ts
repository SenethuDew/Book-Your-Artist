export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  profileImage?: string;
  bio?: string;
  role: "client" | "artist" | "admin";
  status: "active" | "pending" | "suspended";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IArtistProfile {
  _id?: string;
  userId: string;
  genres: string[];
  specialties?: string[];
  yearsOfExperience?: number;
  hourlyRate: number;
  minimumBooking?: number;
  serviceTypes?: string[];
  equipmentProvided?: string[];
  travelRadius?: number;
  languages?: string[];
  timezone?: string;
  rating?: number;
  reviewCount?: number;
  portfolio?: {
    videoLinks?: string[];
    audioLinks?: string[];
    images?: string[];
    mediaLinks?: Array<{ platform: string; url: string }>;
  };
  backgroundChecked?: boolean;
  verified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAvailability {
  _id?: string;
  artistId: string;
  date: Date;
  startTime: string;
  endTime: string;
  slotDuration?: number;
  bookedSlots?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBooking {
  _id?: string;
  clientId: string;
  artistId: string;
  eventDate: Date;
  startTime: string;
  endTime: string;
  durationHours: number;
  eventType?: string;
  eventLocation?: {
    venue?: string;
    address?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  eventDetails?: string;
  totalPrice: number;
  artistPrice?: number;
  platformFee?: number;
  paymentStatus: "pending" | "paid" | "refunded";
  paymentIntentId?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "disputed";
  cancellationReason?: string;
  cancellationBy?: "client" | "artist";
  clientNotes?: string;
  artistNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReview {
  _id?: string;
  bookingId: string;
  artistId: string;
  clientId: string;
  rating: number;
  title?: string;
  comment: string;
  tags?: string[];
  helpful?: number;
  response?: {
    text: string;
    createdAt: Date;
  };
  verified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMessage {
  _id?: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  attachments?: Array<{
    type: "image" | "file";
    url: string;
    name: string;
  }>;
  read?: boolean;
  createdAt?: Date;
}

export interface IConversation {
  _id?: string;
  participants: [string, string];
  relatedBookingId?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount?: { [userId: string]: number };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface SearchFilters extends PaginationQuery {
  genres?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  availability?: boolean;
}
