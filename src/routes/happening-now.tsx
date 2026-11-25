import { createFileRoute } from "@tanstack/react-router";
import { EventsPage } from "@/components/drop/EventsPage";

export const Route = createFileRoute("/happening-now")({
  head: () => ({
    meta: [
      { title: "Happening Now in Mumbai — DROP" },
      { name: "description", content: "Live events near you across Bandra, Fort, Lower Parel, Juhu, Andheri and Powai." },
      { property: "og:title", content: "Happening Now in Mumbai — DROP" },
      { property: "og:description", content: "Live events near you, right now." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <EventsPage title="Happening now" initial="LIVE" />,
});
