"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Send, MessageSquare, Building2, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseMessagingError, networkError } from "@/lib/messaging-errors";

interface ConversationMessage {
  id: string;
  senderType: "VISITOR" | "AGENT" | "ADMIN";
  senderUserId: string | null;
  senderName: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface ConversationSummary {
  id: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string | null;
  subject: string;
  unreadForAgent: number;
  unreadForVisitor: number;
  closed: boolean;
  lastMessageAt: string;
  createdAt: string;
  property: { id: string; title: string; slug: string; images: string } | null;
  agent: { id: string; name: string; email: string };
  messages: { id: string; body: string; senderType: string; createdAt: string }[];
  _count: { messages: number };
}

interface ConversationDetail extends ConversationSummary {
  messages: ConversationMessage[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-GH", { month: "short", day: "numeric" });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-GH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getFirstImage(imagesJson: string): string {
  try {
    const arr = JSON.parse(imagesJson);
    if (Array.isArray(arr) && arr.length > 0) return arr[0];
  } catch {
    // ignore
  }
  return "";
}

interface MessengerProps {
  /** For admin viewing all conversations, pass "ADMIN"; otherwise the agent's id is inferred from session. */
  scope: "AGENT" | "ADMIN";
}

export function Messenger({ scope }: MessengerProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [active, setActive] = useState<ConversationDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "open" | "closed">("all");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);

