import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, CheckCircle2, FileText, Hospital, Plane, ShoppingBag, TrainFront, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/PageHero";

export const Route = createFileRoute("/list-your-parking")({
  head: () => ({
    meta: [
      { title: "List Your Parking – SmartPark Odisha" },
      { name: "description", content: "Register your authorised parking facility in Odisha, upload permission documents and receive advance reservations once verified." },
      { property: "og:title", content: "List your parking on SmartPark Odisha" },
      { property: "og:description", content: "Register, get verified and start receiving reservations." },
    ],
  }),
  component: ListYourParking,
});

const WHO = [
  { icon: Building2, t: "Municipal & government operators" },
  { icon: TrainFront, t: "Railway station parking" },
  { icon: Plane, t: "Airport parking" },
  { icon: ShoppingBag, t: "Shopping malls" },
  { icon: Hospital, t: "Hospitals" },
  { icon: Warehouse, t: "Private parking with valid permission" },
];

const NEEDED = [
  "Facility name, operator name and full address",
  "Exact location (pin on map or coordinates) and Google Maps link",
  "Contact number and email",
  "Total capacity and supported vehicle types",
  "Hourly and daily rates, operating hours",
  "Authorisation / permission document (PDF or image)",
  "Issuing authority, document number and validity dates",
];

function ListYourParking() {
  return (
    <>
      <PageHero eyebrow="For parking owners" title="Fill your bays with drivers who've already booked.">
        Register your facility, upload your authorisation documents and get reviewed by a SmartPark administrator. Once
        verified, drivers can find and reserve your slots in advance.
      </PageHero>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold">Who can register</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WHO.map((w) => (
            <div key={w.t} className="flex items-center gap-3 rounded-2xl border bg-card p-5">
              <w.icon className="h-6 w-6 text-primary" /> <span className="font-medium">{w.t}</span>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border bg-card p-7 shadow-card">
            <FileText className="h-7 w-7 text-primary" />
            <h2 className="mt-4 text-xl font-bold">What you'll need</h2>
            <ul className="mt-4 space-y-2.5">
              {NEEDED.map((n) => (
                <li key={n} className="flex gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {n}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-secondary p-7">
            <h2 className="text-xl font-bold">The verification process</h2>
            <ol className="mt-4 space-y-4 text-sm">
              <li><strong>1. Submit</strong> — your listing is saved as <em>Pending Verification</em> and is hidden from public search.</li>
              <li><strong>2. Review</strong> — an administrator checks your details and authorisation documents.</li>
              <li><strong>3. Decision</strong> — your listing is marked <em>Verified</em> and goes live, or <em>Rejected</em> with a reason you can address.</li>
              <li><strong>4. Manage</strong> — update rates, hours, slots and live availability from your owner dashboard. Changing your name, address or location sends the listing back for review.</li>
            </ol>
            <p className="mt-6 text-xs text-muted-foreground">
              SmartPark Odisha never displays government seals or claims official approval. "Verified" means our
              administrators reviewed the documents you supplied.
            </p>
            <Button asChild size="lg" className="mt-6 rounded-full">
              <Link to="/owner/new">Register your facility</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
