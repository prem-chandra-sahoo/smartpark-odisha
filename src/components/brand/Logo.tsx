import { cn } from "@/lib/utils";

/** SmartPark mark: a location pin carrying a parking "P". */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-9 w-9", className)} aria-hidden="true">
      <rect width="40" height="40" rx="11" className="fill-primary" />
      <path
        d="M20 7.5c-5.8 0-10.5 4.6-10.5 10.3 0 7.4 8.7 14.2 9.6 14.9a1.5 1.5 0 0 0 1.8 0c.9-.7 9.6-7.5 9.6-14.9C30.5 12.1 25.8 7.5 20 7.5Z"
        className="fill-accent"
      />
      <path
        d="M16.6 24.2V12.6h4.6c2.6 0 4.3 1.5 4.3 3.8s-1.7 3.8-4.3 3.8h-2.1v4h-2.5Zm2.5-6.2h1.9c1.2 0 1.9-.6 1.9-1.6s-.7-1.6-1.9-1.6h-1.9v3.2Z"
        className="fill-primary"
      />
    </svg>
  );
}

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className={cn("font-display text-lg font-bold tracking-tight", inverted ? "text-hero-foreground" : "text-foreground")}>
          SmartPark
        </span>
        <span className={cn("text-[11px] font-semibold uppercase tracking-[0.22em]", inverted ? "text-accent" : "text-primary")}>
          Odisha
        </span>
      </span>
    </span>
  );
}
