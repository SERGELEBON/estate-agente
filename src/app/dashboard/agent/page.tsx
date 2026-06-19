"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/helpers";
import {
  Building2,
  MessageSquare,
  CalendarDays,
  Eye,
  PlusCircle,
  ArrowRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Stats {
  role: string;
  overview: {
    totalProperties: number;
    totalMessages: number;
    totalVisits: number;
    totalPropertyValue: number;
    totalViews: number;
  };
  properties: {
    available: number;
    sold: number;
    rented: number;
    featured: number;
    byType: { type: string; count: number }[];
  };
  communications: {
    unreadMessages: number;
    scheduledVisits: number;
  };
  recent: {
    messages: {
      id: string;
      senderName: string;
      subject: string;
      isRead: boolean;
      createdAt: string;
    }[];
    upcomingVisits: {
      id: string;
      visitorName: string;
      visitDate: string;
      property: { id: string; title: string };
    }[];
  };
}

// Mock chart data for views over time
const viewsChartData = [
  { month: "Jan", views: 120 },
  { month: "Feb", views: 180 },
  { month: "Mar", views: 250 },
  { month: "Apr", views: 200 },
  { month: "May", views: 320 },
  { month: "Jun", views: 280 },
  { month: "Jul", views: 390 },
  { month: "Aug", views: 450 },
  { month: "Sep", views: 380 },
  { month: "Oct", views: 420 },
  { month: "Nov", views: 500 },
  { month: "Dec", views: 470 },
];

export default function AgentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, propsRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/properties?limit=5"),
        ]);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
        if (propsRes.ok) {
          const propsData = await propsRes.json();
          setProperties(propsData.properties || []);
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "Agent";

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const overview = stats?.overview;
  const communications = stats?.communications;
  const recent = stats?.recent;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {firstName}!</h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your real estate activity.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">My Properties</p>
                <p className="text-2xl font-bold">
                  {overview?.totalProperties ?? 0}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  New Messages
                </p>
                <p className="text-2xl font-bold">
                  {communications?.unreadMessages ?? 0}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                <MessageSquare className="h-5 w-5 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Scheduled Visits
                </p>
                <p className="text-2xl font-bold">
                  {communications?.scheduledVisits ?? 0}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">
                  {overview?.totalViews ?? 0}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                <Eye className="h-5 w-5 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Property Views Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={viewsChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    className="text-xs"
                    tick={{ fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ fill: "var(--primary)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start gap-2" asChild>
              <Link href="/dashboard/agent/properties/new">
                <PlusCircle className="h-4 w-4" />
                Add New Property
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              asChild
            >
              <Link href="/dashboard/agent/properties">
                <Building2 className="h-4 w-4" />
                View My Properties
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              asChild
            >
              <Link href="/dashboard/agent/messages">
                <MessageSquare className="h-4 w-4" />
                View Messages
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              asChild
            >
              <Link href="/dashboard/agent/visits">
                <CalendarDays className="h-4 w-4" />
                View Visits
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages & Upcoming Visits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Messages</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/agent/messages">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recent?.messages && recent.messages.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.messages.slice(0, 5).map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell className="font-medium">
                        {msg.senderName}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {msg.subject}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={msg.isRead ? "secondary" : "default"}
                          className="text-xs"
                        >
                          {msg.isRead ? "Read" : "Unread"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No messages yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Upcoming Visits</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/agent/visits">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recent?.upcomingVisits && recent.upcomingVisits.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitor</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.upcomingVisits.slice(0, 5).map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell className="font-medium">
                        {visit.visitorName}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {visit.property.title}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(visit.visitDate).toLocaleDateString("en-GH", {
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No upcoming visits.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Properties Quick List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">My Properties</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/agent/properties">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {properties.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.slice(0, 5).map((prop) => (
                  <TableRow key={prop.id}>
                    <TableCell className="font-medium">{prop.title}</TableCell>
                    <TableCell>{prop.type}</TableCell>
                    <TableCell>{formatPrice(prop.price)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {prop.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No properties yet.{" "}
              <Link
                href="/dashboard/agent/properties/new"
                className="text-primary hover:underline"
              >
                Add your first property
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
