"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Ban, ExternalLink, EyeOff, Eye, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/schools/star-rating";
import { countryByCode } from "@/lib/geo";

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING_REVIEW: { label: "To verify", cls: "bg-amber-100 text-amber-800" },
  ACTIVE: { label: "Live", cls: "bg-emerald-100 text-emerald-800" },
  SUSPENDED: { label: "Suspended", cls: "bg-red-100 text-red-700" },
};

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<any[] | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [open, setOpen] = useState<string | null>(null);

  const load = () =>
    fetch(`/api/admin/schools${filter ? `?status=${filter}` : ""}`).then((r) => r.json()).then((d) => setSchools(d.schools ?? []));
  useEffect(() => {
    setSchools(null);
    load();
  }, [filter]);

  const patch = async (id: string, data: Record<string, unknown>, msg: string) => {
    const res = await fetch(`/api/admin/schools/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) return toast.error("Update failed");
    toast.success(msg);
    load();
  };
  const moderate = async (id: string, hidden: boolean) => {
    const res = await fetch(`/api/admin/school-reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hidden }) });
    if (!res.ok) return toast.error("Update failed");
    toast.success(hidden ? "Review hidden" : "Review restored");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Language schools</h1>
          <p className="text-sm text-muted-foreground">Verify schools before they go live, and moderate student reviews.</p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {[["", "All"], ["PENDING_REVIEW", "To verify"], ["ACTIVE", "Live"], ["SUSPENDED", "Suspended"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} className={`rounded-md px-3 py-1 text-sm ${filter === v ? "bg-[#2E8B57] text-white" : "hover:bg-muted"}`}>{l}</button>
          ))}
        </div>
      </div>

      {schools === null ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      ) : schools.length === 0 ? (
        <p className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">No school here yet.</p>
      ) : (
        <div className="space-y-3">
          {schools.map((s) => (
            <div key={s.id} className="rounded-xl border bg-card">
              <div className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{s.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[s.status]?.cls}`}>{STATUS[s.status]?.label ?? s.status}</span>
                    {s.featured && <Badge className="bg-[#F4C430] text-[#0f3d25] hover:bg-[#F4C430]">Featured</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {s.city}, {countryByCode(s.country)?.name} · {[s.teachesEnglish && "English", s.teachesFrench && "French"].filter(Boolean).join(" & ")} · owner {s.owner.name ?? ""} ({s.owner.email})
                  </p>
                  {s.accreditation && <p className="mt-1 text-xs">Accreditation: {s.accreditation}</p>}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <StarRating value={s.ratingAvg} size={13} /> <span className="text-muted-foreground">({s.ratingCount})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.status !== "ACTIVE" && <Button size="sm" variant="outline" className="gap-1 text-emerald-700" onClick={() => patch(s.id, { status: "ACTIVE" }, "School approved")}><BadgeCheck className="h-4 w-4" /> Approve</Button>}
                  {s.status === "ACTIVE" && <Button size="sm" variant="ghost" className="gap-1" onClick={() => patch(s.id, { featured: !s.featured }, s.featured ? "Unfeatured" : "Featured")}><Star className="h-4 w-4" /> {s.featured ? "Unfeature" : "Feature"}</Button>}
                  {s.status !== "SUSPENDED" && <Button size="sm" variant="ghost" className="gap-1 text-red-600" onClick={() => patch(s.id, { status: "SUSPENDED" }, "School suspended")}><Ban className="h-4 w-4" /> Suspend</Button>}
                  {s.status === "ACTIVE" && <Button size="sm" variant="ghost" asChild><Link href={`/schools/${s.slug}`} target="_blank"><ExternalLink className="h-4 w-4" /></Link></Button>}
                  {s.reviews.length > 0 && <Button size="sm" variant="ghost" onClick={() => setOpen(open === s.id ? null : s.id)}>Reviews ({s.reviews.length})</Button>}
                </div>
              </div>
              {open === s.id && (
                <ul className="divide-y border-t">
                  {s.reviews.map((r: any) => (
                    <li key={r.id} className={`flex items-start gap-3 p-4 text-sm ${r.hidden ? "opacity-50" : ""}`}>
                      <StarRating value={r.rating} size={12} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">{r.author.name} · {r.author.email} · {new Date(r.createdAt).toLocaleDateString()}</p>
                        <p className="mt-1">{r.comment}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => moderate(r.id, !r.hidden)} className="gap-1">
                        {r.hidden ? <><Eye className="h-4 w-4" /> Restore</> : <><EyeOff className="h-4 w-4" /> Hide</>}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
