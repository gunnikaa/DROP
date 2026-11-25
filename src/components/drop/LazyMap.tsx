import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Pin } from "./MapView";

const MapView = lazy(() => import("./MapView"));

export function LazyMap(props: { pins: Pin[]; center: { lat: number; lng: number } }) {
  const fb = <Skeleton className="h-[560px] w-full rounded-2xl" />;
  return (
    <ClientOnly fallback={fb}>
      <Suspense fallback={fb}>
        <MapView {...props} />
      </Suspense>
    </ClientOnly>
  );
}
