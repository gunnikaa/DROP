import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft, Building2, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in or join — DROP" }, { name: "description", content: "Sign in to DROP or create a customer or venue-owner account." }] }),
  component: Auth,
});

function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"CUSTOMER" | "OWNER" | "ADMIN">("CUSTOMER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const result = mode === "register"
        ? await api.register({ name, email, password, role: role as "CUSTOMER" | "OWNER" })
        : await api.login({ email, password });
      if (mode === "login" && role !== "ADMIN" && result.user.role !== role) throw new Error(`This account is registered as ${result.user.role.toLowerCase()}, not ${role.toLowerCase()}.`);
      if (mode === "login" && role === "ADMIN" && result.user.role !== "ADMIN") throw new Error("This account is not an administrator account.");
      localStorage.setItem("drop_token", result.token); localStorage.setItem("drop_user", JSON.stringify(result.user));
      toast.success(mode === "login" ? "Welcome back" : "Your DROP account is ready");
      nav({ to: result.user.role === "ADMIN" ? "/admin" : result.user.role === "OWNER" ? "/owner" : "/dashboard" });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Could not sign in"); }
    finally { setBusy(false); }
  };
  return <div className="mx-auto grid min-h-[72vh] max-w-5xl items-center gap-10 py-10 lg:grid-cols-[1fr_440px]">
    <section className="space-y-6"><Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4"/> Back to exploring</Link><p className="text-xs font-bold uppercase tracking-[.24em] text-coral">DROP · Make space for something</p><h1 className="max-w-xl text-5xl leading-[1.05] sm:text-6xl">Good spaces make <span className="text-coral">great things</span> happen.</h1><p className="max-w-lg text-lg text-muted-foreground">Discover first. Sign in when you're ready to book, list a space or manage DROP.</p><div className="flex flex-wrap gap-3 text-sm"><span className="rounded-full border bg-card px-4 py-2">Explore without an account</span><span className="rounded-full border bg-card px-4 py-2">Secure role-based access</span></div></section>
    <section className="rounded-3xl border bg-card p-6 shadow-xl sm:p-8"><h2 className="text-3xl">{mode === "login" ? "Welcome back." : "Join DROP."}</h2><p className="mt-2 text-sm text-muted-foreground">{mode === "login" ? "Sign in to continue to your workspace." : "Create your customer or venue partner account."}</p>
      <div className="mt-6 grid grid-cols-2 rounded-full border bg-muted p-1 text-sm font-semibold">{(["login", "register"] as const).map(m => <button type="button" key={m} onClick={() => setMode(m)} className={cn("rounded-full py-2.5", mode === m && "bg-background shadow")}>{m === "login" ? "Sign in" : "Create account"}</button>)}</div>
      <form className="mt-6 space-y-4" onSubmit={submit}>{mode === "register" && <Input required value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" className="h-12 rounded-xl"/>}<Input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" className="h-12 rounded-xl"/><Input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (at least 8 characters)" className="h-12 rounded-xl"/>
      <fieldset className="space-y-2"><legend className="text-sm font-semibold">{mode === "login" ? "Continue as" : "I want to"}</legend><div className="grid grid-cols-3 gap-2">{([ ["CUSTOMER","Customer",UserRound], ["OWNER","Venue owner",Building2], ["ADMIN","Admin",ShieldCheck] ] as const).filter(([k])=>mode === "register" ? k !== "ADMIN" : true).map(([k,label,Icon])=><button type="button" key={k} onClick={()=>setRole(k)} aria-pressed={role===k} className={cn("rounded-xl border p-3 text-left",role===k?"border-coral bg-coral/5 ring-1 ring-coral":"bg-background")}><Icon className="mb-2 h-4 w-4"/><span className="block text-xs font-semibold">{label}</span></button>)}</div></fieldset>
      <Button type="submit" disabled={busy} variant="coral" size="lg" className="h-12 w-full rounded-xl">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</Button></form>
      <p className="mt-5 text-center text-xs text-muted-foreground">Customers can <Link to="/" className="font-semibold underline">browse DROP without signing in</Link>.</p>
    </section></div>;
}
