"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const bedroomOptions = [
  { value: "any", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
];

const bathroomOptions = [
  { value: "any", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
];

export function PropertyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filtersOpen, setFiltersOpen] = useState(false);

  // Read current filter values from URL
  const [location, setLocation] = useState(
    searchParams.get("location") ?? ""
  );
  const [type, setType] = useState(
    searchParams.get("type") ?? "ALL"
  );
  const [listingType, setListingType] = useState(
    searchParams.get("listingType") ?? "ALL"
  );
  const [minPrice, setMinPrice] = useState(
    searchParams.get("minPrice") ?? ""
  );
  const [maxPrice, setMaxPrice] = useState(
    searchParams.get("maxPrice") ?? ""
  );
  const [bedrooms, setBedrooms] = useState(
    searchParams.get("bedrooms") ?? "any"
  );
  const [bathrooms, setBathrooms] = useState(
    searchParams.get("bathrooms") ?? "any"
  );

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (location.trim()) params.set("location", location.trim());
    if (type !== "ALL") params.set("type", type);
    if (listingType !== "ALL") params.set("listingType", listingType);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (bedrooms !== "any") params.set("bedrooms", bedrooms);
    if (bathrooms !== "any") params.set("bathrooms", bathrooms);

    router.push(`/properties?${params.toString()}`);
  };

  const clearFilters = () => {
    setLocation("");
    setType("ALL");
    setListingType("ALL");
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("any");
    setBathrooms("any");
    router.push("/properties");
  };

  const hasActiveFilters =
    location.trim() ||
    type !== "ALL" ||
    listingType !== "ALL" ||
    minPrice ||
    maxPrice ||
    bedrooms !== "any" ||
    bathrooms !== "any";

  const filtersContent = (
    <div className="space-y-5">
      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="filter-location" className="text-sm font-medium">
          Location
        </Label>
        <Input
          id="filter-location"
          type="text"
          placeholder="e.g. East Legon, Osu"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="h-10"
        />
      </div>

      {/* Property Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Property Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-full h-10">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {propertyTypes.map((pt) => (
              <SelectItem key={pt.value} value={pt.value}>
                {pt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Listing Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Listing Type</Label>
        <Select value={listingType} onValueChange={setListingType}>
          <SelectTrigger className="w-full h-10">
            <SelectValue placeholder="All Listings" />
          </SelectTrigger>
          <SelectContent>
            {listingTypes.map((lt) => (
              <SelectItem key={lt.value} value={lt.value}>
                {lt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Price Range (GHC)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="h-10"
            min={0}
          />
          <span className="text-gray-400 text-sm">—</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="h-10"
            min={0}
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Bedrooms</Label>
        <Select value={bedrooms} onValueChange={setBedrooms}>
          <SelectTrigger className="w-full h-10">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            {bedroomOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bathrooms */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Bathrooms</Label>
        <Select value={bathrooms} onValueChange={setBathrooms}>
          <SelectTrigger className="w-full h-10">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            {bathroomOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-2">
        <Button
          onClick={applyFilters}
          className="w-full text-white hover:opacity-90"
          style={{ backgroundColor: "#2E8B57" }}
        >
          Apply Filters
        </Button>
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="w-full"
          >
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: Toggle Button */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs text-white"
                style={{ backgroundColor: "#2E8B57" }}
              >
                !
              </span>
            )}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              filtersOpen ? "rotate-180" : ""
            }`}
          />
        </Button>
        {filtersOpen && (
          <div className="mt-4 rounded-lg border bg-white p-4">
            {filtersContent}
          </div>
        )}
      </div>

      {/* Desktop: Sidebar */}
      <aside className="hidden lg:block">
        <div className="rounded-lg border bg-white p-6 sticky top-20">
          <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </h3>
          {filtersContent}
        </div>
      </aside>
    </>
  );
}
