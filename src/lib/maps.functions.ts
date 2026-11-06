import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ODISHA_BOUNDS } from "@/lib/odisha";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

async function gatewayError(res: Response): Promise<never> {
  const text = await res.text();
  console.error(`Google Maps gateway request failed [${res.status}]: ${text}`);
  if (res.status === 403) {
    let reason: string | undefined;
    try {
      reason = (JSON.parse(text)?.error?.details ?? []).find((d: { reason?: string }) => d.reason)?.reason;
    } catch {
      /* ignore */
    }
    if (reason === "API_KEY_HTTP_REFERRER_BLOCKED")
      throw new Error("Google Maps server key is referrer-restricted. Set its application restriction to None or IP addresses.");
    if (reason === "API_KEY_SERVICE_BLOCKED")
      throw new Error("Google Maps server key does not allow this API. Add it to the key's allowed APIs.");
    throw new Error("Google Maps request was denied (403).");
  }
  throw new Error(`Google Maps request failed [${res.status}]`);
}

/** Whether location search is configured (no billable call). */
export const getMapsStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { configured: Boolean(process.env["LOVABLE_API_KEY"] && process.env["GOOGLE_MAPS_API_KEY"]) };
});

export const placesAutocomplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ input: z.string().trim().min(2).max(120), sessionToken: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
    const GOOGLE_MAPS_API_KEY = process.env["GOOGLE_MAPS_API_KEY"];
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) throw new Error("Location search is not configured");

    const res = await fetch(`${GATEWAY_URL}/places/v1/places:autocomplete`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat",
      },
      body: JSON.stringify({
        input: data.input,
        sessionToken: data.sessionToken,
        includedRegionCodes: ["in"],
        locationBias: { rectangle: ODISHA_BOUNDS },
      }),
    });
    if (!res.ok) await gatewayError(res);
    const json = (await res.json()) as {
      suggestions?: {
        placePrediction?: {
          placeId: string;
          text?: { text: string };
          structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } };
        };
      }[];
    };
    return (json.suggestions ?? [])
      .map((s) => s.placePrediction)
      .filter((p): p is NonNullable<typeof p> => !!p)
      .slice(0, 6)
      .map((p) => ({
        placeId: p.placeId,
        text: p.text?.text ?? "",
        main: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
        secondary: p.structuredFormat?.secondaryText?.text ?? "",
      }));
  });

export const placeDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        placeId: z.string().regex(/^[A-Za-z0-9_-]{10,300}$/),
        sessionToken: z.string().uuid().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
    const GOOGLE_MAPS_API_KEY = process.env["GOOGLE_MAPS_API_KEY"];
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) throw new Error("Location search is not configured");

    const qs = data.sessionToken ? `?sessionToken=${encodeURIComponent(data.sessionToken)}` : "";
    const res = await fetch(`${GATEWAY_URL}/places/v1/places/${encodeURIComponent(data.placeId)}${qs}`, {
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "id,displayName,formattedAddress,location,addressComponents",
      },
    });
    if (!res.ok) await gatewayError(res);
    const p = (await res.json()) as {
      id: string;
      displayName?: { text: string };
      formattedAddress?: string;
      location?: { latitude: number; longitude: number };
      addressComponents?: { longText: string; types: string[] }[];
    };
    if (!p.location) throw new Error("This place has no location");
    const city =
      p.addressComponents?.find((c) => c.types.includes("locality"))?.longText ??
      p.addressComponents?.find((c) => c.types.includes("administrative_area_level_3"))?.longText ??
      null;
    return {
      placeId: p.id,
      name: p.displayName?.text ?? "",
      address: p.formattedAddress ?? "",
      lat: p.location.latitude,
      lng: p.location.longitude,
      city,
    };
  });

const point = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });

export const walkingRoute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ origin: point, destination: point }).parse(d))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
    const GOOGLE_MAPS_API_KEY = process.env["GOOGLE_MAPS_API_KEY"];
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) throw new Error("Routing is not configured");

    const res = await fetch(`${GATEWAY_URL}/routes/directions/v2:computeRoutes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
        "Content-Type": "application/json",
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: data.origin.lat, longitude: data.origin.lng } } },
        destination: { location: { latLng: { latitude: data.destination.lat, longitude: data.destination.lng } } },
        travelMode: "WALK",
      }),
    });
    if (!res.ok) await gatewayError(res);
    const json = (await res.json()) as {
      routes?: { distanceMeters?: number; duration?: string; polyline?: { encodedPolyline?: string } }[];
    };
    const r = json.routes?.[0];
    if (!r?.polyline?.encodedPolyline || !r.duration) return null;
    return {
      polyline: r.polyline.encodedPolyline,
      distanceMeters: r.distanceMeters ?? 0,
      durationSeconds: parseFloat(r.duration.replace("s", "")),
    };
  });
