import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, ErrorState, Skeletons } from "@/components/drop/cards";
import { StatusPill } from "@/components/drop/StatusTimeline";
import { api } from "@/lib/api";
import { ago, inr, timeRange } from "@/lib/format";
import { LOCALITIES } from "@/lib/catalog";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — DROP" },
      { name: "description", content: "Review pending listings, users, bookings and flagged web events." },
      { property: "og:title", content: "Admin — DROP" },
      { property: "og:description", content: "DROP admin console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});


function Admin() {
  const nav = useNavigate();
  useEffect(() => { const user = localStorage.getItem("drop_user"); const parsed = user ? JSON.parse(user) as { role?: string } : null; if (!localStorage.getItem("drop_token") || parsed?.role !== "ADMIN") nav({ to: "/auth" }); }, [nav]);
  const qc = useQueryClient();
  const pending = useQuery({ queryKey: ["pending"], queryFn: api.getPendingVenues });
  const review = useMutation({ mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) => api.reviewVenue(id, action), onSuccess: () => { qc.invalidateQueries({ queryKey: ["pending"] }); qc.invalidateQueries({ queryKey: ["venues"] }); toast.success("Venue review saved"); } });
  const [allocationResult, setAllocationResult] = useState<Awaited<ReturnType<typeof api.allocateRequests>> | null>(null);
  const allocate = useMutation({ mutationFn: (requests: Array<{ guests: number }>) => api.allocateRequests(requests), onSuccess: (r) => { setAllocationResult(r); toast.success(`Found space suggestions for ${r.matchedCount} requests`); }, onError: (error) => toast.error(error.message) });
  const bookings = useQuery({ queryKey: ["bookings"], queryFn: api.getMyBookings });
  const evs = useQuery({ queryKey: ["events", {}], queryFn: () => api.getEvents() });
  const venues = useQuery({ queryKey: ["venues", {}], queryFn: () => api.getVenues() });
  const [done, setDone] = useState<Record<string, string>>({});
  const flagged = (evs.data ?? []).filter((e) => e.flagged && !done[e.id]);
  const WEEKLY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => ({ d, bookings: (bookings.data ?? []).filter((b) => new Date(b.createdAt).getDay() === (i + 1) % 7).length }));
  const byLoc = LOCALITIES.map((l) => ({ l: l.name, spaces: (venues.data ?? []).filter((v) => v.locality === l.name).length }));
  const decide = (id: string, label: string) => { setDone((d) => ({ ...d, [id]: label })); toast.success(label); };

  return (
    <div className="space-y-8">
      <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-coral">DROP team workspace</p><h1 className="text-4xl sm:text-6xl">Admin console</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Review venue submissions, moderate public event listings and monitor platform activity.</p></div>
      <div className="grid gap-4 sm:grid-cols-4">
        {[["Spaces live", venues.data?.length ?? "–"], ["Pending listings", pending.data?.length ?? "–"], ["Bookings", bookings.data?.length ?? "–"], ["Flagged events", flagged.length]].map(([l, v]) => (
          <div key={String(l)} className="rounded-2xl bg-card p-5"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-1 font-display text-3xl font-bold">{v}</p></div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-card p-5"><p className="mb-3 font-semibold">Booking requests this week</p>
          <ResponsiveContainer width="100%" height={220}><LineChart data={WEEKLY}><CartesianGrid stroke="var(--border)" /><XAxis dataKey="d" stroke="var(--muted-foreground)" /><YAxis stroke="var(--muted-foreground)" /><Tooltip /><Line dataKey="bookings" stroke="var(--coral)" strokeWidth={3} /></LineChart></ResponsiveContainer>
        </div>
        <div className="rounded-2xl bg-card p-5"><p className="mb-3 font-semibold">Spaces by locality</p>
          <ResponsiveContainer width="100%" height={220}><BarChart data={byLoc}><CartesianGrid stroke="var(--border)" /><XAxis dataKey="l" stroke="var(--muted-foreground)" fontSize={11} /><YAxis stroke="var(--muted-foreground)" allowDecimals={false} /><Tooltip /><Bar dataKey="spaces" fill="var(--foreground)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </div>
      </div>
      <Tabs defaultValue="pending">
        <TabsList className="flex-wrap"><TabsTrigger value="pending">Pending listings</TabsTrigger><TabsTrigger value="flagged">Flagged web events</TabsTrigger><TabsTrigger value="bookings">Bookings</TabsTrigger></TabsList>
        <TabsContent value="pending" className="pt-4">
          {pending.isPending ? <Skeletons n={2} wide /> : pending.error ? <ErrorState error={pending.error} /> : pending.data.filter((v) => !done[v.id]).length === 0 ? <Empty title="No listings waiting" /> : (
            <ul className="space-y-3">{pending.data.filter((v) => !done[v.id]).map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-card p-4">
                <img src={v.images[0]} alt="" className="h-16 w-24 rounded-xl object-cover" />
                <div className="flex-1"><p className="font-semibold">{v.name}</p><p className="text-sm text-muted-foreground">{v.category} · {v.locality} · {inr(v.pricing.HOUR)}/hr</p></div>
                <Button size="sm" variant="coral" disabled={review.isPending} onClick={() => review.mutate({ id: v.id, action: "approve" })}>Approve</Button>
                <Button size="sm" variant="outline" disabled={review.isPending} onClick={() => review.mutate({ id: v.id, action: "reject" })}>Reject</Button>
              </li>))}</ul>
          )}
        </TabsContent>
        <TabsContent value="flagged" className="pt-4">
          {evs.isPending ? <Skeletons n={2} wide /> : flagged.length === 0 ? <Empty title="No flagged events" /> : (
            <ul className="space-y-3">{flagged.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-card p-4">
                <div className="flex-1"><p className="font-semibold">{e.title}</p><p className="text-sm text-muted-foreground">{e.venueName} · {timeRange(e.startDatetime, e.endDatetime)} · fetched {ago(e.fetchedAt)}</p>
                  <a href={e.sourceUrl} target="_blank" rel="noreferrer" className="text-xs underline">{e.sourceUrl}</a></div>
                <Button size="sm" variant="coral" onClick={() => decide(e.id, "Event approved")}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => decide(e.id, "Event hidden")}>Hide</Button>
              </li>))}</ul>
          )}
        </TabsContent>
        <TabsContent value="bookings" className="pt-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"><div><p className="font-semibold">Space suggestions for booking requests</p><p className="text-xs text-muted-foreground">Find a distinct approved space for each request based on guest capacity. Suggestions don't send or approve requests.</p></div><Button variant="coral" disabled={allocate.isPending || !(bookings.data?.length)} onClick={() => allocate.mutate((bookings.data ?? []).filter((b) => b.status === "REQUESTED").map((b) => ({ guests: b.guests })))}>{allocate.isPending ? "Finding spaces…" : "Find spaces"}</Button></div>
          {allocationResult && <div className="mb-4 rounded-xl border bg-card p-4"><p className="font-semibold">Suggested spaces · {allocationResult.matchedCount} requests matched</p><ul className="mt-2 space-y-1 text-sm">{allocationResult.matches.map((m) => <li key={m.requestIndex}>Request {m.requestIndex + 1}: {m.matched && m.venue ? <span className="font-medium">{m.venue.name} · {m.venue.locality}</span> : <span className="text-destructive">No suitable space found</span>}</li>)}</ul></div>}
          {bookings.isPending ? <Skeletons n={2} wide /> : (bookings.data ?? []).length === 0 ? <Empty title="No bookings" /> : (
            <div className="overflow-x-auto rounded-2xl bg-card"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Customer</th><th className="p-3">Space</th><th className="p-3">When</th><th className="p-3">Total</th><th className="p-3">Status</th></tr></thead>
              <tbody>{bookings.data!.map((b) => <tr key={b.id} className="border-b last:border-0"><td className="p-3">{b.customerName}</td><td className="p-3">{b.venueName}</td><td className="p-3">{timeRange(b.start, b.end)}</td><td className="p-3 font-semibold">{inr(b.total)}</td><td className="p-3"><StatusPill status={b.status} /></td></tr>)}</tbody></table></div>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}
