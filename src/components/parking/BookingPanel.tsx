import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bike, Car, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { bookingFormSchema, normaliseVehicleNumber, type BookingFormValues } from "@/lib/validation";
import { estimateAmount, formatINR, ratesFor, VEHICLE_LABEL, type Facility, type Slot, type VehicleKind } from "@/lib/parking";
import { SlotLayout, SlotLegend } from "./SlotLayout";
import { DemoDataBadge } from "./badges";

const DURATIONS = [1, 2, 3, 4, 6, 8, 12, 24, 48, 72];

function istToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}
function istNextHour() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }).format(new Date());
  const h = (Number(parts) + 1) % 24;
  return `${String(h).padStart(2, "0")}:00`;
}

export function BookingPanel({ facility, initialSlots }: { facility: Facility; initialSlots: Slot[] }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [minDate, setMinDate] = useState("");
  const [duration, setDuration] = useState(2);
  const [vehicle, setVehicle] = useState<VehicleKind>(facility.vehicle_types[0] ?? "four_wheeler");
  const [slotId, setSlotId] = useState<string | null>(null);
  const [form, setForm] = useState<BookingFormValues>({ customer_name: "", customer_phone: "", customer_email: "", vehicle_number: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const today = istToday();
    setMinDate(today);
    setDate(today);
    let t = istNextHour();
    if (!facility.open_24h && (t < facility.opens_at.slice(0, 5) || t >= facility.closes_at.slice(0, 5))) {
      t = facility.opens_at.slice(0, 5);
    }
    setTime(t);
  }, [facility]);

  // Prefill from profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });
  useEffect(() => {
    if (!profile && !user) return;
    setForm((f) => ({
      customer_name: f.customer_name || profile?.full_name || "",
      customer_phone: f.customer_phone || profile?.phone || "",
      customer_email: f.customer_email || profile?.email || user?.email || "",
      vehicle_number: f.vehicle_number,
    }));
  }, [profile, user]);

  const window_ = useMemo(() => {
    if (!date || !time) return null;
    const start = new Date(`${date}T${time}:00+05:30`);
    if (Number.isNaN(start.getTime())) return null;
    const end = new Date(start.getTime() + duration * 3600_000);
    return { start, end };
  }, [date, time, duration]);

  const { data: live, isFetching } = useQuery({
    queryKey: ["facility-live", facility.id, window_?.start.toISOString(), window_?.end.toISOString()],
    enabled: !!window_,
    refetchInterval: 30_000,
    queryFn: async () => {
      const [slotsRes, reservedRes] = await Promise.all([
        supabase.from("parking_slots").select("*").eq("facility_id", facility.id).order("sort_order"),
        supabase.rpc("reserved_slot_ids", {
          _facility_id: facility.id,
          _start: window_!.start.toISOString(),
          _end: window_!.end.toISOString(),
        }),
      ]);
      return {
        slots: slotsRes.data ?? initialSlots,
        reserved: new Set<string>((reservedRes.data as string[] | null) ?? []),
      };
    },
  });
  const slots = live?.slots ?? initialSlots;
  const reserved = live?.reserved ?? new Set<string>();
  const selectedSlot = slots.find((s) => s.id === slotId) ?? null;

  useEffect(() => {
    // Drop the selection if it became unavailable for the new window
    if (selectedSlot && (reserved.has(selectedSlot.id) || selectedSlot.state !== "available" || selectedSlot.vehicle_type !== vehicle)) {
      setSlotId(null);
    }
  }, [reserved, selectedSlot, vehicle]);

  const rates = ratesFor(facility, vehicle);
  const estimate = estimateAmount(rates.hourly, rates.daily, duration);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!window_ || !selectedSlot) {
      toast.error("Select an available slot first");
      return;
    }
    const parsed = bookingFormSchema.safeParse(form);
    if (!parsed.success) {
      const errs: typeof errors = {};
      parsed.error.issues.forEach((i) => (errs[i.path[0] as keyof BookingFormValues] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { data, error } = await supabase.rpc("create_booking", {
      _slot_id: selectedSlot.id,
      _start_at: window_.start.toISOString(),
      _duration_hours: duration,
      _customer_name: parsed.data.customer_name,
      _customer_phone: parsed.data.customer_phone,
      _customer_email: parsed.data.customer_email,
      _vehicle_number: normaliseVehicleNumber(parsed.data.vehicle_number),
    });
    setSubmitting(false);
    if (error || !data) {
      toast.error(error?.message ?? "Booking failed. Please try again.");
      queryClient.invalidateQueries({ queryKey: ["facility-live", facility.id] });
      return;
    }
    if (!profile?.phone || !profile?.full_name) {
      void supabase
        .from("profiles")
        .update({ full_name: profile?.full_name || parsed.data.customer_name, phone: profile?.phone || parsed.data.customer_phone })
        .eq("id", user!.id);
    }
    toast.success(`Booking ${data.booking_code} confirmed`);
    queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    navigate({ to: "/bookings/$bookingId", params: { bookingId: data.id } });
  }

  const field = (k: keyof BookingFormValues) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value })),
    "aria-invalid": !!errors[k],
  });

  return (
    <section id="book" className="scroll-mt-24 rounded-3xl border bg-card p-5 shadow-card sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Reserve a slot</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pick your arrival time, choose a bay and confirm.</p>
        </div>
        {facility.is_demo && <DemoDataBadge />}
      </div>

      {/* Step 1: time */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="bk-date">Booking date</Label>
          <Input id="bk-date" type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bk-time">Arrival time</Label>
          <Input id="bk-time" type="time" step={900} value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Parking duration</Label>
          <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATIONS.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d < 24 ? `${d} hour${d > 1 ? "s" : ""}` : `${d / 24} day${d > 24 ? "s" : ""}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Vehicle type</Label>
          <Select value={vehicle} onValueChange={(v) => setVehicle(v as VehicleKind)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {facility.vehicle_types.map((v) => (
                <SelectItem key={v} value={v}>
                  <span className="inline-flex items-center gap-2">
                    {v === "two_wheeler" ? <Bike className="h-4 w-4" /> : <Car className="h-4 w-4" />} {VEHICLE_LABEL[v]}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Step 2: slot */}
      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Choose your slot</h3>
          <div className="flex items-center gap-3">
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <SlotLegend />
          </div>
        </div>
        <SlotLayout slots={slots} reserved={reserved} selectedId={slotId} onSelect={(s) => setSlotId(s.id)} vehicle={vehicle} />
        {facility.is_demo && (
          <p className="mt-2 text-xs text-muted-foreground">
            Slot states shown here are sample data for demonstration and do not reflect a real car park.
          </p>
        )}
      </div>

      {/* Step 3: details */}
      {!user ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-secondary p-6 text-center">
          <LogIn className="h-6 w-6 text-primary" />
          <p className="text-sm text-secondary-foreground">Sign in to reserve this slot and receive your QR booking pass.</p>
          <Button asChild className="rounded-full">
            <Link to="/auth" search={{ redirect: `/parking/${facility.id}#book` }}>
              Sign in to reserve
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldBox id="bk-name" label="Full name" error={errors.customer_name}>
              <Input id="bk-name" autoComplete="name" maxLength={100} {...field("customer_name")} />
            </FieldBox>
            <FieldBox id="bk-phone" label="Mobile number" error={errors.customer_phone}>
              <Input id="bk-phone" inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="10-digit mobile" {...field("customer_phone")} />
            </FieldBox>
            <FieldBox id="bk-email" label="Email" error={errors.customer_email}>
              <Input id="bk-email" type="email" autoComplete="email" maxLength={255} {...field("customer_email")} />
            </FieldBox>
            <FieldBox id="bk-vehicle" label="Vehicle registration number" error={errors.vehicle_number}>
              <Input id="bk-vehicle" placeholder="e.g. OD02AB1234" maxLength={15} className="uppercase" {...field("vehicle_number")} />
            </FieldBox>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <p className="font-semibold">
                {selectedSlot ? `Slot ${selectedSlot.slot_code} · ${selectedSlot.floor_label}` : "No slot selected"}
              </p>
              <p className="text-muted-foreground">
                {VEHICLE_LABEL[vehicle]} · {duration} h · Estimated {formatINR(estimate)}{" "}
                <span className="text-xs">(pay at facility)</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Free cancellation until {facility.cancellation_cutoff_hours} hour(s) before arrival.
              </p>
            </div>
            <Button type="submit" size="lg" disabled={submitting || !selectedSlot} className="rounded-xl">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Confirm booking
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

function FieldBox({ id, label, error, children }: { id: string; label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
