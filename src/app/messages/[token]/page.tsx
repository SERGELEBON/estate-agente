"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, Building2, Lock } from "lucide-react";
import { toast } from "sonner";
import { parseMessagingError, networkError } from "@/lib/messaging-errors";

interface Message {
  id: string;
  senderType: "VISITOR" | "AGENT" | "ADMIN";
  senderName: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  id: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string | null;
  subject: string;
  closed: boolean;
  lastMessageAt: string;
  createdAt: string;
  property: { id: string; title: string; slug: string; images: string; price: number; location: string } | null;
  agent: { id: string; name: string; email: string; phone: string | null; image: string | null; company: string | null };
  messages: Message[];
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

export default function VisitorConversationPage() {
  const params = useParams();
  const token = params.token as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<{ title: string; message: string; hint?: string } | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  // Track whether we've already done the initial load. After that, transient
  // errors surface as toasts instead of taking over the whole screen.
  const initialLoadRef = useRef(true);

  const fetchConversation = useCallback(async () => {
    const isInitial = initialLoadRef.current;
    try {
      const res = await fetch(`/api/conversations/visitor?token=${encodeURIComponent(token)}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        setConversation(data.conversation);
        setLoadError(null);
      } else if (res.status === 404 || res.status === 400) {
        // Invalid/expired/deleted token — show the friendly error screen
        // (both on initial load and if the token is invalidated mid-session)
        const e = await parseMessagingError(res);
        setLoadError({ title: e.error, message: e.message, hint: e.hint });
        setConversation(null);
      } else {
        // Transient server error — toast on polls, full screen on initial load
        const e = await parseMessagingError(res);
        if (isInitial) {
          setLoadError({ title: e.error, message: e.message, hint: e.hint });
        } else {
          toast.error(e.error, { description: e.hint ?? e.message });
        }
      }
    } catch {
      const e = networkError();
      if (isInitial) {
        setLoadError({ title: e.error, message: e.message, hint: e.hint });
      } else {
        toast.error(e.error, { description: e.message });
      }
    } finally {
      initialLoadRef.current = false;
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConversation();
    const interval = setInterval(fetchConversation, 15000);
    return () => clearInterval(interval);
  }, [fetchConversation]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [conversation?.messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversation || !reply.trim() || sending) return;
    const trimmed = reply.trim();
    setSending(true);

    // Optimistic UI
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      senderType: "VISITOR",
      senderName: conversation.visitorName,
      body: trimmed,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setConversation((prev) =>
      prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev
    );
    setReply("");

    try {
      const res = await fetch(`/api/conversations/visitor/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, body: trimmed }),
      });
      if (!res.ok) {
        const e = await parseMessagingError(res);
        toast.error(e.error, { description: e.hint ?? e.message });
        setConversation((prev) =>
          prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimistic.id) } : prev
        );
        setReply(trimmed);

        // If the conversation was closed server-side, refresh so the UI reflects it
        if (res.status === 400 && e.code === "CONVERSATION_CLOSED") {
          fetchConversation();
        }
      } else {
        fetchConversation();
      }
    } catch {
      const e = networkError();
      toast.error(e.error, { description: e.message });
      setConversation((prev) =>
        prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimistic.id) } : prev
      );
      setReply(trimmed);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-80 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <h2 className="mb-2 text-2xl font-bold">
              {loadError?.title ?? "Conversation not found"}
            </h2>
            <p className="text-muted-foreground mb-2">
              {loadError?.message ??
                "This conversation link is invalid or has expired. Please send a new message from the property page."}
            </p>
            {loadError?.hint && (
              <p className="text-sm text-muted-foreground/80 mb-4 italic">
                {loadError.hint}
              </p>
            )}
            <Button asChild>
              <Link href="/properties">Browse Properties</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const propertyImage = conversation.property ? getFirstImage(conversation.property.images) : "";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-12 w-12">
            {conversation.agent.image ? (
              <Image src={conversation.agent.image} alt={conversation.agent.name} fill sizes="48px" className="object-cover" />
            ) : (
              <AvatarFallback style={{ backgroundColor: "#2E8B57", color: "white" }}>
                {getInitials(conversation.agent.name)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold">{conversation.agent.name}</h1>
            <p className="text-xs text-muted-foreground">
              {conversation.agent.company ?? "Real Estate Agent"}
            </p>
          </div>
          {conversation.closed ? (
            <Badge variant="secondary">Closed</Badge>
          ) : (
            <Badge variant="outline" style={{ color: "#2E8B57", borderColor: "#2E8B57" }}>
              Active
            </Badge>
          )}
        </div>

        {/* Property context */}
        {conversation.property && (
          <Link
            href={`/properties/${conversation.property.id}`}
            className="block border rounded-lg overflow-hidden mb-4 hover:shadow-md transition-shadow"
          >
            <div className="flex gap-3 p-3">
              <div className="relative h-16 w-16 shrink-0 rounded-md overflow-hidden bg-muted">
                {propertyImage && (
                  <Image src={propertyImage} alt={conversation.property.title} fill sizes="64px" className="object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Property
                </p>
                <p className="text-sm font-semibold truncate">{conversation.property.title}</p>
                <p className="text-xs text-muted-foreground truncate">{conversation.property.location}</p>
              </div>
            </div>
          </Link>
        )}

        {/* Conversation card */}
        <div className="border rounded-lg bg-card overflow-hidden flex flex-col" style={{ height: "calc(100vh - 360px)", minHeight: "400px" }}>
          {/* Subject line */}
          <div className="border-b px-4 py-2.5">
            <p className="text-xs text-muted-foreground">Subject</p>
            <p className="text-sm font-medium truncate">{conversation.subject}</p>
          </div>

          {/* Messages */}
          <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
            <p className="text-center text-[11px] text-muted-foreground">
              {formatTime(conversation.createdAt)} — Conversation started
            </p>
            {conversation.messages.map((m) => {
              const isMe = m.senderType === "VISITOR";
              return (
                <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                      isMe
                        ? "text-white rounded-br-md"
                        : "bg-white border rounded-bl-md"
                    }`}
                    style={isMe ? { backgroundColor: "#F4C430", color: "#1a1a1a" } : undefined}
                  >
                    {!isMe && (
                      <p className="text-[10px] font-semibold mb-0.5" style={{ color: "#2E8B57" }}>
                        {m.senderName}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? "text-black/50" : "text-muted-foreground"}`}>
                      {formatTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            {conversation.messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground mt-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No messages yet. Say hello!
              </div>
            )}
          </div>

          {/* Reply input */}
          <form onSubmit={handleSend} className="border-t p-3 flex items-center gap-2">
            <Input
              placeholder={conversation.closed ? "Conversation is closed" : "Type your message..."}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              disabled={conversation.closed || sending}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={conversation.closed || sending || !reply.trim()}
              style={{ backgroundColor: "#2E8B57" }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-3">
          🔒 Keep this link safe — anyone with it can view this conversation.
          <br />
          Bookmark it to check for replies from {conversation.agent.name}.
        </p>
      </main>
      <Footer />
    </div>
  );
}
