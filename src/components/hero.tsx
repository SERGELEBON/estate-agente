"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, GraduationCap, Home, Languages, MapPin, Search, Star } from "lucide-react";
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
    eyebrow: "Real estate · Ghana",
    title: "Find your home",
    highlight: "in Accra",
    text: "Houses, apartments and land in Accra, Kumasi and Koforidua — listed by verified agents.",
    cta: { label: "Browse homes in Ghana", href: "/properties?country=Ghana" },
    secondary: { label: "Talk to an agent", href: "/properties?country=Ghana&city=Accra" },
    icon: Home,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Kwame_Nkrumah_Memorial_Park_%26_Mausoleum.jpg/1920px-Kwame_Nkrumah_Memorial_Park_%26_Mausoleum.jpg",
    alt: "Kwame Nkrumah Memorial Park in Accra, Ghana",
    credit: { text: "Kwame Nkrumah Memorial Park · Fquasie · CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Kwame_Nkrumah_Memorial_Park_%26_Mausoleum.jpg" },
    position: "center 35%",
  },
  {
    key: "abidjan",
    eyebrow: "Real estate · Côte d'Ivoire",
    title: "Live in",
    highlight: "Abidjan",
    text: "Homes in Abidjan, Lomé, Cotonou and across French-speaking West Africa.",
    cta: { label: "Homes in francophone Africa", href: "/properties?region=francophone" },
    secondary: { label: "Abidjan listings", href: "/properties?country=C%C3%B4te%20d'Ivoire&city=Abidjan" },
    icon: MapPin,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Le_Plateau_depuis_le_Pont_ADO_%E2%80%93_Abidjan.jpg/1920px-Le_Plateau_depuis_le_Pont_ADO_%E2%80%93_Abidjan.jpg",
    alt: "Le Plateau business district of Abidjan at night, seen from the ADO bridge",
    credit: { text: "Le Plateau, Abidjan · Edison McCullen · CC BY 4.0", href: "https://commons.wikimedia.org/wiki/File:Le_Plateau_depuis_le_Pont_ADO_%E2%80%93_Abidjan.jpg" },
    position: "center 45%",
  },
  {
    key: "english",
    eyebrow: "Language schools · Ghana",
    title: "Learn English",
    highlight: "in Ghana",
    text: "Compare verified English schools in Accra and beyond — real reviews, IELTS & TOEFL preparation.",
    cta: { label: "Find an English school", href: "/schools?language=english&country=GH" },
    secondary: { label: "List your school", href: "/schools/join" },
    icon: GraduationCap,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Wikiforhumanrights_Workshop_for_Students_at_the_Centre_for_Climate_Change_and_Sustainability_Studies_Department_university_of_Ghana_13.jpg/1920px-Wikiforhumanrights_Workshop_for_Students_at_the_Centre_for_Climate_Change_and_Sustainability_Studies_Department_university_of_Ghana_13.jpg",
    alt: "Students in a workshop at the University of Ghana, Legon",
    credit: { text: "University of Ghana · Zapsmedia25 · CC BY 4.0", href: "https://commons.wikimedia.org/wiki/File:Wikiforhumanrights_Workshop_for_Students_at_the_Centre_for_Climate_Change_and_Sustainability_Studies_Department_university_of_Ghana_13.jpg" },
    position: "center 30%",
  },
  {
    key: "french",
    eyebrow: "Écoles de langue · Apprendre le français",
    title: "Learn French",
    highlight: "in Accra & West Africa",
    text: "French schools in Accra, Abidjan, Lomé and Cotonou for English speakers — DELF & DALF preparation.",
    cta: { label: "Find a French school", href: "/schools?language=french" },
    secondary: { label: "List your school", href: "/schools/join" },
    icon: Languages,
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
      className="relative isolate w-full overflow-hidden bg-[#0f3d25]"
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
            className={cn("object-cover transition-transform duration-[8000ms] ease-out", i === index && "scale-105")}
            style={{ objectPosition: s.position }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b2e1c]/95 via-[#0f3d25]/75 to-[#0f3d25]/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b2e1c]/80 via-transparent to-transparent" />
        </div>
      ))}

      <div className="mx-auto flex min-h-[600px] max-w-7xl flex-col justify-center px-4 pb-32 pt-14 sm:px-6 md:min-h-[640px] lg:px-8">
        <div key={slide.key} className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700" aria-live="polite">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur">
            <slide.icon className="h-3.5 w-3.5" style={{ color: "#F4C430" }} />
            {slide.eyebrow}
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
            {slide.title} <span style={{ color: "#F4C430" }}>{slide.highlight}</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">{slide.text}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 gap-2 px-6 text-[#0f3d25] hover:opacity-90" style={{ backgroundColor: "#F4C430" }}>
              <Link href={slide.cta.href}>
                {slide.cta.label} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-white/40 bg-white/5 px-6 text-white backdrop-blur hover:bg-white/15 hover:text-white">
              <Link href={slide.secondary.href}>{slide.secondary.label}</Link>
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
            <li className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4" style={{ color: "#F4C430" }} /> Verified agents & schools</li>
            <li className="flex items-center gap-1.5"><Star className="h-4 w-4" style={{ color: "#F4C430" }} /> Real client reviews</li>
            <li className="flex items-center gap-1.5"><MapPin className="h-4 w-4" style={{ color: "#F4C430" }} /> Ghana & francophone Africa</li>
          </ul>
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
              className={cn("h-1.5 rounded-full transition-all", i === index ? "w-10 bg-[#F4C430]" : "w-5 bg-white/40 hover:bg-white/70")}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Previous slide" onClick={() => go(index - 1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/30 text-white backdrop-blur hover:bg-white/15">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button aria-label="Next slide" onClick={() => go(index + 1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/30 text-white backdrop-blur hover:bg-white/15">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <a
        href={slide.credit.href}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-4 top-3 hidden text-[10px] text-white/50 hover:text-white/80 sm:block lg:right-8"
      >
        Photo: {slide.credit.text}
      </a>

    </section>

      {/* Property search, overlapping the hero (outside the clipped slider) */}
      <div className="relative z-20 -mt-8 px-4 sm:-mt-10 sm:px-6 lg:px-8">
        <form onSubmit={handleSearch} className="mx-auto max-w-5xl" aria-label="Search properties">
          <div className="flex flex-col gap-2 rounded-2xl border bg-white p-3 shadow-2xl sm:flex-row sm:items-center sm:gap-0 sm:p-2">
            <div className="flex flex-1 items-center gap-2 px-2 sm:flex-[1.6]">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
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
            <Button type="submit" size="lg" className="h-11 gap-2 px-6 text-white hover:opacity-90 sm:ml-2" style={{ backgroundColor: "#2E8B57" }}>
              <Search className="h-4 w-4" /> Search
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
