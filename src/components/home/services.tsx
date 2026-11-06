import Link from "next/link";
import { ArrowRight, Building2, GraduationCap, Home, Languages, Star } from "lucide-react";
import { COUNTRIES } from "@/lib/geo";

const ghana = COUNTRIES.find((c) => c.code === "GH")!;
const francophone = COUNTRIES.filter((c) => c.francophone);

const SERVICES = [
  {
    key: "ghana-home",
    icon: Home,
    kicker: "Real estate",
    title: "I want a home in Ghana",
    text: "Houses, apartments and land to buy or rent, listed by licensed agents you can chat with directly.",
    href: "/properties?country=Ghana",
    cta: "Browse Ghana listings",
    chips: ["Accra", "Koforidua", "Kumasi"].map((city) => ({
      label: city,
      href: `/properties?country=Ghana&city=${encodeURIComponent(city)}`,
    })),
  },
  {
    key: "learn-english",
    icon: GraduationCap,
    kicker: "Language schools",
    title: "I want to learn English in Ghana",
    text: "Verified English schools rated by real students — general English, business English, IELTS & TOEFL.",
    href: "/schools?language=english&country=GH",
    cta: "Compare English schools",
    chips: ["Accra", "Kumasi", "Cape Coast"].map((city) => ({
      label: city,
      href: `/schools?language=english&country=GH&city=${encodeURIComponent(city)}`,
    })),
    rated: true,
  },
  {
    key: "learn-french",
    icon: Languages,
    kicker: "Écoles de français",
    title: "I want to learn French",
    text: "French courses for English speakers in Accra and in Côte d'Ivoire, Togo and Benin — DELF & DALF prep.",
    href: "/schools?language=french",
    cta: "Compare French schools",
    chips: [
      { label: `${ghana.flag} Accra`, href: "/schools?language=french&country=GH" },
      ...francophone
        .filter((c) => ["CI", "TG", "BJ"].includes(c.code))
        .map((c) => ({ label: `${c.flag} ${c.cities[0]}`, href: `/schools?language=french&country=${c.code}` })),
    ],
    rated: true,
  },
  {
    key: "francophone-home",
    icon: Building2,
    kicker: "Immobilier",
    title: "I want a home in French-speaking Africa",
    text: "Homes and land in Abidjan, Lomé, Cotonou and Dakar, with agents who speak your language.",
    href: "/properties?region=francophone",
    cta: "Browse francophone listings",
    chips: francophone
      .filter((c) => ["CI", "TG", "BJ", "SN"].includes(c.code))
      .map((c) => ({ label: `${c.flag} ${c.name}`, href: `/properties?country=${encodeURIComponent(c.name)}` })),
  },
];

/** "What are you looking for?" — the four entry points between the hero and the listings. */
export function Services() {
  return (
    <section aria-labelledby="services-title" className="bg-gradient-to-b from-[#f4f8f5] to-background -mt-12 pb-16 pt-24 md:pb-20 md:pt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#2E8B57]">One platform, four goals</p>
          <h2 id="services-title" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">What are you looking for?</h2>
          <p className="mt-3 text-muted-foreground">Find a home or a language school in Ghana and French-speaking West Africa — every agent and school is verified by our team.</p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <article
              key={s.key}
              className="group relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#2E8B57]/40 hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#2E8B57]/10 text-[#2E8B57] transition-colors group-hover:bg-[#2E8B57] group-hover:text-white">
                  <s.icon className="h-6 w-6" />
                </span>
                {s.rated && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F4C430]/15 px-2 py-0.5 text-[11px] font-semibold text-[#8a6d00]">
                    <Star className="h-3 w-3" fill="currentColor" /> Rated by students
                  </span>
                )}
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.kicker}</p>
              <h3 className="mt-1 text-lg font-bold leading-snug">
                {/* Stretched link: the whole card is clickable, chips stay independently clickable. */}
                <Link href={s.href} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
                  {s.title}
                </Link>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              <div className="relative z-10 mt-4 flex flex-wrap gap-1.5">
                {s.chips.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    className="rounded-full border px-2.5 py-1 text-xs font-medium text-foreground/80 transition-colors hover:border-[#2E8B57] hover:bg-[#2E8B57]/5 hover:text-[#2E8B57]"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-[#2E8B57]">
                {s.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
