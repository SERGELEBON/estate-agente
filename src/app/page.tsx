"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Footer } from "@/components/footer";
import { PropertyCard } from "@/components/property-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Users,
  UserCheck,
  Clock,
  Star,
  ArrowRight,
  Quote,
} from "lucide-react";

interface Property {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  location: string;
  type: string;
  status: string;
  listingType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  images: string;
  featured: boolean;
  agent: {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    image: string | null;
  };
}

const stats = [
  {
    icon: Building2,
    value: "500+",
    label: "Properties",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Users,
    value: "200+",
    label: "Happy Clients",
    color: "text-accent-foreground",
    bg: "bg-accent/20",
  },
  {
    icon: UserCheck,
    value: "50+",
    label: "Agents",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Clock,
    value: "10+",
    label: "Years Experience",
    color: "text-accent-foreground",
    bg: "bg-accent/20",
  },
];

const testimonials = [
  {
    name: "Nana Akua Mensah",
    role: "Homeowner, East Legon",
    content:
      "State-ImmoCom made finding our dream home in East Legon effortless. The agents were professional and truly understood our needs. We moved in within three months!",
    rating: 5,
  },
  {
    name: "David Osei-Bonsu",
    role: "Business Owner, Cantonments",
    content:
      "As a business owner, finding the right office space was crucial. The platform connected me with a verified agent who found the perfect space for my growing team.",
    rating: 5,
  },
  {
    name: "Ama Darkwah",
    role: "Investor, Labone",
    content:
      "I have invested in three properties through State-ImmoCom. The transparency and quality of listings give me confidence in every transaction. Highly recommended!",
    rating: 5,
  },
];

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch("/api/properties?featured=true&limit=9");
        if (res.ok) {
          const data = await res.json();
          setProperties(data.properties || []);
        }
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />

        {/* Featured Properties */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <h2 className="mb-3 text-3xl font-bold">Featured Properties</h2>
              <p className="text-muted-foreground">
                Handpicked premium properties in Accra&apos;s most desirable
                neighborhoods
              </p>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : properties.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => (
                  <PropertyCard key={property.id} {...property} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No featured properties at the moment.
                </p>
              </div>
            )}
            <div className="mt-10 text-center">
              <Button size="lg" variant="outline" asChild>
                <Link href="/properties">
                  View All Properties
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-primary/5 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <h2 className="mb-3 text-3xl font-bold">
                Trusted by Thousands
              </h2>
              <p className="text-muted-foreground">
                Numbers that speak for our commitment to excellence
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {stats.map((stat) => (
                <Card
                  key={stat.label}
                  className="text-center border-0 shadow-sm"
                >
                  <CardContent className="p-6">
                    <div
                      className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${stat.bg}`}
                    >
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <p className="mb-1 text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-gradient-to-r from-primary to-primary/80 p-8 md:p-12 text-center">
                <h2 className="mb-4 text-3xl font-bold text-primary-foreground">
                  Ready to Find Your Dream Home?
                </h2>
                <p className="mx-auto mb-8 max-w-2xl text-primary-foreground/80">
                  Join thousands of satisfied clients who found their perfect
                  property through State-ImmoCom. Start your journey today.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    size="lg"
                    variant="secondary"
                    asChild
                    className="text-base"
                  >
                    <Link href="/auth/register">Sign Up Now</Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="bg-transparent border-white/40 text-white hover:bg-white/15 hover:text-white text-base"
                  >
                    <Link href="/properties">Browse Properties</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-muted/40 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <h2 className="mb-3 text-3xl font-bold">
                What Our Clients Say
              </h2>
              <p className="text-muted-foreground">
                Hear from people who found their dream properties with us
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <Card key={t.name} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <Quote className="mb-4 h-8 w-8 text-primary/30" />
                    <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                      &ldquo;{t.content}&rdquo;
                    </p>
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-accent text-accent"
                        />
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
