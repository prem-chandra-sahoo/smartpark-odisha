import { createFileRoute, Link } from "@tanstack/react-router";
import { Cpu, Eye, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/PageHero";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us – SmartPark Odisha" },
      { name: "description", content: "SmartPark Odisha helps drivers find safe, legal parking across Odisha and helps operators fill their spaces." },
      { property: "og:title", content: "About SmartPark Odisha" },
      { property: "og:description", content: "Our mission: safe, legal and available parking for everyone in Odisha." },
    ],
  }),
  component: About,
});

const VALUES = [
  { icon: ShieldCheck, t: "Honest by design", d: "We never invent parking locations, live slot counts or government partnerships. Sample listings are always labelled." },
  { icon: Eye, t: "Transparent verification", d: "A facility is shown as verified only after an administrator reviews its authorisation documents." },
  { icon: Users, t: "Built for visitors", d: "Tourists, patients, students and commuters — anyone heading somewhere new in Odisha." },
  { icon: Cpu, t: "Ready for smart sensors", d: "Each slot can be linked to a sensor so availability can update automatically in future." },
];

function About() {
  return (
    <>
      <PageHero eyebrow="About us" title="Safe, legal parking — found before you arrive.">
        People visiting unfamiliar places in Odisha often struggle to find parking that is safe, legal and available.
        SmartPark Odisha brings authorised parking facilities together in one place, with slot-level booking.
      </PageHero>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.t} className="rounded-2xl border bg-card p-6 shadow-card">
              <v.icon className="h-7 w-7 text-primary" />
              <h2 className="mt-4 text-lg font-semibold">{v.t}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{v.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-3xl bg-secondary p-8 text-center">
          <p className="text-sm text-secondary-foreground">
            SmartPark Odisha is an independent platform and is not affiliated with any government department.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-full"><Link to="/find-parking">Find parking</Link></Button>
            <Button asChild variant="outline" className="rounded-full"><Link to="/list-your-parking">List your parking</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
