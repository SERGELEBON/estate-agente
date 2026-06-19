"use client";

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
  const [role, setRole] = useState<"AGENT" | "ADMIN">("AGENT");
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
        body: JSON.stringify({ ...form, role }),
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
            {/* Role Selection Dropdown */}
            <div>
              <Label htmlFor="role-select" className="mb-2 block">
                Account Type
              </Label>
              <Select
                value={role}
                onValueChange={(val) => {
                  setRole(val as "AGENT" | "ADMIN");
                  setErrors({});
                }}
              >
                <SelectTrigger id="role-select" className="w-full">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AGENT">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" style={{ color: "#2E8B57" }} />
                      <div>
                        <div className="font-medium">Real Estate Agent</div>
                        <div className="text-xs text-muted-foreground">
                          List and manage properties for clients
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="ADMIN">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" style={{ color: "#F4C430" }} />
                      <div>
                        <div className="font-medium">Platform Administrator</div>
                        <div className="text-xs text-muted-foreground">
                          Full access to manage the platform
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

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

          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
              Or sign up with
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block w-full" tabIndex={!hasGoogle ? 0 : undefined}>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => handleOAuthSignIn("google")}
                      disabled={!hasGoogle}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Google
                      {!hasGoogle && <span className="text-xs text-muted-foreground">(Not configured)</span>}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!hasGoogle && (
                  <TooltipContent>
                    <p>Google sign-in requires OAuth credentials.</p>
                    <p className="text-xs mt-1">Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block w-full" tabIndex={!hasFacebook ? 0 : undefined}>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => handleOAuthSignIn("facebook")}
                      disabled={!hasFacebook}
                    >
                      <svg className="h-4 w-4" fill="#1877F2" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Facebook
                      {!hasFacebook && <span className="text-xs text-muted-foreground">(Not configured)</span>}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!hasFacebook && (
                  <TooltipContent>
                    <p>Facebook sign-in requires OAuth credentials.</p>
                    <p className="text-xs mt-1">Add FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET to your .env file.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          {!hasGoogle && !hasFacebook && (
            <div className="mt-4 rounded-md bg-muted p-3 flex items-start gap-2">
              <Settings className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Social login is disabled. Add OAuth credentials to the <code className="font-mono bg-muted-foreground/10 px-1 rounded">.env</code> file to enable Google/Facebook sign-up.
              </p>
            </div>
          )}

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
