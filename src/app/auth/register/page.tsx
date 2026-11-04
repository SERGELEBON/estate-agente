"use client";

import { SocialButtons } from "@/components/auth/social-buttons";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, EyeOff, Shield, Building2, AlertCircle, Settings } from "lucide-react";
import { toast } from "sonner";

function RegisterForm() {
  const role = "AGENT" as "AGENT" | "ADMIN"; // admin accounts are created by an admin only
  const [oauthProviders, setOauthProviders] = useState<Record<string, any>>({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    company: "",
    license: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((data) => setOauthProviders(data))
      .catch(() => {});
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name || form.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Valid email is required";
    }
    if (!form.phone) {
      newErrors.phone = "Phone number is required";
    }
    if (!form.password || form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    if (role === "AGENT") {
      if (!form.company) {
        newErrors.company = "Agency/Company name is required";
      }
      if (!form.license) {
        newErrors.license = "License number is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success("Account created successfully! Signing you in...");

        const result = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });

        if (result?.ok) {
          // Hard redirect to dashboard — the dashboard page
          // handles role-based routing (admin vs agent)
          window.location.href = "/dashboard";
        } else {
          toast.info("Account created! Please sign in with your new credentials.");
          window.location.href = "/auth/signin";
        }
      } else {
        const data = await res.json();
        if (data.error === "Email already registered") {
          setErrors({ email: "This email is already registered" });
        } else {
          toast.error(data.error || "Registration failed");
        }
      }
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  const hasGoogle = !!oauthProviders.google;
  const hasFacebook = !!oauthProviders.facebook;

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{
        background: "linear-gradient(135deg, #2E8B57 0%, #1a5c38 50%, #0f3d25 100%)",
      }}
    >
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center pb-2">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <Image
              src="/logo.png"
              alt="State-ImmoCom Logo"
              width={56}
              height={56}
              className="h-14 w-auto"
            />
            <div className="flex flex-col leading-tight text-left">
              <span
                className="text-xl font-bold tracking-tight"
                style={{ color: "#2E8B57" }}
              >
                State-ImmoCom
              </span>
              <span
                className="text-[9px] font-semibold tracking-widest"
                style={{ color: "#F4C430" }}
              >
                BUY &bull; RENT &bull; INVEST
              </span>
            </div>
          </Link>
          <CardTitle className="text-2xl">
            Create Your Account
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            This platform is for real estate professionals only.
            Clients can browse properties without an account.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder={role === "AGENT" ? "Kwame Asante" : "Admin Name"}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.name}
                </p>
              )}
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.email}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  required
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+233 20 000 0000"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Password + Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="Min 6 characters"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.password}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  placeholder="Repeat password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Agent-only fields */}
            {role === "AGENT" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Agency / Company Name</Label>
                  <Input
                    id="company"
                    required
                    value={form.company}
                    onChange={(e) => handleChange("company", e.target.value)}
                    placeholder="GoldKey Realty"
                  />
                  {errors.company && (
                    <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.company}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="license">License Number</Label>
                  <Input
                    id="license"
                    required
                    value={form.license}
                    onChange={(e) => handleChange("license", e.target.value)}
                    placeholder="GH-RL-2024-XXX"
                  />
                  {errors.license && (
                    <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.license}
                    </p>
                  )}
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full text-white hover:opacity-90"
              style={{ backgroundColor: "#2E8B57" }}
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : `Register as ${role === "ADMIN" ? "Administrator" : "Real Estate Agent"}`}
            </Button>
          </form>

          <SocialButtons
            intent="agent"
            callbackUrl="/dashboard"
            verb="Sign up with"
            header={
              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                  Or sign up with
                </span>
              </div>
            }
          />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="font-medium hover:underline"
              style={{ color: "#2E8B57" }}
            >
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div
        className="flex min-h-screen items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #2E8B57 0%, #1a5c38 50%, #0f3d25 100%)",
        }}
      >
        <div className="animate-pulse text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-white/20" />
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
