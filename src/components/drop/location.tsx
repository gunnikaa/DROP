import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Locality } from "@/lib/types";
import { LOCALITIES } from "@/lib/catalog";

type Ctx = { locality: Locality; setLocality: (l: Locality) => void; center: { lat: number; lng: number } };
const LocCtx = createContext<Ctx | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [locality, setLoc] = useState<Locality>("Bandra");
  useEffect(() => {
    const s = localStorage.getItem("drop-locality") as Locality | null;
    if (s && LOCALITIES.some((l) => l.name === s)) setLoc(s);
  }, []);
  const setLocality = (l: Locality) => {
    setLoc(l);
    localStorage.setItem("drop-locality", l);
  };
  const c = LOCALITIES.find((l) => l.name === locality)!;
  return <LocCtx.Provider value={{ locality, setLocality, center: c }}>{children}</LocCtx.Provider>;
}

export function useLocation() {
  const c = useContext(LocCtx);
  if (!c) throw new Error("LocationProvider missing");
  return c;
}

export function nearestLocality(lat: number, lng: number): Locality {
  return LOCALITIES.reduce((best, l) =>
    (l.lat - lat) ** 2 + (l.lng - lng) ** 2 < (best.lat - lat) ** 2 + (best.lng - lng) ** 2 ? l : best,
  ).name;
}
