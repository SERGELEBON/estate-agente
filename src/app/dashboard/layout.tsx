"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  CalendarDays,
  PlusCircle,
  Users,
  Menu,
  LogOut,
  ExternalLink,
  User,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { NotificationBell } from "@/components/notification-bell";
import { useNotifications } from "@/lib/use-notifications";

const agentNavItems = [
  {
    label: "Overview",
    href: "/dashboard/agent",
    icon: LayoutDashboard,
  },
  {
    label: "My Properties",
    href: "/dashboard/agent/properties",
    icon: Building2,
  },
  {
    label: "Messages",
    href: "/dashboard/agent/messages",
    icon: MessageSquare,
  },
  {
    label: "Visits",
    href: "/dashboard/agent/visits",
    icon: CalendarDays,
  },
  {
    label: "Add Property",
    href: "/dashboard/agent/properties/new",
    icon: PlusCircle,
  },
];

const adminNavItems = [
  {
    label: "Overview",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    label: "All Properties",
    href: "/dashboard/admin/properties",
    icon: Building2,
  },
  {
    label: "All Users",
    href: "/dashboard/admin/users",
    icon: Users,
  },
  {
    label: "Messages",
    href: "/dashboard/admin/messages",
    icon: MessageSquare,
  },
  {
    label: "Visits",
    href: "/dashboard/admin/visits",
    icon: CalendarDays,
  },
  {
    label: "Add Property",
    href: "/dashboard/admin/properties/new",
    icon: PlusCircle,
  },
];

function SidebarContent({
  navItems,
  pathname,
  user,
  onNavigate,
  unreadCount,
}: {
  navItems: typeof agentNavItems;
  pathname: string | null;
  user: any;
  onNavigate?: () => void;
  unreadCount?: number;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo - Clickable to go to Home Page */}
      <Link href="/" onClick={onNavigate} className="flex items-center gap-2 px-4 py-5 hover:bg-muted/50 rounded-md transition-colors mx-2">
        <Image
          src="/logo.png"
          alt="State-ImmoCom"
          width={32}
          height={32}
          className="h-8 w-auto"
        />
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-bold" style={{ color: "#2E8B57" }}>State-ImmoCom</span>
          <span className="text-[8px] font-semibold tracking-widest" style={{ color: "#F4C430" }}>BUY &bull; RENT &bull; INVEST</span>
        </div>
      </Link>
      <Separator />

      {/* Nav Items */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard/agent" &&
              item.href !== "/dashboard/admin" &&
              pathname?.startsWith(item.href));
          const showBadge =
            unreadCount && unreadCount > 0 && item.label === "Messages";
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span
                  className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                  style={{ backgroundColor: "#EF4444" }}
                >
                  {unreadCount! > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}

        <div className="my-2 border-t pt-2" />

        {/* Quick Links: View Site & Profile */}
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Home className="h-4 w-4" />
          View Site
        </Link>
        <Link
          href="/dashboard/profile"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/dashboard/profile"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <User className="h-4 w-4" />
          Profile
        </Link>
      </nav>

      <Separator />

      {/* User Info */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {user?.name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, role } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const redirectAttempted = useRef(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only redirect after session loading is complete
    if (isLoading) return;

    // If not authenticated after loading completes, redirect to sign-in
    // Use a ref to prevent multiple redirects
    if (!isAuthenticated) {
      if (!redirectAttempted.current) {
        redirectAttempted.current = true;
        // Use router.push for client-side navigation to avoid full page reload
        // and potential race conditions with signOut redirects
        router.push("/auth/signin");
      }
      return;
    }

    // Reset redirect flag when authenticated (e.g. after re-login)
    redirectAttempted.current = false;

    // Role-based route protection: redirect if user accesses wrong dashboard
    if (isAuthenticated && role && pathname) {
      if (role === "ADMIN" && pathname.startsWith("/dashboard/agent")) {
        router.replace("/dashboard/admin");
      } else if (role === "AGENT" && pathname.startsWith("/dashboard/admin")) {
        router.replace("/dashboard/agent");
      }
    }
  }, [isLoading, isAuthenticated, role, pathname, router]);

  // Prevent hydration mismatch - don't render until mounted on client
  if (!mounted || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/20" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (redirect will happen via useEffect)
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/20" />
          <p className="text-muted-foreground">Redirecting to sign-in...</p>
        </div>
      </div>
    );
  }

  const navItems = role === "ADMIN" ? adminNavItems : agentNavItems;

  // Shared notifications hook — drives both the bell and the sidebar unread badge
  const { unread } = useNotifications(45000);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r bg-card">
        <SidebarContent
          navItems={navItems}
          pathname={pathname}
          user={user}
          unreadCount={unread}
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent
                navItems={navItems}
                pathname={pathname}
                user={user}
                onNavigate={() => setSidebarOpen(false)}
                unreadCount={unread}
              />
            </SheetContent>
          </Sheet>

          <div className="flex-1">
            <h2 className="text-sm font-medium">
              {role === "ADMIN" ? "Admin Dashboard" : "Agent Dashboard"}
            </h2>
          </div>

          <Link href="/" target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ExternalLink className="h-3.5 w-3.5" />
              View Site
            </Button>
          </Link>

          <NotificationBell messagesHref={role === "ADMIN" ? "/dashboard/admin/messages" : "/dashboard/agent/messages"} />

          <Link href="/dashboard/profile">
            <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user?.name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
