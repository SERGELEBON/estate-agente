"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { BadgeCheck, Building2, Clock, Loader2, MapPin, Phone, ShieldCheck, UserRound, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const AREA_SUGGESTIONS = [
  "East Legon", "Airport Residential", "Cantonments", "Labone", "Osu", "Haatso", "Adenta",
  "Spintex", "Tema", "Dzorwulu", "Madina", "West Legon", "Achimota", "Kasoa",
];

interface FormState {
  name: string;
  phone: string;
  whatsapp: string;
  company: string;
  independent: boolean;
  license: string;
  serviceAreas: string[];
  bio: string;
  acceptTerms: boolean;
}

const STEPS = [
  { icon: UserRound, label: "Sign in with Google" },
  { icon: ShieldCheck, label: "Complete your profile" },
  { icon: BadgeCheck, label: "Verification by our team" },
];

export default function AgentOnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [form, setForm] = useState<FormState>({
    name: "", phone: "", whatsapp: "", company: "", independent: false,
    license: "", serviceAreas: [], bio: "", acceptTerms: false,
  });
  const [areaInput, setAreaInput] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<string>("INCOMPLETE");

  useEffect(() => {
    fetch("/api/onboarding/agent")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (!u) return;
        setStatus(u.agentStatus);
        setForm((f) => ({
          ...f,
          name: u.name ?? "",
          phone: u.phone ?? "",
          whatsapp: u.whatsapp ?? "",
          company: u.company === "Independent agent" ? "" : u.company ?? "",
          independent: u.company === "Independent agent",
          license: u.license ?? "",
          serviceAreas: u.serviceAreas ?? [],
          bio: u.bio ?? "",
        }));
      })
      .finally(() => setLoaded(true));
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFields((e) => ({ ...e, [key]: "" }));
  };

  const addArea = (raw: string) => {
    const area = raw.trim().replace(/,$/, "");
    if (area.length < 2 || form.serviceAreas.includes(area) || form.serviceAreas.length >= 12) return;
    set("serviceAreas", [...form.serviceAreas, area]);
    setAreaInput("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/onboarding/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSaving(false);
      setFields(data.fields ?? {});
      setError(data.error ?? "Something went wrong. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    await update(); // refresh role/status in the session cookie
    router.replace("/dashboard/agent");
    router.refresh();
  };

  const user = session?.user;
  const err = (k: string) => fields[k] ? <p className="text-xs text-red-600">{fields[k]}</p> : null;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="State-ImmoCom" width={30} height={30} className="h-8 w-auto" />
            <span className="font-bold" style={{ color: "#2E8B57" }}>State-ImmoCom</span>
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Agent onboarding</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>Sign out</Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Progress */}
        <ol className="mb-8 grid grid-cols-3 gap-2">
          {STEPS.map((s, i) => {
            const done = i === 0 || (i === 1 && status !== "INCOMPLETE");
            const current = i === 1;
            return (
              <li key={s.label} className={cn("flex flex-col items-center gap-1.5 rounded-lg border bg-white p-3 text-center text-xs",
                current && "border-[#2E8B57] ring-1 ring-[#2E8B57]")}>
                <s.icon className="h-5 w-5" style={{ color: done || current ? "#2E8B57" : undefined }} />
                <span className={cn(done || current ? "font-medium" : "text-muted-foreground")}>{s.label}</span>
              </li>
            );
          })}
        </ol>

        <div className="mb-6 flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={user?.image ?? undefined} />
            <AvatarFallback>{user?.name?.[0] ?? "A"}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">Complete your agent profile</h1>
            <p className="text-sm text-muted-foreground">
              Signed in as {user?.email}. Clients see this profile before contacting you.
            </p>
          </div>
        </div>

        {status === "PENDING_REVIEW" && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            Your profile is being reviewed. You can still update it below.
          </div>
        )}
        {error && <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {!loaded ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Phone className="h-5 w-5" /> Identity & contact</CardTitle>
                <CardDescription>Your phone number is shown on your listings.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="name">Full name *</Label>
                  <Input id="name" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
                  {err("name")}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone number *</Label>
                  <Input id="phone" type="tel" autoComplete="tel" placeholder="+233 20 123 4567" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                  {err("phone")}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp">WhatsApp (optional)</Label>
                  <Input id="whatsapp" type="tel" placeholder="Same as phone if empty" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
                  {err("whatsapp")}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Building2 className="h-5 w-5" /> Professional details</CardTitle>
                <CardDescription>We verify your licence before your listings go live.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="company">Agency</Label>
                  <Input id="company" disabled={form.independent} placeholder="e.g. Prime Homes Ltd" value={form.company} onChange={(e) => set("company", e.target.value)} />
                  <label className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
                    <Checkbox checked={form.independent} onCheckedChange={(v) => set("independent", v === true)} />
                    I'm an independent agent
                  </label>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="license">Real estate licence number *</Label>
                  <Input id="license" placeholder="REAC licence no." value={form.license} onChange={(e) => set("license", e.target.value)} />
                  {err("license")}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="areas" className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Areas you cover *</Label>
                  <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-md border bg-background px-2 py-1.5">
                    {form.serviceAreas.map((a) => (
                      <span key={a} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium" style={{ color: "#2E8B57" }}>
                        {a}
                        <button type="button" aria-label={`Remove ${a}`} onClick={() => set("serviceAreas", form.serviceAreas.filter((x) => x !== a))}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      id="areas"
                      className="min-w-[140px] flex-1 bg-transparent px-1 text-sm outline-none"
                      placeholder={form.serviceAreas.length ? "Add another…" : "Type an area and press Enter"}
                      value={areaInput}
                      onChange={(e) => setAreaInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addArea(areaInput);
                        }
                      }}
                      onBlur={() => areaInput && addArea(areaInput)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {AREA_SUGGESTIONS.filter((a) => !form.serviceAreas.includes(a)).slice(0, 8).map((a) => (
                      <button key={a} type="button" onClick={() => addArea(a)} className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-muted">
                        + {a}
                      </button>
                    ))}
                  </div>
                  {err("serviceAreas")}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="bio">About you *</Label>
                  <Textarea id="bio" rows={5} maxLength={1000} placeholder="Experience, specialities (rentals, land, luxury homes…), languages spoken…" value={form.bio} onChange={(e) => set("bio", e.target.value)} />
                  <div className="flex justify-between">{err("bio") ?? <span />}<span className="text-xs text-muted-foreground">{form.bio.trim().length}/1000 · min. 80</span></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 pt-6">
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox className="mt-0.5" checked={form.acceptTerms} onCheckedChange={(v) => set("acceptTerms", v === true)} />
                  <span>
                    I confirm the information above is accurate, that I'm authorised to market the properties I publish, and I accept the
                    State-ImmoCom agent terms.
                  </span>
                </label>
                {err("acceptTerms")}
                <Button type="submit" disabled={saving || !form.acceptTerms} className="h-11 w-full text-white" style={{ backgroundColor: "#2E8B57" }}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {status === "ACTIVE" ? "Save profile" : "Submit for verification"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Verification usually takes less than 24h. Meanwhile you can explore your dashboard.
                </p>
              </CardContent>
            </Card>
          </form>
        )}
      </main>
    </div>
  );
}
