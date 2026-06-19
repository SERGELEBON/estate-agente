"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  MessageSquare,
  CalendarDays,
  PlusCircle,
  ArrowRight,
} from "lucide-react";
import { formatPrice } from "@/lib/helpers";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface Stats {
  role: string;
  overview: {
    totalProperties: number;
    totalUsers: number;
    totalMessages: number;
    totalVisits: number;
    totalPropertyValue: number;
  };
  properties: {
    available: number;
    sold: number;
    rented: number;
    reserved: number;
    featured: number;
    byType: { type: string; count: number }[];
  };
  communications: {
    unreadMessages: number;
    scheduledVisits: number;
  };
  users: {
    agents: number;
    total: number;
  };
  recent: {
    properties: {
      id: string;
      title: string;
      price: number;
      type: string;
      status: string;
      createdAt: string;
    }[];
    messages: {
      id: string;
      senderName: string;
      subject: string;
      isRead: boolean;
      createdAt: string;
    }[];
  };
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "Admin";

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
  const properties = stats?.properties;
  const communications = stats?.communications;
  const usersData = stats?.users;
  const recent = stats?.recent;

  const pieData = (properties?.byType || []).map((item) => ({
    name: item.type,
    value: item.count,
  }));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {firstName}!</h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of the State-ImmoCom platform.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Properties
                </p>
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
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-2xl font-bold">
                  {usersData?.agents ?? 0}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                <Users className="h-5 w-5 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Messages
                </p>
                <p className="text-2xl font-bold">
                  {overview?.totalMessages ?? 0}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Visits</p>
                <p className="text-2xl font-bold">
                  {overview?.totalVisits ?? 0}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                <CalendarDays className="h-5 w-5 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Properties by Type Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Properties by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No property data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Recent Messages */}
              {recent?.messages && recent.messages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                    Latest Messages
                  </h4>
                  <div className="space-y-2">
                    {recent.messages.slice(0, 3).map((msg) => (
                      <div
                        key={msg.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {msg.senderName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {msg.subject}
                          </p>
                        </div>
                        <Badge
                          variant={msg.isRead ? "secondary" : "default"}
                          className="text-xs shrink-0"
                        >
                          {msg.isRead ? "Read" : "New"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Properties */}
              {recent?.properties && recent.properties.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                    Latest Properties
                  </h4>
                  <div className="space-y-2">
                    {recent.properties.slice(0, 3).map((prop) => (
                      <div
                        key={prop.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <Building2 className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {prop.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {prop.type} · {formatPrice(prop.price)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {prop.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!recent?.messages?.length && !recent?.properties?.length) && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent activity.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button className="w-full justify-start gap-2" asChild>
              <Link href="/dashboard/admin/properties/new">
                <PlusCircle className="h-4 w-4" />
                Add Property
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link href="/dashboard/admin/users">
                <Users className="h-4 w-4" />
                View All Users
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link href="/dashboard/admin/messages">
                <MessageSquare className="h-4 w-4" />
                View All Messages
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
