import type { Database } from "@/integrations/supabase/types";

export type Facility = Database["public"]["Tables"]["parking_facilities"]["Row"];
export type Slot = Database["public"]["Tables"]["parking_slots"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type VehicleKind = Database["public"]["Enums"]["vehicle_kind"];
export type VerificationStatus = Database["public"]["Enums"]["verification_status"];
export type OperatorType = Database["public"]["Enums"]["operator_type"];
export type SlotState = Database["public"]["Enums"]["slot_state"];

export type FacilityStats = {
  total_slots: number;
  available_slots: number;
  occupied_slots: number;
  reserved_slots: number;
  unavailable_slots: number;
  total_2w: number;
  available_2w: number;
  total_4w: number;
  available_4w: number;
};

export const EMPTY_STATS: FacilityStats = {
  total_slots: 0,
  available_slots: 0,
  occupied_slots: 0,
  reserved_slots: 0,
  unavailable_slots: 0,
  total_2w: 0,
  available_2w: 0,
  total_4w: 0,
  available_4w: 0,
};

export const VEHICLE_LABEL: Record<VehicleKind, string> = {
  two_wheeler: "Two-wheeler",
  four_wheeler: "Four-wheeler",
};

export const OPERATOR_LABEL: Record<OperatorType, string> = {
  municipal: "Municipal / government operator",
  railway: "Railway station operator",
  airport: "Airport operator",
  mall: "Shopping mall",
  hospital: "Hospital",
  private: "Private parking business",
  other: "Other",
};

export const STATUS_LABEL: Record<VerificationStatus, string> = {
  pending: "Pending Verification",
  verified: "Verified",
  rejected: "Rejected",
};

export type AvailabilityLevel = "available" | "limited" | "full";

/** Green when plenty is free, orange at or below 20% (or 3 slots), red when none. */
export function availabilityLevel(available: number, total: number): AvailabilityLevel {
  if (total <= 0 || available <= 0) return "full";
  if (available <= 3 || available / total <= 0.2) return "limited";
  return "available";
}

export const AVAILABILITY_LABEL: Record<AvailabilityLevel, string> = {
  available: "Available",
  limited: "Limited availability",
  full: "Full",
};

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

export function formatINR(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

/** Mirrors create_booking: hourly × hours, capped at the daily rate per started day. */
export function estimateAmount(hourly: number | null, daily: number | null, hours: number): number | null {
  if (hours <= 0) return null;
  const days = Math.ceil(hours / 24);
  if (hourly !== null && hourly !== undefined) {
    const byHour = hourly * hours;
    return daily !== null && daily !== undefined ? Math.min(byHour, daily * days) : byHour;
  }
  if (daily !== null && daily !== undefined) return daily * days;
  return null;
}

export function ratesFor(f: Pick<Facility, "rate_2w_hourly" | "rate_2w_daily" | "rate_4w_hourly" | "rate_4w_daily">, v: VehicleKind) {
  return v === "two_wheeler"
    ? { hourly: f.rate_2w_hourly, daily: f.rate_2w_daily }
    : { hourly: f.rate_4w_hourly, daily: f.rate_4w_daily };
}

export function lowestHourly(f: Facility, vehicle?: VehicleKind): number | null {
  const vals = (vehicle ? [ratesFor(f, vehicle).hourly] : [f.rate_2w_hourly, f.rate_4w_hourly]).filter(
    (v): v is number => v !== null && v !== undefined,
  );
  return vals.length ? Math.min(...vals) : null;
}

/** Minutes since midnight in India Standard Time. */
export function istMinutes(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function isOpenAt(f: Pick<Facility, "open_24h" | "opens_at" | "closes_at">, date: Date) {
  if (f.open_24h) return true;
  const now = istMinutes(date);
  const open = timeToMinutes(f.opens_at);
  const close = timeToMinutes(f.closes_at);
  if (close > open) return now >= open && now < close;
  return now >= open || now < close; // overnight hours
}

export function formatHours(f: Pick<Facility, "open_24h" | "opens_at" | "closes_at">) {
  if (f.open_24h) return "Open 24 hours";
  return `${f.opens_at.slice(0, 5)} – ${f.closes_at.slice(0, 5)}`;
}

export function supportsVehicle(f: Pick<Facility, "vehicle_types">, v: VehicleKind) {
  return f.vehicle_types.includes(v);
}
