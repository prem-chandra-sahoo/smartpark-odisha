import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/parking/badges";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin – SmartPark Odisha" },
      { name: "description", content: "Review and verify parking facilities." },
      { property: "og:title", content: "Admin – SmartPark Odisha" },
      { property: "og:description", content: "Review and verify parking facilities." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-pending"],
    enabled: isAdmin,
    queryFn: async () => (await supabase.from("parking_facilities").select("*").eq("status", "pending").order("created_at")).data ?? [],
  });

  async function decide(id: string, status: "verified" | "rejected") {
    const reason = status === "rejected" ? window.prompt("Reason for rejection?") : null;
    if (status === "rejected" && !reason) return;
    const { error } = await supabase.from("parking_facilities").update({ status, rejection_reason: reason }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "verified" ? "Facility verified" : "Facility rejected");
    qc.invalidateQueries({ queryKey: ["admin-pending"] });
  }

  if (loading) return null;
  if (!isAdmin) return <p className="py-24 text-center text-muted-foreground">You don't have admin access.</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Pending verification</h1>
      <ul className="mt-6 space-y-2">
        {(data ?? []).map((f) => (
          <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
            <span>
              <span className="font-semibold">{f.name}</span>
              <span className="block text-xs text-muted-foreground">{f.operator_name} · {f.address}</span>
            </span>
            <span className="flex items-center gap-2">
              <VerificationBadge status={f.status} />
              <Button size="sm" onClick={() => decide(f.id, "verified")}>Approve</Button>
              <Button size="sm" variant="destructive" onClick={() => decide(f.id, "rejected")}>Reject</Button>
            </span>
          </li>
        ))}
        {data?.length === 0 && <p className="text-sm text-muted-foreground">No pending applications.</p>}
      </ul>
    </div>
  );
}
