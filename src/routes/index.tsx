import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Empty, ErrorState, EventCard, Rail, Skeletons, VenueCard } from "@/components/drop/cards";
import { useLocation } from "@/components/drop/location";
import { api } from "@/lib/api";
import { distanceKm } from "@/lib/format";
import { CATEGORIES, LOCALITIES } from "@/lib/catalog";

const HERO = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=75";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DROP — Make space for something | Mumbai" },
      { name: "description", content: "Book pop-ups, studios, rooftops and café takeovers by the hour across Mumbai, and see what's live near you." },
      { property: "og:title", content: "DROP — Make space for something" },
      { property: "og:description", content: "Temporary spaces and live events across Mumbai." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: HERO },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: HERO },
    ],
  }),
  component: Home,
});

const sel = "h-12 w-full rounded-xl border bg-card px-3 text-sm";

function Home() {
  const { locality, center } = useLocation();
  const nav = useNavigate();
  const [f, setF] = useState({ category: "", locality: "", date: "", duration: "HOUR", guests: "", budget: "" });
  const live = useQuery({ queryKey: ["events", { status: "LIVE" }], queryFn: () => api.getEvents({ status: "LIVE" }) });
  const trending = useQuery({ queryKey: ["venues", { locality }], queryFn: () => api.getVenues({ locality }) });
  const upcoming = useQuery({ queryKey: ["events", { status: "UPCOMING" }], queryFn: () => api.getEvents({ status: "UPCOMING" }) });
  const all = useQuery({ queryKey: ["venues", {}], queryFn: () => api.getVenues() });
  const big = (upcoming.data ?? []).slice(0, 2);

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl">
        <img src={HERO} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-primary/10" />
        <div className="relative px-6 pb-8 pt-28 sm:px-10 sm:pt-40">
          <h1 className="max-w-3xl text-5xl text-primary-foreground sm:text-7xl">Make space for something.</h1>
          <p className="mt-4 max-w-xl text-lg text-primary-foreground/85">Pop-ups, studios, rooftops and café takeovers across Mumbai — by the hour, day or week.</p>
          <form
            className="mt-8 grid gap-2 rounded-2xl bg-background p-3 sm:grid-cols-3 lg:grid-cols-7"
            onSubmit={(e) => { e.preventDefault(); nav({ to: "/spaces", search: { category: f.category || undefined, locality: f.locality || undefined, guests: f.guests ? Number(f.guests) : undefined, budget: f.budget ? Number(f.budget) : undefined } }); }}
          >
            <select aria-label="Category" className={sel} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              <option value="">Any category</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select aria-label="Locality" className={sel} value={f.locality} onChange={(e) => setF({ ...f, locality: e.target.value })}>
              <option value="">Anywhere</option>{LOCALITIES.map((l) => <option key={l.name}>{l.name}</option>)}
            </select>
            <input aria-label="Date" type="date" className={sel} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
            <select aria-label="Duration" className={sel} value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })}>
              <option value="HOUR">Hourly</option><option value="HALF_DAY">Half-day</option><option value="DAY">Day</option><option value="WEEK">Week</option>
            </select>
            <input aria-label="Guests" type="number" min={1} placeholder="Guests" className={sel} value={f.guests} onChange={(e) => setF({ ...f, guests: e.target.value })} />
            <input aria-label="Budget per hour" type="number" min={0} placeholder="Max ₹/hr" className={sel} value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} />
            <Button type="submit" variant="coral" className="h-12 rounded-xl">Find space</Button>
          </form>
        </div>
      </section>
      <p className="-mt-10 text-xs text-muted-foreground">Mumbai event listings are sourced from public organiser and ticketing pages. Open each source link to confirm timings and ticket availability. Venue availability is confirmed only by participating owners.</p>

      <Rail title={<>Live near you <span className="text-coral">●</span></>} action={<Link to="/happening-now" className="text-sm font-semibold underline">See all</Link>}>
        {live.isPending ? <Skeletons /> : live.error ? <ErrorState error={live.error} retry={live.refetch} /> : live.data.length === 0 ? <Empty title="Nothing live right now" hint="Check back this evening." /> :
          [...live.data].sort((a, b) => distanceKm(center, a) - distanceKm(center, b)).map((e) => <EventCard key={e.id} e={e} from={center} />)}
      </Rail>

      <Rail title={`Trending spaces in ${locality}`} action={<Link to="/spaces" search={{ locality }} className="text-sm font-semibold underline">Explore</Link>}>
        {trending.isPending ? <Skeletons /> : trending.error ? <ErrorState error={trending.error} /> : trending.data.length === 0 ? <Empty title={`No spaces in ${locality} yet`} /> :
          trending.data.map((v) => <VenueCard key={v.id} v={v} />)}
      </Rail>

      <section className="space-y-4">
        <h2 className="text-2xl sm:text-3xl">Browse by kind</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link key={c} to="/spaces" search={{ category: c }} className="rounded-full border bg-card px-5 py-2.5 text-sm font-semibold hover:border-foreground">{c}</Link>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl sm:text-3xl">Big events this weekend <span className="text-muted-foreground">→ book a pop-up nearby</span></h2>
        {upcoming.isPending || all.isPending ? <div className="rail"><Skeletons n={3} /></div> : big.length === 0 ? <Empty title="No big events coming up" /> :
          big.map((e) => {
            const near = (all.data ?? []).filter((v) => distanceKm(v, e) < 4).slice(0, 3);
            return (
              <div key={e.id} className="grid gap-4 rounded-3xl bg-muted p-4 lg:grid-cols-[320px_1fr]">
                <EventCard e={e} wide />
                <div className="rail">{near.length ? near.map((v) => <VenueCard key={v.id} v={v} />) : <Empty title="No spaces nearby yet" />}</div>
              </div>
            );
          })}
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl sm:text-3xl">How DROP works</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {[["Find", "Search by kind, area, date and budget — or start from what's happening nearby."], ["Request", "Pick your slot and send a request. Owners respond quickly."], ["Make it happen", "Once approved, show up and make space for something."]].map(([t, d], i) => (
            <li key={t} className="rounded-2xl bg-card p-6">
              <span className="font-display text-5xl font-extrabold text-coral">0{i + 1}</span>
              <h3 className="mt-3 text-xl">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
        <Button asChild variant="default" size="lg"><Link to="/spaces">Explore spaces <ArrowRight className="h-4 w-4" /></Link></Button>
      </section>
    </div>
  );
}
