import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, ErrorState, LiveBadge, Rail, Skeletons, SourceChip, VenueCard } from "@/components/drop/cards";
import { api } from "@/lib/api";
import { endsIn, timeRange } from "@/lib/format";

export const Route = createFileRoute("/events/$id")({
  head: () => ({
    meta: [
      { title: "Event details — DROP" },
      { name: "description", content: "Event details and spaces you can book nearby in Mumbai." },
      { property: "og:title", content: "Event details — DROP" },
      { property: "og:description", content: "See the event and book a space nearby." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventDetail,
});

function EventDetail() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["event", id], queryFn: () => api.getEvent(id) });
  const near = useQuery({ queryKey: ["venues-near", id], enabled: !!q.data, queryFn: () => api.getVenuesNear(q.data!.lat, q.data!.lng, 5) });
  if (q.isPending) return <div className="space-y-4"><Skeleton className="aspect-[21/9] rounded-3xl" /><Skeleton className="h-10 w-1/2" /></div>;
  if (q.error) return <ErrorState error={q.error} retry={q.refetch} />;
  const e = q.data;
  return (
    <div className="space-y-12">
      <div className="relative overflow-hidden rounded-3xl">
        <img src={e.imageUrl} alt="" className="aspect-[21/9] w-full object-cover" />
        {e.status === "LIVE" && <LiveBadge className="absolute left-4 top-4" />}
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{e.category}</p>
          <h1 className="text-4xl sm:text-6xl">{e.title}</h1>
          <p className="flex items-center gap-1 text-lg"><MapPin className="h-4 w-4" /> {e.venueName}, {e.locality}</p>
          <SourceChip e={e} />
        </div>
        <div className="space-y-2 rounded-2xl bg-card p-6">
          <p className="text-sm text-muted-foreground">When</p>
          <p className="font-semibold">{timeRange(e.startDatetime, e.endDatetime)}</p>
          {e.status === "LIVE" && <p className="font-semibold text-coral">{endsIn(e.endDatetime)}</p>}
          <p className="pt-2 text-sm text-muted-foreground">Price</p>
          <p className="text-xl font-bold">{e.priceText}</p>
        </div>
      </div>
      <Rail title="Spaces near this event" action={<Link to="/spaces" search={{ locality: e.locality }} className="text-sm font-semibold underline">More in {e.locality}</Link>}>
        {near.isPending ? <Skeletons /> : near.error ? <ErrorState error={near.error} /> : near.data.length === 0 ? <Empty title="No spaces nearby yet" /> : near.data.map((v) => <VenueCard key={v.id} v={v} />)}
      </Rail>
    </div>
  );
}
