"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const propertyTypes = [
  { value: "ALL", label: "All Types" },
  { value: "APARTMENT", label: "Apartment" },
  { value: "HOUSE", label: "House" },
  { value: "VILLA", label: "Villa" },
  { value: "LAND", label: "Land" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "OFFICE", label: "Office" },
  { value: "HOTEL", label: "Hotel" },
  { value: "HOSTEL", label: "Hostel" },
];

const listingTypes = [
  { value: "ALL", label: "All Listings" },
  { value: "SALE", label: "For Sale" },
  { value: "RENT", label: "For Rent" },
];

export function Hero() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("ALL");
  const [listingType, setListingType] = useState("ALL");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (location.trim()) params.set("location", location.trim());
    if (propertyType !== "ALL") params.set("type", propertyType);
    if (listingType !== "ALL") params.set("listingType", listingType);

    router.push(`/properties?${params.toString()}`);
  };

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #2E8B57 0%, #1a5c38 50%, #0f3d25 100%)",
      }}
    >
      {/* Decorative overlay pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <div className="text-center space-y-6">
          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
            Find Your Perfect Property
            <br />
            <span style={{ color: "#F4C430" }}>in Accra</span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-white/80 leading-relaxed">
            Ghana&apos;s premier real estate platform for buying, renting, and
            investing in properties across Accra
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="mx-auto max-w-4xl mt-8 sm:mt-10"
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 bg-white rounded-xl sm:rounded-xl p-3 sm:p-2 shadow-2xl">
              {/* Location Input */}
              <div className="flex-1 sm:flex-[1.5]">
                <Input
                  type="text"
                  placeholder="Location in Accra (e.g. East Legon)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-11 border-0 shadow-none focus-visible:ring-0 text-sm placeholder:text-gray-400"
                />
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px bg-gray-200 self-stretch my-1" />

              {/* Property Type Select */}
              <div className="sm:flex-1">
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="h-11 border-0 shadow-none focus:ring-0 text-sm">
                    <SelectValue placeholder="Property Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px bg-gray-200 self-stretch my-1" />

              {/* Listing Type Select */}
              <div className="sm:flex-1">
                <Select value={listingType} onValueChange={setListingType}>
                  <SelectTrigger className="h-11 border-0 shadow-none focus:ring-0 text-sm">
                    <SelectValue placeholder="Listing Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {listingTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Button */}
              <Button
                type="submit"
                size="lg"
                className="h-11 px-6 sm:ml-2 text-white hover:opacity-90"
                style={{ backgroundColor: "#2E8B57" }}
              >
                <Search className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Search</span>
                <span className="sr-only sm:hidden">Search</span>
              </Button>
            </div>
          </form>

          {/* Stats Row */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 pt-6">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-white">500+</p>
              <p className="text-xs sm:text-sm text-white/70">Properties</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-white">50+</p>
              <p className="text-xs sm:text-sm text-white/70">Trusted Agents</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-white">1000+</p>
              <p className="text-xs sm:text-sm text-white/70">Happy Clients</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
