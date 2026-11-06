import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Clock,
  FileCheck2,
  IndianRupee,
  MapPin,
  Navigation,
  QrCode,
  Search,
  ShieldCheck,
  SquareParking,
  Wallet,
} from "lucide-react";
import heroImg from "@/assets/hero-parking.jpg";
import { Button } from "@/components/ui/button";
import { DestinationSearch } from "@/components/parking/DestinationSearch";
import { findCity, POPULAR_DESTINATIONS } from "@/lib/odisha";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartPark Odisha – Find your parking before you arrive" },
      {
        name: "description",
        content:
          "Discover authorised parking spaces across Bhubaneswar, Cuttack, Puri and more. Check available slots and reserve your parking before you arrive.",
      },
      { property: "og:title", content: "SmartPark Odisha – Find your parking before you arrive" },
      {
        property: "og:description",
        content: "Discover authorised parking across Odisha, check available slots and reserve in advance.",
      },
    ],
  }),
  component: HomePage,
});

const STEPS = [
  { icon: Search, title: "Search your destination", body: "Enter a landmark, area or address and pick your vehicle type." },
  { icon: BadgeCheck, title: "Compare verified parking", body: "See nearby facilities with price, hours and slot availability." },
  { icon: SquareParking, title: "Pick your slot", body: "Choose an exact bay on the interactive floor layout." },
  { icon: QrCode, title: "Reserve & show QR", body: "Get a booking ID and QR code, then navigate straight there." },
];

const BENEFITS = [
  { icon: Clock, title: "No more circling", body: "Arrive knowing exactly where you'll park — save time and fuel." },
  { icon: ShieldCheck, title: "Authorised spaces only", body: "Facilities appear as verified only after an admin reviews their permission documents." },
  { icon: IndianRupee, title: "Transparent pricing", body: "Hourly and daily rates are shown upfront, before you book." },
  { icon: CalendarCheck, title: "Flexible plans", body: "Book up to 30 days ahead and cancel within the facility's policy." },
];

function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient text-hero-foreground">
        <img
          src={heroImg}
          alt=""
          width={1600}
          height={1008}
          className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-hero-gradient opacity-70" />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 md:pb-28 md:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <MapPin className="h-3.5 w-3.5" /> Find your parking before you reach your destination.
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl">
            Your Destination. Your Parking. <span className="text-accent">Already Sorted.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-hero-foreground/80 sm:text-lg">
            Discover authorised parking spaces across Odisha, check available slots and reserve your parking before you
            arrive.
          </p>
          <div className="mt-10 max-w-5xl">
            <DestinationSearch variant="hero" />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-hero-foreground/70">
            <span>Try:</span>
            {POPULAR_DESTINATIONS.slice(0, 5).map((d) => (
              <DestinationChip key={d.label} label={d.label} city={d.city} />
            ))}
          </div>
        </div>
      </section>

      {/* Popular destinations */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">Popular destinations</p>
            <h2 className="mt-2 text-3xl font-bold">Where are you heading in Odisha?</h2>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/find-parking">
              Browse all parking <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {POPULAR_DESTINATIONS.map((d) => {
            const c = findCity(d.city)!;
            return (
              <Link
                key={d.label}
                to="/find-parking"
                search={{ q: d.label, city: d.city, lat: c.lat, lng: c.lng, approx: true }}
                className="group rounded-2xl border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Navigation className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-foreground">{d.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {d.kind} · {d.city}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Search parking <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          These are search examples only — they are not claims that authorised parking exists at each location.
        </p>
      </section>

      {/* How it works */}
      <section className="bg-secondary/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="text-sm font-semibold text-primary">How SmartPark works</p>
          <h2 className="mt-2 max-w-xl text-3xl font-bold">From search to slot in under a minute</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative rounded-2xl bg-card p-6 shadow-card">
                <span className="absolute right-5 top-5 font-display text-4xl font-extrabold text-secondary">{i + 1}</span>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-primary">Benefits of advance parking</p>
            <h2 className="mt-2 text-3xl font-bold">Park legally, safely and stress-free</h2>
            <p className="mt-4 text-muted-foreground">
              Illegal parking leads to fines, towing and traffic congestion. Reserving an authorised space before you
              travel keeps you — and the city — moving.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {BENEFITS.map((b) => (
                <div key={b.title} className="rounded-2xl border bg-card p-5">
                  <b.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-3 font-semibold">{b.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{b.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <img
              src={heroImg}
              alt="Organised parking lot at sunset"
              loading="lazy"
              width={1600}
              height={1008}
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-elevated"
            />
            <div className="absolute -bottom-6 left-6 right-6 rounded-2xl bg-card p-4 shadow-elevated sm:left-auto sm:w-72">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <QrCode className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Booking confirmed</p>
                  <p className="text-xs text-muted-foreground">Show your QR code at the entry gate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Owner CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-hero-gradient p-8 text-hero-foreground sm:p-12">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <p className="text-sm font-semibold text-accent">For parking facility owners</p>
              <h2 className="mt-2 text-3xl font-bold">List your authorised parking on SmartPark</h2>
              <p className="mt-3 max-w-xl text-hero-foreground/80">
                Municipal operators, railway and airport parking, malls, hospitals and private parking businesses with
                valid permission can register, upload their authorisation documents and start receiving reservations
                once verified.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/owner/new">Register your facility</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-hero-foreground/30 bg-transparent text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground">
                  <Link to="/list-your-parking">Learn more</Link>
                </Button>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                { icon: FileCheck2, t: "Upload permission documents securely" },
                { icon: BadgeCheck, t: "Get reviewed by a SmartPark administrator" },
                { icon: SquareParking, t: "Manage slots and live availability" },
                { icon: Wallet, t: "See every reservation in one dashboard" },
              ].map((x) => (
                <li key={x.t} className="flex items-center gap-3 rounded-xl bg-hero-foreground/5 p-3">
                  <x.icon className="h-5 w-5 text-accent" /> {x.t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

function DestinationChip({ label, city }: { label: string; city: string }) {
  const c = findCity(city)!;
  return (
    <Link
      to="/find-parking"
      search={{ q: label, city, lat: c.lat, lng: c.lng, approx: true }}
      className="rounded-full border border-hero-foreground/20 px-3 py-1 hover:border-accent hover:text-accent"
    >
      {label}
    </Link>
  );
}
