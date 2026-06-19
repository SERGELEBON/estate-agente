"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Upload,
  X,
  ImagePlus,
  Video,
  Play,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Agent {
  id: string;
  name: string;
  email: string;
  company: string | null;
}

interface PropertyFormProps {
  mode: "admin" | "agent";
  agents?: Agent[];
  agentId?: string;
  redirectPath: string;
}

interface MediaItem {
  url: string;
  type: "image" | "video";
  uploading?: boolean;
}

export default function PropertyForm({
  mode,
  agents = [],
  agentId,
  redirectPath,
}: PropertyFormProps) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    currency: "GHC",
    location: "",
    city: "Accra",
    type: "",
    listingType: "SALE",
    priceDuration: "MONTH",
    status: "AVAILABLE",
    bedrooms: "",
    bathrooms: "",
    area: "",
    furnished: false,
    parking: false,
    pool: false,
    gym: false,
    featured: false,
    selectedAgentId: "",
  });

  const [imageItems, setImageItems] = useState<MediaItem[]>([]);
  const [videoItems, setVideoItems] = useState<MediaItem[]>([]);
  const [imageUrls, setImageUrls] = useState("");
  const [videoUrls, setVideoUrls] = useState("");

  const handleChange = useCallback((field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const uploadFile = useCallback(async (file: File, type: "image" | "video") => {
    const formData = new FormData();
    formData.append("file", file);

    const setter = type === "image" ? setImageItems : setVideoItems;

    // Add placeholder
    const tempItem: MediaItem = { url: URL.createObjectURL(file), type, uploading: true };
    setter((prev) => [...prev, tempItem]);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });

      // Safely parse JSON — server may return HTML error pages (413 body too large, etc.)
      let data;
      try {
        data = await res.json();
      } catch {
        if (res.status === 413) {
          throw new Error(`File too large. Maximum size is ${type === "image" ? "10MB" : "50MB"}.`);
        }
        if (res.status === 404) {
          throw new Error("Upload endpoint not found. Please contact support.");
        }
        throw new Error(`Server error (${res.status}). Please try a smaller file.`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Replace placeholder with real URL
      setter((prev) =>
        prev.map((item, i) =>
          i === prev.length - 1 ? { url: data.url, type, uploading: false } : item
        )
      );
    } catch (err: any) {
      toast.error(err.message || `Failed to upload ${type}`);
      setter((prev) => prev.filter((_, i) => i !== prev.length - 1));
    }
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
      const files = e.target.files;
      if (!files) return;

      for (const file of Array.from(files)) {
        await uploadFile(file, type);
      }
      // Reset input
      e.target.value = "";
    },
    [uploadFile]
  );

  const removeMedia = useCallback((index: number, type: "image" | "video") => {
    const setter = type === "image" ? setImageItems : setVideoItems;
    setter((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addUrlItems = useCallback(() => {
    // Add image URLs from textarea
    if (imageUrls.trim()) {
      const urls = imageUrls
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0)
        .map((url) => ({ url, type: "image" as const }));
      setImageItems((prev) => [...prev, ...urls]);
      setImageUrls("");
    }
    // Add video URLs from textarea
    if (videoUrls.trim()) {
      const urls = videoUrls
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0)
        .map((url) => ({ url, type: "video" as const }));
      setVideoItems((prev) => [...prev, ...urls]);
      setVideoUrls("");
    }
  }, [imageUrls, videoUrls]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!form.title || !form.description || !form.price || !form.location || !form.type) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (mode === "admin" && !form.selectedAgentId && !agentId) {
        toast.error("Please assign an agent to this property");
        return;
      }

      // Check for still-uploading items
      if (imageItems.some((i) => i.uploading) || videoItems.some((v) => v.uploading)) {
        toast.error("Please wait for uploads to finish");
        return;
      }

      setLoading(true);
      try {
        const body = {
          title: form.title,
          description: form.description,
          price: parseFloat(form.price),
          currency: form.currency,
          location: form.location,
          city: form.city,
          region: "Greater Accra",
          country: "Ghana",
          type: form.type,
          listingType: form.listingType,
          priceDuration: form.priceDuration,
          status: form.status,
          bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
          bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
          area: form.area ? parseFloat(form.area) : null,
          furnished: form.furnished,
          parking: form.parking,
          pool: form.pool,
          gym: form.gym,
          images: JSON.stringify(imageItems.map((i) => i.url)),
          videos: JSON.stringify(videoItems.map((v) => v.url)),
          featured: form.featured,
          agentId: mode === "admin" ? form.selectedAgentId : agentId,
        };

        const res = await fetch("/api/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          toast.success("Property created successfully!");
          window.location.href = redirectPath;
        } else {
          const data = await res.json();
          toast.error(data.error || "Failed to create property");
        }
      } catch {
        toast.error("Failed to create property");
      } finally {
        setLoading(false);
      }
    },
    [form, mode, agentId, redirectPath, imageItems, videoItems]
  );

  const isUploading = imageItems.some((i) => i.uploading) || videoItems.some((v) => v.uploading);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={redirectPath}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Property</h1>
          <p className="text-muted-foreground">
            {mode === "admin"
              ? "Create a new property listing and assign it to an agent"
              : "Fill in the details to list a new property"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    required
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="e.g. Luxury 4-Bedroom Villa with Pool"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    required
                    rows={6}
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Describe the property in detail — features, neighborhood, nearby amenities..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (GHC) *</Label>
                    <Input
                      id="price"
                      type="number"
                      required
                      min="0"
                      value={form.price}
                      onChange={(e) => handleChange("price", e.target.value)}
                      placeholder="e.g. 2500000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      required
                      value={form.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                      placeholder="e.g. East Legon, Accra"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="type">Property Type *</Label>
                    <Select value={form.type} onValueChange={(val) => handleChange("type", val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="APARTMENT">Apartment</SelectItem>
                        <SelectItem value="HOUSE">House</SelectItem>
                        <SelectItem value="VILLA">Villa</SelectItem>
                        <SelectItem value="LAND">Land</SelectItem>
                        <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                        <SelectItem value="OFFICE">Office</SelectItem>
                        <SelectItem value="HOTEL">Hotel</SelectItem>
                        <SelectItem value="HOSTEL">Hostel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="listingType">Listing Type *</Label>
                    <Select value={form.listingType} onValueChange={(val) => handleChange("listingType", val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SALE">For Sale</SelectItem>
                        <SelectItem value="RENT">For Rent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.listingType === "RENT" && (
                    <div>
                      <Label htmlFor="priceDuration">Duration *</Label>
                      <Select value={form.priceDuration} onValueChange={(val) => handleChange("priceDuration", val)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DAY">Day</SelectItem>
                          <SelectItem value="MONTH">Month</SelectItem>
                          <SelectItem value="YEAR">Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={form.status} onValueChange={(val) => handleChange("status", val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">Available</SelectItem>
                        <SelectItem value="RESERVED">Reserved</SelectItem>
                        <SelectItem value="SOLD">Sold</SelectItem>
                        <SelectItem value="RENTED">Rented</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      min="0"
                      value={form.bedrooms}
                      onChange={(e) => handleChange("bedrooms", e.target.value)}
                      placeholder="e.g. 3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      min="0"
                      value={form.bathrooms}
                      onChange={(e) => handleChange("bathrooms", e.target.value)}
                      placeholder="e.g. 2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="area">Area (m²)</Label>
                    <Input
                      id="area"
                      type="number"
                      min="0"
                      value={form.area}
                      onChange={(e) => handleChange("area", e.target.value)}
                      placeholder="e.g. 180"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {([
                    { key: "furnished", label: "Furnished" },
                    { key: "parking", label: "Parking" },
                    { key: "pool", label: "Pool" },
                    { key: "gym", label: "Gym" },
                  ] as const).map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={form[key] as boolean}
                        onCheckedChange={(val) => handleChange(key, val)}
                      />
                      <Label htmlFor={key}>{label}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Images Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImagePlus className="h-5 w-5" />
                  Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Zone */}
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload images</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, WebP — max 10MB each
                  </p>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, "image")}
                  />
                </div>

                {/* Image Previews */}
                {imageItems.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {imageItems.map((item, i) => (
                      <div key={i} className="relative group aspect-[4/3] rounded-lg overflow-hidden border bg-muted">
                        <Image
                          src={item.url}
                          alt={`Image ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, 25vw"
                          unoptimized
                        />
                        {item.uploading && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedia(i, "image")}
                          className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* URL fallback */}
                <div>
                  <Label htmlFor="imageUrls">Or paste image URLs (one per line)</Label>
                  <Textarea
                    id="imageUrls"
                    rows={2}
                    value={imageUrls}
                    onChange={(e) => setImageUrls(e.target.value)}
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  />
                  {imageUrls.trim() && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={addUrlItems}
                    >
                      Add URLs
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Videos Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Videos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Zone */}
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Play className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload videos</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP4, WebM — max 50MB each
                  </p>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, "video")}
                  />
                </div>

                {/* Video Previews */}
                {videoItems.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {videoItems.map((item, i) => (
                      <div key={i} className="relative group rounded-lg overflow-hidden border bg-muted">
                        <video
                          src={item.url}
                          className="w-full max-h-48 object-cover rounded-lg"
                          controls
                          muted
                        />
                        {item.uploading && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedia(i, "video")}
                          className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* URL fallback */}
                <div>
                  <Label htmlFor="videoUrls">Or paste video URLs (one per line)</Label>
                  <Textarea
                    id="videoUrls"
                    rows={2}
                    value={videoUrls}
                    onChange={(e) => setVideoUrls(e.target.value)}
                    placeholder="https://example.com/video1.mp4"
                  />
                  {videoUrls.trim() && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={addUrlItems}
                    >
                      Add URLs
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assign Agent — Admin Only */}
            {mode === "admin" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assign Agent *</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={form.selectedAgentId}
                    onValueChange={(val) => handleChange("selectedAgentId", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                          {agent.company ? ` (${agent.company})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {agents.length === 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      No agents available. Please register agents first.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={form.featured}
                    onCheckedChange={(val) => handleChange("featured", val)}
                  />
                  <Label htmlFor="featured">Featured Property</Label>
                </div>
                <Button type="submit" className="w-full" disabled={loading || isUploading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : isUploading ? (
                    "Uploading files..."
                  ) : (
                    "Create Property"
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>&#8226; Use a clear, descriptive title</li>
                  <li>&#8226; Include all relevant details in the description</li>
                  <li>&#8226; Add high-quality images for better visibility</li>
                  <li>&#8226; Short videos (30-60s) showcase properties best</li>
                  <li>&#8226; Set an accurate location for searchability</li>
                  {mode === "admin" && (
                    <li>&#8226; Assign the correct agent for the listing</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
