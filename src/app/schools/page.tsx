import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Plus } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { SchoolCard } from "@/components/schools/school-card";
import { SchoolFilters } from "@/components/schools/school-filters";
import { listSchools } from "@/lib/school-queries";
import { countryByCode } from "@/lib/geo";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = searchParams;
  const lang = one(sp.language);
  const title = lang === "english" ? "English schools in Ghana" : lang === "french" ? "French schools in Ghana & West Africa" : "Language schools";
  return { title: `${title} | State-ImmoCom`, description: "Compare verified language schools with real student reviews." };
}

export default async function SchoolsPage({ searchParams }: { searchParams: SP }) {
  const sp = searchParams;
  const language = one(sp.language);
  const country = one(sp.country);
  const page = Number(one(sp.page)) || 1;
  const { schools, total, pages } = await listSchools({
    language,
    country,
    city: one(sp.city),
    q: one(sp.q),
    sort: one(sp.sort),
    page,
  });

  const where = countryByCode(country)?.name;
  const heading =
    language === "english"
      ? `Learn English${where ? ` in ${where}` : " in Ghana"}`
      : language === "french"
        ? `Learn French${where ? ` in ${where}` : " in Ghana & West Africa"}`
        : "Language schools";

  const pageHref = (p: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && k !== "page") next.set(k, v);
    if (p > 1) next.set("page", String(p));
    return `/schools?${next.toString()}`;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <header className="bg-gradient-to-br from-[#2E8B57] to-[#0f3d25] pb-20 pt-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#F4C430]">Language schools</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{heading}</h1>
          <p className="mt-3 max-w-2xl text-white/80">
            Every school is verified by our team. Ratings come only from signed-in students — one review per person.
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-10 w-full max-w-7xl flex-1 px-4 pb-16 sm:px-6 lg:px-8">
        <SchoolFilters />
        <p className="mt-6 text-sm text-muted-foreground">
          {total} school{total === 1 ? "" : "s"} found
        </p>

        {schools.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
            <GraduationCap className="mx-auto h-10 w-10 text-[#2E8B57]/50" />
            <h2 className="mt-4 text-lg font-semibold">No school listed here yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              We're onboarding verified schools in Ghana, Côte d'Ivoire, Togo and Benin. Try another filter — or, if you run a
              language school, list it for free.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline"><Link href="/schools">See all schools</Link></Button>
              <Button asChild className="gap-2 text-white" style={{ backgroundColor: "#2E8B57" }}>
                <Link href="/schools/join"><Plus className="h-4 w-4" /> List my school</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {schools.map((s) => (
              <SchoolCard key={s.slug} school={s} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
            {page > 1 && <Button asChild variant="outline"><Link href={pageHref(page - 1)}>Previous</Link></Button>}
            <span className="px-3 text-sm text-muted-foreground">Page {page} of {pages}</span>
            {page < pages && <Button asChild variant="outline"><Link href={pageHref(page + 1)}>Next</Link></Button>}
          </nav>
        )}
      </main>
      <Footer />
    </div>
  );
}
