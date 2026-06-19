"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PropertyCard } from "@/components/property-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  formatPrice,
  formatArea,
  getPropertyTypeLabel,
  getListingTypeLabel,
  getStatusLabel,
  getPriceDurationLabel,
} from "@/lib/helpers";
import {
  Bed,
  Bath,
  Maximize,
  MapPin,
  Car,
  Waves,
  Dumbbell,
  Sofa,
  Eye,
  Phone,
  Mail,
  Building2,
  ChevronLeft,
  ChevronRight,
  Send,
  CalendarDays,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { parseMessagingError, networkError } from "@/lib/messaging-errors";

interface Property {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  city: string;
  region: string;
  country: string;
  type: string;
  status: string;
  listingType: string;
  priceDuration: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  furnished: boolean;
  parking: boolean;
  pool: boolean;
  gym: boolean;
  images: string;
  videos: string;
  featured: boolean;
  views: number;
  agent: {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    license: string | null;
    image: string | null;
    bio: string | null;
  };
  createdAt: string;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [property, setProperty] = useState<Property | null>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [contactForm, setContactForm] = useState({
    senderName: "",
    senderEmail: "",
    senderPhone: "",
    subject: "",
    body: "",
  });
  const [visitForm, setVisitForm] = useState({
    visitorName: "",
    visitorEmail: "",
    visitorPhone: "",
    visitDate: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchProperty() {
      try {
        const res = await fetch(`/api/properties/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProperty(data);
          setContactForm((prev) => ({
            ...prev,
            subject: `Inquiry about ${data.title}`,
          }));
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchProperty();
  }, [id]);

  useEffect(() => {
    async function fetchSimilar() {
      if (!property) return;
      try {
        const params = new URLSearchParams();
        if (property.type) params.set("type", property.type);
        params.set("limit", "3");
        const res = await fetch(`/api/properties?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setSimilar(
            (data.properties || []).filter((p: any) => p.id !== property.id)
          );
        }
      } catch {
        // silently handle
      }
    }
    if (property) fetchSimilar();
  }, [property]);

  const images: string[] = property ? JSON.parse(property.images || "[]") : [];
  const videos: string[] = property ? JSON.parse(property.videos || "[]") : [];

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorName: contactForm.senderName,
          visitorEmail: contactForm.senderEmail,
          visitorPhone: contactForm.senderPhone || undefined,
          subject: contactForm.subject,
          body: contactForm.body,
          propertyId: property.id,
          agentId: property.agent.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const token = data.conversation?.visitorToken;
        const conversationId = data.conversation?.id;
        toast.success("Message sent! The agent will reply in your inbox here.", {
          duration: 6000,
        });
        setContactForm({
          senderName: "",
          senderEmail: "",
          senderPhone: "",
          subject: "",
          body: "",
        });
        // Offer the visitor a link to view the conversation (magic token)
        if (token && conversationId) {
          const link = `/messages/${token}`;
          setTimeout(() => {
            toast(
              <div className="space-y-1">
                <p className="font-medium">Track this conversation</p>
                <a
                  href={link}
                  className="text-sm underline"
                  style={{ color: "#2E8B57" }}
                >
                  Open your inbox →
                </a>
              </div>,
              { duration: 12000 }
            );
          }, 1500);
        }
      } else {
        const e = await parseMessagingError(res);
        toast.error(e.error, { description: e.hint ?? e.message });
      }
    } catch {
      const e = networkError();
      toast.error(e.error, { description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...visitForm,
          propertyId: property.id,
          agentId: property.agent.id,
        }),
      });
      if (res.ok) {
        toast.success("Visit scheduled successfully!");
        setVisitForm({
          visitorName: "",
          visitorEmail: "",
          visitorPhone: "",
          visitDate: "",
          notes: "",
        });
      } else {
        const e = await parseMessagingError(res);
        toast.error(e.error, { description: e.hint ?? e.message });
      }
    } catch {
      const e = networkError();
      toast.error(e.error, { description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="aspect-[21/9] w-full rounded-xl mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-40 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-60 w-full" />
              <Skeleton className="h-60 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Building2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground/40" />
            <h2 className="mb-2 text-2xl font-bold">Property Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The property you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button asChild>
              <Link href="/properties">Browse Properties</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Image Gallery */}
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-muted">
          {images.length > 0 ? (
            <>
              <Image
                src={images[currentImage]}
                alt={property.title}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full"
                    onClick={() =>
                      setCurrentImage((prev) =>
                        prev === 0 ? images.length - 1 : prev - 1
                      )
                    }
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full"
                    onClick={() =>
                      setCurrentImage((prev) =>
                        prev === images.length - 1 ? 0 : prev + 1
                      )
                    }
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImage(i)}
                        className={`h-2 rounded-full transition-all ${
                          i === currentImage
                            ? "w-8 bg-white"
                            : "w-2 bg-white/60"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Building2 className="h-20 w-20 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="container mx-auto px-4 py-3">
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`relative shrink-0 h-16 w-24 rounded-md overflow-hidden border-2 transition-all ${
                    i === currentImage
                      ? "border-primary"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${property.title} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Property Details */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge>{getListingTypeLabel(property.listingType)}</Badge>
                  <Badge variant="outline">
                    {getPropertyTypeLabel(property.type)}
                  </Badge>
                  <Badge
                    variant={
                      property.status === "AVAILABLE" ? "default" : "secondary"
                    }
                  >
                    {getStatusLabel(property.status)}
                  </Badge>
                  {property.featured && (
                    <Badge className="bg-accent text-accent-foreground">
                      Featured
                    </Badge>
                  )}
                </div>
                <h1 className="mb-2 text-3xl font-bold">{property.title}</h1>
                <p className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {property.location}, {property.city}, {property.country}
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <p className="text-3xl font-bold text-primary">
                    {formatPrice(property.price, property.currency)}
                  </p>
                  {property.listingType === "RENT" && (
                    <span className="text-muted-foreground">{getPriceDurationLabel(property.priceDuration)}</span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  {property.views} views
                </div>
              </div>

              <Separator />

              {/* Key Features */}
              <div>
                <h2 className="mb-4 text-xl font-semibold">Key Features</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {property.bedrooms !== null && (
                    <div className="flex items-center gap-2 rounded-lg border p-3">
                      <Bed className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-lg font-semibold">
                          {property.bedrooms}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Bedrooms
                        </p>
                      </div>
                    </div>
                  )}
                  {property.bathrooms !== null && (
                    <div className="flex items-center gap-2 rounded-lg border p-3">
                      <Bath className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-lg font-semibold">
                          {property.bathrooms}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Bathrooms
                        </p>
                      </div>
                    </div>
                  )}
                  {property.area !== null && (
                    <div className="flex items-center gap-2 rounded-lg border p-3">
                      <Maximize className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-lg font-semibold">
                          {formatArea(property.area)}
                        </p>
                        <p className="text-xs text-muted-foreground">Area</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <Car className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-lg font-semibold">
                        {property.parking ? "Yes" : "No"}
                      </p>
                      <p className="text-xs text-muted-foreground">Parking</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <Waves className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-lg font-semibold">
                        {property.pool ? "Yes" : "No"}
                      </p>
                      <p className="text-xs text-muted-foreground">Pool</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-lg font-semibold">
                        {property.gym ? "Yes" : "No"}
                      </p>
                      <p className="text-xs text-muted-foreground">Gym</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <Sofa className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-lg font-semibold">
                        {property.furnished ? "Yes" : "No"}
                      </p>
                      <p className="text-xs text-muted-foreground">Furnished</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h2 className="mb-4 text-xl font-semibold">Description</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>

              {/* Videos */}
              {videos.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      Video Tour
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {videos.map((videoUrl, i) => (
                        <div key={i} className="rounded-xl overflow-hidden border bg-muted">
                          <video
                            src={videoUrl}
                            controls
                            preload="metadata"
                            className="w-full aspect-video object-cover"
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Contact Agent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="senderName">Full Name</Label>
                        <Input
                          id="senderName"
                          required
                          value={contactForm.senderName}
                          onChange={(e) =>
                            setContactForm((prev) => ({
                              ...prev,
                              senderName: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="senderEmail">Email</Label>
                        <Input
                          id="senderEmail"
                          type="email"
                          required
                          value={contactForm.senderEmail}
                          onChange={(e) =>
                            setContactForm((prev) => ({
                              ...prev,
                              senderEmail: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="senderPhone">Phone (Optional)</Label>
                      <Input
                        id="senderPhone"
                        value={contactForm.senderPhone}
                        onChange={(e) =>
                          setContactForm((prev) => ({
                            ...prev,
                            senderPhone: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        required
                        value={contactForm.subject}
                        onChange={(e) =>
                          setContactForm((prev) => ({
                            ...prev,
                            subject: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="body">Message</Label>
                      <Textarea
                        id="body"
                        required
                        rows={4}
                        value={contactForm.body}
                        onChange={(e) =>
                          setContactForm((prev) => ({
                            ...prev,
                            body: e.target.value,
                          }))
                        }
                        placeholder="I'm interested in this property..."
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Agent & Visit Schedule */}
            <div className="space-y-6">
              {/* Agent Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Listed By</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                      {property.agent.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="font-semibold">{property.agent.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {property.agent.company}
                      </p>
                    </div>
                  </div>
                  {property.agent.license && (
                    <p className="mb-3 text-xs text-muted-foreground">
                      License: {property.agent.license}
                    </p>
                  )}
                  {property.agent.bio && (
                    <p className="mb-4 text-sm text-muted-foreground">
                      {property.agent.bio}
                    </p>
                  )}
                  <div className="space-y-2">
                    <a
                      href={`tel:${property.agent.phone}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                    >
                      <Phone className="h-4 w-4" />
                      {property.agent.phone}
                    </a>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>Use the form below to message {property.agent.name.split(" ")[0]}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Visit Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarDays className="h-5 w-5" />
                    Schedule a Visit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleVisitSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="visitorName">Full Name</Label>
                      <Input
                        id="visitorName"
                        required
                        value={visitForm.visitorName}
                        onChange={(e) =>
                          setVisitForm((prev) => ({
                            ...prev,
                            visitorName: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="visitorEmail">Email</Label>
                      <Input
                        id="visitorEmail"
                        type="email"
                        required
                        value={visitForm.visitorEmail}
                        onChange={(e) =>
                          setVisitForm((prev) => ({
                            ...prev,
                            visitorEmail: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="visitorPhone">Phone</Label>
                      <Input
                        id="visitorPhone"
                        required
                        value={visitForm.visitorPhone}
                        onChange={(e) =>
                          setVisitForm((prev) => ({
                            ...prev,
                            visitorPhone: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="visitDate">Preferred Date & Time</Label>
                      <Input
                        id="visitDate"
                        type="datetime-local"
                        required
                        value={visitForm.visitDate}
                        onChange={(e) =>
                          setVisitForm((prev) => ({
                            ...prev,
                            visitDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        rows={3}
                        value={visitForm.notes}
                        onChange={(e) =>
                          setVisitForm((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        placeholder="Any special requests..."
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting}
                    >
                      {submitting ? "Scheduling..." : "Schedule Visit"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Similar Properties */}
          {similar.length > 0 && (
            <section className="mt-16">
              <Separator className="mb-8" />
              <h2 className="mb-6 text-2xl font-bold">Similar Properties</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map((p) => (
                  <PropertyCard key={p.id} {...p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
