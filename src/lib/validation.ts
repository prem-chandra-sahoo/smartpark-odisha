import { z } from "zod";

export const INDIAN_MOBILE = /^[6-9]\d{9}$/;
// Standard state-series (OD02AB1234) and Bharat-series (22BH1234AB) plates.
export const VEHICLE_REG = /^([A-Z]{2}\d{1,2}[A-Z]{0,3}\d{1,4}|\d{2}BH\d{4}[A-Z]{1,2})$/;

export function normaliseVehicleNumber(v: string) {
  return v.toUpperCase().replace(/[\s-]/g, "");
}

export function isValidVehicleNumber(v: string) {
  return VEHICLE_REG.test(normaliseVehicleNumber(v));
}

export const bookingFormSchema = z.object({
  customer_name: z.string().trim().min(2, "Enter your full name").max(100),
  customer_phone: z.string().trim().regex(INDIAN_MOBILE, "Enter a valid 10-digit mobile number"),
  customer_email: z.string().trim().email("Enter a valid email").max(255),
  vehicle_number: z
    .string()
    .trim()
    .refine(isValidVehicleNumber, "Enter a valid registration number, e.g. OD02AB1234"),
});
export type BookingFormValues = z.infer<typeof bookingFormSchema>;

const optionalRate = z
  .union([z.literal(""), z.coerce.number().min(0, "Must be 0 or more").max(100000)])
  .transform((v) => (v === "" ? null : v));

export const facilityFormSchema = z
  .object({
    name: z.string().trim().min(3, "At least 3 characters").max(120),
    operator_name: z.string().trim().min(2, "Required").max(120),
    operator_type: z.enum(["municipal", "railway", "airport", "mall", "hospital", "private", "other"]),
    address: z.string().trim().min(5, "Enter the full address").max(300),
    city: z.string().trim().min(2, "Select a city"),
    latitude: z.coerce.number().min(17.5, "Location must be in Odisha").max(23, "Location must be in Odisha"),
    longitude: z.coerce.number().min(81, "Location must be in Odisha").max(88, "Location must be in Odisha"),
    google_maps_url: z
      .string()
      .trim()
      .max(500)
      .refine((v) => v === "" || /^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/.test(v), "Paste a Google Maps link")
      .optional()
      .default(""),
    contact_phone: z.string().trim().regex(INDIAN_MOBILE, "Enter a valid 10-digit mobile number"),
    contact_email: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]).optional().default(""),
    description: z.string().trim().max(1000).optional().default(""),
    rules: z.string().trim().max(2000).optional().default(""),
    supports_2w: z.boolean(),
    supports_4w: z.boolean(),
    is_covered: z.boolean(),
    rate_2w_hourly: optionalRate,
    rate_2w_daily: optionalRate,
    rate_4w_hourly: optionalRate,
    rate_4w_daily: optionalRate,
    open_24h: z.boolean(),
    opens_at: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
    closes_at: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
    cancellation_cutoff_hours: z.coerce.number().int().min(0).max(72),
  })
  .refine((v) => v.supports_2w || v.supports_4w, { message: "Select at least one vehicle type", path: ["supports_2w"] })
  .refine((v) => !v.supports_2w || v.rate_2w_hourly !== null || v.rate_2w_daily !== null, {
    message: "Enter a two-wheeler rate",
    path: ["rate_2w_hourly"],
  })
  .refine((v) => !v.supports_4w || v.rate_4w_hourly !== null || v.rate_4w_daily !== null, {
    message: "Enter a four-wheeler rate",
    path: ["rate_4w_hourly"],
  })
  .refine((v) => v.open_24h || v.opens_at < v.closes_at, { message: "Closing time must be after opening time", path: ["closes_at"] });

export type FacilityFormInput = z.input<typeof facilityFormSchema>;
export type FacilityFormValues = z.output<typeof facilityFormSchema>;

export const documentMetaSchema = z.object({
  document_type: z.string().trim().min(2, "Required").max(120),
  issuing_authority: z.string().trim().min(2, "Required").max(200),
  document_number: z.string().trim().min(2, "Required").max(120),
  issue_date: z.string().optional().default(""),
  expiry_date: z.string().optional().default(""),
});

export const ALLOWED_DOC_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export const MAX_DOC_BYTES = 10 * 1024 * 1024;
