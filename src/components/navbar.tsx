"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/properties", label: "Properties" },
  { href: "/short-stay", label: "Short-Stay" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const { user, isAuthenticated, role } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dashboardPath =
    role === "ADMIN" ? "/dashboard/admin" : "/dashboard/agent";

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const getUserInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-shadow duration-200 bg-white ${
        scrolled ? "shadow-md" : "shadow-none"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/logo.png"
            alt="State-ImmoCom Logo"
            width={48}
            height={48}
            className="h-12 w-auto"
          />
          <div className="flex flex-col leading-tight">
            <span
              className="text-xl font-bold tracking-tight"
              style={{ color: "#2E8B57" }}
            >
              State-ImmoCom
            </span>
            <span
              className="text-[10px] font-semibold tracking-widest"
              style={{ color: "#F4C430" }}
            >
              BUY &bull; RENT &bull; INVEST
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2.5 rounded-md text-base font-medium transition-colors ${
                isActive(link.href)
                  ? "text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              style={
                isActive(link.href) ? { backgroundColor: "#2E8B57" } : undefined
              }
            >
              {link.label}
            </Link>
          ))}

          {isAuthenticated && (
            <Link
              href={dashboardPath}
              className={`px-4 py-2.5 rounded-md text-base font-medium transition-colors ${
                isActive("/dashboard")
                  ? "text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              style={
                isActive("/dashboard")
                  ? { backgroundColor: "#2E8B57" }
                  : undefined
              }
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <Link href={dashboardPath} className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.image ?? undefined}
                    alt={user.name ?? "User"}
                  />
                  <AvatarFallback
                    style={{ backgroundColor: "#2E8B57", color: "white" }}
                  >
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                title="Sign Out"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              asChild
              style={{ backgroundColor: "#2E8B57" }}
              className="text-white hover:opacity-90"
            >
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
          <SheetContent side="right" className="w-[300px] sm:w-[360px]">
            <SheetHeader>
              <SheetTitle>
                <div className="flex items-center gap-2">
                  <Image
                    src="/logo.png"
                    alt="State-ImmoCom"
                    width={32}
                    height={32}
                    className="h-8 w-auto"
                  />
                  <span
                    className="text-lg font-bold"
                    style={{ color: "#2E8B57" }}
                  >
                    State-ImmoCom
                  </span>
                </div>
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 px-4 pt-4">
              {navLinks.map((link) => (
                <SheetClose asChild key={link.href}>
                  <Link
                    href={link.href}
                    className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? "text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    style={
                      isActive(link.href)
                        ? { backgroundColor: "#2E8B57" }
                        : undefined
                    }
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              ))}

              {isAuthenticated && (
                <SheetClose asChild>
                  <Link
                    href={dashboardPath}
                    className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive("/dashboard")
                        ? "text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    style={
                      isActive("/dashboard")
                        ? { backgroundColor: "#2E8B57" }
                        : undefined
                    }
                  >
                    Dashboard
                  </Link>
                </SheetClose>
              )}

              <div className="my-2 border-t" />

              {isAuthenticated && user ? (
                <>
                  <Link
                    href={dashboardPath}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={user.image ?? undefined}
                        alt={user.name ?? "User"}
                      />
                      <AvatarFallback
                        style={{
                          backgroundColor: "#2E8B57",
                          color: "white",
                        }}
                      >
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {user.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Go to Dashboard
                      </span>
                    </div>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setMobileOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  asChild
                  style={{ backgroundColor: "#2E8B57" }}
                  className="w-full text-white hover:opacity-90"
                >
                  <Link href="/auth/signin" onClick={() => setMobileOpen(false)}>
                    Sign In
                  </Link>
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
