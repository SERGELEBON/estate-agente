"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES } from "@/lib/geo";

/** URL-driven filters (shareable links, server-rendered results). */
export function SchoolFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params?.get("q") ?? "");

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params?.toString() ?? "");
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    if (key === "country") next.delete("city");
    next.delete("page");
    router.push(`/schools?${next.toString()}`, { scroll: false });
  };

  return (
    <form
      className="grid gap-2 rounded-2xl border bg-card p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
      onSubmit={(e) => {
        e.preventDefault();
        update("q", q.trim() || null);
      }}
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-11 pl-9" placeholder="School name or city" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search schools" />
      </div>
      <Select value={params?.get("language") ?? "all"} onValueChange={(v) => update("language", v)}>
        <SelectTrigger className="h-11" aria-label="Language"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All languages</SelectItem>
          <SelectItem value="english">Learn English</SelectItem>
          <SelectItem value="french">Learn French</SelectItem>
        </SelectContent>
      </Select>
      <Select value={params?.get("country") ?? "all"} onValueChange={(v) => update("country", v)}>
        <SelectTrigger className="h-11" aria-label="Country"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All countries</SelectItem>
          {COUNTRIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={params?.get("sort") ?? "rating"} onValueChange={(v) => update("sort", v === "rating" ? null : v)}>
        <SelectTrigger className="h-11" aria-label="Sort by"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="rating">Best rated</SelectItem>
          <SelectItem value="reviews">Most reviewed</SelectItem>
          <SelectItem value="price">Lowest price</SelectItem>
          <SelectItem value="newest">Newest</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" className="h-11 text-white" style={{ backgroundColor: "#2E8B57" }}>Search</Button>
    </form>
  );
}
