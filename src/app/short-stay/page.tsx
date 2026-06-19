"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PropertyCard } from "@/components/property-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Hotel,
  Home,
  BedDouble,
  Wifi,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
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
}

const categories = [
  {
    icon: BedDouble,
    title: "Serviced Apartments",
    description:
      "Fully furnished apartments with hotel-like services — ideal for business travelers and expats seeking comfort and privacy.",
    color: "#2E8B57",
    bg: "bg-emerald-50",
  },
  {
    icon: Hotel,
    title: "Hotels",
    description:
      "Premium hotel rooms and suites across Accra's best neighborhoods, with amenities like pools, gyms, and room service.",
    color: "#F4C430",
    bg: "bg-yellow-50",
  },
  {
    icon: Home,
    title: "Hostels",
    description:
      "Budget-friendly shared and private rooms for backpackers, students, and short-term visitors looking to explore Accra.",
    color: "#2E8B57",
    bg: "bg-emerald-50",
  },
];

const benefits = [
  {
    icon: Sparkles,
    title: "Move-in Ready",
    description: "All properties come fully equipped — just bring your suitcase.",
  },
  {
    icon: Clock,
    title: "Flexible Duration",
    description: "Stay for a night, a week, or a month. Book on your terms.",
  },
  {
    icon: Wifi,
    title: "Wi-Fi Included",
    description: "Stay connected with high-speed internet in every listing.",
  },
  {
    icon: Shield,
    title: "Secure & Verified",
    description: "Every property is vetted and verified by our team for your safety.",
  },
  {
    icon: Hotel,
    title: "Housekeeping",
    description: "Enjoy regular cleaning and linen services in serviced options.",
  },
  {
    icon: CheckCircle2,
    title: "Instant Booking",
    description: "Reserve your stay instantly — no lengthy approval process.",
  },
];

export default function ShortStayPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShortStayProperties() {
      try {
        // Fetch HOTEL, HOSTEL, and short-term rental apartments
        const [hotelRes, hostelRes, apartmentRes] = await Promise.all([
          fetch("/api/properties?type=HOTEL&limit=12"),
          fetch("/api/properties?type=HOSTEL&limit=12"),
          fetch("/api/properties?type=APARTMENT&listingType=RENT&limit=12"),
        ]);

        const allProperties: Property[] = [];

        if (hotelRes.ok) {
          const data = await hotelRes.json();
          allProperties.push(...(data.properties || []));
        }
        if (hostelRes.ok) {
          const data = await hostelRes.json();
          allProperties.push(...(data.properties || []));
        }
        if (apartmentRes.ok) {
          const data = await apartmentRes.json();
          // Only include featured apartments as short-stay candidates
          const shortTermApts = (data.properties || []).filter(
            (p: Property) => p.featured
          );
          allProperties.push(...shortTermApts);
        }

        setProperties(allProperties);
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    }
    fetchShortStayProperties();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="relative w-full overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #2E8B57 0%, #1a5c38 50%, #0f3d25 100%)",
          }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium text-white" style={{ backgroundColor: "rgba(244,196,48,0.25)", border: "1px solid rgba(244,196,48,0.5)" }}>
                <Clock className="h-4 w-4" style={{ color: "#F4C430" }} />
                <span>Short-Term Stays in Accra</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
                Your Home Away
                <br />
                <span style={{ color: "#F4C430" }}>From Home</span>
              </h1>

              <p className="mx-auto max-w-2xl text-base sm:text-lg text-white/80 leading-relaxed">
                Discover comfortable short-stay accommodations in Accra — from
                serviced apartments and boutique hotels to budget-friendly
                hostels. Flexible durations, instant booking, and everything you
                need for a seamless stay.
              </p>

              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Button
                  size="lg"
                  asChild
                  className="text-white hover:opacity-90"
                  style={{ backgroundColor: "#2E8B57" }}
                >
                  <Link href="#listings">
                    Browse Stays
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-white/40 text-white hover:bg-white/15 hover:text-white"
                  asChild
                >
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <h2 className="mb-3 text-3xl font-bold">Types of Short Stays</h2>
              <p className="text-muted-foreground">
                Choose the perfect accommodation for your needs
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {categories.map((cat) => (
                <Card
                  key={cat.title}
                  className="border-0 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6 text-center space-y-4">
                    <div
                      className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${cat.bg}`}
                    >
                      <cat.icon className="h-7 w-7" style={{ color: cat.color }} />
                    </div>
                    <h3 className="text-xl font-semibold">{cat.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {cat.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-20" style={{ backgroundColor: "#f8faf8" }}>
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <h2 className="mb-3 text-3xl font-bold">
                Why Choose Short-Stay?
              </h2>
              <p className="text-muted-foreground">
                Everything you need for a comfortable, hassle-free stay
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="flex items-start gap-4 p-5 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "rgba(46,139,87,0.1)" }}
                  >
                    <benefit.icon
                      className="h-5 w-5"
                      style={{ color: "#2E8B57" }}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Listings Section */}
        <section id="listings" className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <h2 className="mb-3 text-3xl font-bold">
                Available Short-Stay Properties
              </h2>
              <p className="text-muted-foreground">
                Hotels, hostels, and serviced apartments ready for your next
                visit to Accra
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
                <Hotel className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No short-stay properties available at the moment.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Check back soon or browse all{" "}
                  <Link
                    href="/properties"
                    className="font-medium hover:underline"
                    style={{ color: "#2E8B57" }}
                  >
                    properties
                  </Link>
                  .
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

        {/* CTA Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <Card className="overflow-hidden border-0 shadow-lg">
              <div
                className="p-8 md:p-12 text-center"
                style={{
                  background:
                    "linear-gradient(135deg, #2E8B57 0%, #1a5c38 100%)",
                }}
              >
                <h2 className="mb-4 text-3xl font-bold text-white">
                  Need Help Finding the Perfect Stay?
                </h2>
                <p className="mx-auto mb-8 max-w-2xl text-white/80">
                  Our team knows Accra inside and out. Tell us what you need and
                  we&apos;ll match you with the ideal short-stay accommodation.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    size="lg"
                    style={{ backgroundColor: "#F4C430" }}
                    className="text-gray-900 hover:opacity-90"
                    asChild
                  >
                    <Link href="/contact">Get in Touch</Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-white/40 text-white hover:bg-white/15 hover:text-white"
                    asChild
                  >
                    <Link href="/properties">Browse All Properties</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
