"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BadgeCheck, Lock, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ClientAuthPanel } from "@/components/chat/client-auth-panel";
import { ChatMessage, Composer, MessageList } from "@/components/chat/chat-thread";

interface Agent {
  id: string;
  name: string | null;
  image?: string | null;
  company?: string | null;
  license?: string | null;
}

interface Props {
  agent: Agent;
  propertyId?: string | null;
  propertyTitle?: string | null;
}

type Mode = "loading" | "guest" | "client" | "self";
const POLL_MS = 6000;

const pendingKey = (agentId: string, propertyId?: string | null) => `sic_chat_pending:${agentId}:${propertyId ?? "-"}`;

function initials(name?: string | null) {
  return (name ?? "A").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

/**
 * Chat with the listing agent.
 * 1st message: allowed as a guest (no account).
 * 2nd message: the visitor confirms their email (Google for Gmail, 6-digit code for any other inbox),
 * the guest thread is attached to their new client account, and the pending message is sent automatically.
 */
export function AgentChat({ agent, propertyId, propertyTitle }: Props) {
  const { data: session, status, update } = useSession();
  const me = session?.user as any;

  const [mode, setMode] = useState<Mode>("loading");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialised = useRef(false);

  const firstName = agent.name?.split(" ")[0] ?? "the agent";

  const loadThread = useCallback(async (id: string) => {
    const res = await fetch(`/api/chat/conversations/${id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setMessages(data.conversation.messages);
    }
  }, []);

  const sendAsClient = useCallback(
    async (body: string) => {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id, propertyId, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Message not sent. Please try again.");
      setConversationId(data.conversationId);
      await loadThread(data.conversationId);
    },
    [agent.id, propertyId, loadThread]
  );

  /** Signed-in flow: claim the guest thread, find the existing thread, flush any pending message. */
  const initClient = useCallback(async () => {
    setMode("client");
    setNeedsAuth(false);

    const claim = await fetch("/api/chat/claim", { method: "POST" }).then((r) => r.json()).catch(() => ({}));
    let id: string | null = claim?.conversationId ?? null;

    if (!id) {
      const list = await fetch("/api/chat/conversations", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
      const match = list?.conversations?.find(
        (c: any) => c.agentId === agent.id && (c.propertyId ?? null) === (propertyId ?? null) && !c.closed
      );
      id = match?.id ?? null;
    }
    if (id) {
      setConversationId(id);
      await loadThread(id);
    }

    let pending: string | null = null;
    try {
      pending = sessionStorage.getItem(pendingKey(agent.id, propertyId));
      sessionStorage.removeItem(pendingKey(agent.id, propertyId));
    } catch {}
    if (pending?.trim()) {
      setSending(true);
      try {
        await sendAsClient(pending);
        setDraft("");
      } catch (e: any) {
        setDraft(pending);
        setError(e.message);
      } finally {
        setSending(false);
      }
    }
  }, [agent.id, propertyId, loadThread, sendAsClient]);

  const initGuest = useCallback(async () => {
    setMode("guest");
    const data = await fetch("/api/chat/guest", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    const conv = data?.conversation;
    if (conv) {
      if (conv.agentId === agent.id && (conv.propertyId ?? null) === (propertyId ?? null)) {
        setMessages(conv.messages);
      }
      // One unverified conversation per browser: anything further needs an email.
      setNeedsAuth(true);
    }
  }, [agent.id, propertyId]);

  useEffect(() => {
    if (status === "loading" || initialised.current) return;
    initialised.current = true;
    if (status === "authenticated") {
      if (me?.id === agent.id) setMode("self");
      else initClient();
    } else {
      initGuest();
    }
  }, [status]);

  // Poll for the agent's replies while the tab is visible.
  useEffect(() => {
    if (mode !== "client" || !conversationId) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") loadThread(conversationId);
    }, POLL_MS);
    return () => clearInterval(t);
  }, [mode, conversationId, loadThread]);

  const savePending = () => {
    try {
      if (draft.trim()) sessionStorage.setItem(pendingKey(agent.id, propertyId), draft);
    } catch {}
  };

  const handleSend = async () => {
    const body = draft.trim();
    if (!body) return;
    setError(null);

    if (mode === "guest") {
      if (needsAuth) {
        savePending();
        return; // the auth panel is already visible; the draft is kept
      }
      setSending(true);
      try {
        const res = await fetch("/api/chat/guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId: agent.id, propertyId, body }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401 && data.code === "AUTH_REQUIRED") {
          savePending();
          setNeedsAuth(true);
          return;
        }
        if (!res.ok) throw new Error(data.error ?? "Message not sent. Please try again.");
        setMessages(data.conversation.messages);
        setDraft("");
        setNeedsAuth(true);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setSending(false);
      }
      return;
    }

    setSending(true);
    try {
      await sendAsClient(body);
      setDraft("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const onSignedIn = async () => {
    savePending();
    await update();
    await initClient();
  };

  const callbackUrl = typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}#chat` : "/";

  return (
    <Card id="chat" className="overflow-hidden p-0 scroll-mt-24">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-card px-4 py-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={agent.image ?? undefined} alt={agent.name ?? "Agent"} />
          <AvatarFallback className="text-white" style={{ backgroundColor: "#2E8B57" }}>
            {initials(agent.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate font-semibold">
            {agent.name}
            {agent.license && <BadgeCheck className="h-4 w-4 shrink-0" style={{ color: "#2E8B57" }} aria-label="Verified agent" />}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {agent.company ?? "Real estate agent"}
            {propertyTitle ? ` · ${propertyTitle}` : ""}
          </p>
        </div>
        {mode === "client" && (
          <Link href="/account/messages" className="text-xs font-medium hover:underline" style={{ color: "#2E8B57" }}>
            All messages
          </Link>
        )}
      </div>

      {mode === "self" ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          This is your listing. Client messages arrive in your dashboard inbox.
        </p>
      ) : (
        <>
          <MessageList
            messages={messages}
            className="h-72 bg-muted/30"
            emptyHint={
              <div className="m-auto max-w-xs text-center text-sm text-muted-foreground">
                <MessageCircle className="mx-auto mb-2 h-8 w-8 opacity-40" />
                Ask {firstName} about price, availability or a visit. You can send your first message without
                an account.
              </div>
            }
          />

          {mode === "guest" && needsAuth ? (
            <div className="border-t bg-card p-4">
              <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {messages.length > 0
                    ? `Your message was delivered to ${firstName}. Confirm your email to keep chatting and get notified of the reply.`
                    : "Confirm your email to continue the conversation you started earlier."}
                </span>
              </div>
              {draft.trim() && (
                <p className="mb-3 line-clamp-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                  Ready to send: “{draft.trim()}”
                </p>
              )}
              <ClientAuthPanel compact callbackUrl={callbackUrl} onBeforeGoogle={savePending} onSignedIn={onSignedIn} />
            </div>
          ) : null}

          {error && <p className="border-t bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>}

          <Composer
            value={draft}
            onChange={setDraft}
            onSubmit={handleSend}
            sending={sending}
            disabled={mode === "loading"}
            placeholder={mode === "guest" && needsAuth ? "Type your next message — we'll send it once you're verified" : `Message ${firstName}…`}
          />
        </>
      )}
    </Card>
  );
}
