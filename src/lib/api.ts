import type { AvailabilityDay, Booking, BookingInput, DropEvent, RankedVenue, RecommendationQuery, Venue } from "./types";

/** All product data now comes from the Core Java HTTP API. No mock-data fallback. */
export const BASE_URL: string = import.meta.env["VITE_API_BASE_URL"] ?? "";
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  const token = typeof localStorage === "undefined" ? null : localStorage.getItem("drop_token");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try { const body = await res.json() as { error?: string }; message = body.error ?? message; } catch { /* keep status message */ }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}
const qs = (o: Record<string, unknown>) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => { if (v != null && v !== "") p.set(k, String(v)); });
  return p.size ? `?${p.toString()}` : "";
};

export const api = {
  register: (input: { name: string; email: string; password: string; role: "CUSTOMER" | "OWNER" }) => http<{ token: string; user: { id: string; name: string; email: string; role: string } }>("/api/auth/register", { method: "POST", body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) => http<{ token: string; user: { id: string; name: string; email: string; role: string } }>("/api/auth/login", { method: "POST", body: JSON.stringify(input) }),
  me: () => http<{ id: string; name: string; email: string; role: string }>("/api/auth/me"),
  logout: () => http<{ success: boolean }>("/api/auth/logout", { method: "POST" }),
  createVenue: (input: { name: string; category: string; locality: string; unitLabel: string; areaSqft: number; capacity: number; hourlyRate: number; description: string; contactPhone: string; amenities: string[] }) => http<Venue>("/api/venues", { method: "POST", body: JSON.stringify(input) }),
  getMyVenues: (): Promise<Venue[]> => http("/api/venues/mine"),
  getVenues: (params: { locality?: string; category?: string } = {}): Promise<Venue[]> => http(`/api/venues${qs(params)}`),
  getVenue: (id: string): Promise<Venue> => http(`/api/venues/${encodeURIComponent(id)}`),
  getAvailability: (id: string, from: string, to: string): Promise<AvailabilityDay[]> => http(`/api/venues/${encodeURIComponent(id)}/availability${qs({ from, to })}`),
  getNearbyEvents: (id: string): Promise<DropEvent[]> => http(`/api/venues/${encodeURIComponent(id)}/nearby-events`),
  recommend: (q: RecommendationQuery): Promise<RankedVenue[]> => http(`/api/recommendations`, { method: "POST", body: JSON.stringify(q) }),
  createBooking: (input: BookingInput): Promise<Booking> => http(`/api/bookings`, { method: "POST", body: JSON.stringify(input) }),
  getMyBookings: (): Promise<Booking[]> => http(`/api/bookings/my`),
  updateBooking: (id: string, action: "approve" | "reject" | "cancel"): Promise<Booking> => http(`/api/bookings/${encodeURIComponent(id)}/${action}`, { method: "PATCH" }),
  getEvents: (p: { locality?: string; status?: string; from?: string; to?: string } = {}): Promise<DropEvent[]> => http(`/api/events${qs(p)}`),
  createEvent: (input: { title: string; venueId: string; startDatetime: string; endDatetime: string; priceText: string }) => http<DropEvent>(`/api/events`, { method: "POST", body: JSON.stringify(input) }),
  getEvent: async (id: string): Promise<DropEvent> => {
    const all = await api.getEvents();
    const event = all.find((e) => e.id === id);
    if (!event) throw new Error("Event not found");
    return event;
  },
  getEventsNear: async (lat: number, lng: number, radiusKm = 3): Promise<DropEvent[]> => {
    const all = await api.getEvents();
    const radians = (n: number) => n * Math.PI / 180;
    const distance = (e: DropEvent) => {
      const dLat = radians(e.lat - lat), dLng = radians(e.lng - lng);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat)) * Math.cos(radians(e.lat)) * Math.sin(dLng / 2) ** 2;
      return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    return all.filter((e) => distance(e) <= radiusKm);
  },
  getVenuesNear: async (lat: number, lng: number, radiusKm = 3): Promise<Venue[]> => {
    const all = await api.getVenues();
    const radians = (n: number) => n * Math.PI / 180;
    const distance = (v: Venue) => {
      const dLat = radians(v.lat - lat), dLng = radians(v.lng - lng);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat)) * Math.cos(radians(v.lat)) * Math.sin(dLng / 2) ** 2;
      return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    return all.filter((v) => distance(v) <= radiusKm).sort((a, b) => distance(a) - distance(b));
  },
  getPendingVenues: (): Promise<Venue[]> => http(`/api/admin/venues/pending`),
  reviewVenue: (id: string, action: "approve" | "reject"): Promise<Venue> => http(`/api/admin/venues/${encodeURIComponent(id)}/${action}`, { method: "PATCH" }),
  discoverPlaces: (query: string) => http<Array<{ id: string; name: string; address: string; category: string; lat: number; lng: number; phone: string; email: string; website: string; mapsUrl: string; source: string; availabilityConfirmed: false; bookingMessage: string }>>(`/api/discovery/places${qs({ query })}`),
  getSuggestions: async (prefix: string): Promise<string[]> => (await http<{ suggestions: string[] }>(`/api/search/suggest${qs({ q: prefix })}`)).suggestions,
  allocateRequests: (requests: Array<{ guests: number; category?: string; locality?: string }>) => http<{ matches: Array<{ requestIndex: number; venue: Venue | null; matched: boolean }>; matchedCount: number }>(`/api/admin/allocate`, { method: "POST", body: JSON.stringify({ requests }) }),
  findSpaceCombination: (requiredFacilities: string[]) => http<{ venues: Venue[]; coveredFacilities: string[]; uncoveredFacilities: string[]; algorithm: string }>(`/api/recommendations/cover`, { method: "POST", body: JSON.stringify({ requiredFacilities }) }),
};
