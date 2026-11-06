import { useMemo, useState } from "react";
import { Bike, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Slot, VehicleKind } from "@/lib/parking";

export type SlotView = "available" | "occupied" | "reserved" | "unavailable";

export function slotView(slot: Slot, reserved: Set<string>): SlotView {
  if (slot.state === "unavailable") return "unavailable";
  if (slot.state === "occupied") return "occupied";
  if (reserved.has(slot.id)) return "reserved";
  return "available";
}

const viewClass: Record<SlotView, string> = {
  available: "bg-success text-success-foreground hover:brightness-110",
  occupied: "bg-danger text-danger-foreground",
  reserved: "bg-reserved text-reserved-foreground",
  unavailable: "bg-unavailable text-unavailable-foreground",
};

export function SlotLegend() {
  const items: [SlotView, string][] = [
    ["available", "Available"],
    ["occupied", "Occupied"],
    ["reserved", "Reserved"],
    ["unavailable", "Unavailable"],
  ];
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {items.map(([v, l]) => (
        <span key={v} className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className={cn("h-3 w-3 rounded", viewClass[v])} /> {l}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <span className="h-3 w-3 rounded ring-2 ring-primary ring-offset-1" /> Selected
      </span>
    </div>
  );
}

export function SlotLayout({
  slots,
  reserved,
  selectedId,
  onSelect,
  vehicle,
}: {
  slots: Slot[];
  reserved: Set<string>;
  selectedId?: string | null;
  onSelect?: (slot: Slot) => void;
  vehicle?: VehicleKind;
}) {
  const floors = useMemo(() => {
    const map = new Map<string, Slot[]>();
    slots.forEach((s) => map.set(s.floor_label, [...(map.get(s.floor_label) ?? []), s]));
    return [...map.entries()];
  }, [slots]);
  const [floor, setFloor] = useState(floors[0]?.[0] ?? "Ground");
  const current = floors.find(([f]) => f === floor)?.[1] ?? floors[0]?.[1] ?? [];

  if (slots.length === 0) {
    return <p className="rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">No slots have been set up for this facility yet.</p>;
  }

  const groups: [VehicleKind, Slot[]][] = (["four_wheeler", "two_wheeler"] as VehicleKind[])
    .map((v) => [v, current.filter((s) => s.vehicle_type === v)] as [VehicleKind, Slot[]])
    .filter(([, list]) => list.length > 0);

  return (
    <div className="space-y-4">
      {floors.length > 1 && (
        <div className="inline-flex rounded-xl bg-muted p-1" role="tablist" aria-label="Floors">
          {floors.map(([f, list]) => (
            <button
              key={f}
              role="tab"
              aria-selected={f === floor}
              onClick={() => setFloor(f)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition",
                f === floor ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f} <span className="text-xs text-muted-foreground">({list.length})</span>
            </button>
          ))}
        </div>
      )}

      <div className="rounded-2xl border bg-muted/50 p-4">
        <div className="mb-3 flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary/30 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Entry / Exit
        </div>
        {groups.map(([v, list]) => {
          const Icon = v === "two_wheeler" ? Bike : Car;
          const dimmed = vehicle && vehicle !== v;
          return (
            <div key={v} className={cn("mt-3", dimmed && "opacity-40")}>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Icon className="h-3.5 w-3.5" /> {v === "two_wheeler" ? "Two-wheeler bays" : "Four-wheeler bays"}
              </p>
              <div
                className={cn(
                  "grid gap-2",
                  v === "two_wheeler" ? "grid-cols-6 sm:grid-cols-8 md:grid-cols-10" : "grid-cols-4 sm:grid-cols-6 md:grid-cols-8",
                )}
              >
                {list.map((s) => {
                  const view = slotView(s, reserved);
                  const selectable = view === "available" && !dimmed && !!onSelect;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={!selectable}
                      onClick={() => selectable && onSelect?.(s)}
                      aria-pressed={selectedId === s.id}
                      aria-label={`Slot ${s.slot_code}, ${view}`}
                      title={`${s.slot_code} · ${view}`}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-lg text-[10px] font-bold transition",
                        v === "two_wheeler" ? "h-12" : "h-16",
                        viewClass[view],
                        !selectable && "cursor-not-allowed",
                        selectedId === s.id && "ring-[3px] ring-primary ring-offset-2 ring-offset-background",
                      )}
                    >
                      <Icon className="mb-0.5 h-3.5 w-3.5 opacity-80" />
                      {s.slot_code.split("-").slice(-1)[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
