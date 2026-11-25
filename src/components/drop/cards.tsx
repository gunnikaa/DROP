import { Link } from "@tanstack/react-router";
import { ExternalLink, MapPin, Star, Users, BadgeCheck, ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ago, distanceKm, endsIn, inr, timeRange } from "@/lib/format";
import type { DropEvent, RankedVenue, Venue } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LiveBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-coral px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-coral-foreground", className)}>
      <span className="live-dot h-1.5 w-1.5 rounded-full bg-coral-foreground" />
      Live
    </span>
  );
}

export function SourceChip({ e }: { e: DropEvent }) {
  if (e.sourceType !== "GEMINI")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-verified/15 px-2 py-0.5 text-xs font-semibold text-verified">
        <BadgeCheck className="h-3.5 w-3.5" /> Verified
      </span>
    );
  return (
    <a
      href={e.sourceUrl}
      target="_blank"
      rel="noreferrer"
      onClick={(ev) => ev.stopPropagation()}
      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground"
    >
      Public listing · checked {ago(e.fetchedAt)} <ExternalLink className="h-3 w-3" />
    </a>
  );
}

export function EventCard({ e, from, wide }: { e: DropEvent; from?: { lat: number; lng: number }; wide?: boolean }) {
  return (
    <article className={cn("lift group relative overflow-hidden rounded-2xl bg-card", wide ? "w-full" : "w-[280px] sm:w-[320px]")}>
      <Link to="/events/$id" params={{ id: e.id }} className="absolute inset-0 z-0" aria-label={e.title} />
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={e.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute left-3 top-3 flex gap-2">
          {e.status === "LIVE" ? <LiveBadge /> : <span className="rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">{e.category}</span>}
        </div>
        {e.status === "LIVE" && (
          <span className="absolute bottom-3 left-3 rounded-full bg-primary/85 px-2.5 py-1 text-xs font-semibold text-primary-foreground">{endsIn(e.endDatetime)}</span>
        )}
      </div>
      <div className="space-y-1.5 p-4">
        <h3 className="text-lg">{e.title}</h3>
        <p className="text-sm text-muted-foreground">
          {e.venueName} · {e.locality}
        </p>
        <p className="text-sm">{timeRange(e.startDatetime, e.endDatetime)}</p>
        <div className="relative z-10 flex flex-wrap items-center gap-2 pt-1 text-sm">
          <span className="font-semibold">{e.priceText}</span>
          {from && <span className="text-muted-foreground">· {distanceKm(from, e).toFixed(1)} km</span>}
          <SourceChip e={e} />
        </div>
      </div>
    </article>
  );
}

export function VenueCard({ v, wide, children }: { v: Venue; wide?: boolean; children?: ReactNode }) {
  return (
    <article className={cn("lift group relative overflow-hidden rounded-2xl bg-card", wide ? "w-full" : "w-[260px] sm:w-[300px]")}>
      <Link to="/spaces/$id" params={{ id: v.id }} className="absolute inset-0 z-0" aria-label={v.name} />
      <div className="aspect-[4/3] overflow-hidden">
        <img src={v.images[0]} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="space-y-1 p-4">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>{v.category}</span>
          <span className="inline-flex items-center gap-1 text-foreground">
            <Star className="h-3.5 w-3.5 fill-current" /> {v.rating}
          </span>
        </div>
        <h3 className="text-lg">{v.name}</h3>
        {v.dataLabel === "OWNER_SUBMITTED" && v.status === "APPROVED" && <span className="inline-flex items-center rounded-full bg-verified/15 px-2 py-0.5 text-xs font-semibold text-verified">DROP partner · bookable</span>}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{v.locality}</span>
          <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{v.capacity}</span>
        </div>
        <p className="pt-1 text-sm">
          from <span className="font-bold">{inr(v.pricing.HOUR)}</span>/hr
        </p>
        {children && <div className="relative z-10 pt-2">{children}</div>}
      </div>
    </article>
  );
}

const LABELS: [keyof RankedVenue["scoreBreakdown"], string][] = [
  ["category", "Category"],
  ["location", "Location"],
  ["capacity", "Capacity"],
  ["budget", "Budget"],
  ["facilities", "Facilities"],
  ["quality", "Quality"],
  ["eventDemand", "Nearby-event demand"],
];
export function WhyRanks({ v }: { v: RankedVenue }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm font-semibold">
        <span>Match {v.score}% · Why this ranks here</span>
        <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="mt-3 space-y-2">
          {LABELS.map(([k, l]) => (
            <li key={k} className="text-xs">
              <div className="mb-1 flex justify-between"><span>{l}</span><span className="font-semibold">{Math.round(v.scoreBreakdown[k])}</span></div>
              <div className="h-1.5 rounded-full bg-border"><div className="h-full rounded-full bg-coral" style={{ width: `${v.scoreBreakdown[k]}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CardSkeleton({ wide }: { wide?: boolean | undefined }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl bg-card", wide ? "w-full" : "w-[280px] sm:w-[320px]")}>
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function Rail({ title, action, children }: { title: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
        {action}
      </div>
      <div className="rail -mx-4 px-4">{children}</div>
    </section>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="w-full rounded-2xl border border-dashed p-10 text-center">
      <p className="font-semibold">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div role="alert" className="w-full rounded-2xl border border-destructive/40 p-8 text-center">
      <p className="font-semibold">Couldn't load this.</p>
      <p className="mt-1 text-sm text-muted-foreground">{error instanceof Error ? error.message : "Something went wrong."}</p>
      {retry && <button onClick={retry} className="mt-3 text-sm font-semibold text-coral underline">Try again</button>}
    </div>
  );
}

export function Skeletons({ n = 4, wide }: { n?: number; wide?: boolean }) {
  return <>{Array.from({ length: n }, (_, i) => <CardSkeleton key={i} wide={wide} />)}</>;
}
