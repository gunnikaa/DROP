import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Empty, ErrorState, Skeletons, VenueCard } from "@/components/drop/cards";
import { api } from "@/lib/api";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BookingRow } from "./dashboard";

export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Owner dashboard — DROP" },
      { name: "description", content: "Manage your listings, calendar, incoming requests and earnings on DROP." },
      { property: "og:title", content: "Owner dashboard — DROP" },
      { property: "og:description", content: "Run your spaces on DROP." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Owner,
});

function Owner() {
  const nav = useNavigate();
  useEffect(() => { const user = localStorage.getItem("drop_user"); const parsed = user ? JSON.parse(user) as { role?: string } : null; if (!localStorage.getItem("drop_token") || parsed?.role !== "OWNER") nav({ to: "/auth" }); }, [nav]);
  const qc = useQueryClient();
  const venues = useQuery({ queryKey: ["venues", "mine"], queryFn: api.getMyVenues });
  const bookings = useQuery({ queryKey: ["bookings"], queryFn: api.getMyBookings });
  const act = useMutation({
    mutationFn: ({ id, a }: { id: string; a: "approve" | "reject" }) => api.updateBooking(id, a),
    onSuccess: (b) => { toast.success(`Booking ${b.status.toLowerCase()}`); qc.invalidateQueries({ queryKey: ["bookings"] }); },
  });
  const currentUser = JSON.parse(localStorage.getItem("drop_user") ?? "{}") as { id?: string };
  const mine = venues.data ?? [];
  const [listing, setListing] = useState({ name: "", category: "Cafe hire", locality: "Bandra", unitLabel: "Event space", areaSqft: 500, capacity: 30, hourlyRate: 1500, description: "", contactPhone: "", amenities: "Wi-Fi, Washrooms, Power backup" });
  const createListing = useMutation({ mutationFn: () => api.createVenue({ ...listing, amenities: listing.amenities.split(",").map(x => x.trim()).filter(Boolean) }), onSuccess: () => { toast.success("New venue submitted for admin approval"); setListing({ name: "", category: "Cafe hire", locality: "Bandra", unitLabel: "Event space", areaSqft: 500, capacity: 30, hourlyRate: 1500, description: "", contactPhone: "", amenities: "Wi-Fi, Washrooms, Power backup" }); qc.invalidateQueries({ queryKey: ["venues"] }); }, onError: e => toast.error(e.message) });
  const today = new Date();
  const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const calendarDays = Array.from({ length: 14 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate()+i); return dateKey(d); });
  const availability = useQueries({ queries: mine.map((v) => ({ queryKey: ["owner-availability", v.id, calendarDays[0]], queryFn: () => api.getAvailability(v.id, calendarDays[0]!, calendarDays[13]!) })) });
  const ids = new Set(mine.map((v) => v.id));
  const incoming = (bookings.data ?? []).filter((b) => ids.has(b.venueId));
  const pending = incoming.filter((b) => b.status === "REQUESTED");
  const earned = incoming.filter((b) => b.status === "APPROVED" || b.status === "COMPLETED").reduce((s, b) => s + b.subtotal, 0);
  const [ev, setEv] = useState({ title: "", venue: "", start: "", end: "", price: "" });
  const postEvent = useMutation({ mutationFn: () => api.createEvent({ title: ev.title, venueId: ev.venue, startDatetime: new Date(ev.start).toISOString(), endDatetime: new Date(ev.end).toISOString(), priceText: ev.price || "Check organiser" }), onSuccess: () => { toast.success("Event published to DROP"); setEv({ title: "", venue: "", start: "", end: "", price: "" }); qc.invalidateQueries({ queryKey: ["events"] }); },
    onError: (error) => toast.error(error.message), });
  return (
    <div className="space-y-10">
      <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-coral">Venue partner workspace</p><h1 className="text-4xl sm:text-6xl">Your spaces</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Manage your own listings, confirm real availability and respond to customer requests. Only owner-confirmed slots should be treated as bookable.</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[["Earned this month", inr(earned)], ["Pending requests", String(pending.length)], ["Active listings", String(mine.length)]].map(([l, v]) => (
          <div key={l} className="rounded-2xl bg-card p-6"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-2 font-display text-4xl font-bold">{v}</p></div>
        ))}
      </div>
      <section className="space-y-4"><h2 className="text-2xl">Incoming requests</h2>
        {bookings.isPending ? <Skeletons n={2} wide /> : bookings.error ? <ErrorState error={bookings.error} /> : pending.length === 0 ? <Empty title="You're all caught up" /> : (
          <ul className="space-y-3">{pending.map((b) => <BookingRow key={b.id} b={b} actions={<div className="flex gap-2"><Button size="sm" variant="coral" onClick={() => act.mutate({ id: b.id, a: "approve" })}>Approve</Button><Button size="sm" variant="outline" onClick={() => act.mutate({ id: b.id, a: "reject" })}>Reject</Button></div>} />)}</ul>
        )}
      </section>
      <section className="space-y-4"><h2 className="text-2xl">Calendar · next 14 days</h2>
        <div className="overflow-x-auto rounded-2xl bg-card p-4">
          <table className="w-full text-xs"><tbody>
            {mine.map((v, r) => (
              <tr key={v.id}><th className="whitespace-nowrap pr-3 text-left font-semibold">{v.name}</th>
                {calendarDays.map((day) => { const state = availability[r]?.data?.find((x) => x.date === day)?.state ?? "FREE"; return <td key={day} className="p-0.5"><div title={`${day}: ${state}`} className={cn("h-7 min-w-7 rounded", state === "BOOKED" ? "bg-primary" : state === "BLOCKED" ? "striped" : "bg-verified/30")} /></td>; })}
              </tr>
            ))}
          </tbody></table>
        </div>
      </section>
      <section className="space-y-4"><h2 className="text-2xl">Create a new venue listing</h2>
        <form className="grid gap-3 rounded-2xl bg-card p-6 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); createListing.mutate(); }}>
          <FormField label="Venue name"><Input required placeholder="e.g. Dreamy Potatoes" value={listing.name} onChange={e => setListing({...listing,name:e.target.value})}/></FormField>
          <FormField label="Venue category"><select className="h-10 w-full rounded-xl border bg-card px-3" value={listing.category} onChange={e=>setListing({...listing,category:e.target.value})}>{["Cafe hire","Pop-up","Exhibition","Workshop","Studio","Rooftop","Corporate","Unique"].map(x=><option key={x}>{x}</option>)}</select></FormField>
          <FormField label="Locality / neighbourhood"><Input required placeholder="e.g. Bandra West" value={listing.locality} onChange={e=>setListing({...listing,locality:e.target.value})}/></FormField>
          <FormField label="Space type"><Input placeholder="e.g. Event space" value={listing.unitLabel} onChange={e=>setListing({...listing,unitLabel:e.target.value})}/></FormField>
          <FormField label="Area (sq ft)"><Input required type="number" min="1" placeholder="Enter area in square feet" value={listing.areaSqft} onChange={e=>setListing({...listing,areaSqft:Number(e.target.value)})}/></FormField>
          <FormField label="Maximum guest capacity"><Input required type="number" min="1" placeholder="Number of guests" value={listing.capacity} onChange={e=>setListing({...listing,capacity:Number(e.target.value)})}/></FormField>
          <FormField label="Hourly price (₹ per hour)"><Input required type="number" min="1" placeholder="Enter amount in rupees" value={listing.hourlyRate} onChange={e=>setListing({...listing,hourlyRate:Number(e.target.value)})}/></FormField>
          <FormField label="Owner contact phone (optional)"><Input placeholder="Phone number" value={listing.contactPhone} onChange={e=>setListing({...listing,contactPhone:e.target.value})}/></FormField>
          <FormField label="Amenities (separate with commas)"><Input placeholder="e.g. Wi-Fi, washrooms, power backup" value={listing.amenities} onChange={e=>setListing({...listing,amenities:e.target.value})}/></FormField>
          <FormField label="Description (optional)"><Input placeholder="Describe your space" value={listing.description} onChange={e=>setListing({...listing,description:e.target.value})}/></FormField>
          <Button type="submit" variant="coral" disabled={createListing.isPending}>{createListing.isPending?"Submitting…":"Submit new venue for approval"}</Button>
          <p className="text-xs text-muted-foreground sm:col-span-2">This creates a brand-new listing owned by your account. It remains pending until DROP Admin approves it.</p>
        </form>
      </section>
      <section className="space-y-4"><h2 className="text-2xl">My listings</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{venues.isPending ? <Skeletons wide /> : mine.length === 0 ? <Empty title="No listings yet" /> : mine.map((v) => <VenueCard key={v.id} v={v} wide />)}</div>
      </section>
      <section className="space-y-4"><h2 className="text-2xl">Post an event at my space</h2>
        <form className="grid gap-3 rounded-2xl bg-card p-6 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); postEvent.mutate(); }}>
          <FormField label="Event title"><Input required placeholder="Enter event name" value={ev.title} onChange={(e) => setEv({ ...ev, title: e.target.value })} /></FormField>
          <FormField label="Venue"><select required className="h-9 w-full rounded-md border bg-card px-3 text-sm" value={ev.venue} onChange={(e) => setEv({ ...ev, venue: e.target.value })}>
            <option value="">Choose a space</option>{mine.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select></FormField>
          <FormField label="Starts (Mumbai time)"><Input required type="datetime-local" value={ev.start} onChange={(e) => setEv({ ...ev, start: e.target.value })} /></FormField>
          <FormField label="Ends (Mumbai time)"><Input required type="datetime-local" value={ev.end} onChange={(e) => setEv({ ...ev, end: e.target.value })} /></FormField>
          <FormField label="Entry price (optional)"><Input placeholder="e.g. Free or ₹500" value={ev.price} onChange={(e) => setEv({ ...ev, price: e.target.value })} /></FormField>
          <Button type="submit" variant="coral" disabled={postEvent.isPending}>Post event</Button>
        </form>
      </section>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5 text-sm font-semibold">{label}{children}</label>;
}
