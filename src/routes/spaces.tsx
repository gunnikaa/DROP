import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Empty, ErrorState, Skeletons, VenueCard, WhyRanks } from "@/components/drop/cards";
import { LazyMap } from "@/components/drop/LazyMap";
import { useLocation } from "@/components/drop/location";
import { api } from "@/lib/api";
import type { Category, DurationUnit, Locality } from "@/lib/types";
import { AMENITIES, CATEGORIES, LOCALITIES } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const search = z.object({
  locality: z.string().optional(),
  category: z.string().optional(),
  guests: z.number().optional(),
  budget: z.number().optional(),
});

export const Route = createFileRoute("/spaces")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Explore Spaces in Mumbai — DROP" },
      { name: "description", content: "Filter pop-up shops, galleries, studios, rooftops and corporate rooms by area, capacity and budget." },
      { property: "og:title", content: "Explore Spaces in Mumbai — DROP" },
      { property: "og:description", content: "Find the right temporary space in Mumbai." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SpacesLayout,
});

function SpacesLayout() {
  const isChild = useMatches({ select: (m) => m.some((x) => x.routeId === "/spaces/$id") });
  return isChild ? <Outlet /> : <Explore />;
}

const UNITS: [DurationUnit, string][] = [["HOUR", "Hour"], ["HALF_DAY", "Half-day"], ["DAY", "Day"], ["WEEK", "Week"]];

