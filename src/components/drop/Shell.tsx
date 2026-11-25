import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronDown, Compass, Crosshair, MapPin, Moon, Search, Sun, Ticket, User } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { CATEGORIES, LOCALITIES } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { nearestLocality, useLocation } from "./location";

function LocationPicker() {
  const { locality, setLocality } = useLocation();
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-semibold hover:bg-muted">
        <MapPin className="h-4 w-4 text-coral" />
        <span className="max-w-[9rem] truncate">{locality === "Bandra" ? "Bandra West" : locality}, Mumbai</span>
        <ChevronDown className="h-4 w-4" />
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader><SheetTitle className="text-2xl">Where are you?</SheetTitle></SheetHeader>
        <button
          className="mt-6 flex w-full items-center gap-2 rounded-xl bg-muted px-4 py-3 text-left font-semibold"
          onClick={() =>
            navigator.geolocation?.getCurrentPosition(
              (p) => { setLocality(nearestLocality(p.coords.latitude, p.coords.longitude)); setOpen(false); },
              () => setOpen(false),
            )
          }
        >
          <Crosshair className="h-4 w-4 text-coral" /> Use my location
        </button>
        <ul className="mt-4 space-y-1">
          {LOCALITIES.map((l) => (
            <li key={l.name}>
              <button
                onClick={() => { setLocality(l.name); setOpen(false); }}
                className={cn("w-full rounded-xl px-4 py-3 text-left hover:bg-muted", locality === l.name && "bg-muted font-bold text-coral")}
              >
                {l.name}
              </button>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}

function SearchBox() {
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const nav = useNavigate();
  const { data: venues = [] } = useQuery({ queryKey: ["venues", {}], queryFn: () => api.getVenues() });
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return [
      ...venues.filter((v) => v.name.toLowerCase().includes(s)).slice(0, 4).map((v) => ({ k: "Venue", label: v.name, go: () => nav({ to: "/spaces/$id", params: { id: v.id } }) })),
      ...CATEGORIES.filter((c) => c.toLowerCase().includes(s)).map((c) => ({ k: "Category", label: c, go: () => nav({ to: "/spaces", search: { category: c } }) })),
      ...LOCALITIES.filter((l) => l.name.toLowerCase().includes(s)).map((l) => ({ k: "Locality", label: l.name, go: () => nav({ to: "/spaces", search: { locality: l.name } }) })),
    ];
  }, [q, venues, nav]);
  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 150)}
        onKeyDown={(e) => e.key === "Enter" && results[0]?.go()}
        placeholder="Search spaces, categories, areas"
        aria-label="Search"
        className="h-11 w-full rounded-full border bg-card pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      {focus && q && (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border bg-popover shadow-xl">
          {results.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No matches for “{q}”.</p>
          ) : (
            results.map((r, i) => (
              <button key={i} onMouseDown={r.go} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-muted">
                <span className="font-medium">{r.label}</span>
                <span className="text-xs text-muted-foreground">{r.k}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const d = localStorage.getItem("drop-theme") === "dark";
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
  }, []);
  return (
    <button
      aria-label="Toggle dark mode"
      className="rounded-full p-2 hover:bg-muted"
      onClick={() => {
        const d = !dark;
        setDark(d);
        document.documentElement.classList.toggle("dark", d);
        localStorage.setItem("drop-theme", d ? "dark" : "light");
      }}
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

const TABS = [
  { to: "/spaces", label: "Spaces" },
  { to: "/happening-now", label: "Happening Now" },
  { to: "/this-week", label: "This Week" },
  { to: "/for-your-brand", label: "For Your Brand" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link to="/" className="font-display text-2xl font-extrabold tracking-tighter">DROP<span className="text-coral">.</span></Link>
          <LocationPicker />
          <div className="hidden flex-1 justify-center md:flex"><SearchBox /></div>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Account" className="rounded-full">
                <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">AM</AvatarFallback></Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild><Link to="/dashboard">Customer workspace · My bookings</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/owner">Venue partner · Owner dashboard</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/admin">DROP team · Admin console</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/auth">Sign in / Register</Link></DropdownMenuItem>
                <DropdownMenuItem onSelect={async () => { try { await api.logout(); } catch { /* clear local session even if server session expired */ } localStorage.removeItem("drop_token"); localStorage.removeItem("drop_user"); window.location.href = "/"; }}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="px-4 pb-3 md:hidden"><SearchBox /></div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 text-sm font-semibold" aria-label="Primary">
          {TABS.map((t) => (
            <Link key={t.to} to={t.to} className={cn("whitespace-nowrap rounded-full px-4 py-2 hover:bg-muted", path.startsWith(t.to) && "bg-primary text-primary-foreground hover:bg-primary")}>
              {t.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 md:py-10">{children}</main>
      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-6 text-sm text-muted-foreground">© 2026 DROP · Make space for something. · Mumbai</footer>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background/95 backdrop-blur md:hidden" aria-label="Mobile">
        {[
          { to: "/", label: "Explore", icon: Compass },
          { to: "/happening-now", label: "Events", icon: Ticket },
          { to: "/dashboard", label: "Bookings", icon: CalendarDays },
          { to: "/auth", label: "Profile", icon: User },
        ].map(({ to, label, icon: I }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link key={to} to={to} className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold", active ? "text-coral" : "text-muted-foreground")}>
              <I className="h-5 w-5" /> {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
