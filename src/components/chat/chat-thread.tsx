"use client";

import { useEffect, useRef } from "react";
import { CheckCheck, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  senderType: "VISITOR" | "AGENT" | "ADMIN" | string;
  senderName?: string;
  body: string;
  isRead?: boolean;
  createdAt: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { day: "numeric", month: "short" }) +
        " · " +
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageList({
  messages,
  emptyHint,
  className,
}: {
  messages: ChatMessage[];
  emptyHint?: React.ReactNode;
  className?: string;
}) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <div className={cn("flex flex-col gap-2 overflow-y-auto px-4 py-4", className)} aria-live="polite">
      {messages.length === 0 && emptyHint}
      {messages.map((m) => {
        const mine = m.senderType === "VISITOR";
        return (
          <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[82%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
                mine ? "rounded-br-md text-white" : "rounded-bl-md bg-white border text-foreground"
              )}
              style={mine ? { backgroundColor: "#2E8B57" } : undefined}
            >
              <p className="whitespace-pre-line break-words">{m.body}</p>
              <p className={cn("mt-1 flex items-center justify-end gap-1 text-[10px]", mine ? "text-white/75" : "text-muted-foreground")}>
                {formatTime(m.createdAt)}
                {!mine && m.senderType === "ADMIN" && <span>· State-ImmoCom</span>}
                {mine && m.isRead && <CheckCheck className="h-3 w-3" aria-label="Read" />}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={end} />
    </div>
  );
}

export function Composer({
  value,
  onChange,
  onSubmit,
  sending,
  placeholder = "Write a message…",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  sending?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <form
      className="flex items-end gap-2 border-t bg-card p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim() && !sending) onSubmit();
      }}
    >
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={1}
        maxLength={5000}
        disabled={disabled}
        className="min-h-[44px] max-h-36 resize-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() && !sending) onSubmit();
          }
        }}
        aria-label="Message"
      />
      <Button
        type="submit"
        size="icon"
        className="h-11 w-11 shrink-0 text-white"
        style={{ backgroundColor: "#2E8B57" }}
        disabled={!value.trim() || sending || disabled}
        aria-label="Send message"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </form>
  );
}
