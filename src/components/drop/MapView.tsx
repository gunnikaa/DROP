import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type Pin = { id: string; lat: number; lng: number; label: string; href: string; live?: boolean };

export default function MapView({ pins, center }: { pins: Pin[]; center: { lat: number; lng: number } }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !ref.current) return;
      map = L.map(ref.current).setView([center.lat, center.lng], 13);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      pins.forEach((p) => {
        const icon = L.divIcon({
          className: "",
          html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;border:3px solid var(--card);background:${p.live ? "var(--coral)" : "var(--foreground)"};box-shadow:0 2px 6px rgba(0,0,0,.3)"></span>`,
          iconSize: [16, 16],
        });
        L.marker([p.lat, p.lng], { icon })
          .addTo(map!)
          .bindPopup(`<a href="${p.href}" style="font-weight:600">${p.label}</a>`);
      });
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [pins, center]);
  return <div ref={ref} className="h-[560px] w-full overflow-hidden rounded-2xl" role="region" aria-label="Map" />;
}
