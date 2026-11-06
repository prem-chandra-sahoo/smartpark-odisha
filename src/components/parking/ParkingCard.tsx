import { Link } from "@tanstack/react-router";
import { Bike, Car, Clock, MapPin, Navigation, Umbrella } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  formatDistance,
  formatHours,
  formatINR,
  isOpenAt,
  type VehicleKind,
} from "@/lib/parking";
import type { FacilityWithStats } from "@/lib/public.functions";
import { AvailabilityBar, AvailabilityPill, DemoDataBadge, VerificationBadge } from "./badges";
import { directionsUrl } from "./directions";

export function ParkingCard({
  facility: f,
  vehicle,
  selected,
  onSelect,
  compared,
  onToggleCompare,
  compareDisabled,
}: {
  facility: FacilityWithStats;
  vehicle?: VehicleKind | undefined;
  selected?: boolean;
  onSelect?: () => void;
  compared?: boolean;
  onToggleCompare?: () => void;
  compareDisabled?: boolean;
}) {
  const s = f.stats;
  const avail = vehicle === "two_wheeler" ? s.available_2w : vehicle === "four_wheeler" ? s.available_4w : s.available_slots;
  const total = vehicle === "two_wheeler" ? s.total_2w : vehicle === "four_wheeler" ? s.total_4w : s.total_slots;
  const open = isOpenAt(f, new Date());

  return (
    <article
      onClick={onSelect}
      className={cn(
        "group cursor-pointer rounded-2xl border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated",
        selected && "ring-2 ring-primary",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">{f.name}</h3>
          <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-2">{f.address}</span>
          </p>
        </div>
        {f.distance_km !== null && (
          <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
            {formatDistance(f.distance_km)}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <VerificationBadge status={f.status} isDemo={f.is_demo} />
        {f.is_demo && <DemoDataBadge />}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-muted px-2 py-2">
          <p className="font-display text-lg font-bold text-foreground">{total}</p>
          <p className="text-[11px] text-muted-foreground">Total</p>
        </div>
        <div className="rounded-xl bg-success/10 px-2 py-2">
          <p className="font-display text-lg font-bold text-success">{avail}</p>
          <p className="text-[11px] text-muted-foreground">Available</p>
        </div>
        <div className="rounded-xl bg-danger/10 px-2 py-2">
          <p className="font-display text-lg font-bold text-danger">{s.occupied_slots + s.reserved_slots}</p>
          <p className="text-[11px] text-muted-foreground">Occupied</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex-1">
          <AvailabilityBar available={s.available_slots} occupied={s.occupied_slots} reserved={s.reserved_slots} total={s.total_slots} />
        </div>
        <AvailabilityPill available={avail} total={total} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        {f.vehicle_types.includes("four_wheeler") && (
          <div className="flex items-center gap-1.5">
            <Car className="h-3.5 w-3.5 text-primary" />
            <dd className="text-foreground">
              {formatINR(f.rate_4w_hourly)}/hr · {formatINR(f.rate_4w_daily)}/day
            </dd>
          </div>
        )}
        {f.vehicle_types.includes("two_wheeler") && (
          <div className="flex items-center gap-1.5">
            <Bike className="h-3.5 w-3.5 text-primary" />
            <dd className="text-foreground">
              {formatINR(f.rate_2w_hourly)}/hr · {formatINR(f.rate_2w_daily)}/day
            </dd>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <dd className="text-foreground">
            {formatHours(f)}{" "}
            <span className={cn("font-semibold", open ? "text-success" : "text-danger")}>· {open ? "Open" : "Closed"}</span>
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Umbrella className="h-3.5 w-3.5 text-primary" />
          <dd className="text-foreground">{f.is_covered ? "Covered" : "Uncovered"}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Button asChild size="sm" variant="outline" className="rounded-lg">
          <a href={directionsUrl(f.latitude, f.longitude)} target="_blank" rel="noreferrer">
            <Navigation className="h-3.5 w-3.5" /> Directions
          </a>
        </Button>
        <Button asChild size="sm" variant="secondary" className="rounded-lg">
          <Link to="/parking/$facilityId" params={{ facilityId: f.id }}>
            View Details
          </Link>
        </Button>
        <Button asChild size="sm" className="rounded-lg">
          <Link to="/parking/$facilityId" params={{ facilityId: f.id }} hash="book">
            Reserve Now
          </Link>
        </Button>
        {onToggleCompare && (
          <label className="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <Checkbox checked={!!compared} disabled={!!compareDisabled && !compared} onCheckedChange={onToggleCompare} />
            Compare
          </label>
        )}
      </div>
    </article>
  );
}
