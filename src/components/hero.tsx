"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Photos: Wikimedia Commons, licences require attribution (shown on each slide).
 * Served through next/image (upload.wikimedia.org is allowed in next.config.mjs).
 */
const SLIDES = [
  {
    key: "accra",
    eyebrow: "Real estate — Ghana",
    title: "Find your home",
    highlight: "in Accra",
    text: "Houses, apartments and land in Accra, Kumasi and Koforidua — listed by verified agents.",
    cta: { label: "Browse homes in Ghana", href: "/properties?country=Ghana" },
    secondary: { label: "Talk to an agent", href: "/properties?country=Ghana&city=Accra" },
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Kwame_Nkrumah_Memorial_Park_%26_Mausoleum.jpg/1920px-Kwame_Nkrumah_Memorial_Park_%26_Mausoleum.jpg",
    alt: "Kwame Nkrumah Memorial Park in Accra, Ghana",
    credit: { text: "Kwame Nkrumah Memorial Park · Fquasie · CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Kwame_Nkrumah_Memorial_Park_%26_Mausoleum.jpg" },
    position: "center 35%",
  },
  {
    key: "abidjan",
    eyebrow: "Real estate — Côte d'Ivoire",
    title: "Live in",
    highlight: "Abidjan",
    text: "Homes in Abidjan, Lomé, Cotonou and across French-speaking West Africa.",
    cta: { label: "Homes in francophone Africa", href: "/properties?region=francophone" },
    secondary: { label: "Abidjan listings", href: "/properties?country=C%C3%B4te%20d'Ivoire&city=Abidjan" },
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Le_Plateau_depuis_le_Pont_ADO_%E2%80%93_Abidjan.jpg/1920px-Le_Plateau_depuis_le_Pont_ADO_%E2%80%93_Abidjan.jpg",
    alt: "Le Plateau business district of Abidjan at night, seen from the ADO bridge",
    credit: { text: "Le Plateau, Abidjan · Edison McCullen · CC BY 4.0", href: "https://commons.wikimedia.org/wiki/File:Le_Plateau_depuis_le_Pont_ADO_%E2%80%93_Abidjan.jpg" },
    position: "center 45%",
  },
  {
    key: "english",
    eyebrow: "Language schools — Ghana",
    title: "Learn English",
    highlight: "in Ghana",
    text: "Compare verified English schools in Accra and beyond — real reviews, IELTS & TOEFL preparation.",
    cta: { label: "Find an English school", href: "/schools?language=english&country=GH" },
    secondary: { label: "List your school", href: "/schools/join" },
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Wikiforhumanrights_Workshop_for_Students_at_the_Centre_for_Climate_Change_and_Sustainability_Studies_Department_university_of_Ghana_13.jpg/1920px-Wikiforhumanrights_Workshop_for_Students_at_the_Centre_for_Climate_Change_and_Sustainability_Studies_Department_university_of_Ghana_13.jpg",
    alt: "Students in a workshop at the University of Ghana, Legon",
    credit: { text: "University of Ghana · Zapsmedia25 · CC BY 4.0", href: "https://commons.wikimedia.org/wiki/File:Wikiforhumanrights_Workshop_for_Students_at_the_Centre_for_Climate_Change_and_Sustainability_Studies_Department_university_of_Ghana_13.jpg" },
    position: "center 30%",
  },
  {
    key: "french",
    eyebrow: "Language schools — French",
    title: "Learn French",
    highlight: "in Accra & West Africa",
    text: "French schools in Accra, Abidjan, Lomé and Cotonou for English speakers — DELF & DALF preparation.",
    cta: { label: "Find a French school", href: "/schools?language=french" },
    secondary: { label: "List your school", href: "/schools/join" },
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Alliance_Fran%C3%A7aise_d%E2%80%99Accra_2.jpg/1920px-Alliance_Fran%C3%A7aise_d%E2%80%99Accra_2.jpg",
    alt: "Bilingual French and English signs in a language school garden in Accra",
    credit: { text: "Alliance Française d’Accra · Noahalorwu · CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Alliance_Fran%C3%A7aise_d%E2%80%99Accra_2.jpg" },
    position: "center 40%",
  },
] as const;

const INTERVAL_MS = 7000;

const propertyTypes = [
  { value: "ALL", label: "All types" },
  { value: "APARTMENT", label: "Apartment" },
  { value: "HOUSE", label: "House" },
  { value: "VILLA", label: "Villa" },
  { value: "LAND", label: "Land" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "OFFICE", label: "Office" },
];

