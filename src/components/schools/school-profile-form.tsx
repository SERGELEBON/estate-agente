"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Clock, ExternalLink, ImagePlus, Loader2, Ban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES, countryByCode } from "@/lib/geo";
import { LABELS, PRICE_UNITS, SCHOOL_EXAMS, SCHOOL_FORMATS, SCHOOL_LEVELS } from "@/lib/schools";
import { cn } from "@/lib/utils";

interface FormState {
  name: string; tagline: string; description: string;
  teachesEnglish: boolean; teachesFrench: boolean;
  levels: string[]; formats: string[]; exams: string[];
  country: string; city: string; address: string;
  phone: string; whatsapp: string; email: string; website: string;
  logo: string; coverImage: string; accreditation: string;
  priceFrom: string; currency: string; priceUnit: string;
}

const EMPTY: FormState = {
  name: "", tagline: "", description: "", teachesEnglish: true, teachesFrench: false,
  levels: [], formats: [], exams: [], country: "GH", city: "Accra", address: "",
  phone: "", whatsapp: "", email: "", website: "", logo: "", coverImage: "", accreditation: "",
  priceFrom: "", currency: "GHS", priceUnit: "MONTH",
};

function Chips({ options, value, onChange }: { options: readonly string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              on ? "border-[#2E8B57] bg-[#2E8B57] text-white" : "hover:border-[#2E8B57] hover:text-[#2E8B57]"
            )}
          >
            {LABELS[o] ?? o}
          </button>
        );
      })}
    </div>
  );
}

function ImageUpload({ label, value, onChange, aspect }: { label: string; value: string; onChange: (url: string) => void; aspect: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file");
    if (file.size > 8 * 1024 * 1024) return toast.error("Image too large (max 8 MB)");
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !data.url) return toast.error(data.error ?? "Upload failed");
    onChange(data.url);
  };
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={cn("relative flex w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-muted/30 text-sm text-muted-foreground hover:border-[#2E8B57]", aspect)}
      >
        {value ? <Image src={value} alt="" fill sizes="400px" className="object-cover" /> : (
          <span className="flex flex-col items-center gap-1">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />} Upload</span>
        )}
      </button>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      {value && <button type="button" className="text-xs text-muted-foreground underline" onClick={() => onChange("")}>Remove</button>}
    </div>
  );
}

