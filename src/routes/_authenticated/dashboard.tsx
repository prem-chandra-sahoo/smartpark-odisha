import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My bookings – SmartPark Odisha" },
      { name: "description", content: "Your upcoming and past parking bookings." },
      { property: "og:title", content: "My bookings – SmartPark Odisha" },
      { property: "og:description", content: "Your upcoming and past parking bookings." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("bookings").select("*, parking_facilities(name)").eq("user_id", user!.id).order("start_at", { ascending: false })).data ?? [],
  });
  const now = Date.now();
  const upcoming = (data ?? []).filter((b) => b.status === "confirmed" && new Date(b.end_at).getTime() > now);
  const history = (data ?? []).filter((b) => !upcoming.includes(b));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">My bookings</h1>
      {isLoading ? (
        <Loader2 className="mt-10 h-6 w-6 animate-spin" />
      ) : (
        <>
          <Section title="Upcoming" list={upcoming} />
          <Section title="History" list={history} />
          {!data?.length && (
            <Button asChild className="mt-6 rounded-full"><Link to="/find-parking">Find parking</Link></Button>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, list }: { title: string; list: { id: string; booking_code: string; start_at: string; status: string; parking_facilities: { name: string } | null }[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      {list.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {list.map((b) => (
            <li key={b.id}>
              <Link to="/bookings/$bookingId" params={{ bookingId: b.id }} className="flex items-center justify-between rounded-xl border bg-card p-4 hover:shadow-card">
                <span>
                  <span className="font-semibold">{b.parking_facilities?.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {b.booking_code} · {new Date(b.start_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                  </span>
                </span>
                <span className="text-xs font-semibold capitalize text-primary">{b.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
