"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatPrice,
  getPropertyTypeLabel,
  getStatusLabel,
  getPriceDurationLabel,
} from "@/lib/helpers";
import { PlusCircle, Search, Trash2, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Property {
  id: string;
  title: string;
  type: string;
  price: number;
  currency: string;
  status: string;
  listingType: string;
  priceDuration: string;
  views: number;
  createdAt: string;
  agent: { id: string; name: string; company: string };
}

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchProperties = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);
      // For admin, we need to show all properties regardless of status
      // but the public API filters by AVAILABLE. We'll work with what we have.

      const res = await fetch(`/api/properties?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
        setPagination(data.pagination);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(1);
  }, [statusFilter, typeFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/properties/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Property deleted successfully");
        setDeleteId(null);
        fetchProperties(pagination.page);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete property");
      }
    } catch {
      toast.error("Failed to delete property");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = properties.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.agent.name.toLowerCase().includes(search.toLowerCase()) ||
      p.agent.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">All Properties</h1>
          <p className="text-muted-foreground">
            Manage all property listings on the platform
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/properties/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Property
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, agent, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(val) => setTypeFilter(val === "ALL" ? "" : val)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="APARTMENT">Apartment</SelectItem>
                <SelectItem value="HOUSE">House</SelectItem>
                <SelectItem value="VILLA">Villa</SelectItem>
                <SelectItem value="LAND">Land</SelectItem>
                <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                <SelectItem value="OFFICE">Office</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(val) =>
                setStatusFilter(val === "ALL" ? "" : val)
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="SOLD">Sold</SelectItem>
                <SelectItem value="RENTED">Rented</SelectItem>
                <SelectItem value="RESERVED">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {property.title}
                      </TableCell>
                      <TableCell>
                        {getPropertyTypeLabel(property.type)}
                      </TableCell>
                      <TableCell>
                        {formatPrice(property.price, property.currency)}
                        {property.listingType === "RENT" && (
                          <span className="text-xs text-muted-foreground">{getPriceDurationLabel(property.priceDuration)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{property.agent.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {property.agent.company}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            property.status === "AVAILABLE"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {getStatusLabel(property.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <Eye className="h-3.5 w-3.5" />
                          {property.views}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild title="View">
                            <Link href={`/properties/${property.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild title="Edit">
                            <Link href={`/dashboard/admin/properties/edit?id=${property.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete"
                            onClick={() => setDeleteId(property.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                {search || statusFilter || typeFilter
                  ? "No properties match your filters."
                  : "No properties found."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this property? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
