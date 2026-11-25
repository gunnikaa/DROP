import type { Category, Locality } from "./types";
/** Static UI filter options only. Venue/event records are fetched from the Java API. */
export const LOCALITIES: { name: Locality; lat: number; lng: number }[] = [
  { name: "Bandra", lat: 19.0596, lng: 72.8295 }, { name: "Andheri", lat: 19.1197, lng: 72.8468 },
  { name: "Lower Parel", lat: 18.9986, lng: 72.83 }, { name: "Fort", lat: 18.9338, lng: 72.8355 },
  { name: "Juhu", lat: 19.1075, lng: 72.8263 }, { name: "Powai", lat: 19.1176, lng: 72.906 },
  { name: "Dadar", lat: 19.0178, lng: 72.8478 }, { name: "Worli", lat: 19.0167, lng: 72.8175 },
];
export const CATEGORIES: Category[] = ["Pop-up", "Exhibition", "Workshop", "Cafe hire", "Studio", "Rooftop", "Corporate", "Unique"];
export const AMENITIES = ["Wi-Fi", "Sound system", "Projector", "Air conditioning", "Power backup", "Parking", "Kitchen access", "Washrooms", "Display walls", "Lighting rig", "Step-free access", "Green room"];
