import { createFileRoute } from "@tanstack/react-router";
import { EventsPage } from "@/components/drop/EventsPage";

export const Route = createFileRoute("/this-week")({
  head: () => ({
    meta: [
      { title: "This Week in Mumbai — DROP" },
      { name: "description", content: "Markets, gigs, talks and workshops coming up across Mumbai over the next 7 days." },
      { property: "og:title", content: "This Week in Mumbai — DROP" },
      { property: "og:description", content: "What's on across Mumbai this week." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <EventsPage title="This week" initial="WEEK" />,
});
