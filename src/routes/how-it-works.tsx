import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, MapPin, Navigation, QrCode, Scale, SquareParking } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/PageHero";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works – SmartPark Odisha" },
      { name: "description", content: "Search a destination, compare verified parking, choose a slot, reserve and navigate — here's how SmartPark Odisha works." },
      { property: "og:title", content: "How SmartPark Odisha works" },
      { property: "og:description", content: "From destination search to QR-confirmed parking in six simple steps." },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  { icon: MapPin, t: "Search your destination", d: "Type a landmark, area or address and choose your city and vehicle type." },
  { icon: BadgeCheck, t: "See verified parking nearby", d: "Only facilities whose authorisation documents an administrator has approved appear as Verified Authorised Parking." },
  { icon: Scale, t: "Compare availability and price", d: "Sort by distance, price or free spaces. Filter by vehicle type, covered parking or what's open right now." },
  { icon: SquareParking, t: "Select your slot", d: "Pick an exact bay on the floor-wise layout. Green is free, red occupied, yellow reserved and grey unavailable." },
  { icon: QrCode, t: "Reserve and get a QR pass", d: "We re-check the slot on our server and lock it for you. You receive a unique booking ID and QR code." },
  { icon: Navigation, t: "Navigate to your parking", d: "Tap Get Directions to open Google Maps navigation straight to the facility." },
];

function HowItWorks() {
  return (
    <>
      <PageHero eyebrow="How it works" title="Search. Compare. Reserve. Park.">
        SmartPark Odisha takes the guesswork out of parking in unfamiliar places — so you can focus on where you're going.
      </PageHero>
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <ol className="relative space-y-6 border-l-2 border-dashed border-primary/25 pl-8">
          {STEPS.map((s, i) => (
            <li key={s.t} className="relative rounded-2xl border bg-card p-6 shadow-card">
              <span className="absolute -left-[3.15rem] top-6 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <s.icon className="h-5 w-5" />
              </span>
              <p className="text-xs font-semibold text-primary">Step {i + 1}</p>
              <h2 className="mt-1 text-xl font-semibold">{s.t}</h2>
              <p className="mt-2 text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 rounded-2xl bg-secondary p-6">
          <h2 className="text-lg font-semibold">About cancellations</h2>
          <p className="mt-2 text-sm text-secondary-foreground">
            Each facility sets a free-cancellation window (for example, up to 1 hour before arrival). You can cancel
            eligible bookings from your dashboard. Payment is made at the facility.
          </p>
        </div>
        <div className="mt-10 text-center">
          <Button asChild size="lg" className="rounded-full">
            <Link to="/find-parking">Find parking now</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
