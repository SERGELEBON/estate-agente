import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, BadgeCheck, ChevronLeft, Globe, GraduationCap, MapPin, MessageCircle, Phone } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { AgentChat } from "@/components/chat/agent-chat";
import { StarRating } from "@/components/schools/star-rating";
import { ReviewForm } from "@/components/schools/review-form";
import { formatSchoolPrice } from "@/components/schools/school-card";
import { getPublicSchool } from "@/lib/school-queries";
import { countryByCode } from "@/lib/geo";
import { LABELS } from "@/lib/schools";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const school = await getPublicSchool(params.slug);
  if (!school) return { title: "School not found | State-ImmoCom" };
  return {
    title: `${school.name} — ${school.city} | State-ImmoCom`,
    description: school.tagline ?? school.description.slice(0, 155),
    openGraph: school.coverImage ? { images: [school.coverImage] } : undefined,
  };
}

const waLink = (n: string) => `https://wa.me/${n.replace(/\D/g, "")}`;

export default async function SchoolPage({ params }: { params: { slug: string } }) {
  const school = await getPublicSchool(params.slug);
  if (!school) notFound();
  const country = countryByCode(school.country);
  const price = formatSchoolPrice(school);
  const languages = [school.teachesEnglish && "English", school.teachesFrench && "French"].filter(Boolean) as string[];

  // Structured data for search engines (rating only when real reviews exist).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: school.name,
    description: school.tagline ?? undefined,
    address: { "@type": "PostalAddress", addressLocality: school.city, addressCountry: school.country, streetAddress: school.address ?? undefined },
    ...(school.ratingCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: school.ratingAvg, reviewCount: school.ratingCount } }
      : {}),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <div className="relative h-56 bg-gradient-to-br from-[#2E8B57] to-[#0f3d25] sm:h-72">
        {school.coverImage && <Image src={school.coverImage} alt="" fill priority sizes="100vw" className="object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <Link href="/schools" className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium hover:bg-white sm:left-8">
          <ChevronLeft className="h-4 w-4" /> All schools
        </Link>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 sm:px-6 lg:px-8">
        <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg">
            {school.logo ? (
              <Image src={school.logo} alt={`${school.name} logo`} fill sizes="96px" className="object-contain p-1.5" />
            ) : (
              <span className="grid h-full w-full place-items-center text-3xl font-bold text-[#2E8B57]">{school.name[0]}</span>
            )}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold sm:text-3xl">{school.name}</h1>
              <Badge className="gap-1 bg-[#2E8B57]/10 text-[#2E8B57] hover:bg-[#2E8B57]/10"><BadgeCheck className="h-3.5 w-3.5" /> Verified</Badge>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {school.city}, {country?.name} {country?.flag}</span>
              <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {languages.join(" & ")}</span>
              {school.ratingCount > 0 && (
                <a href="#reviews" className="flex items-center gap-1.5 hover:underline">
                  <StarRating value={school.ratingAvg} size={14} /> <strong className="text-foreground">{school.ratingAvg.toFixed(1)}</strong> ({school.ratingCount})
                </a>
              )}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-10">
            {school.tagline && <p className="text-lg font-medium">{school.tagline}</p>}

            <section>
              <h2 className="text-xl font-semibold">About the school</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{school.description}</p>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
              {[
                { title: "Levels", items: school.levels },
                { title: "Course formats", items: school.formats },
                { title: "Exam preparation", items: school.exams },
              ].map((g) => (
                <div key={g.title} className="rounded-xl border bg-card p-4">
                  <h3 className="text-sm font-semibold">{g.title}</h3>
                  {g.items.length ? (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {g.items.map((i) => (
                        <li key={i} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{LABELS[i] ?? i}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">Ask the school</p>
                  )}
                </div>
              ))}
            </section>

            {school.accreditation && (
              <p className="flex items-start gap-2 rounded-xl border bg-amber-50/60 p-4 text-sm"><Award className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /> {school.accreditation}</p>
            )}

            <section id="reviews" className="scroll-mt-24">
              <h2 className="text-xl font-semibold">Student reviews</h2>
              {school.ratingCount > 0 ? (
                <div className="mt-4 flex flex-col gap-6 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center">
                  <div className="text-center sm:w-40">
                    <p className="text-4xl font-bold">{school.ratingAvg.toFixed(1)}</p>
                    <StarRating value={school.ratingAvg} />
                    <p className="mt-1 text-xs text-muted-foreground">{school.ratingCount} review{school.ratingCount > 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((n) => {
                      const c = school.distribution[n] ?? 0;
                      const pct = school.ratingCount ? Math.round((c / school.ratingCount) * 100) : 0;
                      return (
                        <div key={n} className="flex items-center gap-2 text-xs">
                          <span className="w-3 text-right">{n}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[#F4C430]" style={{ width: `${pct}%` }} /></div>
                          <span className="w-8 text-muted-foreground">{c}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No reviews yet — be the first student to share your experience.</p>
              )}

              <ul className="mt-6 space-y-4">
                {school.reviews.map((r) => (
                  <li key={r.id} className="rounded-2xl border bg-card p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#2E8B57]/10 text-sm font-semibold text-[#2E8B57]">
                          {(r.author.name ?? "S")[0].toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{r.author.name?.split(" ")[0] ?? "Student"}</p>
                          <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
                        </div>
                      </div>
                      <StarRating value={r.rating} size={14} />
                    </div>
                    {r.title && <p className="mt-3 font-medium">{r.title}</p>}
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{r.comment}</p>
                    {r.reply && (
                      <div className="mt-3 rounded-xl border-l-4 border-[#2E8B57] bg-muted/40 p-3 text-sm">
                        <p className="text-xs font-semibold">Reply from {school.name}</p>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">{r.reply}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <ReviewForm slug={school.slug} schoolName={school.name} ownerId={school.ownerId} />
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border bg-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Price</p>
              <p className="mt-1 text-xl font-bold text-[#2E8B57]">{price ? `From ${price}` : "Contact the school"}</p>
              <div className="mt-4 space-y-2 text-sm">
                {school.address && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /> {school.address}, {school.city}</p>}
                {school.phone && <a href={`tel:${school.phone}`} className="flex items-center gap-2 hover:text-[#2E8B57]"><Phone className="h-4 w-4 text-muted-foreground" /> {school.phone}</a>}
                {school.whatsapp && (
                  <a href={waLink(school.whatsapp)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#2E8B57]">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" /> WhatsApp
                  </a>
                )}
                {school.website && (
                  <a href={school.website} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-2 hover:text-[#2E8B57]">
                    <Globe className="h-4 w-4 text-muted-foreground" /> Website
                  </a>
                )}
              </div>
            </div>
            <AgentChat agent={{ id: school.ownerId, name: school.name, image: school.logo, company: `${languages.join(" & ")} school · ${school.city}`, license: "verified" }} />
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