const listingTypes = [
  { value: "ALL", label: "Buy or rent" },
  { value: "SALE", label: "For sale" },
  { value: "RENT", label: "For rent" },
];

export function Hero() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("ALL");
  const [listingType, setListingType] = useState("ALL");
  const touchX = useRef<number | null>(null);

  const go = useCallback((i: number) => setIndex((i + SLIDES.length) % SLIDES.length), []);

  // Autoplay, paused on hover/focus, when the tab is hidden, or for users who prefer reduced motion.
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (paused || reduce) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(t);
  }, [paused]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set("location", location.trim());
    if (propertyType !== "ALL") params.set("type", propertyType);
    if (listingType !== "ALL") params.set("listingType", listingType);
    router.push(`/properties?${params.toString()}`);
  };

  const slide = SLIDES[index];

  return (
    <>
    <section
      aria-roledescription="carousel"
      aria-label="State-ImmoCom services"
      className="relative isolate w-full overflow-hidden bg-neutral-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      {/* Slides (cross-fade). Only the first image is prioritised for LCP. */}
      {SLIDES.map((s, i) => (
        <div
          key={s.key}
          aria-hidden={i !== index}
          className={cn("absolute inset-0 -z-10 transition-opacity duration-1000 ease-out", i === index ? "opacity-100" : "opacity-0")}
        >
          <Image
            src={s.image}
            alt={s.alt}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: s.position }}
          />
          {/* Neutral scrim only where the text sits — the photo keeps its real colours. */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      ))}

      <div className="mx-auto flex min-h-[600px] max-w-7xl flex-col justify-center px-4 pb-32 pt-14 sm:px-6 md:min-h-[640px] lg:px-8">
        <div key={slide.key} className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700" aria-live="polite">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/85 [text-shadow:0_1px_8px_rgba(0,0,0,.45)]">{slide.eyebrow}</p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-white [text-shadow:0_2px_24px_rgba(0,0,0,.35)] sm:text-5xl lg:text-[4rem]">
            {slide.title} {slide.highlight}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,.45)] sm:text-lg">{slide.text}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 rounded-full bg-white px-7 text-[15px] font-medium text-neutral-900 hover:bg-white/90">
              <Link href={slide.cta.href}>{slide.cta.label}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/70 bg-transparent px-7 text-[15px] font-medium text-white hover:bg-white/10 hover:text-white">
              <Link href={slide.secondary.href}>{slide.secondary.label}</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-16 mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2" role="tablist" aria-label="Choose a slide">
          {SLIDES.map((s, i) => (
            <button
              key={s.key}
              role="tab"
              aria-selected={i === index}
              aria-label={`${s.title} ${s.highlight}`}
              onClick={() => go(i)}
              className={cn("h-[3px] rounded-full transition-all", i === index ? "w-10 bg-white" : "w-6 bg-white/40 hover:bg-white/70")}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Previous slide" onClick={() => go(index - 1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/50 text-white hover:bg-white/15">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button aria-label="Next slide" onClick={() => go(index + 1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/50 text-white hover:bg-white/15">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <a
        href={slide.credit.href}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-4 top-3 hidden text-[10px] text-white/60 hover:text-white sm:block lg:right-8"
      >
        Photo: {slide.credit.text}
      </a>

    </section>

      {/* Property search, overlapping the hero (outside the clipped slider) */}
      <div className="relative z-20 -mt-8 px-4 sm:-mt-10 sm:px-6 lg:px-8">
        <form onSubmit={handleSearch} className="mx-auto max-w-5xl" aria-label="Search properties">
          <div className="flex flex-col gap-2 rounded-2xl border border-black/5 bg-white p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,.35)] sm:flex-row sm:items-center sm:gap-0 sm:p-2">
            <div className="flex flex-1 items-center px-3 sm:flex-[1.6]">
              <Input
                placeholder="City or area — e.g. East Legon, Kumasi, Abidjan"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-11 border-0 px-0 shadow-none focus-visible:ring-0"
                aria-label="Location"
              />
            </div>
            <div className="hidden h-8 w-px bg-gray-200 sm:block" />
            <div className="sm:flex-1">
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className="h-11 border-0 shadow-none focus:ring-0" aria-label="Property type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="hidden h-8 w-px bg-gray-200 sm:block" />
            <div className="sm:flex-1">
              <Select value={listingType} onValueChange={setListingType}>
                <SelectTrigger className="h-11 border-0 shadow-none focus:ring-0" aria-label="Buy or rent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {listingTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" size="lg" className="h-11 rounded-xl px-7 text-white hover:opacity-90 sm:ml-2" style={{ backgroundColor: "#2E8B57" }}>
              Search
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