export function SchoolProfileForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [school, setSchool] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/schools/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const s = d?.school;
        if (s) {
          setSchool(s);
          setForm({
            ...EMPTY,
            ...Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v ?? ""])),
            priceFrom: s.priceFrom ? String(s.priceFrom) : "",
          } as FormState);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setFields((e) => ({ ...e, [k]: "" }));
  };
  const err = (k: string) => (fields[k] ? <p className="text-xs text-red-600">{fields[k]}</p> : null);
  const country = countryByCode(form.country);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/schools/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, priceFrom: form.priceFrom ? Number(form.priceFrom) : null }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setFields(data.fields ?? {});
      toast.error(data.error ?? "Could not save");
      return;
    }
    setSchool(data.school);
    toast.success(school ? "School profile updated" : "Submitted for verification");
  };

  if (!loaded) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <form onSubmit={submit} className="space-y-6">
      {school?.status === "PENDING_REVIEW" && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" /> Your school is being verified by our team (usually within 24h). It will appear in search once approved.
        </div>
      )}
      {school?.status === "ACTIVE" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Your school is live.</span>
          <Link href={`/schools/${school.slug}`} target="_blank" className="inline-flex items-center gap-1 font-medium underline">View public page <ExternalLink className="h-3.5 w-3.5" /></Link>
        </div>
      )}
      {school?.status === "SUSPENDED" && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><Ban className="mt-0.5 h-4 w-4" /> This school is suspended. Contact support.</div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">School identity</CardTitle><CardDescription>What students see first.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_220px]">
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="name">School name *</Label><Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />{err("name")}</div>
            <div className="space-y-1.5"><Label htmlFor="tagline">Tagline</Label><Input id="tagline" maxLength={140} placeholder="e.g. Intensive English & IELTS preparation in East Legon" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" rows={6} maxLength={4000} placeholder="Teaching method, class sizes, teachers' qualifications, schedule, facilities…" value={form.description} onChange={(e) => set("description", e.target.value)} />
              <div className="flex justify-between">{err("description") ?? <span />}<span className="text-xs text-muted-foreground">{form.description.trim().length}/4000 · min. 120</span></div>
            </div>
          </div>
          <div className="space-y-4">
            <ImageUpload label="Logo" value={form.logo} onChange={(v) => set("logo", v)} aspect="aspect-square" />
            <ImageUpload label="Cover photo" value={form.coverImage} onChange={(v) => set("coverImage", v)} aspect="aspect-video" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Courses</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Languages taught *</Label>
            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.teachesEnglish} onCheckedChange={(v) => set("teachesEnglish", v === true)} /> English</label>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.teachesFrench} onCheckedChange={(v) => set("teachesFrench", v === true)} /> French</label>
            </div>
            {err("teachesEnglish")}
          </div>
          <div className="space-y-2"><Label>Levels</Label><Chips options={SCHOOL_LEVELS} value={form.levels} onChange={(v) => set("levels", v)} /></div>
          <div className="space-y-2"><Label>Course formats *</Label><Chips options={SCHOOL_FORMATS} value={form.formats} onChange={(v) => set("formats", v)} />{err("formats")}</div>
          <div className="space-y-2"><Label>Exam preparation</Label><Chips options={SCHOOL_EXAMS} value={form.exams} onChange={(v) => set("exams", v)} /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5"><Label htmlFor="price">Price from</Label><Input id="price" type="number" min={0} inputMode="decimal" value={form.priceFrom} onChange={(e) => set("priceFrom", e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["GHS", "XOF", "USD", "EUR"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Per</Label>
              <Select value={form.priceUnit} onValueChange={(v) => set("priceUnit", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRICE_UNITS.map((u) => <SelectItem key={u} value={u}>{LABELS[u]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="accreditation">Accreditation / partnerships</Label><Input id="accreditation" placeholder="e.g. British Council exam partner, GES registration no. …" value={form.accreditation} onChange={(e) => set("accreditation", e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Location & contact</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Country *</Label>
            <Select value={form.country} onValueChange={(v) => { set("country", v); set("city", countryByCode(v)?.cities[0] ?? ""); set("currency", countryByCode(v)?.currency ?? "GHS"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">City *</Label>
            <Input id="city" list="school-cities" value={form.city} onChange={(e) => set("city", e.target.value)} />
            <datalist id="school-cities">{country?.cities.map((c) => <option key={c} value={c} />)}</datalist>
            {err("city")}
          </div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="address">Address</Label><Input id="address" placeholder="Street, area, landmark" value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="phone">Phone</Label><Input id="phone" type="tel" placeholder="+233 20 123 4567" value={form.phone} onChange={(e) => set("phone", e.target.value)} />{err("phone")}</div>
          <div className="space-y-1.5"><Label htmlFor="whatsapp">WhatsApp</Label><Input id="whatsapp" type="tel" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />{err("whatsapp")}</div>
          <div className="space-y-1.5"><Label htmlFor="semail">Contact email</Label><Input id="semail" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />{err("email")}</div>
          <div className="space-y-1.5"><Label htmlFor="website">Website</Label><Input id="website" type="url" placeholder="https://" value={form.website} onChange={(e) => set("website", e.target.value)} />{err("website")}</div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="h-11 px-8 text-white" style={{ backgroundColor: "#2E8B57" }}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {school ? "Save changes" : "Submit for verification"}
        </Button>
      </div>
    </form>
  );
}
