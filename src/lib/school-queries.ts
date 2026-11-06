import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { countryByCode } from "@/lib/geo";
import { publicSchoolSelect, serializeSchool } from "@/lib/schools";

export interface SchoolFilters {
  language?: string | null; // "english" | "french"
  country?: string | null; // ISO code(s), comma separated
  city?: string | null;
  q?: string | null;
  sort?: string | null; // "rating" | "reviews" | "newest" | "price"
  page?: number;
  limit?: number;
}

/** Public directory: only ACTIVE (verified) schools. */
export async function listSchools(f: SchoolFilters) {
  const where: Prisma.SchoolWhereInput = { status: "ACTIVE" };
  if (f.language === "english") where.teachesEnglish = true;
  if (f.language === "french") where.teachesFrench = true;

  const countries = (f.country ?? "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter((c) => countryByCode(c));
  if (countries.length) where.country = { in: countries };
  if (f.city) where.city = { equals: f.city.trim(), mode: "insensitive" };

  const q = f.q?.trim().slice(0, 80);
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { tagline: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.SchoolOrderByWithRelationInput[] =
    f.sort === "newest"
      ? [{ createdAt: "desc" }]
      : f.sort === "price"
        ? [{ priceFrom: { sort: "asc", nulls: "last" } }]
        : f.sort === "reviews"
          ? [{ ratingCount: "desc" }, { ratingAvg: "desc" }]
          : [{ featured: "desc" }, { ratingAvg: "desc" }, { ratingCount: "desc" }];

  const limit = Math.min(Math.max(f.limit ?? 12, 1), 48);
  const page = Math.max(f.page ?? 1, 1);

  const [rows, total] = await Promise.all([
    db.school.findMany({ where, orderBy, take: limit, skip: (page - 1) * limit, select: publicSchoolSelect }),
    db.school.count({ where }),
  ]);
  return { schools: rows.map(serializeSchool), total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getPublicSchool(slug: string) {
  const school = await db.school.findFirst({
    where: { slug, status: "ACTIVE" },
    select: {
      ...publicSchoolSelect,
      reviews: {
        where: { hidden: false },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          reply: true,
          repliedAt: true,
          createdAt: true,
          authorId: true,
          author: { select: { name: true, image: true } },
        },
      },
    },
  });
  if (!school) return null;
  const distribution = await db.schoolReview.groupBy({
    by: ["rating"],
    where: { schoolId: school.id, hidden: false },
    _count: { _all: true },
  });
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const d of distribution) dist[d.rating] = d._count._all;
  return { ...serializeSchool(school), distribution: dist };
}

/** Small counts for the home page service cards. */
export async function homeServiceCounts() {
  const [english, french] = await Promise.all([
    db.school.count({ where: { status: "ACTIVE", teachesEnglish: true } }),
    db.school.count({ where: { status: "ACTIVE", teachesFrench: true } }),
  ]);
  return { english, french };
}
