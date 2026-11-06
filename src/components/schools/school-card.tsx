import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, GraduationCap, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/schools/star-rating";
import { countryByCode } from "@/lib/geo";
import { LABELS } from "@/lib/schools";

export interface SchoolSummary {
  slug: string;
  name: string;
  tagline: string | null;
  city: string;
  country: string;
  logo: string | null;
  coverImage: string | null;
  teachesEnglish: boolean;
  teachesFrench: boolean;
  formats: string[];
  exams: string[];
  priceFrom: number | null;
  currency: string;
  priceUnit: string;
  ratingAvg: number;
  ratingCount: number;
  featured: boolean;
}

export function formatSchoolPrice(s: Pick<SchoolSummary, "priceFrom" | "currency" | "priceUnit">) {
  if (!s.priceFrom) return null;
  const amount = new Intl.NumberFormat("en-GH", { style: "currency", currency: s.currency, maximumFractionDigits: 0 }).format(s.priceFrom);
  return `${amount} / ${LABELS[s.priceUnit] ?? "month"}`;
}

export function SchoolCard({ school }: { school: SchoolSummary }) {
  const country = countryByCode(school.country);
  const price = formatSchoolPrice(school);
  return (
    <Link
      href={`/schools/${school.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8B57]"
    >
      <div className="relative aspect-[16/9] bg-gradient-to-br from-[#2E8B57] to-[#0f3d25]">
        {school.coverImage ? (
          <Image src={school.coverImage} alt="" fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <GraduationCap className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-white/30" />
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {school.teachesEnglish && <Badge className="bg-white/95 text-[#0f3d25] hover:bg-white">English</Badge>}
          {school.teachesFrench && <Badge className="bg-white/95 text-[#0f3d25] hover:bg-white">Français</Badge>}
        </div>
        {school.featured && <Badge className="absolute right-3 top-3 bg-[#F4C430] text-[#0f3d25] hover:bg-[#F4C430]">Featured</Badge>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-3">
          <div className="relative -mt-10 h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-white bg-white shadow">
            {school.logo ? (
              <Image src={school.logo} alt={`${school.name} logo`} fill sizes="56px" className="object-contain p-1" />
            ) : (
              <span className="grid h-full w-full place-items-center text-lg font-bold text-[#2E8B57]">{school.name[0]}</span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="flex items-center gap-1 truncate font-semibold">
              {school.name}
              <BadgeCheck className="h-4 w-4 shrink-0 text-[#2E8B57]" aria-label="Verified school" />
            </h3>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {school.city}, {country?.name ?? school.country} {country?.flag}
            </p>
          </div>
        </div>
        {school.tagline && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{school.tagline}</p>}
        <div className="mt-3 flex items-center gap-2 text-sm">
          {school.ratingCount > 0 ? (
            <>
              <StarRating value={school.ratingAvg} size={14} />
              <span className="font-semibold">{school.ratingAvg.toFixed(1)}</span>
              <span className="text-muted-foreground">({school.ratingCount} review{school.ratingCount > 1 ? "s" : ""})</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">No reviews yet</span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[...school.exams.slice(0, 3), ...school.formats.slice(0, 2)].map((t) => (
            <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {LABELS[t] ?? t}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between pt-4 text-sm">
          <span className="font-semibold text-[#2E8B57]">{price ? `From ${price}` : "Contact for prices"}</span>
          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">View school →</span>
        </div>
      </div>
    </Link>
  );
}
