"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { User, Mail, Phone, Building2, Shield, Save } from "lucide-react";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, userId } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/signin");
      return;
    }
    if (userId) {
      fetch(`/api/users`)
        .then((res) => res.json())
        .then((data) => {
          const me = data.users?.find((u: any) => u.id === userId);
          if (me) setProfile(me);
        })
        .catch(() => {})
        .finally(() => setLoadingProfile(false));
    }
  }, [isLoading, isAuthenticated, userId, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          company: profile.company,
          bio: profile.bio,
        }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loadingProfile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="lg:col-span-2 h-64" />
        </div>
      </div>
    );
  }

  const initials = profile?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() ?? "U";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={profile?.image ?? undefined} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-lg font-semibold">{profile?.name}</h2>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <Badge className="mt-2" variant={profile?.role === "ADMIN" ? "default" : "secondary"}>
              {profile?.role === "ADMIN" ? (
                <><Shield className="mr-1 h-3 w-3" /> Administrator</>
              ) : (
                <><Building2 className="mr-1 h-3 w-3" /> Real Estate Agent</>
              )}
            </Badge>
            {profile?.company && (
              <p className="text-sm text-muted-foreground mt-2">{profile.company}</p>
            )}
            {profile?.license && (
              <p className="text-xs text-muted-foreground mt-1">License: {profile.license}</p>
            )}
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    className="pl-9"
                    value={profile?.name ?? ""}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (read-only)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="email" className="pl-9" value={profile?.email ?? ""} readOnly disabled />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    className="pl-9"
                    value={profile?.phone ?? ""}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company / Agency</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company"
                    className="pl-9"
                    value={profile?.company ?? ""}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={profile?.bio ?? ""}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell us about yourself..."
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
