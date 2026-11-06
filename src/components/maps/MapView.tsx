import { useEffect, useRef, useState } from "react";
import { MapPinned } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AvailabilityLevel } from "@/lib/parking";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: any;
    __smartparkMapsReady?: () => void;
    gm_authFailure?: () => void;
  }
}

export type MapMarker = { id: string; lat: number; lng: number; label: string; level: AvailabilityLevel };

const BROWSER_KEY = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as string | undefined;
const TRACKING_ID = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] as string | undefined;

export const mapsBrowserKeyAvailable = Boolean(BROWSER_KEY);

let loader: Promise<any> | null = null;
function loadGoogleMaps(): Promise<any> {
  if (window.google?.maps?.Map) return Promise.resolve(window.google);
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    window.__smartparkMapsReady = () => resolve(window.google);
    const s = document.createElement("script");
    const channel = TRACKING_ID ? `&channel=${encodeURIComponent(TRACKING_ID)}` : "";
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(BROWSER_KEY ?? "")}&loading=async&callback=__smartparkMapsReady&libraries=geometry&region=IN&language=en${channel}`;
    s.async = true;
    s.onerror = () => {
      loader = null;
      reject(new Error("Google Maps failed to load"));
    };
    document.head.appendChild(s);
  });
  return loader;
}

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function pinIcon(google: any, fill: string, text: string, selected: boolean) {
  const size = selected ? 46 : 36;
  const stroke = cssVar("--card") || "white";
  const textColor = cssVar("--primary-foreground") || "white";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 36 36"><path d="M18 2C10.8 2 5 7.6 5 14.6 5 23.8 18 34 18 34s13-10.2 13-19.4C31 7.6 25.2 2 18 2Z" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/><text x="18" y="19" text-anchor="middle" font-family="Sora, sans-serif" font-size="12" font-weight="700" fill="${textColor}">${text}</text></svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size),
  };
}

export function MapPlaceholder({ className, reason }: { className?: string; reason?: string }) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed border-primary/30 bg-secondary p-6 text-center",
        className,
      )}
      role="img"
      aria-label="Map placeholder"
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <MapPinned className="relative h-10 w-10 text-primary" />
      <div className="relative max-w-xs">
        <p className="font-display text-sm font-semibold text-foreground">Map placeholder</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {reason ?? "Google Maps is not connected yet. Search, listings and booking still work normally."}
        </p>
      </div>
    </div>
  );
}

export function MapView({
  center,
  destination,
  markers = [],
  selectedId,
  onSelect,
  routePolyline,
  className,
  zoom = 14,
}: {
  center: { lat: number; lng: number };
  destination?: { lat: number; lng: number; label: string } | null;
  markers?: MapMarker[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  routePolyline?: string | null;
  className?: string;
  zoom?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const routeRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!BROWSER_KEY || !ref.current) return;
    let cancelled = false;
    window.gm_authFailure = () => setError("Google Maps could not authorise this website. The rest of the site still works.");
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !ref.current) return;
        mapRef.current = new google.maps.Map(ref.current, {
          center,
          zoom,
          clickableIcons: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
        });
        setReady(true);
      })
      .catch((e: Error) => setError(e.message));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Markers
  useEffect(() => {
    const google = window.google;
    const map = mapRef.current;
    if (!ready || !google || !map) return;
    overlaysRef.current.forEach((m) => m.setMap(null));
    overlaysRef.current = [];

    const colors: Record<AvailabilityLevel, string> = {
      available: cssVar("--success"),
      limited: cssVar("--warning"),
      full: cssVar("--danger"),
    };
    const bounds = new google.maps.LatLngBounds();

    if (destination) {
      const m = new google.maps.Marker({
        map,
        position: { lat: destination.lat, lng: destination.lng },
        title: destination.label,
        icon: pinIcon(google, cssVar("--primary"), "★", false),
        zIndex: 1000,
      });
      overlaysRef.current.push(m);
      bounds.extend({ lat: destination.lat, lng: destination.lng });
    }
    markers.forEach((mk) => {
      const m = new google.maps.Marker({
        map,
        position: { lat: mk.lat, lng: mk.lng },
        title: mk.label,
        icon: pinIcon(google, colors[mk.level], "P", mk.id === selectedId),
        zIndex: mk.id === selectedId ? 999 : 10,
      });
      m.addListener("click", () => onSelect?.(mk.id));
      overlaysRef.current.push(m);
      bounds.extend({ lat: mk.lat, lng: mk.lng });
    });

    if (markers.length + (destination ? 1 : 0) > 1) {
      map.fitBounds(bounds, 60);
    } else {
      map.setCenter(center);
      map.setZoom(zoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, markers, destination?.lat, destination?.lng, selectedId]);

  // Route
  useEffect(() => {
    const google = window.google;
    const map = mapRef.current;
    if (!ready || !google || !map) return;
    routeRef.current?.setMap(null);
    routeRef.current = null;
    if (!routePolyline || !google.maps.geometry) return;
    const path = google.maps.geometry.encoding.decodePath(routePolyline);
    routeRef.current = new google.maps.Polyline({
      map,
      path,
      strokeColor: cssVar("--primary"),
      strokeOpacity: 0.9,
      strokeWeight: 5,
    });
  }, [ready, routePolyline]);

  if (!BROWSER_KEY) return <MapPlaceholder className={className} />;
  if (error) return <MapPlaceholder className={className} reason={error} />;

  return <div ref={ref} className={cn("overflow-hidden rounded-2xl bg-secondary", className)} aria-label="Map" />;
}
