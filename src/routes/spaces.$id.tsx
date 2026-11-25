import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, MapPin, Star } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, ErrorState, EventCard, Rail, Skeletons } from "@/components/drop/cards";
import { api } from "@/lib/api";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/spaces/$id")({
  head: () => ({
    meta: [
      { title: "Space details — DROP" },
      { name: "description", content: "Photos, pricing, rules and availability for a bookable space in Mumbai." },
      { property: "og:title", content: "Space details — DROP" },
      { property: "og:description", content: "See pricing and availability, then request to book." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VenueDetail,
});

const REVIEWS = [
  ["Ishita R.", "Our candle pop-up had queues by noon. The owner was quick to reply and the light is gorgeous."],
  ["Vikram P.", "Easy load-in, clean washrooms, and the neighbourhood crowd is exactly who we wanted."],
  ["Neha K.", "Booked for a workshop — tables, power and Wi-Fi all just worked."],
];

function VenueDetail() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["venue", id], queryFn: () => api.getVenue(id) });
  const range = useMemo(() => {
    const a = new Date(); const b = new Date(a.getTime() + 34 * 86400_000);
    return [a.toISOString().slice(0, 10), b.toISOString().slice(0, 10)] as const;
  }, []);
  const avail = useQuery({ queryKey: ["avail", id, range[0]], queryFn: () => api.getAvailability(id, range[0], range[1]) });
  const near = useQuery({ queryKey: ["near-events", id], queryFn: () => api.getNearbyEvents(id) });

  if (q.isPending) return <div className="space-y-4"><Skeleton className="aspect-[21/9] rounded-3xl" /><Skeleton className="h-10 w-1/2" /><Skeleton className="h-5 w-1/3" /></div>;
  if (q.error) return <ErrorState error={q.error} retry={q.refetch} />;
  const v = q.data;

  return (
    <div className="space-y-12">
      <div className="grid gap-2 overflow-hidden rounded-3xl md:grid-cols-[2fr_1fr] md:grid-rows-2">
        <img src={v.images[0]} alt={v.name} className="h-full max-h-[480px] w-full object-cover md:row-span-2" />
        {v.images.slice(1, 3).map((s) => <img key={s} src={s} alt="" className="hidden h-full max-h-[236px] w-full object-cover md:block" />)}
      </div>
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-10">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{v.category}</p>
            <h1 className="text-4xl sm:text-6xl">{v.name}</h1>
            <p className="flex flex-wrap items-center gap-3 text-muted-foreground">
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{v.locality}, Mumbai</span>
              <span className="inline-flex items-center gap-1 text-foreground"><Star className="h-4 w-4 fill-current" />{v.rating} ({v.reviewCount})</span>
            </p>
            <p className="text-lg font-semibold">{v.unitLabel}, {v.areaSqft.toLocaleString("en-IN")} sq ft · up to {v.capacity} guests</p>
            <p className="max-w-2xl pt-2 text-muted-foreground">{v.description}</p>
          </div>
          <section><h2 className="mb-4 text-2xl">Amenities</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">{v.amenities.map((a) => <li key={a} className="flex items-center gap-2 rounded-xl bg-card px-4 py-3 text-sm"><Check className="h-4 w-4 text-verified" />{a}</li>)}</ul>
          </section>
          <section><h2 className="mb-4 text-2xl">House rules</h2>
            <dl className="grid gap-3 sm:grid-cols-2">{Object.entries(v.rules).map(([k, r]) => <div key={k} className="rounded-xl bg-card p-4"><dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{k}</dt><dd className="mt-1 text-sm">{r}</dd></div>)}</dl>
          </section>
          <section><h2 className="mb-4 text-2xl">Pricing</h2>
            <table className="w-full overflow-hidden rounded-xl bg-card text-sm">
              <tbody>{([["HOUR", "Per hour"], ["HALF_DAY", "Half-day (4 hrs)"], ["DAY", "Full day"], ["WEEK", "Week"]] as const).map(([k, l]) => <tr key={k} className="border-b last:border-0"><td className="p-4">{l}</td><td className="p-4 text-right font-bold">{inr(v.pricing[k])}</td></tr>)}</tbody>
            </table>
          </section>
          <section><h2 className="mb-2 text-2xl">Availability</h2>
            <div className="mb-4 flex gap-4 text-xs"><Legend c="bg-verified/70" l="Free" /><Legend c="bg-muted-foreground/40" l="Booked" /><Legend c="striped" l="Blocked" /></div>
            {avail.isPending ? <Skeleton className="h-48 rounded-xl" /> : avail.error ? <ErrorState error={avail.error} /> : (
              <div className="grid max-w-md grid-cols-7 gap-1.5">
                {avail.data.map((d) => (
                  <div key={d.date} title={`${d.date}: ${d.state.toLowerCase()}`} className={cn("flex aspect-square items-center justify-center rounded-lg text-xs font-semibold", d.state === "FREE" && "bg-verified/70 text-coral-foreground", d.state === "BOOKED" && "bg-muted-foreground/40", d.state === "BLOCKED" && "striped text-muted-foreground")}>
                    {Number(d.date.slice(8))}
                  </div>
                ))}
              </div>
            )}
          </section>
          <Rail title="Events nearby">
            {near.isPending ? <Skeletons n={3} /> : near.error ? <ErrorState error={near.error} /> : near.data.length === 0 ? <Empty title="No events nearby right now" /> : near.data.map((e) => <EventCard key={e.id} e={e} from={v} />)}
          </Rail>
          <section><h2 className="mb-4 text-2xl">Reviews</h2>
            <ul className="grid gap-3 sm:grid-cols-3">{REVIEWS.map(([n, t]) => <li key={n} className="rounded-2xl bg-card p-5 text-sm"><p className="font-semibold">{n}</p><p className="mt-2 text-muted-foreground">{t}</p></li>)}</ul>
          </section>
        </div>
        <aside className="lg:sticky lg:top-36 lg:self-start">
          <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
            <p><span className="text-3xl font-bold">{inr(v.pricing.HOUR)}</span> <span className="text-muted-foreground">/ hour</span></p>
            <p className="text-sm text-muted-foreground">Day rate {inr(v.pricing.DAY)} · Week {inr(v.pricing.WEEK)}</p>
            {v.dataLabel === "OWNER_SUBMITTED" && v.status === "APPROVED" ? <Button asChild variant="coral" size="lg" className="w-full"><Link to="/book/$id" params={{ id: v.id }}>Request to book</Link></Button> : v.dataLabel === "OWNER_SUBMITTED" ? <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">This space is being reviewed.</p> : null}
            <p className="text-center text-xs text-muted-foreground">You won't be charged until the owner approves.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
function Legend({ c, l }: { c: string; l: string }) {
  return <span className="flex items-center gap-1.5"><span className={cn("h-3 w-3 rounded", c)} />{l}</span>;
}
