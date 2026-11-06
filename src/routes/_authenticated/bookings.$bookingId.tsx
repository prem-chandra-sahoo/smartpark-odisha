import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Loader2, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DemoDataBadge } from "@/components/parking/badges";
import { directionsUrl } from "@/components/parking/directions";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, VEHICLE_LABEL } from "@/lib/parking";

export const Route = createFileRoute("/_authenticated/bookings/$bookingId")({
  head: () => ({
    meta: [
      { title: "Your booking – SmartPark Odisha" },
      { name: "description", content: "Booking confirmation and QR pass." },
      { property: "og:title", content: "Booking – SmartPark Odisha" },
      { property: "og:description", content: "Booking confirmation and QR pass." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BookingPage,
});

function fmt(d: string) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(new Date(d));
}

function BookingPage() {
  const { bookingId } = Route.useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, parking_facilities(name,address,latitude,longitude,is_demo,cancellation_cutoff_hours), parking_slots(slot_code,floor_label)")
        .eq("id", bookingId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data) return <p className="py-24 text-center text-muted-foreground">Booking not found.</p>;
  const f = data.parking_facilities;
  const cutoff = new Date(data.start_at).getTime() - (f?.cancellation_cutoff_hours ?? 0) * 3600_000;
  const canCancel = data.status === "confirmed" && Date.now() < cutoff;

  async function cancel() {
    const { error } = await supabase.rpc("cancel_booking", { _booking_id: bookingId });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Booking cancelled");
    qc.invalidateQueries({ queryKey: ["booking", bookingId] });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-3xl border bg-card p-6 text-center shadow-card sm:p-8">
        {data.status === "confirmed" && <CheckCircle2 className="mx-auto h-10 w-10 text-success" />}
        <h1 className="mt-3 text-2xl font-bold">
          {data.status === "confirmed" ? "Booking confirmed" : data.status === "cancelled" ? "Booking cancelled" : "Booking completed"}
        </h1>
        <p className="mt-1 font-display text-lg font-semibold text-primary">{data.booking_code}</p>
        {f?.is_demo && <DemoDataBadge className="mt-3" />}
        <div className="mx-auto mt-6 inline-block rounded-2xl bg-card p-4 ring-1 ring-border">
          <QRCodeSVG value={`SMARTPARK:${data.booking_code}:${data.id}`} size={200} />
        </div>
        <dl className="mt-6 grid gap-3 text-left text-sm sm:grid-cols-2">
          <Item k="Facility" v={f?.name ?? ""} />
          <Item k="Slot" v={`${data.parking_slots?.slot_code} · ${data.parking_slots?.floor_label}`} />
          <Item k="Arrival" v={fmt(data.start_at)} />
          <Item k="Until" v={fmt(data.end_at)} />
          <Item k="Vehicle" v={`${data.vehicle_number} (${VEHICLE_LABEL[data.vehicle_type]})`} />
          <Item k="Estimated amount" v={`${formatINR(data.estimated_amount)} · pay at facility`} />
        </dl>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {f && (
            <Button asChild className="rounded-full">
              <a href={directionsUrl(f.latitude, f.longitude)} target="_blank" rel="noreferrer"><Navigation className="h-4 w-4" /> Get Directions</a>
            </Button>
          )}
          <Button asChild variant="outline" className="rounded-full"><Link to="/dashboard">My bookings</Link></Button>
          {canCancel && <Button variant="destructive" className="rounded-full" onClick={cancel}>Cancel booking</Button>}
        </div>
      </div>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
