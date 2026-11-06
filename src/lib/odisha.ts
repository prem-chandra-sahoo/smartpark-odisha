// Approximate city-centre coordinates, used only as a search fallback
// when a landmark cannot be resolved through Google Places.
export type OdishaCity = { name: string; lat: number; lng: number };

export const ODISHA_CITIES: OdishaCity[] = [
  { name: "Bhubaneswar", lat: 20.2961, lng: 85.8245 },
  { name: "Cuttack", lat: 20.4625, lng: 85.883 },
  { name: "Puri", lat: 19.8135, lng: 85.8312 },
  { name: "Konark", lat: 19.8876, lng: 86.0945 },
  { name: "Rourkela", lat: 22.2604, lng: 84.8536 },
  { name: "Sambalpur", lat: 21.4669, lng: 83.9812 },
  { name: "Berhampur", lat: 19.3149, lng: 84.7941 },
  { name: "Balasore", lat: 21.4942, lng: 86.9317 },
  { name: "Jharsuguda", lat: 21.8554, lng: 84.0062 },
  { name: "Baripada", lat: 21.9347, lng: 86.735 },
  { name: "Bhadrak", lat: 21.0583, lng: 86.495 },
  { name: "Angul", lat: 20.84, lng: 85.1018 },
  { name: "Koraput", lat: 18.8135, lng: 82.7123 },
  { name: "Gopalpur", lat: 19.2647, lng: 84.9062 },
];

export function findCity(name?: string | null): OdishaCity | undefined {
  if (!name) return undefined;
  return ODISHA_CITIES.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

/** Destination search examples — NOT claims that authorised parking exists there. */
export const POPULAR_DESTINATIONS: { label: string; city: string; kind: string }[] = [
  { label: "KIIT Square", city: "Bhubaneswar", kind: "Landmark" },
  { label: "Master Canteen", city: "Bhubaneswar", kind: "Landmark" },
  { label: "Biju Patnaik International Airport", city: "Bhubaneswar", kind: "Airport" },
  { label: "Ravenshaw University", city: "Cuttack", kind: "University" },
  { label: "Cuttack Railway Station", city: "Cuttack", kind: "Railway station" },
  { label: "Puri Sea Beach", city: "Puri", kind: "Beach" },
  { label: "Jagannath Temple", city: "Puri", kind: "Temple" },
  { label: "Konark Sun Temple", city: "Konark", kind: "Heritage site" },
];

export const ODISHA_BOUNDS = {
  low: { latitude: 17.8, longitude: 81.3 },
  high: { latitude: 22.6, longitude: 87.5 },
};
