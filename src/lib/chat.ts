import { db } from "@/lib/db";
import { newMessageEmail, sendEmail, siteUrl } from "@/lib/email";

export const MESSAGE_MAX = 5000;
/** A guest can start at most this many conversations per hour from the same IP. */
export const GUEST_CONVERSATIONS_PER_HOUR = 5;

export const agentPublicSelect = {
  id: true,
  name: true,
  image: true,
  company: true,
  phone: true,
  license: true,
} as const;

export const conversationInclude = {
  property: { select: { id: true, title: true, slug: true, images: true, price: true, location: true } },
  agent: { select: agentPublicSelect },
  messages: {
    orderBy: { createdAt: "asc" as const },
    select: { id: true, senderType: true, senderName: true, body: true, isRead: true, createdAt: true },
  },
};

/** Agents a client may contact: verified agents, or admins (platform support). */
export async function findContactableAgent(agentId: string) {
  const agent = await db.user.findUnique({
    where: { id: agentId },
    select: { id: true, name: true, email: true, role: true, agentStatus: true },
  });
  if (!agent) return null;
  if (agent.role === "ADMIN") return agent;
  if (agent.role === "AGENT" && agent.agentStatus === "ACTIVE") return agent;
  return null;
}

export async function findProperty(propertyId: string | null | undefined, agentId: string) {
  if (!propertyId) return null;
  const property = await db.property.findUnique({ where: { id: propertyId }, select: { id: true, title: true, agentId: true } });
  // A property can only be discussed with its own listing agent.
  if (!property || property.agentId !== agentId) return null;
  return property;
}

/**
 * Email the other party, but only when they had nothing unread before (first unread message),
 * so an active chat doesn't flood their inbox.
 */
export async function notifyNewMessage(opts: {
  to: string | null | undefined;
  recipientName?: string | null;
  senderName: string;
  body: string;
  propertyTitle?: string | null;
  previousUnread: number;
  audience: "agent" | "client";
}) {
  if (!opts.to || opts.previousUnread > 0) return;
  const link = opts.audience === "agent" ? `${siteUrl()}/dashboard` : `${siteUrl()}/account/messages`;
  const mail = newMessageEmail({
    recipientName: opts.recipientName,
    senderName: opts.senderName,
    preview: opts.body,
    propertyTitle: opts.propertyTitle,
    link,
  });
  await sendEmail({ to: opts.to, ...mail }).catch(() => undefined);
}
