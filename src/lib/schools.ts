import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { COUNTRY_CODES } from "@/lib/geo";

export const SCHOOL_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export const SCHOOL_FORMATS = ["IN_PERSON", "ONLINE", "INTENSIVE", "PRIVATE", "EVENING", "WEEKEND", "KIDS"] as const;
export const SCHOOL_EXAMS = ["IELTS", "TOEFL", "TOEIC", "CAMBRIDGE", "DELF", "DALF", "TCF", "TEF"] as const;
export const PRICE_UNITS = ["HOUR", "WEEK", "MONTH", "COURSE"] as const;

export const LABELS: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  IN_PERSON: "In person",
  ONLINE: "Online",
  INTENSIVE: "Intensive",
  PRIVATE: "Private lessons",
  EVENING: "Evening classes",
  WEEKEND: "Weekend classes",
  KIDS: "Kids & teens",
  HOUR: "hour",
  WEEK: "week",
  MONTH: "month",
  COURSE: "course",
};

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal("")).transform((v) => v || null);
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .url("Enter a full link starting with https://")
  .refine((v) => v.startsWith("https://"), "Links must start with https://")
  .optional()
  .or(z.literal(""))
  .transform((v) => v || null);
/** Images must come from our own upload pipeline (Cloudinary) — never arbitrary hosts. */
const uploadedImage = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v.startsWith("https://res.cloudinary.com/"), "Upload the image with the button")
  .optional()
  .or(z.literal(""))
  .transform((v) => v || null);
const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{8,20}$/, "Enter a valid phone number, e.g. +233 20 123 4567")
  .optional()
  .or(z.literal(""))
  .transform((v) => v || null);

export const schoolProfileSchema = z
  .object({
    name: z.string().trim().min(3, "School name is required").max(100),
    tagline: optionalText(140),
    description: z.string().trim().min(120, "Describe your school in at least 120 characters").max(4000),
    teachesEnglish: z.boolean(),
    teachesFrench: z.boolean(),
    levels: z.array(z.enum(SCHOOL_LEVELS)).max(SCHOOL_LEVELS.length).default([]),
    formats: z.array(z.enum(SCHOOL_FORMATS)).min(1, "Pick at least one course format").max(SCHOOL_FORMATS.length),
    exams: z.array(z.enum(SCHOOL_EXAMS)).max(SCHOOL_EXAMS.length).default([]),
    country: z.enum(COUNTRY_CODES, { error: "Choose a country" }),
    city: z.string().trim().min(2, "City is required").max(60),
    address: optionalText(200),
    phone,
    whatsapp: phone,
    email: z.string().trim().email("Enter a valid email").max(254).optional().or(z.literal("")).transform((v) => v || null),
    website: optionalUrl,
    logo: uploadedImage,
    coverImage: uploadedImage,
    accreditation: optionalText(200),
    priceFrom: z.number().positive().max(100_000_000).nullable().optional(),
    currency: z.enum(["GHS", "XOF", "USD", "EUR"]).default("GHS"),
    priceUnit: z.enum(PRICE_UNITS).default("MONTH"),
  })
  .refine((d) => d.teachesEnglish || d.teachesFrench, {
    message: "Select at least one language you teach",
    path: ["teachesEnglish"],
  });

export type SchoolProfileInput = z.infer<typeof schoolProfileSchema>;

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Choose a rating").max(5),
  title: z.string().trim().max(100).optional().or(z.literal("")).transform((v) => v || null),
  comment: z.string().trim().min(20, "Tell others a bit more (at least 20 characters)").max(2000),
});

export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "school";
}

export async function uniqueSchoolSlug(name: string, city: string, excludeId?: string) {
  const base = slugify(`${name}-${city}`);
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const taken = await db.school.findFirst({ where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true } });
    if (!taken) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Recomputes the cached rating from visible reviews — call inside the same transaction as the change. */
export async function recomputeSchoolRating(tx: Prisma.TransactionClient, schoolId: string) {
  const agg = await tx.schoolReview.aggregate({
    where: { schoolId, hidden: false },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await tx.school.update({
    where: { id: schoolId },
    data: {
      ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      ratingCount: agg._count._all,
    },
  });
}

const parseList = (v: string | null | undefined): string[] => {
  try {
    const parsed = JSON.parse(v ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** Converts a DB row (JSON-string columns) to the shape the UI uses. */
export function serializeSchool<T extends { levels: string; formats: string; exams: string }>(s: T) {
  return { ...s, levels: parseList(s.levels), formats: parseList(s.formats), exams: parseList(s.exams) };
}

export const publicSchoolSelect = {
  id: true,
  ownerId: true,
  name: true,
  slug: true,
  tagline: true,
  description: true,
  teachesEnglish: true,
  teachesFrench: true,
  levels: true,
  formats: true,
  exams: true,
  country: true,
  city: true,
  address: true,
  phone: true,
  whatsapp: true,
  email: true,
  website: true,
  logo: true,
  coverImage: true,
  accreditation: true,
  priceFrom: true,
  currency: true,
  priceUnit: true,
  featured: true,
  ratingAvg: true,
  ratingCount: true,
  createdAt: true,
} satisfies Prisma.SchoolSelect;
