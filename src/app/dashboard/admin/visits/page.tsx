"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getVisitStatusLabel } from "@/lib/helpers";
import { CalendarDays, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Visit {
  id: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  visitDate: string;
  status: string;
  notes: string | null;
  property: {
    id: string;
    title: string;
    location: string;
  };
  agent: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
}

export default function AdminVisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchVisits = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/visits?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setVisits(data.visits || []);
        setPagination(data.pagination);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits(1);
  }, [statusFilter]);

  const updateVisitStatus = async (visitId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/visits/${visitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setVisits((prev) =>
          prev.map((v) => (v.id === visitId ? { ...v, status: newStatus } : v))
        );
        toast.success(`Visit marked as ${getVisitStatusLabel(newStatus)}`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update visit");
      }
    } catch {
      toast.error("Failed to update visit status");
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "default";
      case "COMPLETED":
        return "secondary";
      case "CANCELLED":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Visits</h1>
        <p className="text-muted-foreground">
          Manage all property visits and viewings across agents
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <Select
              value={statusFilter}
              onValueChange={(val) =>
                setStatusFilter(val === "ALL" ? "" : val)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {pagination.total} visits total
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Visits Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : visits.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitor</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{visit.visitorName}</p>
                          <p className="text-xs text-muted-foreground">
                            {visit.visitorEmail}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {visit.visitorPhone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{visit.property.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {visit.property.location}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {visit.agent.name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(visit.visitDate).toLocaleDateString("en-GH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {new Date(visit.visitDate).toLocaleTimeString(
                            "en-GH",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(visit.status)}
                          className="text-xs"
                        >
                          {getVisitStatusLabel(visit.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] text-sm text-muted-foreground">
                        {visit.notes ? (
                          <span className="line-clamp-2">{visit.notes}</span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {visit.status === "SCHEDULED" && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateVisitStatus(visit.id, "COMPLETED")
                              }
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateVisitStatus(visit.id, "CANCELLED")
                              }
                              className="text-destructive hover:text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <CalendarDays className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">
                {statusFilter
                  ? "No visits match your filter."
                  : "No visits scheduled yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => fetchVisits(pagination.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchVisits(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
