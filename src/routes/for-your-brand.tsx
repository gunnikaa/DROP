import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Empty, Rail, Skeletons, VenueCard } from "@/components/drop/cards";
import { api } from "@/lib/api";

export const Route = createFileRoute("/for-your-brand")({
  head: () => ({
    meta: [
      { title: "For Your Brand — pop-ups and launches in Mumbai | DROP" },
      { name: "description", content: "Shopfronts, galleries and rooftops for pop-ups, launches and brand activations across Mumbai." },
      { property: "og:title", content: "For Your Brand — DROP" },
      { property: "og:description", content: "Spaces for pop-ups and launches in Mumbai." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Brand,
});

function Brand() {
  const pop = useQuery({ queryKey: ["venues", { category: "Pop-up" }], queryFn: () => api.getVenues({ category: "Pop-up" }) });
  const ex = useQuery({ queryKey: ["venues", { category: "Exhibition" }], queryFn: () => api.getVenues({ category: "Exhibition" }) });
  const roof = useQuery({ queryKey: ["venues", { category: "Rooftop" }], queryFn: () => api.getVenues({ category: "Rooftop" }) });
  const rail = (q: typeof pop) => (q.isPending ? <Skeletons /> : (q.data ?? []).length === 0 ? <Empty title="Nothing here yet" /> : q.data!.map((v) => <VenueCard key={v.id} v={v} />));
  return (
    <div className="space-y-14">
      <section className="space-y-5 rounded-3xl bg-primary p-8 text-primary-foreground sm:p-14">
        <h1 className="max-w-3xl text-5xl sm:text-7xl">Put your brand where the crowd already is.</h1>
        <p className="max-w-xl text-primary-foreground/80">Pair a pop-up with a weekend market, launch on a rooftop, or take over a café for a day. Book by the hour or the week.</p>
        <Button asChild variant="coral" size="lg"><Link to="/spaces" search={{ category: "Pop-up" }}>Find a pop-up space</Link></Button>
      </section>
      <Rail title="Shopfronts & kiosks">{rail(pop)}</Rail>
      <Rail title="Galleries for launches">{rail(ex)}</Rail>
      <Rail title="Rooftops for brand evenings">{rail(roof)}</Rail>
    </div>
  );
}
