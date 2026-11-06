import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bike, Car, Loader2, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { findCity, ODISHA_CITIES } from "@/lib/odisha";
import { getMapsStatus, placeDetails, placesAutocomplete } from "@/lib/maps.functions";
import type { VehicleKind } from "@/lib/parking";
import { cn } from "@/lib/utils";

type Suggestion = { placeId: string; text: string; main: string; secondary: string };

export function DestinationSearch({
  variant = "hero",
  initial,
}: {
  variant?: "hero" | "compact";
  initial?: { q?: string | undefined; city?: string | undefined; vehicle?: VehicleKind | undefined };
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState(initial?.q ?? "");
  const [city, setCity] = useState(initial?.city ?? "Bhubaneswar");
  const [vehicle, setVehicle] = useState<VehicleKind>(initial?.vehicle ?? "four_wheeler");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const reqId = useRef(0);

  const statusFn = useServerFn(getMapsStatus);
  const autocompleteFn = useServerFn(placesAutocomplete);
  const detailsFn = useServerFn(placeDetails);
  const { data: mapsStatus } = useQuery({ queryKey: ["maps-status"], queryFn: () => statusFn(), staleTime: 5 * 60_000 });
  const placesEnabled = Boolean(user && mapsStatus?.configured);

  useEffect(() => {
    if (!placesEnabled) return;
    const text = query.trim();
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      try {
        if (!tokenRef.current) tokenRef.current = crypto.randomUUID();
        const res = await autocompleteFn({ data: { input: `${text}, ${city}, Odisha`, sessionToken: tokenRef.current } });
        if (id === reqId.current) setSuggestions(res);
      } catch {
        if (id === reqId.current) setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, city, placesEnabled]);

  function goCityFallback() {
    const c = findCity(city) ?? ODISHA_CITIES[0]!;
    navigate({
      to: "/find-parking",
      search: { q: query.trim() || undefined, city: c.name, vehicle, lat: c.lat, lng: c.lng, approx: true },
    });
  }

  async function choose(s: Suggestion) {
    setBusy(true);
    setOpen(false);
    try {
      const p = await detailsFn({ data: { placeId: s.placeId, sessionToken: tokenRef.current ?? undefined } });
      tokenRef.current = null;
      setQuery(s.main);
      navigate({
        to: "/find-parking",
        search: { q: p.name || s.main, city: findCity(p.city)?.name ?? city, vehicle, lat: p.lat, lng: p.lng, approx: undefined },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not find that place");
      goCityFallback();
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (placesEnabled && suggestions[0] && query.trim().length >= 2) {
      await choose(suggestions[0]);
      return;
    }
    goCityFallback();
  }

  const hero = variant === "hero";

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "relative grid gap-2 rounded-2xl bg-card p-2 shadow-elevated",
        hero ? "md:grid-cols-[1.6fr_1fr_1fr_auto]" : "md:grid-cols-[1.8fr_1fr_1fr_auto]",
      )}
    >
      <div className="relative">
        <label className="sr-only" htmlFor={`dest-${variant}`}>
          Search destination, area or landmark
        </label>
        <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
        <input
          id={`dest-${variant}`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search destination, area or landmark"
          autoComplete="off"
          maxLength={120}
          className={cn(
            "w-full rounded-xl border border-transparent bg-muted pl-11 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:bg-card",
            hero ? "h-14" : "h-11",
          )}
        />
        {open && placesEnabled && suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-popover shadow-elevated">
            {suggestions.map((s) => (
              <li key={s.placeId}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(s)}
                  className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-secondary"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="block text-sm font-medium text-foreground">{s.main}</span>
                    <span className="block text-xs text-muted-foreground">{s.secondary}</span>
                  </span>
                </button>
              </li>
            ))}
            <li className="border-t px-4 py-1.5 text-[10px] text-muted-foreground">Suggestions powered by Google</li>
          </ul>
        )}
      </div>

      <Select value={city} onValueChange={setCity}>
        <SelectTrigger className={cn("rounded-xl border-transparent bg-muted", hero ? "h-14" : "h-11")} aria-label="City">
          <SelectValue placeholder="City" />
        </SelectTrigger>
        <SelectContent>
          {ODISHA_CITIES.map((c) => (
            <SelectItem key={c.name} value={c.name}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={vehicle} onValueChange={(v) => setVehicle(v as VehicleKind)}>
        <SelectTrigger className={cn("rounded-xl border-transparent bg-muted", hero ? "h-14" : "h-11")} aria-label="Vehicle type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="four_wheeler">
            <span className="inline-flex items-center gap-2">
              <Car className="h-4 w-4" /> Four-wheeler
            </span>
          </SelectItem>
          <SelectItem value="two_wheeler">
            <span className="inline-flex items-center gap-2">
              <Bike className="h-4 w-4" /> Two-wheeler
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      <Button type="submit" disabled={busy} className={cn("rounded-xl px-6 font-semibold", hero ? "h-14" : "h-11")}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        Search Parking
      </Button>

      {hero && !placesEnabled && (
        <p className="px-2 pb-1 text-xs text-muted-foreground md:col-span-4">
          {user
            ? "Landmark suggestions are not available yet — we'll search around the selected city centre."
            : "Sign in for landmark suggestions. Without it, we search around the selected city centre."}
        </p>
      )}
    </form>
  );
}
