import Image from "next/image";
import Link from "next/link";

type Service = {
  key: string;
  label: string;
  title: string;
  text: string;
  href: string;
  cta: string;
  links: { label: string; href: string }[];
  image: string;
  alt: string;
  credit?: string;
};

const SERVICES: Service[] = [
  {
    key: "ghana-home",
    label: "Real estate",
    title: "A home in Ghana",
    text: "Houses, apartments and land to buy or rent, listed by licensed agents.",
    href: "/properties?country=Ghana",
    cta: "Browse properties",
    links: ["Accra", "Koforidua", "Kumasi"].map((city) => ({
      label: city,
      href: `/properties?country=Ghana&city=${encodeURIComponent(city)}`,
    })),
    image: "/hero-bg.jpg",
    alt: "Modern villa with a swimming pool in Accra",
  },
  {
    key: "learn-english",
    label: "Language schools",
    title: "Learn English in Ghana",
    text: "Compare verified schools and read reviews from their students. General English, IELTS and TOEFL.",
    href: "/schools?language=english&country=GH",
    cta: "Compare English schools",
    links: ["Accra", "Kumasi", "Cape Coast"].map((city) => ({
      label: city,
      href: `/schools?language=english&country=GH&city=${encodeURIComponent(city)}`,
    })),
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Wikiforhumanrights_Workshop_for_Students_at_the_Centre_for_Climate_Change_and_Sustainability_Studies_Department_university_of_Ghana_17.jpg/1280px-Wikiforhumanrights_Workshop_for_Students_at_the_Centre_for_Climate_Change_and_Sustainability_Studies_Department_university_of_Ghana_17.jpg",
    alt: "Students in a classroom at the University of Ghana",
    credit: "Zapsmedia25, CC BY 4.0",
  },
  {
    key: "learn-french",
    label: "Language schools",
    title: "Learn French",
    text: "French courses for English speakers in Accra, Abidjan, Lomé and Cotonou. DELF and DALF preparation.",
    href: "/schools?language=french",
    cta: "Compare French schools",
    links: [
      { label: "Accra", href: "/schools?language=french&country=GH" },
      { label: "Abidjan", href: "/schools?language=french&country=CI" },
      { label: "Lomé", href: "/schools?language=french&country=TG" },
      { label: "Cotonou", href: "/schools?language=french&country=BJ" },
    ],
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Alliance_Fran%C3%A7aise_d%E2%80%99Accra_2.jpg/1280px-Alliance_Fran%C3%A7aise_d%E2%80%99Accra_2.jpg",
    alt: "Bilingual French and English signs pointing to classrooms in Accra",
    credit: "Noahalorwu, CC BY-SA 4.0",
  },
  {
    key: "francophone-home",
    label: "Real estate",
    title: "A home in French-speaking Africa",
    text: "Homes and land in Côte d'Ivoire, Togo, Benin and Senegal, with agents who speak French and English.",
    href: "/properties?region=francophone",
    cta: "Browse properties",
    links: [
      { label: "Abidjan", href: "/properties?country=C%C3%B4te%20d'Ivoire" },
      { label: "Lomé", href: "/properties?country=Togo" },
      { label: "Cotonou", href: "/properties?country=Benin" },
      { label: "Dakar", href: "/properties?country=Senegal" },
    ],
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Maison_d%27habitation_Lom%C3%A9_01.jpg/1280px-Maison_d%27habitation_Lom%C3%A9_01.jpg",
    alt: "Two-storey family house in Lomé, Togo",
    credit: "Kondesso, CC BY-SA 4.0",
  },
];

/** The four things people come for — between the hero and the latest listings. */
export function Services() {
  return (
    <section aria-labelledby="services-title" className="bg-white pb-20 pt-24 md:pt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-8 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#2E8B57]">Our services</p>
            <h2 id="services-title" className="mt-3 font-display text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              What are you looking for?
            </h2>
          </div>
          <p className="max-w-md text-[15px] leading-relaxed text-neutral-600">
            A home or a language school, in Ghana and French-speaking West Africa. Every agent and school is checked by our team.
          </p>
        </div>

        <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <article key={s.key} className="group flex flex-col">
              <Link href={s.href} className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100">
                <Image
                  src={s.image}
                  alt={s.alt}
                  fill
                  sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
                {s.credit && (
                  <span className="absolute bottom-1.5 right-2 text-[9px] text-white/80 [text-shadow:0_1px_3px_rgba(0,0,0,.6)]">
                    Photo: {s.credit}
                  </span>
                )}
              </Link>
              <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">{s.label}</p>
              <h3 className="mt-1.5 font-display text-[1.35rem] font-semibold leading-snug text-neutral-900">
                <Link href={s.href} className="hover:text-[#2E8B57]">
                  {s.title}
                </Link>
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">{s.text}</p>
              <p className="mt-3 text-sm text-neutral-500">
                {s.links.map((l, i) => (
                  <span key={l.href}>
                    {i > 0 && <span className="mx-1.5 text-neutral-300">·</span>}
                    <Link href={l.href} className="underline-offset-4 hover:text-neutral-900 hover:underline">
                      {l.label}
                    </Link>
                  </span>
                ))}
              </p>
              <Link
                href={s.href}
                className="mt-5 inline-flex w-fit border-b border-neutral-900 pb-0.5 text-sm font-medium text-neutral-900 transition-colors hover:border-[#2E8B57] hover:text-[#2E8B57]"
              >
                {s.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
