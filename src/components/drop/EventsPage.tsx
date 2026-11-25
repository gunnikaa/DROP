import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Empty, ErrorState, EventCard, Skeletons } from "./cards";
import { LazyMap } from "./LazyMap";
import { useLocation } from "./location";
import { api } from "@/lib/api";
import { distanceKm } from "@/lib/format";
import { cn } from "@/lib/utils";

type When = "LIVE" | "TODAY" | "WEEKEND" | "WEEK";
const chip = (on: boolean) => cn("rounded-full border px-4 py-2 text-sm font-semibold", on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-foreground");

export function EventsPage({ title, initial }: { title: string; initial: When }) {
  const { center } = useLocation();
  const [when, setWhen] = useState<When>(initial);
  const [cat, setCat] = useState("");
  const [price, setPrice] = useState<"" | "free" | "paid">("");
  const [km, setKm] = useState(30);
  const [view, setView] = useState<"list" | "map">("list");
  const q = useQuery({ queryKey: ["events", {}], queryFn: () => api.getEvents() });

  const list = useMemo(() => {
    const now = new Date();
    const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59);
    const week = new Date(now.getTime() + 7 * 86400_000);
    const sat = new Date(now); sat.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7)); sat.setHours(0, 0, 0);
    const monday = new Date(sat.getTime() + 2 * 86400_000);
    return (q.data ?? [])
      .filter((e) => {
        const s = new Date(e.startDatetime), en = new Date(e.endDatetime);
        if (when === "LIVE" && e.status !== "LIVE") return false;
        if (when === "TODAY" && s > endOfToday) return false;
        if (when === "WEEKEND" && (en < sat || s > monday)) return false;
        if (when === "WEEK" && s > week) return false;
        if (cat && e.category !== cat) return false;
        if (price === "free" && e.priceText !== "Free") return false;
        if (price === "paid" && e.priceText === "Free") return false;
        return distanceKm(center, e) <= km;
      })
      .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));
  }, [q.data, when, cat, price, km, center]);
  const cats = [...new Set((q.data ?? []).map((e) => e.category))];

  return (
    <div className="space-y-6">
      <h1 className="text-4xl sm:text-6xl">{title}</h1>
      <div className="flex flex-wrap gap-2">
        {([["LIVE", "Live now"], ["TODAY", "Today"], ["WEEKEND", "Weekend"], ["WEEK", "Next 7 days"]] as const).map(([k, l]) => (
          <button key={k} className={chip(when === k)} onClick={() => setWhen(k)} aria-pressed={when === k}>{l}</button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <select aria-label="Category" className="h-10 rounded-full border bg-card px-4" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>{cats.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select aria-label="Price" className="h-10 rounded-full border bg-card px-4" value={price} onChange={(e) => setPrice(e.target.value as typeof price)}>
          <option value="">Free & paid</option><option value="free">Free</option><option value="paid">Paid</option>
        </select>
        <label className="flex items-center gap-2">Within <select className="h-10 rounded-full border bg-card px-3" value={km} onChange={(e) => setKm(Number(e.target.value))}>{[2, 5, 10, 30].map((k) => <option key={k} value={k}>{k} km</option>)}</select></label>
        <div className="ml-auto flex rounded-full border bg-card p-1">
          {(["list", "map"] as const).map((v) => <button key={v} onClick={() => setView(v)} className={cn("rounded-full px-4 py-1.5 font-semibold capitalize", view === v && "bg-primary text-primary-foreground")}>{v}</button>)}
        </div>
      </div>
      {q.isPending ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><Skeletons n={6} wide /></div>
        : q.error ? <ErrorState error={q.error} retry={q.refetch} />
        : list.length === 0 ? <Empty title="No events match these filters" hint="Try a wider distance or a different day." />
        : view === "map" ? <LazyMap center={center} pins={list.map((e) => ({ id: e.id, lat: e.lat, lng: e.lng, label: e.title, href: `/events/${e.id}`, live: e.status === "LIVE" }))} />
        : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((e) => <EventCard key={e.id} e={e} from={center} wide />)}</div>}
    </div>
  );
}