  const threadRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch conversation list
  const fetchList = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("filter", filter);
      params.set("limit", "100");
      const res = await fetch(`/api/conversations?${params.toString()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoadingList(false);
    }
  }, [filter]);

  // Fetch active conversation thread
  const fetchThread = useCallback(async (id: string) => {
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        setActive(data.conversation);
      } else if (res.status !== 404 && res.status !== 403) {
        // Only show toast for unexpected errors (404/403 handled by UI state)
        const e = await parseMessagingError(res);
        toast.error(e.error, { description: e.hint ?? e.message });
      }
    } catch {
      const e = networkError();
      toast.error(e.error, { description: e.message });
    } finally {
      setLoadingThread(false);
    }
  }, []);

  // Initial load + poll for new conversations every 45s
  useEffect(() => {
    fetchList();
    pollRef.current = setInterval(fetchList, 45000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchList]);

  // Poll active conversation thread every 15s for new messages
  useEffect(() => {
    if (!activeId) return;
    fetchThread(activeId);
    const interval = setInterval(() => fetchThread(activeId), 15000);
    return () => clearInterval(interval);
  }, [activeId, fetchThread]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [active?.messages.length]);

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.visitorName.toLowerCase().includes(q) ||
        c.visitorEmail.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.property?.title.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const handleSelect = (id: string) => {
    setActiveId(id);
    setMobileThreadOpen(true);
    // Optimistically clear unread badge for that conversation
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadForAgent: 0 } : c))
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId || !reply.trim() || sending) return;
    const trimmed = reply.trim();
    setSending(true);

    // Optimistic UI: append message immediately
    const optimisticMsg: ConversationMessage = {
      id: `temp-${Date.now()}`,
      senderType: scope,
      senderUserId: "me",
      senderName: "You",
      body: trimmed,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setActive((prev) =>
      prev ? { ...prev, messages: [...prev.messages, optimisticMsg] } : prev
    );
    setReply("");

    try {
      const res = await fetch(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      if (!res.ok) {
        const e = await parseMessagingError(res);
        toast.error(e.error, { description: e.hint ?? e.message });
        // Roll back optimistic message and restore the user's draft so they can fix it
        setActive((prev) =>
          prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimisticMsg.id) } : prev
        );
        setReply(trimmed);
      } else {
        // Refetch the thread to get the server-persisted message + updated status
        fetchThread(activeId);
      }
    } catch {
      const e = networkError();
      toast.error(e.error, { description: e.message });
      setActive((prev) =>
        prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimisticMsg.id) } : prev
      );
      setReply(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleCloseToggle = async () => {
    if (!active) return;
    const nextClosed = !active.closed;
    try {
      const res = await fetch(`/api/conversations/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closed: nextClosed }),
      });
      if (res.ok) {
        setActive((prev) => (prev ? { ...prev, closed: nextClosed } : prev));
        setConversations((prev) =>
          prev.map((c) => (c.id === active.id ? { ...c, closed: nextClosed } : c))
        );
        toast.success(nextClosed ? "Conversation closed" : "Conversation reopened");
      } else {
        const e = await parseMessagingError(res);
        toast.error(e.error, { description: e.hint ?? e.message });
      }
    } catch {
      const e = networkError();
      toast.error(e.error, { description: e.message });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-12rem)] min-h-[500px]">
      {/* Conversation list */}
      <div
        className={cn(
          "border rounded-lg bg-card flex flex-col overflow-hidden",
          mobileThreadOpen && "hidden md:flex"
        )}
      >
        <div className="p-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex gap-1 text-xs">
            {(["all", "unread", "open", "closed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-2 py-1 rounded-md font-medium capitalize transition-colors",
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loadingList ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No conversations yet.
            </div>
          ) : (
            <ul className="divide-y">
              {filteredConversations.map((c) => {
                const isActive = c.id === activeId;
                const lastMsg = c.messages[0];
                const img = c.property ? getFirstImage(c.property.images) : "";
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => handleSelect(c.id)}
                      className={cn(
                        "w-full text-left px-3 py-3 hover:bg-muted/50 transition-colors flex gap-3",
                        isActive && "bg-primary/5",
                        c.unreadForAgent > 0 && "font-semibold"
                      )}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        {img ? (
                          <Image
                            src={img}
                            alt={c.property?.title ?? ""}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <AvatarFallback className="text-xs" style={{ backgroundColor: "#F4C430", color: "#1a1a1a" }}>
                            {getInitials(c.visitorName)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm truncate">{c.visitorName}</p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {timeAgo(c.lastMessageAt)}
                          </span>
                        </div>
                        {c.property && (
                          <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {c.property.title}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {lastMsg ? lastMsg.body : c.subject}
                        </p>
                      </div>
                      {c.unreadForAgent > 0 && (
                        <span
                          className="shrink-0 self-center flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                          style={{ backgroundColor: "#EF4444" }}
                        >
                          {c.unreadForAgent}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </div>

      {/* Thread view */}
      <div
        className={cn(
          "border rounded-lg bg-card flex flex-col overflow-hidden",
          !mobileThreadOpen && "hidden md:flex"
        )}
      >
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Select a conversation to start chatting.
              </p>
            </div>
          </div>
        ) : loadingThread ? (
          <div className="flex-1 p-4 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="border-b p-3 flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8"
                onClick={() => setMobileThreadOpen(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-xs" style={{ backgroundColor: "#2E8B57", color: "white" }}>
                  {getInitials(active.visitorName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{active.visitorName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {active.visitorEmail}
                  {active.visitorPhone ? ` · ${active.visitorPhone}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {active.closed ? (
                  <Badge variant="secondary" className="text-[10px]">Closed</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]" style={{ color: "#2E8B57", borderColor: "#2E8B57" }}>
                    Active
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={handleCloseToggle} className="text-xs h-8">
                  {active.closed ? "Reopen" : "Close"}
                </Button>
              </div>
            </div>

            {/* Property context bar */}
            {active.property && (
              <Link
                href={`/properties/${active.property.id}`}
                target="_blank"
                className="border-b px-3 py-2 flex items-center gap-2 text-xs hover:bg-muted/50 transition-colors"
              >
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Re:</span>
                <span className="font-medium truncate">{active.property.title}</span>
              </Link>
            )}

            {/* Messages */}
            <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
              <p className="text-center text-[11px] text-muted-foreground">
                {formatTime(active.createdAt)} — Conversation started
              </p>
              {active.messages.map((m) => {
                const isMe = m.senderType === "AGENT" || m.senderType === "ADMIN";
                return (
                  <div
                    key={m.id}
                    className={cn("flex", isMe ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                        isMe
                          ? "text-white rounded-br-md"
                          : "bg-white border rounded-bl-md"
                      )}
                      style={isMe ? { backgroundColor: "#2E8B57" } : undefined}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p
                        className={cn(
                          "text-[10px] mt-1 flex items-center gap-1",
                          isMe ? "text-white/70" : "text-muted-foreground"
                        )}
                      >
                        {formatTime(m.createdAt)}
                        {isMe && m.isRead && <Check className="h-3 w-3" />}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply input */}
            <form onSubmit={handleSend} className="border-t p-3 flex items-center gap-2">
              <Input
                placeholder={active.closed ? "Conversation is closed" : "Type your reply..."}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                disabled={active.closed || sending}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={active.closed || sending || !reply.trim()}
                style={{ backgroundColor: "#2E8B57" }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
