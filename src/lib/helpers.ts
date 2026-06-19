export function formatPrice(price: number, currency: string = "GHC"): string {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: currency === "GHC" ? "GHS" : currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatArea(area: number): string {
  return `${area} m²`;
}

export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    APARTMENT: "Apartment",
    HOUSE: "House",
    VILLA: "Villa",
    LAND: "Land",
    COMMERCIAL: "Commercial",
    OFFICE: "Office",
    HOTEL: "Hotel",
    HOSTEL: "Hostel",
  };
  return labels[type] ?? type;
}

export function getListingTypeLabel(type: string): string {
  return type === "RENT" ? "For Rent" : "For Sale";
}

export function getPriceDurationLabel(duration: string): string {
  const labels: Record<string, string> = {
    DAY: "/day",
    MONTH: "/month",
    YEAR: "/year",
  };
  return labels[duration] ?? "/month";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    AVAILABLE: "Available",
    SOLD: "Sold",
    RENTED: "Rented",
    RESERVED: "Reserved",
  };
  return labels[status] ?? status;
}

export function getVisitStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    SCHEDULED: "Scheduled",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return labels[status] ?? status;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}
