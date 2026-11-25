import type { BookingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusTimeline({ status }: { status: BookingStatus }) {
  const mid = status === "REJECTED" ? "REJECTED" : status === "CANCELLED" ? "CANCELLED" : "APPROVED";
  const steps = ["REQUESTED", mid, "COMPLETED"];
  const reached = status === "REQUESTED" ? 0 : status === "COMPLETED" ? 2 : 1;
  return (
    <ol className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider" aria-label={`Status: ${status}`}>
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-1", i <= reached ? (s === "REJECTED" || s === "CANCELLED" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground") : "bg-muted text-muted-foreground")}>{s}</span>
          {i < 2 && <span className={cn("h-px w-4", i < reached ? "bg-foreground" : "bg-border")} />}
        </li>
      ))}
    </ol>
  );
}

export function StatusPill({ status }: { status: BookingStatus }) {
  const c = status === "APPROVED" || status === "COMPLETED" ? "bg-verified/15 text-verified" : status === "REQUESTED" ? "bg-coral/15 text-coral" : "bg-muted text-muted-foreground";
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", c)}>{status}</span>;
}
