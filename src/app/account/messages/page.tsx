"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Loader2, MessageSquarePlus, Search } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage, Composer, MessageList } from "@/components/chat/chat-thread";
import { cn } from "@/lib/utils";

interface ConversationSummary {
  id: string;
  subject: string;
  unreadForVisitor: number;
  lastMessageAt: string;
  closed: boolean;
  agent: { id: string; name: string | null; image: string | null; company: string | null; license: string | null };
  property: { id: string; title: string } | null;
  messages: { body: string; senderType: string; createdAt: string }[];
}

interface DirectoryAgent {
  id: string;
  name: string | null;
  image: string | null;
  company: string | null;
  bio: string | null;
  serviceAreas: string[];
  verified: boolean;
  _count: { properties: number };
}

const initials = (n?: string | null) => (n ?? "A").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

function relative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short" });
}

export default function ClientMessagesPage() {
  const [list, setList] = useState<ConversationSummary[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const active = useMemo(() => list?.find((c) => c.id === activeId) ?? null, [list, activeId]);

  const loadList = useCallback(async () => {
    const res = await fetch("/api/chat/conversations", { cache: "no-store" });
    if (res.ok) setList((await res.json()).conversations);
  }, []);

  const loadThread = useCallback(async (id: string) => {
    const res = await fetch(`/api/chat/conversations/${id}`, { cache: "no-store" });
    if (res.ok) setThread((await res.json()).conversation.messages);
  }, []);

  useEffect(() => {
    // Attach any guest conversation started before signing in, then load the inbox.
    fetch("/api/chat/claim", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.conversationId) setActiveId(d.conversationId);
      })
      .catch(() => undefined)
      .finally(loadList);
  }, [loadList]);

  useEffect(() => {
    if (!activeId) return;
    loadThread(activeId).then(loadList);
    const t = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadThread(activeId);
        loadList();
      }
    }, 6000);
    return () => clearInterval(t);
  }, [activeId]);

  const send = async () => {
    if (!active || !draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/conversations/${active.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Message not sent");
      setDraft("");
      await loadThread(active.id);
      loadList();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">My messages</h1>
            <p className="text-sm text-muted-foreground">Your conversations with State-ImmoCom agents.</p>
          </div>
          <Button className="gap-2 text-white" style={{ backgroundColor: "#2E8B57" }} onClick={() => setPickerOpen(true)}>
            <MessageSquarePlus className="h-4 w-4" />
            <span className="hidden sm:inline">New conversation</span>
          </Button>
        </div>

        <Card className="grid flex-1 overflow-hidden p-0 md:grid-cols-[320px_1fr]" style={{ minHeight: 560 }}>
          {/* Conversation list */}
          <aside className={cn("border-r bg-card", activeId && "hidden md:block")}>
            {list === null ? (
              <div className="flex h-full items-center justify-center p-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : list.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No conversations yet.
                <br />
                <button className="mt-2 font-medium hover:underline" style={{ color: "#2E8B57" }} onClick={() => setPickerOpen(true)}>
                  Contact an agent
                </button>
              </div>
            ) : (
              <ul className="divide-y">
                {list.map((c) => {
                  const last = c.messages[0];
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => setActiveId(c.id)}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                          c.id === activeId && "bg-primary/5"
                        )}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={c.agent.image ?? undefined} />
                          <AvatarFallback className="text-white" style={{ backgroundColor: "#2E8B57" }}>
                            {initials(c.agent.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn("truncate text-sm", c.unreadForVisitor ? "font-semibold" : "font-medium")}>
                              {c.agent.name}
                            </p>
                            <span className="shrink-0 text-[11px] text-muted-foreground">{relative(c.lastMessageAt)}</span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{c.property?.title ?? c.agent.company ?? "General inquiry"}</p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <p className={cn("flex-1 truncate text-xs", c.unreadForVisitor ? "text-foreground" : "text-muted-foreground")}>
                              {last ? `${last.senderType === "VISITOR" ? "You: " : ""}${last.body}` : ""}
                            </p>
                            {c.unreadForVisitor > 0 && (
                              <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px] text-white" style={{ backgroundColor: "#2E8B57" }}>
                                {c.unreadForVisitor}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {/* Thread */}
          <section className={cn("flex min-h-0 flex-col", !activeId && "hidden md:flex")}>
            {active ? (
              <>
                <div className="flex items-center gap-3 border-b bg-card px-4 py-3">
                  <button className="md:hidden" onClick={() => setActiveId(null)} aria-label="Back">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={active.agent.image ?? undefined} />
                    <AvatarFallback className="text-white" style={{ backgroundColor: "#2E8B57" }}>
                      {initials(active.agent.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate text-sm font-semibold">
                      {active.agent.name}
                      {active.agent.license && <BadgeCheck className="h-4 w-4" style={{ color: "#2E8B57" }} />}
                    </p>
                    {active.property ? (
                      <Link href={`/properties/${active.property.id}`} className="truncate text-xs text-muted-foreground hover:underline">
                        {active.property.title}
                      </Link>
                    ) : (
                      <p className="truncate text-xs text-muted-foreground">{active.agent.company ?? "Real estate agent"}</p>
                    )}
                  </div>
                </div>
                <MessageList messages={thread} className="flex-1 bg-muted/30" />
                {error && <p className="border-t bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>}
                {active.closed ? (
                  <p className="border-t bg-card p-4 text-center text-sm text-muted-foreground">
                    This conversation was closed by the agent. Start a new one if you need more help.
                  </p>
                ) : (
                  <Composer value={draft} onChange={setDraft} onSubmit={send} sending={sending} />
                )}
              </>
            ) : (
              <div className="m-auto p-8 text-center text-sm text-muted-foreground">Select a conversation</div>
            )}
          </section>
        </Card>
      </main>

      <AgentPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onStarted={async (id) => {
          setPickerOpen(false);
          await loadList();
          setActiveId(id);
        }}
      />
    </div>
  );
}

function AgentPicker({
  open,
  onOpenChange,
  onStarted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStarted: (conversationId: string) => void;
}) {
  const [q, setQ] = useState("");
  const [agents, setAgents] = useState<DirectoryAgent[] | null>(null);
  const [selected, setSelected] = useState<DirectoryAgent | null>(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      fetch(`/api/agents${q ? `?q=${encodeURIComponent(q)}` : ""}`)
        .then((r) => r.json())
        .then((d) => setAgents(d.agents ?? []))
        .catch(() => setAgents([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q, open]);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setBody("");
      setError(null);
    }
  }, [open]);

  const start = async () => {
    if (!selected || !body.trim()) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/chat/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: selected.id, body: body.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Message not sent");
    onStarted(data.conversationId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{selected ? `Message ${selected.name}` : "Choose an agent"}</DialogTitle>
          <DialogDescription>
            {selected ? "Describe what you're looking for: area, budget, rent or buy…" : "All agents are verified by State-ImmoCom."}
          </DialogDescription>
        </DialogHeader>

        {!selected ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by name, agency or area (e.g. East Legon)" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {agents === null && <li className="py-6 text-center text-sm text-muted-foreground">Loading…</li>}
              {agents?.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No agent found.</li>}
              {agents?.map((a) => (
                <li key={a.id}>
                  <button onClick={() => setSelected(a)} className="flex w-full items-start gap-3 rounded-lg p-3 text-left hover:bg-muted">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={a.image ?? undefined} />
                      <AvatarFallback className="text-white" style={{ backgroundColor: "#2E8B57" }}>
                        {initials(a.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 text-sm font-medium">
                        {a.name}
                        {a.verified && <BadgeCheck className="h-4 w-4" style={{ color: "#2E8B57" }} />}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[a.company, `${a._count.properties} listing${a._count.properties === 1 ? "" : "s"}`].filter(Boolean).join(" · ")}
                      </p>
                      {a.serviceAreas.length > 0 && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">Covers: {a.serviceAreas.join(", ")}</p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea rows={5} maxLength={5000} autoFocus value={body} onChange={(e) => setBody(e.target.value)} placeholder={`Hello ${selected.name?.split(" ")[0] ?? ""}, I'm looking for…`} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-between gap-2">
              <Button variant="ghost" onClick={() => setSelected(null)}>
                Back
              </Button>
              <Button className="text-white" style={{ backgroundColor: "#2E8B57" }} disabled={!body.trim() || busy} onClick={start}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send message
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
