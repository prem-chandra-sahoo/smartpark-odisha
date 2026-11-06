import { BadgeCheck, Clock3, FlaskConical, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AVAILABILITY_LABEL,
  availabilityLevel,
  STATUS_LABEL,
  type AvailabilityLevel,
  type VerificationStatus,
} from "@/lib/parking";

export function DemoDataBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-dashed border-warning bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning-foreground",
        className,
      )}
    >
      <FlaskConical className="h-3 w-3" />
      Demo Data – Not Live
    </span>
  );
}

/**
 * Verification badge. Demo listings never get the "Verified Authorised Parking" label,
 * because no administrator has checked real documents for them.
 */
export function VerificationBadge({
  status,
  isDemo,
  className,
}: {
  status: VerificationStatus;
  isDemo?: boolean;
  className?: string;
}) {
  if (isDemo) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground",
          className,
        )}
      >
        <FlaskConical className="h-3.5 w-3.5" /> Sample listing – not verified
      </span>
    );
  }
  const styles: Record<VerificationStatus, string> = {
    verified: "bg-success/12 text-success",
    pending: "bg-warning/15 text-warning-foreground",
    rejected: "bg-danger/12 text-danger",
  };
  const Icon = status === "verified" ? BadgeCheck : status === "pending" ? Clock3 : ShieldX;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", styles[status], className)}>
      <Icon className="h-3.5 w-3.5" />
      {status === "verified" ? "Verified Authorised Parking" : STATUS_LABEL[status]}
    </span>
  );
}

const levelDot: Record<AvailabilityLevel, string> = {
  available: "bg-success",
  limited: "bg-warning",
  full: "bg-danger",
};
const levelText: Record<AvailabilityLevel, string> = {
  available: "text-success",
  limited: "text-warning-foreground",
  full: "text-danger",
};

export function AvailabilityPill({ available, total, className }: { available: number; total: number; className?: string }) {
  const level = availabilityLevel(available, total);
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", levelText[level], className)}>
      <span className={cn("h-2.5 w-2.5 rounded-full", levelDot[level])} />
      {AVAILABILITY_LABEL[level]}
    </span>
  );
}

export function AvailabilityBar({
  available,
  occupied,
  reserved,
  total,
}: {
  available: number;
  occupied: number;
  reserved: number;
  total: number;
}) {
  if (total <= 0) return <div className="h-2 rounded-full bg-muted" />;
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className="flex h-2 overflow-hidden rounded-full bg-unavailable/60" aria-hidden="true">
      <div className="bg-success" style={{ width: pct(available) }} />
      <div className="bg-reserved" style={{ width: pct(reserved) }} />
      <div className="bg-danger" style={{ width: pct(occupied) }} />
    </div>
  );
}
