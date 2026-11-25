export type Locality = "Bandra" | "Andheri" | "Lower Parel" | "Fort" | "Juhu" | "Powai" | "Dadar" | "Worli";
export type Category =
  | "Pop-up"
  | "Exhibition"
  | "Workshop"
  | "Cafe hire"
  | "Studio"
  | "Rooftop"
  | "Corporate"
  | "Unique";
export type DurationUnit = "HOUR" | "HALF_DAY" | "DAY" | "WEEK";

export interface Venue {
  id: string;
  name: string;
  category: Category;
  locality: Locality;
  lat: number;
  lng: number;
  unitLabel: string;
  areaSqft: number;
  capacity: number;
  pricing: Record<DurationUnit, number>;
  rating: number;
  reviewCount: number;
  images: string[];
  description: string;
  amenities: string[];
  rules: { noise: string; alcohol: string; food: string; decor: string };
  ownerId: string;
  contactPhone?: string;
  ownerEmail?: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  dataLabel?: "DEMO_OWNER_LISTING" | "OWNER_SUBMITTED";
}

export interface ScoreBreakdown {
  category: number;
  location: number;
  capacity: number;
  budget: number;
  facilities: number;
  quality: number;
  eventDemand: number;
}
export interface RankedVenue extends Venue {
  score: number;
  scoreBreakdown: ScoreBreakdown;
}

export interface DropEvent {
  id: string;
  title: string;
  category: string;
  venueName: string;
  locality: Locality;
  lat: number;
  lng: number;
  startDatetime: string;
  endDatetime: string;
  priceText: string;
  imageUrl: string;
  sourceUrl: string;
  sourceType: "GEMINI" | "OWNER" | "ADMIN";
  status: "LIVE" | "UPCOMING" | "ENDED";
  fetchedAt: string;
  flagged?: boolean;
}

export type BookingStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";
export interface Booking {
  id: string;
  venueId: string;
  venueName: string;
  venueImage: string;
  locality: Locality;
  start: string;
  end: string;
  purpose: string;
  guests: number;
  subtotal: number;
  fee: number;
  total: number;
  status: BookingStatus;
  customerName: string;
  createdAt: string;
}

export interface AvailabilityDay {
  date: string; // YYYY-MM-DD
  state: "FREE" | "BOOKED" | "BLOCKED";
}

export interface RecommendationQuery {
  category?: Category | undefined;
  locality?: Locality | undefined;
  guests?: number | undefined;
  budget?: number | undefined;
}

export interface BookingInput {
  venueId: string;
  start: string;
  end: string;
  purpose: string;
  guests: number;
}
