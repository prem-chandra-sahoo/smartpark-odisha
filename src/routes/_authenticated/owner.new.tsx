import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/owner/new")({
  head: () => ({
    meta: [
      { title: "Register your facility – SmartPark Odisha" },
      { name: "description", content: "Register a parking facility for verification." },
      { property: "og:title", content: "Register your facility – SmartPark Odisha" },
      { property: "og:description", content: "Register a parking facility for verification." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Facility registration</h1>
      <p className="mt-3 text-muted-foreground">
        The registration form with document upload is being finished and will be available here shortly.
      </p>
      <Button asChild className="mt-6 rounded-full"><Link to="/owner">Back to owner portal</Link></Button>
    </div>
  ),
});
