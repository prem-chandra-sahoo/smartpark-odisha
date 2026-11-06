import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { EMPTY_STATS, haversineKm, type Facility, type FacilityStats, type Slot } from "@/lib/parking";

// Public, read-only access. RLS only exposes facilities an admin has verified.
function makePublicClient(url: string, key: string) {
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export type FacilityWithStats = Facility & { stats: FacilityStats; distance_km: number | null; image_urls: string[] };

async function signImages(sb: ReturnType<typeof makePublicClient>, facilities: Facility[]) {
  const paths = facilities.flatMap((f) => f.images ?? []);
  const map = new Map<string, string>();
  if (paths.length) {
    const { data } = await sb.storage.from("facility-images").createSignedUrls(paths, 60 * 60 * 6);
    data?.forEach((d) => d.signedUrl && d.path && map.set(d.path, d.signedUrl));
  }
  return map;
}

export const searchParking = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        radiusKm: z.number().min(1).max(100).default(15),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("Backend is not configured");
    const sb = makePublicClient(url, key);

    const dLat = data.radiusKm / 111;
    const dLng = data.radiusKm / (111 * Math.cos((data.lat * Math.PI) / 180));
    const { data: rows, error } = await sb
      .from("parking_facilities")
      .select("*")
      .eq("status", "verified")
      .gte("latitude", data.lat - dLat)
      .lte("latitude", data.lat + dLat)
      .gte("longitude", data.lng - dLng)
      .lte("longitude", data.lng + dLng)
      .limit(200);
    if (error) throw new Error(error.message);

    let facilities = (rows ?? [])
      .map((f) => ({ f, d: haversineKm({ lat: data.lat, lng: data.lng }, { lat: f.latitude, lng: f.longitude }) }))
      .filter((x) => x.d <= data.radiusKm);
    let outsideRadius = false;

    if (facilities.length === 0) {
      // Nothing within range: offer the closest verified facilities instead.
      const { data: all } = await sb.from("parking_facilities").select("*").eq("status", "verified").limit(500);
      facilities = (all ?? [])
        .map((f) => ({ f, d: haversineKm({ lat: data.lat, lng: data.lng }, { lat: f.latitude, lng: f.longitude }) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 3);
      outsideRadius = facilities.length > 0;
    }

    const ids = facilities.map((x) => x.f.id);
    const statsMap = new Map<string, FacilityStats>();
    if (ids.length) {
      const { data: stats, error: sErr } = await sb.rpc("facility_stats", { _facility_ids: ids });
      if (sErr) throw new Error(sErr.message);
      stats?.forEach((s) => statsMap.set(s.facility_id, s));
    }
    const imgs = await signImages(
      sb,
      facilities.map((x) => x.f),
    );

    const results: FacilityWithStats[] = facilities.map(({ f, d }) => ({
      ...f,
      distance_km: d,
      stats: statsMap.get(f.id) ?? EMPTY_STATS,
      image_urls: (f.images ?? []).map((p) => imgs.get(p)).filter((u): u is string => !!u),
    }));
    return { results, outsideRadius };
  });

export const getFacilityDetail = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("Backend is not configured");
    const sb = makePublicClient(url, key);

    const { data: facility, error } = await sb
      .from("parking_facilities")
      .select("*")
      .eq("id", data.id)
      .eq("status", "verified")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!facility) return null;

    const [{ data: slots }, { data: stats }, imgs] = await Promise.all([
      sb.from("parking_slots").select("*").eq("facility_id", data.id).order("sort_order"),
      sb.rpc("facility_stats", { _facility_ids: [data.id] }),
      signImages(sb, [facility]),
    ]);
    const result: FacilityWithStats & { slots: Slot[] } = {
      ...facility,
      distance_km: null,
      stats: stats?.[0] ?? EMPTY_STATS,
      image_urls: (facility.images ?? []).map((p) => imgs.get(p)).filter((u): u is string => !!u),
      slots: slots ?? [],
    };
    return result;
  });
