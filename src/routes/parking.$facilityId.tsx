import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Bike, Car, Clock, Heart, Mail, MapPin, Navigation, Phone, ScrollText, Umbrella } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MapView } from "@/components/maps/MapView";
import { BookingPanel } from "@/components/parking/BookingPanel";
import { AvailabilityBar, AvailabilityPill, DemoDataBadge, VerificationBadge } from "@/components/parking/badges";
import { demoImagesFor, directionsUrl } from "@/components/parking/directions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getFacilityDetail } from "@/lib/public.functions";
import { availabilityLevel, formatHours, formatINR, isOpenAt, OPERATOR_LABEL } from "@/lib/parking";
import { cn } from "@/lib/utils";

const facilityQuery = (id: string) =>
  queryOptions({
    queryKey: ["facility", id],
    queryFn: () => getFacilityDetail({ data: { id } }),
    staleTime: 30_000,
  });

export const Route = createFileRoute("/parking/$facilityId")({
  loader: async ({ context, params }) => {
    if (!/^[0-9a-f-]{36}$/i.test(params.facilityId)) throw notFound();
    const f = await context.queryClient.ensureQueryData(facilityQuery(params.facilityId));
    if (!f) throw notFound();
    return { name: f.name, city: f.city, isDemo: f.is_demo };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name}, ${loaderData.city} – SmartPark Odisha` },
          { name: "description", content: `Rates, hours, live slot layout and advance booking for ${loaderData.name} in ${loaderData.city}.` },
          { property: "og:title", content: `${loaderData.name} – SmartPark Odisha` },
          { property: "og:description", content: `Check slots and reserve parking at ${loaderData.name}, ${loaderData.city}.` },
          ...(loaderData.isDemo ? [{ name: "robots", content: "noindex" }] : []),
        ]
      : [{ title: "Parking unavailable – SmartPark Odisha" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Parking facility not found</h1>
      <p className="mt-2 text-muted-foreground">It may not be verified yet, or it has been removed.</p>
      <Button asChild className="mt-6 rounded-full">
        <Link to="/find-parking">Find other parking</Link>
      </Button>
    </div>
  ),
  component: FacilityPage,
});

function FacilityPage() {
  const { facilityId } = Route.useParams();
  const { data } = useSuspenseQuery(facilityQuery(facilityId));
  const f = data!;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const images = f.image_urls.length ? f.image_urls : demoImagesFor(f.is_covered);
  const s = f.stats;
  const open = isOpenAt(f, new Date());

  const { data: saved } = useQuery({
    queryKey: ["saved", user?.id, f.id],
    enabled: !!user,
    queryFn: async () =>
      !!(await supabase.from("saved_facilities").select("facility_id").eq("user_id", user!.id).eq("facility_id", f.id).maybeSingle()).data,
  });

  async function toggleSave() {
    if (!user) {
      toast("Sign in to save facilities");
      return;
    }
    const { error } = saved
      ? await supabase.from("saved_facilities").delete().eq("user_id", user.id).eq("facility_id", f.id)
      : await supabase.from("saved_facilities").insert({ user_id: user.id, facility_id: f.id });
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["saved"] });
    toast.success(saved ? "Removed from saved" : "Saved to your dashboard");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Link to="/find-parking" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to results
      </Link>

      {f.is_demo && (
        <div className="mt-4 rounded-2xl border border-dashed border-warning bg-warning/10 p-4 text-sm text-warning-foreground">
          <DemoDataBadge className="mb-2" />
          <p>
            This is a sample listing created to demonstrate SmartPark Odisha. It is not a real operator, its location is
            approximate and its slot availability is not live. Bookings here are for testing only.
          </p>
        </div>
      )}

      {/* Gallery */}
      <div className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr]">
        <img src={images[0]} alt={`${f.name} parking area`} className="aspect-[16/9] w-full rounded-3xl object-cover" width={1200} height={800} />
        <div className="hidden grid-rows-2 gap-3 md:grid">
          {images.slice(1, 3).map((src, i) => (
            <img key={i} src={src} alt="" loading="lazy" className="h-full w-full rounded-3xl object-cover" width={1200} height={800} />
          ))}
        </div>
      </div>
      {f.is_demo && <p className="mt-1 text-[11px] text-muted-foreground">Illustrative photos.</p>}

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <VerificationBadge status={f.status} isDemo={f.is_demo} />
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{OPERATOR_LABEL[f.operator_type]}</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{f.name}</h1>
            <p className="mt-2 flex items-start gap-1.5 text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {f.address}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild className="rounded-full">
                <a href={directionsUrl(f.latitude, f.longitude)} target="_blank" rel="noreferrer">
                  <Navigation className="h-4 w-4" /> Get Directions
                </a>
              </Button>
              <Button asChild variant="secondary" className="rounded-full">
                <a href="#book">Reserve Now</a>
              </Button>
              <Button variant="outline" className="rounded-full" onClick={toggleSave}>
                <Heart className={cn("h-4 w-4", saved && "fill-danger text-danger")} /> {saved ? "Saved" : "Save"}
              </Button>
            </div>
          </div>

          {/* Availability */}
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Slot availability right now</h2>
              <AvailabilityPill available={s.available_slots} total={s.total_slots} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Total", s.total_slots, "text-foreground"],
                ["Available", s.available_slots, "text-success"],
                ["Occupied", s.occupied_slots, "text-danger"],
                ["Reserved now", s.reserved_slots, "text-reserved-foreground"],
              ].map(([l, n, c]) => (
                <div key={l as string} className="rounded-xl bg-muted p-3">
                  <p className={cn("font-display text-2xl font-bold", c as string)}>{n as number}</p>
                  <p className="text-xs text-muted-foreground">{l as string}</p>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <AvailabilityBar available={s.available_slots} occupied={s.occupied_slots} reserved={s.reserved_slots} total={s.total_slots} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Two-wheeler: {s.available_2w}/{s.total_2w} free · Four-wheeler: {s.available_4w}/{s.total_4w} free
              {f.is_demo ? " · Demo Data – Not Live" : " · Updated by the facility operator"}
            </p>
            <span className="sr-only">{availabilityLevel(s.available_slots, s.total_slots)}</span>
          </div>

          <BookingPanel facility={f} initialSlots={f.slots} />
        </div>

        {/* Side info */}
        <aside className="space-y-5">
          <MapView
            center={{ lat: f.latitude, lng: f.longitude }}
            markers={[{ id: f.id, lat: f.latitude, lng: f.longitude, label: f.name, level: availabilityLevel(s.available_slots, s.total_slots) }]}
            selectedId={f.id}
            zoom={16}
            className="h-64 w-full"
          />

          <InfoCard title="Parking rates">
            {f.vehicle_types.includes("four_wheeler") && (
              <RateRow icon={<Car className="h-4 w-4" />} label="Four-wheeler" hourly={f.rate_4w_hourly} daily={f.rate_4w_daily} />
            )}
            {f.vehicle_types.includes("two_wheeler") && (
              <RateRow icon={<Bike className="h-4 w-4" />} label="Two-wheeler" hourly={f.rate_2w_hourly} daily={f.rate_2w_daily} />
            )}
          </InfoCard>

          <InfoCard title="Opening hours">
            <p className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" /> {formatHours(f)}
              <span className={cn("font-semibold", open ? "text-success" : "text-danger")}>· {open ? "Open now" : "Closed now"}</span>
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm">
              <Umbrella className="h-4 w-4 text-primary" /> {f.is_covered ? "Covered parking" : "Uncovered parking"}
            </p>
          </InfoCard>

          {f.rules && (
            <InfoCard title="Parking rules">
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {f.rules.split("\n").filter(Boolean).map((r) => (
                  <li key={r} className="flex gap-2">
                    <ScrollText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {r}
                  </li>
                ))}
              </ul>
            </InfoCard>
          )}

          <InfoCard title="Contact">
            <p className="text-sm font-medium">{f.operator_name}</p>
            <a href={`tel:+91${f.contact_phone}`} className="mt-2 flex items-center gap-2 text-sm text-primary hover:underline">
              <Phone className="h-4 w-4" /> +91 {f.contact_phone}
            </a>
            {f.contact_email && (
              <a href={`mailto:${f.contact_email}`} className="mt-1 flex items-center gap-2 text-sm text-primary hover:underline">
                <Mail className="h-4 w-4" /> {f.contact_email}
              </a>
            )}
          </InfoCard>

          {f.description && (
            <InfoCard title="About this facility">
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </InfoCard>
          )}
        </aside>
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function RateRow({ icon, label, hourly, daily }: { icon: React.ReactNode; label: string; hourly: number | null; daily: number | null }) {
  return (
    <div className="flex items-center justify-between border-b py-2 text-sm last:border-0">
      <span className="flex items-center gap-2 text-foreground">
        <span className="text-primary">{icon}</span> {label}
      </span>
      <span className="text-right">
        <span className="font-semibold">{formatINR(hourly)}</span>
        <span className="text-muted-foreground">/hr</span> · <span className="font-semibold">{formatINR(daily)}</span>
        <span className="text-muted-foreground">/day</span>
      </span>
    </div>
  );
}
