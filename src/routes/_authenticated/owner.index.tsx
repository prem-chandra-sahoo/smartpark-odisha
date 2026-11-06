import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/parking/badges";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/owner/")({
  head: () => ({
    meta: [
      { title: "Owner portal – SmartPark Odisha" },
      { name: "description", content: "Manage your registered parking facilities." },
      { property: "og:title", content: "Owner portal – SmartPark Odisha" },
      { property: "og:description", content: "Manage your registered parking facilities." },
    ],
  }),
  component: OwnerHome,
});

function OwnerHome() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["my-facilities", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("parking_facilities").select("*").eq("owner_id", user!.id)).data ?? [],
  });
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My facilities</h1>
        <Button asChild className="rounded-full"><Link to="/owner/new">Register a facility</Link></Button>
      </div>
      <ul className="mt-6 space-y-2">
        {(data ?? []).map((f) => (
          <li key={f.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
            <span>
              <span className="font-semibold">{f.name}</span>
              <span className="block text-xs text-muted-foreground">{f.address}</span>
              {f.rejection_reason && <span className="block text-xs text-danger">Reason: {f.rejection_reason}</span>}
            </span>
            <VerificationBadge status={f.status} />
          </li>
        ))}
        {data?.length === 0 && <p className="text-sm text-muted-foreground">You haven't registered a facility yet.</p>}
      </ul>
    </div>
  );
}
