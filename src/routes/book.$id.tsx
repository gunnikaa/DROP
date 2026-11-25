import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/drop/cards";
import { StatusTimeline } from "@/components/drop/StatusTimeline";
import { api } from "@/lib/api";
import { inr, priceSummary } from "@/lib/format";

export const Route = createFileRoute("/book/$id")({
  head: () => ({
    meta: [
      { title: "Request a booking — DROP" },
      { name: "description", content: "Choose your dates, tell the owner what you're planning and send a booking request." },
      { property: "og:title", content: "Request a booking — DROP" },
      { property: "og:description", content: "Send a booking request for a Mumbai space." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Book,
});

const inp = "h-11 w-full rounded-xl border bg-card px-3";
const mumbaiIso = (value: string) => value ? `${value}:00+05:30` : "";

function Book() {
  const nav = useNavigate();
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const v = useQuery({ queryKey: ["venue", id], queryFn: () => api.getVenue(id) });
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [purpose, setPurpose] = useState("");
  const [guests, setGuests] = useState(20);
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("drop_user") ?? "{}") as { role?: string };
    if (!localStorage.getItem("drop_token") || user.role !== "CUSTOMER") nav({ to: "/auth" });
  }, [nav]);
  const m = useMutation({
    mutationFn: () => api.createBooking({ venueId: id, start: mumbaiIso(start), end: mumbaiIso(end), purpose, guests }),
    onSuccess: () => { toast.success("Request sent to the owner"); qc.invalidateQueries({ queryKey: ["bookings"] }); },
    onError: (e) => toast.error(e.message),
  });

  if (v.isPending) return <Skeleton className="h-96 rounded-3xl" />;
  if (v.error) return <ErrorState error={v.error} />;
  const startAt = start ? new Date(mumbaiIso(start)).getTime() : 0;
  const endAt = end ? new Date(mumbaiIso(end)).getTime() : 0;
  const hours = start && end ? (endAt - startAt) / 3600_000 : 0;
  const startHour = start ? Number(start.slice(11, 13)) : 0;
  const endHour = end ? Number(end.slice(11, 13)) : 0;
  const endMinute = end ? Number(end.slice(14, 16)) : 0;
  const valid = hours >= 1 && startAt > Date.now() && start.slice(0, 10) === end.slice(0, 10) && startHour >= 6 && startHour < 23 && (endHour < 23 || endHour === 23 && endMinute <= 30) && purpose.trim().length > 2 && guests > 0 && guests <= v.data.capacity && v.data.status === "APPROVED" && v.data.dataLabel === "OWNER_SUBMITTED";
  const p = priceSummary(v.data.pricing.HOUR, Math.max(0, hours));

  if (m.data)
    return (
      <div className="mx-auto max-w-xl space-y-6 rounded-3xl bg-card p-8 text-center">
        <h1 className="text-4xl">Request sent.</h1>
        <p className="text-muted-foreground">{v.data.name} will respond soon. Track it in your bookings.</p>
        <div className="flex justify-center"><StatusTimeline status={m.data.status} /></div>
        <Button asChild variant="coral" size="lg"><Link to="/dashboard">View my bookings</Link></Button>
      </div>
    );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); if (valid) m.mutate(); }}>
        <h1 className="text-4xl sm:text-5xl">Request {v.data.name}</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-semibold">From (Mumbai time)<input required type="datetime-local" step={60} className={inp} value={start} onChange={(e) => setStart(e.target.value)} /></label>
          <label className="space-y-1.5 text-sm font-semibold">To (Mumbai time)<input required type="datetime-local" step={60} className={inp} value={end} min={start} onChange={(e) => setEnd(e.target.value)} /></label>
        </div>
        {start && end && hours < 1 && <p className="text-sm text-destructive">End time must be at least an hour after the start.</p>}
        {start && end && start.slice(0, 10) !== end.slice(0, 10) && <p className="text-sm text-destructive">Start and end must be on the same Mumbai calendar day.</p>}
        {start && startAt <= Date.now() && <p className="text-sm text-destructive">Choose a future start time.</p>}
        {start && (startHour < 6 || startHour >= 23 || end && (endHour > 23 || endHour === 23 && endMinute > 30)) && <p className="text-sm text-destructive">Bookings are available between 06:00 and 23:30 Mumbai time.</p>}
        {start && end && hours >= 1 && <p className="text-xs text-muted-foreground">Start and end can use any minute. Availability is reserved in half-hour blocks.</p>}
        {v.data.status !== "APPROVED" && <p className="text-sm text-destructive">This venue is awaiting admin approval.</p>}
        {v.data.status === "APPROVED" && v.data.dataLabel !== "OWNER_SUBMITTED" && <p className="text-sm text-destructive">This listing is not an owner-submitted DROP venue.</p>}
        {purpose.trim().length > 0 && purpose.trim().length <= 2 && <p className="text-sm text-destructive">Please describe your booking in at least 3 characters.</p>}
        {guests > v.data.capacity && <p className="text-sm text-destructive">This venue can host up to {v.data.capacity} guests.</p>}
        <label className="block space-y-1.5 text-sm font-semibold">What are you planning?<Textarea required value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. A two-day pop-up for our handmade ceramics label" className="rounded-xl bg-card" /></label>
        <label className="block space-y-1.5 text-sm font-semibold">Guests (max {v.data.capacity})<input type="number" min={1} max={v.data.capacity} className={inp} value={guests} onChange={(e) => setGuests(Number(e.target.value))} /></label>
        <Button type="submit" variant="coral" size="lg" disabled={!valid || m.isPending}>{m.isPending ? "Sending…" : "Send request"}</Button>
        {!valid && !m.isPending && <p className="text-xs text-muted-foreground">Complete the required fields with a future, same-day time range of at least one hour (06:00–23:30) to send your request.</p>}
        <div className="pt-2"><p className="mb-2 text-sm text-muted-foreground">What happens next</p><StatusTimeline status="REQUESTED" /></div>
      </form>
      <aside className="space-y-3 self-start rounded-2xl bg-card p-6">
        <img src={v.data.images[0]} alt="" className="aspect-video w-full rounded-xl object-cover" />
        <p className="font-semibold">{v.data.name}</p>
        {v.data.contactPhone && <p className="text-sm text-muted-foreground">Venue contact: {v.data.contactPhone}</p>}
        <dl className="space-y-2 border-t pt-3 text-sm">
          <Row l={`${inr(v.data.pricing.HOUR)} × ${hours > 0 ? hours.toFixed(1) : "Select duration"} hrs`} r={inr(p.subtotal)} />
          <Row l="DROP fee (8%)" r={inr(p.fee)} />
          <div className="flex justify-between border-t pt-2 text-base font-bold"><dt>Total</dt><dd>{inr(p.total)}</dd></div>
        </dl>
      </aside>
    </div>
  );
}
function Row({ l, r }: { l: string; r: string }) {
  return <div className="flex justify-between"><dt className="text-muted-foreground">{l}</dt><dd>{r}</dd></div>;
}
