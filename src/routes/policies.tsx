import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/layout/PageHero";

export const Route = createFileRoute("/policies")({
  head: () => ({
    meta: [
      { title: "Policies – SmartPark Odisha" },
      { name: "description", content: "Privacy policy, terms of use and cancellation policy for SmartPark Odisha." },
      { property: "og:title", content: "SmartPark Odisha policies" },
      { property: "og:description", content: "Privacy, terms and cancellation policies." },
    ],
  }),
  component: Policies,
});

function Policies() {
  return (
    <>
      <PageHero eyebrow="Policies" title="Privacy, terms & cancellations" />
      <div className="mx-auto max-w-3xl space-y-12 px-4 py-16 sm:px-6">
        <section id="privacy" className="scroll-mt-24">
          <h2 className="text-2xl font-bold">Privacy policy</h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>We collect the details you provide — name, mobile number, email and vehicle registration — only to create and manage your parking reservations.</p>
            <p>Booking details are shared with the parking facility you reserve so they can admit your vehicle. Authorisation documents uploaded by owners are visible only to the owner and SmartPark administrators.</p>
            <p>You can update your profile at any time from your dashboard.</p>
          </div>
        </section>
        <section id="terms" className="scroll-mt-24">
          <h2 className="text-2xl font-bold">Terms of use</h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>SmartPark Odisha is a discovery and reservation platform. Parking is provided by the facility operator, who is responsible for the premises and their rules.</p>
            <p>"Verified Authorised Parking" means a SmartPark administrator has reviewed the documents supplied by the operator. It is not a government certification.</p>
            <p>Listings marked "Demo Data – Not Live" are samples for demonstration and do not represent real facilities.</p>
          </div>
        </section>
        <section id="cancellation" className="scroll-mt-24">
          <h2 className="text-2xl font-bold">Cancellation policy</h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>Each facility sets a free-cancellation window, shown before you book (for example, up to 1 hour before your arrival time).</p>
            <p>Within that window you can cancel from your dashboard. After it closes the booking can no longer be cancelled online.</p>
            <p>Payments are currently made at the facility; no online charges are taken by SmartPark Odisha.</p>
          </div>
        </section>
      </div>
    </>
  );
}
