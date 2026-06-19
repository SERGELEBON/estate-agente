"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface NotificationRecent {
  id: string;
  visitorName: string;
  subject: string;
  unreadForAgent: number;
  lastMessageAt: string;
  property: { title: string } | null;
}

export interface NotificationsData {
  unread: number;
  totalConversations: number;
  recent: NotificationRecent[];
}

/**
 * Lightweight polling hook for unread conversation notifications.
 * Polls every `interval` ms (default 45s) and only when the document is visible.
 * Uses a ref to avoid overlapping requests.
 */
export function useNotifications(intervalMs = 45000) {
  const [data, setData] = useState<NotificationsData>({
    unread: 0,
    totalConversations: 0,
    recent: [],
  });
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return;
    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/notifications", {
        signal: controller.signal,
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Silent fail — notifications are non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    intervalRef.current = setInterval(fetchNotifications, intervalMs);

    const onVisibility = () => {
      if (!document.hidden) fetchNotifications();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
      abortRef.current?.abort();
    };
  }, [fetchNotifications, intervalMs]);

  return { ...data, loading, refresh: fetchNotifications };
}
