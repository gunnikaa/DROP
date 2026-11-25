import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, ErrorState, EventCard, Skeletons, VenueCard } from "@/components/drop/cards";
import { StatusTimeline } from "@/components/drop/StatusTimeline";
import { api } from "@/lib/api";
import { inr, timeRange } from "@/lib/format";
import type { Booking } from "@/lib/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My bookings — DROP" },
      { name: "description", content: "Your upcoming bookings, request statuses, history and saved spaces and events." },
      { property: "og:title", content: "My bookings — DROP" },
      { property: "og:description", content: "Track your DROP bookings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

export function BookingRow({ b, actions }: { b: Booking; actions?: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-4 rounded-2xl bg-card p-4 sm:flex-row sm:items-center">
      <img src={b.venueImage} alt="" className="h-20 w-full rounded-xl object-cover sm:w-28" />
      <div className="flex-1 space-y-1">
        <p className="font-semibold">{b.venueName} <span className="text-muted-foreground">· {b.locality}</span></p>
        <p className="text-sm text-muted-foreground">{timeRange(b.start, b.end)} · {b.guests} guests · {b.purpose}</p>
        <StatusTimeline status={b.status} />
      </div>
      <div className="flex items-center gap-2 sm:flex-col sm:items-end"><p className="font-bold">{inr(b.total)}</p>{actions}</div>
    </li>
  );
}

function Dashboard() {
  const nav = useNavigate();
  useEffect(() => { const user = localStorage.getItem("drop_user"); const parsed = user ? JSON.parse(user) as { role?: string } : null; if (!localStorage.getItem("drop_token") || parsed?.role !== "CUSTOMER") nav({ to: "/auth" }); }, [nav]);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["bookings"], queryFn: api.getMyBookings });
  const saved = useQuery({ queryKey: ["venues", {}], queryFn: () => api.getVenues() });
  const evs = useQuery({ queryKey: ["events", {}], queryFn: () => api.getEvents() });
  const cancel = useMutation({ mutationFn: (id: string) => api.updateBooking(id, "cancel"), onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }) });
  const currentUser = JSON.parse(localStorage.getItem("drop_user") ?? "{}") as { name?: string };
  const mine = q.data ?? [];
  const now = new Date().toISOString();
  const groups = {
    upcoming: mine.filter((b) => b.status === "APPROVED" && b.start > now),
    requests: mine.filter((b) => b.status === "REQUESTED" || b.status === "REJECTED"),
    history: mine.filter((b) => b.status === "COMPLETED" || b.status === "CANCELLED" || (b.status === "APPROVED" && b.start <= now)),
  };
  const list = (bs: Booking[], empty: string) =>
    q.isPending ? <div className="grid gap-4"><Skeletons n={2} wide /></div> : q.error ? <ErrorState error={q.error} retry={q.refetch} /> : bs.length === 0 ? <Empty title={empty} /> : (
      <ul className="space-y-3">{bs.map((b) => <BookingRow key={b.id} b={b} actions={(b.status === "REQUESTED" || b.status === "APPROVED") && b.start > now ? <Button size="sm" variant="outline" onClick={() => cancel.mutate(b.id)}>Cancel</Button> : null} />)}</ul>
    );
  return (
    <div className="space-y-6">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-coral">Customer workspace</p><h1 className="text-4xl sm:text-6xl">Hi, {currentUser.name?.split(" ")[0] ?? "there"}.</h1>
      <Tabs defaultValue="upcoming">
        <TabsList className="flex-wrap"><TabsTrigger value="upcoming">Upcoming</TabsTrigger><TabsTrigger value="requests">Requests</TabsTrigger><TabsTrigger value="history">History</TabsTrigger><TabsTrigger value="spaces">Saved spaces</TabsTrigger><TabsTrigger value="events">Saved events</TabsTrigger></TabsList>
        <TabsContent value="upcoming" className="pt-4">{list(groups.upcoming, "No upcoming bookings")}</TabsContent>
        <TabsContent value="requests" className="pt-4">{list(groups.requests, "No open requests")}</TabsContent>
        <TabsContent value="history" className="pt-4">{list(groups.history, "No past bookings yet")}</TabsContent>
        <TabsContent value="spaces" className="pt-4"><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{saved.isPending ? <Skeletons wide /> : (saved.data ?? []).slice(2, 6).map((v) => <VenueCard key={v.id} v={v} wide />)}</div></TabsContent>
        <TabsContent value="events" className="pt-4"><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{evs.isPending ? <Skeletons n={3} wide /> : (evs.data ?? []).slice(6, 9).map((e) => <EventCard key={e.id} e={e} wide />)}</div></TabsContent>
      </Tabs>
    </div>
  );
}
