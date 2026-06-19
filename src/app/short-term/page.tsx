"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PropertyCard } from "@/components/property-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Luggage,
  Building2,
  Wifi,
  AirVent,
  Shield,
  Sparkles,
  ArrowRight,
  ChevronRight,
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

const benefits = [
  {
    icon: Luggage,
    title: "Move-In Ready",
    description:
      "All our short-term properties come fully furnished with everything you need — just bring your suitcase and settle in from day one.",
  },
  {
    icon: Clock,
    title: "Flexible Duration",
    description:
      "Stay for 1 to 3 months with flexible lease terms. No long-term commitments, no hassle — perfect for your schedule.",
  },
  {
    icon: Wifi,
    title: "High-Speed Internet",
    description:
      "Every property includes reliable high-speed Wi-Fi so you can work remotely, stream, and stay connected with family back home.",
  },
  {
    icon: AirVent,
    title: "Air Conditioned",
    description:
      "Beat the Accra heat! All our short-term rentals come with air conditioning to keep you comfortable throughout your stay.",
  },
  {
    icon: Shield,
    title: "Secure Locations",
    description:
      "Properties in safe, well-connected neighborhoods with 24/7 security, gated compounds, and secure parking available.",
  },
  {
    icon: Sparkles,
    title: "Housekeeping Available",
    description:
      "Optional housekeeping and laundry services available at most properties. Focus on your work or exploration while we take care of the rest.",
  },
];

const stayTypes = [
  {
    title: "Serviced Apartments",
    description: "Fully furnished apartments with hotel-like services. Ideal for business travelers and expats on assignment.",
    type: "APARTMENT",
    price: "GH₵2,500 - GH₵5,000/mo",
  },
  {
    title: "Hotels & Guest Houses",
    description: "Comfortable hotel rooms and guest houses with daily housekeeping, breakfast, and concierge services.",
    type: "HOTEL",
    price: "GH₵800 - GH₵3,500/mo",
  },
  {
    title: "Hostels",
    description: "Budget-friendly shared accommodation perfect for backpackers, volunteers, and students. Social and affordable.",
    type: "HOSTEL",
    price: "GH₵120 - GH₵800/mo",
  },
];

function ShortTermContent() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("listingType", "RENT");
        params.set("status", "AVAILABLE");
        params.set("limit", "20");
        if (activeFilter !== "ALL") {
          params.set("type", activeFilter);
        }
        const res = await fetch(`/api/properties?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          // Only show property types relevant to short-term stays
          const shortTermTypes = ["APARTMENT", "HOTEL", "HOSTEL"];
          const filtered = (data.properties || []).filter(
            (p: any) =>
              shortTermTypes.includes(p.type) && p.furnished
          );
          setProperties(filtered);
        }
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, [activeFilter]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="relative w-full overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #2E8B57 0%, #1a5c38 40%, #0f3d25 100%)",
          }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
            <div className="text-center space-y-6">
              <Badge
                className="text-sm font-semibold px-4 py-1.5 border-0"
                style={{ backgroundColor: "#F4C430", color: "#1a1a1a" }}
              >
                <Luggage className="h-4 w-4 mr-1.5" />
                Short-Term Stays: 1-3 Months
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Visiting Accra? We&apos;ve Got
                <br />
                <span style={{ color: "#F4C430" }}>Your Home Sorted</span>
              </h1>
              <p className="mx-auto max-w-2xl text-base sm:text-lg text-white/80 leading-relaxed">
                Furnished apartments, hotels, and hostels ready for your
                short-term stay in Accra, Ghana. No long leases — just pack
                your bags and move in.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-2">
                <Button
                  size="lg"
                  className="text-white hover:opacity-90 text-base px-8"
                  style={{ backgroundColor: "#F4C430", color: "#1a1a1a" }}
                  onClick={() => {
                    const el = document.getElementById("properties");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Browse Properties
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/50 text-white hover:bg-white/20 text-base px-8 bg-black/20 backdrop-blur-sm shadow-sm"
                  onClick={() => {
                    const el = document.getElementById("how-it-works");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  How It Works
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stay Types */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <h2 className="mb-3 text-3xl font-bold">Choose Your Style</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Whether you&apos;re a business traveler, tourist, or volunteer — we
                have the perfect short-term accommodation for your stay in
                Accra.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stayTypes.map((stay) => (
                <Card
                  key={stay.type}
                  className="border-0 shadow-md hover:shadow-xl transition-shadow cursor-pointer group"
                  onClick={() => {
                    setActiveFilter(stay.type);
                    const el = document.getElementById("properties");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <CardContent className="p-6">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                      style={{ backgroundColor: "#2E8B57" }}
                    >
                      {stay.type === "APARTMENT" ? (
                        <Building2 className="h-6 w-6 text-white" />
                      ) : stay.type === "HOTEL" ? (
                        <Sparkles className="h-6 w-6 text-white" />
                      ) : (
                        <Luggage className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-green-700 transition-colors">
                      {stay.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {stay.description}
                    </p>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#2E8B57" }}
                    >
                      {stay.price}
                    </p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-green-700 transition-colors mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section id="how-it-works" className="py-16 bg-muted/40">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <h2 className="mb-3 text-3xl font-bold">
                Why Choose Short-Term with Us?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We make your temporary stay in Accra seamless and comfortable
                so you can focus on what matters.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit) => (
                <Card key={benefit.title} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
                      style={{ backgroundColor: "#F4C43020" }}
                    >
                      <benefit.icon
                        className="h-5 w-5"
                        style={{ color: "#F4C430" }}
                      />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Available Properties */}
        <section id="properties" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h2 className="mb-3 text-3xl font-bold">
                Available Short-Term Properties
              </h2>
              <p className="text-muted-foreground">
                {loading
                  ? "Loading..."
                  : `${properties.length} furnished properties ready for your stay`}
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                { value: "ALL", label: "All Types" },
                { value: "APARTMENT", label: "Apartments" },
                { value: "HOTEL", label: "Hotels" },
                { value: "HOSTEL", label: "Hostels" },
              ].map((tab) => (
                <Button
                  key={tab.value}
                  variant={activeFilter === tab.value ? "default" : "outline"}
                  size="sm"
                  className={
                    activeFilter === tab.value
                      ? "text-white hover:opacity-90"
                      : ""
                  }
                  style={
                    activeFilter === tab.value
                      ? { backgroundColor: "#2E8B57" }
                      : undefined
                  }
                  onClick={() => setActiveFilter(tab.value)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
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
              <div className="py-20 text-center">
                <Building2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground/40" />
                <h3 className="mb-2 text-lg font-semibold">
                  No properties found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or check back soon for new
                  listings.
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

        {/* CTA */}
        <section className="py-16">
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
                  Need Help Finding the Right Place?
                </h2>
                <p className="mx-auto mb-8 max-w-2xl text-white/80">
                  Our agents specialize in short-term accommodation for
                  visitors to Accra. Tell us your budget, dates, and
                  preferences — we&apos;ll find your perfect match.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    size="lg"
                    className="text-base px-8"
                    style={{ backgroundColor: "#F4C430", color: "#1a1a1a" }}
                  >
                    <Link href="/contact">Contact an Agent</Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/50 text-white hover:bg-white/20 text-base px-8 bg-black/20 backdrop-blur-sm shadow-sm"
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

export default function ShortTermPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1 container mx-auto px-4 py-8">
            <Skeleton className="h-64 w-full rounded-xl mb-8" />
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-40 mb-8" />
          </main>
          <Footer />
        </div>
      }
    >
      <ShortTermContent />
    </Suspense>
  );
}
