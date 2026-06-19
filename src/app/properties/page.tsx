"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PropertyCard } from "@/components/property-card";
import { PropertyFilters } from "@/components/property-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Building2, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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

function PropertiesContent() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      try {
        const params = new URLSearchParams(searchParams.toString());
        if (!params.has("page")) params.set("page", "1");
        params.set("limit", "12");
        const res = await fetch(`/api/properties?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProperties(data.properties || []);
          setPagination(data.pagination);
        }
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, [searchParams]);

  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    window.location.href = `/properties?${params.toString()}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Properties in Accra, Ghana</h1>
        <p className="text-muted-foreground">
          {loading ? "Loading properties..." : `${pagination.total} properties found`}
        </p>
      </div>

      <div className="flex gap-8">
        {/* Desktop Filters Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-20 rounded-lg border bg-card p-4">
            <PropertyFilters />
          </div>
        </aside>

        {/* Mobile Filter Button */}
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-full shadow-lg gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <div className="mt-6">
                <PropertyFilters />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Properties Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {properties.map((property) => (
                  <PropertyCard key={property.id} {...property} />
                ))}
              </div>
              {pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => updatePage(pagination.page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === pagination.totalPages ||
                          Math.abs(p - pagination.page) <= 1
                      )
                      .map((p, i, arr) => (
                        <span key={p}>
                          {i > 0 && arr[i - 1] !== p - 1 && (
                            <span className="px-1 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={p === pagination.page ? "default" : "outline"}
                            size="sm"
                            className="w-9"
                            onClick={() => updatePage(p)}
                          >
                            {p}
                          </Button>
                        </span>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => updatePage(pagination.page + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center">
              <Building2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground/40" />
              <h3 className="mb-2 text-lg font-semibold">No properties found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters to find what you&apos;re looking for.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="container mx-auto px-4 py-8">
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-5 w-40 mb-8" />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <PropertiesContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