function Explore() {
  const sp = Route.useSearch();
  const { center } = useLocation();
  const [loc, setLoc] = useState<string>(sp.locality ?? "");
  const [cat, setCat] = useState<string>(sp.category ?? "");
  const [unit, setUnit] = useState<DurationUnit>("HOUR");
  const [cap, setCap] = useState<number>(sp.guests ?? 0);
  const [budget, setBudget] = useState<number>(sp.budget ?? 8000);
  const [ams, setAms] = useState<string[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<"best" | "price" | "capacity">("best");
  const [view, setView] = useState<"list" | "map">("list");
  const [term, setTerm] = useState("");
  const [discoveryQuery, setDiscoveryQuery] = useState("");
  const discovery = useMutation({ mutationFn: () => api.discoverPlaces(discoveryQuery.trim() || "Mumbai") });
  const suggestions = useQuery({ queryKey: ["trie-suggest", term], queryFn: () => api.getSuggestions(term), enabled: term.trim().length > 0 });
  const cover = useMutation({ mutationFn: () => api.findSpaceCombination(ams), onSuccess: (r) => { setCoverResult(r); } });
  const [coverResult, setCoverResult] = useState<{ venues: import("@/lib/types").Venue[]; coveredFacilities: string[]; uncoveredFacilities: string[] } | null>(null);

  const q = useQuery({
    queryKey: ["recommend", loc, cat, cap, budget],
    queryFn: () => api.recommend({ locality: (loc || undefined) as Locality | undefined, category: (cat || undefined) as Category | undefined, guests: cap || undefined, budget }),
  });
  const list = useMemo(() => {
    const r = (q.data ?? []).filter((v) => (!loc || v.locality === loc) && (!cat || v.category === cat) && v.capacity >= cap && v.pricing.HOUR <= budget && ams.every((a) => v.amenities.includes(a)) && (!term || `${v.name} ${v.locality}`.toLowerCase().includes(term.toLowerCase())));
    if (sort === "price") r.sort((a, b) => a.pricing[unit] - b.pricing[unit]);
    if (sort === "capacity") r.sort((a, b) => b.capacity - a.capacity);
    return r;
  }, [q.data, loc, cat, cap, budget, ams, sort, unit, term]);

  const filters = (
    <div className="space-y-6 text-sm">
      <Field label="Locality">
        <select className="h-10 w-full rounded-xl border bg-card px-3" value={loc} onChange={(e) => setLoc(e.target.value)}>
          <option value="">All of Mumbai</option>{LOCALITIES.map((l) => <option key={l.name}>{l.name}</option>)}
        </select>
      </Field>
      <Field label="Category">
        <select className="h-10 w-full rounded-xl border bg-card px-3" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Any</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Dates">
        <div className="grid grid-cols-2 gap-2">
          <input type="date" aria-label="From" className="h-10 rounded-xl border bg-card px-2" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" aria-label="To" className="h-10 rounded-xl border bg-card px-2" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </Field>
      <Field label="Book by">
        <div className="grid grid-cols-4 gap-1 rounded-xl border bg-card p-1">
          {UNITS.map(([u, l]) => <button key={u} onClick={() => setUnit(u)} className={cn("rounded-lg py-1.5 text-xs font-semibold", unit === u && "bg-primary text-primary-foreground")}>{l}</button>)}
        </div>
      </Field>
      <Field label={`Min capacity: ${cap || "any"}`}><Slider value={[cap]} max={300} step={10} onValueChange={([v]) => setCap(v ?? 0)} /></Field>
      <Field label={`Max ₹${budget.toLocaleString("en-IN")}/hr`}><Slider value={[budget]} min={500} max={8000} step={100} onValueChange={([v]) => setBudget(v ?? 8000)} /></Field>
      <Field label="Amenities">
        <div className="grid grid-cols-2 gap-2">
          {AMENITIES.map((a) => (
            <label key={a} className="flex items-center gap-2">
              <Checkbox checked={ams.includes(a)} onCheckedChange={(c) => setAms(c ? [...ams, a] : ams.filter((x) => x !== a))} /> {a}
            </label>
          ))}
        </div>
      </Field>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-4xl sm:text-6xl">Explore spaces</h1>
      <section className="space-y-3 rounded-2xl border bg-card p-5">
        <div><h2 className="text-xl">Find a place for your pop-up</h2><p className="text-sm text-muted-foreground">Explore cafés, galleries, event spaces, markets and shops across Mumbai. Contact a place to ask about hosting.</p></div>
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); discovery.mutate(); }}>
          <input aria-label="Search possible pop-up hosts" value={discoveryQuery} onChange={(e) => setDiscoveryQuery(e.target.value)} placeholder="Try café, gallery, event venue, Bandra, or a place name" className="h-10 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm" />
          <Button type="submit" variant="outline" disabled={discovery.isPending}>{discovery.isPending ? "Searching…" : "Search places"}</Button>
        </form>
        {discovery.error && <p role="alert" className="text-sm text-destructive">{discovery.error.message}</p>}
        {discovery.data && <>
          {discovery.data.length === 0 ? <p className="text-sm text-muted-foreground">No matching mapped places found in Mumbai.</p> : <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{discovery.data.map((place) => <li key={place.id} className="rounded-xl border p-4">
            <p className="font-semibold">{place.name}</p><p className="text-xs uppercase text-muted-foreground">{place.category} · Possible host</p>{place.address && <p className="mt-1 text-sm text-muted-foreground">{place.address}</p>}
            <div className="mt-2 flex flex-wrap gap-3 text-sm">{place.phone && <a className="underline" href={`tel:${place.phone}`}>Call: {place.phone}</a>}{place.email && <a className="underline" href={`mailto:${place.email}`}>Email</a>}{place.website && <a className="underline" href={place.website} target="_blank" rel="noreferrer">Website</a>}<a className="underline" href={place.mapsUrl} target="_blank" rel="noreferrer">Open map</a></div>
            <p className="mt-2 text-xs text-muted-foreground">{place.bookingMessage}</p>
          </li>)}</ul>}
          <p className="text-[10px] text-muted-foreground">Places by <a className="underline" href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a> · © <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></p>
        </>}
      </section>
      <div className="max-w-xl"><label className="mb-1 block text-xs font-semibold text-muted-foreground">Search spaces and neighbourhoods</label><input value={term} onChange={(e) => setTerm(e.target.value)} list="drop-suggestions" placeholder="Try a venue name or Bandra…" className="h-11 w-full rounded-xl border bg-card px-4 text-sm" /><datalist id="drop-suggestions">{(suggestions.data ?? []).map((s) => <option key={s} value={s} />)}</datalist></div>
      <div className="flex flex-wrap items-center gap-3">
        <Sheet>
          <SheetTrigger asChild><Button variant="outline" className="rounded-full lg:hidden"><SlidersHorizontal className="h-4 w-4" /> Filters</Button></SheetTrigger>
          <SheetContent side="left" className="overflow-y-auto"><SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader><div className="mt-6">{filters}</div></SheetContent>
        </Sheet>
        <p className="text-sm text-muted-foreground">{q.isPending ? "Loading…" : `${list.length} spaces`}</p>
        <select aria-label="Sort" className="ml-auto h-10 rounded-full border bg-card px-4 text-sm" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="best">Best match</option><option value="price">Price: low to high</option><option value="capacity">Capacity</option>
        </select>
        <div className="flex rounded-full border bg-card p-1 text-sm">
          {(["list", "map"] as const).map((v) => <button key={v} onClick={() => setView(v)} className={cn("rounded-full px-4 py-1.5 font-semibold capitalize", view === v && "bg-primary text-primary-foreground")}>{v}</button>)}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4"><div className="min-w-0 flex-1"><p className="font-semibold">Need several facilities?</p><p className="text-xs text-muted-foreground">Select amenities in the filters to find a small combination of spaces that covers them.</p></div><Button variant="outline" disabled={!ams.length || cover.isPending} onClick={() => cover.mutate()}>Find space combination</Button>{coverResult && <p className="basis-full text-sm">Suggested spaces: {coverResult.venues.map((v) => v.name).join(", ") || "No combination found"}. {coverResult.uncoveredFacilities.length ? `Not covered: ${coverResult.uncoveredFacilities.join(", ")}` : "All selected facilities covered."}</p>}</div>
      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block">{filters}</aside>
        <div>
          {q.isPending ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"><Skeletons n={6} wide /></div>
            : q.error ? <ErrorState error={q.error} retry={q.refetch} />
            : list.length === 0 ? <Empty title="No spaces match" hint="Loosen the budget or capacity filters." />
            : view === "map" ? <LazyMap center={loc ? LOCALITIES.find((l) => l.name === loc)! : center} pins={list.map((v) => ({ id: v.id, lat: v.lat, lng: v.lng, label: v.name, href: `/spaces/${v.id}` }))} />
            : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((v, i) => (
                  <VenueCard key={v.id} v={v} wide>
                    {sort === "best" && i === 0 && <span className="mb-2 inline-block rounded-full bg-coral px-2.5 py-0.5 text-xs font-bold text-coral-foreground">Best match</span>}
                    {sort === "best" && <WhyRanks v={v} />}
                  </VenueCard>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><p className="font-semibold">{label}</p>{children}</div>;
}
