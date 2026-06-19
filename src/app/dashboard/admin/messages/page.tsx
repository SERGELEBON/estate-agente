"use client";

import { Messenger } from "@/components/messenger";

export default function AdminMessagesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Chat with visitors in real time. Replies are sent instantly — no email client needed.
        </p>
      </div>
      <Messenger scope="ADMIN" />
    </div>
  );
}
