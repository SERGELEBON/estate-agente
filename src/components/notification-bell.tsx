"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/lib/use-notifications";
import { cn } from "@/lib/utils";

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GH", { month: "short", day: "numeric" });
}

export function NotificationBell({ messagesHref }: { messagesHref: string }) {
  const { unread, recent, refresh } = useNotifications(45000);
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Refresh when popover opens
  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  return (
    <div className="relative" ref={popoverRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ backgroundColor: "#EF4444" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-md border bg-popover shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unread > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {unread} new
              </Badge>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {recent.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No new notifications.
              </div>
            ) : (
              recent.map((n) => (
                <Link
                  key={n.id}
                  href={messagesHref}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block border-b last:border-b-0 px-4 py-3 hover:bg-muted/60 transition-colors"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium truncate">{n.visitorName}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatTimeAgo(n.lastMessageAt)}
                    </span>
                  </div>
                  {n.property?.title && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {n.property.title}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{n.subject}</p>
                  {n.unreadForAgent > 0 && (
                    <span
                      className="inline-flex items-center justify-center mt-1 h-4 min-w-4 rounded-full px-1 text-[10px] font-bold text-white"
                      style={{ backgroundColor: "#EF4444" }}
                    >
                      {n.unreadForAgent}
                    </span>
                  )}
                </Link>
              ))
            )}
          </div>

          <Link
            href={messagesHref}
            onClick={() => setOpen(false)}
            className="block border-t px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-muted/60 transition-colors"
          >
            View all messages →
          </Link>
        </div>
      )}
    </div>
  );
}
