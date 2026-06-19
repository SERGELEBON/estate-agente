import { z } from "zod";

// ─── Property Schema ─────────────────────────────────────────
export const propertySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number({ required_error: "Price is required" }).positive("Price must be positive"),
  currency: z.string().default("GHC"),
  location: z.string().min(2, "Location is required"),
  city: z.string().default("Accra"),
  region: z.string().default("Greater Accra"),
  country: z.string().default("Ghana"),
  type: z.enum(["APARTMENT", "HOUSE", "VILLA", "LAND", "COMMERCIAL", "OFFICE", "HOTEL", "HOSTEL"], {
    required_error: "Property type is required",
  }),
  status: z.enum(["AVAILABLE", "SOLD", "RENTED", "RESERVED"]).default("AVAILABLE"),
  listingType: z.enum(["SALE", "RENT"]).default("SALE"),
  priceDuration: z.enum(["DAY", "MONTH", "YEAR"]).default("MONTH"),
  bedrooms: z.number().int().nullable().optional(),
  bathrooms: z.number().int().nullable().optional(),
  area: z.number().positive().nullable().optional(),
  furnished: z.boolean().default(false),
  parking: z.boolean().default(false),
  pool: z.boolean().default(false),
  gym: z.boolean().default(false),
  images: z.string().default("[]"), // JSON array string
  videos: z.string().default("[]"), // JSON array string
  featured: z.boolean().default(false),
  agentId: z.string().min(1, "Agent ID is required"),
});

export const propertyUpdateSchema = propertySchema.partial();

// ─── Message Schema (legacy - kept for backward compat) ──────
export const messageSchema = z.object({
  senderName: z.string().min(2, "Sender name is required"),
  senderEmail: z.string().email("Valid email is required"),
  senderPhone: z.string().optional(),
  subject: z.string().min(3, "Subject is required"),
  body: z.string().min(10, "Message body must be at least 10 characters"),
  propertyId: z.string().optional(),
  agentId: z.string().min(1, "Agent ID is required"),
});

// ─── Conversation Schema (new internal messaging) ───────────
export const conversationCreateSchema = z.object({
  visitorName: z
    .string({ error: "Your name is required" })
    .min(2, "Your name must be at least 2 characters"),
  visitorEmail: z
    .string({ error: "Your email is required" })
    .email("Please enter a valid email address"),
  visitorPhone: z.string().optional(),
  subject: z
    .string({ error: "Subject is required" })
    .min(3, "Subject must be at least 3 characters"),
  body: z
    .string({ error: "Your message is required" })
    .min(5, "Your message must be at least 5 characters")
    .max(5000, "Your message is too long (max 5000 characters)"),
  propertyId: z
    .string({ error: "Property is required" })
    .min(1, "Property is required"),
  agentId: z
    .string({ error: "Agent is required" })
    .min(1, "Agent is required"),
});

// ─── Visit Schema ────────────────────────────────────────────
export const visitSchema = z.object({
  visitorName: z.string().min(2, "Visitor name is required"),
  visitorEmail: z.string().email("Valid email is required"),
  visitorPhone: z.string().min(1, "Phone number is required"),
  visitDate: z.string().min(1, "Visit date is required"), // ISO date string
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).default("SCHEDULED"),
  notes: z.string().nullable().optional(),
  propertyId: z.string().min(1, "Property ID is required"),
  agentId: z.string().min(1, "Agent ID is required"),
});

export const visitUpdateSchema = z.object({
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().nullable().optional(),
});

// ─── Register Schema ─────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "AGENT"]).default("AGENT"),
  phone: z.string().optional(),
  company: z.string().optional(),
  license: z.string().optional(),
  bio: z.string().optional(),
});
