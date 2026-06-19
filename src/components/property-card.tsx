"use client";

import { useState, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bed, Bath, Maximize, MapPin, Home, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatPrice,
  formatArea,
  getPropertyTypeLabel,
  getListingTypeLabel,
  getStatusLabel,
  getPriceDurationLabel,
} from "@/lib/helpers";

export interface PropertyCardProps {
  id: string;
  title: string;
  slug: string;
  price: number;
  location: string;
  type: string;
  status: string;
  listingType: string;
  priceDuration?: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  images: string; // JSON string
  featured?: boolean;
}

// ─── Simple LRU cache for parsed image JSON (max 200 entries) ──────
const imageCache = new Map<string, string>();
const IMAGE_CACHE_MAX = 200;

function getPropertyImage(imagesJson: string): string {
  if (imageCache.has(imagesJson)) {
    const cached = imageCache.get(imagesJson)!;
    // Move to end (most recently used)
    imageCache.delete(imagesJson);
    imageCache.set(imagesJson, cached);
    return cached;
  }
  try {
    const parsed = JSON.parse(imagesJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const url = parsed[0];
      // Enforce cache size limit
      if (imageCache.size >= IMAGE_CACHE_MAX) {
        const firstKey = imageCache.keys().next().value;
        if (firstKey !== undefined) imageCache.delete(firstKey);
      }
      imageCache.set(imagesJson, url);
      return url;
    }
  } catch {
    // ignore parse errors
  }
  return "";
}

function getStatusColor(status: string): string {
  switch (status) {
    case "AVAILABLE":
      return "bg-green-600 text-white";
    case "SOLD":
      return "bg-red-600 text-white";
    case "RENTED":
      return "bg-orange-500 text-white";
    case "RESERVED":
      return "bg-yellow-600 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

function getListingTypeColor(listingType: string): string {
  switch (listingType) {
    case "SALE":
      return "bg-yellow-500 text-gray-900";
    case "RENT":
      return "text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

const PropertyCardInner = memo(function PropertyCardInner({
  id,
  title,
  slug,
  price,
  location,
  type,
  status,
  listingType,
  priceDuration = "MONTH",
  bedrooms,
  bathrooms,
  area,
  images,
  featured,
}: PropertyCardProps) {
  const imageUrl = getPropertyImage(images);
  const [imgError, setImgError] = useState(false);
  const showBedrooms = bedrooms !== null && bedrooms > 0;
  const showBathrooms = bathrooms !== null && bathrooms > 0;
  const showArea = area !== null && area > 0;

  return (
    <Link href={`/properties/${id}`} className="block group">
      <Card className="overflow-hidden py-0 gap-0 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-200/80">
        {/* Image Container */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
          {imageUrl && !imgError ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
              <Home className="h-12 w-12 text-gray-400" />
            </div>
          )}

          {/* Gradient overlay at bottom of image */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Badges overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <Badge className={`text-[10px] font-bold uppercase tracking-wider border-0 px-2 py-0.5 rounded-sm ${getStatusColor(status)}`}>
              {getStatusLabel(status)}
            </Badge>
            <Badge
              className={`text-[10px] font-bold uppercase tracking-wider border-0 px-2 py-0.5 rounded-sm ${getListingTypeColor(listingType)}`}
              style={
                listingType === "RENT"
                  ? { backgroundColor: "#2E8B57" }
                  : undefined
              }
            >
              {getListingTypeLabel(listingType)}
            </Badge>
          </div>

          {/* Featured badge */}
          {featured && (
            <div className="absolute top-3 right-3">
              <Badge
                className="text-[10px] font-bold uppercase tracking-wider border-0 px-2 py-0.5 rounded-sm"
                style={{ backgroundColor: "#F4C430", color: "#1a1a1a" }}
              >
                Featured
              </Badge>
            </div>
          )}

          {/* Price overlay on image */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div>
              <p className="text-xl font-extrabold text-white drop-shadow-lg">
                {formatPrice(price)}
                {listingType === "RENT" && (
                  <span className="text-sm font-semibold text-white/80">{getPriceDurationLabel(priceDuration)}</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4 space-y-2.5">
          {/* Title */}
          <h3 className="text-[15px] font-bold text-gray-900 line-clamp-1 group-hover:text-green-700 transition-colors leading-tight">
            {title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-gray-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: "#2E8B57" }} />
            <span className="text-xs line-clamp-1 font-medium">{location}</span>
          </div>

          {/* Property Type */}
          <div className="flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="text-xs font-medium text-gray-500">{getPropertyTypeLabel(type)}</span>
          </div>

          {/* Features Row */}
          {(showBedrooms || showBathrooms || showArea) && (
            <div className="flex items-center gap-3 pt-2.5 mt-1 border-t border-gray-100">
              {showBedrooms && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Bed className="h-4 w-4" style={{ color: "#2E8B57" }} />
                  <span className="text-xs font-semibold">{bedrooms} Bed{bedrooms !== 1 ? "s" : ""}</span>
                </div>
              )}
              {showBathrooms && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Bath className="h-4 w-4" style={{ color: "#2E8B57" }} />
                  <span className="text-xs font-semibold">{bathrooms} Bath{bathrooms !== 1 ? "s" : ""}</span>
                </div>
              )}
              {showArea && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Maximize className="h-4 w-4" style={{ color: "#2E8B57" }} />
                  <span className="text-xs font-semibold">{formatArea(area)}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
});

export const PropertyCard = PropertyCardInner;
