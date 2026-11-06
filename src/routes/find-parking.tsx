import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Footprints, Info, Scale, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DestinationSearch } from "@/components/parking/DestinationSearch";
import { ParkingCard } from "@/components/parking/ParkingCard";
import { DemoDataBadge, VerificationBadge } from "@/components/parking/badges";
import { MapView, type MapMarker } from "@/components/maps/MapView";
import { useAuth } from "@/hooks/use-auth";
import { findCity, ODISHA_CITIES } from "@/lib/odisha";
import { getMapsStatus, walkingRoute } from "@/lib/maps.functions";
import { searchParking, type FacilityWithStats } from "@/lib/public.functions";
import {
  availabilityLevel,
  formatDistance,
  formatHours,
  formatINR,
  isOpenAt,
  lowestHourly,
  supportsVehicle,
  type VehicleKind,
} from "@/lib/parking";

type FindSearch = {
  q?: string;
  city?: string;
  vehicle?: VehicleKind;
  lat?: number;
  lng?: number;
  approx?: boolean;
};

function num(v: unknown) {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function resolveCenter(s: FindSearch) {
  if (s.lat !== undefined && s.lng !== undefined) return { lat: s.lat, lng: s.lng };
  const c = findCity(s.city) ?? ODISHA_CITIES[0]!;
  return { lat: c.lat, lng: c.lng };
}

const searchQuery = (lat: number, lng: number) =>
  queryOptions({
    queryKey: ["parking-search", lat.toFixed(5), lng.toFixed(5)],
    queryFn: () => searchParking({ data: { lat, lng, radiusKm: 15 } }),
    staleTime: 30_000,
  });

export const Route = createFileRoute("/find-parking")({
  validateSearch: (s: Record<string, unknown>): FindSearch => ({
    q: typeof s.q === "string" ? s.q.slice(0, 120) : undefined,
    city: typeof s.city === "string" ? s.city.slice(0, 60) : undefined,
    vehicle: s.vehicle === "two_wheeler" || s.vehicle === "four_wheeler" ? s.vehicle : undefined,
    lat: num(s.lat),
    lng: num(s.lng),
    approx: s.approx === true || s.approx === "true" ? true : undefined,
  }),
  loaderDeps: ({ search }) => resolveCenter(search),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(searchQuery(deps.lat, deps.lng)),
  head: () => ({
    meta: [
      { title: "Find Parking near your destination – SmartPark Odisha" },
      {
        name: "description",
        content: "Compare verified parking near your destination in Odisha by distance, price and available slots.",
      },
      { property: "og:title", content: "Find Parking – SmartPark Odisha" },
      { property: "og:description", content: "Compare parking by distance, price and live slot counts, then reserve." },
    ],
  }),
  component: FindParkingPage,
});

type SortKey = "nearest" | "price" | "available";
type CoverFilter = "all" | "covered" | "uncovered";

function FindParkingPage() {
  const search = Route.useSearch();
  const center = resolveCenter(search);
  const { data } = useSuspenseQuery(searchQuery(center.lat, center.lng));
  const { user } = useAuth();

  const [sort, setSort] = useState<SortKey>("nearest");
  const [vehicle, setVehicle] = useState<VehicleKind | "all">(search.vehicle ?? "all");
  const [openNow, setOpenNow] = useState(false);
  const [cover, setCover] = useState<CoverFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const v = vehicle === "all" ? undefined : vehicle;

  const results = useMemo(() => {
    const now = new Date();
    const list = data.results.filter(
      (f) =>
        (!v || supportsVehicle(f, v)) &&
        (!openNow || isOpenAt(f, now)) &&
        (cover === "all" || (cover === "covered" ? f.is_covered : !f.is_covered)),
    );
    const availOf = (f: FacilityWithStats) =>
      v === "two_wheeler" ? f.stats.available_2w : v === "four_wheeler" ? f.stats.available_4w : f.stats.available_slots;
    return [...list].sort((a, b) => {
      if (sort === "price") return (lowestHourly(a, v) ?? Infinity) - (lowestHourly(b, v) ?? Infinity);
      if (sort === "available") return availOf(b) - availOf(a);
      return (a.distance_km ?? 0) - (b.distance_km ?? 0);
    });
  }, [data.results, v, openNow, cover, sort]);

  const markers: MapMarker[] = useMemo(
    () =>
      results.map((f) => ({
        id: f.id,
        lat: f.latitude,
        lng: f.longitude,
        label: f.name,
        level: availabilityLevel(f.stats.available_slots, f.stats.total_slots),
      })),
    [results],
  );

  const selected = results.find((f) => f.id === selectedId) ?? null;
  const statusFn = useServerFn(getMapsStatus);
  const routeFn = useServerFn(walkingRoute);
  const { data: mapsStatus } = useQuery({ queryKey: ["maps-status"], queryFn: () => statusFn(), staleTime: 300_000 });
  const routeEnabled = Boolean(user && mapsStatus?.configured && selected && !search.approx && search.lat !== undefined);
  const { data: route } = useQuery({
    queryKey: ["walk-route", selected?.id, center.lat, center.lng],
    enabled: routeEnabled,
    staleTime: 10 * 60_000,
    retry: false,
    queryFn: () =>
      routeFn({ data: { origin: center, destination: { lat: selected!.latitude, lng: selected!.longitude } } }),
  });

  const destinationLabel = search.q ?? search.city ?? "Bhubaneswar";
  const hasDemo = data.results.some((f) => f.is_demo);
  const compared = data.results.filter((f) => compare.includes(f.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <DestinationSearch
        key={`${search.q}-${search.city}-${search.lat}`}
        variant="compact"
        initial={{ q: search.q, city: search.city, vehicle: search.vehicle }}
      />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">
            Parking near <span className="text-primary">{destinationLabel}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {results.length} {results.length === 1 ? "facility" : "facilities"}
            {data.outsideRadius ? " — none within 15 km, showing the closest" : " within 15 km"}
          </p>
        </div>
        {hasDemo && <DemoDataBadge />}
      </div>

      {search.approx && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-secondary px-3 py-2 text-xs text-secondary-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Distances are measured from the approximate centre of {search.city ?? "the city"}, not the exact landmark.
          {!user && " Sign in for precise landmark search."}
        </p>
      )}

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3">
        <Select value={sort} onValueChange={(x) => setSort(x as SortKey)}>
          <SelectTrigger className="h-9 w-[180px] rounded-lg" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nearest">Nearest parking</SelectItem>
            <SelectItem value="price">Lowest price</SelectItem>
            <SelectItem value="available">Most available spaces</SelectItem>
          </SelectContent>
        </Select>
        <ToggleGroup
          type="single"
          value={vehicle}
          onValueChange={(x) => x && setVehicle(x as VehicleKind | "all")}
          className="rounded-lg bg-muted p-0.5"
          aria-label="Vehicle type"
        >
          <ToggleGroupItem value="all" className="h-8 px-3 text-xs">All</ToggleGroupItem>
          <ToggleGroupItem value="two_wheeler" className="h-8 px-3 text-xs">Two-wheeler</ToggleGroupItem>
          <ToggleGroupItem value="four_wheeler" className="h-8 px-3 text-xs">Four-wheeler</ToggleGroupItem>
        </ToggleGroup>
        <Select value={cover} onValueChange={(x) => setCover(x as CoverFilter)}>
          <SelectTrigger className="h-9 w-[160px] rounded-lg" aria-label="Covered or uncovered">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Covered & uncovered</SelectItem>
            <SelectItem value="covered">Covered only</SelectItem>
            <SelectItem value="uncovered">Uncovered only</SelectItem>
          </SelectContent>
        </Select>
        <label className="inline-flex items-center gap-2 text-sm">
          <Switch checked={openNow} onCheckedChange={setOpenNow} /> Open now
        </label>
        {compare.length > 0 && (
          <Button size="sm" className="ml-auto rounded-lg" onClick={() => setCompareOpen(true)}>
            <Scale className="h-4 w-4" /> Compare ({compare.length})
          </Button>
        )}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="order-2 space-y-4 lg:order-1">
          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
              <p className="font-semibold">No verified parking matches these filters</p>
              <p className="mt-1 text-sm text-muted-foreground">Try clearing filters or searching a nearby area.</p>
            </div>
          ) : (
            results.map((f) => (
              <ParkingCard
                key={f.id}
                facility={f}
                vehicle={v}
                selected={f.id === selectedId}
                onSelect={() => setSelectedId(f.id)}
                compared={compare.includes(f.id)}
                compareDisabled={compare.length >= 3}
                onToggleCompare={() =>
                  setCompare((c) => (c.includes(f.id) ? c.filter((x) => x !== f.id) : [...c, f.id].slice(0, 3)))
                }
              />
            ))
          )}
        </div>
        <div className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-20">
            <MapView
              center={center}
              destination={{ ...center, label: destinationLabel }}
              markers={markers}
              selectedId={selectedId}
              onSelect={setSelectedId}
              routePolyline={route?.polyline ?? null}
              className="h-[320px] w-full lg:h-[calc(100vh-7rem)]"
            />
            {route && selected && (
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Footprints className="h-3.5 w-3.5 text-primary" />
                About {Math.max(1, Math.round(route.durationSeconds / 60))} min walk ({formatDistance(route.distanceMeters / 1000)})
                between {selected.name} and your destination.
              </p>
            )}
          </div>
        </div>
      </div>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Compare parking</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2 text-muted-foreground" />
                  {compared.map((f) => (
                    <th key={f.id} className="min-w-[180px] p-2 align-top">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold">{f.name}</span>
                        <button
                          aria-label={`Remove ${f.name}`}
                          onClick={() => setCompare((c) => c.filter((x) => x !== f.id))}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  ["Status", (f: FacilityWithStats) => <VerificationBadge status={f.status} isDemo={f.is_demo} />],
                  ["Distance", (f: FacilityWithStats) => (f.distance_km !== null ? formatDistance(f.distance_km) : "—")],
                  ["Available / total", (f: FacilityWithStats) => `${f.stats.available_slots} / ${f.stats.total_slots}`],
                  ["Four-wheeler", (f: FacilityWithStats) => `${formatINR(f.rate_4w_hourly)}/hr · ${formatINR(f.rate_4w_daily)}/day`],
                  ["Two-wheeler", (f: FacilityWithStats) => `${formatINR(f.rate_2w_hourly)}/hr · ${formatINR(f.rate_2w_daily)}/day`],
                  ["Hours", (f: FacilityWithStats) => formatHours(f)],
                  ["Covered", (f: FacilityWithStats) => (f.is_covered ? "Yes" : "No")],
                  ["Free cancellation", (f: FacilityWithStats) => `Up to ${f.cancellation_cutoff_hours} h before arrival`],
                ].map(([label, render]) => (
                  <tr key={label as string}>
                    <td className="p-2 font-medium text-muted-foreground">{label as string}</td>
                    {compared.map((f) => (
                      <td key={f.id} className="p-2">
                        {(render as (f: FacilityWithStats) => React.ReactNode)(f)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {compared.some((f) => f.is_demo) && <DemoDataBadge className="mt-2" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
